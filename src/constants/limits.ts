export const LIMITS = {
  // 每个用户 × 每个男友，每天最多生成 5 张男友图片
  DAILY_IMAGE_GENERATION: 5,

  // 每个用户 × 每个男友，每天最多生成 10 条男友语音
  DAILY_VOICE_GENERATION: 10,

  // 每个用户 × 每个男友，每天最多上传 20 张图片
  DAILY_UPLOAD_IMAGE: 20,

  // 每个用户 × 每个男友，每天最多上传 30 条语音
  DAILY_UPLOAD_VOICE: 30,

  // 单条用户语音：1-60 秒
  VOICE_MIN_SECONDS: 1,
  VOICE_MAX_SECONDS: 60,

  // 单张图片：最大 10MB
  IMAGE_MAX_SIZE_MB: 10,

  // 图片格式
  IMAGE_ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],

  // 聊天上下文消息数量
  CHAT_CONTEXT_MESSAGE_LIMIT: 20,

  // 记忆批量处理数量
  MEMORY_BATCH_SIZE: 50,

  // 生图短周期限制：最近 8 条消息内最多 2 张
  IMAGE_RECENT_MESSAGE_WINDOW: 8,
  IMAGE_RECENT_MAX_COUNT: 2,

  // 失败重试次数
  MAX_RETRY_COUNT: 2,

  // R2 短期访问链接有效期（分钟）
  SIGNED_URL_EXPIRATION_MINUTES: 10,
} as const;
