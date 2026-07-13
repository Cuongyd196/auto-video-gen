import axios, { AxiosError } from "axios";
import { writeFile } from "node:fs/promises";
import type { TtsClient } from "./tts-client.js";

export interface VbeeOpts {
  appId: string;
  accessToken: string;
  endpoint: string;      // e.g. "https://vbee.vn/api/v1"
  voiceCode: string;     // e.g. "n_hanoi_male_protrainer_education_vc"
  speedRate: number;     // 0.1 - 1.9, default 1.0
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

interface VbeeOkResponse<T> { status: 1; result: T; }
interface VbeeErrResponse { status: 0; error_code: string; error_message: string; }
type VbeeResponse<T> = VbeeOkResponse<T> | VbeeErrResponse;

interface TtsCreateResult {
  request_id: string;
  status: string;
  audio_link?: string;
}

interface TtsStatusResult {
  request_id: string;
  status: "IN_PROGRESS" | "SUCCESS" | "FAILURE" | string;
  audio_link?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Vbee returned status=0 (application-level error) — not retryable. */
class VbeeApiError extends Error {}

/**
 * Vbee TTS client (https://vbee.vn).
 *
 * Async model: POST creates a request (callback_url required by the API but
 * unused here — we poll instead), then GET /tts/{request_id} until
 * status=SUCCESS and an audio_link is available.
 *
 * Vbee has no SRT output — `srtOutPath` arg is ignored silently.
 */
export class VbeeClient implements TtsClient {
  constructor(private cfg: VbeeOpts) {}

  async generate(text: string, audioOutPath: string, _srtOutPath?: string): Promise<void> {
    const created = await this.submitWithRetry(text);
    const audioLink = created.audio_link ?? (await this.pollUntilDone(created.request_id));
    await this.download(audioLink, audioOutPath);
  }

  private async submitWithRetry(text: string): Promise<TtsCreateResult> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const resp = await axios.post<VbeeResponse<TtsCreateResult>>(
          `${this.cfg.endpoint}/tts`,
          {
            app_id: this.cfg.appId,
            input_text: text,
            voice_code: this.cfg.voiceCode,
            audio_type: "mp3",
            speed_rate: this.cfg.speedRate,
            callback_url: "https://example.com/callback",
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.cfg.accessToken}`,
            },
            timeout: 30000,
          },
        );
        const body = resp.data;
        if (body.status !== 1) {
          throw new VbeeApiError(`Vbee TTS create error: ${body.error_message ?? body.error_code}`);
        }
        return body.result;
      } catch (e) {
        lastErr = e;
        if (e instanceof VbeeApiError) throw e;
        const status = (e as AxiosError).response?.status;
        const retryable = status === undefined || status >= 500;
        if (!retryable || attempt === delays.length) throw e;
        await sleep(delays[attempt]);
      }
    }
    throw lastErr;
  }

  private async pollUntilDone(requestId: string): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < this.cfg.pollTimeoutMs) {
      const resp = await axios.get<VbeeResponse<TtsStatusResult>>(
        `${this.cfg.endpoint}/tts/${requestId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.cfg.accessToken}`,
          },
          timeout: 30000,
        },
      );
      const body = resp.data;
      if (body.status === 1) {
        if (body.result.status === "SUCCESS" && body.result.audio_link) {
          return body.result.audio_link;
        }
        if (body.result.status === "FAILURE") {
          throw new Error(`Vbee export ${requestId} failed`);
        }
        // IN_PROGRESS → keep polling
      }
      await sleep(this.cfg.pollIntervalMs);
    }
    throw new Error(`Vbee export ${requestId} polling timeout after ${this.cfg.pollTimeoutMs}ms`);
  }

  private async download(url: string, outPath: string): Promise<void> {
    const resp = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer", timeout: 60000 });
    await writeFile(outPath, Buffer.from(resp.data));
  }
}
