/**
 * Smart SFX selector — picks the right sound effect for each scene using
 * a 3-tier strategy:
 *
 * Tier 1 (highest priority): EXPLICIT OVERRIDE
 *   `scene.sfx` set in script.json → use exactly that. Set to "none" to disable.
 *
 * Tier 2: SEMANTIC KEYWORD MATCH
 *   Scan scene.voiceText for emotion/concept keywords (Vietnamese + English).
 *   Match → pick from corresponding category pool.
 *   E.g., "cảnh báo" → alert/, "kỷ lục" → success/, "ra mắt" → reveal/.
 *
 * Tier 3: TEMPLATE DEFAULT
 *   Each template has preferred categories (with fallback). Pick from pool.
 *   E.g., hook → transition, comparison → transition, stat-hero → emphasis/success.
 *
 * Within a category pool, selection is DETERMINISTIC (hash of scene id) so:
 *   - Same script.json → same SFX (idempotent re-renders)
 *   - Different scenes get different files from same category (variety in one video)
 *   - Different scripts get different files (variety across videos)
 */

import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface SfxIndex {
  /** category → list of mp3 filenames (just the filename, not full path) */
  [category: string]: string[];
}

/** Walk sfxDir/<category>/*.mp3 and build the index. Empty if dir missing. */
export function indexSfxLibrary(sfxDir: string): SfxIndex {
  const index: SfxIndex = {};
  if (!existsSync(sfxDir)) return index;

  for (const cat of readdirSync(sfxDir)) {
    const catDir = join(sfxDir, cat);
    try {
      if (!statSync(catDir).isDirectory()) continue;
      const files = readdirSync(catDir).filter((f) => f.toLowerCase().endsWith(".mp3"));
      if (files.length > 0) index[cat] = files.sort(); // sort for determinism
    } catch {
      /* skip unreadable entries */
    }
  }
  return index;
}

/**
 * Template → preferred categories (in fallback order).
 * Pipeline tries the first; if empty in index, falls through to next.
 */
export const TEMPLATE_TO_CATEGORY: Record<string, string[]> = {
  hook:           ["transition", "cinematic"],          // dramatic entrance
  comparison:     ["transition", "emphasis"],           // side-by-side reveal
  "stat-hero":    ["emphasis", "success"],              // number reveal — bell/chime
  "feature-list": ["transition", "emphasis"],           // bullets pop in
  callout:        ["alert", "drumroll"],                // important — warning
  outro:          ["outro", "success"],                 // ending signature
};

/**
 * Semantic keyword rules (Vietnamese + English).
 * Order matters — first match wins. Test against `voiceText` (case-insensitive).
 */
export const KEYWORD_RULES: { pattern: RegExp; category: string; label: string }[] = [
  // Warning / risk / danger
  {
    pattern: /(cảnh báo|rủi ro|nguy hiểm|đáng lo|đe dọa|cảnh giác|tiêu cực|lo ngại|warning|danger|alert|risk|threat)/i,
    category: "alert",
    label: "warning",
  },
  // Failure / mistake / error
  {
    pattern: /(thất bại|sai lầm|sụp đổ|lỗi nghiêm trọng|không đạt|trượt|fail|error|wrong|mistake|crash|broken)/i,
    category: "fail",
    label: "failure",
  },
  // Success / record / achievement
  {
    pattern: /(kỷ lục|kỉ lục|vượt xa|xuất sắc|đạt mốc|thành công|tăng mạnh|đột phá|hàng đầu|breakthrough|achievement|success|record|win|outperform)/i,
    category: "success",
    label: "success",
  },
  // Reveal / launch / first / discover
  {
    pattern: /(tiết lộ|khám phá|lần đầu|công bố|ra mắt|trình làng|hé lộ|phát hành|reveal|launch|unveil|debut|announce|introduce)/i,
    category: "reveal",
    label: "reveal",
  },
  // Countdown / timer / urgent
  {
    pattern: /(đếm ngược|tích tắc|đồng hồ|thời hạn|deadline|countdown|tick|hurry)/i,
    category: "countdown",
    label: "countdown",
  },
  // Cinematic / massive / epic
  {
    pattern: /(hùng vĩ|hoành tráng|vĩ đại|chấn động|khổng lồ|cinematic|epic|massive|huge|colossal)/i,
    category: "cinematic",
    label: "cinematic",
  },
  // Drumroll moment — anticipation
  {
    pattern: /(hồi hộp|chờ đợi|sắp tới|và đây|và bây giờ|drumroll|suspense|anticipation)/i,
    category: "drumroll",
    label: "drumroll",
  },
];

export interface PickedSfx {
  /** Path relative to sfxDir, e.g. "transition/whoosh-sfx.mp3" */
  relPath: string;
  /** What tier picked it */
  source: "override" | "semantic" | "template" | "fallback";
  /** Keyword matched (only for source=semantic) */
  matchedKeyword?: string;
}

/** Stable hash of a string → non-negative integer */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickFromCategory(category: string, sceneId: string, index: SfxIndex): string | null {
  const pool = index[category];
  if (!pool || pool.length === 0) return null;
  const idx = hashCode(sceneId) % pool.length;
  return pool[idx];
}

/**
 * Main selector. Returns null if no SFX should play (e.g. category empty
 * AND no fallback succeeds).
 */
export function pickSfxForScene(args: {
  voiceText: string;
  templateName: string;
  sceneId: string;
  index: SfxIndex;
}): PickedSfx | null {
  const { voiceText, templateName, sceneId, index } = args;

  // Tier 2: semantic keyword match (Tier 1 = explicit override is handled at pipeline level)
  for (const rule of KEYWORD_RULES) {
    const m = voiceText.match(rule.pattern);
    if (!m) continue;
    const file = pickFromCategory(rule.category, sceneId, index);
    if (file) {
      return {
        relPath: `${rule.category}/${file}`,
        source: "semantic",
        matchedKeyword: m[0],
      };
    }
  }

  // Tier 3: template default — try preferred categories in order
  const candidates = TEMPLATE_TO_CATEGORY[templateName] ?? [];
  for (const cat of candidates) {
    const file = pickFromCategory(cat, sceneId, index);
    if (file) {
      return {
        relPath: `${cat}/${file}`,
        source: "template",
      };
    }
  }

  // Tier 4: last-resort fallback — any non-empty category
  const allCats = Object.keys(index);
  for (const cat of allCats) {
    const file = pickFromCategory(cat, sceneId, index);
    if (file) {
      return {
        relPath: `${cat}/${file}`,
        source: "fallback",
      };
    }
  }

  return null;
}

/** Recommended volume + offset per source/category */
export function defaultPlayback(picked: PickedSfx): { volume: number; offsetSec: number } {
  const cat = picked.relPath.split("/")[0];
  switch (cat) {
    case "transition": return { volume: 0.40, offsetSec: 0.0 };
    case "emphasis":   return { volume: 0.35, offsetSec: 0.2 };
    case "alert":      return { volume: 0.40, offsetSec: 0.1 };
    case "success":    return { volume: 0.35, offsetSec: 0.3 };
    case "fail":       return { volume: 0.35, offsetSec: 0.1 };
    case "reveal":     return { volume: 0.30, offsetSec: 0.2 };
    case "countdown":  return { volume: 0.30, offsetSec: 0.0 };
    case "cinematic":  return { volume: 0.35, offsetSec: 0.0 };
    case "drumroll":   return { volume: 0.40, offsetSec: 0.0 };
    case "outro":      return { volume: 0.35, offsetSec: 0.5 };
    default:           return { volume: 0.35, offsetSec: 0.1 };
  }
}
