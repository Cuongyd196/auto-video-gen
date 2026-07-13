import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fetchImage } from "./image-fetcher.js";

let tmp: string;
beforeEach(() => { nock.cleanAll(); tmp = mkdtempSync(join(tmpdir(), "img-")); });
afterEach(() => { nock.cleanAll(); rmSync(tmp, { recursive: true, force: true }); });

// 1x1 jpg (smallest valid)
const TINY_JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);

describe("fetchImage", () => {
  it("downloads ok image and returns local path", async () => {
    nock("https://example.com").get("/img.jpg")
      .reply(200, TINY_JPG, { "content-type": "image/jpeg" });
    const out = join(tmp, "bg.jpg");
    const result = await fetchImage("https://example.com/img.jpg", out);
    expect(result.success).toBe(true);
    expect(result.path).toBe(out);
    expect(existsSync(out)).toBe(true);
  });

  it("returns failure on 404", async () => {
    nock("https://example.com").get("/missing.jpg").reply(404);
    const result = await fetchImage("https://example.com/missing.jpg", join(tmp, "x.jpg"));
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/404|http/i);
  });

  it("returns failure on non-image content-type", async () => {
    nock("https://example.com").get("/page.html")
      .reply(200, "<html></html>", { "content-type": "text/html" });
    const result = await fetchImage("https://example.com/page.html", join(tmp, "x.jpg"));
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/content-type|image/i);
  });

  it("returns failure on null url input", async () => {
    const result = await fetchImage(null, join(tmp, "x.jpg"));
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/no url|null/i);
  });
});
