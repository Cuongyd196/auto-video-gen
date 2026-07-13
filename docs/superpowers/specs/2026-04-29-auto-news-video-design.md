# Auto News Video — Design Specification

**Date:** 2026-04-29
**Status:** Approved (MVP)
**Channel:** Công nghệ 24h

---

## 1. Mục tiêu & phạm vi

Xây dựng hệ thống tạo video tin tức ngắn 9:16 (~60s, tolerance 48–72s) tiếng Việt, render dạng motion graphic, phục vụ đăng tải lên TikTok/YouTube Shorts/Reels.

**Đầu vào:** 1 URL bài báo HOẶC 1 file `.txt` chứa nội dung tin.
**Đầu ra:** 1 thư mục chứa `video.mp4` (không sub, không nhạc nền) + `voice.mp3` + `script.txt` để import vào CapCut Pro thêm caption + nhạc.

**Không thuộc MVP:**
- Caption burned-in (CapCut xử lý)
- Background music (CapCut xử lý)
- Multi-news compilation
- AI-generated images
- Auto-upload platform
- Multiple voice IDs / mood selection
- Web UI / standalone CLI ngoài Claude Code
- Đa ngôn ngữ
- Logo overlay / analytics / A/B testing

## 2. Quyết định kiến trúc cốt lõi

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Ngôn ngữ MVP | Chỉ tiếng Việt | Scope nhỏ, tránh phức tạp font/TTS đa ngôn ngữ |
| TTS provider | LucyLab.io (JSON-RPC async) | User đã có account + voice cloning chất lượng |
| Render engine | HyperFrames (HTML+GSAP+Puppeteer+FFmpeg) | Native vertical video, agent-friendly, deterministic |
| Invocation | Claude Code skill | Tự nhiên với hyperframes (cũng skill-based), tận dụng LLM cho kịch bản |
| Phân vai | Skill (creative) + Node CLI (deterministic) | LLM viết script + CLI gọi API/render — đúng strength mỗi bên |
| Visual style | Ảnh bài báo + Ken Burns + GSAP animation đa dạng | Hấp dẫn hơn kinetic typography, đơn giản hơn newscaster template |
| Caption | Bỏ khỏi pipeline | User add bằng CapCut auto-caption (đẹp hơn) |
| BGM | Bỏ khỏi pipeline | User add bằng CapCut (thư viện bản quyền) |
| Ảnh nguồn | Auto từ `og:image`, fallback gradient | Đa số bài báo VN có og:image; gradient cho file txt |
| Outro | 3s card cố định | "Theo dõi để xem bản tin mới mỗi ngày" + "Công nghệ 24h" + "Nguồn: <domain>" |

## 3. Kiến trúc tổng quan

```
USER (Claude Code)
  │  /create-news-video <url|file>
  ▼
SKILL (Claude làm "creative work")
  ├─ WebFetch URL hoặc Read file txt
  ├─ Phân tích nội dung tiếng Việt
  ├─ Sinh script.json theo schema cố định
  ├─ Lưu vào output/<slug>-<timestamp>/script.json
  └─ Chạy: npm run pipeline -- <path>
  │
  ▼
NODE CLI (deterministic, có test)
  ├─ Validate script.json (Zod)
  ├─ Fetch og:image → images/bg.jpg (parallel với TTS)
  ├─ Per-scene TTS: LucyLab ttsLongText → poll → download mp3
  ├─ Concat scene mp3 + 0.3s silence → voice.mp3
  ├─ Compose HTML (template + scenes + animations)
  ├─ Spawn `npx hyperframes render` → video.mp4
  └─ Print summary
```

**Hai ranh giới interface:**

1. **Skill ↔ CLI:** hợp đồng là `script.json` schema. Đổi cách viết script không phá CLI; đổi engine render không phá skill.
2. **CLI ↔ HyperFrames:** hợp đồng là `composition.html` + assets paths.

## 4. Schema `script.json`

