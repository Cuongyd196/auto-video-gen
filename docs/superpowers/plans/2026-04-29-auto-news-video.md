# Auto News Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code skill + Node CLI that generates 9:16 motion-graphic news videos in Vietnamese from URL or .txt input. Output: `video.mp4` + `voice.mp3` + `script.txt` for CapCut post-processing.

**Architecture:** Skill (Claude does creative analysis & script generation) → `script.json` contract → Node CLI (deterministic: TTS API + image fetch + HTML composition + hyperframes render).

**Tech Stack:** TypeScript 5, Node 22+, Zod (schema), axios (HTTP), vitest (testing), hyperframes (render), ffmpeg (audio mix), LucyLab JSON-RPC (TTS).

**Spec:** `docs/superpowers/specs/2026-04-29-auto-news-video-design.md`

**Prerequisites the engineer must verify on their machine:**
1. Node ≥ 22 (`node --version`)
2. ffmpeg + ffprobe in PATH (`ffmpeg -version`, `ffprobe -version`)
3. Chrome/Chromium installed (Puppeteer dependency for hyperframes)
4. A working `VIETNAMESE_API_KEY` and `VIETNAMESE_VOICEID` for LucyLab.io

---

## File Structure (target end state)

```
auto_create_video/
├── .claude/skills/create-news-video/SKILL.md
├── .env.local                                    (gitignored, user-created)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── cli.ts
│   ├── pipeline.ts
│   ├── config.ts
│   ├── tts/
│   │   ├── lucylab-client.ts
│   │   └── lucylab-client.test.ts
│   ├── assets/
│   │   ├── image-fetcher.ts
│   │   ├── image-fetcher.test.ts
│   │   ├── audio-tools.ts
│   │   └── audio-tools.test.ts
│   ├── render/
│   │   ├── script-schema.ts
│   │   ├── script-schema.test.ts
│   │   ├── html-composer.ts
│   │   ├── html-composer.test.ts
│   │   ├── hyperframes-runner.ts
│   │   └── templates/
│   │       ├── base.html.tmpl
│   │       ├── styles.css
│   │       └── animations.js
│   └── utils/
│       ├── slug.ts
│       ├── slug.test.ts
│       └── logger.ts
├── tests/fixtures/
│   ├── sample-script-with-image.json
│   ├── sample-script-no-image.json
│   ├── invalid-bad-enum.json
│   ├── invalid-too-many-scenes.json
│   ├── invalid-line-too-long.json
│   ├── sample-audio-1.mp3            (any small valid mp3)
│   └── sample-audio-2.mp3
└── output/                                        (gitignored, runtime-generated)
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Run: `git init`

- [ ] **Step 1: Initialize git + npm**

```bash
cd e:/Program/auto_create_video
git init
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install zod axios
npm install -D typescript @types/node tsx vitest @vitest/coverage-v8
npm install hyperframes
```

If `hyperframes` install fails, log the error — read its README on https://github.com/heygen-com/hyperframes to find correct package name (might be scoped like `@heygen/hyperframes`). Update accordingly.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "output"]
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Update `package.json` scripts + type=module**

Edit `package.json` so it has:
```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "pipeline": "tsx src/cli.ts",
    "build": "tsc"
  }
}
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
output/
.env.local
.env
*.log
.DS_Store
```

- [ ] **Step 7: Create `.env.example`**

```
# LucyLab.io Vietnamese TTS (https://lucylab.io)
VIETNAMESE_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
VIETNAMESE_VOICEID=22charvoiceiduuidhere

# Optional overrides
LUCYLAB_ENDPOINT=https://api.lucylab.io/json-rpc
LUCYLAB_POLL_INTERVAL_MS=2000
LUCYLAB_POLL_TIMEOUT_MS=120000
TTS_CONCURRENCY=3
```

- [ ] **Step 8: Verify scaffold + commit**

```bash
npm run test
# Expected: "No test files found" or similar — vitest runs with 0 tests, exits 0 (no failures)
git add .
git commit -m "chore: initial project scaffold"
```

---

## Task 2: Zod schema for `script.json`

**Files:**
- Create: `src/render/script-schema.ts`, `src/render/script-schema.test.ts`
- Create fixtures: `tests/fixtures/sample-script-with-image.json`, `tests/fixtures/sample-script-no-image.json`, `tests/fixtures/invalid-bad-enum.json`, `tests/fixtures/invalid-too-many-scenes.json`, `tests/fixtures/invalid-line-too-long.json`

- [ ] **Step 1: Create the valid fixture `tests/fixtures/sample-script-with-image.json`**

```json
{
  "version": "1.0",
  "metadata": {
    "title": "Apple ra mắt iPhone 17 với camera 200MP",
    "source": {
      "url": "https://vnexpress.net/iphone-17-200mp",
      "domain": "vnexpress.net",
      "image": "https://i1-vnexpress.vnecdn.net/iphone17.jpg"
    },
    "channel": "Công nghệ 24h"
  },
  "voice": { "provider": "lucylab", "voiceId": "${VIETNAMESE_VOICEID}", "speed": 1.0 },
  "scenes": [
    {
      "id": "hook",
      "type": "hook",
      "voiceText": "Apple vừa ra mắt iPhone 17 với camera hai trăm megapixel.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "zoom-in" },
        "overlay": { "darkness": 0.4 },
        "text": {
          "position": "center",
          "style": "hook-large",
          "lines": [
            { "content": "iPhone 17", "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Camera 200MP!", "emphasis": "accent", "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f", "particle-burst"]
      }
    },
    {
      "id": "body-1",
      "type": "body",
      "voiceText": "Theo Apple, máy được trang bị cảm biến hoàn toàn mới có khả năng zoom quang học gấp mười lần.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "pan-left-slow" },
        "overlay": { "darkness": 0.3 },
        "text": {
          "position": "bottom",
          "style": "body-medium",
          "lines": [
            { "content": "Cảm biến mới", "emphasis": "primary", "animation": "slide-up" },
            { "content": "Zoom 10x", "emphasis": "accent", "animation": "fade-in-late" }
          ]
        },
        "effects": []
      }
    },
    {
      "id": "body-2",
      "type": "body",
      "voiceText": "Pin được nâng cấp lên năm nghìn miliampe giờ, tăng ba mươi phần trăm so với đời cũ.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "zoom-out" },
        "overlay": { "darkness": 0.3 },
        "text": {
          "position": "center",
          "style": "body-medium",
          "lines": [
            { "content": "Pin 5000mAh", "emphasis": "primary", "animation": "scale-pop" },
            { "content": "+30%", "emphasis": "accent", "animation": "slide-left" }
          ]
        },
        "effects": ["color-flash-accent"]
      }
    },
    {
      "id": "body-3",
      "type": "body",
      "voiceText": "Giá khởi điểm là hai mươi mốt triệu đồng, dự kiến mở bán tại Việt Nam vào tháng sau.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "pan-right-slow" },
        "overlay": { "darkness": 0.4 },
        "text": {
          "position": "top",
          "style": "body-medium",
          "lines": [
            { "content": "Từ 21 triệu", "emphasis": "primary", "animation": "slide-down" },
            { "content": "Mở bán tháng 5", "emphasis": "muted", "animation": "fade-in" }
          ]
        },
        "effects": []
      }
    },
    {
      "id": "outro",
      "type": "outro",
      "voiceText": "Theo dõi Công nghệ 24h để xem bản tin mới mỗi ngày.",
      "visual": {
        "background": { "type": "gradient", "preset": "outro-purple" },
        "text": {
          "position": "center",
          "style": "outro-card",
          "lines": [
            { "content": "Theo dõi để xem bản tin mới mỗi ngày", "emphasis": "primary", "animation": "fade-in" },
            { "content": "Công nghệ 24h", "emphasis": "channel", "animation": "scale-pop" },
            { "content": "Nguồn: vnexpress.net", "emphasis": "muted", "animation": "fade-in-late" }
          ]
        }
      }
    }
  ]
}
```

- [ ] **Step 2: Create no-image fixture `tests/fixtures/sample-script-no-image.json`**

Same as above but:
- `metadata.source.url`: `"local"`, `metadata.source.domain`: `"local"`, `metadata.source.image`: `null`
- All scenes' `background.type`: `"gradient"`, `background.preset`: `"news-dark"` (no `src`/`kenBurns`)
- Outro line "Nguồn: <domain>" → "Nguồn: local"

- [ ] **Step 3: Create invalid fixtures**

`tests/fixtures/invalid-bad-enum.json` — copy `sample-script-with-image.json`, change `scenes[0].visual.background.kenBurns` to `"zoom-sideways"` (not in enum).

`tests/fixtures/invalid-too-many-scenes.json` — copy and add 6 more body scenes (total 11 scenes).

`tests/fixtures/invalid-line-too-long.json` — copy and change `scenes[0].visual.text.lines[0].content` to `"This is a very long line of text definitely over twenty five characters"`.

- [ ] **Step 4: Write the failing schema test**

Create `src/render/script-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ScriptSchema } from "./script-schema.js";

