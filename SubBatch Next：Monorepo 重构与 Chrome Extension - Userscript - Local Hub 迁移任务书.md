# SubBatch Next：Monorepo 重构与 Chrome Extension / Userscript / Local Hub 迁移任务书

## 0. 项目目标

现有项目已经有一份成熟的：

`Bili-SubBatch-v6.0.2.user.js`

它已经实现了大量经过验证的功能，包括：

- Bilibili 视频 / 合集 / 字幕采集
- 字幕资源库
- 原始字幕
- AI PRE 字幕规范化
- 长视频智能分块
- PRE 全局并发 Worker Pool
- PRE Cache
- POST 多产物
- 多模型并发
- Mermaid 学习图谱
- Prompt Library
- LLM Profiles
- PRE / POST / Knowledge 三类 Prompt
- Knowledge Anchor
- Infinite Drill-down Thread Tree
- IndexedDB Knowledge persistence
- SPA 视频切换
- 快捷键
- Studio Shell UI
- AI 处理字幕卡片化阅读

**禁止把 v6.0.2 当作废弃原型重新实现。**

它必须作为 migration source 和 behavioral specification。

本次工作的目标是将其逐渐演化为：

```text
SubBatch

Chrome Extension
      │
      ├── Bilibili Collector
      ├── Page Integration
      ├── Side Panel
      └── Hub Client
      │
      ▼
Local Content Hub
      │
      ├── Content
      ├── Transcript
      ├── Pipeline
      ├── Prompt
      ├── Model
      ├── Workflow
      ├── Jobs
      ├── Results
      └── Knowledge
```

与此同时：

```text
同一套核心源码
      │
      ├── Chrome Extension
      │
      └── Tampermonkey Userscript
```

**油猴脚本必须继续作为正式兼容构建目标，而不是残缺 Demo。**

---

# 1. 最重要的工程原则

## 1.1 禁止 Big Bang Rewrite

不要：

```text
删掉 userscript
↓
从零写 Chrome Extension
↓
重新实现字幕 / AI / Knowledge
```

正确顺序：

```text
冻结 v6.0.2
↓
建立 Golden Baseline
↓
抽纯函数
↓
抽 Runtime Adapter
↓
新源码重新构建 Userscript
↓
确认与 v6.0.2 行为等价
↓
再构建 Extension
↓
最后迁移到 Local Hub
```

任何阶段：

> 新 Userscript 出现功能退化，都必须停止继续迁移并先修复。

---

# 2. 暂定项目名称

项目暂定：

```text
SubBatch
```

Git 仓库暂定：

```text
subbatch
```

不要继续使用：

```text
loop-bilibili
```

作为整个系统名称。

但 Bilibili Collector 可以继续保留历史名称和兼容信息。

产品模块命名：

```text
SubBatch Browser
SubBatch Hub
SubBatch Knowledge
SubBatch Collectors
```

正式品牌以后可以单独讨论，现在不要因为命名阻碍架构迁移。

---

# 3. Monorepo 总体结构

创建：

```text
subbatch/
│
├── apps/
│   │
│   ├── extension/
│   │   ├── entrypoints/
│   │   │   ├── background.ts
│   │   │   ├── sidepanel/
│   │   │   └── bilibili.content.ts
│   │   │
│   │   ├── public/
│   │   ├── wxt.config.ts
│   │   └── package.json
│   │
│   ├── userscript/
│   │   ├── src/
│   │   │   └── main.ts
│   │   ├── metadata.ts
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── hub/
│       ├── src/
│       │   └── subbatch_hub/
│       │       ├── api/
│       │       ├── content/
│       │       ├── pipeline/
│       │       ├── knowledge/
│       │       ├── prompts/
│       │       ├── providers/
│       │       ├── jobs/
│       │       ├── storage/
│       │       └── main.py
│       │
│       ├── tests/
│       ├── pyproject.toml
│       └── README.md
│
├── packages/
│   │
│   ├── core/
│   │   ├── transcript/
│   │   ├── preprocess/
│   │   ├── postprocess/
│   │   ├── markdown/
│   │   ├── mermaid/
│   │   ├── knowledge/
│   │   └── utils/
│   │
│   ├── bilibili/
│   │   ├── collector/
│   │   ├── api/
│   │   ├── subtitle/
│   │   ├── route/
│   │   └── player/
│   │
│   ├── ui/
│   │   ├── studio/
│   │   ├── transcript/
│   │   ├── knowledge/
│   │   └── styles/
│   │
│   ├── runtime/
│   │   ├── types.ts
│   │   ├── userscript.ts
│   │   └── extension.ts
│   │
│   ├── hub-client/
│   │   ├── http.ts
│   │   ├── websocket.ts
│   │   ├── outbox.ts
│   │   └── protocol.ts
│   │
│   └── schemas/
│       ├── content.ts
│       ├── transcript.ts
│       ├── artifact.ts
│       ├── knowledge.ts
│       ├── job.ts
│       └── events.ts
│
├── legacy/
│   └── Bili-SubBatch-v6.0.2.user.js
│
├── scripts/
│   ├── build-userscript.ts
│   ├── build-extension.ts
│   ├── build-all.ts
│   └── verify-dist.ts
│
├── tests/
│   ├── fixtures/
│   ├── golden/
│   └── integration/
│
├── dist/
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
└── README.md
```

