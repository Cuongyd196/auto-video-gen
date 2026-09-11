import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Script, TemplateDataType } from "./script-schema.js";
import type { TiktokConfig } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "templates");

const GRAIN_OVERLAY_HTML = `<div id="grain-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;"><div class="grain-texture"></div></div>`;
const VIGNETTE_HTML = `<div class="vignette"></div>`;

const DEFAULT_TIKTOK: TiktokConfig = {
  displayName: "Channel",
  handle: "@channel",
  followers: "",
};

export interface SceneAudio {
  id: string;
  durationSec: number;
}

export interface ComposeArgs {
  script: Script;
  sceneAudio: SceneAudio[];
  gapSec: number;
  bgImageRelPath: string | null;
  audioRelPath: string;
  sceneMediaRelPaths?: Record<string, string>;
  productMode?: boolean;
  tiktok?: TiktokConfig;
  tiktokAvatarRelPath?: string;
  outroHoldSec?: number;
}

export function composeHtml(args: ComposeArgs): string {
  const {
    script,
    sceneAudio,
    gapSec,
    bgImageRelPath,
    audioRelPath,
    sceneMediaRelPaths = {},
    productMode = false,
  } = args;
  const tiktok = args.tiktok ?? DEFAULT_TIKTOK;
  const tiktokAvatar = args.tiktokAvatarRelPath ?? "tiktok-avatar.jpg";
  const outroHoldSec = args.outroHoldSec ?? 3;

  let cursor = 0;
  const timing = script.scenes.map((scene) => {
    const audio = sceneAudio.find((a) => a.id === scene.id);
    if (!audio) throw new Error(`No audio entry for scene id=${scene.id}`);
    const isOutro = scene.type === "outro";
    const dur = audio.durationSec + gapSec + (isOutro ? outroHoldSec : 0);
    const start = cursor;
    cursor += dur;
    return { scene, start, duration: dur };
  });
  const totalDuration = cursor;

  const sceneHtml = timing.map(({ scene, start, duration }) => {
    return renderScene(
      scene,
      start,
      duration,
      bgImageRelPath,
      tiktok,
      tiktokAvatar,
      sceneMediaRelPaths,
      productMode,
    );
  }).join("\n");

  const shellHtml = productMode ? "" : renderShell(script.metadata, tiktok);
  const animationFile = productMode ? "animations.product.js" : "animations.js";
  const animJs = readFileSync(join(TPL_DIR, animationFile), "utf8");

  const tpl = readFileSync(join(TPL_DIR, "base.html.tmpl"), "utf8");
  return tpl
    .replace("{{TITLE}}", escapeHtml(script.metadata.title))
    .replace(/\{\{TOTAL_DURATION\}\}/g, totalDuration.toFixed(2))
    .replace("{{SHELL}}", shellHtml)
    .replace("{{SCENES}}", sceneHtml)
    .replace(/src="voice\.mp3"/g, `src="${escapeHtml(audioRelPath)}"`)
    .replace('<script src="animations.js"></script>', `<script>\n${animJs}\n</script>`);
}

function renderShell(metadata: Script["metadata"], tiktok: TiktokConfig): string {
  const channel = escapeHtml(metadata.channel ?? metadata.title);
  const domain = metadata.source?.domain ? escapeHtml(metadata.source.domain) : "";
  const handle = escapeHtml(tiktok.handle);
  const keyword = domain
    ? `<div class="brand-shell-keyword"><span>${domain}</span></div>`
    : "";

  return `
<div class="shell-bg"></div>

<div class="brand-shell-header">
  <div class="brand-icon">&gt;_</div>
  <div class="brand-text">
    <div class="brand-name">${channel}</div>
    <div class="brand-tag">VIDEO</div>
  </div>
</div>

<div class="brand-shell-handle">
  <span class="handle-music">&#9835;</span>
  <span class="handle-text">${handle}</span>
</div>

${keyword}
${VIGNETTE_HTML}
${GRAIN_OVERLAY_HTML}`.trim();
}

function renderScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  bgImageRelPath: string | null,
  tiktok: TiktokConfig,
  tiktokAvatarRelPath: string,
  sceneMediaRelPaths: Record<string, string>,
  productMode: boolean,
): string {
  const td = scene.templateData;

  if (td.template === "screen-demo") {
    const mediaRelPath = sceneMediaRelPaths[scene.id];
    if (!mediaRelPath) {
      throw new Error(`No prepared media found for screen-demo scene id=${scene.id}`);
    }
    return renderScreenDemoScene(scene, td, start, duration, mediaRelPath);
  }

  if (td.template === "text") {
    return renderTextScene(scene, td, start, duration);
  }

  if (td.template === "product-outro") {
    return renderProductOutroScene(scene, td, start, duration);
  }

  let inner: string;
  let layoutName: string;

  switch (td.template) {
    case "hook":
      inner = renderHookInner(td, bgImageRelPath);
      layoutName = "hook";
      break;
    case "comparison":
      inner = renderComparisonInner(td);
      layoutName = "comparison";
      break;
    case "stat-hero":
      inner = renderStatHeroInner(td);
      layoutName = "stat-hero";
      break;
    case "feature-list":
      inner = renderFeatureListInner(td);
      layoutName = "feature-list";
      break;
    case "callout":
      inner = renderCalloutInner(td);
      layoutName = "callout";
      break;
    case "outro":
      inner = renderOutroInner(td, tiktok, tiktokAvatarRelPath, productMode);
      layoutName = "outro";
      break;
    default: {
      const _never: never = td;
      throw new Error(`Unknown template: ${(_never as any).template}`);
    }
  }

  return buildScene(scene, start, duration, layoutName, inner);
}

function renderScreenDemoScene(
  scene: Script["scenes"][number],
  td: Extract<TemplateDataType, { template: "screen-demo" }>,
  start: number,
  duration: number,
  mediaRelPath: string,
): string {
  const domId = safeDomId(scene.id);
  const commonAttrs = `data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-track-index="1"`;
  const mediaClass = `clip product-demo-media layout-${td.layout} fit-${td.fit}`;
  const src = escapeHtml(mediaRelPath);

  const media = td.mediaType === "image"
    ? `<img id="media-${domId}" class="${mediaClass}" ${commonAttrs} src="${src}" alt="" />`
    : `<video id="media-${domId}" class="${mediaClass}" ${commonAttrs} data-media-start="${td.mediaStartSec.toFixed(2)}" src="${src}" muted playsinline preload="auto"></video>`;

  const headline = td.headline
    ? `<div class="product-demo-headline">${escapeHtml(td.headline)}</div>`
    : "";
  const subtitleText = scene.subtitle ?? scene.voiceText;
  const subtitle = subtitleText
    ? `<div class="product-demo-subtitle">${escapeHtml(subtitleText)}</div>`
    : "";

  const overlay = `
<div id="overlay-${domId}" class="scene clip product-demo-overlay"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-track-index="2"
     data-layout="screen-demo">
  ${headline}
  ${subtitle}
</div>`.trim();

  return `${media}\n${overlay}`;
}

function renderTextScene(
  scene: Script["scenes"][number],
  td: Extract<TemplateDataType, { template: "text" }>,
  start: number,
  duration: number,
): string {
  const kicker = td.kicker ? `<div class="product-text-kicker">${escapeHtml(td.kicker)}</div>` : "";
  const subtitleText = scene.subtitle ?? "";
  const subtitle = subtitleText ? `<div class="product-text-subtitle">${escapeHtml(subtitleText)}</div>` : "";

  return `
<div id="scene-${safeDomId(scene.id)}" class="scene clip product-text-scene"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-track-index="1"
     data-layout="product-text">
  <div class="product-text-inner">
    ${kicker}
    <div class="product-text-main">${escapeHtml(td.text)}</div>
    ${subtitle}
  </div>
</div>`.trim();
}

function renderProductOutroScene(
  scene: Script["scenes"][number],
  td: Extract<TemplateDataType, { template: "product-outro" }>,
  start: number,
  duration: number,
): string {
  const url = td.url ? `<div class="product-outro-url">${escapeHtml(td.url)}</div>` : "";
  return `
<div id="scene-${safeDomId(scene.id)}" class="scene clip product-outro-scene"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-track-index="1"
     data-layout="product-outro">
  <div class="product-outro-inner">
    <div class="product-outro-name">${escapeHtml(td.productName)}</div>
    <div class="product-outro-cta">${escapeHtml(td.cta)}</div>
    ${url}
  </div>
</div>`.trim();
}

function renderHookInner(td: Extract<TemplateDataType, { template: "hook" }>, bgImageRelPath: string | null): string {
  const hasImage = Boolean(td.bgSrc && bgImageRelPath);
  let bgHtml: string;
  if (hasImage) {
    const kbClass = td.kenBurns ?? "zoom-in";
    bgHtml = `<div class="bg kb-${kbClass}" style="background-image: url('${bgImageRelPath}')"></div>`;
  } else {
    bgHtml = `<div class="bg gradient-news-dark"></div>`;
  }
  const overlayHtml = hasImage ? `<div class="overlay" style="opacity: 0.55"></div>` : "";
  const headline = escapeHtml(td.headline);
  const subhead = td.subhead ? escapeHtml(td.subhead) : "";

  return `${bgHtml}
  ${overlayHtml}
  <div class="layout-hook">
    <div class="hook-headline shimmer-sweep-target">${headline}</div>
    ${subhead ? `<div class="hook-subhead">${subhead}</div>` : ""}
  </div>`;
}