const load = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/${name}`, "utf8"));

describe("ScriptSchema", () => {
  it("accepts sample-script-with-image.json", () => {
    expect(() => ScriptSchema.parse(load("sample-script-with-image.json"))).not.toThrow();
  });

  it("accepts sample-script-no-image.json", () => {
    expect(() => ScriptSchema.parse(load("sample-script-no-image.json"))).not.toThrow();
  });

  it("rejects invalid-bad-enum.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-bad-enum.json"))).toThrow(/kenBurns/);
  });

  it("rejects invalid-too-many-scenes.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-too-many-scenes.json"))).toThrow(/scenes/);
  });

  it("rejects invalid-line-too-long.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-line-too-long.json"))).toThrow(/25/);
  });

  it("requires hook + outro present", () => {
    const data = load("sample-script-with-image.json");
    data.scenes = data.scenes.filter((s: any) => s.type !== "outro");
    expect(() => ScriptSchema.parse(data)).toThrow(/outro/);
  });
});
```

- [ ] **Step 5: Run tests — verify they fail**

```bash
npm test
# Expected: All 6 tests fail because ScriptSchema doesn't exist yet
```

- [ ] **Step 6: Implement `src/render/script-schema.ts`**

```ts
import { z } from "zod";

const KenBurns = z.enum([
  "zoom-in", "zoom-out",
  "pan-left-slow", "pan-right-slow", "pan-up-slow", "pan-down-slow",
]);

const GradientPreset = z.enum([
  "outro-purple", "outro-blue", "news-red", "news-dark",
]);

const TextPosition = z.enum(["center", "top", "bottom"]);
const TextStyle = z.enum(["hook-large", "body-medium", "body-small", "outro-card"]);
const Emphasis = z.enum(["primary", "accent", "channel", "muted"]);
const Animation = z.enum([
  "scale-pop", "slide-up", "slide-up-bounce", "slide-down",
  "slide-left", "slide-right", "fade-in", "fade-in-late", "typewriter",
]);
const Effect = z.enum([
  "flash-white-3f", "particle-burst", "screen-shake-light", "color-flash-accent",
]);

const BackgroundImage = z.object({
  type: z.literal("image"),
  src: z.string(),                                    // accepts "$source.image" or actual URL
  kenBurns: KenBurns,
});

const BackgroundGradient = z.object({
  type: z.literal("gradient"),
  preset: GradientPreset,
});

const Background = z.discriminatedUnion("type", [BackgroundImage, BackgroundGradient]);

const Line = z.object({
  content: z.string().min(1).max(25, "line.content must be ≤ 25 chars"),
  emphasis: Emphasis,
  animation: Animation,
});

const Visual = z.object({
  background: Background,
  overlay: z.object({ darkness: z.number().min(0).max(1) }).optional(),
  text: z.object({
    position: TextPosition,
    style: TextStyle,
    lines: z.array(Line).min(1).max(3),
  }),
  effects: z.array(Effect).default([]),
});

const Scene = z.object({
  id: z.string().min(1),
  type: z.enum(["hook", "body", "outro"]),
  voiceText: z.string().min(1),
  visual: Visual,
});

export const ScriptSchema = z.object({
  version: z.literal("1.0"),
  metadata: z.object({
    title: z.string().min(1),
    source: z.object({
      url: z.string(),
      domain: z.string(),
      image: z.string().url().nullable(),
    }),
    channel: z.string().min(1),
  }),
  voice: z.object({
    provider: z.literal("lucylab"),
    voiceId: z.string().min(1),
    speed: z.number().min(0.5).max(2.0),
  }),
  scenes: z.array(Scene)
    .min(5)
    .max(8)
    .refine(
      (s) => s[0]?.type === "hook",
      { message: "scenes[0] must be type=hook" }
    )
    .refine(
      (s) => s[s.length - 1]?.type === "outro",
      { message: "last scene must be type=outro" }
    ),
});

export type Script = z.infer<typeof ScriptSchema>;
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
npm test
# Expected: All 6 tests pass
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: zod schema for script.json with validation tests"
```

---

## Task 3: Config loader

**Files:**
- Create: `src/config.ts`, `src/config.test.ts`

- [ ] **Step 1: Write the failing test `src/config.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const ENV_KEYS = [
  "VIETNAMESE_API_KEY",
  "VIETNAMESE_VOICEID",
  "LUCYLAB_ENDPOINT",
  "LUCYLAB_POLL_INTERVAL_MS",
  "LUCYLAB_POLL_TIMEOUT_MS",
  "TTS_CONCURRENCY",
];

describe("loadConfig", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    Object.entries(saved).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
  });

  it("reads required env vars", () => {
    process.env.VIETNAMESE_API_KEY = "sk_test_abc";
    process.env.VIETNAMESE_VOICEID = "voice123";
    const cfg = loadConfig();
    expect(cfg.apiKey).toBe("sk_test_abc");
    expect(cfg.voiceId).toBe("voice123");
  });

  it("throws when VIETNAMESE_API_KEY is missing", () => {
    process.env.VIETNAMESE_VOICEID = "voice123";
    expect(() => loadConfig()).toThrow(/VIETNAMESE_API_KEY/);
  });

  it("uses sensible defaults for optional vars", () => {
    process.env.VIETNAMESE_API_KEY = "k";
    process.env.VIETNAMESE_VOICEID = "v";
    const cfg = loadConfig();
    expect(cfg.endpoint).toBe("https://api.lucylab.io/json-rpc");
    expect(cfg.pollIntervalMs).toBe(2000);
    expect(cfg.pollTimeoutMs).toBe(120000);
    expect(cfg.ttsConcurrency).toBe(3);
  });

  it("respects overrides", () => {
    process.env.VIETNAMESE_API_KEY = "k";
    process.env.VIETNAMESE_VOICEID = "v";
    process.env.LUCYLAB_ENDPOINT = "https://test.example/rpc";
    process.env.TTS_CONCURRENCY = "5";
    const cfg = loadConfig();
    expect(cfg.endpoint).toBe("https://test.example/rpc");
    expect(cfg.ttsConcurrency).toBe(5);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test src/config.test.ts
# Expected: import error, file not found
```

- [ ] **Step 3: Implement `src/config.ts`**

```ts
import "dotenv/config";

export interface Config {
  apiKey: string;
  voiceId: string;
  endpoint: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
  ttsConcurrency: number;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(
      `Missing required env var ${name}. ` +
      `Copy .env.example to .env.local and fill in the values.`
    );
  }
  return v;
}

function intDefault(name: string, def: number): number {
  const v = process.env[name];
  if (!v) return def;
  const n = parseInt(v, 10);
  if (isNaN(n)) throw new Error(`Env var ${name} must be integer, got "${v}"`);
  return n;
}

export function loadConfig(): Config {
  return {
    apiKey: required("VIETNAMESE_API_KEY"),
    voiceId: required("VIETNAMESE_VOICEID"),
    endpoint: process.env.LUCYLAB_ENDPOINT ?? "https://api.lucylab.io/json-rpc",
    pollIntervalMs: intDefault("LUCYLAB_POLL_INTERVAL_MS", 2000),
    pollTimeoutMs: intDefault("LUCYLAB_POLL_TIMEOUT_MS", 120000),
    ttsConcurrency: intDefault("TTS_CONCURRENCY", 3),
  };
}
```

- [ ] **Step 4: Install dotenv**

```bash
npm install dotenv
```

Note: dotenv looks for `.env` by default. We use `.env.local`. The CLI entry (`cli.ts`) will call `dotenv.config({ path: ".env.local" })` explicitly before importing config — but in tests we set env directly so the import still works.

- [ ] **Step 5: Run tests — verify pass**

```bash
npm test src/config.test.ts
# Expected: 4 tests pass
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: config loader from env vars"
```

---

## Task 4: Logger + slug utility

**Files:**
- Create: `src/utils/logger.ts`, `src/utils/slug.ts`, `src/utils/slug.test.ts`

- [ ] **Step 1: Implement `src/utils/logger.ts` (no test — too trivial)**

```ts
const ts = () => new Date().toISOString().replace("T", " ").substring(0, 19);

export const log = {
  step: (n: number, total: number, msg: string) =>
    console.log(`[${ts()}] [${n}/${total}] ${msg}`),
  info: (msg: string) => console.log(`[${ts()}] ${msg}`),
  warn: (msg: string) => console.warn(`[${ts()}] WARN ${msg}`),
  error: (msg: string, err?: unknown) => {
    console.error(`[${ts()}] ERROR ${msg}`);
    if (err instanceof Error) console.error(err.stack);
    else if (err) console.error(err);
  },
};
```