---

# 4. 技术栈

## Browser / shared

使用：

```text
TypeScript
pnpm workspace
Vite
Vitest
WXT
Manifest V3
```

Extension 使用：

```text
WXT
```

不要手工维护巨大的 `manifest.json`。

Extension 第一阶段不要引入复杂前端框架重写整个 UI。

现有 Studio UI 已经成熟，因此：

> 第一阶段继续采用当前 DOM/CSS UI 思想进行迁移。

如果未来要迁 React / Vue / Solid，应作为单独 UI 项目，不允许和基础架构迁移同时进行。

---

# 5. Userscript 构建策略

Userscript 不是手工维护文件。

入口：

```text
apps/userscript/src/main.ts
```

它调用：

```text
@subbatch/core
@subbatch/bilibili
@subbatch/ui
@subbatch/runtime
```

构建：

```bash
pnpm build:userscript
```

输出：

```text
dist/userscript/subbatch.user.js
```

Userscript 必须是：

```text
单文件
IIFE
完整 metadata header
无运行时 node_modules 依赖
```

必须保留需要的：

```text
@match
@connect
@grant
@run-at
```

例如：

```text
GM_xmlhttpRequest
GM_setClipboard
GM_addStyle
GM_info
GM_setValue
GM_getValue
unsafeWindow
```

构建脚本负责：

```text
metadata
+
bundle
=
subbatch.user.js
```

不要维护：

```text
extension logic 一份
userscript logic 另一份
```

---

# 6. Runtime Adapter

这是整个双构建架构的关键。

定义统一接口：

```ts
export interface SubBatchRuntime {
  storage: StorageAdapter
  network: NetworkAdapter
  clipboard: ClipboardAdapter
  shortcuts: ShortcutAdapter
  page: PageAdapter
  hub: HubAdapter
}
```

例如 Storage：

```ts
interface StorageAdapter {
  get<T>(key: string, fallback?: T): Promise<T>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}
```

Userscript：

```text
GM_getValue
GM_setValue
IndexedDB
```

Extension：

```text
chrome.storage.local
IndexedDB
```

网络：

Userscript：

```text
fetch
GM_xmlhttpRequest fallback
```

Extension：

```text
fetch from service worker
runtime messaging
```

Clipboard：

Userscript：

```text
GM_setClipboard
```

Extension：

```text
navigator.clipboard
```

**Shared Core 中禁止直接调用：**

```text
GM_*
chrome.*
browser.*
```

全部必须经过 Runtime Adapter。

---

# 7. Extension 架构

Extension 使用 Manifest V3。

结构：

```text
background service worker
│
├── Hub connection
├── command registry
├── tab coordination
├── runtime messaging
└── state orchestration
```

注意：

> Manifest V3 service worker 不是永远在线进程。

因此禁止：

```ts
let importantState = ...
```

然后假定它永久存在。

重要状态必须进入：

```text
chrome.storage
Hub
IndexedDB
```

---

# 8. Content Script 职责

Bilibili content script 负责：

