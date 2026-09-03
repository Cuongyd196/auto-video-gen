<a id="top"></a>

<div align="center">

# 🎬 Auto Video Gen

### 🚀 Biến URL bài báo & Repo GitHub thành Video ngắn 9:16 chuyên nghiệp

**1 câu lệnh với AI Coding· 0đ Voice (Edge TTS) · Không cần edit thủ công · Sẵn sàng đăng TikTok, Reels, Shorts**

[![Stars](https://img.shields.io/github/stars/Cuongyd196/auto-video-gen?style=for-the-badge&logo=github&color=yellow)](https://github.com/Cuongyd196/auto-video-gen/stargazers)
[![Forks](https://img.shields.io/github/forks/Cuongyd196/auto-video-gen?style=for-the-badge&logo=github&color=blue)](https://github.com/Cuongyd196/auto-video-gen/network/members)
[![License](https://img.shields.io/github/license/Cuongyd196/auto-video-gen?style=for-the-badge&color=green)](LICENSE)
[![Node](https://img.shields.io/badge/node-22%2B-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5%2B-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[**📖 Tài liệu chi tiết (Full Docs)**](README.full.md) · [**🇬🇧 English Docs**](README.en.md) · [**📺 Xem Demo**](https://youtube.com/shorts/X8P_5tsHy4o) · [**🚀 Cài đặt nhanh**](#-bắt-đầu-nhanh-3-bước)

</div>

> 💡 **Bạn cần tài liệu chuyên sâu?**
> Bản README này tóm tắt nhanh để bạn có thể bắt đầu tạo video trong 5 phút. Để xem đầy đủ kiến trúc, JSON Schema kịch bản, bảng tính chi phí và hướng dẫn nâng cao, vui lòng xem [👉 README.full.md](README.full.md).

---

## 🎥 Xem Demo Video Hoàn Thiện

Toàn bộ video dưới đây được tạo **100% tự động** từ kịch bản text — Voice TTS + Visuals HTML/CSS + Hiệu ứng SFX/BGM, không qua bước edit video thủ công:

| 🕸️ Demo CodeGraph | 🖥️ Demo OpenScreen |
| :---: | :---: |
| [![CodeGraph Demo](https://img.youtube.com/vi/X8P_5tsHy4o/0.jpg)](https://youtube.com/shorts/X8P_5tsHy4o) | [![OpenScreen Demo](https://img.youtube.com/vi/5noesbFXK0k/0.jpg)](https://youtube.com/shorts/5noesbFXK0k) |
| [📺 Xem Shorts](https://youtube.com/shorts/X8P_5tsHy4o) | [📺 Xem Shorts](https://youtube.com/shorts/5noesbFXK0k) |

🔗 Xem thêm tại: [Facebook Reels](https://www.facebook.com/reel/2549425188850979) · [TikTok @cuongit96](https://www.tiktok.com/@cuongit96/video/7661226482458561799)

---

## ✨ Điểm nổi bật

- ⚡ **Tự động hóa toàn diện**: Từ URL bài báo hoặc file `.txt`/`.md` → Kịch bản → Giọng đọc (TTS) → HTML Motion Graphics → Ghép âm thanh & SFX → Render file MP4 1080x1920 60FPS.
- 🎙️ **Voice miễn phí 100% (Edge TTS)**: Tích hợp sẵn giọng đọc tiếng Việt của Microsoft Edge, **không tốn tiền, không cần API Key**. Đồng thời hỗ trợ **LucyLab** (voice cloning tiếng Việt kèm SRT), **Vbee** (chuẩn giọng tin tức Việt Nam) và **ElevenLabs** (đa ngôn ngữ cao cấp).
- 🎨 **HTML-to-Video Engine (HyperFrames)**: Layout video được viết bằng HTML + CSS + GSAP animation. Dễ dàng can thiệp, tuỳ biến font chữ, màu sắc thương hiệu như lập trình web.
- 🤖 **Thiết kế riêng cho AI Coding Agents**: Tối ưu sẵn cho **Google Antigravity IDE** (`.agents/skills`) và **Claude Code** (`.claude/skills`) qua lệnh `/create-news-video`. Bạn chỉ cần đưa URL bài báo hoặc file `.txt`, AI sẽ tự đọc hiểu, tóm tắt, chọn template đồ họa và chạy pipeline tạo video trọn gói từ A đến Z.
- 📐 **6 Template dựng sẵn linh hoạt**:
  - 🚨 `breaking-news`: Tin nóng, sự kiện giật gân
  - 📊 `stat-callout`: Nhấn mạnh số liệu, biểu đồ
  - 🔀 `split-screen`: So sánh 2 đối tượng hoặc chèn ảnh minh họa bài viết
  - 💬 `quote-card`: Trích dẫn phát biểu, châm ngôn
  - 📋 `listicle`: Danh sách điểm tin, bảng xếp hạng
  - 🔢 `big-number`: Số liệu thống kê ấn tượng

---

## 🚀 Bắt đầu nhanh (3 bước)

### 1. Yêu cầu & Cài đặt

Dự án sử dụng cơ chế **Agentic Video Generation**:
- **Công cụ bắt buộc**: **Node.js 22+** và **FFmpeg** trên máy.
- **AI Coding Agent (Khuyên dùng để tự động hoá 100%)**:
  - 🪐 **[Antigravity IDE](https://antigravity.google)** — AI IDE của Google DeepMind.
  - 🧠 **[Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)** — Agentic CLI của Anthropic.
  - Hoặc bất kỳ AI tool nào khác (Cursor, Codex, Windsurf) thông qua kịch bản JSON.

```bash
# Clone repository
git clone https://github.com/Cuongyd196/auto-video-gen.git
cd auto-video-gen

# Cài đặt dependencies
npm install
```

> **Cài đặt FFmpeg nếu máy chưa có:**
> - **Windows:** `winget install Gyan.FFmpeg`
> - **macOS:** `brew install ffmpeg`
> - **Linux:** `sudo apt install ffmpeg`

### 2. Thiết lập cấu hình

Tạo file môi trường từ file mẫu:

```bash
cp .env.example .env.local
```

> 💡 **Mặc định dự án cấu hình Edge TTS hoàn toàn miễn phí, không cần bất kỳ API key nào.** Bạn có thể tạo video ngay lập tức!
> 
> *(Nếu muốn dùng LucyLab, Vbee hoặc ElevenLabs, mở file `.env.local` và điền key tương ứng).*

### 3. Tạo video đầu tiên!

#### 🤖 Cách 1: Tự động hoàn toàn bằng AI Agent (Khuyên dùng)

##### 👉 Với Google Antigravity IDE
Mở project trong Antigravity IDE, tại khung chat gõ lệnh:
```text
/create-news-video https://vnexpress.net/bai-viet-cua-ban...
```

##### 👉 Với Anthropic Claude Code
Mở terminal tại thư mục dự án và chạy:
```bash
claude
# Trong màn hình tương tác Claude Code, gõ:
/create-news-video https://vnexpress.net/bai-viet-cua-ban...
```

> 💡 **Quy trình AI tự động xử lý:**
> 1. Đọc bài báo từ URL hoặc file .txt tiếng Việt.
> 2. Viết lời bình tiếng Việt chuẩn ngữ âm, chia cảnh và chọn template motion graphics.
> 3. Tự gọi pipeline: sinh voice (Edge TTS Free) + render HyperFrames + mix nhạc & SFX.
> 4. Xuất video `.mp4` cùng file `caption.txt` có sẵn hashtag đăng TikTok!

#### 🛠️ Cách 2: Render trực tiếp từ file kịch bản (Thủ công)

Nếu không dùng AI, bạn có thể render từ file mẫu hoặc file `script.json` tự viết:

```bash
npm run pipeline -- tests/fixtures/sample-script-no-image.json
```

🎉 **Kết quả**: Video thành phẩm sẽ được lưu tại `output/<slug>/<slug>.mp4`.

---

## 🎙️ Lựa chọn giọng đọc (TTS)

Chuyển đổi provider linh hoạt trong `.env.local` qua biến `TTS_PROVIDER`:

| Nhà cung cấp | Cấu hình | Chi phí | Đặc điểm |
| :--- | :--- | :--- | :--- |
| **Edge TTS** *(Mặc định)* | `TTS_PROVIDER=edge-tts` | **0đ (Miễn phí)** | Không cần API key, hỗ trợ giọng Nam/Nữ tiếng Việt tự nhiên |
| **LucyLab** | `TTS_PROVIDER=lucylab` | Rẻ (~25k/1M ký tự) | Giọng voice cloning tiếng Việt tự nhiên, tự động kèm SRT subtitle |
| **Vbee** | `TTS_PROVIDER=vbee` | Trả phí Vbee API | Giọng đọc truyền cảm, chuẩn phong cách phát thanh viên tin tức |
| **ElevenLabs** | `TTS_PROVIDER=elevenlabs` | Trả phí ElevenLabs | Đa ngôn ngữ, chất lượng phòng thu điện ảnh, tuỳ biến cao |

---

## 🛠️ Các lệnh thường dùng (CLI Cheatsheet)

```bash
# Chạy toàn bộ pipeline (TTS + Render visuals + Audio Mix)
npm run pipeline -- output/<slug>/script.json

# Chỉ render lại hình ảnh (giữ nguyên voice đã tạo, tiết kiệm thời gian)
npm run rerender -- output/<slug>

# Chạy test kiểm thử toàn bộ hệ thống
npm test
```

---

## 📂 Cấu trúc thư mục dự án

```text
auto-video-gen/
├── .claude/skills/        # Claude Code skill tạo kịch bản tự động
├── src/
│   ├── config.ts          # Đọc & validate biến môi trường (.env)
│   ├── pipeline.ts        # Pipeline chính: TTS -> HyperFrames -> FFmpeg
│   ├── schema.ts          # Zod schema định nghĩa cấu trúc kịch bản video
│   ├── render/            # Template HTML/CSS/GSAP & HyperFrames composer
│   ├── tts/               # Bộ kết nối TTS (Edge TTS, Vbee, ElevenLabs)
│   └── audio/             # Ghép âm thanh, SFX, căn chỉnh timing bằng FFmpeg
├── tests/                 # Unit tests (Vitest)
├── output/                # Thư mục lưu video thành phẩm theo từng slug
├── README.full.md         # 📖 Tài liệu hướng dẫn chi tiết toàn bộ dự án
└── README.en.md           # 🇬🇧 English Documentation
```

---

## 📖 Tài liệu chuyên sâu

Để tìm hiểu chi tiết hơn, vui lòng xem [**README.full.md**](README.full.md):
- [Cấu trúc chi tiết của file kịch bản `script.json`](README.full.md#-cấu-trúc-scriptjson)
- [Hướng dẫn tùy biến màu sắc, font chữ và animation CSS](README.full.md#-tùy-biến-giao-diện-theme--css)
- [Bảng ước tính chi phí chi tiết](README.full.md#-ước-tính-chi-phí)
- [Bảng tra cứu và xử lý sự cố (Troubleshooting)](README.full.md#-xử-lý-sự-cố-thường-gặp)
- [Giải đáp các câu hỏi thường gặp (FAQ)](README.full.md#-faq)

---

## 📜 License & Lời cảm ơn

- Dự án phát hành theo giấy phép [MIT](LICENSE).
- Dự án là bản fork và phát triển mở rộng từ tác phẩm gốc của tác giả [Ho Quang Hai](https://github.com/hoquanghai/Auto-Create-Video).
- Bản cập nhật & duy trì bởi [CuongIT](https://www.facebook.com/cuongit96).
