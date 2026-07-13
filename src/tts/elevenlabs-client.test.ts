import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ElevenLabsClient } from "./elevenlabs-client.js";

const opts = {
  apiKey: "sk_eleven_test",
  voiceId: "EXAVITQu4vr4xnSDxMaL",
  modelId: "eleven_multilingual_v2",
  endpoint: "https://api.elevenlabs.io/v1",
};

let tmpDir: string;

beforeEach(() => {
  nock.cleanAll();
  tmpDir = mkdtempSync(join(tmpdir(), "el-test-"));
});

afterEach(() => {
  nock.cleanAll();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("ElevenLabsClient", () => {
  it("posts text and writes mp3 response to disk", async () => {
    nock("https://api.elevenlabs.io")
      .post(
        `/v1/text-to-speech/${opts.voiceId}`,
        (b: any) => b.text === "Xin chào" && b.model_id === opts.modelId
      )
      .matchHeader("xi-api-key", opts.apiKey)
      .reply(200, Buffer.from("MP3DATA"), { "content-type": "audio/mpeg" });

    const client = new ElevenLabsClient(opts);
    const out = join(tmpDir, "out.mp3");
    await client.generate("Xin chào", out);
    expect(readFileSync(out).toString()).toBe("MP3DATA");
  });

  it("retries on 429 (rate limit) with backoff", async () => {
    nock("https://api.elevenlabs.io")
      .post(`/v1/text-to-speech/${opts.voiceId}`).reply(429, { detail: { message: "rate limit" } })
      .post(`/v1/text-to-speech/${opts.voiceId}`).reply(200, Buffer.from("OK"), { "content-type": "audio/mpeg" });

    const client = new ElevenLabsClient(opts);
    const out = join(tmpDir, "out.mp3");
    await client.generate("hi", out);
    expect(readFileSync(out).toString()).toBe("OK");
  }, 10000);

  it("retries on 5xx with backoff", async () => {
    nock("https://api.elevenlabs.io")
      .post(`/v1/text-to-speech/${opts.voiceId}`).reply(503, "Service Unavailable")
      .post(`/v1/text-to-speech/${opts.voiceId}`).reply(200, Buffer.from("OK2"), { "content-type": "audio/mpeg" });

    const client = new ElevenLabsClient(opts);
    const out = join(tmpDir, "out.mp3");
    await client.generate("hi", out);
    expect(readFileSync(out).toString()).toBe("OK2");
  }, 10000);

  it("throws with API error detail on 4xx (not 429)", async () => {
    nock("https://api.elevenlabs.io")
      .post(`/v1/text-to-speech/${opts.voiceId}`)
      .reply(401, { detail: { message: "Invalid API key" } });

    const client = new ElevenLabsClient(opts);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/Invalid API key|401/);
  });

  it("ignores srtOutPath silently (ElevenLabs has no SRT)", async () => {
    nock("https://api.elevenlabs.io")
      .post(`/v1/text-to-speech/${opts.voiceId}`)
      .reply(200, Buffer.from("MP3"), { "content-type": "audio/mpeg" });

    const client = new ElevenLabsClient(opts);
    const out = join(tmpDir, "out.mp3");
    const srt = join(tmpDir, "out.srt");
    await client.generate("hi", out, srt);
    // mp3 written, srt NOT written (no error)
    expect(readFileSync(out).toString()).toBe("MP3");
    expect(() => readFileSync(srt)).toThrow();
  });
});
