# Codex instructions

This repository is a TTS-first short-form product demo generator.

## Product goal

Turn a small amount of real product material into a publishable 9:16 short with as little manual editing as possible.

Default workflow:

```text
prompt + 2-4 screen recordings + optional screenshots
-> short script
-> TTS
-> timed product demo clips
-> baked captions / small callouts
-> video.mp4
```

The product demo is the hero. Text and motion only support it.

## Before changing code

- Read the current implementation around the requested behavior first.
- Preserve the working TTS + HyperFrames + FFmpeg pipeline unless the task requires changing it.
- Prefer a small working vertical slice over new infrastructure.
- Do not add dependencies without a concrete need.
- Do not reintroduce news-specific branding, channel names, community links or author remarks.

## Creating a product video

When asked to create a video from product material:

1. Understand the single problem, feature or workflow being promoted and the intended CTA.
2. Use only claims supported by the provided material. Do not invent metrics, testimonials or user results.
3. Prefer 2-4 short local screen recordings (`.mp4` or `.webm`). Screenshots (`.png`, `.jpg`, `.jpeg`, `.webp`) are acceptable when motion is unnecessary.
4. Reference those files from `screen-demo.templateData.src`. Paths may be absolute or relative to the repository/script location.
5. Create `output/<slug>-<timestamp>/script.json` using the current schema.
6. Default to Vietnamese and Edge TTS unless the user asks otherwise.
7. Aim for roughly 20-45 seconds and 3-6 scenes.
8. Keep each scene's `voiceText` short so one demo action maps cleanly to one spoken idea.
9. The first scene may itself be a `screen-demo` hook. Avoid making a title card when the product can be shown immediately.
10. End with one short `product-outro` scene.
11. Run the pipeline and fix schema/build errors before reporting completion.

## Product scene primitives

Prefer these primitives for new product videos:

### `screen-demo`

Use for a screen recording or screenshot.

```json
{
  "id": "change-ratio",
  "type": "body",
  "voiceText": "Chọn tỉ lệ phù hợp với nơi bạn muốn đăng.",
  "subtitle": "Chọn tỉ lệ cho từng nền tảng",
  "templateData": {
    "template": "screen-demo",
    "src": "assets/fitpic-change-ratio.mp4",
    "mediaType": "video",
    "fit": "contain",
    "layout": "full",
    "mediaStartSec": 0,
    "headline": "Một ảnh, nhiều tỉ lệ"
  }
}
```

- `layout: "full"` makes the media dominate the 9:16 canvas. Best for mobile or vertical recordings.
- `layout: "framed"` keeps room around desktop/wide recordings.
- `mediaStartSec` trims the beginning without editing the source file.
- Screen-recording audio is intentionally muted. TTS remains the narration.

### `text`

Use sparingly when a visual idea cannot be shown with the product itself.

### `product-outro`

Use only for the final product name, CTA and optional URL.

Legacy news-style templates remain for backwards compatibility but should not be the default for product demos.

## TTS writing rules

`voiceText` is spoken aloud, so write for pronunciation rather than typography.

- Use natural spoken Vietnamese.
- Keep sentences short.
- Write decimals, percentages, currency, ratios and symbols in words when TTS could pronounce them incorrectly.
- Avoid raw URLs and emoji in `voiceText`.
- End sentences with punctuation so the voice has natural pauses.
- Product and brand names may remain in their normal form when TTS pronounces them correctly.

Use `subtitle` for the cleaner on-screen version when spoken phonetics would look awkward.

## Visual direction

- Default `VIDEO_THEME=product`.
- Screen recording should occupy most of the frame.
- No persistent channel header/footer.
- No fake TikTok profile card.
- No grain, neon shell or decorative motion by default.
- Keep headline/caption overlays short and readable.
- Automatic SFX is disabled in product mode. Add SFX only with an explicit scene override.
- Prefer `text-wrap: wrap` for text.

## Verification

For code changes, run the smallest relevant checks and then:

```bash
npm test
npm run typecheck
npm run build
```

For a video generation request, also run the pipeline on the generated `script.json` when the environment has the required dependencies.

Never claim a render or test succeeded unless it was actually run successfully.
