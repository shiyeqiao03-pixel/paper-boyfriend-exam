// TTS Provider: 火山引擎 SeedTTS
// 统一用 V1 接口，通过 Resource-Id 头区分 1.0/2.0 版本

const BASE_URL = "https://openspeech.bytedance.com/api/v1/tts";
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
 */
function getResourceId(voiceId: string): string {
  // 1.0版本音色特征
  if (voiceId.includes("_mars_bigtts") || voiceId.includes("_wvae_bigtts")) {
    return "seed-tts-1.0";
  }
  // 2.0版本音色特征
  return "seed-tts-2.0";
}

/**
 * 过滤掉语音中的场景描述/动作描写/标签
 * 只保留角色直接说的话
 */
function cleanVoiceText(text: string): string {
  return text
    // 去掉 [语音] 等标签前缀
    .replace(/^\[.*?\]\s*/g, "")
    // 去掉所有括号内的内容（动作描写、场景描述）
    .replace(/[（(].*?[）)]/g, "")
    // 去掉书名号内容（如《低等动物》）
    .replace(/《.*?》/g, "")
    // 清理多余空格和特殊字符
    .replace(/[\(\)\[\]\{\}*_~`]/g, " ")
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

  const resourceId = getResourceId(voiceId);
  const cleanedText = cleanVoiceText(text);

  console.log(`[TTS] voiceId=${voiceId}, resourceId=${resourceId}, text="${cleanedText.slice(0, 50)}..."`);

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
  console.log("[TTS] response:", JSON.stringify(result).slice(0, 500));

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