- [ ] **Step 2: Write failing slug test `src/utils/slug.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { toSlug } from "./slug.js";

describe("toSlug", () => {
  it("converts Vietnamese diacritics to ASCII", () => {
    expect(toSlug("iPhone 17 ra mắt với camera 200MP"))
      .toBe("iphone-17-ra-mat-voi-camera-200mp");
  });

  it("collapses whitespace and special chars to single dash", () => {
    expect(toSlug("Hello   --   World!!!")).toBe("hello-world");
  });

  it("strips leading/trailing dashes", () => {
    expect(toSlug("---abc---")).toBe("abc");
  });

  it("truncates to 40 chars without breaking words", () => {
    const long = "this is a very long title that should be truncated nicely";
    const s = toSlug(long);
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s).not.toMatch(/-$/);
  });

  it("handles empty/whitespace input", () => {
    expect(toSlug("")).toBe("untitled");
    expect(toSlug("   ")).toBe("untitled");
  });
});
```

- [ ] **Step 3: Run — verify fail**

```bash
npm test src/utils/slug.test.ts
```

- [ ] **Step 4: Implement `src/utils/slug.ts`**

```ts
export function toSlug(input: string): string {
  if (!input || !input.trim()) return "untitled";

  const noDiacritics = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D");

  let slug = noDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 40) {
    slug = slug.substring(0, 40).replace(/-+[^-]*$/, "");
    if (!slug) slug = noDiacritics.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40);
    slug = slug.replace(/^-+|-+$/g, "");
  }

  return slug || "untitled";
}
```

- [ ] **Step 5: Run + commit**

```bash
npm test src/utils/slug.test.ts
git add .
git commit -m "feat: logger + slug utility for Vietnamese titles"
```

---

## Task 5: LucyLab TTS client

**⚠️ Important pre-work:** This task makes assumptions about LucyLab JSON-RPC format based on JSON-RPC 2.0 conventions. **Before writing code,** the engineer MUST verify the actual API by either:
- Reading LucyLab docs at https://lucylab.io
- Doing a manual `curl` test with the user's API key

If the format differs from what's assumed below (method names, param names, response shape), update the code accordingly.

**Files:**
- Create: `src/tts/lucylab-client.ts`, `src/tts/lucylab-client.test.ts`

- [ ] **Step 1: Verify LucyLab API contract (NO CODE YET)**

Read https://lucylab.io docs OR run:
```bash
curl -X POST https://api.lucylab.io/json-rpc \
  -H "Authorization: Bearer $VIETNAMESE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ttsLongText","params":{"text":"Xin chào","voiceId":"'"$VIETNAMESE_VOICEID"'","speed":1.0},"id":"1"}'
```

Document the actual request/response in a comment at the top of `lucylab-client.ts`. The test code below assumes:
- POST to endpoint with JSON-RPC 2.0 body
- `ttsLongText` returns `{ result: { exportId: string } }`
- `getExportStatus` takes `{ exportId }` returns `{ result: { status: "pending"|"done"|"failed", url?: string, error?: string } }`
- Bearer auth header

**If the actual API differs, update assumptions before implementing.**

- [ ] **Step 2: Install nock for HTTP mocking**

```bash
npm install -D nock
```

- [ ] **Step 3: Write failing test `src/tts/lucylab-client.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nock from "nock";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LucylabClient } from "./lucylab-client.js";

const cfg = {
  apiKey: "sk_test_abc",
  voiceId: "v1",
  endpoint: "https://api.lucylab.io/json-rpc",
  pollIntervalMs: 50,
  pollTimeoutMs: 5000,
  ttsConcurrency: 3,
};

let tmpDir: string;

beforeEach(() => {
  nock.cleanAll();
  tmpDir = mkdtempSync(join(tmpdir(), "lucylab-test-"));
});

afterEach(() => {
  nock.cleanAll();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("LucylabClient", () => {
  it("submits text + polls until done + downloads audio", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc", (b) => b.method === "ttsLongText" && b.params.text === "xin chào")
      .reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-1" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc", (b) => b.method === "getExportStatus")
      .reply(200, { jsonrpc: "2.0", id: "2", result: { status: "pending" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc", (b) => b.method === "getExportStatus")
      .reply(200, { jsonrpc: "2.0", id: "3", result: { status: "done", url: "https://cdn.lucylab.io/exp-1.mp3" } });

    nock("https://cdn.lucylab.io").get("/exp-1.mp3").reply(200, Buffer.from("MP3DATA"));

    const client = new LucylabClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("xin chào", out);
    expect(readFileSync(out).toString()).toBe("MP3DATA");
  });

  it("retries on 5xx with backoff", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(503, "Service Unavailable")
      .post("/json-rpc").reply(503, "Service Unavailable")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-2" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "2", result: { status: "done", url: "https://cdn.lucylab.io/exp-2.mp3" } });

    nock("https://cdn.lucylab.io").get("/exp-2.mp3").reply(200, Buffer.from("OK"));

    const client = new LucylabClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("hi", out);
    expect(readFileSync(out).toString()).toBe("OK");
  });

  it("throws if poll exceeds timeout", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-3" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").times(200).reply(200, { jsonrpc: "2.0", id: "x", result: { status: "pending" } });

    const fastCfg = { ...cfg, pollTimeoutMs: 200, pollIntervalMs: 50 };
    const client = new LucylabClient(fastCfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/timeout|exp-3/);
  });

  it("throws if status=failed", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { exportId: "exp-4" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, {
        jsonrpc: "2.0", id: "2",
        result: { status: "failed", error: "voice unavailable" },
      });

    const client = new LucylabClient(cfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/failed|voice unavailable/);
  });
});
```

- [ ] **Step 4: Run — verify fail**

```bash
npm test src/tts/lucylab-client.test.ts
```

- [ ] **Step 5: Implement `src/tts/lucylab-client.ts`**

```ts
import axios, { AxiosError } from "axios";
import { writeFile } from "node:fs/promises";
import type { Config } from "../config.js";

interface JsonRpcOk<T> { jsonrpc: "2.0"; id: string; result: T; }
interface JsonRpcErr { jsonrpc: "2.0"; id: string; error: { code: number; message: string }; }
type JsonRpcResp<T> = JsonRpcOk<T> | JsonRpcErr;

interface ExportStatus {
  status: "pending" | "running" | "done" | "failed";
  url?: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class LucylabClient {
  constructor(private cfg: Config) {}

  async generate(text: string, outPath: string): Promise<void> {
    const exportId = await this.submitWithRetry(text);
    const url = await this.pollUntilDone(exportId);
    await this.download(url, outPath);
  }

  private async rpc<T>(method: string, params: any, idHint: string): Promise<T> {
    const resp = await axios.post<JsonRpcResp<T>>(
      this.cfg.endpoint,
      { jsonrpc: "2.0", method, params, id: idHint },
      {
        headers: {
          Authorization: `Bearer ${this.cfg.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );
    const body = resp.data;
    if ("error" in body) {
      throw new Error(`LucyLab ${method} error: ${body.error.message}`);
    }
    return body.result;
  }

  private async submitWithRetry(text: string): Promise<string> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const result = await this.rpc<{ exportId: string }>(
          "ttsLongText",
          { text, voiceId: this.cfg.voiceId, speed: 1.0 },
          `submit-${Date.now()}`,
        );
        return result.exportId;
      } catch (e) {
        lastErr = e;
        const status = (e as AxiosError).response?.status;
        const retryable = status === undefined || status >= 500;
        if (!retryable || attempt === delays.length) throw e;
        await sleep(delays[attempt]);
      }
    }
    throw lastErr;
  }

  private async pollUntilDone(exportId: string): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < this.cfg.pollTimeoutMs) {
      const status = await this.rpc<ExportStatus>(
        "getExportStatus",
        { exportId },
        `poll-${Date.now()}`,
      );
      if (status.status === "done") {
        if (!status.url) throw new Error(`LucyLab returned status=done without url for ${exportId}`);
        return status.url;
      }
      if (status.status === "failed") {
        throw new Error(`LucyLab export ${exportId} failed: ${status.error ?? "unknown"}`);
      }
      await sleep(this.cfg.pollIntervalMs);
    }
    throw new Error(`LucyLab export ${exportId} polling timeout after ${this.cfg.pollTimeoutMs}ms`);
  }

  private async download(url: string, outPath: string): Promise<void> {
    const resp = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer", timeout: 60000 });
    await writeFile(outPath, Buffer.from(resp.data));
  }
}
```

- [ ] **Step 6: Run tests — verify pass**

```bash
npm test src/tts/lucylab-client.test.ts
# Expected: 4 tests pass
```

If any test fails because actual API contract differs from what was assumed, update both the code and tests.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: LucyLab TTS client with retry and polling"
```

---

## Task 6: Image fetcher

**Files:**
- Create: `src/assets/image-fetcher.ts`, `src/assets/image-fetcher.test.ts`

