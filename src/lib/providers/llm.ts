// LLM Provider - evolink.ai / Anthropic Messages API 格式

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  messages: string[];
  affinityDelta: number;
  shouldGenerateVoice: boolean;
  shouldGenerateImage: boolean;
  sceneDescription: string | null;
  emotionLabel: string;
  safetyLevel: "normal" | "high";
}

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL;
const MODEL = process.env.LLM_MODEL;

function parseStructuredResponse(rawText: string): LLMResponse {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        messages: Array.isArray(parsed.messages) ? parsed.messages : [rawText],
        affinityDelta: typeof parsed.affinity_delta === "number" ? parsed.affinity_delta : 0,
        shouldGenerateVoice: Boolean(parsed.should_generate_voice),
        shouldGenerateImage: Boolean(parsed.should_generate_image),
        sceneDescription: typeof parsed.scene_description === "string" ? parsed.scene_description : null,
        emotionLabel: parsed.emotion_label || "neutral",
        safetyLevel: parsed.safety_level === "high" ? "high" : "normal",
      };
    }
  } catch {
    // 解析失败，fallback 到纯文本
  }

  return {
    messages: [rawText],
    affinityDelta: 0,
    shouldGenerateVoice: false,
    shouldGenerateImage: false,
    sceneDescription: null,
    emotionLabel: "neutral",
    safetyLevel: "normal",
  };
}

export async function callLLM(
  messages: LLMMessage[],
  options?: { model?: string; maxTokens?: number }
): Promise<LLMResponse> {
  if (!API_KEY || !BASE_URL) {
    throw new Error("LLM API key or base URL not configured");
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || MODEL || "deepseek-v4-flash",
      max_tokens: options?.maxTokens || 1024,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  let rawText = "";
  if (Array.isArray(data.content)) {
    const textContent = data.content.find((c: { type: string; text?: string }) => c.type === "text");
    rawText = textContent?.text || "";
  } else if (typeof data.content === "string") {
    rawText = data.content;
  } else if (typeof data.message === "string") {
    rawText = data.message;
  } else {
    rawText = JSON.stringify(data);
  }

  return parseStructuredResponse(rawText);
}
