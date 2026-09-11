import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join, dirname, basename, extname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import { ScriptSchema, type Script } from "./render/script-schema.js";
import { loadConfig } from "./config.js";
import { createTtsClient } from "./tts/tts-client.js";
import { fetchImage } from "./assets/image-fetcher.js";
import { getDurationSec, concatWithSilence, mixSfxOntoVoice, type SfxMixSpec } from "./assets/audio-tools.js";
import { indexSfxLibrary, pickSfxForScene, defaultPlayback } from "./assets/sfx-selector.js";
import { existsSync } from "node:fs";
import { composeHtml } from "./render/html-composer.js";
import { renderWithHyperframes } from "./render/hyperframes-runner.js";
import { log } from "./utils/logger.js";

const TOTAL_STEPS = 8;
const SCENE_GAP_SEC = 0.3;
const LEGACY_DURATION_MIN_SEC = 48;
const LEGACY_DURATION_MAX_SEC = 72;
const PRODUCT_DURATION_MIN_SEC = 20;
const PRODUCT_DURATION_MAX_SEC = 45;

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "render", "templates");
const SFX_DIR = join(__dirname, "..", "assets", "sfx");

const HYPERFRAMES_CONFIG = {
  $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
  registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
  paths: {
    blocks: "compositions",
    components: "compositions/components",
    assets: "assets",
  },
};

