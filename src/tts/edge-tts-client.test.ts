import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let mockSynthesizeImpl: () => Promise<any>;

vi.mock("edge-tts-universal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("edge-tts-universal")>();
  return {
    ...actual,
    EdgeTTS: class {
      text: string;
      voice?: string;
      options?: any;
      constructor(text: string, voice?: string, options?: any) {
        this.text = text;
        this.voice = voice;
        this.options = options;
      }
      synthesize() {
        return mockSynthesizeImpl();
      }
    },
  };
});

import { EdgeTtsClient } from "./edge-tts-client.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "edge-tts-test-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("EdgeTtsClient", () => {
  it("synthesizes audio and writes mp3 and srt to disk", async () => {
    const fakeAudioBytes = new Uint8Array([1, 2, 3, 4]);
    mockSynthesizeImpl = vi.fn().mockResolvedValue({
      audio: new Blob([fakeAudioBytes]),
      subtitle: [
        { offset: 1000000, duration: 2000000, text: "Xin" },
        { offset: 3000000, duration: 2000000, text: "chào" },
      ],
    });

    const client = new EdgeTtsClient({
      voice: "vi-VN-HoaiMyNeural",
      rate: "+5%",
      pitch: "+0Hz",
      volume: "+0%",
    });

    const audioOut = join(tmpDir, "voice.mp3");
    const srtOut = join(tmpDir, "voice.srt");

    await client.generate("Xin chào", audioOut, srtOut);

    expect(existsSync(audioOut)).toBe(true);
    expect(readFileSync(audioOut)).toEqual(Buffer.from(fakeAudioBytes));
    expect(existsSync(srtOut)).toBe(true);
    const srtContent = readFileSync(srtOut, "utf8");
    expect(srtContent).toContain("Xin");
    expect(srtContent).toContain("chào");
  });

  it("skips srt when srtOutPath is omitted", async () => {
    const fakeAudioBytes = new Uint8Array([5, 6, 7]);
    mockSynthesizeImpl = vi.fn().mockResolvedValue({
      audio: new Blob([fakeAudioBytes]),
      subtitle: [{ offset: 1000000, duration: 2000000, text: "Test" }],
    });

    const client = new EdgeTtsClient({
      voice: "vi-VN-NamMinhNeural",
    });

    const audioOut = join(tmpDir, "voice-only.mp3");
    await client.generate("Test", audioOut);

    expect(existsSync(audioOut)).toBe(true);
    expect(readFileSync(audioOut)).toEqual(Buffer.from(fakeAudioBytes));
  });

  it("retries on error with backoff and succeeds", async () => {
    const fakeAudioBytes = new Uint8Array([8, 9, 10]);
    let callCount = 0;
    mockSynthesizeImpl = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Temporary WebSocket network failure");
      }
      return {
        audio: new Blob([fakeAudioBytes]),
        subtitle: [],
      };
    });

    const client = new EdgeTtsClient({
      voice: "vi-VN-HoaiMyNeural",
    });

    const audioOut = join(tmpDir, "retry.mp3");
    await client.generate("Retry test", audioOut);

    expect(callCount).toBe(2);
    expect(existsSync(audioOut)).toBe(true);
  });
});
