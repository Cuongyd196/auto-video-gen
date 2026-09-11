# Auto Video Gen

TTS-first pipeline for turning real product screen recordings into vertical short-form videos for TikTok, YouTube Shorts and Facebook Reels.

The product demo is the main visual. The generator handles script timing, TTS, captions, small callouts and rendering.

## Workflow

```text
Prompt
+ 2-4 screen recordings
+ optional screenshots
        ↓
      Codex
        ↓
   script.json
        ↓
 Edge TTS + timing
        ↓
 product demo + captions
        ↓
   1080x1920 MP4
```

This repository is intended for fast distribution experiments. Long-form personal-brand videos can remain a separate workflow with manual filming and voice recording.

## What V1 supports

- Local `.mp4` / `.webm` screen recordings as first-class scenes
- Local `.png` / `.jpg` / `.jpeg` / `.webp` screenshots
- 1080x1920 rendering with HyperFrames
- Vietnamese TTS with Edge TTS by default
- Optional LucyLab, Vbee and ElevenLabs providers
- Scene timing based on generated voice duration
- Baked scene captions and optional short headlines
- Full-screen or framed product-demo layouts
- Optional per-scene SFX overrides
- `voice.mp3` and `script.txt` alongside the final video

Product mode intentionally removes the old persistent news-style shell, fake social profile card and automatic SFX.

## Requirements

- Node.js 22+
- FFmpeg

Windows:

```bash
winget install Gyan.FFmpeg
```

## Setup

```bash
git clone https://github.com/namnth2000/auto-video-gen.git
cd auto-video-gen
npm install
cp .env.example .env.local
```

The defaults are:

```env
TTS_PROVIDER=edge-tts
EDGE_TTS_VOICE=vi-VN-NamMinhNeural
VIDEO_THEME=product
```

Edge TTS does not require an API key.

## Recommended input for Codex

Put a few short product recordings in the repository, for example:

```text
assets/demo/
  01-upload.mp4
  02-change-ratio.mp4
  03-background.mp4
  04-export.mp4
```

Then ask Codex for one focused video:

```text
Create a 25-35 second Vietnamese vertical video introducing FitPic.
Show the real product immediately.
Use the recordings in assets/demo/.
Focus on: one photo can be adapted for multiple social media ratios without unnecessarily cropping important content.
Use Edge TTS.
CTA: Thử FitPic miễn phí tại fitpic.namnth.com.
```

Codex should follow `AGENTS.md`, create `output/<slug>-<timestamp>/script.json`, then run the pipeline.

## Product scene example

```json
{
  "id": "ratio",
  "type": "body",
  "voiceText": "Chọn tỉ lệ phù hợp với nơi bạn muốn đăng.",
  "subtitle": "Chọn tỉ lệ cho từng nền tảng",
  "templateData": {
    "template": "screen-demo",
    "src": "assets/demo/02-change-ratio.mp4",
    "mediaType": "video",
    "fit": "contain",
    "layout": "full",
    "mediaStartSec": 0,
    "headline": "Một ảnh, nhiều tỉ lệ"
  }
}
```

`mediaStartSec` lets the script start from a later point in the source recording without manually trimming the file.

Use `layout: "full"` for vertical/mobile recordings and `layout: "framed"` for wide desktop recordings.

The final scene should normally use `product-outro`:

```json
{
  "id": "outro",
  "type": "outro",
  "voiceText": "Bạn có thể thử FitPic miễn phí ngay bây giờ.",
  "templateData": {
    "template": "product-outro",
    "productName": "FitPic",
    "cta": "Thử miễn phí",
    "url": "fitpic.namnth.com"
  }
}
```

## Commands

```bash
npm run pipeline -- output/<slug>/script.json
npm run rerender -- output/<slug>
npm test
npm run typecheck
npm run build
```

The full pipeline copies referenced local media into the output directory so `rerender` can reuse it later without touching the source recording again.

## TTS

Supported providers:

| Provider | API key | Use |
| --- | --- | --- |
| Edge TTS | No | Default for fast experiments |
| LucyLab | Yes | Vietnamese voice / cloning options |
| Vbee | Yes | Vietnamese TTS |
| ElevenLabs | Yes | Premium multilingual TTS |

Start with Edge TTS. Upgrade only if voice quality becomes a real distribution bottleneck.

## V1 boundaries

This version deliberately does not include browser auto-capture, automatic publishing, complex motion-graphic templates or a full timeline editor.

The intended manual step is recording a few clean product interactions. The pipeline automates the repetitive narration, timing, captions and final render around those clips.

## License

MIT. See [LICENSE](LICENSE).

## Credits

This project is based on [Cuongyd196/auto-video-gen](https://github.com/Cuongyd196/auto-video-gen), which itself credits [hoquanghai/Auto-Create-Video](https://github.com/hoquanghai/Auto-Create-Video) as its original base.