export async function runPipeline(scriptPath: string): Promise<void> {
  const cfg = loadConfig();
  const outputDir = dirname(scriptPath);
  log.info(`Output directory: ${outputDir}`);

  log.step(1, TOTAL_STEPS, `Load env + validate script.json (TTS provider: ${cfg.ttsProvider})`);
  const raw = JSON.parse(await readFile(scriptPath, "utf8"));
  if (raw.voice?.voiceId === "${VIETNAMESE_VOICEID}" || raw.voice?.voiceId === "${VOICE_ID}") {
    raw.voice.voiceId =
      cfg.ttsProvider === "edge-tts" ? cfg.edgeTtsVoice
      : cfg.ttsProvider === "lucylab" ? cfg.lucylabVoiceId!
      : cfg.ttsProvider === "elevenlabs" ? cfg.elevenlabsVoiceId!
      : cfg.vbeeVoiceCode;
  }
  const script: Script = ScriptSchema.parse(raw);
  const productMode = script.scenes.some((scene) =>
    scene.templateData.template === "screen-demo" ||
    scene.templateData.template === "text" ||
    scene.templateData.template === "product-outro"
  );
  const sceneMediaRelPaths = await prepareSceneMedia(script, scriptPath, outputDir);

  log.step(2, TOTAL_STEPS, "Write script.txt");
  const fullText = script.scenes.map((s) => s.voiceText).join("\n\n");
  await writeFile(join(outputDir, "script.txt"), fullText);

  log.step(3, TOTAL_STEPS, "Prepare optional source image + Step 4 TTS");
  const imgPath = join(outputDir, "images", "bg.jpg");
  const imgPromise = fetchImage(script.metadata.source?.image ?? null, imgPath);

  const ttsClient = createTtsClient(cfg);
  const limit = pLimit(cfg.ttsConcurrency);
  const voiceDir = join(outputDir, "voice");
  await mkdir(voiceDir, { recursive: true });

  const sceneAudioPromises = script.scenes.map((scene) =>
    limit(async () => {
      const out = join(voiceDir, `scene-${scene.id}.mp3`);
      const srtOut = join(voiceDir, `scene-${scene.id}.srt`);

      if (existsSync(out)) {
        const dur = await getDurationSec(out);
        log.info(`  scene ${scene.id}: REUSE existing mp3 (${dur.toFixed(2)}s) - delete to force re-TTS`);
        return { id: scene.id, path: out, durationSec: dur };
      }

      log.info(`  TTS scene ${scene.id} (${scene.voiceText.length} chars)...`);
      await ttsClient.generate(scene.voiceText, out, srtOut);
      const dur = await getDurationSec(out);
      log.info(`  scene ${scene.id}: ${dur.toFixed(2)}s`);
      return { id: scene.id, path: out, durationSec: dur };
    }),
  );

  const [imgResult, sceneAudio] = await Promise.all([
    imgPromise,
    Promise.all(sceneAudioPromises),
  ]);

  let bgImageRelPath: string | null = null;
  if (imgResult.success) {
    bgImageRelPath = "images/bg.jpg";
  } else if (!productMode && script.metadata.source?.image) {
    log.warn(`Background image fetch failed: ${imgResult.reason} -> using gradient fallback`);
  }

  log.step(5, TOTAL_STEPS, productMode ? "Concat voice scenes" : "Concat voice scenes + mix SFX layer");
  const voiceRawMp3 = join(outputDir, "voice-raw.mp3");
  const voiceMp3 = join(outputDir, "voice.mp3");
  await concatWithSilence(sceneAudio.map((a) => a.path), SCENE_GAP_SEC, voiceRawMp3);

  let cursor = 0;
  const sceneStarts: Record<string, number> = {};
  for (const a of sceneAudio) {
    sceneStarts[a.id] = cursor;
    cursor += a.durationSec + SCENE_GAP_SEC;
  }

  const sfxIndex = indexSfxLibrary(SFX_DIR);
  const sfxList: SfxMixSpec[] = [];
  for (const scene of script.scenes) {
    const startSec = sceneStarts[scene.id];

    if (scene.sfx) {
      if (scene.sfx.name === "none") continue;
      const sfxPath = join(SFX_DIR, `${scene.sfx.name}.mp3`);
      if (existsSync(sfxPath)) {
        sfxList.push({ path: sfxPath, startSec: startSec + scene.sfx.startOffsetSec, volume: scene.sfx.volume });
        log.info(`  scene ${scene.id}: SFX override -> ${scene.sfx.name}.mp3`);
      } else {
        log.warn(`  scene ${scene.id}: explicit SFX not found, skipping: ${scene.sfx.name}.mp3`);
      }
      continue;
    }

    // Product videos should sound clean by default. Add SFX only when explicitly requested.
    if (productMode) continue;

    const picked = pickSfxForScene({
      voiceText: scene.voiceText,
      templateName: scene.templateData.template,
      sceneId: scene.id,
      index: sfxIndex,
    });
    if (!picked) continue;

    const sfxPath = join(SFX_DIR, picked.relPath);
    const playback = defaultPlayback(picked);
    sfxList.push({ path: sfxPath, startSec: startSec + playback.offsetSec, volume: playback.volume });

    const why = picked.source === "semantic"
      ? `semantic match "${picked.matchedKeyword}"`
      : picked.source;
    log.info(`  scene ${scene.id}: SFX -> ${picked.relPath} (${why})`);
  }

  await mixSfxOntoVoice(voiceRawMp3, sfxList, voiceMp3);

  const totalAudioSec = await getDurationSec(voiceMp3);
  log.info(`  voice.mp3 total: ${totalAudioSec.toFixed(2)}s`);
  const durationMin = productMode ? PRODUCT_DURATION_MIN_SEC : LEGACY_DURATION_MIN_SEC;
  const durationMax = productMode ? PRODUCT_DURATION_MAX_SEC : LEGACY_DURATION_MAX_SEC;
  if (totalAudioSec < durationMin || totalAudioSec > durationMax) {
    log.warn(`Total duration ${totalAudioSec.toFixed(1)}s outside [${durationMin}, ${durationMax}]s target - proceeding anyway`);
  }

  log.step(6, TOTAL_STEPS, "Compose HTML + project files");

  let ttAvatarFile: string | undefined;
  if (!productMode) {
    const findBundledAvatar = (): string => {
      const baseDir = join(__dirname, "..", "assets");
      for (const ext of ["jpg", "jpeg", "png", "webp"]) {
        const p = join(baseDir, `avatar.${ext}`);
        if (existsSync(p)) return p;
      }
      throw new Error(`No bundled avatar found. Place an image at assets/avatar.{jpg,png,webp}`);
    };
    const bundledAvatar = findBundledAvatar();
    const ttAvatarExt = bundledAvatar.split(".").pop()!.toLowerCase();
    ttAvatarFile = `tiktok-avatar.${ttAvatarExt}`;
    const ttAvatarOut = join(outputDir, ttAvatarFile);
    if (cfg.tiktok.avatarUrl) {
      const r = await fetchImage(cfg.tiktok.avatarUrl, ttAvatarOut);
      if (!r.success) {
        log.warn(`TikTok avatar download failed: ${r.reason} -> falling back to bundled default`);
        await copyFile(bundledAvatar, ttAvatarOut);
      }
    } else {
      await copyFile(bundledAvatar, ttAvatarOut);
    }
  }

  const outroHoldSec = productMode ? 1 : 3;
  const html = composeHtml({
    script,
    sceneAudio: sceneAudio.map((a) => ({ id: a.id, durationSec: a.durationSec })),
    gapSec: SCENE_GAP_SEC,
    bgImageRelPath,
    audioRelPath: "voice.mp3",
    sceneMediaRelPaths,
    productMode,
    tiktok: cfg.tiktok,
    tiktokAvatarRelPath: ttAvatarFile,
    outroHoldSec,
  });

  await writeFile(join(outputDir, "index.html"), html);
  await writeFile(join(outputDir, "hyperframes.json"), JSON.stringify(HYPERFRAMES_CONFIG, null, 2));

  const slug = basename(outputDir);
  await writeFile(join(outputDir, "meta.json"), JSON.stringify({
    id: slug,
    name: script.metadata.title,
    createdAt: new Date().toISOString(),
  }, null, 2));

  const themeFile = productMode
    ? "styles.product.css"
    : cfg.videoTheme === "light-pro"
      ? "styles.light-pro.css"
      : "styles.css";
  const animationFile = productMode ? "animations.product.js" : "animations.js";
  await copyFile(join(TPL_DIR, themeFile), join(outputDir, "styles.css"));
  await copyFile(join(TPL_DIR, animationFile), join(outputDir, "animations.js"));

  log.step(7, TOTAL_STEPS, "Render with hyperframes");
  const videoPath = join(outputDir, "video.mp4");
  await renderWithHyperframes({ compositionDir: outputDir, outputPath: videoPath });

  log.step(8, TOTAL_STEPS, "Done");
  console.log("\n=== Result ===");
  console.log(`Video:  ${videoPath}`);
  console.log(`Audio:  ${voiceMp3}`);
  console.log(`Script: ${join(outputDir, "script.txt")}`);
  console.log(`Tong thoi luong: ${totalAudioSec.toFixed(2)}s`);
}

