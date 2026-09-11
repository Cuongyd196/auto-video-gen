import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { composeHtml } from "./html-composer.js";
import { ScriptSchema, type Script } from "./script-schema.js";

describe("composeHtml", () => {
  it("keeps legacy scripts renderable", () => {
    const script = JSON.parse(readFileSync("tests/fixtures/sample-script-with-image.json", "utf8")) as Script;
    const sceneAudio = [
      { id: "hook", durationSec: 3.2 },
      { id: "body-1", durationSec: 11.5 },
      { id: "body-2", durationSec: 10.8 },
      { id: "body-3", durationSec: 12.1 },
      { id: "outro", durationSec: 3.4 },
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
    expect(html).toContain('id="voice"');
    expect(html).toContain('data-track-index="10"');
    expect(html).toContain('class="brand-shell-header"');
    expect(html).toContain('data-layout="hook"');
    expect(html).toContain("background-image: url('images/bg.jpg')");
    expect(html).toContain('data-layout="outro"');
    expect(html).toContain('src="voice.mp3"');
    expect(html).toContain('window.__timelines');
  });

  it("renders product screen recordings as first-class HyperFrames media", () => {
    const script = ScriptSchema.parse({
      version: "1.0",
      metadata: { title: "FitPic demo" },
      voice: { provider: "edge-tts", voiceId: "vi-VN-NamMinhNeural", speed: 1 },
      scenes: [
        {
          id: "hook",
          type: "hook",
          voiceText: "Một ảnh nhưng mỗi nơi lại cần một tỉ lệ khác nhau.",
          subtitle: "Một ảnh, nhiều tỉ lệ",
          templateData: {
            template: "screen-demo",
            src: "assets/demo/upload.mp4",
            mediaType: "video",
            fit: "contain",
            layout: "full",
            mediaStartSec: 1.5,
            headline: "Đăng ảnh ở nhiều nơi?",
          },
        },
        {
          id: "ratio",
          type: "body",
          voiceText: "Chọn tỉ lệ phù hợp với nơi bạn muốn đăng.",
          templateData: {
            template: "screen-demo",
            src: "assets/demo/ratio.png",
            mediaType: "image",
            fit: "contain",
            layout: "framed",
          },
        },
        {
          id: "outro",
          type: "outro",
          voiceText: "Thử FitPic miễn phí ngay bây giờ.",
          templateData: {
            template: "product-outro",
            productName: "FitPic",
            cta: "Thử miễn phí",
            url: "fitpic.namnth.com",
          },
        },
      ],
    });

    const html = composeHtml({
      script,
      sceneAudio: [
        { id: "hook", durationSec: 4 },
        { id: "ratio", durationSec: 4 },
        { id: "outro", durationSec: 3 },
      ],
      gapSec: 0.3,
      bgImageRelPath: null,
      audioRelPath: "voice.mp3",
      sceneMediaRelPaths: {
        hook: "media/hook.mp4",
        ratio: "media/ratio.png",
      },
      productMode: true,
      outroHoldSec: 1,
    });

    expect(html).toContain('<video id="media-hook"');
    expect(html).toContain('src="media/hook.mp4"');
    expect(html).toContain('data-media-start="1.50"');
    expect(html).toContain('muted playsinline');
    expect(html).toContain('<img id="media-ratio"');
    expect(html).toContain('class="clip product-demo-media layout-framed fit-contain"');
    expect(html).toContain('class="product-demo-subtitle">Một ảnh, nhiều tỉ lệ</div>');
    expect(html).toContain('data-layout="product-outro"');
    expect(html).toContain("fitpic.namnth.com");
    expect(html).not.toContain('class="brand-shell-header"');
    expect(html).not.toContain('id="tt-card"');
  });
});