### 4.1. Cấu trúc

```json
{
  "version": "1.0",
  "metadata": {
    "title": "Apple ra mắt iPhone 17 với camera 200MP",
    "source": {
      "url": "https://vnexpress.net/...",
      "domain": "vnexpress.net",
      "image": "https://i1-vnexpress.vnecdn.net/.../iphone17.jpg"
    },
    "channel": "Công nghệ 24h"
  },
  "voice": {
    "provider": "lucylab",
    "voiceId": "${VIETNAMESE_VOICEID}",
    "speed": 1.0
  },
  "scenes": [
    {
      "id": "hook",
      "type": "hook",
      "voiceText": "Apple vừa ra mắt iPhone 17 với camera hai trăm megapixel.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "zoom-in" },
        "overlay":    { "darkness": 0.4 },
        "text": {
          "position": "center",
          "style": "hook-large",
          "lines": [
            { "content": "iPhone 17",     "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Camera 200MP!", "emphasis": "accent",  "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f", "particle-burst"]
      }
    },
    { "id": "body-1", "type": "body", "voiceText": "...", "visual": { /* ... */ } },
    { "id": "body-2", "type": "body", "voiceText": "...", "visual": { /* ... */ } },
    { "id": "body-3", "type": "body", "voiceText": "...", "visual": { /* ... */ } },
    {
      "id": "outro",
      "type": "outro",
      "voiceText": "Theo dõi Công nghệ 24h để xem bản tin mới mỗi ngày.",
      "visual": {
        "background": { "type": "gradient", "preset": "outro-purple" },
        "text": {
          "position": "center", "style": "outro-card",
          "lines": [
            { "content": "Theo dõi để xem bản tin mới mỗi ngày", "emphasis": "primary", "animation": "fade-in" },
            { "content": "Công nghệ 24h",                        "emphasis": "channel", "animation": "scale-pop" },
            { "content": "Nguồn: vnexpress.net",                 "emphasis": "muted",   "animation": "fade-in-late" }
          ]
        }
      }
    }
  ]
}
```

### 4.2. Enum cố định (CLI fail nếu sai)

| Field | Giá trị hợp lệ |
|---|---|
| `scene.type` | `hook`, `body`, `outro` |
| `background.type` | `image`, `gradient` |
| `background.kenBurns` | `zoom-in`, `zoom-out`, `pan-left-slow`, `pan-right-slow`, `pan-up-slow`, `pan-down-slow` |
| `background.preset` (gradient) | `outro-purple`, `outro-blue`, `news-red`, `news-dark` |
| `text.position` | `center`, `top`, `bottom` |
| `text.style` | `hook-large`, `body-medium`, `body-small`, `outro-card` |
| `line.emphasis` | `primary`, `accent`, `channel`, `muted` |
| `line.animation` | `scale-pop`, `slide-up`, `slide-up-bounce`, `slide-down`, `slide-left`, `slide-right`, `fade-in`, `fade-in-late`, `typewriter` |
| `effects[]` | `flash-white-3f`, `particle-burst`, `screen-shake-light`, `color-flash-accent` |

### 4.3. Quy tắc Claude tuân thủ

- **Target khi sinh script:** ~150–200 từ tiếng Việt → ra ~55–65s khi đọc tốc độ 1.0 (target *trong lòng* khoảng tolerance 48–72s ở section 4.4)
- Số scene: **5–8** (1 hook + 3–6 body + 1 outro)
- Mỗi `line.content` **≤ 25 ký tự**
- Mỗi scene có **1–3 lines**
- `voiceText` thuần tiếng Việt, không emoji, không markdown
- Đọc số bằng chữ ("hai trăm megapixel" thay vì "200MP") khi có thể — LucyLab đọc chữ Việt chuẩn hơn ký tự
- **Hook là yếu tố quan trọng nhất** — phải có claim/số liệu/câu hỏi gây tò mò trong 3s đầu, không generic ("Hôm nay chúng ta sẽ nói về..." là sai)
- Hook luôn có ít nhất 1 effect (`flash-white-3f` hoặc `particle-burst`)
- Đa dạng `kenBurns` giữa các scene (không dùng `zoom-in` cho 5/5 scene)
- Đa dạng `animation` cho text
- Outro **luôn cố định** format 3 lines như ví dụ

