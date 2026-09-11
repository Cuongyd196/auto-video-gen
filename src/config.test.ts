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
  "VIDEO_THEME",
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
    it("uses product-video defaults", () => {
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("edge-tts");
      expect(cfg.edgeTtsVoice).toBe("vi-VN-NamMinhNeural");
      expect(cfg.edgeTtsRate).toBe("+0%");
      expect(cfg.edgeTtsPitch).toBe("+0Hz");
      expect(cfg.edgeTtsVolume).toBe("+0%");
      expect(cfg.ttsConcurrency).toBe(1);
      expect(cfg.videoTheme).toBe("product");
    });

    it("respects Edge TTS overrides", () => {
      process.env.TTS_PROVIDER = "edge-tts";
      process.env.EDGE_TTS_VOICE = "vi-VN-HoaiMyNeural";
      process.env.EDGE_TTS_RATE = "+10%";
      process.env.EDGE_TTS_PITCH = "+5Hz";
      process.env.EDGE_TTS_VOLUME = "-10%";
      const cfg = loadConfig();
      expect(cfg.edgeTtsVoice).toBe("vi-VN-HoaiMyNeural");
      expect(cfg.edgeTtsRate).toBe("+10%");
      expect(cfg.edgeTtsPitch).toBe("+5Hz");
      expect(cfg.edgeTtsVolume).toBe("-10%");
    });

    it("accepts 'edgetts' as alias for 'edge-tts'", () => {
      process.env.TTS_PROVIDER = "edgetts";
      expect(loadConfig().ttsProvider).toBe("edge-tts");
    });
  });

  it("accepts legacy visual themes", () => {
    process.env.VIDEO_THEME = "light-pro";
    expect(loadConfig().videoTheme).toBe("light-pro");
  });

  it("rejects invalid visual themes", () => {
    process.env.VIDEO_THEME = "cinematic";
    expect(() => loadConfig()).toThrow(/VIDEO_THEME/);
  });

  describe("LucyLab provider", () => {
    it("reads LucyLab env vars when TTS_PROVIDER=lucylab", () => {
      process.env.TTS_PROVIDER = "lucylab";
      process.env.VIETNAMESE_API_KEY = "sk_test_abc";
      process.env.VIETNAMESE_VOICEID = "voice123";
      const cfg = loadConfig();
      expect(cfg.lucylabApiKey).toBe("sk_test_abc");
      expect(cfg.lucylabVoiceId).toBe("voice123");
    });

    it("throws when VIETNAMESE_API_KEY missing", () => {
      process.env.TTS_PROVIDER = "lucylab";
      process.env.VIETNAMESE_VOICEID = "voice123";
      expect(() => loadConfig()).toThrow(/VIETNAMESE_API_KEY/);
    });
  });

  describe("ElevenLabs provider", () => {
    it("reads ElevenLabs env vars when TTS_PROVIDER=elevenlabs", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_API_KEY = "sk_eleven_xyz";
      process.env.ELEVENLABS_VOICE_ID = "voice";
      const cfg = loadConfig();
      expect(cfg.elevenlabsApiKey).toBe("sk_eleven_xyz");
      expect(cfg.elevenlabsVoiceId).toBe("voice");
    });
  });

  describe("Vbee provider", () => {
    it("reads Vbee env vars when TTS_PROVIDER=vbee", () => {
      process.env.TTS_PROVIDER = "vbee";
      process.env.VBEE_APP_ID = "app-1";
      process.env.VBEE_ACCESS_TOKEN = "token-abc";
      const cfg = loadConfig();
      expect(cfg.vbeeAppId).toBe("app-1");
      expect(cfg.vbeeAccessToken).toBe("token-abc");
    });
  });

  it("rejects invalid TTS_PROVIDER", () => {
    process.env.TTS_PROVIDER = "google";
    expect(() => loadConfig()).toThrow(/TTS_PROVIDER/);
  });
});