```text
识别当前页面
读取 Bilibili DOM / API
字幕采集
播放器跳转
SPA route detection

AI 字幕页面内高亮
Knowledge Anchor 高亮
Selection Toolbar
```

不要把完整知识库 UI 和 Workflow Dashboard 全部塞进 Bilibili DOM。

---

# 9. Side Panel 职责

完整工作台逐渐迁移到 Chrome Side Panel：

```text
SubBatch

AI
字幕
Knowledge
Jobs
Settings
```

但是第一阶段不要删除原来的 Floating Studio。

形成：

```text
Extension
├── Side Panel
└── Floating Overlay

Userscript
└── Floating Overlay
```

最终：

```text
靠边模式
→ Side Panel

悬浮模式
→ Overlay
```

Userscript 因为没有 `chrome.sidePanel`：

```text
靠边
→ 原有 Dock Panel
```

---

# 10. 快捷键系统必须继续共用

保留当前 Command Registry 思路。

当前默认：

```text
Ctrl+B
召唤 / 隐藏

Ctrl+Alt+1
AI 处理字幕

Ctrl+Alt+2
后处理

Ctrl+Alt+D
悬浮 / 靠边
```

快捷键定义必须位于：

```text
packages/core/commands
```

而不是 UI。

Runtime 负责实际注册。

---

# 11. Content Schema

Hub 和 Browser 必须使用共享 Schema。

定义：

```ts
interface Content {
  id: string

  type:
    | "video_transcript"
    | "article"
    | "web_page"
    | "pdf"
    | "selection"

  source: string
  sourceId: string

  title: string
  author?: string
  url?: string

  metadata: Record<string, unknown>

  createdAt: string
  updatedAt: string
}
```

Bilibili：

```text
source = bilibili
sourceId = BVxxxx:P1
type = video_transcript
```

不要把 Bilibili 特有字段散落到 Hub 核心逻辑。

---

# 12. Transcript Version

不要只保存一个：

```text
content
```

应该：

```text
Content
└── Transcript Versions
    ├── raw
    └── normalized
```

Schema：

```ts
interface TranscriptVersion {
  id: string
  contentId: string

  kind:
    | "raw"
    | "normalized"

  text: string

  segments: TranscriptSegment[]

  sourceHash: string

  createdAt: string
}
```

Segment：

```ts
interface TranscriptSegment {
  id: string

  start: number
  end?: number

  text: string

  sourceCueIds?: string[]
}
```

这对以后 Knowledge Anchor re-anchor 非常重要。

---

# 13. PRE / POST 不要立即搬

第一阶段：

```text
Userscript
Extension
```

仍然可以使用浏览器内现有 PRE/POST Runtime。

先做到：

```text
代码模块化
+
双构建
```

确认稳定以后，再迁：

```text
PRE → Hub
POST → Hub
```

禁止同时：

```text
重构脚本
+
改 AI Pipeline
+
改 UI
+
迁数据库
```

否则无法定位回归。

---

# 14. Hub 第一版

Hub 使用：

```text
Python
FastAPI
SQLite
WAL
SQLAlchemy / SQLModel
Pydantic
asyncio
WebSocket
```

不要第一版引入：

```text
Redis
Celery
RabbitMQ
Kafka
PostgreSQL
Kubernetes
```

这是个人本地系统，不需要微服务基础设施。

---

# 15. Hub API v1

第一版至少实现：

```text
GET  /api/v1/health

POST /api/v1/content
GET  /api/v1/content
GET  /api/v1/content/{id}

POST /api/v1/content/{id}/transcripts
GET  /api/v1/content/{id}/transcripts

GET  /api/v1/jobs
GET  /api/v1/jobs/{id}

GET  /api/v1/results

WS   /api/v1/ws
```

Health：

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

---

# 16. Browser ↔ Hub 通信

使用：

```text
HTTP
+
WebSocket
```

分工：

HTTP：

```text
CRUD
正文上传
大结果
查询
```

WebSocket：

```text
事件
Job 状态
Streaming
Push
```

默认：

```text
http://127.0.0.1:8765
ws://127.0.0.1:8765/api/v1/ws
```

---

# 17. Outbox 必须从第一版设计

Hub 可能没有启动。

Collector 不能因此丢数据。

Browser：

```text
Collect
↓
Push Hub
↓
失败
↓
Outbox
```

