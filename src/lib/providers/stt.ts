// STT Provider: 火山引擎豆包大模型流式语音识别
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import gzip from "zlib";

const BASE_URL = process.env.STT_BASE_URL || "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel";
const APPID = process.env.STT_APPID || process.env.TTS_APPID;
const TOKEN = process.env.STT_TOKEN || process.env.TTS_TOKEN;
const RESOURCE_ID = process.env.STT_RESOURCE_ID || "volc.bigasr.sauc.duration";

// 协议常量
const PROTOCOL_VERSION = 0b0001;
const HEADER_SIZE = 0b0001;
const FULL_CLIENT_REQUEST = 0b0001;
const AUDIO_ONLY_REQUEST = 0b0010;
const NO_SEQUENCE = 0b0000;
const NEG_SEQUENCE = 0b0010;
const JSON_SERIALIZATION = 0b0001;
const GZIP_COMPRESSION = 0b0001;
const NO_COMPRESSION = 0b0000;

// 生成协议头
function generateHeader(messageType: number, flags: number, serialMethod: number, compressionType: number): Buffer {
  const header = Buffer.alloc(4);
  header.writeUInt8((PROTOCOL_VERSION << 4) | HEADER_SIZE, 0);
  header.writeUInt8((messageType << 4) | flags, 1);
  header.writeUInt8((serialMethod << 4) | compressionType, 2);
  header.writeUInt8(0x00, 3); // reserved
  return header;
}

// 构建帧
function buildFrame(messageType: number, flags: number, serialMethod: number, compressionType: number, payload: Buffer): Buffer {
  const header = generateHeader(messageType, flags, serialMethod, compressionType);
  const payloadLen = Buffer.alloc(4);
  payloadLen.writeUInt32BE(payload.length, 0);
  return Buffer.concat([header, payloadLen, payload]);
}

// 解析响应帧
function parseFrame(data: Buffer): { text?: string; error?: string } {
  if (data.length < 8) return {};

  const flags = data.readUInt8(1) & 0x0F;
  const compressionType = data.readUInt8(2) & 0x0F;
  const hasSequence = (flags & 0x01) === 1;

  const payloadStart = hasSequence ? 12 : 8;
  if (data.length < payloadStart + 4) return {};

  const payloadLen = data.readUInt32BE(hasSequence ? 8 : 4);
  if (data.length < payloadStart + payloadLen) return {};

  let payload = data.slice(payloadStart, payloadStart + payloadLen);

  // 解压
  if (compressionType === GZIP_COMPRESSION) {
    try {
      payload = gzip.gunzipSync(payload);
    } catch {}
  }

  // 解析JSON
  try {
    const json = JSON.parse(payload.toString("utf-8"));
    if (json.error) {
      return { error: json.error };
    }
    const text = (
      json.payload?.result?.text
      || json.result?.text
      || json.text
      || ""
    ).trim();
    return { text };
  } catch {
    return {};
  }
}

/**
 * 语音识别接口
 * @param audioBuffer 16kHz/16bit单声道PCM音频Buffer
 */
export async function transcribeVoice(audioBuffer: Buffer): Promise<string> {
  if (!APPID || !TOKEN) {
    throw new Error("STT credentials not configured (STT_APPID / STT_TOKEN)");
  }

  const requestId = uuidv4();
  const connectId = uuidv4();

  // 构建WebSocket连接
  const ws = new WebSocket(BASE_URL, {
    headers: {
      "X-Api-App-Key": APPID,
      "X-Api-Access-Key": TOKEN,
      "X-Api-Resource-Id": RESOURCE_ID,
      "X-Api-Request-Id": requestId,
      "X-Api-Connect-Id": connectId,
      "X-Api-Sequence": "-1",
    },
    timeout: 30000,
    perMessageDeflate: false,
  });

  return new Promise((resolve, reject) => {
    let result = "";
    let isClosed = false;

    const close = () => {
      if (!isClosed) {
        isClosed = true;
        ws.close();
        resolve(result.trim());
      }
    };

    ws.on("open", () => {
      // 1. 发送配置帧
      const config = {
        user: {
          uid: "paper_boyfriend_user",
        },
        audio: {
          format: "pcm",
          rate: 16000,
          bits: 16,
          channel: 1,
          codec: "raw",
        },
        request: {
          model_name: "bigmodel",
        },
      };
      const configJson = JSON.stringify(config);
      console.log("[STT] config:", configJson);
      console.log("[STT] audio buffer length:", audioBuffer.length, "bytes");
      const configPayload = gzip.gzipSync(configJson);
      const configFrame = buildFrame(
        FULL_CLIENT_REQUEST,
        NO_SEQUENCE,
        JSON_SERIALIZATION,
        GZIP_COMPRESSION,
        configPayload
      );
      ws.send(configFrame);

      // 2. 分片发送音频，每帧200ms（6400字节）
      const chunkSize = 6400;
      let sentChunks = 0;
      for (let i = 0; i < audioBuffer.length; i += chunkSize) {
        const chunk = audioBuffer.slice(i, i + chunkSize);
        const audioFrame = buildFrame(
          AUDIO_ONLY_REQUEST,
          NO_SEQUENCE,
          0, // 无序列化
          NO_COMPRESSION,
          chunk
        );
        ws.send(audioFrame);
        sentChunks++;
      }
      console.log("[STT] sent", sentChunks, "audio chunks");

      // 3. 发送结束帧
      const endFrame = buildFrame(
        AUDIO_ONLY_REQUEST,
        NEG_SEQUENCE,
        0,
        NO_COMPRESSION,
        Buffer.alloc(0)
      );
      ws.send(endFrame);
      console.log("[STT] sent end frame");

      // 4. 延迟 8 秒关闭，等服务端返回完所有结果
      setTimeout(() => {
        if (!isClosed) {
          console.log("[STT] force close after 8s, result:", result);
          close();
        }
      }, 8000);
    });

    ws.on("message", (data: Buffer) => {
      const parsed = parseFrame(data);
      console.log("[STT] recv frame:", JSON.stringify(parsed));
      if (parsed.error) {
        console.error("[STT] server error:", parsed.error);
        if (!isClosed) {
          isClosed = true;
          ws.close();
          reject(new Error(parsed.error));
        }
        return;
      }
      if (parsed.text) {
        // 火山引擎流式返回完整前缀，直接覆盖
        result = parsed.text;
      }
    });

    ws.on("error", (err) => {
      if (!isClosed) {
        isClosed = true;
        reject(err);
      }
    });

    ws.on("close", close);

    // 超时保护
    setTimeout(() => {
      if (!isClosed) {
        close();
      }
    }, 30000);
  });
}
