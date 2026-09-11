// Re-render an existing composition without re-running TTS.
// Usage: npx tsx rerender.ts <outputDir>

import { readFile, writeFile, copyFile } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { ScriptSchema, type Script } from "./src/render/script-schema.js";
import { loadConfig } from "./src/config.js";
import { getDurationSec, concatWithSilence, mixSfxOntoVoice, type SfxMixSpec } from "./src/assets/audio-tools.js";
import { indexSfxLibrary, pickSfxForScene, defaultPlayback } from "./src/assets/sfx-selector.js";
import { existsSync } from "node:fs";
import { composeHtml } from "./src/render/html-composer.js";
import { renderWithHyperframes } from "./src/render/hyperframes-runner.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "src", "render", "templates");
const SFX_DIR = join(__dirname, "assets", "sfx");
const SCENE_GAP_SEC = 0.3;

const HYPERFRAMES_CONFIG = {
  $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
  registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
  paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
};

async function main() {
  const outputDir = process.argv[2];
  if (!outputDir) {
    console.error("Usage: npx tsx rerender.ts <outputDir>");
    process.exit(2);
  }

  const cfg = loadConfig();
  console.log(`Re-rendering: ${outputDir}`);

  const raw = JSON.parse(await readFile(join(outputDir, "script.json"), "utf8"));
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
  const sceneMediaRelPaths = findPreparedSceneMedia(script, outputDir);

  const sceneAudio = await Promise.all(
    script.scenes.map(async (s) => {
      const path = join(outputDir, "voice", `scene-${s.id}.mp3`);
      const dur = await getDurationSec(path);
      console.log(`  scene ${s.id}: ${dur.toFixed(2)}s`);
      return { id: s.id, path, durationSec: dur };
    })
  );

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
      }
      continue;
    }
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
  }
  await mixSfxOntoVoice(voiceRawMp3, sfxList, voiceMp3);

  const totalDur = await getDurationSec(voiceMp3);
  console.log(`voice.mp3 total: ${totalDur.toFixed(2)}s`);

  const bgImagePath = join(outputDir, "images", "bg.jpg");
  const bgImageRelPath = existsSync(bgImagePath) ? "images/bg.jpg" : null;

  let ttAvatarFile: string | undefined;
  if (!productMode) {
    let bundledAvatar: string | null = null;
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
      const p = join(__dirname, "assets", `avatar.${ext}`);
      if (existsSync(p)) { bundledAvatar = p; break; }
    }
    if (!bundledAvatar) {
      throw new Error("No bundled avatar found. Place an image at assets/avatar.{jpg,png,webp}");
    }
    const ttAvatarExt = bundledAvatar.split(".").pop()!.toLowerCase();
    ttAvatarFile = `tiktok-avatar.${ttAvatarExt}`;
    await copyFile(bundledAvatar, join(outputDir, ttAvatarFile));
  }

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
    outroHoldSec: productMode ? 1 : 3,
  });
  await writeFile(join(outputDir, "index.html"), html);
  await writeFile(join(outputDir, "hyperframes.json"), JSON.stringify(HYPERFRAMES_CONFIG, null, 2));
  await writeFile(join(outputDir, "meta.json"), JSON.stringify({
    id: basename(outputDir),
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

  const videoPath = join(outputDir, "video.mp4");
  await renderWithHyperframes({ compositionDir: outputDir, outputPath: videoPath });
  console.log(`\nDone: ${videoPath}`);
}

function findPreparedSceneMedia(script: Script, outputDir: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const scene of script.scenes) {
    const td = scene.templateData;
    if (td.template !== "screen-demo") continue;
    const safeId = scene.id.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const extensions = td.mediaType === "video"
      ? [".mp4", ".webm"]
      : [".png", ".jpg", ".jpeg", ".webp"];
    const ext = extensions.find((candidate) => existsSync(join(outputDir, "media", `${safeId}${candidate}`)));
    if (!ext) {
      throw new Error(`Prepared screen-demo media missing for scene "${scene.id}". Run the full pipeline once to copy source media.`);
    }
    result[scene.id] = `media/${safeId}${ext}`;
  }
  return result;
}

main().catch((e) => { console.error("Re-render failed:", e); process.exit(1); });
