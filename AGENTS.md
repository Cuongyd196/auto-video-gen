# Codex instructions

This repository is a TTS-first short-form product video generator.

## Product goal

Turn real product material into a publishable 9:16 short video with as little manual editing as possible.

Primary workflow:

```text
product context + screenshots
-> short script
-> TTS
-> timed visuals
-> subtitles/assets
-> video.mp4
```

The main use case is product distribution on TikTok, YouTube Shorts and Facebook Reels.

## Before changing code

- Read the current implementation around the requested behavior first.
- Preserve the existing HyperFrames + FFmpeg + TTS pipeline unless the task requires changing it.
- Prefer a small working vertical slice over new infrastructure.
- Do not add dependencies without a concrete need.
- Do not reintroduce news-specific branding, channel names, community links or author remarks.

## Creating a product video

When asked to create a video from product material:

1. Understand the product, the single problem/feature being promoted and the intended CTA.
2. Use only claims supported by the provided material. Do not invent metrics, testimonials or user results.
3. Create `output/<slug>-<timestamp>/script.json` using the existing schema.
4. Default to Vietnamese unless the user asks for another language.
5. Default to Edge TTS unless another provider is explicitly requested.
6. Aim for roughly 25-45 seconds for normal product shorts. It is acceptable to be outside that range when the content needs it.
7. Use 5-8 scenes with a simple structure such as:
   - hook
   - problem
   - product/feature
   - benefit
   - CTA/outro
8. Run the pipeline and fix schema/build errors before reporting completion.
9. Report the generated video path and any limitation that still requires manual work.

## TTS writing rules

`voiceText` is spoken aloud, so write for pronunciation rather than typography.

- Use natural spoken Vietnamese.
- Keep sentences short.
- Write decimals, percentages, currency, ratios and symbols in words when TTS could pronounce them incorrectly.
- Avoid raw URLs in `voiceText`.
- Avoid emoji in `voiceText`.
- End sentences with punctuation so the voice has natural pauses.
- Product and brand names may remain in their normal form when TTS pronounces them correctly.

Visual text can keep normal forms such as `4:5`, `9:16`, `16:9`, `%`, `$` and product version numbers.

## Product-video style

Prefer clear product communication over decorative motion.

Use the existing templates as building blocks:

- `hook` for the first idea/problem
- `comparison` for before/after or option comparison
- `stat-hero` only when a real number matters
- `feature-list` for 2-4 concise capabilities
- `callout` for one important benefit or constraint
- `outro` for the product name and CTA

Do not force every video to use every template.

## Verification

For code changes, run the smallest relevant checks and then:

```bash
npm test
npm run typecheck
npm run build
```

For an actual video generation request, also run the pipeline on the generated `script.json` when the environment has the required dependencies.

Never claim a render or test succeeded unless it was actually run successfully.
