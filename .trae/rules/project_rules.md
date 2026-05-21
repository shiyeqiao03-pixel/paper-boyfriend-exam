# 纸片人男友 — 代码修改规则

> 本文件用于固化开发流程，避免多次修改出错。
> 每次修改功能前，必须通读本文件，逐条确认。

---

## 规则1：修改前必须画"全链路地图"

**强制要求**：任何涉及"用户交互 → 外部API"的功能修改，必须先画出完整的调用链，确认每个环节都看过。

**做法**：
1. 从用户交互起点开始，列出每个函数/文件的调用顺序
2. 标记每个环节的输入格式、输出格式
3. 特别关注"外部服务提供商接口"的输入要求（如 STT/LLM/TTS）

**示例（语音理解）**：
```
用户录音 (MediaRecorder)
  → 前端生成 webm Blob
  → 上传 R2 (voice/route.ts)
  → STT 转文字 (stt.ts) ← 要求 16kHz/16bit PCM
  → 发送消息 (send/route.ts)
  → LLM 生成回复 (llm.ts)
```

---

## 规则2：外部接口必须检查输入格式要求

**强制要求**：调用任何第三方 API（STT、LLM、TTS、R2 等）前，必须确认：
- 接口期望的输入格式（MIME type、编码、采样率等）
- 当前传入的数据格式是否匹配
- 如果不匹配，必须有明确的格式转换步骤

**反例**：直接把 webm 传给要求 PCM 的 STT 接口。

---

## 规则3：修改后必须端到端手动验证

**强制要求**：代码修改后，`npm run lint` 只是第一步，必须做实际功能验证。

**验证清单**：
- [ ] 功能是否按预期工作（实际使用一次）
- [ ] 边界情况是否正常（空输入、大输入、网络异常）
- [ ] 错误状态是否有用户反馈（loading、error、timeout）

**禁止**："lint 过了就提交"，"代码逻辑看起来对就算完成"。

---

## 规则4：小步快跑，一次只改一个明确问题

**强制要求**：
1. 每个 commit / 修改只解决一个明确的问题
2. 改完立刻验证，确认 OK 后再改下一个
3. 如果涉及多个文件，但属于同一个问题，可以一起改

**反例**：一次性改"时长显示 + 语音理解 + UI 样式"，出问题后无法定位。

---

## 规则5：关键边界加运行时校验和日志

**强制要求**：在"格式转换"、"外部 API 调用"等关键边界加防护：

```typescript
// 示例：STT 入口加格式校验
if (!isPcmFormat(buffer)) {
  throw new Error(`STT expects PCM, got ${detectFormat(buffer)}`);
}
```

**目的**：让问题在开发阶段就暴露，而不是静默失败或 hang 住。

---

## 规则6：异步操作必须有 timeout 和错误处理

**强制要求**：任何 `fetch`、WebSocket、长时间计算都必须有：
- `AbortController` 或 `setTimeout` 防止无限等待
- `try/catch/finally` 确保状态能恢复
- 用户可见的错误提示

```typescript
// 示例
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8000);
try {
  const res = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
  setLoading(false);
}
```

---

## 规则7：接口用类型/Schema 定义契约

**强制要求**：前后端交互的 API、外部服务调用的参数，必须有明确的类型约束。

**做法**：
- TypeScript 严格模式
- 清晰的变量命名（如 `pcmBuffer` 而不是 `audioBuffer`）
- 复杂输入用 Zod 做运行时校验

---

## 修改 Checklist（每次改代码前填写）

- [ ] 我已画出完整的调用链路图
- [ ] 我已确认外部接口的输入格式要求
- [ ] 本次修改只解决一个明确的问题
- [ ] 关键边界已加运行时校验或日志
- [ ] 异步操作已有 timeout 和错误恢复
- [ ] 修改后我手动验证过功能正常
