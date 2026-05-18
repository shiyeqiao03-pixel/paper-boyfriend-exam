# 《纸片人男友》项目专属开发约束

> 本文档是 Trae 在开发《纸片人男友》MVP 期间必须遵守的固定规则。
> 所有代码生成、修改、重构、排错都必须以本文档为前提。
> 本文档不覆盖已确认的产品需求，只约束开发实现方式。

---

## 1. 固定技术栈

以下技术栈已确认，Trae 不得自行更改：

```text
Next.js 全栈项目（App Router）
TypeScript
Tailwind CSS
shadcn/ui
lucide-react
Better Auth
Neon PostgreSQL
Drizzle ORM
Cloudflare R2
Resend
cron-job.org
AI Provider 抽象层
Vercel 部署
```

Trae 不得自行改成：

```text
独立后端服务
Firebase / Supabase / MongoDB
本地文件存储
公开 R2 bucket
WebSocket / SSE
向量数据库（Pinecone / Milvus 等）
多 Provider 后台动态切换
Prisma（请用 Drizzle ORM）
```

除非用户后续明确要求。

---

## 2. 固定产品边界

```text
成年女性向 AI 虚拟男友聊天网站
必须登录后使用
18+ 确认
四位固定男友（陆沉舟、倪可、许知衡、周野）
长期聊天线（用户 × 每个男友独立）
隐藏好感度（0-100，前台不展示数值）
关系阶段由后端自动计算
文字优先回复
语音 / 图片异步生成（轮询，不做 WebSocket / SSE）
```

不能写成：

```text
乙女游戏 / 抽卡游戏
社交平台 / 真人交友
游客试聊产品
通用 AI 聊天工具
SaaS 后台管理系统
```

---

## 3. 固定四位角色设定

Trae 不得随意更改以下角色的核心设定：

### 陆沉舟
- **类型**：企业掌舵者，高冷克制型 / 成熟稳定型 / 理解型安全感
- **关键词**：克制、冷静、稳定、判断力、距离感、例外感
- **称呼用户**：用户昵称
- **默认开场**：那封邮件，我还记得。你那天慌得很明显。
- **照片风格**：冷调、低饱和、城市夜景、办公室、车内、西装、深色衬衫
- **声音风格**：低沉、磁性、克制、成熟、稳定

### 倪可 Nico
- **类型**：牙科医生，阳光发小型 / 嘴贫暖男 / 熟人暧昧型
- **关键词**：发小、竹马、阳光、嘴贫、暖男、归国牙科医生
- **称呼用户**：阿呆
- **默认开场**：朋友圈那条我看见了。怎么，几年不见，你还是一压力大就开始阴阳怪气全世界？
- **照片风格**：阳光、运动感、骑行、篮球、医院休息室、白大褂、街边咖啡
- **声音风格**：明亮、自然、带笑意、亲近、轻松、少年感

### 许知衡
- **类型**：理论物理博士后，天才学霸型 / 理性怪咖型 / 反差萌陪伴型
- **关键词**：理论物理、黑洞、引力波、学霸、理性怪咖、笨拙真诚
- **称呼用户**：XX 小姐
- **默认开场**：XX 小姐。我记得你。你之前在问答社区提过一个问题，表述不算非常精确，但很认真。
- **照片风格**：研究所、白板、公式、图书馆、书桌、电脑、茶杯、细框眼镜、冷白光
- **声音风格**：清冷、理性、干净、克制、认真、微反差

### 周野
- **类型**：旅行摄影师 / 纪录片导演，自由浪漫型 / 世界递送者
- **关键词**：旅行摄影师、纪录片导演、自由、浪漫、远方、人文关怀
- **称呼用户**：城市女孩
- **默认开场**：城市女孩。你上次问那张照片里的小孩，后来有没有继续上学。我记住了。
- **照片风格**：新疆公路、西藏高原、青海湖、海边日落、异国街头、雪山、草原、旅行纪实感
- **声音风格**：松弛、低哑、成熟、风尘感、温柔、自由

### 通用角色边界
- 不控制、不 PUA、不冷暴力、不诱导依赖
- 不轻易说"我爱你"、不承诺现实中无法完成的事
- 低好感度时只变克制，不惩罚、不冷暴力、不制造愧疚
- 极端负面情绪时进入安全回应，不强化依赖关系

