import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const ENV_KEYS = [
  "TTS_PROVIDER",
  "EDGE_TTS_VOICE",
  "EDGE_TTS_RATE",
  "EDGE_TTS_PITCH",
  "EDGE_TTS_VOLUME",
  "VIETNAMESE_API_KEY",
  "VIETNAMESE_VOICEID",
  "LUCYLAB_ENDPOINT",
  "LUCYLAB_POLL_INTERVAL_MS",
  "LUCYLAB_POLL_TIMEOUT_MS",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "ELEVENLABS_MODEL_ID",
  "ELEVENLABS_ENDPOINT",
  "VBEE_APP_ID",
  "VBEE_ACCESS_TOKEN",
  "VBEE_ENDPOINT",
  "VBEE_VOICE_CODE",
  "VBEE_SPEED_RATE",
  "VBEE_POLL_INTERVAL_MS",
  "VBEE_POLL_TIMEOUT_MS",
  "TTS_CONCURRENCY",
];

describe("loadConfig", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    Object.entries(saved).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
  });

  describe("Edge TTS provider (default)", () => {
    it("reads Edge TTS defaults when no provider specified", () => {
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("edge-tts");
      expect(cfg.edgeTtsVoice).toBe("vi-VN-HoaiMyNeural");
      expect(cfg.edgeTtsRate).toBe("+0%");
      expect(cfg.edgeTtsPitch).toBe("+0Hz");
      expect(cfg.edgeTtsVolume).toBe("+0%");
      expect(cfg.ttsConcurrency).toBe(1);
    });

    it("respects EDGE_TTS overrides", () => {
      process.env.TTS_PROVIDER = "edge-tts";
      process.env.EDGE_TTS_VOICE = "vi-VN-NamMinhNeural";
      process.env.EDGE_TTS_RATE = "+10%";
      process.env.EDGE_TTS_PITCH = "+5Hz";
      process.env.EDGE_TTS_VOLUME = "-10%";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("edge-tts");
      expect(cfg.edgeTtsVoice).toBe("vi-VN-NamMinhNeural");
      expect(cfg.edgeTtsRate).toBe("+10%");
      expect(cfg.edgeTtsPitch).toBe("+5Hz");
      expect(cfg.edgeTtsVolume).toBe("-10%");
    });

    it("accepts 'edgetts' as alias for 'edge-tts'", () => {
      process.env.TTS_PROVIDER = "edgetts";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("edge-tts");
    });
  });

  describe("LucyLab provider", () => {
    it("reads LucyLab env vars when TTS_PROVIDER=lucylab", () => {
      process.env.TTS_PROVIDER = "lucylab";
      process.env.VIETNAMESE_API_KEY = "sk_test_abc";
      process.env.VIETNAMESE_VOICEID = "voice123";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("lucylab");
      expect(cfg.lucylabApiKey).toBe("sk_test_abc");
      expect(cfg.lucylabVoiceId).toBe("voice123");
    });

    it("throws when VIETNAMESE_API_KEY missing", () => {
      process.env.TTS_PROVIDER = "lucylab";
      process.env.VIETNAMESE_VOICEID = "voice123";
      expect(() => loadConfig()).toThrow(/VIETNAMESE_API_KEY/);
    });

    it("uses sensible defaults for optional vars", () => {
      process.env.TTS_PROVIDER = "lucylab";
      process.env.VIETNAMESE_API_KEY = "k";
      process.env.VIETNAMESE_VOICEID = "v";
      const cfg = loadConfig();
      expect(cfg.lucylabEndpoint).toBe("https://api.lucylab.io/json-rpc");
      expect(cfg.lucylabPollIntervalMs).toBe(2000);
      expect(cfg.lucylabPollTimeoutMs).toBe(120000);
      expect(cfg.ttsConcurrency).toBe(1);
    });
  });

  describe("ElevenLabs provider", () => {
    it("reads ElevenLabs env vars when TTS_PROVIDER=elevenlabs", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_API_KEY = "sk_eleven_xyz";
      process.env.ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("elevenlabs");
      expect(cfg.elevenlabsApiKey).toBe("sk_eleven_xyz");
      expect(cfg.elevenlabsVoiceId).toBe("EXAVITQu4vr4xnSDxMaL");
      expect(cfg.elevenlabsModelId).toBe("eleven_multilingual_v2");
      expect(cfg.elevenlabsEndpoint).toBe("https://api.elevenlabs.io/v1");
    });

    it("throws when ELEVENLABS_API_KEY missing", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_VOICE_ID = "v";
      expect(() => loadConfig()).toThrow(/ELEVENLABS_API_KEY/);
    });

    it("respects ELEVENLABS_MODEL_ID override", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_API_KEY = "k";
      process.env.ELEVENLABS_VOICE_ID = "v";
      process.env.ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";
      const cfg = loadConfig();
      expect(cfg.elevenlabsModelId).toBe("eleven_turbo_v2_5");
    });
  });

  describe("Vbee provider", () => {
    it("reads Vbee env vars when TTS_PROVIDER=vbee", () => {
      process.env.TTS_PROVIDER = "vbee";
      process.env.VBEE_APP_ID = "app-1";
      process.env.VBEE_ACCESS_TOKEN = "token-abc";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("vbee");
      expect(cfg.vbeeAppId).toBe("app-1");
      expect(cfg.vbeeAccessToken).toBe("token-abc");
      expect(cfg.vbeeEndpoint).toBe("https://vbee.vn/api/v1");
      expect(cfg.vbeeVoiceCode).toBe("n_hanoi_male_protrainer_education_vc");
      expect(cfg.vbeeSpeedRate).toBe(1.0);
      expect(cfg.vbeePollIntervalMs).toBe(2000);
      expect(cfg.vbeePollTimeoutMs).toBe(60000);
    });

    it("throws when VBEE_APP_ID missing", () => {
      process.env.TTS_PROVIDER = "vbee";
      process.env.VBEE_ACCESS_TOKEN = "token-abc";
      expect(() => loadConfig()).toThrow(/VBEE_APP_ID/);
    });

    it("throws when VBEE_ACCESS_TOKEN missing", () => {
      process.env.TTS_PROVIDER = "vbee";
      process.env.VBEE_APP_ID = "app-1";
      expect(() => loadConfig()).toThrow(/VBEE_ACCESS_TOKEN/);
    });

    it("respects VBEE_VOICE_CODE and VBEE_SPEED_RATE overrides", () => {
      process.env.TTS_PROVIDER = "vbee";
      process.env.VBEE_APP_ID = "app-1";
      process.env.VBEE_ACCESS_TOKEN = "token-abc";
      process.env.VBEE_VOICE_CODE = "n_hanoi_female_nguyetnga2_book_vc";
      process.env.VBEE_SPEED_RATE = "1.2";
      const cfg = loadConfig();
      expect(cfg.vbeeVoiceCode).toBe("n_hanoi_female_nguyetnga2_book_vc");
      expect(cfg.vbeeSpeedRate).toBe(1.2);
    });
  });

  it("rejects invalid TTS_PROVIDER", () => {
    process.env.TTS_PROVIDER = "google";
    process.env.VIETNAMESE_API_KEY = "k";
    process.env.VIETNAMESE_VOICEID = "v";
    expect(() => loadConfig()).toThrow(/TTS_PROVIDER/);
  });
});