- [ ] **Step 1: Failing test `src/assets/image-fetcher.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fetchImage } from "./image-fetcher.js";

let tmp: string;
beforeEach(() => { nock.cleanAll(); tmp = mkdtempSync(join(tmpdir(), "img-")); });
afterEach(() => { nock.cleanAll(); rmSync(tmp, { recursive: true, force: true }); });

// 1x1 jpg (smallest valid)
const TINY_JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);

describe("fetchImage", () => {
  it("downloads ok image and returns local path", async () => {
    nock("https://example.com").get("/img.jpg")
      .reply(200, TINY_JPG, { "content-type": "image/jpeg" });
    const out = join(tmp, "bg.jpg");
    const result = await fetchImage("https://example.com/img.jpg", out);
    expect(result.success).toBe(true);
    expect(result.path).toBe(out);
    expect(existsSync(out)).toBe(true);
  });

  it("returns failure on 404", async () => {
    nock("https://example.com").get("/missing.jpg").reply(404);
    const result = await fetchImage("https://example.com/missing.jpg", join(tmp, "x.jpg"));
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/404|http/i);
  });

  it("returns failure on non-image content-type", async () => {
    nock("https://example.com").get("/page.html")
      .reply(200, "<html></html>", { "content-type": "text/html" });
    const result = await fetchImage("https://example.com/page.html", join(tmp, "x.jpg"));
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/content-type|image/i);
  });

  it("returns failure on null url input", async () => {
    const result = await fetchImage(null, join(tmp, "x.jpg"));
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/no url|null/i);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test src/assets/image-fetcher.test.ts
```

- [ ] **Step 3: Implement `src/assets/image-fetcher.ts`**

```ts
import axios from "axios";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface FetchResult {
  success: boolean;
  path?: string;
  reason?: string;
}

export async function fetchImage(url: string | null, outPath: string): Promise<FetchResult> {
  if (!url) return { success: false, reason: "no url provided (null)" };

  try {
    const resp = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      validateStatus: (s) => s < 400,
    });

    const ct = String(resp.headers["content-type"] ?? "");
    if (!ct.startsWith("image/")) {
      return { success: false, reason: `non-image content-type: ${ct}` };
    }

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, Buffer.from(resp.data));
    return { success: true, path: outPath };
  } catch (e: any) {
    const status = e.response?.status;
    return { success: false, reason: status ? `http ${status}` : String(e.message ?? e) };
  }
}
```

- [ ] **Step 4: Run + commit**

```bash
npm test src/assets/image-fetcher.test.ts
git add .
git commit -m "feat: image fetcher with mime/error fallback"
```

**Note:** Spec section 6.1 mentions image min 720px size validation. We're skipping that in MVP (warning would only catch a tiny class of issues; CapCut/render will visually show problems). Add later if needed.

---

## Task 7: Audio tools (ffprobe + concat)

**Files:**
- Create: `src/assets/audio-tools.ts`, `src/assets/audio-tools.test.ts`
- Need fixture mp3 files: `tests/fixtures/sample-audio-1.mp3`, `tests/fixtures/sample-audio-2.mp3`

- [ ] **Step 1: Generate fixture mp3s with ffmpeg**

```bash
mkdir -p tests/fixtures
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=2" -c:a libmp3lame tests/fixtures/sample-audio-1.mp3
ffmpeg -y -f lavfi -i "sine=frequency=880:duration=3" -c:a libmp3lame tests/fixtures/sample-audio-2.mp3
```

- [ ] **Step 2: Failing test `src/assets/audio-tools.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getDurationSec, concatWithSilence } from "./audio-tools.js";

let tmp: string;
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "aud-")); });
afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

describe("getDurationSec", () => {
  it("returns ~2s for sample-audio-1.mp3", async () => {
    const d = await getDurationSec("tests/fixtures/sample-audio-1.mp3");
    expect(d).toBeGreaterThan(1.9);
    expect(d).toBeLessThan(2.2);
  });
});

describe("concatWithSilence", () => {
  it("concatenates two mp3s with 0.3s gap", async () => {
    const out = join(tmp, "voice.mp3");
    await concatWithSilence(
      ["tests/fixtures/sample-audio-1.mp3", "tests/fixtures/sample-audio-2.mp3"],
      0.3,
      out,
    );
    expect(existsSync(out)).toBe(true);
    const d = await getDurationSec(out);
    // 2s + 0.3s + 3s = 5.3s, allow ±0.3s
    expect(d).toBeGreaterThan(5.0);
    expect(d).toBeLessThan(5.6);
  });
});
```

- [ ] **Step 3: Run — verify fail**

```bash
npm test src/assets/audio-tools.test.ts
```

- [ ] **Step 4: Implement `src/assets/audio-tools.ts`**

```ts
import { spawn } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let out = "", err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} failed (exit ${code}): ${err}`));
    });
    proc.on("error", reject);
  });
}

export async function getDurationSec(path: string): Promise<number> {
  const out = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const d = parseFloat(out.trim());
  if (isNaN(d)) throw new Error(`ffprobe returned non-numeric duration for ${path}: ${out}`);
  return d;
}