状态：

```text
pending
sending
delivered
failed
retrying
```

IndexedDB：

```text
subbatch-outbox-v1
```

必须支持：

```text
自动重试
手动重试
查看错误
删除
```

不要把正文大量存进 `localStorage`。

---

# 18. Knowledge Schema

现在 v6 已经有：

```text
Anchor
ThreadNode
```

从第一天就定义 Shared Schema：

```ts
interface KnowledgeAnchor {
  id: string

  contentId: string
  transcriptVersionId?: string

  selectedText: string

  segmentIds: string[]

  timeStart?: number
  timeEnd?: number

  contextText: string
  sourceHash: string

  starred: boolean

  createdAt: string
  updatedAt: string
}
```

Thread：

```ts
interface KnowledgeThreadNode {
  id: string

  anchorId: string
  parentId?: string

  question: string
  answer: string

  suggestions: string[]

  modelId?: string

  starred: boolean

  status:
    | "running"
    | "completed"
    | "stopped"
    | "error"

  createdAt: string
  updatedAt: string
}
```

现在先继续浏览器 IndexedDB。

后续再迁 Hub。

但 Schema 必须从开始统一。

---

# 19. Artifact Schema

POST 不能再叫：

```text
一段模型输出字符串
```

定义：

```ts
interface Artifact {
  id: string
  contentId: string

  type:
    | "mermaid"
    | "note"
    | "quiz"
    | "custom"

  promptId: string
  modelId: string

  content: string

  status:
    | "running"
    | "completed"
    | "stopped"
    | "error"

  createdAt: string
}
```

这样以后 Result Store 很自然。

---

# 20. Prompt / LLM Schema

共享：

```text
Prompt
├ preprocessing
├ postprocessing
└ knowledge
```

不要在：

```text
Extension
Userscript
Hub
```

分别发明 Prompt 数据结构。

所有 Prompt 使用同一个 Schema Package。

---

# 21. 第 0 阶段：冻结 Legacy

首先复制：

```text
Bili-SubBatch-v6.0.2.user.js
```

到：

```text
legacy/Bili-SubBatch-v6.0.2.user.js
```

以后：

**禁止修改这个文件。**

它是：

```text
Golden Reference
```

---

# 22. 第 1 阶段：建立 Golden Tests

在拆代码以前，先测试当前核心纯逻辑。

至少覆盖：

```text
Bilibili URL / BV / P 识别

字幕解析

SRT
TXT

PRE chunk splitting

overlap

chunk stitch

Prompt rendering

Mermaid timestamp cleaning

Knowledge suggestion parser

Knowledge branch context

shortcut chord parsing

route key

cache key
```

fixtures：

```text
tests/fixtures/

single-video.json
collection.json
long-transcript.json
pre-output.txt
knowledge-output.txt
```

---

# 23. 第 2 阶段：只抽 Pure Core

从 v6.0.2 逐个迁移：

```text
md5
formatting
parsers
chunk engine
prompt rendering
knowledge helpers
schemas
```

要求：

> 每迁一个模块，Legacy 行为测试必须保持通过。

不要一口气移动几千行。

---

# 24. 第 3 阶段：Runtime Adapter

把：

```text
GM_getValue
GM_setValue
GM_xmlhttpRequest
GM_setClipboard
GM_addStyle
```

逐渐替换成：

```text
runtime.storage
runtime.network
runtime.clipboard
runtime.style
```

然后：

```text
apps/userscript
```

注入：

```text
UserscriptRuntime
```

这一步完成以后：

```text
packages/*
```

不能再出现 `GM_`。

---

# 25. 第 4 阶段：新 Userscript 构建

这是整个迁移的第一个关键 Gate。

必须做到：

```bash
pnpm build:userscript
```

生成：

```text
dist/userscript/subbatch.user.js
```

然后和 v6.0.2 做真实浏览器回归。

以下功能全部通过以后，才允许开始 Extension：

```text
当前视频自动识别

合集扫描

字幕抓取

字幕库

PRE

6 并发

长视频 chunk

AI 处理字幕卡片

POST

Mermaid

Prompt

LLM

Knowledge

选中文字

Knowledge Rail

Thread Tree

Knowledge 搜索

SPA 切视频

Ctrl+B

Ctrl+Alt+1

Ctrl+Alt+2

Ctrl+Alt+D
```

