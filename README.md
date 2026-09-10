# Auto Video Gen

TTS-first pipeline for creating vertical product videos for TikTok, YouTube Shorts and Facebook Reels.

The goal is simple: give Codex product context plus a few screenshots, generate a short script, synthesize Vietnamese voice, render motion graphics and export a ready-to-post 9:16 MP4.

## Workflow

```text
Product context + screenshots
        ↓
      Codex
        ↓
   script.json
        ↓
 TTS + timing + visuals
        ↓
     video.mp4
```

V1 focuses on automated short-form product videos. Long-form personal-brand videos can stay in a separate workflow with manual filming and voice recording.

## What is included

- 1080x1920 vertical video rendering with HyperFrames
- Vietnamese TTS with Edge TTS by default
- Optional LucyLab, Vbee and ElevenLabs providers
- Automatic per-scene timing based on generated voice
- HTML/CSS/GSAP motion graphics
- SFX mixing with FFmpeg
- `script.txt` and `voice.mp3` exported with the video
- Codex instructions in `AGENTS.md`

## Requirements

- Node.js 22+
- FFmpeg

On Windows:

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

Edge TTS is the default and does not require an API key.

## Create a product video with Codex

Open this repository in Codex and give it the product material you want to turn into a video.

Example:

```text
Create a 30-second Vietnamese product video for FitPic.
Focus on this problem: one photo needs different aspect ratios for different social platforms without cropping important content.
Use Edge TTS and output a vertical 9:16 video.
```

Codex should follow `AGENTS.md`, create `output/<slug>-<timestamp>/script.json`, then run:

```bash
npm run pipeline -- output/<slug>-<timestamp>/script.json
```

The main output is:

```text
output/<slug>-<timestamp>/video.mp4
```

Other useful outputs:

```text
voice.mp3
script.txt
index.html
```

## Script shape

The rendering engine currently supports these reusable scene templates:

- `hook`
- `comparison`
- `stat-hero`
- `feature-list`
- `callout`
- `outro`

For product videos, `metadata.source` should describe the product page or project being presented. `metadata.source.image` can point to the main screenshot or image used by the hook.

A typical short should use 5-8 scenes:

```text
Hook -> Problem -> Demo/Feature -> Benefit -> CTA
```

Keep `voiceText` conversational and optimized for TTS. Text shown visually can use normal numbers and symbols, while spoken numbers should be written the way they should be pronounced.

## TTS

Choose a provider in `.env.local`:

```env
TTS_PROVIDER=edge-tts
```

Supported providers:

| Provider | API key | Notes |
| --- | --- | --- |
| Edge TTS | No | Default, free, suitable for rapid short-form experiments |
| LucyLab | Yes | Vietnamese voice options and voice cloning |
| Vbee | Yes | Vietnamese TTS |
| ElevenLabs | Yes | Multilingual premium TTS |

For the first iteration, prefer Edge TTS. Upgrade only if voice quality becomes a real distribution bottleneck.

## Commands

```bash
npm run pipeline -- output/<slug>/script.json
npm run rerender -- output/<slug>
npm test
npm run typecheck
npm run build
```

`rerender` keeps existing voice files, which is useful when only visual changes are needed.

## V1 boundaries

This version intentionally keeps the workflow small:

- TTS is the primary voice workflow
- Product screenshots and motion graphics are supported through the existing rendering model
- Automatic browser recording and advanced video-demo composition are not part of this pass
- No platform-specific publishing automation yet

The next useful extension, once the basic output is good enough to publish, is first-class screen-recording scenes for product demos.

## License

MIT. See [LICENSE](LICENSE).

## Credits

This project is based on [Cuongyd196/auto-video-gen](https://github.com/Cuongyd196/auto-video-gen), which itself credits [hoquanghai/Auto-Create-Video](https://github.com/hoquanghai/Auto-Create-Video) as its original base.
