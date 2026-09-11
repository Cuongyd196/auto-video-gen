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

  it("accepts a product demo using local media", () => {
    const data = {
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
            src: "assets/demo/01-upload.mp4",
            mediaType: "video",
            fit: "contain",
            layout: "full",
            mediaStartSec: 0,
            headline: "Đăng ảnh ở nhiều nơi?",
          },
        },
        {
          id: "ratio",
          type: "body",
          voiceText: "FitPic giúp đổi tỉ lệ mà vẫn giữ nội dung chính.",
          templateData: {
            template: "screen-demo",
            src: "assets/demo/02-change-ratio.mp4",
            mediaType: "video",
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
    };

    const parsed = ScriptSchema.parse(data);
    expect(parsed.scenes).toHaveLength(3);
    expect(parsed.scenes[1].templateData.template).toBe("screen-demo");
  });

  it("rejects invalid-bad-enum.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-bad-enum.json"))).toThrow(/kenBurns/);
  });

  it("rejects invalid-too-many-scenes.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-too-many-scenes.json"))).toThrow(/scenes/);
  });

  it("rejects invalid-line-too-long.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-line-too-long.json"))).toThrow(/40/);
  });

  it("requires hook + outro present", () => {
    const data = load("sample-script-with-image.json");
    data.scenes = data.scenes.filter((s: any) => s.type !== "outro");
    expect(() => ScriptSchema.parse(data)).toThrow(/outro/);
  });
});