async function prepareSceneMedia(
  script: Script,
  scriptPath: string,
  outputDir: string,
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const mediaDir = join(outputDir, "media");
  let createdMediaDir = false;

  for (const scene of script.scenes) {
    const td = scene.templateData;
    if (td.template !== "screen-demo") continue;

    const candidates = isAbsolute(td.src)
      ? [td.src]
      : [resolve(dirname(scriptPath), td.src), resolve(process.cwd(), td.src)];
    const sourcePath = candidates.find((p) => existsSync(p));
    if (!sourcePath) {
      throw new Error(`screen-demo media not found for scene "${scene.id}": ${td.src}`);
    }

    const ext = extname(sourcePath).toLowerCase();
    const allowed = td.mediaType === "video"
      ? new Set([".mp4", ".webm"])
      : new Set([".png", ".jpg", ".jpeg", ".webp"]);
    if (!allowed.has(ext)) {
      throw new Error(`Unsupported ${td.mediaType} file for scene "${scene.id}": ${ext || "no extension"}`);
    }

    if (!createdMediaDir) {
      await mkdir(mediaDir, { recursive: true });
      createdMediaDir = true;
    }

    const safeId = scene.id.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const fileName = `${safeId}${ext}`;
    const destPath = join(mediaDir, fileName);
    if (resolve(sourcePath) !== resolve(destPath)) {
      await copyFile(sourcePath, destPath);
    }
    result[scene.id] = `media/${fileName}`;
  }

  return result;
}
