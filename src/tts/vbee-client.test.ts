import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { VbeeClient } from "./vbee-client.js";

const cfg = {
  appId: "app-1",
  accessToken: "token-abc",
  endpoint: "https://vbee.vn/api/v1",
  voiceCode: "n_hanoi_male_protrainer_education_vc",
  speedRate: 1.0,
  pollIntervalMs: 50,
  pollTimeoutMs: 5000,
};

let tmpDir: string;

beforeEach(() => {
  nock.cleanAll();
  tmpDir = mkdtempSync(join(tmpdir(), "vbee-test-"));
});

afterEach(() => {
  nock.cleanAll();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("VbeeClient", () => {
  it("submits text + polls until done + downloads audio", async () => {
    nock("https://vbee.vn")
      .post("/api/v1/tts", (b: any) => b.app_id === "app-1" && b.input_text === "xin chào")
      .reply(200, { status: 1, result: { request_id: "req-1", status: "IN_PROGRESS" } });

    nock("https://vbee.vn")
      .get("/api/v1/tts/req-1")
      .reply(200, { status: 1, result: { request_id: "req-1", status: "IN_PROGRESS" } });

    nock("https://vbee.vn")
      .get("/api/v1/tts/req-1")
      .reply(200, { status: 1, result: { request_id: "req-1", status: "SUCCESS", audio_link: "https://cdn.vbee.vn/req-1.mp3" } });

    nock("https://cdn.vbee.vn").get("/req-1.mp3").reply(200, Buffer.from("MP3DATA"));

    const client = new VbeeClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("xin chào", out);
    expect(readFileSync(out).toString()).toBe("MP3DATA");
  });

  it("returns audio immediately when audio_link is present on create", async () => {
    nock("https://vbee.vn")
      .post("/api/v1/tts")
      .reply(200, { status: 1, result: { request_id: "req-2", status: "SUCCESS", audio_link: "https://cdn.vbee.vn/req-2.mp3" } });

    nock("https://cdn.vbee.vn").get("/req-2.mp3").reply(200, Buffer.from("OK"));

    const client = new VbeeClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("hi", out);
    expect(readFileSync(out).toString()).toBe("OK");
  });

  it("retries create on 5xx with backoff", async () => {
    nock("https://vbee.vn")
      .post("/api/v1/tts").reply(503, "Service Unavailable")
      .post("/api/v1/tts").reply(503, "Service Unavailable")
      .post("/api/v1/tts").reply(200, { status: 1, result: { request_id: "req-3", status: "SUCCESS", audio_link: "https://cdn.vbee.vn/req-3.mp3" } });

    nock("https://cdn.vbee.vn").get("/req-3.mp3").reply(200, Buffer.from("OK"));

    const client = new VbeeClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("hi", out);
    expect(readFileSync(out).toString()).toBe("OK");
  }, 15000);

  it("throws if create returns status=0", async () => {
    nock("https://vbee.vn")
      .post("/api/v1/tts")
      .reply(200, { status: 0, error_code: "INVALID_TOKEN", error_message: "Token không hợp lệ" });

    const client = new VbeeClient(cfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/Token không hợp lệ|INVALID_TOKEN/);
  });

  it("throws if status=FAILURE while polling", async () => {
    nock("https://vbee.vn")
      .post("/api/v1/tts")
      .reply(200, { status: 1, result: { request_id: "req-4", status: "IN_PROGRESS" } });

    nock("https://vbee.vn")
      .get("/api/v1/tts/req-4")
      .reply(200, { status: 1, result: { request_id: "req-4", status: "FAILURE" } });

    const client = new VbeeClient(cfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/failed|req-4/);
  });

  it("throws if poll exceeds timeout", async () => {
    nock("https://vbee.vn")
      .post("/api/v1/tts")
      .reply(200, { status: 1, result: { request_id: "req-5", status: "IN_PROGRESS" } });

    nock("https://vbee.vn")
      .get("/api/v1/tts/req-5")
      .times(200)
      .reply(200, { status: 1, result: { request_id: "req-5", status: "IN_PROGRESS" } });

    const fastCfg = { ...cfg, pollTimeoutMs: 200, pollIntervalMs: 50 };
    const client = new VbeeClient(fastCfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/timeout|req-5/);
  });
});