**这一 Gate 不允许跳过。**

---

# 26. 第 5 阶段：Chrome Extension

只有新 Userscript 完全可用以后，才创建：

```text
apps/extension
```

使用：

```text
WXT
Manifest V3
TypeScript
```

第一版只做：

```text
Bilibili content script
Service Worker
Floating Studio
Commands
Storage Adapter
```

目标：

> 同一套 packages 在 Extension Runtime 中成功运行。

---

# 27. 第 6 阶段：Side Panel

Extension 功能稳定后，再加：

```text
Side Panel
```

把：

```text
AI Workspace
Subtitle Library
Knowledge
Settings
```

逐渐迁进去。

页面仍保留：

```text
Anchor highlight
Selection toolbar
Player integration
```

不要把这些从页面移走。

---

# 28. 第 7 阶段：Hub 最小闭环

实现：

```text
Bilibili
↓
Content
↓
POST localhost
↓
SQLite
↓
GET Content
↓
WebSocket acknowledgement
↓
Extension
```

先不迁 AI。

验收：

```text
浏览器关闭
↓
重新打开
↓
Content 仍存在
```

---

# 29. 第 8 阶段：PRE 移入 Hub

当前浏览器 PRE Engine 作为 reference。

Hub 实现等价：

```text
Raw Transcript
↓
Chunk Planner
↓
Worker Pool
↓
Retry
↓
Stitch
↓
Normalized Transcript
```

结果进入：

```text
TranscriptVersion(kind=normalized)
```

Extension WebSocket 实时显示：

```text
7 / 15
8 / 15
...
15 / 15
```

此时浏览器关闭不再影响 PRE。

---

# 30. 第 9 阶段：POST 移入 Hub

建立：

```text
Workflow
Job
Run
Artifact
```

例如：

```text
Workflow:
全 Mermaid 学习图谱

Task:
POST Mermaid

Models:
Model A
Model B
```

结果进入 Artifact Store。

---

# 31. 第 10 阶段：Knowledge 移入 Hub

浏览器 IndexedDB：

```text
Anchor
Thread
```

迁入：

```text
Hub Knowledge Store
```

Extension 页面只做：

```text
显示
创建
追问
高亮
```

Hub 成为 Knowledge 唯一真相源。

---

# 32. Build 命令

Root package 至少支持：

```bash
pnpm install

pnpm dev:extension
pnpm dev:userscript

pnpm test
pnpm lint
pnpm typecheck

pnpm build:extension
pnpm build:userscript

pnpm build
```

其中：

```bash
pnpm build
```

必须至少生成：

```text
dist/
├── extension/
│   ├── chrome/
│   └── subbatch-chrome.zip
│
└── userscript/
    └── subbatch.user.js
```

后续 Hub 加入：

```text
dist/hub/
```

---

# 33. CI

GitHub Actions：

```text
install
↓
typecheck
↓
lint
↓
unit tests
↓
build userscript
↓
build extension
↓
verify artifacts
```

Pull Request 只要：

```text
Userscript build failure
```

或者：

```text
Extension build failure
```

就禁止通过。

---

# 34. Release

Tag：

```text
v6.1.0
```

Release assets：

```text
subbatch.user.js
subbatch-chrome.zip
```

以后：

```text
subbatch-hub-windows-x64.zip
subbatch-hub-linux-x64.tar.gz
```

---

# 35. 安全要求

严禁：

```text
API Key
GitHub PAT
Cookie
账号 Token
```

写进：

```text
源码
fixtures
.gitignore 漏掉的配置
CI 日志
README 示例真实值
```

所有 secret：

```text
.env
GM storage
Chrome storage
OS environment
```

并提供：

```text
.env.example
```

只能是假值。

---

# 36. Manifest V3 特别要求

禁止：

```text
远程 JS
eval
new Function
下载代码后执行
```

所有 Extension 执行逻辑必须在构建产物内部。

API 返回：

```text
Prompt
Content
Model Response
Config
```

可以。

API 返回：

```text
一段 JavaScript 然后 Extension 执行
```

禁止。

---

# 37. 不要做的事情

