// TTS Provider: 火山引擎 SeedTTS
// 支持多音色，通过 voiceId 参数切换
// 注意：1.0和2.0音色混用时，需根据音色ID后缀动态选择 Resource-Id
// 1.0音色后缀: _mars_bigtts, _wvae_bigtts 等 → Resource-Id: seed-tts-1.0
// 2.0音色后缀: _uranus_bigtts 等 → Resource-Id: seed-tts-2.0

const BASE_URL = process.env.TTS_BASE_URL || "https://openspeech.bytedance.com/api/v3/tts";
const APPID = process.env.TTS_APPID;
const TOKEN = process.env.TTS_TOKEN;
const CLUSTER = process.env.TTS_CLUSTER || "volcano_tts";

interface TTSResponse {
  reqid: string;
  code: number;
  message: string;
  operation: string;
  data?: string;
}

/**
 * 根据音色ID判断版本，返回对应的 Resource-Id
 * 1.0: _mars_bigtts, _wvae_bigtts 等
 * 2.0: _uranus_bigtts 等
 */
function getResourceId(voiceId: string): string {
  // 1.0版本音色特征
  if (voiceId.includes("_mars_bigtts") || voiceId.includes("_wvae_bigtts")) {
    return "seed-tts-1.0";
  }
  // 2.0版本音色特征（默认）
  return "seed-tts-2.0";
}

export async function generateVoice(
  text: string,
  voiceId: string
): Promise<Buffer> {
  if (!APPID || !TOKEN) {
    throw new Error("TTS credentials not configured (TTS_APPID / TTS_TOKEN)");
  }

  const reqid = crypto.randomUUID();
  const resourceId = getResourceId(voiceId);
  console.log(`[TTS] voiceId=${voiceId}, resourceId=${resourceId}`);

  const payload = {
    app: {
      appid: APPID,
      token: "access_token",
      cluster: CLUSTER,
    },
    user: {
      uid: "paperboyfriend_user",
    },
    audio: {
      voice_type: voiceId,
      encoding: "mp3",
      speed_ratio: 1.0,
      volume_ratio: 1.0,
      pitch_ratio: 1.0,
    },
    request: {
      reqid,
      text: cleanTextForSpeech(text),
      text_type: "plain",
      operation: "query",
    },
  };

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer;${TOKEN}`,
      "Resource-Id": resourceId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TTS request failed: ${response.status} ${text}`);
  }

  const result = (await response.json()) as TTSResponse;

  if (result.code !== 0 && result.code !== 200) {
    throw new Error(`TTS API error: ${result.message || "unknown error"}`);
  }

  if (!result.data) {
    throw new Error("TTS response missing audio data");
  }

  return Buffer.from(result.data, "base64");
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[\(\)\[\]\{\}]/g, " ")
    .replace(/[*_~`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
