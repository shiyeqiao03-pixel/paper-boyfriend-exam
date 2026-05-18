// Image Provider: evolink.ai / gpt-image-2
// 异步任务模式：提交 -> 轮询 -> 下载

const API_KEY = process.env.IMAGE_API_KEY;
const BASE_URL = process.env.IMAGE_BASE_URL || "https://api.evolink.ai/v1";
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2";

interface ImageGenerationTask {
  id: string;
  status: string; // "processing" | "succeeded" | "completed" | "failed"
  progress?: number;
  task_info?: {
    can_cancel: boolean;
    estimated_time: number;
  };
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message: string;
  };
}

export async function generateImage(
  prompt: string,
  referenceImage?: Buffer
): Promise<Buffer> {
  if (!API_KEY) {
    throw new Error("IMAGE_API_KEY not configured");
  }

  // 1. 提交任务
  const task = await submitTask(prompt, referenceImage);

  // 2. 轮询结果
  const result = await pollTask(task.id);

  // 3. 获取图片
  if (result.data && result.data.length > 0) {
    const item = result.data[0];

    if (item.b64_json) {
      return Buffer.from(item.b64_json, "base64");
    }

    if (item.url) {
      return await downloadImage(item.url);
    }
  }

  throw new Error("Image generation completed but no data returned");
}

async function submitTask(
  prompt: string,
  referenceImage?: Buffer
): Promise<ImageGenerationTask> {
  const body: Record<string, any> = {
    model: MODEL,
    prompt,
    size: "1024x1024",
    quality: "medium",
  };

  if (referenceImage) {
    body.image = referenceImage.toString("base64");
  }

  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image generation submit failed: ${response.status} ${text}`);
  }

  return (await response.json()) as ImageGenerationTask;
}

async function pollTask(taskId: string): Promise<ImageGenerationTask> {
  const maxWaitMs = 5 * 60 * 1000; // 最多等 5 分钟
  const pollIntervalMs = 5000; // 每 5 秒查一次
  const initialDelayMs = 8000; // 先等 8 秒再开始轮询

  await sleep(initialDelayMs);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await queryTask(taskId);

    if (status.status === "succeeded" || status.status === "completed") {
      return status;
    }

    if (status.status === "failed") {
      throw new Error(
        `Image generation failed: ${status.error?.message || "unknown error"}`
      );
    }

    // 仍在处理中，继续等待
    await sleep(pollIntervalMs);
  }

  throw new Error("Image generation polling timeout (5 minutes)");
}

async function queryTask(taskId: string): Promise<ImageGenerationTask> {
  // evolink.ai 查询 endpoint 推测为 GET /v1/images/generations/{task_id}
  // 或 GET /v1/tasks/{task_id}
  // 先尝试前者，如后续测试不匹配可调整
  const response = await fetch(`${BASE_URL}/images/generations/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    // 如果 404，尝试备选 endpoint /tasks/{task_id}
    if (response.status === 404) {
      const fallbackResponse = await fetch(`${BASE_URL}/tasks/${taskId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });
      if (fallbackResponse.ok) {
        return (await fallbackResponse.json()) as ImageGenerationTask;
      }
    }

    const text = await response.text();
    throw new Error(`Query task failed: ${response.status} ${text}`);
  }

  return (await response.json()) as ImageGenerationTask;
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download image failed: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
