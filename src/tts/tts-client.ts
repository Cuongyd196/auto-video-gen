/**
 * Common TTS client interface.
 *
 * All providers (LucyLab, ElevenLabs) implement this so the pipeline
 * can swap providers without changing orchestration logic.
 */
export interface TtsClient {
  /**
   * Generate speech audio for `text` and write to `audioOutPath` (mp3 or wav).
   * If `srtOutPath` is provided AND the provider supports subtitles,
   * write the SRT to that path. Otherwise silently skip.
   */
  generate(text: string, audioOutPath: string, srtOutPath?: string): Promise<void>;
}

import type { Config } from "../config.js";
import { LucylabClient } from "./lucylab-client.js";
import { ElevenLabsClient } from "./elevenlabs-client.js";
import { VbeeClient } from "./vbee-client.js";

export function createTtsClient(cfg: Config): TtsClient {
  switch (cfg.ttsProvider) {
    case "lucylab":
      return new LucylabClient({
        apiKey: cfg.lucylabApiKey!,
        voiceId: cfg.lucylabVoiceId!,
        endpoint: cfg.lucylabEndpoint,
        pollIntervalMs: cfg.lucylabPollIntervalMs,
        pollTimeoutMs: cfg.lucylabPollTimeoutMs,
      });
    case "elevenlabs":
      return new ElevenLabsClient({
        apiKey: cfg.elevenlabsApiKey!,
        voiceId: cfg.elevenlabsVoiceId!,
        modelId: cfg.elevenlabsModelId,
        endpoint: cfg.elevenlabsEndpoint,
      });
    case "vbee":
      return new VbeeClient({
        appId: cfg.vbeeAppId!,
        accessToken: cfg.vbeeAccessToken!,
        endpoint: cfg.vbeeEndpoint,
        voiceCode: cfg.vbeeVoiceCode,
        speedRate: cfg.vbeeSpeedRate,
        pollIntervalMs: cfg.vbeePollIntervalMs,
        pollTimeoutMs: cfg.vbeePollTimeoutMs,
      });
    default: {
      const _never: never = cfg.ttsProvider;
      throw new Error(`Unknown TTS provider: ${_never}`);
    }
  }
}