---

## 4. 固定图像生成角色描述模板

每个男友需要一份固定外貌 / 风格模板，后续生图时必须引用，避免角色长相漂移。

模板结构（供后续填入真实描述）：

```text
角色固定外貌：
年龄感：
发型：
面部特征：
穿着风格：
气质：
常见场景：
光线色调：
禁止生成内容：
角色母图 / 锚点图 file_id：
```

该模板后续写入 `characters` seed 数据或项目配置中。

---

## 5. 固定代码风格

### 命名规范

```text
组件：PascalCase，例如 ChatScreen.tsx、CharacterCard.tsx
函数 / 变量：camelCase，例如 sendMessage、handleSubmit
常量：UPPER_SNAKE_CASE，例如 MAX_IMAGE_GEN_TIMEOUT、CHAT_CONTEXT_MESSAGE_LIMIT
类型 / 接口：PascalCase，例如 ChatState、Message、UserProfile
数据库表：snake_case，例如 user_profiles、character_memories
API 路由：kebab-case，例如 /api/chat/send、/api/files/upload-image
```

### 目录组织

```text
src/
  app/                  # Next.js App Router 页面
    page.tsx
    auth/
    onboarding/
    characters/
    chat/
    api/

  components/           # React 组件
    ui/                 # shadcn/ui 组件
    layout/             # 布局组件
    chat/               # 聊天相关组件
    characters/         # 角色相关组件
    auth/               # 认证相关组件

  lib/                  # 工具库与服务
    auth/               # Better Auth 配置
    db/                 # Drizzle ORM、schema、seed
    env/                # 环境变量校验
    r2/                 # Cloudflare R2 操作
    providers/          # AI Provider 抽象
    email/              # Resend 邮件
    cron/               # 定时任务
    utils/              # 通用工具函数

  types/                # TypeScript 类型
    chat.ts
    character.ts
    user.ts
    file.ts

  constants/            # 常量与配置
    characters.ts
    limits.ts
    routes.ts
```

### 核心编码规则

```text
1. 前端状态只负责展示，不做业务逻辑裁决。
2. 聊天数据以 Neon messages 表为唯一可信来源。
3. 所有外部服务（Neon、R2、Resend、AI Provider）只能由服务端 API 调用。
4. 密钥不能写入前端代码，不能暴露到浏览器。
5. 服务端 API 必须校验用户登录状态。
6. cron 接口必须校验 CRON_SECRET。
7. R2 文件默认私有，前端通过 API 获取短期访问链接。
8. 技术错误只写后端日志，不向用户暴露 API error、500、timeout 等信息。
```

---

## 6. 固定 API 和数据边界

### 前端不能直接访问的服务

```text
Neon PostgreSQL（必须通过 Next.js API Route）
Cloudflare R2（必须通过 /api/files/signed-url 获取短期链接）
Resend（必须由服务端发送）
AI Provider（LLM / STT / VLM / TTS / Image，必须由服务端调用）
```

### 消息状态规范

```text
messages 表保存原始聊天记录
memories 表保存提炼后的长期记忆
files 表保存文件台账
character_assets 表保存角色素材关联
```

### 关键 API 分组

```text
/api/profile          # 用户资料
/api/characters       # 角色信息
/api/chat             # 聊天消息、发送、重新生成、状态查询
/api/files            # 文件上传、转写、理解、短期链接
/api/share            # 分享卡片生成
/api/cron             # 定时任务（记忆提取、邮件召回、好感度衰减）
```

---

## 7. 固定 MVP 不做事项

以下功能已确认第一版不做，Trae 不得自行添加：