### 4.4. Duration scene

CLI **không** đọc duration từ JSON. CLI tự tính sau khi TTS:
- `scene_duration = audio_duration + 0.3s` (gap nghỉ)
- Tổng phải nằm trong **[48s, 72s]** (±20% từ 60s)
- Ngoài range → log warning, **vẫn render** (user quyết định re-gen hay không)

### 4.5. Resolve placeholder trong JSON (CLI substitution)

CLI substitute các placeholder **trước khi** render HTML:

| Placeholder | Substitute thành |
|---|---|
| `$source.image` (trong `background.src`) | Local path đã tải ở Step 3, vd `images/bg.jpg`. Nếu Step 3 fail và đã đánh dấu fallback → CLI tự đổi `background.type` thành `gradient` với preset `news-dark` |
| `${VIETNAMESE_VOICEID}` (trong `voice.voiceId`) | Đọc từ env `VIETNAMESE_VOICEID`. Nếu trống → fail Step 1 |

Mọi field khác **không** support templating — Claude phải ghi giá trị literal.

## 5. Cấu trúc file/folder

```
e:/Program/auto_create_video/
├── .claude/skills/create-news-video/
│   └── SKILL.md
├── .env.local                      # gitignored
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── cli.ts                      # Entry: npm run pipeline -- <script.json>
│   ├── pipeline.ts                 # Orchestrator
│   ├── config.ts                   # Load .env.local
│   ├── tts/
│   │   ├── lucylab-client.ts
│   │   └── lucylab-client.test.ts
│   ├── assets/
│   │   ├── image-fetcher.ts
│   │   └── audio-tools.ts          # ffprobe + ffmpeg concat
│   ├── render/
│   │   ├── script-schema.ts        # Zod
│   │   ├── html-composer.ts
│   │   ├── hyperframes-runner.ts
│   │   └── templates/
│   │       ├── base.html.tmpl
│   │       ├── styles.css
│   │       └── animations.js
│   └── utils/
│       ├── slug.ts
│       └── logger.ts
├── output/                         # gitignored
│   └── <slug>-<YYYYMMDD-HHmm>/
│       ├── script.json
│       ├── script.txt
│       ├── images/bg.jpg
│       ├── voice/scene-*.mp3
│       ├── voice.mp3
│       ├── composition.html
│       └── video.mp4
├── tests/fixtures/sample-script.json
└── docs/superpowers/specs/
    └── 2026-04-29-auto-news-video-design.md
```

### 5.1. HyperFrames integration

`hyperframes` cài làm dev dependency. CLI gọi:

```bash
npx hyperframes render output/<slug>/composition.html \
  --output output/<slug>/video.mp4 \
  --width 1080 --height 1920 --fps 30
```

Nếu HyperFrames yêu cầu init project structure cố định, sẽ có `scripts/setup.sh` chạy 1 lần đầu để cài.

## 6. Pipeline flow chi tiết

