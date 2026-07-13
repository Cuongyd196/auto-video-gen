import axios, { AxiosError } from "axios";
import { writeFile } from "node:fs/promises";
import type { TtsClient } from "./tts-client.js";

export interface ElevenLabsOpts {
  apiKey: string;
  voiceId: string;
  modelId: string;       // e.g. "eleven_multilingual_v2", "eleven_turbo_v2_5"
  endpoint: string;      // e.g. "https://api.elevenlabs.io/v1"
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * ElevenLabs TTS client.
 *
 * API reference: https://elevenlabs.io/docs/api-reference/text-to-speech
 *
 * Synchronous: POST text → returns mp3 binary directly. No polling needed.
 * Vietnamese support via `eleven_multilingual_v2` model (default).
 *
 * Note: ElevenLabs does NOT return SRT subtitles in TTS endpoint.
 * `srtOutPath` arg is ignored silently.
 */
export class ElevenLabsClient implements TtsClient {
  constructor(private cfg: ElevenLabsOpts) {}

  async generate(text: string, audioOutPath: string, _srtOutPath?: string): Promise<void> {
    await this.synthesizeWithRetry(text, audioOutPath);
    // ElevenLabs has no SRT — silently skip srtOutPath.
  }

  private async synthesizeWithRetry(text: string, outPath: string): Promise<void> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const url = `${this.cfg.endpoint}/text-to-speech/${this.cfg.voiceId}`;
        const resp = await axios.post<ArrayBuffer>(
          url,
          {
            text,
            model_id: this.cfg.modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          },
          {
            headers: {
              "xi-api-key": this.cfg.apiKey,
              "Content-Type": "application/json",
              "Accept": "audio/mpeg",
            },
            responseType: "arraybuffer",
            timeout: 60000,
          },
        );
        await writeFile(outPath, Buffer.from(resp.data));
        return;
      } catch (e) {
        lastErr = e;
        const err = e as AxiosError;
        const status = err.response?.status;
        const retryable = status === undefined || status === 429 || status >= 500;
        if (!retryable || attempt === delays.length) {
          // Try to extract ElevenLabs error message from response body
          let detail = err.message;
          if (err.response?.data) {
            try {
              const body = err.response.data instanceof ArrayBuffer
                ? Buffer.from(err.response.data).toString("utf8")
                : String(err.response.data);
              const parsed = JSON.parse(body);
              detail = parsed?.detail?.message ?? parsed?.detail ?? detail;
            } catch { /* ignore parse errors */ }
          }
          throw new Error(`ElevenLabs TTS failed (status ${status ?? "?"}): ${detail}`);
        }
        await sleep(delays[attempt]);
      }
    }
    throw lastErr;
  }
}
