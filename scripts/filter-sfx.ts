/**
 * SFX Filter — copy usable (short) sound effects from the big library into
 * the bundled `assets/sfx/` folder used by the pipeline.
 *
 * Filters:
 *   - duration ≤ MAX_SEC  (default 3.0s — skips meme/voice/song clips)
 *   - duration ≥ MIN_SEC  (default 0.1s — skips silence/empty blips)
 *
 * Walks `SFX/<category>/<file.mp3>`, copies passing files to
 * `assets/sfx/<category>/<file.mp3>`. Idempotent — skips files already on disk.
 *
 * Usage:
 *   npx tsx scripts/filter-sfx.ts                          # SFX/ → assets/sfx/, max 3s
 *   npx tsx scripts/filter-sfx.ts --max-sec 2.5            # tighter cutoff
 *   npx tsx scripts/filter-sfx.ts --source ./my-sfx --target ./out
 *   npx tsx scripts/filter-sfx.ts --overwrite              # replace existing dest files
 */

import { mkdir, copyFile, readdir, access, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

interface Args {
  source: string;
  target: string;
  maxSec: number;
  minSec: number;
  overwrite: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let source = join(PROJECT_ROOT, "SFX");
  let target = join(PROJECT_ROOT, "assets", "sfx");
  let maxSec = 3.0;
  let minSec = 0.1;
  let overwrite = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--source" && args[i + 1])  { source = args[++i]; continue; }
    if (a === "--target" && args[i + 1])  { target = args[++i]; continue; }
    if (a === "--max-sec" && args[i + 1]) { maxSec = parseFloat(args[++i]); continue; }
    if (a === "--min-sec" && args[i + 1]) { minSec = parseFloat(args[++i]); continue; }
    if (a === "--overwrite")              { overwrite = true; continue; }
    if (a === "--help" || a === "-h") {
      console.log(
        "Usage: npx tsx scripts/filter-sfx.ts [--source DIR] [--target DIR] [--max-sec N] [--min-sec N] [--overwrite]"
      );
      process.exit(0);
    }
  }
  return { source, target, maxSec, minSec, overwrite };
}

function getDurationSec(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      path,
    ]);
    let out = "", err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe failed: ${err}`));
      const n = parseFloat(out.trim());
      if (isNaN(n)) return reject(new Error(`bad duration: ${out}`));
      resolve(n);
    });
    proc.on("error", reject);
  });
}

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

async function* walkMp3(dir: string): AsyncGenerator<{ category: string; file: string; full: string }> {
  let entries: string[];
  try { entries = await readdir(dir); }
  catch { return; }

  for (const entry of entries) {
    const entryPath = join(dir, entry);
    const st = await stat(entryPath);
    if (!st.isDirectory()) continue;
    // entry is a category folder
    const files = await readdir(entryPath);
    for (const f of files) {
      if (!f.toLowerCase().endsWith(".mp3")) continue;
      yield { category: entry, file: f, full: join(entryPath, f) };
    }
  }
}

async function main() {
  const { source, target, maxSec, minSec, overwrite } = parseArgs();

  console.log(`Source     : ${source}`);
  console.log(`Target     : ${target}`);
  console.log(`Duration   : ${minSec}s ≤ duration ≤ ${maxSec}s`);
  console.log(`Overwrite  : ${overwrite}`);
  console.log("");

  const stats = {
    inspected: 0,
    copied: 0,
    skippedExists: 0,
    skippedTooLong: 0,
    skippedTooShort: 0,
    failed: 0,
  };
  const tooLongList: { path: string; dur: number }[] = [];

  for await (const { category, file, full } of walkMp3(source)) {
    stats.inspected++;

    let dur: number;
    try {
      dur = await getDurationSec(full);
    } catch (e: any) {
      console.warn(`  [WARN] ffprobe failed for ${file}: ${e.message}`);
      stats.failed++;
      continue;
    }

    if (dur < minSec) {
      stats.skippedTooShort++;
      continue;
    }
    if (dur > maxSec) {
      stats.skippedTooLong++;
      tooLongList.push({ path: `${category}/${file}`, dur });
      continue;
    }

    const destDir = join(target, category);
    const destPath = join(destDir, file);

    if (!overwrite && (await exists(destPath))) {
      stats.skippedExists++;
      continue;
    }

    await mkdir(destDir, { recursive: true });
    await copyFile(full, destPath);
    stats.copied++;
    console.log(`  ✓ ${category}/${file} (${dur.toFixed(2)}s)`);
  }

  console.log("\n========================================");
  console.log(`Inspected      : ${stats.inspected}`);
  console.log(`Copied         : ${stats.copied}`);
  console.log(`Skipped (exists): ${stats.skippedExists}`);
  console.log(`Skipped (>${maxSec}s) : ${stats.skippedTooLong}`);
  console.log(`Skipped (<${minSec}s) : ${stats.skippedTooShort}`);
  console.log(`Failed         : ${stats.failed}`);

  if (tooLongList.length > 0 && tooLongList.length <= 30) {
    console.log(`\nFiles skipped for being too long (top ${Math.min(30, tooLongList.length)}):`);
    tooLongList.sort((a, b) => b.dur - a.dur).slice(0, 30).forEach((x) => {
      console.log(`  ${x.dur.toFixed(2)}s  ${x.path}`);
    });
  } else if (tooLongList.length > 30) {
    console.log(`\n${tooLongList.length} files skipped (too long). Use --max-sec higher to include more.`);
  }

  console.log(`\nLibrary at: ${target}`);
}

main().catch((e) => {
  console.error("Filter failed:", e);
  process.exit(1);
});
