// VLM Provider: Gemini 2.5 Flash (evolink.ai)
// 用于理解用户发送的图片内容

const API_KEY = process.env.VLM_API_KEY;
const BASE_URL =
  process.env.VLM_BASE_URL ||
  "https://direct.evolink.ai/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      role?: string;
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message: string;
  };
}

/**
 * 分析图片内容，返回文字描述
 * @param imageBuffer 图片二进制数据
 * @param mimeType 图片类型，如 image/jpeg, image/png
 * @param prompt 附加提示词，如"描述这张图片"
 */
export async function understandImage(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg",
  prompt: string = "请简要描述这张图片的内容。"
): Promise<string> {
  if (!API_KEY) {
    throw new Error("VLM_API_KEY not configured");
  }

  const base64Data = imageBuffer.toString("base64");

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`VLM request failed: ${response.status} ${text}`);
  }

  const result = (await response.json()) as GeminiResponse;

  if (result.error) {
    throw new Error(`VLM API error: ${result.error.message}`);
  }

  const text =
    result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

  if (!text) {
    throw new Error("VLM returned empty response");
  }

  return text;
}

/**
 * 从 URL 下载图片后分析
 */
export async function understandImageFromUrl(
  imageUrl: string,
  prompt?: string
): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/jpeg";

  return understandImage(buffer, contentType, prompt);
}