```
Step 1. Load env & validate
  - Load .env.local; check VIETNAMESE_API_KEY, VIETNAMESE_VOICEID
  - Read script.json; validate qua Zod schema
  - FAIL FAST nếu sai (in path field cụ thể)

Step 2. Write script.txt
  - Concat tất cả scenes[].voiceText → output/<slug>/script.txt

Step 3. Fetch background image (parallel với Step 4)
  - Tải metadata.source.image → images/bg.jpg
  - Validate mime + tối thiểu 720px chiều ngắn
  - Fail → warning + đánh dấu fallback gradient cho mọi scene type=image

Step 4. TTS từng scene (max 3 concurrent)
  - Mỗi scene: ttsLongText → poll getExportStatus mỗi 2s, max 120s → download
    (120s vì voiceText scene dài nhất ~15s audio, TTS render thường < 60s
     nhưng để buffer 2x cho an toàn)
  - Retry 3 lần với exponential backoff (1s, 2s, 4s) khi network/5xx
  - Sau khi xong: ffprobe → biết audio_duration

Step 5. Concat voice
  - ffmpeg concat scene-hook.mp3 + 0.3s silence + scene-body-1.mp3 + ... → voice.mp3
  - Tổng duration kiểm tra [48s, 72s], log warning nếu lệch

Step 6. Compose HTML
  - Load base.html.tmpl + styles.css + animations.js
  - Per scene generate <div data-start data-duration> chứa:
      Background (image+kenBurns CSS hoặc gradient)
      Overlay (darkness)
      Text divs (1 div / line, class theo emphasis + data-animation)
      Effect divs
  - <audio data-start="0" src="voice.mp3" />
  - Stage: <div id="stage" data-composition-id="news-video" data-width="1080" data-height="1920" data-fps="30">
  - Ghi composition.html

Step 7. Render với hyperframes
  - Spawn npx hyperframes render
  - Stream stdout/stderr → logger
  - Giữ nguyên intermediate file nếu fail (debug)

Step 8. Summary
  ✓ Video:   output/<slug>/video.mp4 (XXs, 1080×1920, X.X MB)
  ✓ Audio:   output/<slug>/voice.mp3 (cho CapCut)
  ✓ Script:  output/<slug>/script.txt (cho CapCut auto-caption)
```

### 6.1. Error handling matrix

| Lỗi | Hành động |
|---|---|
| Schema script.json sai | Fail Step 1 với path field cụ thể |
| Thiếu env var | Fail Step 1, hướng dẫn copy `.env.example` |
| `og:image` 404 / không phải ảnh | Step 3 warning, fallback gradient |
| LucyLab API timeout/5xx | Retry 3 lần (1s, 2s, 4s) → fail Step 4 với scene id |
| Poll quá 120s | Fail scene đó, in exportId để debug thủ công |
| Voice tổng duration ngoài [48s,72s] | Warning, vẫn render |
| Hyperframes render fail | Fail Step 7, giữ intermediate file |
| Image valid nhưng <720px | Warning, vẫn dùng |

## 7. Behavior của Skill `/create-news-video`

### 7.1. Frontmatter

```markdown
---
name: create-news-video
description: Tạo video tin tức ngắn 9:16 (~60s) từ URL bài báo hoặc file .txt. Trigger khi user yêu cầu tạo video tin tức, làm short news, render tin thành video. Output: video.mp4 + voice.mp3 + script.txt (cho CapCut).
---
```

### 7.2. Workflow

```
INPUT: 1 argument — URL hoặc đường dẫn .txt

STEP 1. Detect: bắt đầu http(s):// → URL mode; còn lại → file mode.

STEP 2. Fetch content
  URL mode:
    - WebFetch với prompt: "Trích tiêu đề, nội dung chính, og:image, domain.
      Trả JSON {title, content, ogImage, domain}."
    - Fail (paywall/JS-rendered) → báo user và dừng
  File mode:
    - Read file txt
    - Tự suy luận title từ dòng đầu
    - ogImage = null, domain = "local"

STEP 3. Tạo slug + output dir
  - slug = ascii-fold(title) → kebab-case → cắt 40 ký tự
  - timestamp = YYYYMMDD-HHmm (giờ local)
  - mkdir output/<slug>-<timestamp>/

STEP 4. Phân tích & sinh script.json (theo Section 4 schema + rules)
  - Hook: claim/số liệu/câu hỏi gây tò mò, có effect
  - Body 3-6 scene, mỗi scene 1 ý chính, văn nói, đọc số bằng chữ
  - Outro fixed 3 lines

STEP 5. Self-validate trước khi ghi
  - Khớp schema, ~150-200 từ tổng, mỗi line ≤25 ký tự
  - Tự sửa nếu sai, không hỏi user
  - Nếu sau 2 lần sửa vẫn không đạt → ghi script.json ra anyway
    (CLI sẽ fail Step 1 với message rõ ràng → user nhìn lỗi quyết định)

STEP 6. Ghi script.json vào output dir

STEP 7. Bash: npm run pipeline -- output/<slug>-<timestamp>/script.json
  - Chạy foreground (sync, KHÔNG background) — user đang chờ kết quả
  - Stream output để user thấy progress 8 step
  - Fail → in lỗi cuối + path output dir để debug

STEP 8. Báo cáo cho user
  ✓ Video, ✓ Audio, ✓ Script + tổng duration
```