export async function concatWithSilence(
  inputPaths: string[],
  gapSec: number,
  outPath: string,
): Promise<void> {
  if (inputPaths.length === 0) throw new Error("concatWithSilence: empty inputPaths");

  const tmp = await mkdtemp(join(tmpdir(), "concat-"));
  try {
    // Generate silence
    const silencePath = join(tmp, "silence.mp3");
    await run("ffmpeg", [
      "-y", "-f", "lavfi",
      "-i", `anullsrc=r=44100:cl=mono`,
      "-t", String(gapSec),
      "-c:a", "libmp3lame", "-b:a", "128k",
      silencePath,
    ]);

    // Build concat list file
    const items: string[] = [];
    inputPaths.forEach((p, i) => {
      items.push(`file '${p.replace(/'/g, "'\\''")}'`);
      if (i < inputPaths.length - 1) items.push(`file '${silencePath.replace(/'/g, "'\\''")}'`);
    });
    const listPath = join(tmp, "list.txt");
    await writeFile(listPath, items.join("\n"));

    await run("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0",
      "-i", listPath,
      "-c", "copy",
      outPath,
    ]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
```

- [ ] **Step 5: Run + commit**

```bash
npm test src/assets/audio-tools.test.ts
git add .
git commit -m "feat: audio duration probe and concat-with-silence"
```

---

## Task 8: HTML render templates

**⚠️ Pre-work:** Spec assumes HyperFrames data attributes (`data-composition-id`, `data-start`, `data-duration`, `data-fps`, etc.). Engineer should run `npx hyperframes init test-dir` once to inspect what the actual data-attribute format is, then adjust templates to match. This task assumes attributes work as documented but the engineer must verify.

**Files:**
- Create: `src/render/templates/base.html.tmpl`, `src/render/templates/styles.css`, `src/render/templates/animations.js`

- [ ] **Step 1: Verify HyperFrames composition format**

```bash
mkdir -p /tmp/hf-check
cd /tmp/hf-check
npx hyperframes init demo
ls demo/
cat demo/index.html  # or whatever the composition file is
```

Document the actual `<div id="stage" data-...>` structure. If it differs from what's below, update accordingly.

- [ ] **Step 2: Create `src/render/templates/base.html.tmpl`**

This is a Handlebars-style template (we'll do simple string substitution, no template library — KISS):

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>{{TITLE}}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="stage"
       data-composition-id="news-video"
       data-width="1080"
       data-height="1920"
       data-fps="30"
       data-duration="{{TOTAL_DURATION}}">

    <audio data-start="0" data-duration="{{TOTAL_DURATION}}" src="voice.mp3"></audio>

    {{SCENES}}
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="animations.js"></script>
</body>
</html>
```

Placeholders: `{{TITLE}}`, `{{TOTAL_DURATION}}`, `{{SCENES}}` — substituted by composer.

- [ ] **Step 3: Create `src/render/templates/styles.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: #000; font-family: 'Inter', 'Noto Sans', sans-serif; }
#stage { position: relative; width: 1080px; height: 1920px; }

.scene { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; }
.scene[data-active="1"] { opacity: 1; }

.bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
.bg.kb-zoom-in    { animation: kb-zoom-in    var(--scene-dur) linear forwards; }
.bg.kb-zoom-out   { animation: kb-zoom-out   var(--scene-dur) linear forwards; }
.bg.kb-pan-left   { animation: kb-pan-left   var(--scene-dur) linear forwards; }
.bg.kb-pan-right  { animation: kb-pan-right  var(--scene-dur) linear forwards; }
.bg.kb-pan-up     { animation: kb-pan-up     var(--scene-dur) linear forwards; }
.bg.kb-pan-down   { animation: kb-pan-down   var(--scene-dur) linear forwards; }

@keyframes kb-zoom-in   { from { transform: scale(1.0); } to { transform: scale(1.18); } }
@keyframes kb-zoom-out  { from { transform: scale(1.18); } to { transform: scale(1.0); } }
@keyframes kb-pan-left  { from { transform: scale(1.15) translateX(4%); } to { transform: scale(1.15) translateX(-4%); } }
@keyframes kb-pan-right { from { transform: scale(1.15) translateX(-4%); } to { transform: scale(1.15) translateX(4%); } }
@keyframes kb-pan-up    { from { transform: scale(1.15) translateY(4%); } to { transform: scale(1.15) translateY(-4%); } }
@keyframes kb-pan-down  { from { transform: scale(1.15) translateY(-4%); } to { transform: scale(1.15) translateY(4%); } }

.bg.gradient-outro-purple { background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); }
.bg.gradient-outro-blue   { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); }
.bg.gradient-news-red     { background: linear-gradient(135deg, #c31432 0%, #240b36 100%); }
.bg.gradient-news-dark    { background: linear-gradient(135deg, #232526 0%, #414345 100%); }

.overlay { position: absolute; inset: 0; background: #000; }

.text-block { position: absolute; left: 80px; right: 80px; display: flex; flex-direction: column; gap: 24px; }
.text-block.pos-center { top: 50%; transform: translateY(-50%); align-items: center; text-align: center; }
.text-block.pos-top    { top: 200px; align-items: center; text-align: center; }
.text-block.pos-bottom { bottom: 200px; align-items: center; text-align: center; }

.line { display: inline-block; padding: 12px 28px; border-radius: 18px; line-height: 1.1; opacity: 0; }
.line.style-hook-large    { font-size: 132px; font-weight: 900; }
.line.style-body-medium   { font-size: 88px;  font-weight: 800; }
.line.style-body-small    { font-size: 64px;  font-weight: 700; }
.line.style-outro-card    { font-size: 72px;  font-weight: 700; }

.line.emp-primary { color: #fff; background: rgba(0,0,0,0.55); }
.line.emp-accent  { color: #FFD93D; background: rgba(0,0,0,0.6); }
.line.emp-channel { color: #6EE7F9; background: rgba(0,0,0,0.5); }
.line.emp-muted   { color: #cbd5e0; background: rgba(0,0,0,0.4); font-weight: 500; }

.fx { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
.fx.flash-white-3f { background: #fff; }
.fx.particle-burst { background: radial-gradient(circle at center, rgba(255,217,61,0.9) 0%, transparent 60%); }
.fx.color-flash-accent { background: rgba(255,217,61,0.5); }
```

- [ ] **Step 4: Create `src/render/templates/animations.js`**

```js
// Drives scene activation + line animations using GSAP.
// Reads data attrs from #stage and each .scene element.

(function () {
  const stage = document.getElementById("stage");
  const totalDuration = parseFloat(stage.dataset.duration);
  const scenes = Array.from(stage.querySelectorAll(".scene"));

  const tl = gsap.timeline({ paused: true });

  scenes.forEach((scene) => {
    const start = parseFloat(scene.dataset.start);
    const dur = parseFloat(scene.dataset.duration);
    scene.style.setProperty("--scene-dur", dur + "s");

    tl.set(scene, { attr: { "data-active": "1" } }, start);
    tl.set(scene, { attr: { "data-active": "0" } }, start + dur);

    // Line text animations (per spec)
    const lines = scene.querySelectorAll(".line");
    lines.forEach((line, idx) => {
      const anim = line.dataset.animation;
      const delay = start + 0.15 + idx * 0.25;
      const map = {
        "scale-pop":         { from: { scale: 0.4, opacity: 0 }, to: { scale: 1, opacity: 1, ease: "back.out(2)", duration: 0.5 } },
        "slide-up":          { from: { y: 80,  opacity: 0 }, to: { y: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "slide-up-bounce":   { from: { y: 80,  opacity: 0 }, to: { y: 0, opacity: 1, ease: "elastic.out(1,0.5)", duration: 0.8 } },
        "slide-down":        { from: { y: -80, opacity: 0 }, to: { y: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "slide-left":        { from: { x: 80,  opacity: 0 }, to: { x: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "slide-right":       { from: { x: -80, opacity: 0 }, to: { x: 0, opacity: 1, ease: "power3.out", duration: 0.5 } },
        "fade-in":           { from: { opacity: 0 }, to: { opacity: 1, duration: 0.5 } },
        "fade-in-late":      { from: { opacity: 0 }, to: { opacity: 1, delay: 0.4, duration: 0.6 } },
        "typewriter":        { from: { opacity: 0 }, to: { opacity: 1, duration: 0.05 } }, // simplified
      };
      const cfg = map[anim] || map["fade-in"];
      tl.fromTo(line, cfg.from, { ...cfg.to, immediateRender: false }, delay);
    });

    // Effects
    scene.querySelectorAll(".fx.flash-white-3f").forEach((el) => {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.05 }, start);
      tl.to(el,    { opacity: 0, duration: 0.05 }, start + 0.1);
    });
    scene.querySelectorAll(".fx.particle-burst").forEach((el) => {
      tl.fromTo(el, { opacity: 0, scale: 0.5 }, { opacity: 0.9, scale: 1.4, duration: 0.4 }, start);
      tl.to(el,    { opacity: 0, duration: 0.3 }, start + 0.4);
    });
    scene.querySelectorAll(".fx.color-flash-accent").forEach((el) => {
      tl.fromTo(el, { opacity: 0 }, { opacity: 0.6, duration: 0.1 }, start);
      tl.to(el,    { opacity: 0, duration: 0.4 }, start + 0.1);
    });
  });

  // Sync timeline with audio
  const audio = stage.querySelector("audio");
  audio.addEventListener("play", () => tl.play());
  audio.addEventListener("pause", () => tl.pause());
  audio.addEventListener("seeked", () => tl.seek(audio.currentTime));

  // Auto-start on load (HyperFrames render mode usually triggers play)
  window.addEventListener("load", () => {
    audio.play().catch(() => {/* autoplay blocked in browser, fine for headless render */});
    tl.play();
  });
})();
```

**Note:** Spec section 7.4 mentions `screen-shake-light` effect — not implemented above. Add to animations.js if the engineer wants it, or remove from the schema enum to avoid silent dead-letters. **Decision: leave in enum, ignore in render** for MVP (effect is optional per scene). Document this in code comment if removed.

- [ ] **Step 5: Commit (no test for templates — they're tested via composer snapshot)**

```bash
git add .
git commit -m "feat: HTML/CSS/JS render templates with Ken Burns and GSAP timeline"
```

---

## Task 9: HTML composer

**Files:**
- Create: `src/render/html-composer.ts`, `src/render/html-composer.test.ts`

- [ ] **Step 1: Failing test `src/render/html-composer.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { composeHtml } from "./html-composer.js";
import type { Script } from "./script-schema.js";

describe("composeHtml", () => {
  it("produces deterministic HTML for sample script with image", () => {
    const script = JSON.parse(readFileSync("tests/fixtures/sample-script-with-image.json", "utf8")) as Script;
    const sceneAudio = [
      { id: "hook",   durationSec: 3.2 },
      { id: "body-1", durationSec: 11.5 },
      { id: "body-2", durationSec: 10.8 },
      { id: "body-3", durationSec: 12.1 },
      { id: "outro",  durationSec: 3.4 },
    ];
    const html = composeHtml({
      script,
      sceneAudio,
      gapSec: 0.3,
      bgImageRelPath: "images/bg.jpg",
      audioRelPath: "voice.mp3",
    });

    expect(html).toContain('id="stage"');
    expect(html).toContain('data-composition-id="news-video"');
    expect(html).toContain('data-width="1080"');
    expect(html).toContain('data-height="1920"');
    expect(html).toContain('class="bg kb-zoom-in"');
    expect(html).toContain("background-image: url('images/bg.jpg')");
    expect(html).toContain('class="line style-hook-large emp-primary"');
    expect(html).toContain("data-animation=\"scale-pop\"");
    expect(html).toContain('class="bg gradient-outro-purple"');
    expect(html).toContain("Theo dõi để xem bản tin mới mỗi ngày");
    expect(html).toContain('src="voice.mp3"');
    expect(html).toMatch(/data-duration="[\d.]+"/);
  });

  it("falls back to gradient when bgImageRelPath is null but type=image", () => {
    const script = JSON.parse(readFileSync("tests/fixtures/sample-script-with-image.json", "utf8")) as Script;
    const sceneAudio = script.scenes.map((s) => ({ id: s.id, durationSec: 5 }));
    const html = composeHtml({
      script,
      sceneAudio,
      gapSec: 0.3,
      bgImageRelPath: null,
      audioRelPath: "voice.mp3",
    });
    expect(html).toContain('class="bg gradient-news-dark"');  // fallback preset
    expect(html).not.toContain("background-image: url");
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test src/render/html-composer.test.ts
```

- [ ] **Step 3: Implement `src/render/html-composer.ts`**

```ts
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Script } from "./script-schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "templates");

export interface SceneAudio {
  id: string;
  durationSec: number;
}

export interface ComposeArgs {
  script: Script;
  sceneAudio: SceneAudio[];
  gapSec: number;
  bgImageRelPath: string | null;   // null => fallback gradient
  audioRelPath: string;
}

export function composeHtml(args: ComposeArgs): string {
  const { script, sceneAudio, gapSec, bgImageRelPath, audioRelPath } = args;

  // Compute timing per scene
  let cursor = 0;
  const timing = script.scenes.map((scene) => {
    const audio = sceneAudio.find((a) => a.id === scene.id);
    if (!audio) throw new Error(`No audio entry for scene id=${scene.id}`);
    const dur = audio.durationSec + gapSec;
    const start = cursor;
    cursor += dur;
    return { scene, start, duration: dur };
  });
  const totalDuration = cursor;

  const sceneHtml = timing.map(({ scene, start, duration }) =>
    renderScene(scene, start, duration, bgImageRelPath)
  ).join("\n");

  const tpl = readFileSync(join(TPL_DIR, "base.html.tmpl"), "utf8");
  return tpl
    .replace("{{TITLE}}", escapeHtml(script.metadata.title))
    .replace(/\{\{TOTAL_DURATION\}\}/g, totalDuration.toFixed(2))
    .replace("{{SCENES}}", sceneHtml)
    .replace(/src="voice\.mp3"/g, `src="${audioRelPath}"`);
}

function renderScene(scene: Script["scenes"][number], start: number, duration: number, bgImage: string | null): string {
  const bg = renderBackground(scene.visual.background, bgImage);
  const overlay = scene.visual.overlay
    ? `<div class="overlay" style="opacity: ${scene.visual.overlay.darkness}"></div>`
    : "";
  const text = renderText(scene.visual.text);
  const fx = (scene.visual.effects ?? []).map((e) => `<div class="fx ${e}"></div>`).join("");

  return `
<div class="scene" id="scene-${scene.id}"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-active="0">
  ${bg}
  ${overlay}
  ${text}
  ${fx}
</div>`.trim();
}

function renderBackground(bg: Script["scenes"][number]["visual"]["background"], imagePath: string | null): string {
  if (bg.type === "image") {
    if (!imagePath) {
      return `<div class="bg gradient-news-dark"></div>`;
    }
    const kb = bg.kenBurns.replace(/-slow$/, "").replace("-", "-");  // pan-left-slow → pan-left
    const kbClass = `kb-${kb}`;
    return `<div class="bg ${kbClass}" style="background-image: url('${imagePath}')"></div>`;
  } else {
    return `<div class="bg gradient-${bg.preset}"></div>`;
  }
}

function renderText(text: Script["scenes"][number]["visual"]["text"]): string {
  const lines = text.lines.map((l) =>
    `<span class="line style-${text.style} emp-${l.emphasis}" data-animation="${l.animation}">${escapeHtml(l.content)}</span>`
  ).join("\n");
  return `<div class="text-block pos-${text.position}">\n${lines}\n</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
```

- [ ] **Step 4: Run + commit**

```bash
npm test src/render/html-composer.test.ts
git add .
git commit -m "feat: HTML composer from script.json + scene timing"
```

---

## Task 10: Hyperframes runner

**Files:**
- Create: `src/render/hyperframes-runner.ts`

No unit test — integration tested by full pipeline smoke test.

- [ ] **Step 1: Implement `src/render/hyperframes-runner.ts`**

```ts
import { spawn } from "node:child_process";
import { log } from "../utils/logger.js";

export interface RenderArgs {
  compositionPath: string;     // path to composition.html
  outputPath: string;          // path for .mp4
  width?: number;
  height?: number;
  fps?: number;
}

export async function renderWithHyperframes(args: RenderArgs): Promise<void> {
  const { compositionPath, outputPath, width = 1080, height = 1920, fps = 30 } = args;

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("npx", [
      "hyperframes", "render", compositionPath,
      "--output", outputPath,
      "--width", String(width),
      "--height", String(height),
      "--fps", String(fps),
    ], { stdio: ["ignore", "inherit", "inherit"], shell: true });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`hyperframes render failed with exit code ${code}`));
    });
    proc.on("error", reject);
  });

  log.info(`Rendered: ${outputPath}`);
}
```

**⚠️ Note:** The `--output --width --height --fps` flag names are guesses. Engineer must verify with `npx hyperframes render --help` and adjust. If hyperframes uses positional args or different flag names, update this function.

- [ ] **Step 2: Verify hyperframes CLI**

```bash
npx hyperframes render --help
```

Read the output, update flag names if needed. Commit:

```bash
git add .
git commit -m "feat: hyperframes render runner"
```

---

## Task 11: Pipeline orchestrator + CLI entry

**Files:**
- Create: `src/pipeline.ts`, `src/cli.ts`

- [ ] **Step 1: Implement `src/pipeline.ts`**

```ts
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join, dirname, isAbsolute } from "node:path";
import { existsSync } from "node:fs";
import pLimit from "p-limit";
import { ScriptSchema, type Script } from "./render/script-schema.js";
import { loadConfig } from "./config.js";
import { LucylabClient } from "./tts/lucylab-client.js";
import { fetchImage } from "./assets/image-fetcher.js";
import { getDurationSec, concatWithSilence } from "./assets/audio-tools.js";
import { composeHtml } from "./render/html-composer.js";
import { renderWithHyperframes } from "./render/hyperframes-runner.js";
import { log } from "./utils/logger.js";

