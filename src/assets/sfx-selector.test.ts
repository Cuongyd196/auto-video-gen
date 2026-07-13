import { describe, it, expect } from "vitest";
import { pickSfxForScene, type SfxIndex } from "./sfx-selector.js";

const FAKE_INDEX: SfxIndex = {
  transition: ["whoosh.mp3", "swoosh.mp3", "pop.mp3"],
  emphasis:   ["ding.mp3", "tick.mp3"],
  alert:      ["notification.mp3", "alarm.mp3"],
  success:    ["win.mp3", "achievement.mp3"],
  fail:       ["wrong.mp3", "error.mp3"],
  reveal:     ["magic.mp3"],
  outro:      ["tada.mp3"],
};

describe("pickSfxForScene", () => {
  it("falls back to template default when no semantic match", () => {
    const r = pickSfxForScene({
      voiceText: "OpenAI vừa giới thiệu GPT 5.5 với cửa sổ ngữ cảnh lớn hơn.",
      templateName: "stat-hero",
      sceneId: "body-1",
      index: FAKE_INDEX,
    });
    expect(r).not.toBeNull();
    // stat-hero → emphasis (or success)
    expect(["emphasis", "success"]).toContain(r!.relPath.split("/")[0]);
    expect(r!.source).toBe("template");
  });

  it("uses semantic match for warning content (override of template default)", () => {
    const r = pickSfxForScene({
      voiceText: "Cảnh báo: AI tự chủ có thể đặt ra rủi ro về an ninh mạng.",
      templateName: "stat-hero",   // would normally be emphasis
      sceneId: "body-2",
      index: FAKE_INDEX,
    });
    expect(r).not.toBeNull();
    expect(r!.relPath.startsWith("alert/")).toBe(true);
    expect(r!.source).toBe("semantic");
    expect(r!.matchedKeyword).toMatch(/cảnh báo/i);
  });

  it("uses success category for record/breakthrough content", () => {
    const r = pickSfxForScene({
      voiceText: "Mô hình đạt kỷ lục 95% trên benchmark lớn nhất.",
      templateName: "comparison",
      sceneId: "body-3",
      index: FAKE_INDEX,
    });
    expect(r).not.toBeNull();
    expect(r!.relPath.startsWith("success/")).toBe(true);
    expect(r!.source).toBe("semantic");
  });

  it("uses fail category for failure content", () => {
    const r = pickSfxForScene({
      voiceText: "Sự cố nghiêm trọng khiến hệ thống bị crash hoàn toàn.",
      templateName: "callout",
      sceneId: "body-4",
      index: FAKE_INDEX,
    });
    expect(r).not.toBeNull();
    expect(r!.relPath.startsWith("fail/")).toBe(true);
  });

  it("uses reveal category for launch/unveil content", () => {
    const r = pickSfxForScene({
      voiceText: "Apple chính thức ra mắt iPhone 17 vào tuần tới.",
      templateName: "hook",
      sceneId: "hook",
      index: FAKE_INDEX,
    });
    expect(r).not.toBeNull();
    expect(r!.relPath.startsWith("reveal/")).toBe(true);
  });

  it("returns deterministic result for same scene id", () => {
    const r1 = pickSfxForScene({
      voiceText: "neutral text", templateName: "feature-list",
      sceneId: "body-X", index: FAKE_INDEX,
    });
    const r2 = pickSfxForScene({
      voiceText: "neutral text", templateName: "feature-list",
      sceneId: "body-X", index: FAKE_INDEX,
    });
    expect(r1!.relPath).toBe(r2!.relPath);
  });

  it("returns DIFFERENT files for different scene ids (variety)", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const picks = ids.map((id) =>
      pickSfxForScene({
        voiceText: "neutral text", templateName: "feature-list",
        sceneId: id, index: FAKE_INDEX,
      })!.relPath
    );
    // At least 2 unique picks across 5 scenes (with pool size 3)
    const unique = new Set(picks);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });

  it("falls back gracefully when template categories are empty", () => {
    const sparseIndex: SfxIndex = { outro: ["tada.mp3"] }; // only outro
    const r = pickSfxForScene({
      voiceText: "no keywords here",
      templateName: "hook",
      sceneId: "hook",
      index: sparseIndex,
    });
    expect(r).not.toBeNull();
    expect(r!.relPath).toBe("outro/tada.mp3");
    expect(r!.source).toBe("fallback");
  });

  it("returns null when index is empty", () => {
    const r = pickSfxForScene({
      voiceText: "anything",
      templateName: "hook",
      sceneId: "hook",
      index: {},
    });
    expect(r).toBeNull();
  });
});