本次迁移过程中禁止：

```text
重写整个 UI

更换整个设计语言

改 PRE Prompt

改 POST Prompt

改 Knowledge UX

改 chunk 算法

改缓存语义

同时引入 React 重构

同时迁移 Hub

为了“代码漂亮”删除现有 fallback

为了类型完美改业务行为
```

当前目标首先是：

> **架构迁移，不是产品重新设计。**

---

# 38. AI 工作方式要求

不要一次生成整个项目然后宣布完成。

按 Phase 执行。

每一个 Phase：

1. 先检查 Legacy 对应代码。
2. 确定迁移边界。
3. 修改。
4. `typecheck`。
5. `test`。
6. `build`。
7. 报告修改文件。
8. 报告仍未迁移模块。
9. 再进入下一阶段。

如果发现现有 Legacy 行为不清楚：

> 优先保持原行为，而不是自行重新设计。

---

# 39. 第一轮任务范围

**现在第一轮只做 P0～P4：**

```text
P0 Monorepo scaffold
P1 Golden tests
P2 Pure core extraction
P3 Runtime abstraction
P4 New Userscript build
```

暂时：

**不要开始 Hub。**

**不要开始 Side Panel。**

**不要开始 Browser AI automation。**

**不要删除 Legacy。**

第一轮最终必须得到：

```text
subbatch/
+
pnpm build:userscript
+
dist/userscript/subbatch.user.js
```

并证明新的：

```text
subbatch.user.js
```

能够取代当前：

```text
Bili-SubBatch-v6.0.2.user.js
```

完成同样的 Bilibili 核心工作。

---

# 40. 第一轮最终验收标准

只有全部满足才能宣布第一轮完成：

```text
[ ] monorepo 可以 pnpm install

[ ] pnpm typecheck 通过

[ ] pnpm test 通过

[ ] pnpm build:userscript 通过

[ ] 生成单文件 .user.js

[ ] metadata 正确

[ ] Tampermonkey 可安装

[ ] Bilibili 单视频识别正常

[ ] 合集扫描正常

[ ] 字幕抓取正常

[ ] PRE 正常

[ ] POST 正常

[ ] Mermaid 正常

[ ] Knowledge Anchor 正常

[ ] Infinite Drill-down 正常

[ ] SPA 切视频正常

[ ] Ctrl+B 正常

[ ] Ctrl+Alt+1 正常

[ ] Ctrl+Alt+2 正常

[ ] Ctrl+Alt+D 正常

[ ] Legacy 文件未经修改

[ ] shared packages 中不存在直接 GM_* 调用
```

---

# 41. 最终架构目标

完成整个迁移以后：

```text
                    SubBatch

        ┌──────── Browser Layer ────────┐

 Bilibili     Zhihu      Web     YouTube
     │           │        │         │
     └────── Collect / Normalize ──────┘
                     │
                 Outbox
                     │
                     ▼

        ┌────── Local Content Hub ──────┐
        │                               │
        │ Content                       │
        │ Transcript Versions           │
        │ PRE / POST                    │
        │ Workflow                      │
        │ Jobs / Runs                   │
        │ Prompts / Models              │
        │ Artifacts                     │
        │ Knowledge                     │
        │                               │
        └─────────────┬─────────────────┘
                      │
              Destination Router
                │             │
                ▼             ▼
           API / Local    Browser Assist
                │             │
                └──────┬──────┘
                       ▼
                    Results
                       │
              HTTP / WebSocket
                       │
                       ▼
              Extension / Web UI
```

而：

```text
Chrome Extension
Tampermonkey Userscript
```

只是两个不同 Runtime。

它们共享同一个：

```text
Core
Schemas
Bilibili Collector
Knowledge
Prompt
UI primitives
Hub protocol
```

---

# 最关键的一句话

本次重构的成功标准不是：

> “终于写成 Chrome Extension 了。”

而是：

> **把现在已经很好用的 SubBatch v6.0.2，从一个巨大的 Userscript，演化成一个有清晰边界、可双端构建、可继续接 Local Hub 的工程，同时不牺牲现有任何成熟功能。**

优先级始终是：

```text
行为兼容
>
可测试
>
模块边界
>
双构建
>
Extension
>
Hub
>
进一步重构
```