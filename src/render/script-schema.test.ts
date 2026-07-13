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

  it("rejects invalid-bad-enum.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-bad-enum.json"))).toThrow(/kenBurns/);
  });

  it("rejects invalid-too-many-scenes.json", () => {
    expect(() => ScriptSchema.parse(load("invalid-too-many-scenes.json"))).toThrow(/scenes/);
  });

  it("rejects invalid-line-too-long.json", () => {
    // headline is over 40 chars — Zod error references the max value
    expect(() => ScriptSchema.parse(load("invalid-line-too-long.json"))).toThrow(/40/);
  });

  it("requires hook + outro present", () => {
    const data = load("sample-script-with-image.json");
    data.scenes = data.scenes.filter((s: any) => s.type !== "outro");
    expect(() => ScriptSchema.parse(data)).toThrow(/outro/);
  });
});
