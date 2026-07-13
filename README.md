<a id="top"></a>

<div align="center">

# 🎬 Auto Video Gen

### Biến bài báo tiếng Việt/URL repo Github thành video 9:16 TikTok/Reels/Shorts

**Một câu lệnh. Không cần edit. Chất lượng motion graphic studio.**

[![Stars](https://img.shields.io/github/stars/Cuongyd196/auto-video-gen?style=for-the-badge&logo=github&color=yellow)](https://github.com/Cuongyd196/auto-video-gen/stargazers)
[![Forks](https://img.shields.io/github/forks/Cuongyd196/auto-video-gen?style=for-the-badge&logo=github&color=blue)](https://github.com/Cuongyd196/auto-video-gen/network/members)
[![License](https://img.shields.io/github/license/Cuongyd196/auto-video-gen?style=for-the-badge&color=green)](LICENSE)
[![Node](https://img.shields.io/badge/node-22%2B-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[**🇬🇧 English**](README.en.md) · [**🇻🇳 Tiếng Việt**](README.md) · [**📺 Xem Demo**](https://youtube.com/shorts/X8P_5tsHy4o) · [**🚀 Bắt Đầu Nhanh**](#-bắt-đầu-nhanh) · [**❓ FAQ**](#-faq)

</div>

---

<div align="center">

## 🎥 Xem Demo Sản Phẩm

| 🕸️ CodeGraph | 🖥️ OpenScreen |
|-------------------|---------------------|
| [![CodeGraph Demo](https://img.youtube.com/vi/X8P_5tsHy4o/0.jpg)](https://youtube.com/shorts/X8P_5tsHy4o) | [![OpenScreen Demo](https://img.youtube.com/vi/5noesbFXK0k/0.jpg)](https://youtube.com/shorts/5noesbFXK0k) |
| [Xem trên YouTube](https://youtube.com/shorts/X8P_5tsHy4o) | [Xem trên YouTube](https://youtube.com/shorts/5noesbFXK0k) |

### 🎙️ Xem trên Facebook Reels và TikTok

[Xem trên Facebook](https://www.facebook.com/reel/2549425188850979) · [Xem trên TikTok](https://www.tiktok.com/@cuongit96/video/7661226482458561799)

*Video này được tạo **hoàn toàn** bằng pipeline này — Vbee TTS + HyperFrames + GSAP animations, không edit thủ công.*

</div>

---

## 🤔 Tại sao có dự án này?

Việc tạo video tin tức ngắn rất **tốn thời gian và lặp đi lặp lại**:

- ⏰ Viết kịch bản thủ công → 30 phút mỗi video
- 🎨 Chọn visual + animation → 1 tiếng mỗi video
- 🎙️ Thu hoặc tìm voice → 30 phút
- ✂️ Edit trên CapCut / Premiere → 1 tiếng
- 📱 **Tổng: ~3 tiếng cho 1 video 60 giây**

**Auto News Video chỉ cần 5 phút. Paste URL là xong.**

| | Cách thủ công | Auto Video Gen |
|---|---|---|
| ⏱️ Thời gian | ~3 tiếng | **~5 phút** |
| 🎓 Kỹ năng cần | Editor video | **Không cần** |
| 🎯 Độ ổn định | Phụ thuộc người làm | **Studio-grade mọi video** |
| 💰 Chi phí | $50–200 (freelancer) | **Claude Code + TTS API** |
| 🇻🇳 Giọng tiếng Việt | Tốn thời gian | **Vbee/ElevenLabs/LucyLab** |

---

## 🚀 Bắt Đầu Nhanh

```bash
# 1. Clone & cài dependencies
git clone https://github.com/Cuongyd196/auto-video-gen.git
cd auto-video-gen
npm install

# 2. Cấu hình TTS API key
cp .env.example .env.local
# → mở .env.local, set TTS_PROVIDER + key (vbee hoặc LucyLab hoặc ElevenLabs)
```

Sau đó chọn 1 trong 3 cách:

**Cách A — Claude Code trong terminal (khuyến nghị, setup 30 giây):**

1. Cài Claude Code: `npm install -g @anthropic-ai/claude-code`
2. Trong thư mục project, chạy `claude`, rồi gõ:
   ```
   /create-news-video https://github.com/zabbix/zabbix
   ```

**Cách B — Claude Code trong VS Code:**

1. Cài extension **Claude Code** từ VS Code Marketplace
2. Mở thư mục project trong VS Code, mở panel chat Claude Code
3. Gõ lệnh tương tự vào ô chat:
   ```
   /create-news-video https://github.com/zabbix/zabbix
   ```

**Cách C — Không có Claude Code (tự viết script):**

```bash
# Edit script.json thủ công theo src/render/script-schema.ts
npm run pipeline -- output/my-video/script.json
```

Cả 3 cách: sau ~3–5 phút bạn sẽ có `output/<slug>/video.mp4` — file 1080×1920 sẵn sàng cho TikTok / Shorts / Reels.

> 💡 **Cần chi tiết?** Xem [Cài đặt đầy đủ](#-cài-đặt-đầy-đủ) · [Cấu hình](#-cấu-hình) · [Sử dụng](#-sử-dụng)

---

## ✨ Tính năng

<table>
<tr>
<td width="33%" align="center">
<h3>🎨 6 Template thông minh</h3>
<sub>hook · comparison · stat-hero · feature-list · callout · outro</sub>
</td>
<td width="33%" align="center">
<h3>🎤 Đa nhà cung cấp TTS</h3>
<sub>LucyLab (giọng Việt cloning + SRT free), ElevenLabs (30+ ngôn ngữ), hoặc Vbee (tiếng Việt, async polling)</sub>
</td>
<td width="33%" align="center">
<h3>🤖 Claude Code Skill</h3>
<sub>Một câu lệnh duy nhất:<br/><code>/create-news-video &lt;url&gt;</code><br/>(input URL / .txt / .md)</sub>
</td>
</tr>
<tr>
<td width="33%" align="center">
<h3>🎬 2 theme giao diện</h3>
<sub>Studio shell + grain texture + GSAP animations, chọn <code>dark-neon</code> (mặc định) hoặc <code>light-pro</code> qua <code>VIDEO_THEME</code></sub>
</td>
<td width="33%" align="center">
<h3>🔊 Auto SFX Mixing</h3>
<sub>Smart 3-tier picker: override thủ công → semantic match theo từ khóa → default theo template</sub>
</td>
<td width="33%" align="center">
<h3>🧪 Production Ready</h3>
<sub>54 unit tests, Zod schema validation, full TypeScript ESM</sub>
</td>
</tr>
<tr>
<td width="33%" align="center">
<h3>📱 9:16 Native</h3>
<sub>1080×1920 @ 30fps, sẵn cho TikTok / Shorts / Reels</sub>
</td>
<td width="33%" align="center">
<h3>♻️ TTS idempotent</h3>
<sub>Skip re-TTS nếu đã có voice file — tiết kiệm quota qua các lần re-render</sub>
</td>
<td width="33%" align="center">
<h3>📝 Sẵn sàng cho CapCut + TikTok</h3>
<sub>Xuất <code>script.txt</code> + <code>voice.mp3</code> cho CapCut, kèm <code>caption.txt</code> tự sinh (caption + 4 hashtag) để đăng TikTok</sub>
</td>
</tr>
</table>

---

## 🆕 Có gì mới trong bản fork này

Repo này bắt đầu từ việc fork [hoquanghai/Auto-Create-Video](https://github.com/hoquanghai/Auto-Create-Video) (xem [Lời cảm ơn](#-lời-cảm-ơn)). Trên nền pipeline gốc, bản fork này bổ sung thêm:

- **🎙️ Nhà cung cấp TTS Vbee** — thêm lựa chọn thứ ba (`TTS_PROVIDER=vbee`) bên cạnh LucyLab và ElevenLabs, dùng API TTS tiếng Việt theo mô hình async polling. Xem [Cấu hình](#️-cấu-hình).
- **🎨 Theme giao diện `light-pro`** — phong cách trắng/xám/xanh indigo, sạch sẽ và chuyên nghiệp, thay thế cho theme dark-neon gốc, chọn qua `VIDEO_THEME=light-pro`. Hữu ích khi bạn chạy nhiều kênh/thương hiệu với nhận diện hình ảnh khác nhau. Xem [`styles.light-pro.css`](src/render/templates/styles.light-pro.css).
- **📝 Tự sinh caption + hashtag TikTok** — sau mỗi lần render thành công, skill sẽ tự viết thêm `caption.txt`: một caption tiếng Việt ngắn gọn kèm đúng 4 hashtag liên quan, sẵn sàng dán thẳng vào màn hình đăng video TikTok.

---

## 🧠 Cách hoạt động

```mermaid
flowchart LR
    A[📰 URL / .txt / .md] -->|/create-news-video| B[Claude Code]
    B -->|fetch + analyze| C[Sinh script.json]
    C -->|Zod validate| D{Template Picker}
    D -->|6 template| E[Loại Scene]
    E -->|TTS từng scene| F[Vbee / LucyLab / ElevenLabs]
    F -->|voice.mp3<br/>+ SFX mix| G[HyperFrames]
    G -->|Puppeteer + GSAP| H[Frames @ 30fps]
    H -->|FFmpeg encode| I[🎬 video.mp4 1080×1920]

    style A fill:#0f172a,color:#fff
    style I fill:#10b981,color:#fff
    style B fill:#6366f1,color:#fff
    style F fill:#f59e0b,color:#fff
    style G fill:#ec4899,color:#fff
```

Pipeline tách bạch rõ: **AI lo phần sáng tạo** (Claude viết kịch bản) và **code deterministic lo phần production** (Node/TS/FFmpeg render pixel) — cùng input → frames giống hệt nhau mỗi lần.

---

## 🛠️ Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| **Runtime** | Node.js ≥ 22, TypeScript 6+, ESM |
| **Render engine** | [HyperFrames](https://hyperframes.heygen.com) ^0.4.34 (Puppeteer + GSAP + FFmpeg) |
| **TTS providers** | [Vbee](https://vbee.vn) hoặc [LucyLab.io](https://lucylab.io) (JSON-RPC async, Vietnamese cloning) hoặc [ElevenLabs](https://elevenlabs.io) (REST sync, multilingual) |
| **Schema validation** | [Zod](https://zod.dev) ^4 discriminated unions (6 template variants) |
| **HTTP** | axios ^1.15 + nock (test mocking) |
| **Concurrency** | [p-limit](https://github.com/sindresorhus/p-limit) ^7 (rate-limit TTS theo provider) |
| **Testing** | [Vitest](https://vitest.dev) ^4 — ESM-native |
| **Audio processing** | FFmpeg + ffprobe (mix SFX, concat with silence) |
| **AI orchestration** | [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) skill (`/create-news-video`) |
| **Visual blocks** | HyperFrames registry: `grain-overlay`, `shimmer-sweep`, `tiktok-follow` |
| **Fonts** | Inter (body) + Anton/Bebas Neue (display, theme `dark-neon`) + DM Sans (TikTok card) — Google Fonts |

---

## 🔬 Đi sâu vào các công nghệ chính

### 🎞️ HyperFrames — trái tim của render engine

[HyperFrames](https://hyperframes.heygen.com) là framework HTML-to-video do **HeyGen** phát triển và mã nguồn mở. Khác với After Effects hay Premiere, HyperFrames cho phép bạn **viết video bằng HTML/CSS/JS** rồi render thành MP4 chất lượng cao một cách **deterministic** (cùng input → cùng output frame-by-frame).

**Cách nó hoạt động trong dự án:**
1. Pipeline sinh ra một file `index.html` chứa toàn bộ scenes + GSAP timeline
2. HyperFrames spawn headless Chrome (Puppeteer) để load file đó
3. Capture từng frame ở đúng timestamp (30fps × 60s = 1800 frames)
4. Encode tất cả frames + audio thành MP4 dùng FFmpeg

**Tại sao chọn HyperFrames?**
- ✅ **Có sẵn 50+ pre-built blocks** trong registry (transitions, social cards, kinetic typography...)
- ✅ **GSAP timeline** đã được tích hợp sẵn cho animations mượt mà
- ✅ **AI-agent friendly** — Claude/GPT có thể tự sinh composition HTML
- ✅ **Aspect ratio 9:16 native** — sinh ra cho short-form video

### 🎤 LucyLab vs ElevenLabs vs Vbee — chọn cái nào?

| Tiêu chí | LucyLab | ElevenLabs | Vbee |
|---|---|---|---|
| **Giọng tiếng Việt** | ⭐⭐⭐⭐⭐ Tự nhiên (voice cloning) | ⭐⭐⭐⭐ Tốt (multilingual) | ⭐⭐⭐⭐ Tốt, 1.000+ giọng AI |
| **Chi phí** | Rẻ (~25k VND / 1M ký tự) | Đắt hơn (~$5 / 30k ký tự) | Liên hệ báo giá — [vbee.vn/pricing](https://vbee.vn/pricing) |
| **Voice library** | Tự clone giọng | 1000+ voices có sẵn | 1.000+ giọng dựng sẵn, chọn qua voice code |
| **API style** | JSON-RPC async (poll) | REST sync (instant) | REST async (poll) |
| **SRT subtitle** | ✅ Free | ❌ Không có | ❌ Không có |
| **Concurrency** | 1 export/account | Parallel OK | API hỗ trợ chế độ xử lý bất đồng bộ |
| **Ngôn ngữ khác** | ❌ Chỉ tiếng Việt | ✅ 30+ ngôn ngữ | ✅ 20+ ngôn ngữ |
| **Access token** | API key tĩnh | API key tĩnh | VBEE_APP_ID/VBEE_ACCESS_TOKEN |

> 📄 Chi tiết đầy đủ API Vbee (endpoint, tham số, error codes, giới hạn ký tự/audio link) xem tại [https://vbee.vn/api-docs](https://vbee.vn/api-docs).

**Khuyến nghị:**
- 🇻🇳 **Hiện tại mình đang dùng Vbee** (gói 1 năm, có Web Studio và tích hợp API) — nếu bạn chưa có tài khoản, có thể đăng ký qua link giới thiệu này: [vbee.vn/ref/5GTJ9TGU](https://vbee.vn/ref/5GTJ9TGU)
- 🔄 **Đã có sẵn ElevenLabs hoặc LucyLab** → cứ dùng bình thường, đổi qua `TTS_PROVIDER` trong `.env.local` là được, tùy các bạn

### 🛡️ Zod — schema validation an toàn

[Zod](https://zod.dev) là TypeScript-first schema library. Trong project này, Zod đảm bảo `script.json` (do Claude sinh) **luôn đúng cấu trúc** trước khi pipeline chạy.

```ts
// Discriminated union: 6 loại template, mỗi loại có data shape khác nhau
const TemplateData = z.discriminatedUnion("template", [
  HookData, ComparisonData, StatHeroData, FeatureListData, CalloutData, OutroData,
]);
```

Lợi ích:
- Phát hiện ngay nếu Claude sinh script sai (vd: `template: "stat"` không tồn tại) — fail Step 1 với error message rõ ràng
- TypeScript types được suy ra tự động từ Zod schema → composer không cần khai báo type lại
- Schema = source of truth cho cả validation runtime + type compile-time

---

## 📋 Yêu cầu hệ thống

| Mục | Phiên bản | Ghi chú |
|---|---|---|
| **Node.js** | ≥ 22 | `node --version` |
| **FFmpeg + ffprobe** | bất kỳ phiên bản hiện đại | trong PATH (`ffmpeg -version`) |
| **Chrome / Chromium** | bất kỳ | HyperFrames Puppeteer auto-download lần đầu chạy |
| **Claude Code CLI** | latest | [cài tại đây](https://docs.claude.com/en/docs/claude-code/overview) |
| **Tài khoản TTS** | một trong ba | LucyLab.io HOẶC ElevenLabs HOẶC Vbee |

---

## 🔧 Cài đặt đầy đủ

```bash
# 1. Clone repo
git clone https://github.com/Cuongyd196/auto-video-gen.git
cd auto-video-gen

# 2. Cài dependencies
npm install

# 3. Tạo file env và điền API key
cp .env.example .env.local
# → mở .env.local, set TTS_PROVIDER + API key (xem phần Cấu hình bên dưới)

# 4. Verify cài đặt
node --version       # ≥ 22
ffmpeg -version      # in version OK
ffprobe -version
npm test             # all 54 tests should pass
```

### Cài FFmpeg

| OS | Lệnh |
|---|---|
| **Windows** | `winget install Gyan.FFmpeg` |
| **macOS** | `brew install ffmpeg` |
| **Ubuntu/Debian** | `sudo apt install ffmpeg` |

---

## ⚙️ Cấu hình

Mở `.env.local` và chọn **một trong ba provider**:

### Option 1 — LucyLab.io

```env
TTS_PROVIDER=lucylab
VIETNAMESE_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
VIETNAMESE_VOICEID=22charvoiceiduuidhere
```

- ✅ Giọng Việt tự nhiên (voice cloning), trả kèm file SRT subtitle miễn phí
- ⚠️ Chỉ 1 export/account đồng thời (pipeline tự xử lý)
- 🔗 Đăng ký: https://lucylab.io

### Option 2 — ElevenLabs

```env
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

- ✅ Đa ngôn ngữ (30+), thư viện voice phong phú, chất lượng cao
- ⚠️ Đắt hơn LucyLab, không có SRT đi kèm
- 🔗 Lấy key: https://elevenlabs.io/app/settings/api-keys · Browse voices: https://elevenlabs.io/app/voice-library

### Option 3 — Vbee *(thêm trong bản fork này)*

```env
TTS_PROVIDER=vbee
VBEE_APP_ID=your_app_id
VBEE_ACCESS_TOKEN=your_access_token
VBEE_VOICE_CODE=n_hanoi_male_protrainer_education_vc
```

- ✅ TTS tiếng Việt, mô hình async job + polling (không có SRT)
- ⚠️ `VBEE_ACCESS_TOKEN` hết hạn định kỳ — vào tài khoản Vbee lấy token mới nếu gặp lỗi `401 Unauthorized`
- 🔗 Đăng ký: https://vbee.vn/ref/5GTJ9TGU

### TikTok follow card (tùy chọn, defaults work)

```env
TIKTOK_DISPLAY_NAME=CườngIT
TIKTOK_HANDLE=@cuongit96
TIKTOK_FOLLOWERS=2k followers
TIKTOK_AVATAR_URL=https://example.com/your-avatar.jpg   # tùy chọn
```

Để đổi avatar: thay file `assets/avatar.jpg` bằng ảnh của bạn (vuông, ≥256×256), **hoặc** set `TIKTOK_AVATAR_URL` để pipeline tự download mỗi lần render.

### Theme giao diện *(thêm trong bản fork này)*

```env
VIDEO_THEME=dark-neon    # mặc định: navy/cyan/purple kèm hiệu ứng glow
# VIDEO_THEME=light-pro  # lựa chọn khác: trắng/xám/indigo, phong cách chuyên nghiệp
```

Hữu ích nếu bạn chạy nhiều hơn một kênh/thương hiệu — mỗi kênh có thể chọn theme riêng. Xem [`src/render/templates/styles.css`](src/render/templates/styles.css) (dark-neon) và [`styles.light-pro.css`](src/render/templates/styles.light-pro.css) (light-pro).

### Pipeline tuning (tùy chọn)

```env
TTS_CONCURRENCY=1    # 1 cho LucyLab (giới hạn API). Tăng cho ElevenLabs để parallel.
```

---

## 🎬 Sử dụng

### Cách 1 — Trong Claude Code (khuyến nghị)

Mở Claude Code trong thư mục project và gõ:

```
/create-news-video https://github.com/zabbix/zabbix
```

Hoặc với file local (`.txt` hoặc `.md`):

```
/create-news-video news/my-article.md
```

Sau ~3–5 phút:

```
✓ Video:   output/<slug>-<timestamp>/video.mp4     ← video cuối
✓ Audio:   output/<slug>-<timestamp>/voice.mp3     ← để import CapCut
✓ Script:  output/<slug>-<timestamp>/script.txt    ← cho CapCut auto-caption
✓ Caption: output/<slug>-<timestamp>/caption.txt   ← caption + 4 hashtag để đăng TikTok
```

### Cách 2 — Chạy pipeline trực tiếp (advanced)

Nếu đã có sẵn `script.json` (debug hoặc tự viết kịch bản):

```bash
npm run pipeline -- output/<slug>-<timestamp>/script.json
```

### Cách 3 — Re-render visual không cần TTS (tiết kiệm quota)

Nếu đã có voice files trong `voice/` và muốn render lại visual:

```bash
npm run rerender -- output/<slug>-<timestamp>
```

---

## 📁 Cấu trúc output

```
output/<slug>-<timestamp>/
├── script.json                # Input JSON (Claude sinh hoặc bạn viết tay)
├── script.txt                 # Plain text cho CapCut auto-caption
├── caption.txt                 # Caption tiếng Việt + 4 hashtag cho TikTok (skill sinh ra)
├── images/bg.jpg              # og:image đã tải (nếu có)
├── voice/
│   ├── scene-hook.mp3         # TTS từng scene (idempotent — skip nếu đã có)
│   ├── scene-hook.srt         # SRT subtitle (chỉ khi TTS_PROVIDER=lucylab)
│   └── scene-body-1.mp3
├── voice-raw.mp3              # Voice concat, chưa mix SFX (intermediate)
├── voice.mp3                  # Final audio đã mix SFX (cho CapCut)
├── tiktok-avatar.jpg          # Copy avatar bundled (hoặc download từ TIKTOK_AVATAR_URL)
├── index.html                 # HyperFrames composition
├── styles.css                 # Template CSS đã copy theo VIDEO_THEME (self-contained)
├── animations.js              # GSAP timeline (self-contained)
├── hyperframes.json           # HyperFrames manifest
├── meta.json                  # HyperFrames metadata
└── video.mp4                  # 🎉 Output cuối — 1080×1920 @ 30fps
```

---

## 🎨 Visual System

Mỗi video gồm **persistent shell** xuyên suốt (header brand icon + tên channel + tag, footer handle TikTok, grain texture, gradient background) cộng với **5–8 scene** Claude tự viết theo nội dung nguồn (1 hook + 3–6 body + 1 outro). Giao diện tổng thể chọn qua `VIDEO_THEME` (`dark-neon` mặc định hoặc `light-pro`) — xem [Cấu hình](#️-cấu-hình) và [Có gì mới trong bản fork này](#-có-gì-mới-trong-bản-fork-này).

### 6 templates (Claude tự pick theo nội dung)

| Template | Khi nào pick | Ví dụ |
|---|---|---|
| `hook` | Scene đầu tiên | "OpenScreen" + "Quay màn hình miễn phí" trên nền gradient, headline scale-pop + shimmer |
| `comparison` | Có "X vs Y" / "vượt xa" / "so với" | 2 card cạnh nhau, mỗi card 1 màu accent (cyan/purple) |
| `stat-hero` | Có số/% nổi bật | Số liệu lớn giữa màn hình + label + context nhỏ bên dưới |
| `feature-list` | Liệt kê tính năng | Card tiêu đề + tối đa 4 bullet, mỗi bullet có dot accent |
| `callout` | Statement / cảnh báo | Card với tag nhỏ phía trên + statement chính giữa |
| `outro` | Scene cuối, luôn cố định 3 dòng | CTA pill + tên channel + "Nguồn: `<domain>`", kèm TikTok follow card |

### Timing & animation

- **Thời lượng scene** = độ dài audio TTS của scene đó + 0.3s gap (không có hệ thống "beats"/transition-type cấu hình được — mỗi scene là một hard cut, GSAP set `opacity: 1` lúc bắt đầu và `opacity: 0` lúc kết thúc).
- **Animation vào scene** cố định theo từng template (`animateHook`, `animateComparison`, `animateStatHero`, `animateFeatureList`, `animateCallout`, `animateOutro` trong [`animations.js`](src/render/templates/animations.js)) — mỗi loại có 1 kiểu entrance animation riêng (scale-pop, slide-in, v.v.), không đổi được qua script.json.
- Tổng thời lượng video được `pipeline.ts` cảnh báo nếu nằm ngoài khoảng **[48s, 72s]**, nhưng vẫn tiếp tục render.

### Sound Effects (auto-mix theo template)

| Template | Default category (fallback) | Khi nào nghe |
|---|---|---|
| `hook` | `transition` → `cinematic` | Đầu video, entrance dramatic |
| `comparison` | `transition` → `emphasis` | Khi 2 cards xuất hiện |
| `stat-hero` | `emphasis` → `success` | Lúc số/% xuất hiện |
| `feature-list` | `transition` → `emphasis` | Mỗi bullet appear |
| `callout` | `alert` → `drumroll` | Statement quan trọng / cảnh báo |
| `outro` | `outro` → `success` | Ending signature |

Smart 3-tier picker (trong [`src/assets/sfx-selector.ts`](src/assets/sfx-selector.ts)) chọn theo thứ tự:

1. **`scene.sfx`** override (set `"none"` để disable SFX cho scene đó)
2. **Semantic match** trên `voiceText` (Việt + Anh) — vd `cảnh báo|warning|risk` → `alert`, `kỷ lục|record|breakthrough` → `success`, `ra mắt|launch|reveal` → `reveal`, `thất bại|fail|crash` → `fail`
3. **Template default** category (kèm fallback chain)

Trong cùng category, file được pick **deterministic** bằng hash scene id — cùng script → cùng SFX, nhưng các scene khác nhau trong cùng video lấy file khác nhau.

---

## ❓ FAQ

<details>
<summary><b>Có dùng được cho ngôn ngữ khác ngoài tiếng Việt không?</b></summary>

Có. Đổi `TTS_PROVIDER=elevenlabs` trong `.env.local` — ElevenLabs hỗ trợ 30+ ngôn ngữ (Anh, Trung, Nhật...).

Lưu ý: skill Claude Code hiện đang optimize cho tiếng Việt. Với ngôn ngữ khác bạn nên chỉnh prompt trong `.claude/skills/create-news-video/SKILL.md`.
</details>

<details>
<summary><b>Mỗi video tốn bao nhiêu tiền?</b></summary>

Khoảng **$0.05–0.15 mỗi video**, tùy provider:

- LucyLab: ~$0.02 / video (rẻ nhất, chỉ tiếng Việt)
- ElevenLabs: ~$0.10 / video (đa ngôn ngữ)
- Vbee: không có bảng giá cố định công khai — xem [vbee.vn/pricing](https://vbee.vn/pricing) (liên hệ để nhận báo giá riêng)
- Claude API (sinh script): ~$0.03 / video
</details>

<details>
<summary><b>Chạy được không cần Claude Code không?</b></summary>

Có — dùng **Cách 2** (`npm run pipeline -- script.json`) với `script.json` viết tay. Skill Claude Code chỉ lo phần "sáng tạo" (viết script tiếng Việt + pick template). Pipeline thuần Node.js — xem [`src/pipeline.ts`](src/pipeline.ts).
</details>

<details>
<summary><b>Sao không chọn Remotion mà lại chọn HyperFrames?</b></summary>

HyperFrames được purpose-built cho short-form video — 9:16 native, AI-agent friendly (Claude có thể tự sinh HTML composition mà không cần React boilerplate).

Remotion là tool tuyệt vời với scope rộng hơn — long-form content, composition phức tạp, full React ecosystem. Tool khác nhau cho job khác nhau.
</details>

<details>
<summary><b>Video output bị câm / audio bị méo. Sao vậy?</b></summary>

Khả năng cao FFmpeg chưa cài hoặc không trong PATH. Chạy `ffmpeg -version` để verify.

- Windows: `winget install Gyan.FFmpeg`
- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt install ffmpeg`

Sau đó restart terminal và chạy lại.
</details>

<details>
<summary><b>TTS đọc sai số. Fix thế nào?</b></summary>

TTS Việt đọc số kiểu chữ. Spell out trong `voiceText` (text trên màn hình `templateData` giữ nguyên dạng số):

| Trong `voiceText` (TTS-friendly) | Trên màn hình (`templateData`) |
|---|---|
| `năm chấm năm` | `5.5` |
| `tám mươi hai phẩy bảy phần trăm` | `82.7%` |
| `một triệu token` | `1M tokens` |
| `hai trăm megapixel` | `200MP` |

Skill Claude Code tự handle cái này khi sinh script. Xem [`SKILL.md`](.claude/skills/create-news-video/SKILL.md) để có ruleset đầy đủ.
</details>

<details>
<summary><b>Customize visual (màu, font) được không?</b></summary>

Được — sửa [`src/render/templates/styles.css`](src/render/templates/styles.css) (theme `dark-neon`) hoặc [`styles.light-pro.css`](src/render/templates/styles.light-pro.css) (theme `light-pro`). Mỗi theme là 1 file CSS riêng, dùng chung class name nên html-composer.ts không cần đổi gì khi bạn sửa màu/font. Animation timing trong [`src/render/templates/animations.js`](src/render/templates/animations.js) (dùng chung cho cả 2 theme).
</details>

<details>
<summary><b>Force re-TTS một scene cụ thể như nào?</b></summary>

Step TTS là idempotent — chỉ synthesize scene chưa có mp3. Force 1 scene: xóa file của nó:

```bash
rm output/<slug>/voice/scene-hook.mp3
npm run pipeline -- output/<slug>/script.json
```

Re-render visual mà giữ tất cả voice: dùng `npm run rerender -- output/<slug>`.
</details>

<details>
<summary><b>Video dài tối đa được bao nhiêu?</b></summary>

Script target cố định: **~150–200 từ tiếng Việt**, **5–8 scene** (1 hook + 3–6 body + 1 outro) → khoảng **55–65 giây** ở tốc độ đọc 1.0. `pipeline.ts` cảnh báo (không fail) nếu tổng thời lượng thực tế nằm ngoài khoảng **[48s, 72s]** — video vẫn render bình thường. Xem heuristic đầy đủ trong [`SKILL.md`](.claude/skills/create-news-video/SKILL.md).
</details>

---

## 🧪 Testing

```bash
npm test                 # 54 unit tests (~4s)
npm run test:watch       # watch mode
npx tsc --noEmit         # type-check không build
```

Tests cover Zod schema validation (6 templates), TTS clients cho cả LucyLab + ElevenLabs + Vbee (với `nock` HTTP mocking — không gọi API thật), audio tools, image fetcher, SFX selector (3-tier), slug generation, và HTML composer. Không có CI tự động chạy trên push — chạy `npm test` thủ công trước khi commit.

---

## 🐛 Troubleshooting

| Lỗi | Cách khắc phục |
|---|---|
| `Missing VIETNAMESE_API_KEY` / `Missing ELEVENLABS_API_KEY` | Kiểm tra `.env.local` đã có và đúng `TTS_PROVIDER` |
| `Missing VBEE_APP_ID` / `Missing VBEE_ACCESS_TOKEN` | Kiểm tra `.env.local` đã điền — `VBEE_ACCESS_TOKEN` hết hạn, cần lấy token mới từ tài khoản Vbee |
| `hyperframes render failed` | Chạy `npx hyperframes render --help` verify CLI; Chrome cài chưa? |
| `LucyLab polling timeout` | Tăng `LUCYLAB_POLL_TIMEOUT_MS` trong `.env.local` (default 120000ms) |
| `ElevenLabs 401 Invalid API key` | Verify key trên dashboard ElevenLabs, paste lại vào `.env.local` |
| `Vbee 401 Unauthorized` | `VBEE_ACCESS_TOKEN` hết hạn — vào tài khoản Vbee lấy token mới |
| `Total duration outside [48, 72]s` | Pipeline chỉ **warns** — video vẫn render. Muốn đúng khoảng thì chỉnh `script.json` viết dài/ngắn hơn (~150–200 từ, 5–8 scene). |
| `ffprobe: command not found` | Cài FFmpeg (xem phần [Cấu hình](#-cấu-hình)) |

---

## 🗺️ Roadmap

- [ ] Tích hợp Voice Local miễn phí (TTS offline, không cần API key)
- [ ] Giao diện web UI (không cần Claude Code)
- [ ] Tự động đăng TikTok / YouTube Shorts / Reels qua API

Có yêu cầu tính năng? [Mở issue](https://github.com/Cuongyd196/auto-video-gen/issues/new).

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Cuongyd196/auto-video-gen&type=Date)](https://star-history.com/#Cuongyd196/auto-video-gen&Date)

---

## 🤝 Contributing

PRs welcome! Với thay đổi lớn, mở issue trước để discuss.

```bash
# Fork → clone → branch
git checkout -b feature/my-improvement

# Make changes, ensure tests pass
npm test
npx tsc --noEmit

# Commit theo Conventional Commits
git commit -m "feat: add Google TTS provider support"

# Push và mở PR
git push origin feature/my-improvement
```

Commit prefixes: `feat:` (tính năng mới) · `fix:` (bug) · `docs:` · `refactor:` · `test:` · `chore:`

---

## 📜 License

[MIT](LICENSE) — sử dụng tự do, fork tự do, đóng góp PR tự do.

---

## 🙏 Lời cảm ơn

Dự án này là bản fork của **[Auto-Create-Video bởi Ho Quang Hai](https://github.com/hoquanghai/Auto-Create-Video)**, phát hành gốc theo giấy phép MIT. Toàn bộ công sức thiết kế pipeline gốc, tích hợp HyperFrames, và hệ thống template thuộc về tác giả gốc — xem [Có gì mới trong bản fork này](#-có-gì-mới-trong-bản-fork-này) để biết phần được bổ sung thêm.

Dự án này cũng đứng trên vai những người khổng lồ:

- [HyperFrames by HeyGen](https://hyperframes.heygen.com) — framework HTML-to-video làm cho dự án này khả thi
- [LucyLab.io](https://lucylab.io) — API voice cloning tiếng Việt
- [ElevenLabs](https://elevenlabs.io) — TTS đa ngôn ngữ
- [Vbee](https://vbee.vn) — API TTS tiếng Việt
- [Anthropic Claude](https://www.anthropic.com/claude) — LLM viết script qua Claude Code skill
- [Remotion](https://www.remotion.dev) — inspiration cho HTML-based video rendering

---

## 💖 Ủng hộ dự án

Nếu dự án giúp bạn tiết kiệm thời gian, hãy:

- ⭐ **[Star repo này](https://github.com/Cuongyd196/auto-video-gen)** — giúp dự án nhiều người biết đến hơn
- 💬 Giới thiệu cho bạn bè làm content
- 🐛 [Report bug hoặc đề xuất tính năng](https://github.com/Cuongyd196/auto-video-gen/issues)

<div align="center">

**[⬆ Lên đầu trang](#top)**

Cập nhật bởi [CuongIT](https://www.facebook.com/cuongit96) tại 🇻🇳 Việt Nam — dựa trên bản gốc của [Ho Quang Hai](https://github.com/hoquanghai)

</div>
