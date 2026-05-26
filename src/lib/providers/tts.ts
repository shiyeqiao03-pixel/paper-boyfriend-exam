// TTS Provider: 火山引擎 SeedTTS
// 支持多音色，通过 voiceId 参数切换
// 注意：1.0和2.0音色混用时，需根据音色ID后缀选择不同接口和Resource-Id
// 1.0音色: V1接口(api/v1/tts)，不加Resource-Id头
// 2.0音色: V3接口(api/v3/tts)，Resource-Id: seed-tts-2.0

const BASE_URL_V1 = "https://openspeech.bytedance.com/api/v1/tts";
const BASE_URL_V3 = "https://openspeech.bytedance.com/api/v3/tts";
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
 * 根据音色ID判断版本
 * 1.0: _mars_bigtts, _wvae_bigtts 等
 * 2.0: _uranus_bigtts 等
 */
function isVersion1(voiceId: string): boolean {
  return voiceId.includes("_mars_bigtts") || voiceId.includes("_wvae_bigtts");
}

/**
 * 过滤掉语音中的场景描述/动作描写
 * 只保留角色直接说的话
 */
function filterSceneDescription(text: string): string {
  return text
    // 去掉所有括号内的内容（动作描写、场景描述）
    .replace(/[（(].*?[）)]/g, "")
    // 去掉书名号内容（如《低等动物》）
    .replace(/《.*?》/g, "")
    // 清理多余空格
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateVoice(
  text: string,
  voiceId: string
): Promise<Buffer> {
  if (!APPID || !TOKEN) {
    throw new Error("TTS credentials not configured (TTS_APPID / TTS_TOKEN)");
  }

  const isV1 = isVersion1(voiceId);
  const baseUrl = isV1 ? BASE_URL_V1 : BASE_URL_V3;
  const resourceId = isV1 ? undefined : "seed-tts-2.0";
  const cleanedText = cleanTextForSpeech(filterSceneDescription(text));

  console.log(`[TTS] voiceId=${voiceId}, version=${isV1 ? "1.0" : "2.0"}, textLen=${cleanedText.length}`);

  const reqid = crypto.randomUUID();

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
      text: cleanedText,
      text_type: "plain",
      operation: "query",
    },
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer;${TOKEN}`,
  };
  if (resourceId) {
    headers["Resource-Id"] = resourceId;
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TTS request failed: ${response.status} ${text}`);
  }

  const result = (await response.json()) as TTSResponse;
  console.log("[TTS] response:", JSON.stringify(result).slice(0, 500));

  // V3接口可能用不同code表示成功，V1接口通常是0或200
  const isSuccess = result.code === 0 || result.code === 200 || result.code === 10000 ||
    (result.message && result.message.toLowerCase().includes("success"));
  if (!isSuccess) {
    throw new Error(`TTS API error: ${result.message || "unknown error"} (code=${result.code})`);
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
