import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LucylabClient } from "./lucylab-client.js";

const cfg = {
  apiKey: "sk_test_abc",
  voiceId: "v1",
  endpoint: "https://api.lucylab.io/json-rpc",
  pollIntervalMs: 50,
  pollTimeoutMs: 5000,
};

let tmpDir: string;

beforeEach(() => {
  nock.cleanAll();
  tmpDir = mkdtempSync(join(tmpdir(), "lucylab-test-"));
});

afterEach(() => {
  nock.cleanAll();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("LucylabClient", () => {
  it("submits text + polls until done + downloads audio", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc", (b: any) => b.method === "ttsLongText" && b.input.text === "xin chào")
      .reply(200, { jsonrpc: "2.0", id: "1", result: { projectExportId: "exp-1", characterCount: 8, blockCount: 1 } });

    nock("https://api.lucylab.io")
      .post("/json-rpc", (b: any) => b.method === "getExportStatus" && b.input.projectExportId === "exp-1")
      .reply(200, { jsonrpc: "2.0", id: "2", result: { jobId: "exp-1", state: "pending" } });

    nock("https://api.lucylab.io")
      .post("/json-rpc", (b: any) => b.method === "getExportStatus" && b.input.projectExportId === "exp-1")
      .reply(200, { jsonrpc: "2.0", id: "3", result: { jobId: "exp-1", state: "completed", url: "https://cdn.lucylab.io/exp-1.wav", srtUrl: "https://cdn.lucylab.io/exp-1.srt" } });

    nock("https://cdn.lucylab.io").get("/exp-1.wav").reply(200, Buffer.from("WAVDATA"));
    nock("https://cdn.lucylab.io").get("/exp-1.srt").reply(200, Buffer.from("SRTDATA"));

    const client = new LucylabClient(cfg);
    const out = join(tmpDir, "out.mp3");
    const srtOut = join(tmpDir, "out.srt");
    await client.generate("xin chào", out, srtOut);
    expect(readFileSync(out).toString()).toBe("WAVDATA");
    expect(readFileSync(srtOut).toString()).toBe("SRTDATA");
  });

  it("retries on 5xx with backoff", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(503, "Service Unavailable")
      .post("/json-rpc").reply(503, "Service Unavailable")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { projectExportId: "exp-2", characterCount: 2, blockCount: 1 } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "2", result: { jobId: "exp-2", state: "completed", url: "https://cdn.lucylab.io/exp-2.wav" } });

    nock("https://cdn.lucylab.io").get("/exp-2.wav").reply(200, Buffer.from("OK"));

    const client = new LucylabClient(cfg);
    const out = join(tmpDir, "out.mp3");
    await client.generate("hi", out);
    expect(readFileSync(out).toString()).toBe("OK");
  }, 15000);  // larger timeout because of backoff delays

  it("throws if poll exceeds timeout", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { projectExportId: "exp-3", characterCount: 2, blockCount: 1 } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").times(200).reply(200, { jsonrpc: "2.0", id: "x", result: { jobId: "exp-3", state: "pending" } });

    const fastCfg = { ...cfg, pollTimeoutMs: 200, pollIntervalMs: 50 };
    const client = new LucylabClient(fastCfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/timeout|exp-3/);
  });

  it("throws if state=failed", async () => {
    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, { jsonrpc: "2.0", id: "1", result: { projectExportId: "exp-4", characterCount: 2, blockCount: 1 } });

    nock("https://api.lucylab.io")
      .post("/json-rpc").reply(200, {
        jsonrpc: "2.0", id: "2",
        result: { jobId: "exp-4", state: "failed", error: "voice unavailable" },
      });

    const client = new LucylabClient(cfg);
    await expect(client.generate("hi", join(tmpDir, "out.mp3")))
      .rejects.toThrow(/failed|voice unavailable/);
  });
});
