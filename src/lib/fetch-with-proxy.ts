// 服务端 fetch 代理配置
// 用于让 Better Auth 的 OAuth 请求通过 ByWave 代理

import { fetch as undiciFetch, ProxyAgent } from "undici";

const proxyUrl = process.env.HTTP_PROXY || "http://127.0.0.1:7890";

let proxyAgent: ProxyAgent | undefined;

if (typeof window === "undefined" && proxyUrl) {
  try {
    proxyAgent = new ProxyAgent(proxyUrl);
  } catch {
    // 如果 ProxyAgent 初始化失败，回退到普通 fetch
  }
}

export async function fetchWithProxy(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  if (typeof window !== "undefined" || !proxyAgent) {
    return fetch(input, init);
  }

  const url = typeof input === "string" ? input : input.toString();

  const response = await undiciFetch(url, {
    ...init,
    dispatcher: proxyAgent,
  } as any);

  return response as unknown as Response;
}