function renderComparisonInner(td: Extract<TemplateDataType, { template: "comparison" }>): string {
  const lColor = td.left.color;
  const rColor = td.right.color;
  const winnerClass = td.right.winner ? " card-winner" : "";

  return `
<div class="layout-comparison">
  <div class="cmp-card cmp-left color-${lColor}">
    <div class="cmp-label">${escapeHtml(td.left.label)}</div>
    <div class="cmp-value">${escapeHtml(td.left.value)}</div>
  </div>
  <div class="cmp-vs">VS</div>
  <div class="cmp-card cmp-right color-${rColor}${winnerClass}">
    <div class="cmp-label">${escapeHtml(td.right.label)}</div>
    <div class="cmp-value">${escapeHtml(td.right.value)}</div>
    ${td.right.winner ? '<div class="cmp-winner-badge">WINNER</div>' : ""}
  </div>
</div>`.trim();
}

function renderStatHeroInner(td: Extract<TemplateDataType, { template: "stat-hero" }>): string {
  const context = td.context ? `<div class="stat-context">${escapeHtml(td.context)}</div>` : "";
  return `
<div class="layout-stat-hero">
  <div class="stat-value shimmer-sweep-target">${escapeHtml(td.value)}</div>
  <div class="stat-label">${escapeHtml(td.label)}</div>
  ${context}
</div>`.trim();
}

function renderFeatureListInner(td: Extract<TemplateDataType, { template: "feature-list" }>): string {
  const bullets = td.bullets.map((b, i) =>
    `<div class="feat-bullet feat-bullet-${i}" data-idx="${i}">
      <div class="feat-dot"></div>
      <div class="feat-text">${escapeHtml(b)}</div>
    </div>`
  ).join("\n    ");

  return `
<div class="layout-feature-list">
  <div class="feat-card">
    <div class="feat-title">${escapeHtml(td.title)}</div>
    <div class="feat-rule"></div>
    <div class="feat-bullets">
      ${bullets}
    </div>
  </div>
</div>`.trim();
}

function renderCalloutInner(td: Extract<TemplateDataType, { template: "callout" }>): string {
  const tag = td.tag ? `<div class="callout-tag">${escapeHtml(td.tag)}</div>` : "";
  return `
<div class="layout-callout">
  <div class="callout-card">
    ${tag}
    <div class="callout-statement">${escapeHtml(td.statement)}</div>
  </div>
</div>`.trim();
}

function renderOutroInner(
  td: Extract<TemplateDataType, { template: "outro" }>,
  tiktok: TiktokConfig,
  avatarRelPath: string,
  productMode: boolean,
): string {
  const ttCard = productMode ? "" : renderTiktokCard(tiktok, avatarRelPath);
  return `
<div class="layout-outro">
  <div class="out-cta-top">${escapeHtml(td.ctaTop)}</div>
  <div class="out-channel">${escapeHtml(td.channelName)}</div>
  <div class="out-underline"></div>
  <div class="out-source">Nguồn: ${escapeHtml(td.source)}</div>
</div>
${ttCard}`.trim();
}

function renderTiktokCard(tiktok: TiktokConfig, avatarRelPath: string): string {
  return `
<div id="tt-card" class="tt-card">
  <img class="tt-avatar" src="${escapeHtml(avatarRelPath)}" alt="${escapeHtml(tiktok.displayName)}" crossorigin="anonymous" />
  <div class="tt-profile-info">
    <div class="tt-display-name">${escapeHtml(tiktok.displayName)}</div>
    <div class="tt-handle">${escapeHtml(tiktok.handle)}</div>
    <div class="tt-followers">${escapeHtml(tiktok.followers)}</div>
  </div>
  <div id="tt-follow-btn" class="tt-follow-btn">
    <span id="tt-btn-follow" class="tt-btn-text">Follow</span>
    <span id="tt-btn-following" class="tt-btn-text tt-btn-text-following">
      <span>Following</span>
      <span class="tt-check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
    </span>
  </div>
</div>`.trim();
}

function buildScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  layoutName: string,
  innerHtml: string,
): string {
  return `
<div class="scene clip" id="scene-${safeDomId(scene.id)}"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-track-index="1" data-active="0"
     data-layout="${layoutName}">
  ${innerHtml}
</div>`.trim();
}

function safeDomId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