### 7.3. Examples trong skill body

Skill kèm **2 example script.json hoàn chỉnh**:
- 1 cho URL có ảnh (vnexpress demo)
- 1 cho txt không ảnh (gradient fallback)

Để Claude reference khi sinh — quan trọng cho consistency output.

### 7.4. Edge cases

| Tình huống | Skill làm |
|---|---|
| URL paywall | Báo "không đọc được, hãy lưu nội dung vào txt" |
| Nội dung gốc <200 từ | Cảnh báo "tin quá ngắn", vẫn tiếp tục |
| Nội dung gốc >2000 từ | Tự rút gọn còn ý chính ra ~60s |
| File txt rỗng/không tồn tại | Báo lỗi, không tạo dir |
| Pipeline fail | Báo lỗi cụ thể + path output dir |

## 8. Testing strategy

| Module | Test | Mục đích |
|---|---|---|
| `script-schema.ts` (Zod) | Unit | Reject script sai (5-6 invalid fixture) |
| `lucylab-client.ts` | Unit (mock HTTP) | Happy path + retry + poll timeout |
| `audio-tools.ts` | Integration | ffprobe + concat thực với mp3 fixture |
| `image-fetcher.ts` | Unit (mock HTTP) | Mime check, size check, fallback |
| `html-composer.ts` | Snapshot | script.json fixed → composition.html khớp snapshot |
| End-to-end | Manual smoke | 1 lần với URL thật, mắt người check |

**KHÔNG test:** LucyLab live API (tốn tiền/flaky), hyperframes binary output, nội dung script Claude sinh (creative).

## 9. Definition of Done — MVP

1. Setup 1 lần: `npm install`, copy `.env.example` → `.env.local`, fill API key
2. Trong Claude Code chạy `/create-news-video https://vnexpress.net/<bài-bất-kỳ>`
3. < 5 phút sau có `video.mp4` 9:16, voice tiếng Việt khớp visual, có hook hấp dẫn 3s đầu, có outro card đúng format
4. Toàn bộ unit test pass
5. README có hướng dẫn setup + usage cơ bản

## 10. Bảo mật

- API key (`VIETNAMESE_API_KEY`) **chỉ** lưu trong `.env.local` (gitignored)
- `.env.example` chỉ chứa key name, không có giá trị
- Không log API key ra stdout/file
- Không commit `output/` (có thể chứa nội dung tin nhạy cảm)

## 11. Câu hỏi để mở (sẽ giải quyết trong implementation plan)

- Cấu hình hyperframes init: project gốc có cần là hyperframes project không, hay tự generate composition.html standalone?
- Hyperframes có hỗ trợ animation effects (`flash-white-3f`, `particle-burst`) sẵn không, hay cần tự code GSAP?
- Định dạng request/response chính xác của LucyLab `ttsLongText` và `getExportStatus` (sẽ test smoke khi implement)?
- Tốc độ TTS speed=1.0 có cho ra ~150-200 từ/60s tiếng Việt? Cần đo thực tế và hiệu chỉnh nếu cần.