const TOTAL_STEPS = 8;
const DURATION_MIN_SEC = 48;
const DURATION_MAX_SEC = 72;
const SCENE_GAP_SEC = 0.3;

export async function runPipeline(scriptPath: string): Promise<void> {
  const cfg = loadConfig();
  const outputDir = dirname(scriptPath);
  log.info(`Output directory: ${outputDir}`);

  // STEP 1
  log.step(1, TOTAL_STEPS, "Load env + validate script.json");
  const raw = JSON.parse(await readFile(scriptPath, "utf8"));
  // Substitute env placeholder before validation
  if (raw.voice?.voiceId === "${VIETNAMESE_VOICEID}") {
    raw.voice.voiceId = cfg.voiceId;
  }
  const script: Script = ScriptSchema.parse(raw);

  // STEP 2
  log.step(2, TOTAL_STEPS, "Write script.txt for CapCut");
  const fullText = script.scenes.map((s) => s.voiceText).join("\n\n");
  await writeFile(join(outputDir, "script.txt"), fullText);

  // STEP 3 + 4 in parallel
  log.step(3, TOTAL_STEPS, "Fetch og:image (parallel) + Step 4 TTS");
  const imgPath = join(outputDir, "images", "bg.jpg");
  const imgPromise = fetchImage(script.metadata.source.image, imgPath);

  // STEP 4
  const ttsClient = new LucylabClient(cfg);
  const limit = pLimit(cfg.ttsConcurrency);
  const voiceDir = join(outputDir, "voice");
  await mkdir(voiceDir, { recursive: true });

  const sceneAudioPromises = script.scenes.map((scene) =>
    limit(async () => {
      const out = join(voiceDir, `scene-${scene.id}.mp3`);
      log.info(`  TTS scene ${scene.id} (${scene.voiceText.length} chars)...`);
      await ttsClient.generate(scene.voiceText, out);
      const dur = await getDurationSec(out);
      log.info(`  ✓ scene ${scene.id}: ${dur.toFixed(2)}s`);
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
  } else {
    log.warn(`Background image fetch failed: ${imgResult.reason} → using gradient fallback`);
  }

  // STEP 5
  log.step(5, TOTAL_STEPS, "Concat voice scenes with 0.3s silence");
  const voiceMp3 = join(outputDir, "voice.mp3");
  await concatWithSilence(sceneAudio.map((a) => a.path), SCENE_GAP_SEC, voiceMp3);
  const totalAudioSec = await getDurationSec(voiceMp3);
  log.info(`  voice.mp3 total: ${totalAudioSec.toFixed(2)}s`);
  if (totalAudioSec < DURATION_MIN_SEC || totalAudioSec > DURATION_MAX_SEC) {
    log.warn(`Total duration ${totalAudioSec.toFixed(1)}s outside [${DURATION_MIN_SEC}, ${DURATION_MAX_SEC}]s tolerance — proceeding anyway`);
  }

  // STEP 6
  log.step(6, TOTAL_STEPS, "Compose HTML");
  const html = composeHtml({
    script,
    sceneAudio: sceneAudio.map((a) => ({ id: a.id, durationSec: a.durationSec })),
    gapSec: SCENE_GAP_SEC,
    bgImageRelPath,
    audioRelPath: "voice.mp3",
  });
  const compositionPath = join(outputDir, "composition.html");
  await writeFile(compositionPath, html);

  // Copy templates next to composition (so relative paths resolve)
  const tplSrc = new URL("./render/templates/", import.meta.url).pathname;
  const tplStyles = isAbsolute(tplSrc) ? tplSrc : tplSrc.replace(/^\/+/, "");
  await copyFile(join(tplStyles, "styles.css"),    join(outputDir, "styles.css"));
  await copyFile(join(tplStyles, "animations.js"), join(outputDir, "animations.js"));

  // STEP 7
  log.step(7, TOTAL_STEPS, "Render with hyperframes");
  const videoPath = join(outputDir, "video.mp4");
  await renderWithHyperframes({ compositionPath, outputPath: videoPath });

  // STEP 8
  log.step(8, TOTAL_STEPS, "Done");
  console.log("\n=== Result ===");
  console.log(`✓ Video:  ${videoPath}`);
  console.log(`✓ Audio:  ${voiceMp3}  (cho CapCut)`);
  console.log(`✓ Script: ${join(outputDir, "script.txt")}  (cho CapCut auto-caption)`);
  console.log(`Tổng thời lượng: ${totalAudioSec.toFixed(2)}s`);
}
```

- [ ] **Step 2: Install p-limit**

```bash
npm install p-limit
```

- [ ] **Step 3: Implement `src/cli.ts`**

```ts
#!/usr/bin/env node
import { config } from "dotenv";
config({ path: ".env.local" });

import { runPipeline } from "./pipeline.js";
import { log } from "./utils/logger.js";

async function main() {
  const scriptPath = process.argv[2];
  if (!scriptPath) {
    console.error("Usage: npm run pipeline -- <path/to/script.json>");
    process.exit(2);
  }
  try {
    await runPipeline(scriptPath);
  } catch (e) {
    log.error("Pipeline failed", e);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 4: Smoke test pipeline with valid fixture (real LucyLab API call)**

This requires `.env.local` to be set with real API key. Engineer creates it from `.env.example` first:

```bash
cp .env.example .env.local
# Edit .env.local, paste real API key + voice ID
```

Then:
```bash
mkdir -p output/smoke-test
cp tests/fixtures/sample-script-with-image.json output/smoke-test/script.json
npm run pipeline -- output/smoke-test/script.json
```

Expected end state:
- `output/smoke-test/voice.mp3` (~30-60s)
- `output/smoke-test/script.txt`
- `output/smoke-test/images/bg.jpg` (or warning fallback gradient)
- `output/smoke-test/composition.html`
- `output/smoke-test/video.mp4`

Open `video.mp4` — verify visual + audio sync, 9:16 dimensions, has hook + outro.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: pipeline orchestrator + CLI entry point"
```

---

## Task 12: Skill markdown `SKILL.md`

**Files:**
- Create: `.claude/skills/create-news-video/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/create-news-video
```

- [ ] **Step 2: Write `SKILL.md`**

````markdown
---
name: create-news-video
description: Tạo video tin tức ngắn 9:16 (~60s) từ URL bài báo hoặc file .txt tiếng Việt. Trigger khi user yêu cầu tạo video tin tức, làm short news, làm bản tin video, render tin thành video, làm TikTok tin tức. Output: video.mp4 + voice.mp3 + script.txt cho CapCut.
---

# Create News Video Skill

Generate a Vietnamese 9:16 motion-graphic news video from a URL or .txt file.

## Input

Single argument: a news article URL (starts with `http://` or `https://`) OR a path to a `.txt` file.

## Workflow (MUST follow these steps in order)

### Step 1: Detect input type

- Starts with `http://` or `https://` → URL mode
- Otherwise → file mode

### Step 2: Fetch content

**URL mode:**
- Use `WebFetch` with prompt:
  ```
  Trích xuất từ trang này:
  - title (string): tiêu đề bài báo
  - content (string): nội dung chính, ~500-1500 từ
  - ogImage (string|null): URL ảnh og:image (meta og:image hoặc ảnh đầu bài)
  - domain (string): domain của URL (vd "vnexpress.net")
  Trả về JSON với 4 field trên.
  ```
- If WebFetch fails (paywall, JS-rendered, 4xx) → tell user to save content to a .txt file and pass that instead. Stop.

**File mode:**
- Use `Read` to read the .txt file
- Title = first non-empty line (strip whitespace, max 80 chars)
- Content = remaining lines joined
- ogImage = `null`
- domain = `"local"`

### Step 3: Create slug + output directory

- slug = lowercase ASCII (strip Vietnamese diacritics, đ→d), replace non-alphanumeric with `-`, trim dashes, max 40 chars
- timestamp = current local time as `YYYYMMDD-HHmm`
- outputDir = `output/<slug>-<timestamp>/`
- Use Bash: `mkdir -p <outputDir>`

### Step 4: Generate script.json

Following the schema in `docs/superpowers/specs/2026-04-29-auto-news-video-design.md` Section 4. Key rules:

**Script content (Vietnamese):**
- Total voiceText: ~150–200 words → ~55–65s spoken at speed 1.0
- Number of scenes: **5–8** (1 hook + 3–6 body + 1 outro)
- Each scene voiceText is 1-3 short sentences, văn nói (spoken style, not formal)
- Read numbers as words: "hai trăm megapixel" not "200MP", "năm nghìn" not "5000"
- No emoji, no markdown in voiceText

**Hook (most important — gets first 3 seconds of viewer attention):**
- Must contain a claim, statistic, or curious question
- NEVER generic ("Hôm nay chúng ta sẽ nói về..." is wrong)
- ALWAYS include at least 1 effect: `flash-white-3f` or `particle-burst`

**Visual rules:**
- For image scenes: `background.src = "$source.image"` (literal — CLI substitutes)
- Vary `kenBurns` across scenes (don't use `zoom-in` for every scene)
- Vary text `animation` (don't use `slide-up` for every line)
- Each line ≤ 25 characters
- Each scene 1-3 lines

**Outro (always fixed format):**
```json
{
  "id": "outro",
  "type": "outro",
  "voiceText": "Theo dõi Công nghệ 24h để xem bản tin mới mỗi ngày.",
  "visual": {
    "background": { "type": "gradient", "preset": "outro-purple" },
    "text": {
      "position": "center",
      "style": "outro-card",
      "lines": [
        { "content": "Theo dõi để xem bản tin mới mỗi ngày", "emphasis": "primary", "animation": "fade-in" },
        { "content": "Công nghệ 24h",                        "emphasis": "channel", "animation": "scale-pop" },
        { "content": "Nguồn: <DOMAIN>",                      "emphasis": "muted",   "animation": "fade-in-late" }
      ]
    }
  }
}
```
Replace `<DOMAIN>` with the actual domain string.

### Step 5: Self-validate before writing

Check:
- Total word count ~150-200
- Every line.content ≤ 25 chars
- 5-8 scenes total
- scenes[0].type === "hook"
- last scene type === "outro"
- All enum values valid (see spec Section 4.2)

If invalid, fix yourself silently. Up to 2 self-correction passes. After that, write anyway — the CLI's Zod validation will produce a precise error message that the user can act on.

### Step 6: Write script.json

```bash
# (Use Write tool, not Bash)
```

Write the validated JSON to `<outputDir>/script.json`.

### Step 7: Run the pipeline

Use Bash, **foreground** (not background), stream output:

```bash
npm run pipeline -- <outputDir>/script.json
```

If exit code != 0:
- Report the error message clearly
- Tell user the output dir path so they can inspect intermediate files

### Step 8: Report success

If successful, report to user with markdown links:

```markdown
✓ Video:  [video.mp4](output/<slug>-<timestamp>/video.mp4)
✓ Audio:  [voice.mp3](output/<slug>-<timestamp>/voice.mp3) — for CapCut
✓ Script: [script.txt](output/<slug>-<timestamp>/script.txt) — for CapCut auto-caption
Tổng thời lượng: XX.Xs
```

## Examples

### Example 1: URL with image (vnexpress)

User: `/create-news-video https://vnexpress.net/iphone-17-200mp`

Generated `script.json` (excerpt):
```json
{
  "version": "1.0",
  "metadata": {
    "title": "Apple ra mắt iPhone 17 với camera 200MP",
    "source": {
      "url": "https://vnexpress.net/iphone-17-200mp",
      "domain": "vnexpress.net",
      "image": "https://i1-vnexpress.vnecdn.net/iphone17.jpg"
    },
    "channel": "Công nghệ 24h"
  },
  "voice": { "provider": "lucylab", "voiceId": "${VIETNAMESE_VOICEID}", "speed": 1.0 },
  "scenes": [
    {
      "id": "hook", "type": "hook",
      "voiceText": "Apple vừa ra mắt iPhone 17 với camera hai trăm megapixel.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "zoom-in" },
        "overlay":    { "darkness": 0.4 },
        "text": {
          "position": "center", "style": "hook-large",
          "lines": [
            { "content": "iPhone 17",     "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Camera 200MP!", "emphasis": "accent",  "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f", "particle-burst"]
      }
    }
    /* ... 3 body scenes + outro ... */
  ]
}
```

### Example 2: .txt file with no image (local)

User: `/create-news-video news/agi-update.txt`

Generated `script.json` (excerpt):
```json
{
  "metadata": {
    "title": "OpenAI công bố mô hình mới với khả năng lập luận",
    "source": { "url": "local", "domain": "local", "image": null },
    "channel": "Công nghệ 24h"
  },
  "scenes": [
    {
      "id": "hook", "type": "hook",
      "voiceText": "OpenAI vừa công bố mô hình mới có khả năng lập luận như con người.",
      "visual": {
        "background": { "type": "gradient", "preset": "news-dark" },
        "text": {
          "position": "center", "style": "hook-large",
          "lines": [
            { "content": "Mô hình mới", "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Lập luận!",  "emphasis": "accent",  "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f"]
      }
    }
    /* ... outro line 3 = "Nguồn: local" ... */
  ]
}
```
Note: when source has no image, every scene uses `background.type = "gradient"` (no image fallback at composer level needed).

## Edge cases

| Situation | Action |
|---|---|
| URL paywall / JS-rendered → WebFetch returns no content | Tell user: "Không đọc được URL (có thể do paywall hoặc JS). Hãy lưu nội dung vào file .txt rồi gọi lại." Stop. |
| URL content < 200 words | Warn "Tin gốc ngắn, video có thể không đủ chất liệu", continue anyway |
| URL content > 2000 words | Summarize to key points, fit ~150-200 words script |
| File mode + file empty/missing | Error message, don't create output dir |
| Pipeline fails | Report error message + output dir path; user can re-try `npm run pipeline -- <path>` after fixing |
````

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/
git commit -m "feat: SKILL.md for /create-news-video Claude Code skill"
```

---

## Task 13: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# Auto News Video

Tạo video tin tức ngắn 9:16 (~60s) tiếng Việt cho TikTok/YouTube Shorts/Reels từ URL bài báo hoặc file .txt.

## Yêu cầu

- Node.js ≥ 22
- ffmpeg + ffprobe trong PATH
- Chrome/Chromium (cho HyperFrames render)
- Tài khoản LucyLab.io (lấy `VIETNAMESE_API_KEY` + `VIETNAMESE_VOICEID`)
- Claude Code CLI (để chạy skill)

## Setup (1 lần)

```bash
npm install
cp .env.example .env.local
# Edit .env.local, paste your real API key + voice ID
```

Verify:
```bash
node --version    # ≥ 22
ffmpeg -version   # any modern version
ffprobe -version
npm test          # all tests pass
```

## Sử dụng

Trong Claude Code:

```
/create-news-video https://vnexpress.net/iphone-17-200mp
```

Hoặc với file txt:
```
/create-news-video news/my-article.txt
```

Sau ~3-5 phút (chủ yếu chờ TTS render):

```
✓ Video:  output/iphone-17-200mp-20260429-1530/video.mp4
✓ Audio:  output/iphone-17-200mp-20260429-1530/voice.mp3
✓ Script: output/iphone-17-200mp-20260429-1530/script.txt
```

Mở `video.mp4` để xem. Để thêm caption + nhạc nền: import `video.mp4` vào CapCut Pro, dùng `voice.mp3` thay nếu cần fine-tune audio, paste `script.txt` vào CapCut auto-caption.

## Re-run pipeline (debug)

Nếu render fail giữa chừng (giả sử do hyperframes lỗi), `script.json` đã có sẵn — chạy lại pipeline mà không cần Claude gen lại script:

```bash
npm run pipeline -- output/<slug>-<timestamp>/script.json
```

## Cấu trúc output

```
output/<slug>-<timestamp>/
├── script.json           # Input cho CLI (Claude generated)
├── script.txt            # Plain text cho CapCut auto-caption
├── images/bg.jpg         # og:image đã download (nếu có)
├── voice/scene-*.mp3     # TTS từng scene
├── voice.mp3             # Concat voice (cho CapCut)
├── composition.html      # HyperFrames composition (debug)
└── video.mp4             # Output cuối
```

## Testing

```bash
npm test                 # unit tests
npm run test:watch       # watch mode
```

## Troubleshooting

- **"VIETNAMESE_API_KEY missing"**: Check `.env.local` exists và có giá trị
- **"hyperframes render failed"**: Run `npx hyperframes render --help` to verify CLI flags. Check Chrome/Chromium installed.
- **TTS timeout**: Increase `LUCYLAB_POLL_TIMEOUT_MS` in `.env.local` (default 120000ms = 2min)
- **Tổng duration ngoài [48s, 72s]**: Re-trigger skill, hoặc chỉnh script.json thủ công rồi chạy lại pipeline

## Roadmap (post-MVP)

- Caption burned-in (forced alignment with whisper)
- Background music auto-selection
- Multi-news compilation mode
- AI-generated images (Flux/Stable Diffusion fallback)
- Auto-upload TikTok/YouTube Shorts/Reels
- Logo overlay
- Multi-language support
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with setup, usage, and troubleshooting"
```

---

## Task 14: End-to-end manual smoke test

This task is verification, not new code.

- [ ] **Step 1: Verify all unit tests pass**

```bash
npm test
# Expected: all tests pass (config, schema, slug, lucylab-client, image-fetcher, audio-tools, html-composer)
```

- [ ] **Step 2: Verify Claude Code recognizes the skill**

In Claude Code (in this project):
```
/create-news-video --help
```

Or just:
```
/create-news-video
```

Claude should recognize the skill and ask for an argument.

- [ ] **Step 3: Real URL test**

Pick a recent tin tức công nghệ from vnexpress, dantri, or genk:

```
/create-news-video https://vnexpress.net/<some-current-article>
```

Watch the 8 step output. Verify:
- Step 1-2 complete fast (validation, script.txt)
- Step 3-4 take 30s-2min (TTS, image fetch)
- Step 5 quick (concat)
- Step 6 quick (HTML compose)
- Step 7 takes 30s-2min (hyperframes render)
- Step 8 prints paths

- [ ] **Step 4: Open the generated video**

```bash
# Windows
start output/<slug>-<timestamp>/video.mp4
# or just open in any player
```

Visual verification:
- 9:16 ratio (1080×1920)
- Voice tiếng Việt khớp với visual
- Hook hấp dẫn 3s đầu (effect flash hoặc particle)
- Background animation (Ken Burns hoặc gradient)
- Text animations đa dạng
- Outro card có "Công nghệ 24h" + "Nguồn: <domain>"

- [ ] **Step 5: File mode test**

Create `tests/fixtures/sample-news.txt`:
```
OpenAI công bố mô hình mới với khả năng lập luận

OpenAI vừa giới thiệu mô hình AI mới nhất có khả năng giải quyết các bài toán lập luận phức tạp. Mô hình này được huấn luyện trên một tập dữ liệu khổng lồ và sử dụng kỹ thuật học tăng cường để cải thiện độ chính xác. Trong các bài kiểm tra benchmark, mô hình đạt 95% điểm số ở các tác vụ toán học và lập luận logic, vượt qua các đối thủ hiện tại.
```

Run:
```
/create-news-video tests/fixtures/sample-news.txt
```

Verify:
- Output dir created with sane slug
- Background uses gradient (no image)
- Outro shows "Nguồn: local"

- [ ] **Step 6: Update todo list state + final commit**

```bash
git add .
git commit -m "test: end-to-end smoke verified with real URL + txt input" --allow-empty
```

If any issue surfaced, file an issue note in `docs/known-issues.md` (don't fix in MVP unless blocking).

---

## Roadmap notes (NOT in MVP — for future iterations)

| Feature | When | Reason |
|---|---|---|
| Caption burned-in | After getting first videos out | Need forced alignment (whisper) — extra dependency |
| BGM auto-select by mood | Once user has 5-10 videos and wants more polish | Need royalty-free track library + ducking |
| AI-gen images | When user notices many articles lack good og:image | Cost + slower; Flux/SD via Replicate |
| Multi-news digest | When user wants daily roundup videos | Different script structure (1-line per item) |
| Auto-upload | When user has TikTok/YT API keys | Heavy lift, separate project |
| Logo overlay | After channel branding established | Just a CSS/asset addition |
| Web UI | If user wants to share with non-technical team | Add Express/Fastify wrapper around CLI |

---

## Self-Review Notes (post-write)

After writing, performed checks:
- ✅ Spec coverage: every spec section maps to a task (config→T3, schema→T2, TTS→T5, image→T6, audio→T7, templates→T8, composer→T9, runner→T10, pipeline→T11, skill→T12, README→T13, smoke→T14)
- ✅ No "TBD/TODO/fill in later" placeholders in any task
- ✅ Pre-work flags on T5 (LucyLab API verify) and T8/T10 (hyperframes verify) — explicit warnings to verify before implementing
- ✅ Type names consistent across tasks (`Script`, `Config`, `SceneAudio`, `FetchResult`)
- ✅ Function names consistent (`composeHtml`, `runPipeline`, `loadConfig`, `fetchImage`, `getDurationSec`, `concatWithSilence`, `generate` on LucylabClient)
- ✅ Total ~14 tasks, each with explicit files/code/commands