```text
1. 不做独立后端服务
2. 不做 WebSocket / SSE / 流式输出
3. 不做向量检索 / embedding
4. 不做多 Provider 后台切换 / 模型路由 / 备用模型自动切换
5. 不做 conversations 表
6. 不做复杂任务表 / 复杂额度日志表 / 好感度日志表
7. 不做会员 / 付费 / 套餐 / 积分 / 订阅系统
8. 不做管理后台
9. 不做复杂邮件营销系统 / A/B 测试
10. 不做前台邮件设置页
11. 不做用户头像上传 / 用户画像查看 / 编辑页面
12. 不做站内社交（关注 / 点赞 / 评论 / 广场 / 推荐流）
13. 不做游客试聊
14. 不做一键发布到小红书 / 朋友圈 / 微博
15. 不做语音分享 / 导出
16. 不做复杂内容审核后台
17. 不做预生成图库
18. 不做用户相册 / 文件管理后台
19. 不做实时语音通话 / 语音变声
20. 不做 OCR 专门文本提取
```

---

## 8. 环境变量规范

### 命名规则

```text
私密变量（服务端专用）：不能加 NEXT_PUBLIC_ 前缀
公开变量（前端可用）：加 NEXT_PUBLIC_ 前缀
```

### 必需环境变量清单

```text
# 应用
NEXT_PUBLIC_APP_URL=

# 数据库
DATABASE_URL=

# 认证
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 人机验证
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=

# AI Provider（抽象命名，不锁死供应商）
LLM_PROVIDER=
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=

STT_PROVIDER=
STT_API_KEY=
STT_BASE_URL=
STT_MODEL=

VLM_PROVIDER=
VLM_API_KEY=
VLM_BASE_URL=
VLM_MODEL=

TTS_PROVIDER=
TTS_API_KEY=
TTS_BASE_URL=
TTS_MODEL=

IMAGE_PROVIDER=
IMAGE_API_KEY=
IMAGE_BASE_URL=
IMAGE_MODEL=

# 邮件
RESEND_API_KEY=
EMAIL_FROM=

# 定时任务
CRON_SECRET=

# 业务配置
CHAT_CONTEXT_MESSAGE_LIMIT=20
MEMORY_BATCH_SIZE=50
IMAGE_RECENT_MESSAGE_WINDOW=8
IMAGE_RECENT_MAX_COUNT=2
```

### 安全规则

```text
.env.local 只用于本地开发，必须加入 .gitignore
真实密钥不能提交 GitHub
正式环境变量配置在 Vercel Project Settings
```

---

## 9. 失败文案规范

用户看到的文案必须统一，不暴露技术错误：

```text
男友文字回复失败：他刚刚没发出去，再试一次。
用户图片上传失败：这张图刚刚没发出去，再试一次。
VLM 理解失败：他刚刚没看清这张图，再试一次。
用户语音上传失败：这段语音刚刚没发出去，再试一次。
STT 转写失败：这段语音刚刚没识别出来，再试一次。
男友语音生成失败：这段语音刚刚没发出来，再试一次。
男友图片生成失败：这张照片刚刚没发出来，再试一次。
多次失败后：现在有点不稳定，稍后再试。
```

---

## 10. 额度限制规范

按用户 × 男友统计，存在 `user_character_relationships` 表中：

```text
男友生成图片：每天最多 5 张（daily_image_count）
男友生成语音：每天最多 10 条（daily_voice_count）
用户上传图片：每天最多 20 张（daily_upload_image_count）
用户上传语音：每天最多 30 条（daily_upload_voice_count）
```

规则：

```text
上传成功 / 生成成功才计入额度
失败不计入额度
重试成功后才计入
每天零点重置（通过 daily_reset_date 判断）
```

---

## 11. 文件路径规范

Cloudflare R2 目录结构：

```text
character-assets/{characterId}/original.png
user-uploads/{userId}/images/{yyyy-mm-dd}/{uuid}.png
user-uploads/{userId}/voices/{yyyy-mm-dd}/{uuid}.mp3
generated/{userId}/{characterId}/images/{yyyy-mm-dd}/{uuid}.png
generated/{userId}/{characterId}/voices/{yyyy-mm-dd}/{uuid}.mp3
share-cards/{userId}/{characterId}/{yyyy-mm-dd}/{uuid}.png
```

---

## 12. 修改本文档的规则

本文档由 Trae 在任务 0 中创建。后续如需修改：

1. 用户必须明确要求修改
2. 修改内容不能覆盖阶段一、二、三已确认的产品需求
3. 修改后必须通知用户确认

---

> 文档版本：v1.0
> 创建任务：任务 0
> 适用阶段：MVP 开发全周期
