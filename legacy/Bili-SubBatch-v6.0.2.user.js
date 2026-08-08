// ==UserScript==
// @name         Bili SubBatch (loop-bilibili)
// @namespace    https://github.com/loop-bilibili/bili-subbatch
// @version      6.0.2
// @description  B站知识阅读工作台：字幕预处理、多产物后处理、Anchor 局部追问树与持久 Knowledge Workspace
// @author       loop-bilibili
// @match        *://www.bilibili.com/video/*
// @match        *://www.bilibili.com/list/*
// @match        *://www.bilibili.com/bangumi/play/*
// @match        *://www.bilibili.com/medialist/*
// @match        *://www.bilibili.com/favlist*
// @match        *://space.bilibili.com/*
// @match        *://search.bilibili.com/*
// @connect      api.bilibili.com
// @connect      aisubtitle.hdslb.com
// @connect      *.hdslb.com
// @connect      bilibili.com
// @connect      *
// @connect      cdn.jsdelivr.net
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/589638/Bili%20SubBatch%20%28loop-bilibili%29.user.js
// @updateURL https://update.greasyfork.org/scripts/589638/Bili%20SubBatch%20%28loop-bilibili%29.meta.js
// ==/UserScript==

/**
 * v6.0.2 — 快捷键微调：主召唤/隐藏默认键改为 Ctrl+B；旧版仍使用默认 Ctrl+Alt+B 的配置自动迁移，用户自定义键位保持不变。
 * v6.0.1 — 全局快捷键 / Quick Summon：新增可编辑快捷键中心；支持快捷召唤/隐藏、AI 处理字幕直达、后处理上次模型直达、悬浮/靠边切换；召唤布局与默认内容可配置，并检测 Chrome / Bilibili 常见冲突。
 * v6.0.0 — Knowledge Drill-down：AI 处理字幕可选区创建 Anchor；右侧 Knowledge Rail 支持独立树状追问、Breadcrumb、建议追问与流式回答；Anchor/Thread 通过独立 IndexedDB 永久保存，并新增 Knowledge Workspace 检索与恢复。
 * v5.10.2 — AI 处理字幕阅读视图重构：规范化稿按语义段落渲染为知识卡片，提取真实时间范围、主题上下文与识别存疑提示；原始字幕仍保留证据流文本视图。
 * v5.10.1 — 流程表单 UI 精修：原生下拉统一为自绘选择器外观；数字参数改为 −/＋ Stepper；预处理开关与模型多选改为统一 Studio 控件；保留原生可访问性与键盘操作。
 * v5.10.0 — Studio Shell UI/UX 重构：顶层横向标签改为左侧 Workspace Rail；主画布、上下文工具条、设置与资源库统一信息层级；状态栏改为非侵入式浮动状态；为 v6 Knowledge Workspace 预留稳定界面骨架。
 * v5.9.3 — AI 工作台恢复「预处理 / 后处理」一级阶段；预处理直接查看原始字幕与 AI 处理字幕，后处理专门承载 Mermaid 等 POST 产物及模型版本。
 * v5.9.2 — 设置 → Prompt 拆成独立“预处理 / 后处理”工作区：列表、搜索、新建与编辑按阶段隔离；编辑器不再暴露阶段下拉框。
 * v5.9.1 — 微调 PRE 默认全局并发：3 → 6；失败重试仍默认 2，其他 Chunk Engine 参数与行为不变。
 * v5.9.0 — PRE Chunk Engine：预处理模型/全局并发可控；按视频时间优先、字符硬限制智能切块；支持可调 overlap、失败重试、全局 Worker Pool 与基于真实时间戳的确定性拼接去重，面向 2h+ 长视频。
 * v5.8.1 — 修复 B 站 SPA/合集内切视频时 AI 输入不换源：当前 BV+P 成为自动分析唯一输入；路由变化立即清空旧预处理稿/结果；自动抓取不再要求 ctx.type===video。内置 PRE 统一将任意语言字幕转换为简体中文。
 * v5.8.0 — AI Workbench：主界面不再暴露 Pipeline 参数；输入/产物/模型三级信息重新分层。后处理支持多个产物任务，每个 POST Prompt 独立选择一个或多个 LLM；结果先按产物、再按模型切换。预处理稿移入“查看输入”抽屉，处理方案移入独立抽屉。
 * v5.7.0 — AI Pipeline：原始字幕 → 可关闭的字幕规范化预处理 → 后处理；PRE/POST Prompt 分阶段管理，预处理模型可独立选择，结果按视频缓存并可查看/强制重跑，后处理重生成复用预处理稿。
 * v5.6.0 — 字幕库重构为视频资源库 Master–Detail：采集抽屉、搜索/状态筛选、左侧唯一视频列表、右侧字幕工作区；扫描按 BV+P 增量合并，避免视频列表与字幕列表上下重复堆叠。
 * v5.5.0 — 设置页重构为 Prompt / LLM 双标签 Master–Detail：左侧搜索与配置列表，右侧仅编辑当前项；切换条目前自动保存，适合大量提示词与模型配置。
 * v5.4.0 — AI 任务层重构为透明提示词库：仅内置“全 Mermaid 学习图谱”；System/User 提示词完整可见、可编辑、可新增/复制/删除；移除旧深度/精炼/学习/行动模式。
 * v5.3.3 — Mermaid 图禁止时间戳：提示词约束 + 本地代码块清洗 + 修复链路清洗，正文引用不受影响。
 * v5.3.2 — 面板宽度小/中/大三档；高度默认约 90vh，支持独立手动调整。
 * v5.3.1 — 新增当前模型独立重新生成与全部重新生成；失败模型可单独重试，已完成模型与其结果不受影响。
 * v5.3.0 — 重构字幕提示词为固定证据协议、模式模块、结构化来源、模型附加要求与质量检查。
 * v5.2.4 — 修复发送前覆盖未保存模型配置、旧 4096 默认值迁移、严格识别流式截断；Mermaid 修复上限改为 32768。
 * v5.2.3 — 新建 AI 配置的默认 Max tokens 调整为 65536。
 * v5.2.2 — 彻底移除全局按钮总闸：扫描、批处理与 AI 使用独立操作令牌；主操作按钮始终可点击，可排队或重新开始。
 * v5.2.1 — 修复合集扫描覆盖当前字幕；扫描/批处理与 AI 生成使用独立忙状态，避免字幕按钮长期灰化。
 * v5.2.0 — 阅读优先布局：紧凑 AI 控制栏、正文扩容与全窗口专注模式。
 * v5.1.1 — Mermaid 修复按模型隔离：只检查目标模型状态，并锁定其配置与笔记源码，避免跨标签串写。
 * v5.1.0 — 多模型配置与并发分析：一次字幕输入同时运行多个模型，并可切换查看独立结果。
 * v2.0.3 — 新增「全 Mermaid 学习图谱」模式：多图拆解知识、流程、因果、学习路径与自测。
 * v2.0.1 — Mermaid 高对比可读渲染：原始宽度、缩放工具栏与全屏查看。
 * v2.0 — 四级缓存与 stale-while-revalidate；当前字幕全文检索、时间跳转、播放同步高亮。
 * v1.1 — 当前视频自动抓字幕：页面直读优先、内存缓存、WBI 完整链路回退。
 * v1.0 — 安全 Markdown、时间戳证据、按需渲染、追加式流输出、低功耗 UI。
 * v0.8 — Peer AI-userscript practices: page fetch stream first,
 * GM stream fallback (no timeout), stick-bottom scroll, GM storage.
 * See PEER_AI_PRACTICES.md.
 */

(function () {
  "use strict";

  const SCRIPT_VERSION =
    (typeof GM_info !== "undefined" && GM_info?.script?.version) || "6.0.2";
  const PANEL_ID = "bili-subbatch-panel";
  const UI_STORE_KEY = "bili-subbatch-ui-v2";
  /** v2：默认 stream=true，避免非流式长推理被中间层 10s 掐断 (client_gone) */
  const AI_STORE_KEY = "bili-subbatch-ai-v2"; // legacy single-profile key
  const AI_PROFILES_STORE_KEY = "bili-subbatch-ai-profiles-v1";
  const AI_PROFILES_SCHEMA_VERSION = 4;
  const PROMPT_STORE_KEY = "bili-subbatch-prompts-v1";
  const PROMPT_SCHEMA_VERSION = 5;
  const DEFAULT_PROMPT_ID = "builtin-mermaid-learning-map";
  const DEFAULT_PREPROCESS_PROMPT_ID = "builtin-subtitle-normalizer";
  const DEFAULT_KNOWLEDGE_PROMPT_ID = "builtin-knowledge-drilldown";
  const PREPROCESS_ENABLED_STORE_KEY = "bili-subbatch-preprocess-enabled-v1";
  const PREPROCESS_MODEL_STORE_KEY = "bili-subbatch-preprocess-model-v1";
  const PREPROCESS_CONCURRENCY_STORE_KEY = "bili-subbatch-preprocess-concurrency-v1";
  const PREPROCESS_TARGET_MINUTES_STORE_KEY = "bili-subbatch-preprocess-target-minutes-v1";
  const PREPROCESS_OVERLAP_SECONDS_STORE_KEY = "bili-subbatch-preprocess-overlap-seconds-v1";
  const PREPROCESS_MAX_CHARS_STORE_KEY = "bili-subbatch-preprocess-max-chars-v1";
  const PREPROCESS_RETRIES_STORE_KEY = "bili-subbatch-preprocess-retries-v1";
  const POST_TASKS_STORE_KEY = "bili-subbatch-post-tasks-v1";
  const POST_TASKS_SCHEMA_VERSION = 1;
  const KNOWLEDGE_MODEL_STORE_KEY = "bili-subbatch-knowledge-model-v1";
  const SHORTCUT_STORE_KEY = "bili-subbatch-shortcuts-v1";
  const SHORTCUT_SCHEMA_VERSION = 2;
  const SHORTCUT_COMMANDS = Object.freeze([
    Object.freeze({ id: "toggle-panel", label: "召唤 / 隐藏面板", hint: "打开时按你的召唤布局与默认内容进入；再次按下收起。", defaultChord: "Ctrl+KeyB" }),
    Object.freeze({ id: "open-processed", label: "AI 处理字幕", hint: "直接打开 AI 工作台 → 预处理 → AI 处理字幕。", defaultChord: "Ctrl+Alt+Digit1" }),
    Object.freeze({ id: "open-postprocess", label: "后处理结果", hint: "直接打开 AI 工作台 → 后处理，并恢复当前/上次产物与模型。", defaultChord: "Ctrl+Alt+Digit2" }),
    Object.freeze({ id: "toggle-dock", label: "悬浮 / 靠边", hint: "在悬浮模式和你偏好的贴边方向之间切换。", defaultChord: "Ctrl+Alt+KeyD" }),
  ]);
  const KNOWLEDGE_DB_NAME = "bili-subbatch-knowledge-v1";
  const KNOWLEDGE_DB_VERSION = 1;
  const KNOWLEDGE_ANCHOR_STORE = "anchors";
  const KNOWLEDGE_NODE_STORE = "nodes";
  const KNOWLEDGE_SELECTION_MIN = 2;
  const KNOWLEDGE_SELECTION_MAX = 1200;
  const PREPROCESS_CACHE_TTL_MS = 30 * 24 * 60 * 60_000;
  const PREPROCESS_DEFAULT_CONCURRENCY = 6;
  const PREPROCESS_DEFAULT_TARGET_MINUTES = 8;
  const PREPROCESS_DEFAULT_OVERLAP_SECONDS = 30;
  const PREPROCESS_DEFAULT_MAX_CHARS = 24000;
  const PREPROCESS_DEFAULT_RETRIES = 2;
  const AUTO_CAPTURE_STORE_KEY = "bili-subbatch-auto-capture-v1";
  const AUTO_ANALYZE_STORE_KEY = "bili-subbatch-auto-analyze-v1";
  const TRANSCRIPT_FOLLOW_STORE_KEY = "bili-subbatch-transcript-follow-v2";
  const PLAYER_SUBTITLE_STORE_KEY = "bili-subbatch-player-subtitle-v2";
  const PLAYER_SUBTITLE_SELECTORS = Object.freeze({
    button: ".bpx-player-ctrl-subtitle",
    panel: ".bpx-player-ctrl-subtitle-box",
    item: ".bpx-player-ctrl-subtitle-language-item[data-lan]",
    active: ".bpx-player-ctrl-subtitle-language-item.bpx-state-active",
  });
  const CACHE_DB_NAME = "bili-subbatch-cache-v2";
  const CACHE_DB_VERSION = 1;
  const CACHE_STORE_NAME = "records";
  const CACHE_CHANNEL_NAME = "bili-subbatch-cache-v2";
  const CACHE_SESSION_PREFIX = "bsb:v2:";
  const MEMORY_CACHE_LIMIT = 32;
  const VIEW_CACHE_TTL_MS = 30 * 60_000;
  const TRACK_CACHE_TTL_MS = 10 * 60_000;
  const SUBTITLE_CACHE_TTL_MS = 30 * 24 * 60 * 60_000;
  const SUBTITLE_REVALIDATE_MS = 12 * 60 * 60_000;
  const AUTO_CAPTURE_DELAY_MS = 420;
  const AUTO_ANALYZE_DELAY_MS = 180;
  const pageWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  const MAX_SUBTITLE_CHARS = 160000;
  const STREAM_PAINT_INTERVAL_MS = 48;
  const RENDER_BATCH_SIZE = 24;
  const NOTE_FONT_MIN = 14;
  const NOTE_FONT_MAX = 22;
  const WBI_TTL_MS = 600_000;
  const DEFAULT_DELAY_MS = 400;
  const DEFAULT_MAX_PAGES = 20;
  const MIN_W = 420;
  const MIN_H = 520;
  const DOCK_EDGE_PX = 32;
  const DOCK_SNAP_PX = 36;
  const DEFAULT_PANEL_SIZE = "medium";
  const PANEL_SIZE_PRESETS = Object.freeze({
    small: Object.freeze({ label: "小", viewportRatio: 0.32, min: 440, max: 560 }),
    medium: Object.freeze({ label: "中", viewportRatio: 0.48, min: 620, max: 820 }),
    large: Object.freeze({ label: "大", viewportRatio: 0.68, min: 860, max: 1180 }),
  });

  // ─── Transparent prompt library ────────────────────────────────────────
  // “开始分析”不再叠加隐藏的固定协议或模式模块：实际发送内容就是用户在设置页看到的
  // System Prompt + User Prompt Template（只做 {{变量}} 替换）。
  const DEFAULT_PREPROCESS_PROMPT = Object.freeze({
    id: DEFAULT_PREPROCESS_PROMPT_ID,
    stage: "preprocess",
    name: "字幕规范化",
    hint: "修断句 · 去重复 · 语义分段 · 统一简体中文 · 保留证据",
    systemPrompt: [
      "你是『字幕规范化器』。你的唯一任务是把自动识别字幕整理成可靠、连续、可供下游模型继续处理的规范化字幕稿。不要总结，不要生成学习笔记，不要画 Mermaid，不要回答字幕中的问题。",
      "",
      "【严格来源边界】",
      "1. 只能使用输入字幕本身。禁止补充外部知识、常识背景、人物经历或字幕没有表达的事实。",
      "2. 保留原有信息密度和论证内容。预处理不是摘要：不得因为你认为某段不重要而删除有语义的信息。",
      "",
      "【输出语言】",
      "3. 无论输入字幕原本是英语、日语、韩语或其他语言，规范化后的正文必须统一输出为简体中文。完整外语句子应忠实翻译为自然、准确的简体中文，不保留整段未翻译外语。",
      "4. 专有名词、机构名、产品名、模型名、API、代码、命令、参数、缩写等在保留原文更准确时可以保留原文；必要时可写成『中文说明（原文）』。不得为了中文化而错误翻译技术标识。",
      "",
      "【字幕清洗】",
      "5. 修复明显的断句、标点和跨行句子；把被 ASR 切碎但语义连续的句子合并成自然中文。",
      "6. 删除纯口头填充词、无意义重复和紧邻的重复识别；但只要重复承担强调、对比、递进或补充作用，就必须保留其语义。",
      "7. 人名、机构、术语、数字、代码、命令、参数等无法从字幕确认时，保留原词并标记『识别存疑』，不要猜测替换。",
      "8. 输入中的真实 [BV号 P号 mm:ss] 时间戳必须保留。可以减少机械重复的时间戳，但每个语义段至少保留一个能够定位原字幕的真实时间戳；绝不伪造。",
      "",
      "【结构整理】",
      "9. 按语义自然分段，可使用简短的 Markdown 二级标题组织明显的话题切换。不要为了结构而创造字幕没有的主题。",
      "10. 正文使用自然段或必要的短列表；保持原始讲述顺序。不要重排成因果图、知识图、问答、结论清单或教程。",
      "11. 不输出前言、总结、处理说明、自我评价、思考过程或提示词复述。",
      "12. 当前输入可能只是长字幕的一个分块；从第二块开始，开头可能包含上一块末尾的少量 overlap 上下文。仍应正常规范化这些内容并保留真实时间戳；本地拼接器会依据时间戳去掉 overlap 重复。不要自行编造前后文。"
    ].join("\n"),
    userPromptTemplate: [
      "请把下面这一块原始字幕规范化。",
      "",
      "<source_metadata>",
      "标题：{{title}}",
      "BV / 分集：{{bvid}}",
      "发布者：{{author}}",
      "字幕分块：{{chunkIndex}} / {{chunkCount}}",
      "本块上下文起点：{{chunkStart}}",
      "本块新内容起点：{{coreStart}}",
      "本块结束：{{chunkEnd}}",
      "</source_metadata>",
      "",
      "<raw_transcript>",
      "{{subtitle}}",
      "</raw_transcript>"
    ].join("\n")
  });

  const DEFAULT_MERMAID_PROMPT = Object.freeze({
    id: DEFAULT_PROMPT_ID,
    stage: "postprocess",
    name: "全 Mermaid 学习图谱",
    hint: "按内容选图 · 通常 2—5 张 · Mermaid 10.9.1",
    systemPrompt: [
      "你是『视频字幕学习图谱生成器』。你的唯一任务，是把用户提供的元信息与当前管线提供的字幕稿转换为可复习的 Mermaid 学习图谱。",
      "",
      "【来源边界】",
      "1. 只使用本次提供的元信息与字幕。不要补充外部知识、常识背景、人物经历或字幕没有支持的结论。",
      "2. 输入通常已经经过字幕规范化；若用户关闭预处理，也可能是原始自动字幕。无论哪种情况都不得改变原意。人名、机构、数字、命令、参数、代码或术语无法确认时，在节点文字中标记『识别存疑』，不要猜测替换。",
      "2a. 所有最终可见标题与 Mermaid 节点文字统一使用简体中文。若输入仍是英语、日语或其他语言，先忠实理解并转换为简体中文；专有名词、模型名、API、代码、命令、参数和缩写可保留必要原文。",
      "3. 输入中的 [BV号 P号 mm:ss] 只用于定位证据。最终 Mermaid 节点、边、子图标题以及 Markdown 标题中都不要输出 BV/P/时间戳引用，也不要伪造时间戳。",
      "",
      "【输出目标】",
      "4. 用少量、用途明确的图重建字幕中的知识关系，不按字幕顺序逐句复述。图的数量服从内容，不为凑数生成空洞图。",
      "5. 通常输出 2—5 张图。内容足够时优先包含一张知识总览；其余只从流程或论证链、因果或依赖、对比或决策、学习路径、自测关系中选择字幕真正支持的类型。",
      "6. 每张图保持单一主题，建议 8—18 个节点。优先保留核心概念、关键关系、步骤、条件、边界、例子、风险和结论；删除口头填充、重复和无信息增量内容。",
      "7. 学习路径或自测图中的问题必须能直接由本次字幕回答，不得引入字幕外知识。",
      "",
      "【严格输出格式】",
      "8. 只允许一个 Markdown 一级标题。其后每张图使用一个 Markdown 二级标题和一个独立的 ```mermaid``` 代码块。",
      "9. 除一级/二级标题与 Mermaid 代码块外，不要输出普通段落、列表、表格、引用、解释、前言、总结、提示词复述或思考过程。",
      "10. 只使用 Mermaid 10.9.1 的 flowchart TD 或 flowchart LR。禁止 mindmap、timeline、xychart、architecture-beta、click、classDef、style、init 与实验语法。",
      "11. 每个 Mermaid 代码块必须独立完整。节点 ID 只使用 ASCII 字母和数字；可见文字放进双引号标签，例如 A1[\"核心概念\"]。标签内部避免英文双引号、反引号和花括号，只在必要时使用 <br/>。",
      "12. 输出前静默检查每个代码块的括号、引号、箭头、节点 ID 与连接关系，确保 Mermaid 10.9.1 可以解析。",
    ].join("\n"),
    userPromptTemplate: [
      "请严格按照 System Prompt，把下面的当前字幕稿转换为最终的全 Mermaid 学习图谱。",
      "",
      "<source_metadata>",
      "标题：{{title}}",
      "BV / 分集：{{bvid}}",
      "发布者：{{author}}",
      "</source_metadata>",
      "",
      "<transcript>",
      "{{subtitle}}",
      "</transcript>",
    ].join("\n"),
  });

  const DEFAULT_KNOWLEDGE_PROMPT = Object.freeze({
    id: DEFAULT_KNOWLEDGE_PROMPT_ID,
    stage: "knowledge",
    name: "局部知识追问",
    hint: "锚点附近字幕 + 当前分支上下文 → 聚焦解释与建议追问",
    systemPrompt: [
      "你是『局部知识钻取助手』。用户正在阅读一段已经规范化的视频字幕，并从其中选中了一个知识锚点。你的任务是围绕当前锚点和当前问题进行聚焦解释，而不是重新总结整段视频。",
      "",
      "【上下文使用】",
      "1. 优先使用提供的字幕局部上下文解释讲者当前讨论的含义，并明确区分『字幕中明确表达』与『为了回答问题而补充的通用知识』。",
      "2. 允许补充可靠的通用知识，因为用户的追问可能超出字幕；但不要伪造视频中没有说过的内容，不要把补充知识冒充成讲者原话。",
      "3. 只沿当前追问分支使用祖先上下文，不引入同一锚点其他分支的讨论。",
      "4. 默认使用简体中文。模型名、API、代码、公式、命令和国际通用术语在保留原文更准确时可保留原文。",
      "",
      "【回答风格】",
      "5. 先直接回答当前问题，再解释关键机制、必要条件、边界或对比。避免百科式漫无边际扩写。",
      "6. 可使用短标题、列表、公式和必要的代码；不要输出思考过程。",
      "7. 回答末尾必须输出一个 <suggestions> 块，包含 2—4 个真正有递进价值的下一步问题，每行一个以 '- ' 开头的问题。不要在正文中解释这个块。",
      "8. 建议问题应从当前答案自然向下一层钻取，不要重复当前问题，也不要只是换一种说法。",
    ].join("\n"),
    userPromptTemplate: [
      "<source>",
      "标题：{{title}}",
      "BV / 分集：{{bvid}}",
      "发布者：{{author}}",
      "</source>",
      "",
      "<anchor>",
      "{{anchorText}}",
      "</anchor>",
      "",
      "<local_source_context>",
      "{{sourceContext}}",
      "</local_source_context>",
      "",
      "<ancestor_branch>",
      "{{ancestorPath}}",
      "</ancestor_branch>",
      "",
      "<current_question>",
      "{{question}}",
      "</current_question>",
    ].join("\n"),
  });

  /** OpenAI 兼容默认值（密钥优先存入 userscript 隔离存储） */
  const AI_DEFAULTS = {
    baseUrl: "",
    // Never ship secrets in-repo; user fills in Settings (GM/local storage only)
    apiKey: "",
    model: "openai/gpt-oss-120b",
    temperature: 0.4,
    maxTokens: 65536,
    /**
     * 必须默认 true：非流式要等整包，长请求常被扩展/代理 ~10s 空闲断开
     * 网关日志表现为 client_gone / context canceled。
     * 流式会先推 reasoning，已兼容 content+reasoning 字段。
     */
    stream: true,
  };

  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  function loadAutoCaptureSetting() {
    const raw = storageGet(AUTO_CAPTURE_STORE_KEY, true);
    return ![false, 0, "0", "false", "off"].includes(raw);
  }

  function saveAutoCaptureSetting(enabled) {
    storageSet(AUTO_CAPTURE_STORE_KEY, enabled ? "true" : "false");
  }

  /** 默认开启：当前视频字幕抓取成功后，自动执行与“开始分析”按钮相同的流程。 */
  function loadAutoAnalyzeSetting() {
    const raw = storageGet(AUTO_ANALYZE_STORE_KEY, true);
    return ![false, 0, "0", "false", "off"].includes(raw);
  }

  function saveAutoAnalyzeSetting(enabled) {
    storageSet(AUTO_ANALYZE_STORE_KEY, enabled ? "true" : "false");
  }

  function loadPreprocessEnabledSetting() {
    const raw = storageGet(PREPROCESS_ENABLED_STORE_KEY, true);
    return ![false, 0, "0", "false", "off"].includes(raw);
  }

  function savePreprocessEnabledSetting(enabled) {
    storageSet(PREPROCESS_ENABLED_STORE_KEY, enabled ? "true" : "false");
  }

  function loadBoundedNumberSetting(key, fallback, min, max, integer = true) {
    const raw = Number(storageGet(key, fallback));
    const value = Number.isFinite(raw) ? raw : fallback;
    const bounded = Math.min(max, Math.max(min, value));
    return integer ? Math.round(bounded) : bounded;
  }

  function saveBoundedNumberSetting(key, value, fallback, min, max, integer = true) {
    const raw = Number(value);
    const normalized = Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : fallback;
    const finalValue = integer ? Math.round(normalized) : normalized;
    storageSet(key, String(finalValue));
    return finalValue;
  }

  function loadTranscriptFollowSetting() {
    const raw = storageGet(TRANSCRIPT_FOLLOW_STORE_KEY, true);
    return ![false, 0, "0", "false", "off"].includes(raw);
  }

  function loadPlayerSubtitleSetting() {
    const raw = storageGet(PLAYER_SUBTITLE_STORE_KEY, true);
    return ![false, 0, "0", "false", "off"].includes(raw);
  }

  function debounce(fn, wait = 100) {
    let timer = 0;
    return function (...args) {
      clearTimeout(timer);
      timer = window.setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function lruGet(map, key) {
    if (!map.has(key)) return null;
    const value = map.get(key);
    map.delete(key);
    map.set(key, value);
    return value;
  }

  function lruSet(map, key, value, max = MEMORY_CACHE_LIMIT) {
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    while (map.size > max) map.delete(map.keys().next().value);
    return value;
  }

  function sessionCacheRead(kind, key, ttlMs) {
    try {
      const raw = sessionStorage.getItem(`${CACHE_SESSION_PREFIX}${kind}:${key}`);
      if (!raw) return null;
      const record = JSON.parse(raw);
      if (!record || Date.now() - Number(record.at || 0) > ttlMs) {
        sessionStorage.removeItem(`${CACHE_SESSION_PREFIX}${kind}:${key}`);
        return null;
      }
      return record.value;
    } catch (_) {
      return null;
    }
  }

  function sessionCacheWrite(kind, key, value) {
    try {
      sessionStorage.setItem(
        `${CACHE_SESSION_PREFIX}${kind}:${key}`,
        JSON.stringify({ at: Date.now(), value }),
      );
    } catch (_) {
      /* storage quota or privacy mode: memory/IDB still work */
    }
  }

  const MIXIN_KEY_ENC_TAB = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
    26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
    20, 34, 44, 52,
  ];

  const TYPE_LABEL = {
    video: "单个视频",
    selection: "视频选集",
    user: "个人主页",
    favorite: "收藏夹",
    collection: "合集",
    search: "搜索页",
    unknown: "未知页面",
  };

  /** 可手动切换的模式（auto 走识别；其余强制类型） */
  const MODE_OPTIONS = [
    "auto",
    "video",
    "selection",
    "user",
    "favorite",
    "collection",
    "search",
  ];


  // ─── MD5 ────────────────────────────────────────────────────────────────
  function md5(str) {
    function cmn(q, a, b, x, s, t) {
      a = (a + q + x + t) | 0;
      return (((a << s) | (a >>> (32 - s))) + b) | 0;
    }
    function ff(a, b, c, d, x, s, t) {
      return cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function gg(a, b, c, d, x, s, t) {
      return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function hh(a, b, c, d, x, s, t) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a, b, c, d, x, s, t) {
      return cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function toUtf8Bytes(input) {
      const s = unescape(encodeURIComponent(input));
      const out = new Array(s.length);
      for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
      return out;
    }
    function bytesToWords(bytes) {
      const words = [];
      for (let i = 0; i < bytes.length; i++) {
        words[i >> 2] |= bytes[i] << ((i % 4) * 8);
      }
      return words;
    }
    function wordsToHex(words) {
      const hex = "0123456789abcdef";
      let out = "";
      for (let i = 0; i < words.length * 4; i++) {
        out +=
          hex.charAt((words[i >> 2] >> ((i % 4) * 8 + 4)) & 0x0f) +
          hex.charAt((words[i >> 2] >> ((i % 4) * 8)) & 0x0f);
      }
      return out;
    }
    const bytes = toUtf8Bytes(str);
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const words = bytesToWords(bytes);
    words.push(bitLen >>> 0);
    words.push(Math.floor(bitLen / 0x100000000));
    let a0 = 0x67452301,
      b0 = 0xefcdab89,
      c0 = 0x98badcfe,
      d0 = 0x10325476;
    for (let i = 0; i < words.length; i += 16) {
      let a = a0,
        b = b0,
        c = c0,
        d = d0;
      const w = words.slice(i, i + 16);
      while (w.length < 16) w.push(0);
      a = ff(a, b, c, d, w[0], 7, 0xd76aa478);
      d = ff(d, a, b, c, w[1], 12, 0xe8c7b756);
      c = ff(c, d, a, b, w[2], 17, 0x242070db);
      b = ff(b, c, d, a, w[3], 22, 0xc1bdceee);
      a = ff(a, b, c, d, w[4], 7, 0xf57c0faf);
      d = ff(d, a, b, c, w[5], 12, 0x4787c62a);
      c = ff(c, d, a, b, w[6], 17, 0xa8304613);
      b = ff(b, c, d, a, w[7], 22, 0xfd469501);
      a = ff(a, b, c, d, w[8], 7, 0x698098d8);
      d = ff(d, a, b, c, w[9], 12, 0x8b44f7af);
      c = ff(c, d, a, b, w[10], 17, 0xffff5bb1);
      b = ff(b, c, d, a, w[11], 22, 0x895cd7be);
      a = ff(a, b, c, d, w[12], 7, 0x6b901122);
      d = ff(d, a, b, c, w[13], 12, 0xfd987193);
      c = ff(c, d, a, b, w[14], 17, 0xa679438e);
      b = ff(b, c, d, a, w[15], 22, 0x49b40821);
      a = gg(a, b, c, d, w[1], 5, 0xf61e2562);
      d = gg(d, a, b, c, w[6], 9, 0xc040b340);
      c = gg(c, d, a, b, w[11], 14, 0x265e5a51);
      b = gg(b, c, d, a, w[0], 20, 0xe9b6c7aa);
      a = gg(a, b, c, d, w[5], 5, 0xd62f105d);
      d = gg(d, a, b, c, w[10], 9, 0x02441453);
      c = gg(c, d, a, b, w[15], 14, 0xd8a1e681);
      b = gg(b, c, d, a, w[4], 20, 0xe7d3fbc8);
      a = gg(a, b, c, d, w[9], 5, 0x21e1cde6);
      d = gg(d, a, b, c, w[14], 9, 0xc33707d6);
      c = gg(c, d, a, b, w[3], 14, 0xf4d50d87);
      b = gg(b, c, d, a, w[8], 20, 0x455a14ed);
      a = gg(a, b, c, d, w[13], 5, 0xa9e3e905);
      d = gg(d, a, b, c, w[2], 9, 0xfcefa3f8);
      c = gg(c, d, a, b, w[7], 14, 0x676f02d9);
      b = gg(b, c, d, a, w[12], 20, 0x8d2a4c8a);
      a = hh(a, b, c, d, w[5], 4, 0xfffa3942);
      d = hh(d, a, b, c, w[8], 11, 0x8771f681);
      c = hh(c, d, a, b, w[11], 16, 0x6d9d6122);
      b = hh(b, c, d, a, w[14], 23, 0xfde5380c);
      a = hh(a, b, c, d, w[1], 4, 0xa4beea44);
      d = hh(d, a, b, c, w[4], 11, 0x4bdecfa9);
      c = hh(c, d, a, b, w[7], 16, 0xf6bb4b60);
      b = hh(b, c, d, a, w[10], 23, 0xbebfbc70);
      a = hh(a, b, c, d, w[13], 4, 0x289b7ec6);
      d = hh(d, a, b, c, w[0], 11, 0xeaa127fa);
      c = hh(c, d, a, b, w[3], 16, 0xd4ef3085);
      b = hh(b, c, d, a, w[6], 23, 0x04881d05);
      a = hh(a, b, c, d, w[9], 4, 0xd9d4d039);
      d = hh(d, a, b, c, w[12], 11, 0xe6db99e5);
      c = hh(c, d, a, b, w[15], 16, 0x1fa27cf8);
      b = hh(b, c, d, a, w[2], 23, 0xc4ac5665);
      a = ii(a, b, c, d, w[0], 6, 0xf4292244);
      d = ii(d, a, b, c, w[7], 10, 0x432aff97);
      c = ii(c, d, a, b, w[14], 15, 0xab9423a7);
      b = ii(b, c, d, a, w[5], 21, 0xfc93a039);
      a = ii(a, b, c, d, w[12], 6, 0x655b59c3);
      d = ii(d, a, b, c, w[3], 10, 0x8f0ccc92);
      c = ii(c, d, a, b, w[10], 15, 0xffeff47d);
      b = ii(b, c, d, a, w[1], 21, 0x85845dd1);
      a = ii(a, b, c, d, w[8], 6, 0x6fa87e4f);
      d = ii(d, a, b, c, w[15], 10, 0xfe2ce6e0);
      c = ii(c, d, a, b, w[6], 15, 0xa3014314);
      b = ii(b, c, d, a, w[13], 21, 0x4e0811a1);
      a = ii(a, b, c, d, w[4], 6, 0xf7537e82);
      d = ii(d, a, b, c, w[11], 10, 0xbd3af235);
      c = ii(c, d, a, b, w[2], 15, 0x2ad7d2bb);
      b = ii(b, c, d, a, w[9], 21, 0xeb86d391);
      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
    }
    return wordsToHex([a0, b0, c0, d0]);
  }

  // ─── pure helpers (offline harness extracts // #region pure-logic) ─────
  // #region pure-logic
  function keyFromUrl(url) {
    let name = String(url || "").split("/").pop() || "";
    if (name.includes(".")) name = name.split(".").slice(0, -1).join(".");
    return name;
  }

  function mixinKey(imgKey, subKey) {
    let raw = String(imgKey) + String(subKey);
    const maxIdx = Math.max(...MIXIN_KEY_ENC_TAB);
    if (maxIdx >= raw.length) raw = raw.padEnd(maxIdx + 1, "0");
    let out = "";
    for (const i of MIXIN_KEY_ENC_TAB) out += raw[i] || "";
    return out.slice(0, 32);
  }

  function encWbi(params, imgKey, subKey, wts) {
    const data = {};
    for (const [k, v] of Object.entries(params)) data[String(k)] = v;
    data.wts = wts == null ? Math.floor(Date.now() / 1000) : Number(wts);
    const forbidden = new Set(["!", "'", "(", ")", "*"]);
    const parts = [];
    for (const key of Object.keys(data).sort()) {
      const val = String(data[key])
        .split("")
        .filter((c) => !forbidden.has(c))
        .join("");
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
    const query = parts.join("&");
    return `${query}&w_rid=${md5(query + mixinKey(imgKey, subKey))}`;
  }

  function extractAssistantText(piece) {
    if (!piece || typeof piece !== "object") return { content: "", reasoning: "" };
    const content =
      (typeof piece.content === "string" && piece.content) ||
      (typeof piece.text === "string" && piece.text) ||
      "";
    const reasoning =
      (typeof piece.reasoning_content === "string" && piece.reasoning_content) ||
      (typeof piece.reasoning === "string" && piece.reasoning) ||
      "";
    return { content, reasoning };
  }

  function extractFromChoice(choice) {
    if (!choice) return { content: "", reasoning: "" };
    const fromDelta = extractAssistantText(choice.delta);
    const fromMsg = extractAssistantText(choice.message);
    return {
      content: fromDelta.content || fromMsg.content || "",
      reasoning: fromDelta.reasoning || fromMsg.reasoning || "",
    };
  }

  function formatAiDisplay(content, reasoning) {
    const body = String(content || "");
    if (body.trim()) return body;
    // 不把供应商返回的 reasoning / chain-of-thought 暴露到界面。
    return reasoning && String(reasoning).trim() ? "正在分析字幕并组织笔记…" : "";
  }

  function truncateForAi(text, maxChars) {
    const s = String(text || "");
    const lim = maxChars == null ? MAX_SUBTITLE_CHARS : Math.max(4000, Number(maxChars));
    if (s.length <= lim) return { text: s, truncated: false, originalLen: s.length };

    // 比“只保留开头”更稳：保留首尾，并从中段均匀抽取连续窗口。
    const markerBudget = 420;
    const usable = Math.max(3000, lim - markerBudget);
    const headLen = Math.floor(usable * 0.44);
    const tailLen = Math.floor(usable * 0.24);
    const middleBudget = usable - headLen - tailLen;
    const windows = 3;
    const winLen = Math.floor(middleBudget / windows);
    const middleStart = headLen;
    const middleEnd = s.length - tailLen;
    const span = Math.max(1, middleEnd - middleStart - winLen);
    const parts = [s.slice(0, headLen).replace(/[^\n]*$/, "")];
    for (let i = 0; i < windows; i++) {
      const at = middleStart + Math.floor((span * (i + 1)) / (windows + 1));
      let piece = s.slice(at, at + winLen);
      piece = piece.replace(/^[^\n]*\n?/, "").replace(/[^\n]*$/, "");
      parts.push(`\n…[中段采样 ${i + 1}/${windows}]…\n${piece}`);
    }
    parts.push(`\n…[省略 ${s.length - usable} 字；保留结尾]…\n${s.slice(-tailLen).replace(/^[^\n]*\n?/, "")}`);
    return { text: parts.join(""), truncated: true, originalLen: s.length };
  }

  /** Peer scroll pattern: stick when distance-to-bottom < threshold */
  function shouldStickBottom(scrollHeight, scrollTop, clientHeight, threshold) {
    const th = threshold == null ? 48 : threshold;
    return scrollHeight - scrollTop - clientHeight < th;
  }

  /**
   * 流式滚动状态机（纯函数，供离线测试）。
   * 修 0.8.3：距底 <80 自动 stick=true 会把刚上滑的用户拽回。
   *
   * @param {object} s  { stick, userReading, progScroll }
   * @param {object} ev { type: 'wheel-up'|'scroll'|'resume'|'start'|'paint', gap? }
   * @returns {{ stick:boolean, userReading:boolean, allowPaintScroll:boolean }}
   */
  function resolveAiScrollState(s, ev) {
    let stick = !!s.stick;
    let userReading = !!s.userReading;
    const prog = !!s.progScroll;
    const type = (ev && ev.type) || "";
    const gap = ev && typeof ev.gap === "number" ? ev.gap : null;

    if (type === "start" || type === "resume") {
      stick = true;
      userReading = false;
    } else if (type === "wheel-up" || type === "detach") {
      stick = false;
      userReading = true;
    } else if (type === "scroll") {
      if (prog) {
        /* 程序化滚动：状态不变 */
      } else if (gap != null && gap > 24) {
        stick = false;
        userReading = true;
      } else if (gap != null && gap <= 12 && userReading) {
        // 用户自己滚回贴底才恢复
        stick = true;
        userReading = false;
      }
    }

    const allowPaintScroll = stick && !userReading;
    return { stick, userReading, allowPaintScroll };
  }

  /**
   * 在 marked 之前抽出数学公式，避免 `_` `^` `\` 被 Markdown 拆坏。
   * 支持：$$ $$ / \[ \] / \( \) / $ $ / ```math|latex|tex
   * 代码块内公式不抽取；纯数字 $12.5 不当作公式。
   * @returns {{ md: string, maths: Array<{tex:string, display:boolean}> }}
   */
  function prepareMarkdownMath(md) {
    const maths = [];
    let s = String(md || "");

    // ```math / latex / tex → 独立公式
    s = s.replace(/```(?:math|latex|tex)\s*\n([\s\S]*?)```/gi, (_, tex) => {
      const i = maths.length;
      maths.push({ tex: String(tex).trim(), display: true });
      return `\n\n@@BSBMATH${i}@@\n\n`;
    });

    // 保护其余 fenced / inline code
    const codes = [];
    s = s.replace(/```[\s\S]*?```/g, (m) => {
      const i = codes.length;
      codes.push(m);
      return `@@BSBCODE${i}@@`;
    });
    s = s.replace(/`[^`\n]+`/g, (m) => {
      const i = codes.length;
      codes.push(m);
      return `@@BSBCODE${i}@@`;
    });

    // 独立公式 $$...$$
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
      const i = maths.length;
      maths.push({ tex: String(tex).trim(), display: true });
      return `\n\n@@BSBMATH${i}@@\n\n`;
    });
    // \[...\]
    s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => {
      const i = maths.length;
      maths.push({ tex: String(tex).trim(), display: true });
      return `\n\n@@BSBMATH${i}@@\n\n`;
    });
    // \(...\)
    s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => {
      const i = maths.length;
      maths.push({ tex: String(tex).trim(), display: false });
      return `@@BSBMATH${i}@@`;
    });
    // 行内 $...$：手动扫描，避免“价格 $12.5，后文 $x^2$”跨段误配。
    // 无效起始符只消耗自身，让后一个 $ 仍可作为真正公式的起点。
    {
      const input = s;
      let out = "";
      let cursor = 0;
      const escapedAt = (idx) => {
        let slashes = 0;
        for (let j = idx - 1; j >= 0 && input[j] === "\\"; j--) slashes += 1;
        return slashes % 2 === 1;
      };
      while (cursor < input.length) {
        let open = input.indexOf("$", cursor);
        while (open >= 0 && escapedAt(open)) open = input.indexOf("$", open + 1);
        if (open < 0) {
          out += input.slice(cursor);
          break;
        }
        out += input.slice(cursor, open);
        let close = input.indexOf("$", open + 1);
        while (close >= 0 && escapedAt(close)) close = input.indexOf("$", close + 1);
        if (close < 0) {
          out += input.slice(open);
          break;
        }
        const raw = input.slice(open + 1, close);
        const t = raw.trim();
        const hasBoundarySpace = raw !== t;
        const pureNumber = /^[\d,]+(?:\.\d+)?$/.test(t);
        const mathSignal = /[A-Za-z\\_^{}=+*/<>|]|[α-ωΑ-Ω]/.test(t);
        const valid = !!t && !hasBoundarySpace && !pureNumber && mathSignal;
        if (!valid) {
          out += "$";
          cursor = open + 1;
          continue;
        }
        const i = maths.length;
        maths.push({ tex: t, display: false });
        out += `@@BSBMATH${i}@@`;
        cursor = close + 1;
      }
      s = out;
    }

    s = s.replace(/@@BSBCODE(\d+)@@/g, (_, id) => {
      const i = Number(id);
      return codes[i] != null ? codes[i] : "";
    });

    return { md: s, maths };
  }

  /**
   * 把 @@BSBMATHn@@ 换成 KaTeX HTML（或 fallback）。
   * renderToString(tex, display) 可选；失败则转义原文。
   */
  function replaceMathPlaceholders(html, maths, renderToString) {
    return String(html || "").replace(/@@BSBMATH(\d+)@@/g, (full, id) => {
      const m = maths[Number(id)];
      if (!m) return full;
      if (typeof renderToString === "function") {
        try {
          const out = renderToString(m.tex, !!m.display);
          if (out != null && out !== "") return out;
        } catch (_) {
          /* fall through */
        }
      }
      const esc = String(m.tex)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      return m.display
        ? `<pre class="bsb-math-fallback">${esc}</pre>`
        : `<code class="bsb-math-fallback">${esc}</code>`;
    });
  }

  function parseSseDataLine(line) {
    const t = String(line || "").trim();
    if (!t || t.startsWith(":")) return { kind: "skip" };
    if (!t.startsWith("data:")) return { kind: "skip" };
    const data = t.slice(5).trim();
    if (!data) return { kind: "skip" };
    if (data === "[DONE]") return { kind: "done" };
    try {
      const j = JSON.parse(data);
      if (j.error) {
        return {
          kind: "error",
          message: j.error.message || JSON.stringify(j.error),
        };
      }
      const choice = j.choices && j.choices[0];
      const piece = extractFromChoice(choice);
      return {
        kind: "delta",
        ...piece,
        finishReason: String(choice?.finish_reason || ""),
        usage: j.usage || null,
      };
    } catch (_) {
      return { kind: "skip" };
    }
  }
  // #endregion pure-logic

  let wbiCache = { img: null, sub: null, at: 0 };

  async function getWbiKeys() {
    const now = Date.now();
    if (wbiCache.img && now - wbiCache.at < WBI_TTL_MS) {
      return [wbiCache.img, wbiCache.sub];
    }
    const nav = await httpJson("https://api.bilibili.com/x/web-interface/nav");
    const wbi = (nav && nav.data && nav.data.wbi_img) || {};
    const imgUrl = wbi.img_url || "";
    const subUrl = wbi.sub_url || "";
    if (!imgUrl || !subUrl) throw new Error("failed to get wbi keys from /nav");
    const img = keyFromUrl(imgUrl);
    const sub = keyFromUrl(subUrl);
    wbiCache = { img, sub, at: now };
    return [img, sub];
  }

  // ─── HTTP ───────────────────────────────────────────────────────────────
  function httpJson(url, extraHeaders) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        anonymous: false,
        timeout: 30000,
        headers: Object.assign(
          {
            Accept: "application/json, text/plain, */*",
            Referer: "https://www.bilibili.com/",
            Origin: "https://www.bilibili.com",
            "User-Agent": UA,
          },
          extraHeaders || {},
        ),
        onload(res) {
          if (res.status < 200 || res.status >= 300) {
            reject(
              new Error(
                `HTTP ${res.status} for ${url}: ${(res.responseText || "").slice(0, 200)}`,
              ),
            );
            return;
          }
          try {
            resolve(JSON.parse(res.responseText));
          } catch (e) {
            reject(
              new Error(
                `invalid JSON from ${url}: ${(res.responseText || "").slice(0, 200)}`,
              ),
            );
          }
        },
        onerror() {
          reject(new Error(`network error for ${url}`));
        },
        ontimeout() {
          reject(new Error(`timeout for ${url}`));
        },
      });
    });
  }

  /**
   * 当前视频快速链路：页面 fetch 优先，避免每次请求跨 userscript bridge。
   * CORS、登录态或 CSP 不允许时再回退 GM_xmlhttpRequest。
   */
  async function requestJsonFast(url, { signal, headers } = {}) {
    let fetchError = null;
    try {
      const fetchFn = pageWindow.fetch || window.fetch;
      const res = await fetchFn.call(pageWindow, url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal,
        headers: Object.assign({ Accept: "application/json, text/plain, */*" }, headers || {}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      fetchError = error;
    }

    if (signal?.aborted) throw new DOMException("操作已取消", "AbortError");
    try {
      return await httpJson(url, headers);
    } catch (gmError) {
      throw gmError || fetchError || new Error(`request failed: ${url}`);
    }
  }

  function formatSubtitleUrl(u) {
    if (!u) return "";
    u = String(u).trim();
    if (!u) return "";
    if (u.startsWith("//")) return "https:" + u;
    if (u.startsWith("http://")) return "https://" + u.slice(7);
    if (!u.startsWith("http")) return "https://" + u.replace(/^\/+/, "");
    return u;
  }

  // ─── util ───────────────────────────────────────────────────────────────
  function extractBvid(text) {
    if (!text) return "";
    text = String(text).trim();
    if (!text) return "";
    if (/^BV[\w]+$/i.test(text)) return "BV" + text.slice(2);
    const m = text.match(/BV[\w]+/i);
    return m ? "BV" + m[0].slice(2) : "";
  }

  function resolveCid(view, page = 1) {
    const pages = view.pages || [];
    if (Array.isArray(pages) && pages.length && page >= 1 && page <= pages.length) {
      const cid = pages[page - 1].cid;
      return cid != null ? Number(cid) : null;
    }
    if (view.cid == null) return null;
    const n = Number(view.cid);
    return Number.isFinite(n) ? n : null;
  }

  function pickTrack(subs) {
    if (!subs || !subs.length) return null;
    for (const s of subs) {
      const lan = String(s.lan || "");
      if (
        lan === "zh-CN" ||
        lan === "ai-zh" ||
        lan.startsWith("zh") ||
        lan.startsWith("ai")
      ) {
        return s;
      }
    }
    return subs[0];
  }

  function isChargeExclusiveBlocked(view) {
    return Boolean(view.is_upower_exclusive && !view.is_upower_play);
  }

  function toCues(body) {
    const out = [];
    (body || []).forEach((c, i) => {
      const fr = Number(c.from) || 0;
      const to = Number(c.to) || 0;
      let index = i + 1;
      if (c.sid != null) {
        const n = Number(c.sid);
        if (Number.isFinite(n)) index = n;
      }
      out.push({
        index,
        from: `${fr.toFixed(2)}s`,
        to: `${to.toFixed(2)}s`,
        from_sec: fr,
        to_sec: to,
        content: String(c.content || ""),
      });
    });
    return out;
  }

  function dedupeCues(cues) {
    const out = [];
    for (const cue of cues || []) {
      const content = String(cue?.content || "").replace(/\s+/g, " ").trim();
      if (!content) continue;
      const normalized = content.toLocaleLowerCase();
      const previous = out[out.length - 1];
      if (previous && previous._normalized === normalized) {
        const previousTo = Number(previous.to_sec ?? parseSeconds(previous.to));
        const currentFrom = Number(cue.from_sec ?? parseSeconds(cue.from));
        if (currentFrom - previousTo <= 1.25) {
          const nextTo = Math.max(previousTo, Number(cue.to_sec ?? parseSeconds(cue.to)));
          previous.to_sec = nextTo;
          previous.to = `${nextTo.toFixed(2)}s`;
          continue;
        }
      }
      out.push({ ...cue, content, _normalized: normalized });
    }
    return out.map(({ _normalized, ...cue }) => cue);
  }

  function parseSeconds(val) {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const s = String(val).trim().replace(/s$/i, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function formatSrtTimestamp(sec) {
    if (sec < 0) sec = 0;
    const totalMs = Math.round(sec * 1000);
    const h = Math.floor(totalMs / 3_600_000);
    const rem = totalMs % 3_600_000;
    const m = Math.floor(rem / 60_000);
    const rem2 = rem % 60_000;
    const s = Math.floor(rem2 / 1000);
    const ms = rem2 % 1000;
    return (
      String(h).padStart(2, "0") +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0") +
      "," +
      String(ms).padStart(3, "0")
    );
  }

  function cuesToSrt(cues) {
    const lines = [];
    let n = 0;
    for (const c of cues) {
      const text = String(c.content || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
      if (!text) continue;
      n += 1;
      const fr = c.from_sec != null ? c.from_sec : c.from;
      const to = c.to_sec != null ? c.to_sec : c.to;
      lines.push(String(n));
      lines.push(
        `${formatSrtTimestamp(parseSeconds(fr))} --> ${formatSrtTimestamp(parseSeconds(to))}`,
      );
      lines.push(text);
      lines.push("");
    }
    return lines.join("\n");
  }

  function cuesToTxt(cues) {
    return cues
      .map((c) => String(c.content || "").trim())
      .filter(Boolean)
      .join("\n");
  }

  function formatClock(sec) {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0
      ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function cuesToAiText(cues, bvid, page) {
    const rows = [];
    let previous = "";
    for (const cue of cues || []) {
      const content = String(cue.content || "").replace(/\s+/g, " ").trim();
      if (!content || content === previous) continue;
      previous = content;
      const sec = cue.from_sec != null ? cue.from_sec : parseSeconds(cue.from);
      rows.push(`[${bvid || "BV"} P${Math.max(1, Number(page) || 1)} ${formatClock(sec)}] ${content}`);
    }
    return rows.join("\n");
  }

  function stripHtml(s) {
    return String(s || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function safeFilename(name) {
    return (
      String(name || "subtitle")
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120) || "subtitle"
    );
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1500);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ─── page context detection ─────────────────────────────────────────────
  /**
   * 自动识别。约定：
   * - 视频页默认 type=video（单个视频），不因多分P自动变 selection
   * - /list + sid → collection；/list/ml → favorite
   * - 合集列表页（space lists / collectiondetail）→ collection
   * - 返回字段可被「手动模式」复用（mid/sid/bvid…）
   */
  function detectContext(href) {
    let u;
    try {
      u = new URL(href || location.href);
    } catch (_) {
      return { type: "unknown", source: "auto" };
    }
    const host = u.hostname.toLowerCase();
    const path = u.pathname;
    const hints = extractPageHints(u);

    // search
    if (/^search\.bilibili\.com$/i.test(host)) {
      if (/^\/(all|video)\/?$/i.test(path)) {
        const keyword =
          (u.searchParams.get("keyword") || "").trim() || hints.keyword;
        if (keyword) {
          const allowed = new Set([
            "totalrank",
            "click",
            "pubdate",
            "dm",
            "stow",
            "scores",
          ]);
          const order = (u.searchParams.get("order") || "totalrank")
            .trim()
            .toLowerCase();
          const page = Math.max(
            1,
            parseInt(u.searchParams.get("page") || "1", 10) || 1,
          );
          return {
            type: "search",
            source: "auto",
            keyword,
            order: allowed.has(order) ? order : "totalrank",
            page,
          };
        }
      }
      return { type: "unknown", source: "auto" };
    }

    // space
    if (/^space\.bilibili\.com$/i.test(host)) {
      let m = path.match(/^\/(\d+)\/lists\/(\d+)\/?$/i);
      if (m) {
        return {
          type: "collection",
          source: "auto",
          mid: m[1],
          season_id: m[2],
        };
      }
      m = path.match(/^\/(\d+)\/channel\/collectiondetail\/?$/i);
      if (m) {
        const sid =
          u.searchParams.get("sid") ||
          u.searchParams.get("season_id") ||
          hints.season_id;
        if (sid && /^\d+$/.test(sid)) {
          return {
            type: "collection",
            source: "auto",
            mid: m[1],
            season_id: String(sid),
          };
        }
      }
      // series / seasons 列表入口
      m = path.match(/^\/(\d+)\/channel\/seriesdetail\/?$/i);
      if (m) {
        const sid =
          u.searchParams.get("sid") ||
          u.searchParams.get("season_id") ||
          hints.season_id;
        if (sid && /^\d+$/.test(sid)) {
          return {
            type: "collection",
            source: "auto",
            mid: m[1],
            season_id: String(sid),
          };
        }
      }
      const fid = (u.searchParams.get("fid") || hints.media_id || "").trim();
      if (fid && /^\d+$/.test(fid) && /\/favlist\/?$/i.test(path)) {
        return { type: "favorite", source: "auto", media_id: fid };
      }
      m = path.match(/^\/(\d+)/);
      if (m) {
        const segs = path.split("/").filter(Boolean);
        const mid = m[1];
        if (
          segs.length === 1 ||
          (segs.length === 2 && /^(video|upload|dynamic|favlist)?$/i.test(segs[1])) ||
          (segs.length === 3 && segs[1] === "upload" && segs[2] === "video")
        ) {
          // favlist without fid still unknown for fav; treat as user
          if (segs[1] && /^favlist$/i.test(segs[1]) && !fid) {
            return { type: "user", source: "auto", mid, note: "favlist_no_fid" };
          }
          return { type: "user", source: "auto", mid };
        }
        // other space tabs: still expose mid for manual switch
        return {
          type: "user",
          source: "auto",
          mid,
          note: "space_tab",
          bvid: hints.bvid || undefined,
        };
      }
      return { type: "unknown", source: "auto", ...pickHintIds(hints) };
    }

    // www.bilibili.com
    if (/^(www\.)?bilibili\.com$/i.test(host)) {
      let m = path.match(/^\/medialist\/(?:detail|play)\/ml(\d+)\/?$/i);
      if (m) return { type: "favorite", source: "auto", media_id: m[1] };

      // /list/ml{id} 收藏夹播放/详情
      m = path.match(/^\/list\/ml(\d+)\/?/i);
      if (m) return { type: "favorite", source: "auto", media_id: m[1] };

      // /list/{mid}?sid= 合集播放页（常见误判为单视频）
      m = path.match(/^\/list\/(\d+)\/?/i);
      if (m) {
        const mid = m[1];
        const sid =
          u.searchParams.get("sid") ||
          u.searchParams.get("season_id") ||
          hints.season_id;
        const bvid =
          extractBvid(href) ||
          extractBvid(u.searchParams.get("bvid") || "") ||
          hints.bvid;
        if (sid && /^\d+$/.test(String(sid))) {
          return {
            type: "collection",
            source: "auto",
            mid,
            season_id: String(sid),
            bvid: bvid || undefined,
            page: Math.max(1, parseInt(u.searchParams.get("p") || "1", 10) || 1),
          };
        }
        // 无 sid 时：若有 BV 默认单视频，但带 mid 便于手动切合集
        if (bvid) {
          return {
            type: "video",
            source: "auto",
            bvid,
            mid,
            page: Math.max(1, parseInt(u.searchParams.get("p") || "1", 10) || 1),
            note: "list_without_sid",
          };
        }
        return { type: "user", source: "auto", mid, note: "list_mid_only" };
      }

      m = path.match(/^\/(?:fav|list)\/(?:ml)?(\d+)\/?$/i);
      if (m && !path.startsWith("/list/")) {
        return { type: "favorite", source: "auto", media_id: m[1] };
      }
      if (/^\/favlist\/?$/i.test(path)) {
        const fid = (u.searchParams.get("fid") || hints.media_id || "").trim();
        if (fid && /^\d+$/.test(fid)) {
          return { type: "favorite", source: "auto", media_id: fid };
        }
      }

      // 普通视频页：默认「单个视频」（不自动变选集）
      const bvid =
        extractBvid(path) || extractBvid(href) || hints.bvid;
      if (bvid && (/\/video\//i.test(path) || hints.fromVideoPath)) {
        const p = Math.max(1, parseInt(u.searchParams.get("p") || "1", 10) || 1);
        const ctx = {
          type: "video",
          source: "auto",
          bvid,
          page: p,
        };
        // 若页内能挖到合集信息，挂上供手动切换
        if (hints.mid && hints.season_id) {
          ctx.mid = hints.mid;
          ctx.season_id = hints.season_id;
          ctx.note = "video_has_ugc_season";
        }
        return ctx;
      }

      // 其它 list 形态
      if (/\/list\//i.test(path)) {
        const bvid2 =
          extractBvid(href) ||
          extractBvid(u.searchParams.get("bvid") || "") ||
          hints.bvid;
        if (bvid2) {
          return {
            type: "video",
            source: "auto",
            bvid: bvid2,
            page: Math.max(1, parseInt(u.searchParams.get("p") || "1", 10) || 1),
            mid: hints.mid || undefined,
            season_id: hints.season_id || undefined,
            note: "list_fallback_video",
          };
        }
      }
    }

    // DOM 兜底
    if (hints.bvid) {
      return {
        type: "video",
        source: "auto",
        bvid: hints.bvid,
        page: 1,
        mid: hints.mid || undefined,
        season_id: hints.season_id || undefined,
        note: "dom_bvid",
      };
    }
    return { type: "unknown", source: "auto", ...pickHintIds(hints) };
  }

  function pickHintIds(hints) {
    const o = {};
    if (hints.mid) o.mid = hints.mid;
    if (hints.season_id) o.season_id = hints.season_id;
    if (hints.media_id) o.media_id = hints.media_id;
    if (hints.bvid) o.bvid = hints.bvid;
    if (hints.keyword) o.keyword = hints.keyword;
    return o;
  }

  /** 从 URL / 页面链接尽量挖 mid、season_id、media_id、bvid */
  function extractPageHints(u) {
    const hints = {
      bvid: "",
      mid: "",
      season_id: "",
      media_id: "",
      keyword: "",
      fromVideoPath: false,
    };
    try {
      if (!u) u = new URL(location.href);
    } catch (_) {
      return hints;
    }
    hints.bvid =
      extractBvid(u.href) ||
      extractBvid(u.searchParams.get("bvid") || "") ||
      "";
    hints.keyword = (u.searchParams.get("keyword") || "").trim();
    const sid =
      u.searchParams.get("sid") ||
      u.searchParams.get("season_id") ||
      u.searchParams.get("business_id") ||
      "";
    if (sid && /^\d+$/.test(String(sid))) hints.season_id = String(sid);
    const fid = u.searchParams.get("fid") || "";
    if (fid && /^\d+$/.test(fid)) hints.media_id = fid;
    if (/\/video\//i.test(u.pathname)) hints.fromVideoPath = true;

    // path mid
    let m = u.pathname.match(/space\.bilibili\.com\/(\d+)/i);
    if (!m) m = String(location.href).match(/space\.bilibili\.com\/(\d+)/i);
    if (m) hints.mid = m[1];
    m = u.pathname.match(/^\/list\/(\d+)/i);
    if (m) hints.mid = m[1];
    m = u.pathname.match(/^\/(\d+)(?:\/|$)/);
    if (m && /space\.bilibili\.com/i.test(u.hostname)) hints.mid = m[1];

    // DOM: 合集 / 列表链接
    try {
      const anchors = document.querySelectorAll(
        'a[href*="lists/"], a[href*="collectiondetail"], a[href*="season_id"], a[href*="sid="], a[href*="/list/"]',
      );
      for (const a of anchors) {
        const href = a.getAttribute("href") || a.href || "";
        const lm = href.match(/\/(\d+)\/lists\/(\d+)/);
        if (lm) {
          if (!hints.mid) hints.mid = lm[1];
          if (!hints.season_id) hints.season_id = lm[2];
          break;
        }
        try {
          const au = new URL(href, location.origin);
          const sm =
            au.searchParams.get("sid") || au.searchParams.get("season_id");
          if (sm && /^\d+$/.test(sm)) {
            if (!hints.season_id) hints.season_id = sm;
            const mm = au.pathname.match(/\/(\d+)/);
            if (mm && !hints.mid) hints.mid = mm[1];
          }
          const listMid = au.pathname.match(/\/list\/(\d+)/i);
          if (listMid && !hints.mid) hints.mid = listMid[1];
        } catch (_) {
          /* ignore */
        }
      }
      if (!hints.bvid) {
        const b = extractBvid(
          document.querySelector('meta[itemprop="url"]')?.content || "",
        );
        if (b) hints.bvid = b;
      }
      if (!hints.bvid) {
        const og = document.querySelector('meta[property="og:url"]')?.content;
        if (og) hints.bvid = extractBvid(og);
      }
    } catch (_) {
      /* ignore */
    }
    return hints;
  }

  /**
   * 根据模式选择器 + 自动识别 得到最终扫描上下文。
   * mode=auto → 用 autoCtx；manual → 强制 type，参数从 auto/hints 填。
   */
  function resolveContext() {
    const root = document.getElementById(PANEL_ID);
    const modeSel = root?.querySelector('[data-role="mode"]');
    const mode = (modeSel?.value || state.mode || "auto").trim();
    state.mode = MODE_OPTIONS.includes(mode) ? mode : "auto";

    const auto = detectContext(location.href);
    state.autoCtx = auto;

    if (state.mode === "auto") {
      return { ...auto, source: "auto" };
    }

    const type = state.mode;
    const hints = extractPageHints();
    const base = { ...auto, ...pickHintIds(hints), type, source: "manual" };

    if (type === "video" || type === "selection") {
      base.bvid =
        auto.bvid ||
        hints.bvid ||
        extractBvid(location.href) ||
        "";
      base.page =
        auto.page ||
        Math.max(
          1,
          parseInt(new URL(location.href).searchParams.get("p") || "1", 10) || 1,
        );
    }
    if (type === "user") {
      base.mid = auto.mid || hints.mid || "";
    }
    if (type === "collection") {
      base.mid = auto.mid || hints.mid || "";
      base.season_id = auto.season_id || hints.season_id || "";
    }
    if (type === "favorite") {
      base.media_id = auto.media_id || hints.media_id || "";
    }
    if (type === "search") {
      base.keyword = auto.keyword || hints.keyword || "";
      base.order = auto.order || "totalrank";
      base.page = auto.page || 1;
    }
    return base;
  }

  function formatCtxBits(ctx) {
    const bits = [];
    if (ctx.bvid) bits.push(ctx.bvid);
    if (ctx.mid) bits.push(`mid=${ctx.mid}`);
    if (ctx.season_id) bits.push(`season=${ctx.season_id}`);
    if (ctx.media_id) bits.push(`fid=${ctx.media_id}`);
    if (ctx.keyword) bits.push(`「${ctx.keyword}」`);
    if (ctx.order && ctx.type === "search") bits.push(`order=${ctx.order}`);
    if (ctx.page && (ctx.type === "video" || ctx.type === "selection")) {
      bits.push(`p=${ctx.page}`);
    }
    if (ctx.note === "video_has_ugc_season") bits.push("页内含合集信息");
    if (ctx.note === "list_without_sid") bits.push("list页无sid");
    return bits.join(" · ") || location.href.slice(0, 80);
  }

  // ─── subtitle fetch (client.py) ─────────────────────────────────────────
  async function viewDetail(bvid) {
    const [img, sub] = await getWbiKeys();
    const q = encWbi({ bvid, need_elec: 0 }, img, sub);
    return httpJson(
      `https://api.bilibili.com/x/web-interface/wbi/view/detail?${q}`,
    );
  }

  async function playerWbiV2(aid, cid, bvid) {
    const [img, sub] = await getWbiKeys();
    const params = aid ? { aid, cid } : { bvid, cid };
    const q = encWbi(params, img, sub);
    return httpJson(`https://api.bilibili.com/x/player/wbi/v2?${q}`);
  }

  async function dmViewSubs(cid, bvid) {
    const dm = await httpJson(
      `https://api.bilibili.com/x/v2/dm/view?oid=${cid}&type=1&bvid=${bvid}`,
    );
    if (dm.code !== 0) return [];
    return (
      (dm.data && dm.data.subtitle && dm.data.subtitle.subtitles) || []
    ).slice();
  }

  async function aiSubtitleStat(aid, cid) {
    const data = await httpJson(
      `https://api.bilibili.com/x/player/v2/ai/subtitle/search/stat?aid=${aid}&cid=${cid}`,
    );
    if (data.code === 0 && data.data && data.data.subtitle_url) {
      return formatSubtitleUrl(data.data.subtitle_url);
    }
    return "";
  }

  async function collectTracks(aid, cid, bvid) {
    try {
      const player = await playerWbiV2(aid, cid, bvid);
      if (player.code === 0) {
        const subs = (
          (player.data && player.data.subtitle && player.data.subtitle.subtitles) ||
          []
        ).slice();
        if (subs.length) return { subs, source: "player_wbi" };
      }
    } catch (_) {
      /* fallthrough */
    }
    try {
      const subs = await dmViewSubs(cid, bvid);
      if (subs.length) return { subs, source: "dm_view" };
    } catch (_) {
      /* fallthrough */
    }
    return { subs: [], source: "" };
  }

  async function resolveUrl(track, aid, cid, source) {
    const lan = String(track.lan || "");
    let url = formatSubtitleUrl(track.subtitle_url || "");
    if (!url && lan.startsWith("ai-") && aid) {
      try {
        url = await aiSubtitleStat(aid, cid);
        if (url) return { url, source: "ai_stat" };
      } catch (_) {
        /* ignore */
      }
    }
    return { url, source };
  }

  function currentPageNumber() {
    try {
      return Math.max(1, parseInt(new URL(location.href).searchParams.get("p") || "1", 10) || 1);
    } catch (_) {
      return 1;
    }
  }

  function routeVideoKey(bvid, page) {
    return `${String(bvid || "").toUpperCase()}:P${Math.max(1, Number(page) || 1)}`;
  }

  /**
   * 当前播放器视频身份。不要依赖 ctx.type === "video"：B 站合集 /list、收藏夹播放等
   * 页面同样可能承载一个真实的 BV。AI 自动链路只认 BV+P 这个身份键。
   */
  function currentRouteVideoRef() {
    const ctx = detectContext(location.href);
    const bvid = String(ctx?.bvid || extractBvid(location.href) || "").trim();
    if (!bvid) return null;
    const page = Math.max(1, Number(ctx?.page || currentPageNumber()) || 1);
    return { bvid, page, key: routeVideoKey(bvid, page), ctx };
  }

  function currentRouteVideoKey() {
    return currentRouteVideoRef()?.key || "";
  }

  function runtimeVideoView(bvid) {
    const key = String(bvid || "").toUpperCase();
    const candidates = [
      pageWindow.__INITIAL_STATE__?.videoData,
      pageWindow.__INITIAL_STATE__?.videoInfo,
      pageWindow.__INITIAL_STATE__?.epInfo,
    ];
    for (const view of candidates) {
      if (view && String(view.bvid || "").toUpperCase() === key && (view.cid || view.pages?.length)) {
        return view;
      }
    }
    return null;
  }

  function runtimeSubtitleTracks(meta) {
    const roots = [pageWindow.__playinfo__, pageWindow.__PLAYINFO__, pageWindow.__PLAYER_CONFIG__];
    for (let root of roots) {
      if (!root) continue;
      if (typeof root === "string") {
        try { root = JSON.parse(root); } catch (_) { continue; }
      }
      const runtimeCid = Number(root?.data?.cid || root?.cid || pageWindow.__INITIAL_STATE__?.videoData?.cid || 0);
      if (runtimeCid && meta?.cid && runtimeCid !== Number(meta.cid)) continue;
      const candidates = [
        root?.data?.subtitle?.subtitles,
        root?.subtitle?.subtitles,
        root?.data?.data?.subtitle?.subtitles,
      ];
      for (const tracks of candidates) {
        if (!Array.isArray(tracks) || !tracks.length) continue;
        return tracks.map((track) => ({
          ...track,
          subtitle_url: formatSubtitleUrl(track.subtitle_url || ""),
        }));
      }
    }
    return null;
  }

  function openCacheDatabase() {
    if (state.cacheDbPromise) return state.cacheDbPromise;
    state.cacheDbPromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          db.createObjectStore(CACHE_STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("cache database open failed"));
    }).catch((error) => {
      state.cacheDbPromise = null;
      throw error;
    });
    return state.cacheDbPromise;
  }

  async function persistentCacheRead(key) {
    try {
      const db = await openCacheDatabase();
      const record = await new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE_NAME, "readonly");
        const req = tx.objectStore(CACHE_STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      if (!record) return null;
      if (Number(record.expiresAt || 0) < Date.now()) {
        persistentCacheDelete(key).catch(() => {});
        return null;
      }
      return record;
    } catch (_) {
      return null;
    }
  }

  async function persistentCacheWrite(key, value, ttlMs = SUBTITLE_CACHE_TTL_MS) {
    const record = {
      key,
      value,
      updatedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    try {
      const db = await openCacheDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE_NAME, "readwrite");
        tx.objectStore(CACHE_STORE_NAME).put(record);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      state.cacheChannel?.postMessage({ type: "cache-updated", key, updatedAt: record.updatedAt });
    } catch (_) {
      /* private mode / quota: memory cache remains available */
    }
    return record;
  }

  async function persistentCacheDelete(key) {
    try {
      const db = await openCacheDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE_NAME, "readwrite");
        tx.objectStore(CACHE_STORE_NAME).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) { /* ignore */ }
  }

  function initCacheChannel() {
    if (state.cacheChannel || typeof BroadcastChannel === "undefined") return;
    try {
      state.cacheChannel = new BroadcastChannel(CACHE_CHANNEL_NAME);
      state.cacheChannel.addEventListener("message", (event) => {
        const msg = event.data;
        if (!msg || msg.type !== "cache-updated" || !String(msg.key).startsWith("subtitle:")) return;
        const shortKey = String(msg.key).slice("subtitle:".length);
        state.fastSubtitleCache.delete(shortKey);
      });
    } catch (_) { /* optional */ }
  }

  async function fetchVideoViewFast(bvid, signal, { forceNetwork = false } = {}) {
    const key = String(bvid || "").toUpperCase();

    if (!forceNetwork) {
      const runtime = runtimeVideoView(key);
      if (runtime) {
        lruSet(state.fastViewCache, key, runtime);
        sessionCacheWrite("view", key, runtime);
        return { value: runtime, cacheLevel: "L0 页面态" };
      }
      const memory = lruGet(state.fastViewCache, key);
      if (memory) return { value: memory, cacheLevel: "L1 内存" };
      const session = sessionCacheRead("view", key, VIEW_CACHE_TTL_MS);
      if (session) {
        lruSet(state.fastViewCache, key, session);
        return { value: session, cacheLevel: "L2 会话" };
      }
    }

    const payload = await requestJsonFast(
      `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
      { signal },
    );
    if (payload?.code !== 0 || !payload?.data) {
      throw new Error(payload?.message || "视频信息接口返回失败");
    }
    lruSet(state.fastViewCache, key, payload.data);
    sessionCacheWrite("view", key, payload.data);
    return { value: payload.data, cacheLevel: "NET 视频详情" };
  }

  async function fetchSubtitleTracksFast(meta, signal, { forceNetwork = false } = {}) {
    const cacheKey = `${meta.bvid}:${meta.cid}`;
    if (!forceNetwork) {
      const runtime = runtimeSubtitleTracks(meta);
      if (runtime) {
        lruSet(state.fastTrackCache, cacheKey, runtime);
        sessionCacheWrite("tracks", cacheKey, runtime);
        return { tracks: runtime, cacheLevel: "L0 播放器态" };
      }
      const memory = lruGet(state.fastTrackCache, cacheKey);
      if (memory) return { tracks: memory, cacheLevel: "L1 内存" };
      const session = sessionCacheRead("tracks", cacheKey, TRACK_CACHE_TTL_MS);
      if (session) {
        lruSet(state.fastTrackCache, cacheKey, session);
        return { tracks: session, cacheLevel: "L2 会话" };
      }
    }

    const params = new URLSearchParams({ bvid: meta.bvid, cid: String(meta.cid) });
    if (meta.aid) params.set("aid", String(meta.aid));
    const endpoints = [
      `https://api.bilibili.com/x/player/wbi/v2?${params}`,
      `https://api.bilibili.com/x/player/v2?${params}`,
    ];
    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const payload = await requestJsonFast(endpoint, { signal });
        if (payload?.code === 0) {
          const tracks = payload?.data?.subtitle?.subtitles;
          if (Array.isArray(tracks)) {
            const normalized = tracks.map((track) => ({
              ...track,
              subtitle_url: formatSubtitleUrl(track.subtitle_url || ""),
            }));
            lruSet(state.fastTrackCache, cacheKey, normalized);
            sessionCacheWrite("tracks", cacheKey, normalized);
            return { tracks: normalized, cacheLevel: "NET 字幕轨道" };
          }
        }
        lastError = new Error(payload?.message || "字幕轨道接口返回失败");
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        lastError = error;
      }
    }
    throw lastError || new Error("无法取得字幕轨道");
  }

  function preferredTrackIndex(tracks) {
    const chosen = pickTrack(tracks);
    const index = tracks.indexOf(chosen);
    return index >= 0 ? index : 0;
  }

  async function fetchTrackBodyFast(base, tracks, trackIndex, signal, { forceNetwork = false } = {}) {
    const track = tracks[trackIndex];
    if (!track) throw new Error("字幕轨道不存在");
    const langKey = String(track.lan || trackIndex || "default");
    const cacheKey = `${base.bvid}:${base.cid}:${langKey}`;

    if (!forceNetwork) {
      const memory = lruGet(state.fastTrackBodyCache, cacheKey);
      if (memory) return { ...memory, source: "L1 内存字幕", cacheLevel: "L1 内存" };
      const persistent = await persistentCacheRead(`subtitle-track:${cacheKey}`);
      if (persistent?.value) {
        const result = { ...persistent.value, cacheStale: Date.now() - persistent.updatedAt > SUBTITLE_REVALIDATE_MS };
        lruSet(state.fastTrackBodyCache, cacheKey, result);
        return { ...result, source: "L3 持久字幕", cacheLevel: "L3 IndexedDB" };
      }
    }

    const lan = String(track.lan || "");
    let url = formatSubtitleUrl(track.subtitle_url || "");
    if (!url && lan.startsWith("ai-") && base.aid) {
      url = await aiSubtitleStat(base.aid, base.cid);
    }
    if (!url) return { ...base, status: "empty", lan, tracks, activeTrackIndex: trackIndex, source: "NET 无地址" };

    const bodyJson = await requestJsonFast(url, { signal });
    const body = bodyJson && typeof bodyJson === "object" ? bodyJson.body : null;
    if (!Array.isArray(body) || !body.length) {
      return { ...base, status: "empty", lan, tracks, activeTrackIndex: trackIndex, source: "NET 空字幕" };
    }
    const cues = dedupeCues(toCues(body));
    const result = {
      ...base,
      status: "ok",
      cue_count: cues.length,
      lan,
      lan_doc: track.lan_doc || lan,
      data: cues,
      tracks,
      activeTrackIndex: trackIndex,
      source: "NET 直读",
      cacheLevel: "NET",
      cacheStale: false,
    };
    lruSet(state.fastTrackBodyCache, cacheKey, result);
    persistentCacheWrite(`subtitle-track:${cacheKey}`, result).catch(() => {});
    return result;
  }

  async function fetchCurrentSubtitleFast(bvid, page = 1, signal, { forceNetwork = false } = {}) {
    bvid = extractBvid(bvid) || String(bvid || "").trim();
    if (!bvid) throw new Error("empty bvid");

    const viewHit = await fetchVideoViewFast(bvid, signal, { forceNetwork });
    const view = viewHit.value;
    if (isChargeExclusiveBlocked(view)) {
      return { bvid, status: "empty", error: "charge_exclusive_blocked", source: viewHit.cacheLevel };
    }

    const pages = Array.isArray(view.pages) ? view.pages : [];
    const pageNo = Math.max(1, Math.min(Number(page) || 1, Math.max(1, pages.length)));
    const part = pages[pageNo - 1] || null;
    const cid = Number(part?.cid || view.cid) || null;
    const aid = Number(view.aid) || null;
    const title = part?.part && pages.length > 1
      ? `${view.title || bvid} - P${pageNo}【${part.part}】`
      : String(view.title || bvid);
    const author = String(view.owner?.name || "");
    const base = { bvid: view.bvid || bvid, aid, cid, title, author, pages, page: pageNo };
    if (!cid) return { ...base, status: "error", error: "no cid", source: viewHit.cacheLevel };

    const preferredKey = `${base.bvid}:${cid}`;
    if (!forceNetwork) {
      const memory = lruGet(state.fastSubtitleCache, preferredKey);
      if (memory) return { ...memory, source: "L1 内存字幕", cacheLevel: "L1 内存" };
      const persistent = await persistentCacheRead(`subtitle:${preferredKey}`);
      if (persistent?.value) {
        const result = {
          ...persistent.value,
          source: "L3 持久字幕",
          cacheLevel: "L3 IndexedDB",
          cacheStale: Date.now() - persistent.updatedAt > SUBTITLE_REVALIDATE_MS,
        };
        lruSet(state.fastSubtitleCache, preferredKey, result);
        return result;
      }
    }

    const trackHit = await fetchSubtitleTracksFast(base, signal, { forceNetwork });
    const tracks = trackHit.tracks;
    if (!tracks.length) return { ...base, status: "empty", tracks: [], source: trackHit.cacheLevel };
    const activeTrackIndex = preferredTrackIndex(tracks);
    const result = await fetchTrackBodyFast(base, tracks, activeTrackIndex, signal, { forceNetwork });
    const finalResult = {
      ...result,
      cachePath: `${viewHit.cacheLevel} → ${trackHit.cacheLevel} → ${result.cacheLevel || result.source}`,
    };
    if (finalResult.status === "ok") {
      lruSet(state.fastSubtitleCache, preferredKey, finalResult);
      persistentCacheWrite(`subtitle:${preferredKey}`, finalResult).catch(() => {});
    }
    return finalResult;
  }

  async function fetchSubtitle(bvid, page = 1) {
    bvid = extractBvid(bvid) || String(bvid || "").trim();
    if (!bvid) return { bvid: "", status: "error", error: "empty bvid" };

    let detail;
    try {
      detail = await viewDetail(bvid);
    } catch (e) {
      return { bvid, status: "error", error: `view/detail: ${e.message || e}` };
    }
    if (detail.code !== 0) {
      return {
        bvid,
        status: "error",
        error: `view/detail code=${detail.code} ${detail.message || ""}`,
      };
    }

    const view = (detail.data && detail.data.View) || {};
    if (isChargeExclusiveBlocked(view)) {
      return { bvid, status: "empty", error: "charge_exclusive_blocked" };
    }

    let aid = view.aid || 0;
    aid = Number(aid) || null;
    const cid = resolveCid(view, page);
    const title = String(view.title || "");
    const author = String((view.owner && view.owner.name) || "");
    const pages = Array.isArray(view.pages) ? view.pages : [];
    const base = { bvid, aid, cid, title, author, pages, page };

    if (cid == null) return { ...base, status: "error", error: "no cid" };

    const { subs, source: src0 } = await collectTracks(aid, cid, bvid);
    if (!subs.length) return { ...base, status: "empty" };

    const track = pickTrack(subs);
    if (!track) return { ...base, status: "empty" };

    const lan = String(track.lan || "");
    const { url, source } = await resolveUrl(track, aid, cid, src0);
    if (!url) return { ...base, status: "empty", lan };

    let bodyJson;
    try {
      bodyJson = await httpJson(url);
    } catch (e) {
      return {
        ...base,
        status: "error",
        lan,
        error: `subtitle body: ${e.message || e}`,
      };
    }

    const body = bodyJson && typeof bodyJson === "object" ? bodyJson.body : null;
    if (!Array.isArray(body) || !body.length) {
      return { ...base, status: "empty", lan };
    }

    const cues = toCues(body);
    return {
      ...base,
      status: "ok",
      cue_count: cues.length,
      lan,
      data: cues,
      source,
    };
  }

  // ─── list sources ───────────────────────────────────────────────────────
  /** @returns {Promise<{items: Array, hasMore: boolean, meta?: object}>} */
  async function fetchListPage(ctx, page, pageSize) {
    if (ctx.type === "user") {
      const [img, sub] = await getWbiKeys();
      const q = encWbi(
        {
          mid: ctx.mid,
          pn: page,
          ps: pageSize,
          tid: 0,
          keyword: "",
          order: "pubdate",
          web_location: 1550101,
          order_avoided: true,
        },
        img,
        sub,
      );
      const result = await httpJson(
        `https://api.bilibili.com/x/space/wbi/arc/search?${q}`,
        { Referer: `https://space.bilibili.com/${ctx.mid}`, Origin: "https://space.bilibili.com" },
      );
      if (result.code !== 0) {
        throw new Error(result.message || `user list code=${result.code}`);
      }
      const vlist = (result.data && result.data.list && result.data.list.vlist) || [];
      const pageInfo = (result.data && result.data.page) || {};
      const items = vlist.map((v) => ({
        bvid: v.bvid,
        aid: v.aid,
        title: v.title || "",
        author: v.author || "",
        page: 1,
      }));
      const hasMore =
        pageInfo.pn && pageInfo.ps && pageInfo.count != null
          ? pageInfo.pn * pageInfo.ps < pageInfo.count
          : vlist.length >= pageSize;
      return { items, hasMore, meta: { count: pageInfo.count } };
    }

    if (ctx.type === "favorite") {
      const result = await httpJson(
        `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${ctx.media_id}&pn=${page}&ps=${Math.min(pageSize, 20)}&platform=web&t=${Date.now()}`,
        { Referer: "https://space.bilibili.com/", Origin: "https://www.bilibili.com" },
      );
      if (result.code !== 0) {
        throw new Error(result.message || `fav list code=${result.code}`);
      }
      const medias = (result.data && result.data.medias) || [];
      const items = medias
        .filter((v) => v && (v.type === 2 || v.bvid || v.bv_id)) // type 2 = video
        .map((v) => ({
          bvid: v.bvid || v.bv_id || "",
          aid: v.id || v.aid || 0,
          title: v.title || "",
          author: (v.upper && v.upper.name) || v.author || "",
          page: 1,
        }))
        .filter((v) => v.bvid);
      return {
        items,
        hasMore: result.data && result.data.has_more === true,
        meta: { title: (result.data && result.data.info && result.data.info.title) || "" },
      };
    }

    if (ctx.type === "collection") {
      const result = await httpJson(
        `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=${ctx.mid}&season_id=${ctx.season_id}&sort_reverse=false&page_num=${page}&page_size=${pageSize}&web_location=333.1387`,
        {
          Referer: `https://space.bilibili.com/${ctx.mid}/channel/collectiondetail?sid=${ctx.season_id}`,
          Origin: "https://space.bilibili.com",
        },
      );
      if (result.code !== 0) {
        throw new Error(result.message || `collection code=${result.code}`);
      }
      const archives = (result.data && result.data.archives) || [];
      const pageInfo = (result.data && result.data.page) || {};
      const items = archives.map((v) => ({
        bvid: v.bvid,
        aid: v.aid,
        title: v.title || "",
        author: "",
        page: 1,
      }));
      let hasMore = false;
      if (pageInfo.total != null) {
        hasMore = page * pageSize < pageInfo.total;
      } else {
        hasMore = archives.length >= pageSize;
      }
      return {
        items,
        hasMore,
        meta: {
          total: pageInfo.total,
          name:
            (result.data && result.data.meta && result.data.meta.name) ||
            (result.data && result.data.meta && result.data.meta.title) ||
            "",
        },
      };
    }

    if (ctx.type === "search") {
      const [img, sub] = await getWbiKeys();
      const q = encWbi(
        {
          search_type: "video",
          keyword: ctx.keyword,
          order: ctx.order || "totalrank",
          page,
          page_size: 42,
        },
        img,
        sub,
      );
      const result = await httpJson(
        `https://api.bilibili.com/x/web-interface/wbi/search/type?${q}`,
        { Referer: "https://search.bilibili.com/", Origin: "https://search.bilibili.com" },
      );
      if (result.code !== 0) {
        throw new Error(result.message || `search code=${result.code}`);
      }
      const rows = (result.data && result.data.result) || [];
      const items = rows
        .map((v) => ({
          bvid: v.bvid || extractBvid(v.arcurl || ""),
          aid: v.aid || v.id || 0,
          title: stripHtml(v.title) || "未知标题",
          author: stripHtml(v.author || v.up_name) || "",
          page: 1,
        }))
        .filter((v) => v.bvid);
      const numPages = (result.data && result.data.numPages) || 0;
      const hasMore = numPages ? page < numPages : items.length >= 42;
      return {
        items,
        hasMore,
        meta: {
          numResults: (result.data && result.data.numResults) || 0,
          keyword: ctx.keyword,
        },
      };
    }

    throw new Error(`unsupported list type: ${ctx.type}`);
  }

  async function loadAllListItems(ctx, { maxPages, pageSize, onProgress, delayMs, shouldCancel }) {
    const all = [];
    const seen = new Set();
    const canceled = () => typeof shouldCancel === "function" && shouldCancel();
    const throwIfCanceled = () => {
      if (!canceled()) return;
      const error = new Error("扫描已取消");
      error.name = "AbortError";
      throw error;
    };
    let page = 1;
    let hasMore = true;
    let meta = {};
    while (hasMore && page <= maxPages) {
      throwIfCanceled();
      if (onProgress) onProgress(`拉取列表 ${page}/${maxPages}…（已 ${all.length}）`);
      const res = await fetchListPage(ctx, page, pageSize);
      throwIfCanceled();
      meta = Object.assign(meta, res.meta || {});
      for (const it of res.items) {
        const key = it.bvid + "#" + (it.page || 1);
        if (!it.bvid || seen.has(key)) continue;
        seen.add(key);
        all.push(it);
      }
      hasMore = res.hasMore;
      if (!hasMore) break;
      page += 1;
      if (hasMore && page <= maxPages) {
        await sleep(delayMs || 300);
        throwIfCanceled();
      }
    }
    return { items: all, meta, pagesFetched: Math.min(page, maxPages), truncated: hasMore };
  }

  async function loadVideoAsItems(bvid, expandAllParts) {
    // page=1 仅用于拿 View/pages 元信息；字幕在批量阶段再按 page 拉
    const r = await fetchSubtitle(bvid, 1);
    if (r.status === "error" && !r.pages?.length && !r.title) {
      throw new Error(r.error || "无法获取视频信息");
    }
    const pages = r.pages || [];
    if (expandAllParts && pages.length > 1) {
      return {
        items: pages.map((p, i) => ({
          bvid: r.bvid || bvid,
          aid: r.aid,
          title: `${r.title || bvid} - P${i + 1}【${p.part || ""}】`,
          author: r.author || "",
          page: i + 1,
          part: p.part || "",
        })),
        meta: { title: r.title, author: r.author, multip: true },
        pages,
      };
    }
    if (expandAllParts && pages.length <= 1) {
      return {
        items: [
          {
            bvid: r.bvid || bvid,
            aid: r.aid,
            title: r.title || bvid,
            author: r.author || "",
            page: 1,
          },
        ],
        meta: {
          title: r.title,
          author: r.author,
          multip: false,
          hint: "该稿只有 1P，已按单视频处理",
        },
        pages,
      };
    }
    return {
      items: [
        {
          bvid: r.bvid || bvid,
          aid: r.aid,
          title: r.title || bvid,
          author: r.author || "",
          page: 1,
        },
      ],
      meta: { title: r.title, author: r.author, multip: pages.length > 1 },
      pages,
    };
  }

  // ─── state ──────────────────────────────────────────────────────────────
  const state = {
    open: false,
    // busy 仅作旧状态栏兼容；真实互斥由 scanBusy / batchBusy 分别管理。
    busy: false,
    scanBusy: false,
    batchBusy: false,
    scanSeq: 0,
    batchSeq: 0,
    cancel: false, // legacy bridge
    cancelScan: false,
    cancelBatch: false,
    pendingRescan: false,
    pendingAiSend: false,
    mode: "auto", // auto | video | selection | user | favorite | collection | search
    autoCtx: null,
    ctx: null,
    items: [], // { bvid, title, author, page, selected, status?, cues?, error? }
    meta: {},
    delayMs: DEFAULT_DELAY_MS,
    maxPages: DEFAULT_MAX_PAGES,
    ui: null, // geometry + dock
    aiFocus: false, // AI 专注阅读：铺满视口并隐藏非阅读控件
    ai: null, // active/legacy-compatible config
    aiProfiles: [], // persisted model configurations
    promptProfiles: [], // user-editable prompt templates (preprocess + postprocess)
    activePromptId: "", // active postprocess prompt
    activePrePromptId: "", // active preprocess prompt
    activeKnowledgePromptId: "", // Knowledge Drill-down prompt
    preprocessEnabled: loadPreprocessEnabledSetting(),
    preprocessModelId: String(storageGet(PREPROCESS_MODEL_STORE_KEY, "") || ""),
    preprocessConcurrency: loadBoundedNumberSetting(PREPROCESS_CONCURRENCY_STORE_KEY, PREPROCESS_DEFAULT_CONCURRENCY, 1, 8),
    preprocessTargetMinutes: loadBoundedNumberSetting(PREPROCESS_TARGET_MINUTES_STORE_KEY, PREPROCESS_DEFAULT_TARGET_MINUTES, 2, 30),
    preprocessOverlapSeconds: loadBoundedNumberSetting(PREPROCESS_OVERLAP_SECONDS_STORE_KEY, PREPROCESS_DEFAULT_OVERLAP_SECONDS, 0, 120),
    preprocessMaxChars: loadBoundedNumberSetting(PREPROCESS_MAX_CHARS_STORE_KEY, PREPROCESS_DEFAULT_MAX_CHARS, 8000, 60000),
    preprocessRetries: loadBoundedNumberSetting(PREPROCESS_RETRIES_STORE_KEY, PREPROCESS_DEFAULT_RETRIES, 0, 4),
    preprocessRun: null, // shared subtitle normalization stage for current session
    forcePreprocessOnce: false,
    aiViewingPreprocess: false, // legacy bridge; v5.8 input preview lives in drawer
    postTasks: [], // output artifacts: each POST Prompt + selected LLMs
    aiActiveTaskId: "", // first-level result navigation: output artifact
    aiDrawer: "", // "flow" | "input" | ""
    aiInputView: "raw", // raw | processed
    promptEditorId: "", // settings master-detail current prompt editor
    aiEditorId: "", // settings master-detail current LLM editor
    promptSearch: "",
    aiSearch: "",
    aiRuns: new Map(), // current analysis session: runId -> independent runtime/result
    aiRunOrder: [],
    aiActiveRunId: "",
    aiSessionSeq: 0,
    // 当前批次已经组装好的共享输入。单模型/全部重新生成直接复用，不重新抓字幕。
    aiSessionInput: null,
    aiBusy: false, // true while any model run is active
    aiAbort: false, // stop-all / subtitle preparation flag
    aiRaw: "", // active result markdown buffer (legacy rendering bridge)
    aiXhr: null, // legacy field; model requests use per-run handles
    aiAbortController: null, // legacy field; model requests use per-run handles
    aiStickBottom: true, // 仅「跟随模式」时 paint 才改 scrollTop
    aiUserReading: false, // 用户主动离开底部后锁住，禁止自动回粘
    aiProgScroll: false, // 程序化滚动中，忽略 scroll 事件回写
    aiPaintRaf: 0,
    aiPaintTimer: 0,
    aiPendingText: "",
    aiRenderedText: "",
    aiStreamTextNode: null,
    renderEpoch: 0,
    renderLibs: { core: false, highlight: false, mermaid: false, katex: false },
    mermaidObserver: null,
    mermaidRenderSeq: 0,
    mermaidQueue: Promise.resolve(),
    mermaidRepairing: false,
    aiSourceBvids: [],
    autoCaptureEnabled: loadAutoCaptureSetting(),
    autoCaptureKey: "",
    autoCaptureEpoch: 0,
    autoCaptureTimer: 0,
    autoCaptureAbortController: null,
    autoAnalyzeEnabled: loadAutoAnalyzeSetting(),
    autoAnalyzeKey: "",
    autoAnalyzePendingKey: "",
    autoAnalyzeTimer: 0,
    fastViewCache: new Map(),
    fastTrackCache: new Map(),
    fastSubtitleCache: new Map(),
    fastTrackBodyCache: new Map(),
    cacheDbPromise: null,
    cacheChannel: null,
    transcriptItemKey: "",
    transcriptItem: null, // 当前阅读字幕独立于扫描列表，扫描合集时不会被覆盖
    transcriptQuery: "",
    transcriptFilteredIndexes: null,
    transcriptActiveCueIndex: -1,
    transcriptTrackIndex: -1,
    transcriptAutoFollow: loadTranscriptFollowSetting(),
    autoEnablePlayerSubtitle: loadPlayerSubtitleSetting(),
    playerSubtitleOperation: null,
    transcriptUserScrollUntil: 0,
    transcriptVideoAbort: null,
    transcriptSwitchAbort: null,
    transcriptRenderEpoch: 0,
    libraryQuery: "",
    libraryFilter: "all", // all | ok | wait | error | empty
    captureDrawerOpen: false,
    knowledgeDbPromise: null,
    knowledgeAnchors: [],
    knowledgeNodes: [],
    knowledgeSearch: "",
    knowledgeActiveAnchorId: "",
    knowledgeActiveNodeId: "",
    knowledgeRailOpen: false,
    knowledgeTreeOpen: false,
    knowledgeSelection: null,
    knowledgeBusy: false,
    knowledgeRuntime: null,
    knowledgePaintRaf: 0,
    knowledgeModelId: String(storageGet(KNOWLEDGE_MODEL_STORE_KEY, "") || ""),
    shortcutConfig: loadShortcutSettings(),
    shortcutRecordingId: "",
  };

  // ─── UI geometry persistence ────────────────────────────────────────────
  function isPanelSizePreset(value) {
    return Object.prototype.hasOwnProperty.call(PANEL_SIZE_PRESETS, value);
  }

  function panelPresetWidth(name, viewportWidth = window.innerWidth) {
    const preset = PANEL_SIZE_PRESETS[name] || PANEL_SIZE_PRESETS[DEFAULT_PANEL_SIZE];
    const desired = Math.round(Number(viewportWidth || 0) * preset.viewportRatio);
    const available = Math.max(MIN_W, Number(viewportWidth || 0) - 16);
    return Math.min(available, Math.max(preset.min, Math.min(preset.max, desired)));
  }

  function highPanelHeight(viewportHeight = window.innerHeight) {
    const available = Math.max(MIN_H, Number(viewportHeight || 0) - 16);
    return Math.min(available, Math.max(MIN_H, Math.round(Number(viewportHeight || 0) * 0.9)));
  }

  function panelSizeClassFromWidth(width, viewportWidth = window.innerWidth) {
    const value = Number(width) || panelPresetWidth(DEFAULT_PANEL_SIZE, viewportWidth);
    const candidates = Object.keys(PANEL_SIZE_PRESETS).map((name) => ({
      name,
      distance: Math.abs(value - panelPresetWidth(name, viewportWidth)),
    }));
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0]?.name || DEFAULT_PANEL_SIZE;
  }

  function defaultUiGeom() {
    const sizePreset = DEFAULT_PANEL_SIZE;
    const w = panelPresetWidth(sizePreset);
    const h = highPanelHeight();
    return {
      x: Math.max(8, window.innerWidth - w - 16),
      y: Math.max(8, Math.floor((window.innerHeight - h) / 2)),
      w,
      h,
      sizePreset,
      heightMode: "high", // high：随视口保持约 90vh；手动上下拖动后变 custom
      dock: null, // null | 'left' | 'right'
      dockExpanded: false,
      view: "ai", // ai | subs | knowledge | settings
      aiStage: "preprocess", // preprocess | postprocess
      settingsTab: "prompt", // prompt | llm | shortcuts
      promptStage: "preprocess", // preprocess | postprocess | knowledge
      noteFont: 17,
    };
  }

  function loadUiGeom() {
    try {
      const raw = localStorage.getItem(UI_STORE_KEY);
      if (!raw) return defaultUiGeom();
      const o = JSON.parse(raw);
      const d = defaultUiGeom();
      // v5.3.2 以前没有档位字段：首次升级统一迁移到“中 + 高”，不继承旧的 560×820 上限。
      const hasPreset = isPanelSizePreset(o.sizePreset) || o.sizePreset === "custom";
      const sizePreset = hasPreset ? o.sizePreset : DEFAULT_PANEL_SIZE;
      const heightMode = hasPreset && o.heightMode === "custom" ? "custom" : "high";
      const w = isPanelSizePreset(sizePreset)
        ? panelPresetWidth(sizePreset)
        : Math.max(MIN_W, Number(o.w) || d.w);
      const h = heightMode === "high"
        ? highPanelHeight()
        : Math.max(MIN_H, Number(o.h) || d.h);
      return {
        x: Number.isFinite(o.x) ? o.x : d.x,
        y: Number.isFinite(o.y) ? o.y : d.y,
        w,
        h,
        sizePreset,
        heightMode,
        dock: o.dock === "left" || o.dock === "right" ? o.dock : null,
        dockExpanded: false,
        view: ["ai", "subs", "knowledge", "settings"].includes(o.view) ? o.view : "ai",
        aiStage: ["preprocess", "postprocess"].includes(o.aiStage) ? o.aiStage : "preprocess",
        settingsTab: ["prompt", "llm", "shortcuts"].includes(o.settingsTab) ? o.settingsTab : "prompt",
        promptStage: ["preprocess", "postprocess", "knowledge"].includes(o.promptStage) ? o.promptStage : "preprocess",
        noteFont: Math.max(NOTE_FONT_MIN, Math.min(NOTE_FONT_MAX, Number(o.noteFont) || 17)),
      };
    } catch (_) {
      return defaultUiGeom();
    }
  }

  function saveUiGeom() {
    if (!state.ui) return;
    try {
      localStorage.setItem(
        UI_STORE_KEY,
        JSON.stringify({
          x: state.ui.x,
          y: state.ui.y,
          w: state.ui.w,
          h: state.ui.h,
          sizePreset: state.ui.sizePreset || DEFAULT_PANEL_SIZE,
          heightMode: state.ui.heightMode === "custom" ? "custom" : "high",
          dock: state.ui.dock,
          view: state.ui.view || "ai",
          aiStage: state.ui.aiStage || "preprocess",
          settingsTab: state.ui.settingsTab || "prompt",
          promptStage: state.ui.promptStage || "preprocess",
          noteFont: state.ui.noteFont || 17,
        }),
      );
    } catch (_) {
      /* ignore quota */
    }
  }

  function clampUiToViewport(ui) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (isPanelSizePreset(ui.sizePreset)) {
      ui.w = panelPresetWidth(ui.sizePreset, vw);
    } else {
      ui.sizePreset = "custom";
      ui.w = Math.min(Math.max(MIN_W, ui.w), Math.max(MIN_W, vw - 8));
    }
    if (ui.heightMode !== "custom") {
      ui.heightMode = "high";
      ui.h = highPanelHeight(vh);
    } else {
      ui.h = Math.min(Math.max(MIN_H, ui.h), Math.max(MIN_H, vh - 8));
    }
    ui.x = Math.min(Math.max(0, ui.x), Math.max(0, vw - ui.w));
    ui.y = Math.min(Math.max(0, ui.y), Math.max(0, vh - ui.h));
    return ui;
  }

  // ─── UI (Catppuccin Mocha floating panel) ───────────────────────────────
  function injectStyles() {
    // Catppuccin Mocha — https://catppuccin.com/palette/ (userstyle tokens)
    GM_addStyle(`
      #${PANEL_ID} {
        /* Catppuccin Mocha */
        --ctp-rosewater: #f5e0dc;
        --ctp-flamingo: #f2cdcd;
        --ctp-pink: #f5c2e7;
        --ctp-mauve: #cba6f7;
        --ctp-red: #f38ba8;
        --ctp-maroon: #eba0ac;
        --ctp-peach: #fab387;
        --ctp-yellow: #f9e2af;
        --ctp-green: #a6e3a1;
        --ctp-teal: #94e2d5;
        --ctp-sky: #89dceb;
        --ctp-sapphire: #74c7ec;
        --ctp-blue: #89b4fa;
        --ctp-lavender: #b4befe;
        --ctp-text: #cdd6f4;
        --ctp-subtext1: #bac2de;
        --ctp-subtext0: #a6adc8;
        --ctp-overlay2: #9399b2;
        --ctp-overlay1: #7f849c;
        --ctp-overlay0: #6c7086;
        --ctp-surface2: #585b70;
        --ctp-surface1: #45475a;
        --ctp-surface0: #313244;
        --ctp-base: #1e1e2e;
        --ctp-mantle: #181825;
        --ctp-crust: #11111b;

        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        z-index: 2147483646;
        --bsb-note-font: 17px;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI",
          "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        font-size: 12px;
        font-synthesis: none;
        isolation: isolate;
        contain: style;
        color: var(--ctp-text);
        line-height: 1.45;
        pointer-events: none;
      }
      #${PANEL_ID} * { box-sizing: border-box; }

      #${PANEL_ID} .bsb-fab,
      #${PANEL_ID} .bsb-sidebar,
      #${PANEL_ID} .bsb-dock-tab {
        pointer-events: auto;
      }

      #${PANEL_ID} .bsb-fab {
        position: fixed;
        right: 14px;
        bottom: 88px;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        border: 1px solid color-mix(in srgb, var(--ctp-lavender) 45%, transparent);
        cursor: pointer;
        background: color-mix(in srgb, var(--ctp-mantle) 55%, transparent);
        color: var(--ctp-lavender);
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.04em;
        box-shadow: 0 8px 28px color-mix(in srgb, var(--ctp-crust) 55%, transparent);
        backdrop-filter: blur(14px) saturate(1.2);
        -webkit-backdrop-filter: blur(14px) saturate(1.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform .15s ease, border-color .15s ease, color .15s ease,
          background .15s ease, opacity .15s ease;
      }
      #${PANEL_ID} .bsb-fab:hover {
        transform: translateY(-1px);
        color: var(--ctp-base);
        background: color-mix(in srgb, var(--ctp-lavender) 88%, transparent);
        border-color: var(--ctp-lavender);
      }
      #${PANEL_ID}.open .bsb-fab,
      #${PANEL_ID}.docked .bsb-fab {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      /* 悬浮玻璃工作台 */
      #${PANEL_ID} .bsb-sidebar {
        position: fixed;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--ctp-overlay0) 32%, transparent);
        background: color-mix(in srgb, var(--ctp-base) 72%, transparent);
        backdrop-filter: blur(22px) saturate(1.4);
        -webkit-backdrop-filter: blur(22px) saturate(1.4);
        box-shadow:
          0 24px 64px color-mix(in srgb, var(--ctp-crust) 55%, transparent),
          0 0 0 1px color-mix(in srgb, var(--ctp-lavender) 8%, transparent),
          inset 0 1px 0 color-mix(in srgb, var(--ctp-overlay2) 22%, transparent);
        min-width: ${MIN_W}px;
        min-height: ${MIN_H}px;
        contain: layout paint style;
      }
      #${PANEL_ID}.open:not(.docked) .bsb-sidebar {
        display: flex;
      }
      /* 贴边收起时：主面板隐藏，只留 dock-tab；展开时显示 */
      #${PANEL_ID}.docked.dock-expanded .bsb-sidebar {
        display: flex;
      }

      /* 贴边标签 */
      #${PANEL_ID} .bsb-dock-tab {
        display: none;
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: ${DOCK_EDGE_PX}px;
        padding: 14px 0;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        letter-spacing: 0.18em;
        font-size: 12px;
        font-weight: 650;
        color: var(--ctp-lavender);
        cursor: pointer;
        user-select: none;
        border: 1px solid color-mix(in srgb, var(--ctp-lavender) 40%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 62%, transparent);
        backdrop-filter: blur(14px) saturate(1.2);
        -webkit-backdrop-filter: blur(14px) saturate(1.2);
        box-shadow: 0 8px 28px color-mix(in srgb, var(--ctp-crust) 40%, transparent);
        z-index: 1;
      }
      #${PANEL_ID}.docked .bsb-dock-tab { display: flex; align-items: center; justify-content: center; }
      #${PANEL_ID}.docked[data-dock="right"] .bsb-dock-tab {
        right: 0;
        border-radius: 12px 0 0 12px;
        border-right: none;
      }
      #${PANEL_ID}.docked[data-dock="left"] .bsb-dock-tab {
        left: 0;
        border-radius: 0 12px 12px 0;
        border-left: none;
      }
      #${PANEL_ID} .bsb-dock-tab:hover {
        color: var(--ctp-base);
        background: color-mix(in srgb, var(--ctp-lavender) 85%, transparent);
      }

      #${PANEL_ID} .bsb-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px 10px;
        flex-shrink: 0;
        gap: 10px;
        border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface0) 80%, transparent);
        background:
          linear-gradient(180deg,
            color-mix(in srgb, var(--ctp-mantle) 70%, transparent) 0%,
            color-mix(in srgb, var(--ctp-base) 35%, transparent) 100%);
        cursor: grab;
        user-select: none;
        touch-action: none;
      }
      #${PANEL_ID} .bsb-head:active { cursor: grabbing; }
      #${PANEL_ID} .bsb-head .bsb-head-title {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
      }
      #${PANEL_ID} .bsb-logo {
        width: 28px; height: 28px; border-radius: 9px;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 800; letter-spacing: -0.02em;
        color: var(--ctp-crust);
        background: linear-gradient(135deg, var(--ctp-lavender), var(--ctp-mauve));
        box-shadow: 0 4px 14px color-mix(in srgb, var(--ctp-mauve) 35%, transparent);
      }
      #${PANEL_ID} .bsb-head strong {
        font-size: 14px;
        font-weight: 700;
        color: var(--ctp-text);
        letter-spacing: 0.01em;
      }
      #${PANEL_ID} .bsb-head .bsb-ver {
        font-size: 10px;
        color: var(--ctp-overlay1);
        font-weight: 500;
        padding: 2px 7px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--ctp-surface0) 55%, transparent);
      }
      #${PANEL_ID} .bsb-flavor {
        display: none;
      }
      #${PANEL_ID} .bsb-size-switch {
        display: inline-flex;
        align-items: center;
        padding: 2px;
        gap: 1px;
        border-radius: 9px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 58%, transparent);
        background: color-mix(in srgb, var(--ctp-crust) 36%, transparent);
      }
      #${PANEL_ID} .bsb-size-switch button {
        width: 25px;
        height: 23px;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--ctp-overlay1);
        cursor: pointer;
        font-size: 10.5px;
        font-weight: 700;
      }
      #${PANEL_ID} .bsb-size-switch button:hover {
        color: var(--ctp-text);
        background: color-mix(in srgb, var(--ctp-surface1) 55%, transparent);
      }
      #${PANEL_ID} .bsb-size-switch button.active {
        color: var(--ctp-crust);
        background: linear-gradient(135deg, var(--ctp-lavender), var(--ctp-mauve));
        box-shadow: 0 3px 10px color-mix(in srgb, var(--ctp-mauve) 24%, transparent);
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-head {
        padding-inline: 10px;
        gap: 6px;
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-head .bsb-ver,
      #${PANEL_ID}[data-panel-size="small"] .bsb-ai-compact-stats {
        display: none;
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-ai-commandbar {
        gap: 5px;
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-ai-command-actions {
        gap: 3px;
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-ai-command-actions .bsb-btn {
        padding-inline: 7px;
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-ai-md {
        padding-inline: 15px;
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-ai-content {
        max-width: 100%;
      }
      #${PANEL_ID}[data-panel-size="medium"] .bsb-ai-content {
        max-width: 56em;
      }
      #${PANEL_ID}[data-panel-size="large"] .bsb-ai-content {
        max-width: 72em;
      }
      /* 主导航 */
      #${PANEL_ID} .bsb-nav {
        display: flex;
        gap: 4px;
        padding: 8px 12px;
        flex-shrink: 0;
        border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface0) 70%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 35%, transparent);
      }
      #${PANEL_ID} .bsb-nav button {
        flex: 1;
        height: 36px;
        border: none;
        border-radius: 11px;
        cursor: pointer;
        font-size: 12.5px;
        font-weight: 650;
        color: var(--ctp-subtext0);
        background: transparent;
        transition: background .15s, color .15s, box-shadow .15s;
        letter-spacing: 0.01em;
      }
      #${PANEL_ID} .bsb-nav button:hover {
        color: var(--ctp-text);
        background: color-mix(in srgb, var(--ctp-surface0) 45%, transparent);
      }
      #${PANEL_ID} .bsb-nav button.active {
        color: var(--ctp-crust);
        background: linear-gradient(135deg,
          color-mix(in srgb, var(--ctp-lavender) 92%, transparent),
          color-mix(in srgb, var(--ctp-mauve) 88%, transparent));
        box-shadow: 0 6px 18px color-mix(in srgb, var(--ctp-mauve) 28%, transparent);
      }
      #${PANEL_ID} .bsb-head-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      #${PANEL_ID} .bsb-icon-btn {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--ctp-surface0) 55%, transparent);
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 60%, transparent);
        color: var(--ctp-subtext0);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: color .12s, background .12s, border-color .12s;
      }
      #${PANEL_ID} .bsb-icon-btn:hover {
        color: var(--ctp-lavender);
        border-color: color-mix(in srgb, var(--ctp-lavender) 40%, transparent);
        background: color-mix(in srgb, var(--ctp-lavender) 12%, transparent);
      }
      #${PANEL_ID} .bsb-icon-btn.bsb-close:hover {
        color: var(--ctp-red);
        border-color: color-mix(in srgb, var(--ctp-red) 40%, transparent);
        background: color-mix(in srgb, var(--ctp-red) 12%, transparent);
      }

      /* 拉伸手柄 */
      #${PANEL_ID} .bsb-resize {
        position: absolute;
        z-index: 3;
        background: transparent;
      }
      #${PANEL_ID} .bsb-resize.n { top: 0; left: 10px; right: 10px; height: 6px; cursor: ns-resize; }
      #${PANEL_ID} .bsb-resize.s { bottom: 0; left: 10px; right: 10px; height: 6px; cursor: ns-resize; }
      #${PANEL_ID} .bsb-resize.e { right: 0; top: 10px; bottom: 10px; width: 6px; cursor: ew-resize; }
      #${PANEL_ID} .bsb-resize.w { left: 0; top: 10px; bottom: 10px; width: 6px; cursor: ew-resize; }
      #${PANEL_ID} .bsb-resize.ne { top: 0; right: 0; width: 12px; height: 12px; cursor: nesw-resize; }
      #${PANEL_ID} .bsb-resize.nw { top: 0; left: 0; width: 12px; height: 12px; cursor: nwse-resize; }
      #${PANEL_ID} .bsb-resize.se { bottom: 0; right: 0; width: 14px; height: 14px; cursor: nwse-resize; }
      #${PANEL_ID} .bsb-resize.sw { bottom: 0; left: 0; width: 12px; height: 12px; cursor: nesw-resize; }
      #${PANEL_ID} .bsb-resize.se::after {
        content: "";
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 8px;
        height: 8px;
        border-right: 2px solid color-mix(in srgb, var(--ctp-overlay1) 70%, transparent);
        border-bottom: 2px solid color-mix(in srgb, var(--ctp-overlay1) 70%, transparent);
        border-radius: 0 0 2px 0;
      }
      #${PANEL_ID}.docked .bsb-resize { display: none; }
      #${PANEL_ID} .bsb-sidebar.dragging,
      #${PANEL_ID} .bsb-sidebar.resizing {
        transition: none !important;
        user-select: none;
      }

      /* 内容区：三工作区切换 */
      #${PANEL_ID} .bsb-body {
        padding: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex: 1;
      }
      #${PANEL_ID} .bsb-view {
        display: none;
        flex-direction: column;
        gap: 10px;
        padding: 12px 14px 10px;
        min-height: 0;
        flex: 1 1 0;
        overflow: hidden;
      }
      #${PANEL_ID} .bsb-view.active { display: flex; }
      /* AI 页：画布吃掉剩余高度（给绝对定位阅读器当基准） */
      #${PANEL_ID} .bsb-view[data-view-panel="ai"] {
        gap: 8px;
      }
      #${PANEL_ID} .bsb-view[data-view-panel="ai"] .bsb-ai-canvas-wrap {
        flex: 1 1 0;
        min-height: 260px;
      }

      #${PANEL_ID} .bsb-badge {
        display: inline-flex; align-items: center; gap: 4px;
        background: color-mix(in srgb, var(--ctp-sapphire) 16%, transparent);
        color: var(--ctp-sapphire);
        border: 1px solid color-mix(in srgb, var(--ctp-sapphire) 28%, transparent);
        border-radius: 999px;
        padding: 3px 10px;
        font-weight: 650;
        font-size: 11px;
      }
      #${PANEL_ID} .bsb-badge.manual {
        background: color-mix(in srgb, var(--ctp-mauve) 16%, transparent);
        color: var(--ctp-mauve);
        border-color: color-mix(in srgb, var(--ctp-mauve) 28%, transparent);
      }
      #${PANEL_ID} .bsb-meta {
        margin-top: 3px;
        color: var(--ctp-subtext0);
        word-break: break-all;
        font-size: 11px;
        line-height: 1.4;
      }
      #${PANEL_ID} .bsb-mode-row {
        display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
      }
      #${PANEL_ID} .bsb-mode-row label {
        display: inline-flex; align-items: center; gap: 6px; color: var(--ctp-subtext1);
      }
      #${PANEL_ID} .bsb-mode-row select,
      #${PANEL_ID} .bsb-field select {
        height: 32px; min-width: 132px; border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 65%, transparent);
        color: var(--ctp-text); padding: 0 10px; font-size: 12px; outline: none; cursor: pointer;
      }
      #${PANEL_ID} .bsb-mode-row select:focus {
        border-color: color-mix(in srgb, var(--ctp-mauve) 55%, transparent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ctp-mauve) 18%, transparent);
      }
      #${PANEL_ID} .bsb-auto-hint {
        font-size: 11px; color: var(--ctp-overlay1); flex: 1; min-width: 100px;
      }
      #${PANEL_ID} .bsb-auto-hint strong { color: var(--ctp-teal); font-weight: 650; }

      /* 通用按钮 */
      #${PANEL_ID} .bsb-btn {
        height: 34px; border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        background: color-mix(in srgb, var(--ctp-surface0) 50%, transparent);
        cursor: pointer; font-size: 12.5px; padding: 0 12px; color: var(--ctp-text);
        font-weight: 550; transition: background .12s, border-color .12s, color .12s, transform .12s;
      }
      #${PANEL_ID} .bsb-btn:hover:not(:disabled) {
        border-color: color-mix(in srgb, var(--ctp-lavender) 45%, transparent);
        color: var(--ctp-lavender);
        background: color-mix(in srgb, var(--ctp-surface1) 40%, transparent);
      }
      #${PANEL_ID} .bsb-btn:active:not(:disabled) { transform: scale(0.98); }
      #${PANEL_ID} .bsb-btn:disabled { opacity: .42; cursor: not-allowed; }
      #${PANEL_ID} .bsb-btn.primary {
        background: linear-gradient(135deg,
          color-mix(in srgb, var(--ctp-blue) 90%, transparent),
          color-mix(in srgb, var(--ctp-lavender) 85%, transparent));
        border-color: transparent; color: var(--ctp-crust); font-weight: 700;
        box-shadow: 0 6px 16px color-mix(in srgb, var(--ctp-blue) 25%, transparent);
      }
      #${PANEL_ID} .bsb-btn.primary:hover:not(:disabled) {
        filter: brightness(1.06); color: var(--ctp-crust);
      }
      #${PANEL_ID} .bsb-btn.accent {
        background: linear-gradient(135deg, var(--ctp-mauve), var(--ctp-pink));
        border-color: transparent; color: var(--ctp-crust); font-weight: 750;
        box-shadow: 0 8px 22px color-mix(in srgb, var(--ctp-mauve) 32%, transparent);
      }
      #${PANEL_ID} .bsb-btn.accent:hover:not(:disabled) {
        filter: brightness(1.05); color: var(--ctp-crust);
      }
      #${PANEL_ID} .bsb-btn.danger {
        color: var(--ctp-red);
        border-color: color-mix(in srgb, var(--ctp-red) 38%, transparent);
        background: color-mix(in srgb, var(--ctp-red) 12%, transparent);
      }
      #${PANEL_ID} .bsb-btn.ghost {
        background: transparent;
        border-color: color-mix(in srgb, var(--ctp-surface1) 50%, transparent);
      }
      #${PANEL_ID} .bsb-toolbar,
      #${PANEL_ID} .bsb-actions {
        display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
      }
      #${PANEL_ID} .bsb-actions {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; flex-shrink: 0;
      }
      #${PANEL_ID} .bsb-toolbar button,
      #${PANEL_ID} .bsb-actions button {
        height: 34px; border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        background: color-mix(in srgb, var(--ctp-surface0) 50%, transparent);
        cursor: pointer; font-size: 12px; padding: 0 10px; color: var(--ctp-text);
      }
      #${PANEL_ID} .bsb-toolbar button.primary,
      #${PANEL_ID} .bsb-actions button.primary {
        background: color-mix(in srgb, var(--ctp-blue) 80%, transparent);
        border-color: transparent; color: var(--ctp-crust); font-weight: 650;
      }
      #${PANEL_ID} .bsb-toolbar button.danger {
        color: var(--ctp-red);
        border-color: color-mix(in srgb, var(--ctp-red) 40%, transparent);
        background: color-mix(in srgb, var(--ctp-red) 10%, transparent);
      }
      #${PANEL_ID} .bsb-toolbar button:disabled,
      #${PANEL_ID} .bsb-actions button:disabled { opacity: .45; cursor: not-allowed; }

      #${PANEL_ID} .bsb-opts {
        display: flex; flex-wrap: wrap; gap: 10px; align-items: center; color: var(--ctp-subtext1);
      }
      #${PANEL_ID} .bsb-opts label { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; }
      #${PANEL_ID} .bsb-opts input[type="number"] {
        width: 58px; height: 28px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 60%, transparent);
        border-radius: 8px; padding: 0 6px; font-size: 12px; color: var(--ctp-text);
        background: color-mix(in srgb, var(--ctp-mantle) 55%, transparent); outline: none;
      }
      #${PANEL_ID} .bsb-opts input[type="checkbox"] { accent-color: var(--ctp-mauve); }

      /* ── 字幕资源库：采集入口 + 左侧资源 Master + 右侧 Detail ── */
      #${PANEL_ID} .bsb-view[data-view-panel="subs"] {
        position: relative; gap: 8px; overflow: hidden;
      }
      #${PANEL_ID} .bsb-library-topbar {
        display: flex; align-items: center; gap: 7px; min-height: 34px; flex-shrink: 0;
      }
      #${PANEL_ID} .bsb-library-search {
        flex: 1 1 180px; min-width: 120px; height: 32px; display: grid;
        grid-template-columns: auto minmax(0,1fr); align-items: center; gap: 6px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        border-radius: 10px; padding: 0 9px;
        background: color-mix(in srgb, var(--ctp-mantle) 62%, transparent);
      }
      #${PANEL_ID} .bsb-library-search input {
        width: 100%; min-width: 0; border: 0; outline: 0; background: transparent;
        color: var(--ctp-text); font-size: 11.5px;
      }
      #${PANEL_ID} .bsb-library-filterbar {
        display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; flex-shrink: 1;
      }
      #${PANEL_ID} .bsb-library-filterbar::-webkit-scrollbar { display: none; }
      #${PANEL_ID} .bsb-library-filterbar button {
        height: 29px; border-radius: 9px; padding: 0 8px; white-space: nowrap; cursor: pointer;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 65%, transparent);
        background: transparent; color: var(--ctp-subtext0); font-size: 10.5px;
      }
      #${PANEL_ID} .bsb-library-filterbar button.active {
        color: var(--ctp-sapphire); border-color: color-mix(in srgb, var(--ctp-sapphire) 42%, transparent);
        background: color-mix(in srgb, var(--ctp-sapphire) 12%, transparent);
      }
      #${PANEL_ID} .bsb-library-layout {
        display: grid; grid-template-columns: minmax(190px, 31%) minmax(0, 1fr);
        gap: 9px; flex: 1 1 0; min-height: 0; overflow: hidden;
      }
      #${PANEL_ID} .bsb-library-master {
        display: flex; flex-direction: column; min-width: 0; min-height: 0;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 52%, transparent);
        border-radius: 14px; overflow: hidden;
        background: color-mix(in srgb, var(--ctp-mantle) 55%, transparent);
      }
      #${PANEL_ID} .bsb-library-master-head {
        padding: 8px 9px; display: flex; align-items: center; justify-content: space-between; gap: 6px;
        border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface0) 72%, transparent);
        color: var(--ctp-subtext1); font-size: 10.5px;
      }
      #${PANEL_ID} .bsb-library-master-head strong { color: var(--ctp-text); font-size: 11.5px; }
      #${PANEL_ID} .bsb-list {
        flex: 1 1 0; min-height: 0; overflow-y: auto; padding: 5px;
      }
      #${PANEL_ID} .bsb-resource-item {
        position: relative; display: grid; grid-template-columns: 20px minmax(0,1fr); gap: 6px;
        padding: 8px 7px; border: 1px solid transparent; border-radius: 10px; cursor: pointer;
        transition: background .12s, border-color .12s;
      }
      #${PANEL_ID} .bsb-resource-item:hover {
        background: color-mix(in srgb, var(--ctp-surface0) 45%, transparent);
      }
      #${PANEL_ID} .bsb-resource-item.active {
        border-color: color-mix(in srgb, var(--ctp-sapphire) 42%, transparent);
        background: color-mix(in srgb, var(--ctp-sapphire) 10%, transparent);
      }
      #${PANEL_ID} .bsb-resource-item input[type="checkbox"] { margin-top: 2px; accent-color: var(--ctp-mauve); }
      #${PANEL_ID} .bsb-resource-main { min-width: 0; display: grid; gap: 3px; }
      #${PANEL_ID} .bsb-resource-title {
        color: var(--ctp-text); font-weight: 590; font-size: 11.5px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      #${PANEL_ID} .bsb-resource-meta {
        display: flex; gap: 6px; align-items: center; min-width: 0;
        color: var(--ctp-overlay1); font-size: 9.8px;
      }
      #${PANEL_ID} .bsb-resource-meta span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #${PANEL_ID} .bsb-resource-status { font-weight: 650; flex-shrink: 0; }
      #${PANEL_ID} .bsb-resource-status.st-ok { color: var(--ctp-green); }
      #${PANEL_ID} .bsb-resource-status.st-empty { color: var(--ctp-peach); }
      #${PANEL_ID} .bsb-resource-status.st-err { color: var(--ctp-red); }
      #${PANEL_ID} .bsb-resource-status.st-wait { color: var(--ctp-overlay1); }
      #${PANEL_ID} .bsb-library-master-foot {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; padding: 6px;
        border-top: 1px solid color-mix(in srgb, var(--ctp-surface0) 72%, transparent);
      }
      #${PANEL_ID} .bsb-library-master-foot button {
        height: 28px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--ctp-surface1) 62%, transparent);
        background: color-mix(in srgb, var(--ctp-surface0) 42%, transparent); color: var(--ctp-subtext1);
        cursor: pointer; font-size: 10px; padding: 0 5px;
      }
      #${PANEL_ID} .bsb-library-detail { min-width: 0; min-height: 0; display: flex; }
      #${PANEL_ID} .bsb-detail-tabs {
        display: flex; gap: 4px; padding: 0 10px 7px; border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface0) 62%, transparent);
      }
      #${PANEL_ID} .bsb-detail-tabs button {
        height: 27px; border-radius: 8px; padding: 0 9px; cursor: pointer;
        border: 1px solid transparent; background: transparent; color: var(--ctp-overlay1); font-size: 10.5px;
      }
      #${PANEL_ID} .bsb-detail-tabs button.active {
        color: var(--ctp-sapphire); background: color-mix(in srgb, var(--ctp-sapphire) 12%, transparent);
        border-color: color-mix(in srgb, var(--ctp-sapphire) 30%, transparent);
      }
      #${PANEL_ID} .bsb-capture-drawer {
        position: absolute; z-index: 12; top: 52px; left: 14px; right: 14px;
        padding: 12px; display: grid; gap: 9px;
        border: 1px solid color-mix(in srgb, var(--ctp-mauve) 35%, var(--ctp-surface1));
        border-radius: 14px; background: color-mix(in srgb, var(--ctp-base) 96%, transparent);
        box-shadow: 0 18px 50px rgba(0,0,0,.42); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
      }
      #${PANEL_ID} .bsb-capture-drawer[hidden] { display: none !important; }
      #${PANEL_ID} .bsb-capture-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      #${PANEL_ID} .bsb-capture-head strong { font-size: 13px; }
      #${PANEL_ID} .bsb-capture-head span { font-size: 10px; color: var(--ctp-overlay1); }
      #${PANEL_ID} .bsb-capture-actions { display:flex; gap:6px; justify-content:flex-end; }
      @media (max-width: 700px) {
        #${PANEL_ID} .bsb-library-layout { grid-template-columns: minmax(150px, 38%) minmax(0,1fr); }
        #${PANEL_ID} .bsb-library-filterbar { display: none; }
      }
      #${PANEL_ID} .bsb-transcript-shell {
        flex: 1 1 0; min-width: 0; min-height: 0; overflow: hidden;
        display: flex; flex-direction: column;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 55%, transparent);
        border-radius: 14px; background: color-mix(in srgb, var(--ctp-base) 62%, transparent);
        contain: layout paint style;
      }
      #${PANEL_ID} .bsb-transcript-head {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 9px 10px 7px; border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface0) 70%, transparent);
      }
      #${PANEL_ID} .bsb-transcript-title { min-width: 0; display: grid; gap: 2px; }
      #${PANEL_ID} .bsb-transcript-title strong {
        font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      #${PANEL_ID} .bsb-transcript-title span { font-size: 10px; color: var(--ctp-overlay1); }
      #${PANEL_ID} .bsb-transcript-tools {
        padding: 8px 10px; display: grid; grid-template-columns: minmax(120px,1fr) auto auto auto;
        gap: 6px; align-items: center; border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface0) 62%, transparent);
      }
      #${PANEL_ID} .bsb-transcript-search {
        height: 31px; display: grid; grid-template-columns: auto minmax(0,1fr) auto;
        align-items: center; gap: 6px; padding: 0 8px; border-radius: 9px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 58%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 60%, transparent);
      }
      #${PANEL_ID} .bsb-transcript-search input {
        min-width: 0; width: 100%; border: 0; outline: 0; background: transparent;
        color: var(--ctp-text); font-size: 11.5px;
      }
      #${PANEL_ID} .bsb-transcript-count { font-size: 10px; color: var(--ctp-overlay1); font-variant-numeric: tabular-nums; }
      #${PANEL_ID} .bsb-transcript-track {
        max-width: 118px; height: 31px; border-radius: 9px; padding: 0 7px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 58%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 60%, transparent); color: var(--ctp-text); font-size: 10.5px;
      }
      #${PANEL_ID} .bsb-transcript-follow { font-size: 10.5px; color: var(--ctp-subtext0); white-space: nowrap; }
      #${PANEL_ID} .bsb-transcript-follow input { accent-color: var(--ctp-sapphire); }
      #${PANEL_ID} .bsb-transcript-refresh {
        height: 31px; padding: 0 8px; border-radius: 9px; cursor: pointer;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 58%, transparent);
        background: color-mix(in srgb, var(--ctp-surface0) 50%, transparent); color: var(--ctp-text); font-size: 10.5px;
      }
      #${PANEL_ID} .bsb-transcript-list {
        flex: 1 1 0; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
        padding: 4px 7px 14px; scroll-padding-block: 38%;
      }
      #${PANEL_ID} .bsb-transcript-row {
        content-visibility: auto; contain-intrinsic-size: auto 58px; contain: layout paint style;
        display: grid; grid-template-columns: 52px minmax(0,1fr); gap: 8px; align-items: start;
        padding: 8px 7px; border-radius: 9px; border-left: 3px solid transparent;
      }
      #${PANEL_ID} .bsb-transcript-row:hover { background: color-mix(in srgb, var(--ctp-surface0) 45%, transparent); }
      #${PANEL_ID} .bsb-transcript-row.active {
        background: color-mix(in srgb, var(--ctp-sapphire) 12%, transparent);
        border-left-color: var(--ctp-sapphire);
      }
      #${PANEL_ID} .bsb-transcript-time {
        border: 0; background: transparent; color: var(--ctp-sapphire); cursor: pointer;
        padding: 2px 0; text-align: left; font-size: 10.5px; font-variant-numeric: tabular-nums;
      }
      #${PANEL_ID} .bsb-transcript-text {
        margin: 0; color: var(--ctp-subtext1); font-size: 12px; line-height: 1.62; overflow-wrap: anywhere;
      }
      #${PANEL_ID} .bsb-transcript-row.active .bsb-transcript-text { color: var(--ctp-text); font-weight: 600; }
      #${PANEL_ID} .bsb-transcript-text mark {
        background: color-mix(in srgb, var(--ctp-yellow) 48%, transparent); color: inherit; border-radius: 3px; padding: 0 .08em;
      }
      #${PANEL_ID} .bsb-transcript-empty {
        min-height: 120px; display: grid; place-items: center; text-align: center;
        color: var(--ctp-overlay1); font-size: 11.5px; line-height: 1.55; padding: 20px;
      }
      @media (max-width: 640px) {
        #${PANEL_ID} .bsb-transcript-tools { grid-template-columns: minmax(0,1fr) auto; }
        #${PANEL_ID} .bsb-transcript-follow { display: none; }
      }

      #${PANEL_ID} .bsb-empty {
        padding: 36px 16px; text-align: center; color: var(--ctp-overlay1);
        display: flex; flex-direction: column; align-items: center; gap: 8px;
      }
      #${PANEL_ID} .bsb-empty .bsb-empty-ico {
        width: 48px; height: 48px; border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 22px;
        background: color-mix(in srgb, var(--ctp-surface0) 55%, transparent);
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 45%, transparent);
      }
      #${PANEL_ID} .bsb-empty strong { color: var(--ctp-subtext1); font-size: 13px; }
      #${PANEL_ID} .bsb-empty span { font-size: 12px; max-width: 280px; line-height: 1.45; }

      /* ── AI 工作区（主画布） ── */
      #${PANEL_ID} .bsb-ai-hero {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 12px; flex-shrink: 0;
      }
      #${PANEL_ID} .bsb-ai-hero h2 {
        margin: 0; font-size: 16px; font-weight: 750; color: var(--ctp-text);
        letter-spacing: -0.01em;
      }
      #${PANEL_ID} .bsb-ai-hero p {
        margin: 4px 0 0; font-size: 11.5px; color: var(--ctp-subtext0); line-height: 1.4;
      }
      #${PANEL_ID} .bsb-ai-hero-actions {
        display: flex; gap: 6px; flex-shrink: 0; align-items: center;
      }
      #${PANEL_ID} .bsb-ai-hero-actions .bsb-btn.accent {
        height: 40px; padding: 0 16px; font-size: 13px; border-radius: 12px;
      }
      #${PANEL_ID} .bsb-chips {
        display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0;
      }
      #${PANEL_ID} .bsb-chip {
        display: inline-flex; align-items: center; gap: 5px;
        height: 26px; padding: 0 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
        color: var(--ctp-subtext1);
        background: color-mix(in srgb, var(--ctp-surface0) 55%, transparent);
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 45%, transparent);
      }
      #${PANEL_ID} .bsb-chip em {
        font-style: normal; color: var(--ctp-lavender); font-weight: 700;
      }
      #${PANEL_ID} .bsb-chip.ok { color: var(--ctp-green); border-color: color-mix(in srgb, var(--ctp-green) 30%, transparent); }
      #${PANEL_ID} .bsb-chip.warn { color: var(--ctp-peach); }
      #${PANEL_ID} .bsb-ai-result-tabs {
        display: flex; gap: 6px; overflow-x: auto; flex-shrink: 0;
        padding: 1px 0 4px; scrollbar-width: thin;
      }
      #${PANEL_ID} .bsb-ai-result-tab {
        display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto;
        min-width: 108px; max-width: 220px; height: 32px; padding: 0 10px;
        border-radius: 10px; cursor: pointer; text-align: left;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 45%, transparent);
        background: color-mix(in srgb, var(--ctp-surface0) 38%, transparent);
        color: var(--ctp-subtext0); font-size: 11px; font-weight: 650;
      }
      #${PANEL_ID} .bsb-ai-result-tab:hover {
        color: var(--ctp-text); border-color: color-mix(in srgb, var(--ctp-lavender) 38%, transparent);
      }
      #${PANEL_ID} .bsb-ai-result-tab.active {
        color: var(--ctp-text); border-color: color-mix(in srgb, var(--ctp-mauve) 58%, transparent);
        background: color-mix(in srgb, var(--ctp-mauve) 14%, var(--ctp-surface0));
      }
      #${PANEL_ID} .bsb-ai-result-tab .dot {
        width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto;
        background: var(--ctp-overlay0);
      }
      #${PANEL_ID} .bsb-ai-result-tab.running .dot { background: var(--ctp-green); animation: bsb-pulse 1.1s ease-in-out infinite; }
      #${PANEL_ID} .bsb-ai-result-tab.done .dot { background: var(--ctp-teal); }
      #${PANEL_ID} .bsb-ai-result-tab.error .dot { background: var(--ctp-red); }
      #${PANEL_ID} .bsb-ai-result-tab.stopped .dot { background: var(--ctp-peach); }
      #${PANEL_ID} .bsb-ai-result-tab .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      #${PANEL_ID} .bsb-ai-result-unit {
        display: inline-flex; align-items: stretch; min-width: 0; flex: 0 0 auto;
      }
      #${PANEL_ID} .bsb-ai-result-unit .bsb-ai-result-tab {
        border-top-right-radius: 0; border-bottom-right-radius: 0;
      }
      #${PANEL_ID} .bsb-ai-result-retry {
        width: 27px; padding: 0; margin-left: -1px; border-radius: 0 9px 9px 0;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        background: color-mix(in srgb, var(--ctp-surface0) 42%, transparent);
        color: var(--ctp-overlay1); cursor: pointer; font-size: 15px; line-height: 1;
      }
      #${PANEL_ID} .bsb-ai-result-unit.active .bsb-ai-result-retry,
      #${PANEL_ID} .bsb-ai-result-retry:hover {
        color: var(--ctp-lavender);
        border-color: color-mix(in srgb, var(--ctp-lavender) 45%, transparent);
        background: color-mix(in srgb, var(--ctp-lavender) 12%, transparent);
      }
      #${PANEL_ID} .bsb-ai-result-empty { color: var(--ctp-overlay1); font-size: 11px; padding: 7px 2px; }

      #${PANEL_ID} .bsb-ai-canvas-wrap {
        /* 关键：绝对填充，保证内部一定有固定高度可滚动 */
        flex: 1 1 auto;
        min-height: 280px;
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 45%, transparent);
        background:
          radial-gradient(120% 80% at 100% 0%,
            color-mix(in srgb, var(--ctp-mauve) 10%, transparent), transparent 55%),
          color-mix(in srgb, var(--ctp-crust) 62%, transparent);
        box-shadow: inset 0 1px 0 color-mix(in srgb, var(--ctp-overlay2) 10%, transparent);
      }
      #${PANEL_ID} .bsb-ai-canvas-bar {
        position: absolute; top: 0; left: 0; right: 0; height: 40px;
        z-index: 2;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 0 12px;
        border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface0) 70%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 82%, transparent);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        font-size: 11px; color: var(--ctp-overlay1); font-weight: 600;
        letter-spacing: 0.04em; text-transform: uppercase;
      }
      #${PANEL_ID} .bsb-ai-canvas-bar .bsb-bar-left {
        display: inline-flex; align-items: center; gap: 8px; min-width: 0;
      }
      #${PANEL_ID} .bsb-live-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--ctp-overlay0); flex-shrink: 0;
      }
      #${PANEL_ID} .bsb-ai-stream.streaming .bsb-live-dot {
        background: var(--ctp-green);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ctp-green) 25%, transparent);
        animation: bsb-pulse 1.1s ease-in-out infinite;
      }
      #${PANEL_ID} .bsb-ai-canvas-bar .bsb-bar-actions {
        display: inline-flex; gap: 4px; align-items: center; flex-shrink: 0;
      }
      #${PANEL_ID} .bsb-ai-canvas-bar .bsb-mini {
        height: 24px; padding: 0 8px; border-radius: 7px; font-size: 10px;
        letter-spacing: 0; text-transform: none; font-weight: 650;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 50%, transparent);
        background: color-mix(in srgb, var(--ctp-surface0) 40%, transparent);
        color: var(--ctp-subtext0); cursor: pointer;
      }
      #${PANEL_ID} .bsb-ai-canvas-bar .bsb-mini:hover {
        color: var(--ctp-lavender); border-color: color-mix(in srgb, var(--ctp-lavender) 40%, transparent);
      }
      #${PANEL_ID} .bsb-ai-canvas-bar .bsb-mini.on {
        color: var(--ctp-teal);
        border-color: color-mix(in srgb, var(--ctp-teal) 40%, transparent);
        background: color-mix(in srgb, var(--ctp-teal) 12%, transparent);
      }
      #${PANEL_ID} .bsb-ai-stream {
        position: absolute;
        top: 40px; left: 0; right: 0; bottom: 0;
        overflow: hidden;
      }
      #${PANEL_ID} .bsb-ai-stream .bsb-ai-raw { display: none !important; }

      /*
       * 唯一滚动层：绝对定位铺满画布，height 明确，overflow-y: scroll
       * （flex 链常导致“看起来能滚其实高度在变、滚动无效”）
       */
      #${PANEL_ID} .bsb-ai-md {
        position: absolute;
        inset: 0;
        overflow-y: scroll !important;
        overflow-x: hidden !important;
        padding: 32px 28px 88px;
        box-sizing: border-box;
        font-size: var(--bsb-note-font);
        line-height: 1.9;
        letter-spacing: 0.03em;
        color: var(--ctp-text);
        scroll-behavior: auto;
        overscroll-behavior: contain;
        overflow-anchor: none; /* 禁止浏览器滚动锚定与 stick 互抢 */
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
        font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI",
          "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", system-ui, sans-serif;
      }
      #${PANEL_ID} .bsb-ai-content {
        max-width: 40em;
        margin: 0 auto;
        min-height: min-content;
        overflow-anchor: none;
      }
      #${PANEL_ID} .bsb-ai-stream-body {
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: anywhere;
        font-size: 17px;
        line-height: 2.15;
        letter-spacing: 0.04em;
        color: var(--ctp-text);
        font-family: inherit;
        display: block;
        overflow-anchor: none;
      }
      #${PANEL_ID} .bsb-ai-caret {
        display: inline-block;
        width: 0.5em; height: 1.1em;
        margin-left: 3px;
        vertical-align: text-bottom;
        background: var(--ctp-lavender);
        border-radius: 1px;
        animation: bsb-caret 1s step-end infinite;
      }
      @keyframes bsb-caret {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      #${PANEL_ID} .bsb-ai-anchor {
        height: 24px; width: 100%; pointer-events: none; flex-shrink: 0;
      }
      /* 浮层：不在底部时跳到最新（ChatGPT 风格） */
      #${PANEL_ID} .bsb-jump-latest {
        position: absolute;
        right: 14px; bottom: 14px;
        z-index: 5;
        display: none;
        align-items: center; gap: 6px;
        height: 36px; padding: 0 14px;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--ctp-lavender) 40%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 88%, transparent);
        color: var(--ctp-lavender);
        font-size: 12px; font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 24px color-mix(in srgb, var(--ctp-crust) 45%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        pointer-events: auto;
      }
      #${PANEL_ID} .bsb-jump-latest.show { display: inline-flex; }
      #${PANEL_ID} .bsb-jump-latest:hover {
        color: var(--ctp-crust);
        background: color-mix(in srgb, var(--ctp-lavender) 88%, transparent);
      }

      /* Markdown 阅读优化：更大间距、更松段落 */
      #${PANEL_ID} .bsb-ai-md h1,
      #${PANEL_ID} .bsb-ai-md h2,
      #${PANEL_ID} .bsb-ai-md h3,
      #${PANEL_ID} .bsb-ai-md h4 {
        color: var(--ctp-lavender);
        font-weight: 700;
        letter-spacing: 0.01em;
        line-height: 1.35;
      }
      #${PANEL_ID} .bsb-ai-md h1 {
        font-size: 1.5em; margin: 1.6em 0 0.8em;
        padding-bottom: 0.4em;
        border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface1) 50%, transparent);
      }
      #${PANEL_ID} .bsb-ai-md h1:first-child { margin-top: 0.15em; }
      #${PANEL_ID} .bsb-ai-md h2 {
        font-size: 1.28em; margin: 1.55em 0 0.7em; color: var(--ctp-mauve);
      }
      #${PANEL_ID} .bsb-ai-md h3 {
        font-size: 1.12em; margin: 1.4em 0 0.6em; color: var(--ctp-sapphire);
      }
      #${PANEL_ID} .bsb-ai-md p {
        margin: 1.15em 0;
        line-height: 1.95;
      }
      #${PANEL_ID} .bsb-ai-md ul,
      #${PANEL_ID} .bsb-ai-md ol {
        margin: 1.1em 0;
        padding-left: 1.7em;
      }
      #${PANEL_ID} .bsb-ai-md li {
        margin: 0.65em 0;
        line-height: 1.95;
        padding-left: 0.25em;
      }
      #${PANEL_ID} .bsb-ai-md li > p { margin: 0.35em 0; }
      #${PANEL_ID} .bsb-ai-md a { color: var(--ctp-blue); text-decoration: none; }
      #${PANEL_ID} .bsb-ai-md a:hover { text-decoration: underline; }
      #${PANEL_ID} .bsb-ai-md strong { color: var(--ctp-rosewater); font-weight: 700; }
      #${PANEL_ID} .bsb-ai-md em { color: var(--ctp-subtext1); }
      #${PANEL_ID} .bsb-ai-md blockquote {
        margin: 1.1em 0;
        padding: 0.75em 1.1em;
        border-left: 3px solid var(--ctp-mauve);
        color: var(--ctp-subtext0);
        background: color-mix(in srgb, var(--ctp-surface0) 28%, transparent);
        border-radius: 0 12px 12px 0;
        line-height: 1.85;
      }
      #${PANEL_ID} .bsb-ai-md table {
        border-collapse: separate; border-spacing: 0;
        width: 100%; margin: 1.1em 0; font-size: 13.5px;
        overflow: hidden; border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 55%, transparent);
      }
      #${PANEL_ID} .bsb-ai-md th, #${PANEL_ID} .bsb-ai-md td {
        border-bottom: 1px solid color-mix(in srgb, var(--ctp-surface1) 45%, transparent);
        padding: 10px 12px;
        line-height: 1.55;
      }
      #${PANEL_ID} .bsb-ai-md tr:last-child td { border-bottom: none; }
      #${PANEL_ID} .bsb-ai-md th {
        background: color-mix(in srgb, var(--ctp-surface0) 55%, transparent);
        color: var(--ctp-subtext1); font-weight: 650;
      }
      #${PANEL_ID} .bsb-ai-md pre {
        margin: 1.1em 0; padding: 14px 16px; border-radius: 14px;
        overflow: auto; max-height: 420px;
        background: #11111b;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 40%, transparent);
        line-height: 1.55;
      }
      #${PANEL_ID} .bsb-ai-md code {
        font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
        font-size: 0.9em;
      }
      #${PANEL_ID} .bsb-ai-md :not(pre) > code {
        background: color-mix(in srgb, var(--ctp-surface0) 60%, transparent);
        padding: 0.15em 0.4em; border-radius: 6px; color: var(--ctp-peach);
      }
      #${PANEL_ID} .bsb-ai-md .hljs { background: transparent; color: var(--ctp-text); }
      #${PANEL_ID} .bsb-ai-md .mermaid {
        margin: 1.25em 0;
        min-height: 86px;
        text-align: left;
      }
      #${PANEL_ID} .bsb-mermaid-error {
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--ctp-red) 42%, var(--ctp-surface1));
        border-radius: 12px;
        background: color-mix(in srgb, var(--ctp-mantle) 78%, transparent);
      }
      #${PANEL_ID} .bsb-mermaid-error-head {
        min-height: 42px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 7px 10px 7px 13px;
        color: var(--ctp-peach);
        border-bottom: 1px solid color-mix(in srgb, var(--ctp-red) 24%, transparent);
      }
      #${PANEL_ID} .bsb-mermaid-error details { padding: 9px 12px 12px; }
      #${PANEL_ID} .bsb-mermaid-error summary { cursor: pointer; color: var(--ctp-overlay1); }
      #${PANEL_ID} .bsb-mermaid-error pre { margin: 10px 0 0; max-height: 280px; overflow: auto; }
      #${PANEL_ID} .bsb-mermaid-card {
        position: relative;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        min-width: 0;
        overflow: hidden;
        border-radius: 15px;
        border: 1px solid color-mix(in srgb, var(--ctp-blue) 30%, var(--ctp-surface1));
        background: #181825;
        box-shadow: 0 12px 30px rgba(0, 0, 0, .22);
        content-visibility: visible;
        contain: layout paint style;
      }
      #${PANEL_ID} .bsb-mermaid-toolbar {
        position: sticky;
        top: 0;
        z-index: 3;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 6px 8px 6px 11px;
        border-bottom: 1px solid rgba(137, 180, 250, .2);
        background: rgba(24, 24, 37, .96);
        color: #bac2de;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      #${PANEL_ID} .bsb-mermaid-title {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #cdd6f4;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .03em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #${PANEL_ID} .bsb-mermaid-title::before {
        content: "◇";
        color: #89b4fa;
      }
      #${PANEL_ID} .bsb-mermaid-card .bsb-mermaid-title {
        font-variant-numeric: tabular-nums;
      }
      #${PANEL_ID} .bsb-mermaid-tools {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }
      #${PANEL_ID} .bsb-mermaid-tool {
        appearance: none;
        min-width: 29px;
        height: 28px;
        padding: 0 7px;
        border: 1px solid transparent;
        border-radius: 7px;
        background: transparent;
        color: #a6adc8;
        font: 650 11px/1 system-ui, sans-serif;
        cursor: pointer;
      }
      #${PANEL_ID} .bsb-mermaid-tool:hover,
      #${PANEL_ID} .bsb-mermaid-tool:focus-visible {
        color: #f5e0dc;
        background: #313244;
        border-color: #45475a;
        outline: none;
      }
      #${PANEL_ID} .bsb-mermaid-scale {
        min-width: 42px;
        color: #89b4fa;
        text-align: center;
        font: 700 10px/1 ui-monospace, monospace;
        font-variant-numeric: tabular-nums;
      }
      #${PANEL_ID} .bsb-mermaid-viewport {
        position: relative;
        min-height: 220px;
        max-height: min(68vh, 720px);
        overflow: auto;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        padding: 18px;
        background:
          linear-gradient(rgba(69, 71, 90, .18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(69, 71, 90, .18) 1px, transparent 1px),
          #181825;
        background-size: 24px 24px;
      }
      #${PANEL_ID} .bsb-mermaid-stage {
        width: var(--bsb-mermaid-width, 760px);
        min-width: 1px;
        margin: 0 auto;
        transform-origin: top left;
      }
      #${PANEL_ID} .bsb-mermaid-svg {
        display: block;
        width: 100% !important;
        height: auto !important;
        max-width: none !important;
        overflow: visible;
        shape-rendering: geometricPrecision;
        text-rendering: geometricPrecision;
      }
      #${PANEL_ID} .bsb-mermaid-svg text,
      #${PANEL_ID} .bsb-mermaid-svg .label,
      #${PANEL_ID} .bsb-mermaid-svg .nodeLabel,
      #${PANEL_ID} .bsb-mermaid-svg .edgeLabel {
        font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif !important;
        -webkit-font-smoothing: antialiased;
      }
      #${PANEL_ID} .bsb-mermaid-hint {
        position: absolute;
        right: 10px;
        bottom: 8px;
        z-index: 2;
        pointer-events: none;
        padding: 3px 7px;
        border-radius: 6px;
        background: rgba(17, 17, 27, .78);
        color: #7f849c;
        font-size: 9px;
      }
      #${PANEL_ID} .bsb-mermaid-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        pointer-events: auto;
        display: grid;
        place-items: stretch;
        padding: 18px;
        background: rgba(10, 10, 16, .88);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      #${PANEL_ID} .bsb-mermaid-modal .bsb-mermaid-card {
        width: 100%;
        height: 100%;
        max-width: none;
        border-radius: 14px;
        box-shadow: 0 25px 90px rgba(0, 0, 0, .55);
      }
      #${PANEL_ID} .bsb-mermaid-modal .bsb-mermaid-viewport {
        max-height: none;
        min-height: 0;
      }
      #${PANEL_ID} .bsb-mermaid-card[data-fit="fit"] .bsb-mermaid-stage {
        margin-inline: auto;
      }
      @media (max-width: 560px) {
        #${PANEL_ID} .bsb-mermaid-viewport { padding: 12px; min-height: 190px; }
        #${PANEL_ID} .bsb-mermaid-title { display: none; }
        #${PANEL_ID} .bsb-mermaid-modal { padding: 0; }
        #${PANEL_ID} .bsb-mermaid-modal .bsb-mermaid-card { border-radius: 0; }
      }
      /* KaTeX 数学公式（深色面板） */
      #${PANEL_ID} .bsb-ai-md .katex {
        color: var(--ctp-text);
        font-size: 1.12em;
      }
      #${PANEL_ID} .bsb-ai-md .bsb-katex-inline {
        display: inline;
        padding: 0 0.1em;
      }
      #${PANEL_ID} .bsb-ai-md .bsb-katex-display {
        display: block;
        margin: 1.2em 0;
        padding: 14px 12px;
        overflow-x: auto;
        overflow-y: hidden;
        text-align: center;
        border-radius: 12px;
        background: color-mix(in srgb, var(--ctp-mantle) 55%, transparent);
        border: 1px solid color-mix(in srgb, var(--ctp-surface0) 45%, transparent);
      }
      #${PANEL_ID} .bsb-ai-md .bsb-katex-display .katex-display {
        margin: 0;
      }
      #${PANEL_ID} .bsb-ai-md .katex-error {
        color: var(--ctp-red) !important;
      }
      #${PANEL_ID} .bsb-ai-md .bsb-math-fallback {
        color: var(--ctp-peach);
        white-space: pre-wrap;
        font-family: "JetBrains Mono", ui-monospace, monospace;
        font-size: 0.92em;
      }
      #${PANEL_ID} .bsb-ai-md pre.bsb-math-fallback {
        margin: 1em 0;
        padding: 12px 14px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--ctp-mantle) 55%, transparent);
        border: 1px solid color-mix(in srgb, var(--ctp-peach) 28%, transparent);
      }
      #${PANEL_ID} .bsb-ai-md .bsb-code-lang {
        display: block; font-size: 10px; color: var(--ctp-overlay1);
        margin-bottom: 10px; text-transform: lowercase; letter-spacing: 0.06em;
      }
      #${PANEL_ID} .bsb-ai-md hr {
        border: none; height: 1px; margin: 1.6em 0;
        background: color-mix(in srgb, var(--ctp-surface1) 55%, transparent);
      }
      /* 阅读与渲染优化 */
      #${PANEL_ID}.ai-busy .bsb-sidebar,
      #${PANEL_ID} .bsb-sidebar.dragging,
      #${PANEL_ID} .bsb-sidebar.resizing {
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }
      #${PANEL_ID} .bsb-ai-mode-row {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        margin: 0 0 10px;
      }
      #${PANEL_ID} .bsb-ai-mode-row label {
        display: inline-flex; align-items: center; gap: 7px;
        color: var(--ctp-subtext0); font-size: 11px;
      }
      #${PANEL_ID} .bsb-ai-mode-row select {
        min-width: 108px; border-radius: 9px; padding: 6px 9px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        background: var(--ctp-mantle); color: var(--ctp-text); outline: none;
      }
      #${PANEL_ID} .bsb-ai-content {
        overflow-anchor: none;
        text-rendering: optimizeLegibility;
      }
      #${PANEL_ID} .bsb-ai-content > :not(.bsb-toc) {
        content-visibility: auto;
        contain-intrinsic-size: auto 160px;
      }
      #${PANEL_ID} .bsb-ai-md p,
      #${PANEL_ID} .bsb-ai-md li { text-wrap: pretty; }
      #${PANEL_ID} .bsb-time-link {
        appearance: none; display: inline-flex; align-items: center;
        margin: 0 .14em; padding: .12em .46em; border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--ctp-blue) 35%, transparent);
        background: color-mix(in srgb, var(--ctp-blue) 12%, transparent);
        color: var(--ctp-blue); font: 600 .78em/1.5 ui-monospace, monospace;
        cursor: pointer; vertical-align: .08em;
      }
      #${PANEL_ID} .bsb-time-link:hover,
      #${PANEL_ID} .bsb-time-link:focus-visible {
        background: color-mix(in srgb, var(--ctp-blue) 22%, transparent);
        outline: 2px solid color-mix(in srgb, var(--ctp-blue) 32%, transparent);
      }
      #${PANEL_ID} .bsb-toc {
        margin: 0 0 1.35em; padding: 10px 12px; border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 55%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 55%, transparent);
        content-visibility: visible;
      }
      #${PANEL_ID} .bsb-toc summary {
        cursor: pointer; color: var(--ctp-lavender); font-weight: 700;
      }
      #${PANEL_ID} .bsb-toc nav { display: grid; gap: 5px; margin-top: 9px; }
      #${PANEL_ID} .bsb-toc button {
        appearance: none; border: 0; background: transparent; color: var(--ctp-subtext1);
        text-align: left; cursor: pointer; padding: 3px 5px; border-radius: 6px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      #${PANEL_ID} .bsb-toc button[data-level="3"] { padding-left: 20px; }
      #${PANEL_ID} .bsb-toc button:hover { color: var(--ctp-text); background: var(--ctp-surface0); }
      #${PANEL_ID} .mermaid[data-bsb-state="pending"]::before {
        content: "图表将在进入视区时渲染"; color: var(--ctp-overlay1); font-size: 11px;
      }
      @media (max-width: 560px) {
        #${PANEL_ID}.open:not(.docked) .bsb-sidebar {
          left: 0 !important; top: 0 !important; width: 100vw !important; height: 100dvh !important;
          border-radius: 0;
        }
        #${PANEL_ID} .bsb-ai-hero { align-items: flex-start; }
      }
      @media (prefers-reduced-motion: reduce) {
        #${PANEL_ID} *, #${PANEL_ID} *::before, #${PANEL_ID} *::after {
          animation-duration: .001ms !important; animation-iteration-count: 1 !important;
          transition-duration: .001ms !important; scroll-behavior: auto !important;
        }
      }

      /* 设置页 */
      #${PANEL_ID} .bsb-settings {
        overflow: auto; flex: 1; min-height: 0;
        display: flex; flex-direction: column; gap: 12px;
        padding-right: 2px;
      }
      #${PANEL_ID} .bsb-card {
        border-radius: 14px; padding: 12px 14px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 45%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 45%, transparent);
      }
      #${PANEL_ID} .bsb-card h3 {
        margin: 0 0 10px; font-size: 12px; font-weight: 700;
        color: var(--ctp-subtext1); letter-spacing: 0.04em; text-transform: uppercase;
      }
      #${PANEL_ID} .bsb-ai-config label,
      #${PANEL_ID} .bsb-field label {
        display: flex; flex-direction: column; gap: 4px;
        font-size: 11.5px; color: var(--ctp-subtext1); margin-bottom: 8px;
      }
      #${PANEL_ID} .bsb-ai-config input,
      #${PANEL_ID} .bsb-ai-config textarea,
      #${PANEL_ID} .bsb-field input {
        width: 100%; border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        background: color-mix(in srgb, var(--ctp-base) 60%, transparent);
        color: var(--ctp-text); padding: 8px 10px; font-size: 12.5px; font-family: inherit;
        outline: none;
      }
      #${PANEL_ID} .bsb-ai-config input:focus,
      #${PANEL_ID} .bsb-ai-config textarea:focus {
        border-color: color-mix(in srgb, var(--ctp-mauve) 50%, transparent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ctp-mauve) 16%, transparent);
      }
      #${PANEL_ID} .bsb-ai-config textarea {
        min-height: 88px; resize: vertical; line-height: 1.45;
      }
      #${PANEL_ID} .bsb-ai-config .row2 {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
      }
      #${PANEL_ID} .bsb-ai-cfg-actions {
        display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;
      }
      #${PANEL_ID} .bsb-ai-config-head {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
        margin-bottom: 10px;
      }
      #${PANEL_ID} .bsb-ai-config-head p {
        margin: 0; color: var(--ctp-subtext0); font-size: 11px; line-height: 1.5;
      }
      #${PANEL_ID} .bsb-ai-profiles { display: flex; flex-direction: column; gap: 10px; }
      #${PANEL_ID} .bsb-ai-profile {
        padding: 11px; border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 48%, transparent);
        background: color-mix(in srgb, var(--ctp-base) 32%, transparent);
      }
      #${PANEL_ID} .bsb-ai-profile.disabled { opacity: .62; }
      #${PANEL_ID} .bsb-ai-profile-title {
        display: flex; align-items: center; gap: 8px; margin-bottom: 9px;
      }
      #${PANEL_ID} .bsb-ai-profile-title input[type="checkbox"] { width: auto; flex: 0 0 auto; }
      #${PANEL_ID} .bsb-ai-profile-title input[type="text"] { flex: 1 1 auto; min-width: 0; font-weight: 700; }
      #${PANEL_ID} .bsb-ai-profile-tools { display: inline-flex; gap: 5px; flex: 0 0 auto; }
      #${PANEL_ID} .bsb-ai-profile-tools button {
        height: 28px; padding: 0 8px; border-radius: 8px; font-size: 10.5px;
      }
      #${PANEL_ID} .bsb-ai-profile-summary {
        color: var(--ctp-overlay1); font-size: 10.5px; margin: -2px 0 8px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      #${PANEL_ID} .bsb-prompt-profiles { display: flex; flex-direction: column; gap: 10px; }
      #${PANEL_ID} .bsb-prompt-card {
        padding: 11px; border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 48%, transparent);
        background: color-mix(in srgb, var(--ctp-base) 32%, transparent);
      }
      #${PANEL_ID} .bsb-prompt-card.active {
        border-color: color-mix(in srgb, var(--ctp-green) 56%, transparent);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ctp-green) 18%, transparent);
      }
      #${PANEL_ID} .bsb-prompt-card-title {
        display: flex; align-items: center; gap: 8px; margin-bottom: 9px;
      }
      #${PANEL_ID} .bsb-prompt-card-title input[type="text"] { flex: 1 1 auto; min-width: 0; font-weight: 700; }
      #${PANEL_ID} .bsb-prompt-tools { display: inline-flex; gap: 5px; flex: 0 0 auto; }
      #${PANEL_ID} .bsb-prompt-tools button {
        height: 28px; padding: 0 8px; border-radius: 8px; font-size: 10.5px;
      }
      #${PANEL_ID} .bsb-prompt-card textarea[data-prompt-field="systemPrompt"] { min-height: 250px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11.5px; }
      #${PANEL_ID} .bsb-prompt-card textarea[data-prompt-field="userPromptTemplate"] { min-height: 190px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11.5px; }
      #${PANEL_ID} .bsb-prompt-vars {
        margin-top: -3px; color: var(--ctp-overlay1); font-size: 10.5px; line-height: 1.5;
      }
      #${PANEL_ID} .bsb-prompt-vars code { color: var(--ctp-blue); }
      #${PANEL_ID} .bsb-prompt-profile-note {
        margin-top: -3px; color: var(--ctp-overlay1); font-size: 10.5px; line-height: 1.5;
      }
      #${PANEL_ID} .bsb-prompt-architecture {
        margin-top: 10px; padding: 9px 10px; border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 45%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 38%, transparent);
      }
      #${PANEL_ID} .bsb-prompt-architecture summary {
        cursor: pointer; color: var(--ctp-blue); font-weight: 700; font-size: 11.5px;
      }
      #${PANEL_ID} .bsb-prompt-architecture-grid {
        display: grid; gap: 7px; margin-top: 9px;
      }
      #${PANEL_ID} .bsb-prompt-architecture-grid > div {
        display: grid; grid-template-columns: minmax(112px, .34fr) 1fr; gap: 8px;
        padding: 7px 8px; border-radius: 8px;
        background: color-mix(in srgb, var(--ctp-base) 44%, transparent);
        font-size: 10.5px; line-height: 1.45;
      }
      #${PANEL_ID} .bsb-prompt-architecture-grid strong { color: var(--ctp-text); }
      #${PANEL_ID} .bsb-prompt-architecture-grid span { color: var(--ctp-subtext0); }


      /* v5.5 设置：Prompt / LLM + Master–Detail */
      #${PANEL_ID} .bsb-settings {
        overflow: hidden;
        gap: 10px;
        padding-right: 0;
      }
      #${PANEL_ID} .bsb-ai-pipeline {
        display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap;
      }
      #${PANEL_ID} .bsb-pipeline-stage {
        display: inline-flex; align-items: center; gap: 5px; min-width: 0;
        padding: 3px 6px; border: 1px solid var(--ctp-surface0); border-radius: 8px;
        background: color-mix(in srgb, var(--ctp-mantle) 84%, transparent);
      }
      #${PANEL_ID} .bsb-pipeline-stage > span { color: var(--ctp-subtext0); font-size: 10.5px; white-space: nowrap; }
      #${PANEL_ID} .bsb-pipeline-stage select { max-width: 180px; min-width: 90px; }
      #${PANEL_ID} .bsb-pipeline-toggle { display:inline-flex; align-items:center; gap:4px; font-size:10.5px; color:var(--ctp-text); white-space:nowrap; }
      #${PANEL_ID} .bsb-pipeline-arrow { color: var(--ctp-overlay1); font-weight: 800; }
      #${PANEL_ID} .bsb-config-stage-badge {
        flex: 0 0 auto; font-size: 9px; line-height: 1; padding: 4px 5px; border-radius: 5px;
        color: var(--ctp-subtext1); background: var(--ctp-surface0); text-transform: uppercase;
      }
      #${PANEL_ID} .bsb-config-stage-badge.preprocess { color: var(--ctp-green); }
      #${PANEL_ID} .bsb-config-stage-badge.postprocess { color: var(--ctp-blue); }
      #${PANEL_ID} .bsb-prompt-stage-tabs {
        display:flex; gap:4px; flex:0 0 auto; padding:6px; border:1px solid var(--ctp-surface0);
        border-radius:10px; background:color-mix(in srgb,var(--ctp-mantle) 84%,transparent);
      }
      #${PANEL_ID} .bsb-prompt-stage-tabs button {
        flex:1 1 0; border:0; border-radius:7px; padding:7px 10px; cursor:pointer;
        color:var(--ctp-subtext0); background:transparent; font-size:11px; font-weight:750;
      }
      #${PANEL_ID} .bsb-prompt-stage-tabs button.active {
        color:var(--ctp-text); background:var(--ctp-surface0); box-shadow:inset 0 0 0 1px var(--ctp-surface1);
      }
      #${PANEL_ID} .bsb-prompt-stage-tabs button[data-prompt-stage-tab="preprocess"].active { color:var(--ctp-green); }
      #${PANEL_ID} .bsb-prompt-stage-tabs button[data-prompt-stage-tab="postprocess"].active { color:var(--ctp-blue); }
      #${PANEL_ID} .bsb-prompt-stage-tabs button[data-prompt-stage-tab="knowledge"].active { color:var(--ctp-mauve); }
      #${PANEL_ID} .bsb-prompt-stage-context {
        display:flex; align-items:center; justify-content:space-between; gap:8px; padding:1px 2px 0;
        color:var(--ctp-overlay1); font-size:9.5px; line-height:1.4;
      }
      #${PANEL_ID} [data-prompt-create-stage][hidden] { display:none !important; }
      #${PANEL_ID} .bsb-preprocess-note {
        margin: 8px 0 0; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--ctp-surface0);
        color: var(--ctp-subtext0); background: var(--ctp-mantle); font-size: 10.5px; line-height: 1.55;
      }

      /* v5.8 AI Workbench：主界面展示产物，不展示执行参数 */
      #${PANEL_ID} [data-view-panel="ai"] { position: relative; overflow: hidden; }
      #${PANEL_ID} .bsb-workbench-commandbar { gap: 10px; }
      #${PANEL_ID} .bsb-workbench-context { display:flex; align-items:center; gap:6px; min-width:0; }
      #${PANEL_ID} .bsb-context-button {
        display:flex; flex-direction:column; align-items:flex-start; gap:1px; min-width:0; max-width:220px;
        padding:5px 8px; border-radius:9px; border:1px solid transparent; background:transparent;
        color:var(--ctp-text); cursor:pointer; text-align:left;
      }
      #${PANEL_ID} .bsb-context-button:hover { background:var(--ctp-surface0); border-color:var(--ctp-surface1); }
      #${PANEL_ID} .bsb-context-button strong { max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11.5px; }
      #${PANEL_ID} .bsb-context-kicker { color:var(--ctp-overlay1); font-size:8.5px; font-weight:900; letter-spacing:.08em; }
      #${PANEL_ID} .bsb-workbench-arrow { color:var(--ctp-overlay0); font-weight:900; }
      #${PANEL_ID} .bsb-ai-stage-tabs { display:flex; align-items:center; gap:6px; min-width:0; }
      #${PANEL_ID} .bsb-ai-stage-tabs > button { display:flex; align-items:center; gap:7px; min-width:118px; padding:6px 10px; border:1px solid var(--ctp-surface1); border-radius:10px; background:color-mix(in srgb,var(--ctp-base) 62%,transparent); color:var(--ctp-subtext0); cursor:pointer; text-align:left; }
      #${PANEL_ID} .bsb-ai-stage-tabs > button:hover { border-color:var(--ctp-overlay0); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-ai-stage-tabs > button.active { border-color:color-mix(in srgb,var(--ctp-mauve) 62%,var(--ctp-surface1)); background:color-mix(in srgb,var(--ctp-mauve) 13%,var(--ctp-base)); color:var(--ctp-text); box-shadow:inset 0 -2px 0 var(--ctp-mauve); }
      #${PANEL_ID} .bsb-ai-stage-tabs strong { display:block; font-size:11.5px; line-height:1.2; }
      #${PANEL_ID} .bsb-ai-stage-tabs small { display:block; margin-top:2px; font-size:9px; color:var(--ctp-overlay1); white-space:nowrap; }
      #${PANEL_ID} .bsb-stage-index { width:20px; height:20px; border-radius:7px; display:grid; place-items:center; flex:0 0 auto; background:var(--ctp-surface0); color:var(--ctp-overlay1); font-size:9.5px; font-weight:850; }
      #${PANEL_ID} .bsb-ai-stage-tabs > button.active .bsb-stage-index { background:var(--ctp-mauve); color:var(--ctp-crust); }
      #${PANEL_ID} .bsb-stage-connector { color:var(--ctp-overlay0); font-size:14px; }
      #${PANEL_ID} .bsb-preprocess-nav { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:5px 8px; border-bottom:1px solid var(--ctp-surface0); background:color-mix(in srgb,var(--ctp-mantle) 78%,transparent); }
      #${PANEL_ID} .bsb-preprocess-tabs { display:flex; gap:4px; min-width:0; }
      #${PANEL_ID} .bsb-preprocess-tabs button { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border:0; border-radius:8px; background:transparent; color:var(--ctp-subtext0); cursor:pointer; font-size:10.5px; font-weight:750; }
      #${PANEL_ID} .bsb-preprocess-tabs button:hover { background:var(--ctp-surface0); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-preprocess-tabs button.active { background:var(--ctp-surface0); color:var(--ctp-text); box-shadow:inset 0 -2px 0 var(--ctp-sapphire); }
      #${PANEL_ID} .bsb-preprocess-tabs .dot { width:7px; height:7px; border-radius:50%; background:var(--ctp-overlay0); }
      #${PANEL_ID} .bsb-preprocess-tabs .dot.raw { background:var(--ctp-blue); }
      #${PANEL_ID} .bsb-preprocess-tabs .dot.processed { background:var(--ctp-green); }
      #${PANEL_ID} .bsb-preprocess-status { color:var(--ctp-overlay1); font-size:9.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #${PANEL_ID} .bsb-main-input-preview { margin:0; min-height:100%; white-space:pre-wrap; word-break:break-word; color:var(--ctp-text); background:transparent; border:0; padding:2px 0 24px; font:inherit; line-height:1.8; }

      /* v5.10.2 · 规范化字幕阅读卡片：让“处理后的字幕”具有明显的学习材料层级 */
      #${PANEL_ID} .bsb-preprocess-reading {
        --bsb-block-accent: var(--ctp-green);
        display:grid; gap:13px; padding:2px 0 34px;
      }
      #${PANEL_ID} .bsb-preprocess-source {
        display:flex; align-items:center; gap:9px; min-width:0;
        margin:3px 0 2px; padding:9px 11px; border-radius:11px;
        border:1px solid color-mix(in srgb,var(--ctp-teal) 22%,var(--ctp-surface0));
        background:linear-gradient(135deg,color-mix(in srgb,var(--ctp-teal) 9%,transparent),color-mix(in srgb,var(--ctp-base) 72%,transparent));
        color:var(--ctp-subtext1);
      }
      #${PANEL_ID} .bsb-preprocess-source-mark {
        width:25px; height:25px; flex:0 0 auto; display:grid; place-items:center;
        border-radius:8px; background:color-mix(in srgb,var(--ctp-teal) 16%,var(--ctp-surface0));
        color:var(--ctp-teal); font-size:11px; font-weight:900;
      }
      #${PANEL_ID} .bsb-preprocess-source-text { min-width:0; }
      #${PANEL_ID} .bsb-preprocess-source-text strong {
        display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        color:var(--ctp-text); font-size:11.5px; font-weight:820;
      }
      #${PANEL_ID} .bsb-preprocess-source-text span { display:block; margin-top:1px; color:var(--ctp-overlay1); font-size:9.5px; }
      #${PANEL_ID} .bsb-preprocess-section-title {
        display:flex; align-items:center; gap:9px; margin:9px 2px 0;
        color:var(--ctp-subtext1); font-size:11.5px; font-weight:820; letter-spacing:.015em;
      }
      #${PANEL_ID} .bsb-preprocess-section-title::before {
        content:""; width:4px; height:14px; border-radius:999px;
        background:linear-gradient(180deg,var(--ctp-green),var(--ctp-teal));
        box-shadow:0 0 14px color-mix(in srgb,var(--ctp-green) 30%,transparent);
      }
      #${PANEL_ID} .bsb-preprocess-block {
        --bsb-block-accent: var(--ctp-green);
        position:relative; overflow:hidden; padding:12px 14px 13px 16px; border-radius:13px;
        border:1px solid color-mix(in srgb,var(--bsb-block-accent) 15%,var(--ctp-surface0));
        background:
          linear-gradient(105deg,color-mix(in srgb,var(--bsb-block-accent) 5.5%,transparent),transparent 36%),
          color-mix(in srgb,var(--ctp-mantle) 62%,transparent);
        box-shadow:0 4px 16px color-mix(in srgb,var(--ctp-crust) 15%,transparent);
        transition:border-color .16s ease, background .16s ease, transform .16s ease, box-shadow .16s ease;
      }
      #${PANEL_ID} .bsb-preprocess-block::before {
        content:""; position:absolute; inset:9px auto 9px 0; width:3px; border-radius:0 999px 999px 0;
        background:var(--bsb-block-accent); opacity:.7;
      }
      #${PANEL_ID} .bsb-preprocess-block:nth-of-type(4n+1) { --bsb-block-accent:var(--ctp-green); }
      #${PANEL_ID} .bsb-preprocess-block:nth-of-type(4n+2) { --bsb-block-accent:var(--ctp-teal); }
      #${PANEL_ID} .bsb-preprocess-block:nth-of-type(4n+3) { --bsb-block-accent:var(--ctp-blue); }
      #${PANEL_ID} .bsb-preprocess-block:nth-of-type(4n+4) { --bsb-block-accent:var(--ctp-lavender); }
      #${PANEL_ID} .bsb-preprocess-block:hover {
        transform:translateY(-1px);
        border-color:color-mix(in srgb,var(--bsb-block-accent) 30%,var(--ctp-surface1));
        background:
          linear-gradient(105deg,color-mix(in srgb,var(--bsb-block-accent) 9%,transparent),transparent 42%),
          color-mix(in srgb,var(--ctp-mantle) 76%,transparent);
        box-shadow:0 8px 24px color-mix(in srgb,var(--ctp-crust) 22%,transparent);
      }
      #${PANEL_ID} .bsb-preprocess-block-head {
        display:flex; align-items:center; gap:7px; min-height:22px; margin-bottom:7px;
      }
      #${PANEL_ID} .bsb-preprocess-block-index {
        display:inline-grid; place-items:center; min-width:23px; height:20px; padding:0 5px; box-sizing:border-box;
        border-radius:7px; background:color-mix(in srgb,var(--bsb-block-accent) 13%,var(--ctp-surface0));
        color:color-mix(in srgb,var(--bsb-block-accent) 88%,white 5%); font:800 9px/1 ui-monospace,monospace;
      }
      #${PANEL_ID} .bsb-preprocess-block-topic {
        min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        color:var(--ctp-overlay1); font-size:9.5px; font-weight:650;
      }
      #${PANEL_ID} .bsb-preprocess-block-time {
        margin-left:auto; flex:0 0 auto; display:inline-flex; align-items:center; gap:5px;
      }
      #${PANEL_ID} .bsb-preprocess-block-time .bsb-time-link {
        margin:0; padding:.18em .58em; background:color-mix(in srgb,var(--bsb-block-accent) 9%,transparent);
        border-color:color-mix(in srgb,var(--bsb-block-accent) 25%,transparent); color:var(--bsb-block-accent);
      }
      #${PANEL_ID} .bsb-preprocess-time-end { color:var(--ctp-overlay1); font:650 9px/1.4 ui-monospace,monospace; }
      #${PANEL_ID} .bsb-preprocess-warning {
        display:inline-flex; align-items:center; gap:4px; flex:0 0 auto; padding:3px 6px; border-radius:999px;
        border:1px solid color-mix(in srgb,var(--ctp-peach) 28%,transparent);
        background:color-mix(in srgb,var(--ctp-peach) 8%,transparent); color:var(--ctp-peach); font-size:8.5px; font-weight:760;
      }
      #${PANEL_ID} .bsb-preprocess-block-body {
        color:color-mix(in srgb,var(--ctp-text) 94%,var(--ctp-subtext1));
        font-size:calc(var(--bsb-note-font) * .96); line-height:1.86; letter-spacing:.018em;
        white-space:pre-wrap; overflow-wrap:anywhere; text-wrap:pretty;
      }
      #${PANEL_ID} .bsb-preprocess-block-body::selection {
        background:color-mix(in srgb,var(--bsb-block-accent) 28%,transparent); color:var(--ctp-text);
      }
      #${PANEL_ID}[data-panel-size="small"] .bsb-preprocess-block { padding:10px 11px 11px 13px; border-radius:11px; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-preprocess-block-topic { display:none; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-preprocess-block-body { font-size:calc(var(--bsb-note-font) * .92); line-height:1.78; }
      /* v6 Knowledge Drill-down */
      #${PANEL_ID} .bsb-selection-toolbar {
        pointer-events:auto;
        position:fixed; z-index:2147483646; width:300px; box-sizing:border-box;
        padding:6px; border-radius:13px; border:1px solid color-mix(in srgb,var(--ctp-mauve) 32%,var(--ctp-surface1));
        background:color-mix(in srgb,var(--ctp-base) 96%,transparent); box-shadow:0 16px 40px rgba(0,0,0,.42);
        backdrop-filter:blur(14px) saturate(1.15); -webkit-backdrop-filter:blur(14px) saturate(1.15);
      }
      #${PANEL_ID} .bsb-selection-toolbar-text { display:block; padding:3px 7px 6px; color:var(--ctp-overlay1); font-size:9.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      #${PANEL_ID} .bsb-selection-toolbar-actions { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
      #${PANEL_ID} .bsb-selection-toolbar-actions button { border:0; border-radius:8px; padding:7px 4px; background:transparent; color:var(--ctp-subtext1); cursor:pointer; font-size:10px; font-weight:720; }
      #${PANEL_ID} .bsb-selection-toolbar-actions button:hover { background:var(--ctp-surface0); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-selection-toolbar-actions button:first-child { color:var(--ctp-mauve); background:color-mix(in srgb,var(--ctp-mauve) 10%,transparent); }
      #${PANEL_ID} .bsb-knowledge-anchor-mark { padding:0 .08em; border-radius:4px; background:color-mix(in srgb,var(--ctp-mauve) 17%,transparent); color:inherit; text-decoration:underline; text-decoration-color:color-mix(in srgb,var(--ctp-mauve) 72%,transparent); text-decoration-thickness:1.5px; text-underline-offset:3px; cursor:pointer; }
      #${PANEL_ID} .bsb-knowledge-anchor-mark:hover { background:color-mix(in srgb,var(--ctp-mauve) 28%,transparent); }
      #${PANEL_ID} .bsb-preprocess-block.has-knowledge::after { content:""; position:absolute; top:11px; right:10px; width:6px; height:6px; border-radius:50%; background:var(--ctp-mauve); box-shadow:0 0 10px color-mix(in srgb,var(--ctp-mauve) 55%,transparent); }

      #${PANEL_ID} .bsb-knowledge-rail {
        position:absolute; z-index:43; top:0; right:0; bottom:0; width:min(390px,44%); transform:translateX(102%);
        display:flex; flex-direction:column; overflow:hidden; border-left:1px solid color-mix(in srgb,var(--ctp-mauve) 22%,var(--ctp-surface0));
        background:color-mix(in srgb,var(--ctp-base) 97%,transparent); box-shadow:-18px 0 42px rgba(0,0,0,.30); transition:transform .19s ease;
      }
      #${PANEL_ID} .bsb-knowledge-rail.open { transform:translateX(0); }
      #${PANEL_ID} [data-view-panel="ai"].knowledge-open .bsb-ai-commandbar,
      #${PANEL_ID} [data-view-panel="ai"].knowledge-open .bsb-preprocess-nav,
      #${PANEL_ID} [data-view-panel="ai"].knowledge-open .bsb-output-nav,
      #${PANEL_ID} [data-view-panel="ai"].knowledge-open .bsb-ai-canvas-wrap { margin-right:min(390px,44%); }
      #${PANEL_ID} .bsb-knowledge-rail-head { flex:0 0 auto; display:flex; align-items:flex-start; gap:10px; padding:13px 12px 11px 14px; border-bottom:1px solid var(--ctp-surface0); background:linear-gradient(180deg,color-mix(in srgb,var(--ctp-mauve) 7%,transparent),transparent); }
      #${PANEL_ID} .bsb-knowledge-anchor-title { flex:1 1 auto; min-width:0; }
      #${PANEL_ID} .bsb-knowledge-kicker { display:block; color:var(--ctp-overlay1); font-size:8px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
      #${PANEL_ID} .bsb-knowledge-anchor-title strong { display:block; margin-top:3px; color:var(--ctp-text); font-size:14px; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      #${PANEL_ID} .bsb-knowledge-anchor-title small { display:block; margin-top:3px; color:var(--ctp-overlay1); font-size:9.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #${PANEL_ID} .bsb-knowledge-rail-actions { display:flex; gap:3px; }
      #${PANEL_ID} .bsb-knowledge-rail-actions .active { color:var(--ctp-mauve); background:color-mix(in srgb,var(--ctp-mauve) 12%,var(--ctp-surface0)); }
      #${PANEL_ID} .bsb-knowledge-rail-body { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; }
      #${PANEL_ID} .bsb-knowledge-crumbs { flex:0 0 auto; min-height:28px; display:flex; align-items:center; gap:4px; overflow-x:auto; padding:5px 12px; border-bottom:1px solid color-mix(in srgb,var(--ctp-surface0) 75%,transparent); scrollbar-width:none; }
      #${PANEL_ID} .bsb-knowledge-crumbs button { flex:0 0 auto; max-width:145px; border:0; background:transparent; color:var(--ctp-overlay1); cursor:pointer; font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:2px 3px; }
      #${PANEL_ID} .bsb-knowledge-crumbs button:last-of-type { color:var(--ctp-subtext1); }
      #${PANEL_ID} .bsb-knowledge-crumbs span { color:var(--ctp-surface2); }
      #${PANEL_ID} .bsb-knowledge-panel-main { flex:1 1 auto; min-height:0; overflow:auto; padding:14px 16px 18px; }
      #${PANEL_ID} .bsb-knowledge-question-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      #${PANEL_ID} .bsb-knowledge-question-meta > span { color:var(--ctp-overlay1); font-size:8.5px; font-weight:850; letter-spacing:.08em; }
      #${PANEL_ID} .bsb-knowledge-node-star { width:28px; height:28px; display:grid; place-items:center; border:0; border-radius:8px; background:transparent; color:var(--ctp-overlay1); cursor:pointer; font-size:15px; line-height:1; }
      #${PANEL_ID} .bsb-knowledge-node-star:hover { background:var(--ctp-surface0); color:var(--ctp-yellow); }
      #${PANEL_ID} .bsb-knowledge-node-star.active { color:var(--ctp-yellow); background:color-mix(in srgb,var(--ctp-yellow) 9%,transparent); }
      #${PANEL_ID} .bsb-knowledge-question h3 { margin:5px 0 13px; color:var(--ctp-text); font-size:16px; line-height:1.45; }
      #${PANEL_ID} .bsb-knowledge-answer { color:var(--ctp-text); font-size:calc(var(--bsb-note-font) * .83); line-height:1.75; }
      #${PANEL_ID} .bsb-knowledge-answer.streaming::after { content:""; display:inline-block; width:7px; height:13px; margin-left:4px; vertical-align:-2px; border-radius:2px; background:var(--ctp-mauve); animation:bsb-pulse 1s ease-in-out infinite; }
      #${PANEL_ID} .bsb-knowledge-answer h1,#${PANEL_ID} .bsb-knowledge-answer h2,#${PANEL_ID} .bsb-knowledge-answer h3 { margin:15px 0 7px; font-size:1em; color:var(--ctp-lavender); }
      #${PANEL_ID} .bsb-knowledge-answer p { margin:7px 0; }
      #${PANEL_ID} .bsb-knowledge-answer ul,#${PANEL_ID} .bsb-knowledge-answer ol { padding-left:20px; }
      #${PANEL_ID} .bsb-knowledge-thinking { color:var(--ctp-overlay1); }
      #${PANEL_ID} .bsb-knowledge-suggestions { margin-top:20px; padding-top:13px; border-top:1px solid var(--ctp-surface0); }
      #${PANEL_ID} .bsb-knowledge-suggestions button { width:100%; display:flex; gap:7px; align-items:flex-start; border:0; border-radius:8px; padding:7px 5px; background:transparent; color:var(--ctp-subtext1); cursor:pointer; text-align:left; line-height:1.45; font-size:10.5px; }
      #${PANEL_ID} .bsb-knowledge-suggestions button:hover { background:var(--ctp-surface0); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-knowledge-suggestions button span { color:var(--ctp-mauve); }
      #${PANEL_ID} .bsb-knowledge-composer { flex:0 0 auto; padding:9px 10px 10px; border-top:1px solid var(--ctp-surface0); background:color-mix(in srgb,var(--ctp-mantle) 68%,transparent); }
      #${PANEL_ID} .bsb-knowledge-composer textarea { width:100%; min-height:58px; max-height:130px; resize:vertical; box-sizing:border-box; border:1px solid var(--ctp-surface1); border-radius:11px; padding:9px 10px; background:var(--ctp-base); color:var(--ctp-text); outline:none; font:inherit; line-height:1.5; }
      #${PANEL_ID} .bsb-knowledge-composer textarea:focus { border-color:color-mix(in srgb,var(--ctp-mauve) 62%,var(--ctp-surface1)); box-shadow:0 0 0 3px color-mix(in srgb,var(--ctp-mauve) 10%,transparent); }
      #${PANEL_ID} .bsb-knowledge-compose-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:7px; }
      #${PANEL_ID} .bsb-knowledge-model { min-width:0; display:flex; align-items:center; gap:5px; color:var(--ctp-overlay1); font-size:9px; }
      #${PANEL_ID} .bsb-knowledge-model select { max-width:170px; height:28px; border:1px solid var(--ctp-surface1); border-radius:8px; background:var(--ctp-base); color:var(--ctp-subtext1); padding:0 24px 0 7px; outline:none; }
      #${PANEL_ID} .bsb-knowledge-welcome { min-height:220px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:var(--ctp-overlay1); }
      #${PANEL_ID} .bsb-knowledge-welcome strong { color:var(--ctp-text); margin-top:8px; font-size:14px; }
      #${PANEL_ID} .bsb-knowledge-welcome span { max-width:260px; margin-top:6px; font-size:10px; line-height:1.55; }
      #${PANEL_ID} .bsb-knowledge-welcome button { margin-top:14px; border:1px solid color-mix(in srgb,var(--ctp-mauve) 30%,var(--ctp-surface1)); border-radius:9px; padding:7px 11px; background:color-mix(in srgb,var(--ctp-mauve) 10%,transparent); color:var(--ctp-mauve); cursor:pointer; }
      #${PANEL_ID} .bsb-knowledge-orb { width:36px; height:36px; display:grid; place-items:center; border-radius:12px; background:color-mix(in srgb,var(--ctp-mauve) 14%,var(--ctp-surface0)); color:var(--ctp-mauve); font-size:17px; }
      #${PANEL_ID} .bsb-knowledge-tree { display:flex; flex-direction:column; gap:2px; }
      #${PANEL_ID} .bsb-knowledge-tree-node > button { width:100%; display:grid; grid-template-columns:14px minmax(0,1fr) auto; gap:5px; align-items:start; padding:6px 7px 6px calc(7px + var(--depth) * 13px); border:1px solid transparent; border-radius:8px; background:transparent; color:var(--ctp-subtext0); cursor:pointer; text-align:left; font-size:10px; line-height:1.35; }
      #${PANEL_ID} .bsb-knowledge-tree-node > button:hover { background:var(--ctp-surface0); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-knowledge-tree-node > button.active { border-color:color-mix(in srgb,var(--ctp-mauve) 28%,transparent); background:color-mix(in srgb,var(--ctp-mauve) 9%,var(--ctp-surface0)); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-knowledge-tree-branch { color:var(--ctp-overlay0); }
      #${PANEL_ID} .bsb-knowledge-star { color:var(--ctp-yellow); font-size:9px; }
      #${PANEL_ID} .bsb-knowledge-empty-small { padding:12px; color:var(--ctp-overlay1); font-size:10px; text-align:center; }
      #${PANEL_ID} .bsb-knowledge-rail-empty { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; padding:24px; color:var(--ctp-overlay1); text-align:center; }
      #${PANEL_ID} .bsb-knowledge-rail-empty > span { color:var(--ctp-mauve); font-size:26px; }
      #${PANEL_ID} .bsb-knowledge-rail-empty strong { color:var(--ctp-text); font-size:15px; }
      #${PANEL_ID} .bsb-knowledge-rail-empty p { max-width:260px; font-size:10.5px; line-height:1.55; }

      #${PANEL_ID} [data-view-panel="knowledge"] { min-height:0; }
      #${PANEL_ID} .bsb-knowledge-workspace { height:100%; min-height:0; display:flex; flex-direction:column; }
      #${PANEL_ID} .bsb-knowledge-topbar { flex:0 0 auto; display:flex; align-items:center; gap:9px; padding:8px 10px; border-bottom:1px solid var(--ctp-surface0); }
      #${PANEL_ID} .bsb-knowledge-search { flex:1 1 auto; display:flex; align-items:center; gap:7px; border:1px solid var(--ctp-surface1); border-radius:10px; padding:0 10px; background:var(--ctp-mantle); }
      #${PANEL_ID} .bsb-knowledge-search input { width:100%; height:34px; border:0; outline:none; background:transparent; color:var(--ctp-text); }
      #${PANEL_ID} .bsb-knowledge-count { color:var(--ctp-overlay1); font-size:9.5px; }
      #${PANEL_ID} .bsb-knowledge-master-detail { flex:1 1 auto; min-height:0; display:grid; grid-template-columns:minmax(190px,29%) minmax(0,1fr); }
      #${PANEL_ID} .bsb-knowledge-library { min-height:0; overflow:auto; padding:7px; border-right:1px solid var(--ctp-surface0); }
      #${PANEL_ID} .bsb-knowledge-list-item { width:100%; display:grid; grid-template-columns:8px minmax(0,1fr) auto; gap:7px; align-items:start; padding:9px 8px; border:1px solid transparent; border-radius:10px; background:transparent; color:var(--ctp-text); cursor:pointer; text-align:left; }
      #${PANEL_ID} .bsb-knowledge-list-item:hover { background:var(--ctp-surface0); }
      #${PANEL_ID} .bsb-knowledge-list-item.active { border-color:color-mix(in srgb,var(--ctp-mauve) 32%,transparent); background:color-mix(in srgb,var(--ctp-mauve) 9%,var(--ctp-surface0)); }
      #${PANEL_ID} .bsb-knowledge-list-dot { width:6px; height:6px; margin-top:5px; border-radius:50%; background:var(--ctp-mauve); }
      #${PANEL_ID} .bsb-knowledge-list-main { min-width:0; }
      #${PANEL_ID} .bsb-knowledge-list-main strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }
      #${PANEL_ID} .bsb-knowledge-list-main small { display:block; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--ctp-overlay1); font-size:8.8px; }
      #${PANEL_ID} .bsb-knowledge-library-empty { padding:24px 12px; color:var(--ctp-overlay1); text-align:center; font-size:10px; line-height:1.6; }
      #${PANEL_ID} .bsb-knowledge-detail { min-width:0; min-height:0; display:flex; flex-direction:column; overflow:hidden; }
      #${PANEL_ID} .bsb-knowledge-workspace-head { flex:0 0 auto; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:15px 16px 12px; border-bottom:1px solid var(--ctp-surface0); }
      #${PANEL_ID} .bsb-knowledge-workspace-head h2 { margin:3px 0 0; color:var(--ctp-text); font-size:17px; line-height:1.35; }
      #${PANEL_ID} .bsb-knowledge-workspace-head p { margin:4px 0 0; color:var(--ctp-overlay1); font-size:9.5px; }
      #${PANEL_ID} .bsb-knowledge-workspace-head > div:last-child { display:flex; gap:5px; }
      #${PANEL_ID} .bsb-knowledge-workspace-head [data-knowledge-star-anchor].active { color:var(--ctp-yellow); border-color:color-mix(in srgb,var(--ctp-yellow) 30%,var(--ctp-surface1)); background:color-mix(in srgb,var(--ctp-yellow) 8%,transparent); }
      #${PANEL_ID} .bsb-knowledge-workspace-body { flex:1 1 auto; min-height:0; display:grid; grid-template-columns:minmax(170px,30%) minmax(0,1fr); }
      #${PANEL_ID} .bsb-knowledge-tree-pane { min-height:0; overflow:auto; padding:12px 8px; border-right:1px solid var(--ctp-surface0); }
      #${PANEL_ID} .bsb-knowledge-tree-pane > .bsb-knowledge-kicker { padding:0 7px 8px; }
      #${PANEL_ID} .bsb-knowledge-detail-pane { min-height:0; display:flex; flex-direction:column; overflow:hidden; }
      #${PANEL_ID} .bsb-knowledge-detail-pane .bsb-knowledge-panel-main { padding:18px 20px; }
      #${PANEL_ID} .bsb-knowledge-detail-pane .bsb-knowledge-crumbs { padding-left:16px; }
      #${PANEL_ID} .bsb-knowledge-detail-pane .bsb-knowledge-composer { padding:10px 16px 13px; }
      #${PANEL_ID}[data-panel-size="small"] [data-view-panel="ai"].knowledge-open .bsb-ai-commandbar,
      #${PANEL_ID}[data-panel-size="small"] [data-view-panel="ai"].knowledge-open .bsb-preprocess-nav,
      #${PANEL_ID}[data-panel-size="small"] [data-view-panel="ai"].knowledge-open .bsb-output-nav,
      #${PANEL_ID}[data-panel-size="small"] [data-view-panel="ai"].knowledge-open .bsb-ai-canvas-wrap { margin-right:0; visibility:hidden; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-rail { width:100%; }
      #${PANEL_ID} .bsb-knowledge-mobile-back { display:none; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-master-detail { position:relative; grid-template-columns:1fr; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-library { border-right:0; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-detail { display:none; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-workspace.detail-open .bsb-knowledge-library { display:none; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-workspace.detail-open .bsb-knowledge-detail { display:flex; position:absolute; inset:0; z-index:2; background:var(--ctp-base); }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-mobile-back { display:inline-flex; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-workspace-body { grid-template-columns:1fr; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-knowledge-tree-pane { max-height:34%; border-right:0; border-bottom:1px solid var(--ctp-surface0); }
      #${PANEL_ID} [hidden] { display:none !important; }
      #${PANEL_ID} .bsb-output-nav { flex:0 0 auto; border-bottom:1px solid var(--ctp-surface0); background:color-mix(in srgb,var(--ctp-mantle) 78%,transparent); }
      #${PANEL_ID} .bsb-output-tabs { display:flex; gap:3px; overflow-x:auto; padding:6px 8px 3px; scrollbar-width:thin; }
      #${PANEL_ID} .bsb-output-tab {
        display:inline-flex; align-items:center; gap:6px; max-width:220px; flex:0 0 auto;
        border:0; border-radius:9px 9px 5px 5px; padding:7px 10px; background:transparent;
        color:var(--ctp-subtext0); cursor:pointer; font-size:11.5px; font-weight:750;
      }
      #${PANEL_ID} .bsb-output-tab:hover { background:var(--ctp-surface0); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-output-tab.active { color:var(--ctp-text); background:var(--ctp-surface0); box-shadow:inset 0 -2px 0 var(--ctp-mauve); }
      #${PANEL_ID} .bsb-output-tab .dot { width:7px; height:7px; border-radius:50%; background:var(--ctp-overlay0); flex:0 0 auto; }
      #${PANEL_ID} .bsb-output-tab.running .dot { background:var(--ctp-green); animation:bsb-pulse 1.1s ease-in-out infinite; }
      #${PANEL_ID} .bsb-output-tab.done .dot { background:var(--ctp-teal); }
      #${PANEL_ID} .bsb-output-tab.error .dot { background:var(--ctp-red); }
      #${PANEL_ID} .bsb-output-tab.stopped .dot { background:var(--ctp-peach); }
      #${PANEL_ID} .bsb-output-tab .name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      #${PANEL_ID} .bsb-output-tab .count { color:var(--ctp-overlay1); font-size:9.5px; font-weight:700; }
      #${PANEL_ID} .bsb-model-tabs { min-height:32px; display:flex; align-items:center; gap:4px; overflow-x:auto; padding:3px 8px 6px; }
      #${PANEL_ID} .bsb-model-tab {
        display:inline-flex; align-items:center; gap:5px; flex:0 0 auto; max-width:190px;
        border:1px solid transparent; border-radius:999px; padding:4px 9px; background:transparent;
        color:var(--ctp-overlay1); cursor:pointer; font-size:10.5px;
      }
      #${PANEL_ID} .bsb-model-tab:hover { color:var(--ctp-text); background:var(--ctp-surface0); }
      #${PANEL_ID} .bsb-model-tab.active { color:var(--ctp-text); border-color:var(--ctp-surface2); background:var(--ctp-surface1); }
      #${PANEL_ID} .bsb-model-tab .dot { width:6px; height:6px; border-radius:50%; background:var(--ctp-overlay0); }
      #${PANEL_ID} .bsb-model-tab.running .dot { background:var(--ctp-green); animation:bsb-pulse 1.1s ease-in-out infinite; }
      #${PANEL_ID} .bsb-model-tab.done .dot { background:var(--ctp-teal); }
      #${PANEL_ID} .bsb-model-tab.error .dot { background:var(--ctp-red); }
      #${PANEL_ID} .bsb-model-tab.stopped .dot { background:var(--ctp-peach); }
      #${PANEL_ID} .bsb-ai-drawer-backdrop { position:absolute; inset:0; z-index:44; background:rgba(10,10,18,.34); backdrop-filter:blur(1.5px); }
      #${PANEL_ID} .bsb-ai-drawer {
        position:absolute; z-index:45; top:0; right:0; bottom:0; width:min(520px,92%); transform:translateX(102%);
        display:flex; flex-direction:column; overflow:hidden; border-left:1px solid var(--ctp-surface1);
        background:color-mix(in srgb,var(--ctp-base) 96%,transparent); box-shadow:-18px 0 42px rgba(0,0,0,.28);
        transition:transform .18s ease;
      }
      #${PANEL_ID} .bsb-ai-drawer.open { transform:translateX(0); }
      #${PANEL_ID} .bsb-ai-input-drawer { width:min(620px,94%); }
      #${PANEL_ID} .bsb-drawer-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:14px 16px 11px; border-bottom:1px solid var(--ctp-surface0); }
      #${PANEL_ID} .bsb-drawer-title { min-width:0; }
      #${PANEL_ID} .bsb-drawer-title strong { display:block; font-size:14px; }
      #${PANEL_ID} .bsb-drawer-title span { display:block; margin-top:2px; color:var(--ctp-overlay1); font-size:10.5px; }
      #${PANEL_ID} .bsb-drawer-body { flex:1 1 auto; min-height:0; overflow:auto; padding:12px 14px 18px; }
      /* Flow controls — visually quiet, native semantics underneath. */
      #${PANEL_ID} .bsb-flow-section {
        padding:14px; margin-bottom:10px; border-radius:15px;
        border:1px solid color-mix(in srgb,var(--ctp-surface1) 58%,transparent);
        background:linear-gradient(180deg,color-mix(in srgb,var(--ctp-mantle) 92%,transparent),color-mix(in srgb,var(--ctp-base) 72%,transparent));
        box-shadow:0 1px 0 color-mix(in srgb,var(--ctp-text) 3%,transparent) inset;
      }
      #${PANEL_ID} .bsb-flow-section-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
      #${PANEL_ID} .bsb-flow-section-head > div { min-width:0; }
      #${PANEL_ID} .bsb-flow-section-head strong { display:block; font-size:12.5px; line-height:1.2; letter-spacing:.01em; }
      #${PANEL_ID} .bsb-flow-section-head span { display:block; margin-top:3px; color:var(--ctp-overlay1); font-size:10px; line-height:1.35; }
      #${PANEL_ID} .bsb-flow-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; }
      #${PANEL_ID} .bsb-flow-field { min-width:0; display:flex; flex-direction:column; gap:6px; }
      #${PANEL_ID} .bsb-flow-label { color:var(--ctp-subtext0); font-size:10px; font-weight:700; letter-spacing:.02em; }

      #${PANEL_ID} .bsb-flow-select {
        position:relative; min-width:0; height:38px; border-radius:11px;
        border:1px solid color-mix(in srgb,var(--ctp-surface2) 58%,transparent);
        background:color-mix(in srgb,var(--ctp-base) 66%,transparent);
        transition:border-color .14s ease,background .14s ease,box-shadow .14s ease;
      }
      #${PANEL_ID} .bsb-flow-select:hover { border-color:color-mix(in srgb,var(--ctp-overlay0) 64%,transparent); background:color-mix(in srgb,var(--ctp-base) 82%,transparent); }
      #${PANEL_ID} .bsb-flow-select:focus-within { border-color:color-mix(in srgb,var(--ctp-blue) 68%,transparent); box-shadow:0 0 0 3px color-mix(in srgb,var(--ctp-blue) 13%,transparent); }
      #${PANEL_ID} .bsb-flow-select select {
        appearance:none; -webkit-appearance:none; width:100%; height:100%; min-width:0; border:0!important; outline:0!important;
        padding:0 34px 0 11px!important; border-radius:inherit; background:transparent!important; box-shadow:none!important;
        color:var(--ctp-text); font:inherit; font-size:11.5px; font-weight:650; cursor:pointer;
      }
      #${PANEL_ID} .bsb-flow-select select:disabled { cursor:not-allowed; color:var(--ctp-overlay0); }
      #${PANEL_ID} .bsb-flow-select:has(select:disabled) { opacity:.46; }
      #${PANEL_ID} .bsb-flow-select-icon {
        pointer-events:none; position:absolute; right:11px; top:50%; transform:translateY(-54%);
        color:var(--ctp-overlay1); font-size:15px; font-weight:800; line-height:1;
      }

      #${PANEL_ID} .bsb-flow-stepper {
        height:38px; display:grid; grid-template-columns:34px minmax(0,1fr) 34px; align-items:stretch;
        overflow:hidden; border-radius:11px; border:1px solid color-mix(in srgb,var(--ctp-surface2) 58%,transparent);
        background:color-mix(in srgb,var(--ctp-base) 66%,transparent);
        transition:border-color .14s ease,box-shadow .14s ease;
      }
      #${PANEL_ID} .bsb-flow-stepper:focus-within { border-color:color-mix(in srgb,var(--ctp-blue) 68%,transparent); box-shadow:0 0 0 3px color-mix(in srgb,var(--ctp-blue) 13%,transparent); }
      #${PANEL_ID} .bsb-flow-stepper.disabled { opacity:.46; }
      #${PANEL_ID} .bsb-flow-stepper > button {
        width:34px; border:0; background:transparent; color:var(--ctp-subtext0); cursor:pointer;
        font:700 17px/1 ui-sans-serif,system-ui,sans-serif; transition:background .12s ease,color .12s ease;
      }
      #${PANEL_ID} .bsb-flow-stepper > button:first-child { border-right:1px solid color-mix(in srgb,var(--ctp-surface1) 70%,transparent); }
      #${PANEL_ID} .bsb-flow-stepper > button:last-child { border-left:1px solid color-mix(in srgb,var(--ctp-surface1) 70%,transparent); }
      #${PANEL_ID} .bsb-flow-stepper > button:hover:not(:disabled) { background:var(--ctp-surface0); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-flow-stepper > button:active:not(:disabled) { background:var(--ctp-surface1); }
      #${PANEL_ID} .bsb-flow-stepper > button:disabled { cursor:not-allowed; }
      #${PANEL_ID} .bsb-flow-stepper-value { min-width:0; display:flex; align-items:center; justify-content:center; gap:5px; padding:0 5px; }
      #${PANEL_ID} .bsb-flow-stepper input[type="number"] {
        width:100%; min-width:0; height:100%; padding:0; border:0!important; outline:0!important; background:transparent!important; box-shadow:none!important;
        color:var(--ctp-text); text-align:center; font:750 11.5px/1 ui-sans-serif,system-ui,sans-serif; appearance:textfield; -moz-appearance:textfield;
      }
      #${PANEL_ID} .bsb-flow-stepper input[type="number"]::-webkit-inner-spin-button,
      #${PANEL_ID} .bsb-flow-stepper input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
      #${PANEL_ID} .bsb-flow-stepper-unit { flex:0 0 auto; color:var(--ctp-overlay1); font-size:9.5px; font-weight:650; white-space:nowrap; }

      #${PANEL_ID} .bsb-flow-switch { display:inline-flex; align-items:center; gap:7px; cursor:pointer; user-select:none; }
      #${PANEL_ID} .bsb-flow-switch input { position:absolute; opacity:0; pointer-events:none; }
      #${PANEL_ID} .bsb-flow-switch-track {
        width:34px; height:20px; padding:2px; box-sizing:border-box; border-radius:999px;
        background:var(--ctp-surface1); border:1px solid color-mix(in srgb,var(--ctp-surface2) 70%,transparent);
        transition:background .16s ease,border-color .16s ease,box-shadow .16s ease;
      }
      #${PANEL_ID} .bsb-flow-switch-track::after {
        content:""; display:block; width:14px; height:14px; border-radius:50%; background:var(--ctp-subtext0);
        box-shadow:0 1px 3px rgba(0,0,0,.28); transition:transform .16s ease,background .16s ease;
      }
      #${PANEL_ID} .bsb-flow-switch input:checked + .bsb-flow-switch-track { background:color-mix(in srgb,var(--ctp-green) 72%,var(--ctp-surface1)); border-color:color-mix(in srgb,var(--ctp-green) 72%,transparent); }
      #${PANEL_ID} .bsb-flow-switch input:checked + .bsb-flow-switch-track::after { transform:translateX(14px); background:var(--ctp-base); }
      #${PANEL_ID} .bsb-flow-switch input:focus-visible + .bsb-flow-switch-track { box-shadow:0 0 0 3px color-mix(in srgb,var(--ctp-green) 16%,transparent); }
      #${PANEL_ID} .bsb-flow-switch-text { color:var(--ctp-subtext0); font-size:10px; font-weight:750; }

      #${PANEL_ID} .bsb-flow-advanced { margin-top:11px; padding-top:9px; border-top:1px solid color-mix(in srgb,var(--ctp-surface1) 70%,transparent); }
      #${PANEL_ID} .bsb-flow-advanced > summary {
        list-style:none; display:flex; align-items:center; gap:7px; cursor:pointer; color:var(--ctp-subtext0);
        font-size:10.5px; font-weight:700; user-select:none; outline:none;
      }
      #${PANEL_ID} .bsb-flow-advanced > summary::-webkit-details-marker { display:none; }
      #${PANEL_ID} .bsb-flow-advanced > summary::before { content:"›"; color:var(--ctp-overlay1); font-size:16px; line-height:1; transition:transform .14s ease; }
      #${PANEL_ID} .bsb-flow-advanced[open] > summary::before { transform:rotate(90deg); }
      #${PANEL_ID} .bsb-flow-advanced .bsb-flow-grid { margin-top:10px; }

      #${PANEL_ID} .bsb-output-task-card {
        padding:11px; margin-top:8px; border-radius:13px; border:1px solid color-mix(in srgb,var(--ctp-surface1) 64%,transparent);
        background:color-mix(in srgb,var(--ctp-base) 52%,transparent);
      }
      #${PANEL_ID} .bsb-output-task-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
      #${PANEL_ID} .bsb-output-task-index { width:24px; height:24px; display:grid; place-items:center; flex:0 0 auto; border-radius:8px; background:var(--ctp-surface0); color:var(--ctp-overlay1); font-size:9.5px; font-weight:850; }
      #${PANEL_ID} .bsb-output-task-name { flex:1 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11.5px; font-weight:800; }
      #${PANEL_ID} .bsb-model-picks { display:flex; flex-wrap:wrap; gap:6px; margin-top:7px; }
      #${PANEL_ID} .bsb-model-pick {
        position:relative; display:inline-flex; align-items:center; gap:6px; min-height:30px; padding:0 9px;
        border:1px solid color-mix(in srgb,var(--ctp-surface1) 75%,transparent); border-radius:999px;
        background:color-mix(in srgb,var(--ctp-base) 42%,transparent); color:var(--ctp-subtext0); font-size:10px; font-weight:650; cursor:pointer;
        transition:background .12s ease,border-color .12s ease,color .12s ease;
      }
      #${PANEL_ID} .bsb-model-pick:hover { border-color:var(--ctp-surface2); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-model-pick::before { content:""; width:12px; height:12px; display:grid; place-items:center; border:1px solid var(--ctp-overlay0); border-radius:4px; box-sizing:border-box; font-size:8px; font-weight:900; }
      #${PANEL_ID} .bsb-model-pick:has(input:checked) { color:var(--ctp-text); border-color:color-mix(in srgb,var(--ctp-blue) 56%,var(--ctp-surface1)); background:color-mix(in srgb,var(--ctp-blue) 12%,transparent); }
      #${PANEL_ID} .bsb-model-pick:has(input:checked)::before { content:"✓"; color:var(--ctp-base); border-color:var(--ctp-blue); background:var(--ctp-blue); }
      #${PANEL_ID} .bsb-model-pick input { position:absolute; opacity:0; pointer-events:none; }
      #${PANEL_ID} .bsb-input-tabs { display:inline-flex; gap:3px; padding:3px; border:1px solid var(--ctp-surface0); border-radius:9px; background:var(--ctp-mantle); }
      #${PANEL_ID} .bsb-input-tabs button { border:0; border-radius:7px; padding:5px 9px; background:transparent; color:var(--ctp-overlay1); cursor:pointer; font-size:10.5px; }
      #${PANEL_ID} .bsb-input-tabs button.active { background:var(--ctp-surface1); color:var(--ctp-text); }
      #${PANEL_ID} .bsb-input-preview { margin:10px 0 0; white-space:pre-wrap; word-break:break-word; font:11px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace; color:var(--ctp-subtext1); }
      #${PANEL_ID} .bsb-input-empty { padding:28px 12px; text-align:center; color:var(--ctp-overlay1); font-size:11px; line-height:1.6; }
      #${PANEL_ID} .bsb-settings-tabs {
        flex: 0 0 auto;
        display: inline-flex; align-self: flex-start; gap: 4px;
        padding: 4px; border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 52%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 58%, transparent);
      }
      #${PANEL_ID} .bsb-settings-tabs button {
        min-width: 92px; height: 32px; padding: 0 16px;
        border-radius: 9px; border: 0; background: transparent;
        color: var(--ctp-subtext0); font-weight: 800; font-size: 12px; cursor: pointer;
      }
      #${PANEL_ID} .bsb-settings-tabs button.active {
        color: var(--ctp-text);
        background: color-mix(in srgb, var(--ctp-surface1) 72%, transparent);
        box-shadow: 0 1px 7px color-mix(in srgb, var(--ctp-crust) 35%, transparent);
      }
      #${PANEL_ID} .bsb-settings-pane { display: none; flex: 1 1 auto; min-height: 0; }
      #${PANEL_ID} .bsb-settings-pane.active { display: block; }
      #${PANEL_ID} .bsb-config-master-detail {
        height: 100%; min-height: 0;
        display: grid; grid-template-columns: minmax(190px, 230px) minmax(0, 1fr); gap: 10px;
      }
      #${PANEL_ID} .bsb-config-sidebar,
      #${PANEL_ID} .bsb-config-editor-shell {
        min-height: 0; border-radius: 14px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface1) 48%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 43%, transparent);
      }
      #${PANEL_ID} .bsb-config-sidebar {
        display: flex; flex-direction: column; overflow: hidden;
      }
      #${PANEL_ID} .bsb-config-sidebar-head { padding: 10px; display: grid; gap: 8px; }
      #${PANEL_ID} .bsb-config-search {
        display: flex; align-items: center; gap: 7px; padding: 0 9px; height: 34px;
        border-radius: 9px; border: 1px solid color-mix(in srgb, var(--ctp-surface2) 52%, transparent);
        background: color-mix(in srgb, var(--ctp-base) 55%, transparent); color: var(--ctp-overlay1);
      }
      #${PANEL_ID} .bsb-config-search input {
        width: 100%; min-width: 0; border: 0; outline: 0; padding: 0; background: transparent;
        color: var(--ctp-text); font: inherit; font-size: 12px;
      }
      #${PANEL_ID} .bsb-config-create { width: 100%; justify-content: center; }
      #${PANEL_ID} .bsb-config-list {
        flex: 1 1 auto; min-height: 0; overflow: auto; padding: 2px 7px 8px;
        display: flex; flex-direction: column; gap: 4px;
      }
      #${PANEL_ID} .bsb-config-list-item {
        width: 100%; text-align: left; border: 1px solid transparent; cursor: pointer;
        padding: 9px 9px; border-radius: 10px; background: transparent; color: var(--ctp-text);
        display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; column-gap: 7px; row-gap: 2px;
      }
      #${PANEL_ID} .bsb-config-list-item:hover { background: color-mix(in srgb, var(--ctp-surface0) 55%, transparent); }
      #${PANEL_ID} .bsb-config-list-item.selected {
        border-color: color-mix(in srgb, var(--ctp-blue) 38%, transparent);
        background: color-mix(in srgb, var(--ctp-blue) 12%, var(--ctp-surface0));
      }
      #${PANEL_ID} .bsb-config-dot {
        width: 7px; height: 7px; margin-top: 5px; border-radius: 50%;
        background: var(--ctp-overlay0); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ctp-overlay0) 18%, transparent);
      }
      #${PANEL_ID} .bsb-config-dot.current,
      #${PANEL_ID} .bsb-config-dot.enabled { background: var(--ctp-green); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ctp-green) 18%, transparent); }
      #${PANEL_ID} .bsb-config-item-main { min-width: 0; }
      #${PANEL_ID} .bsb-config-item-name { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11.5px; font-weight:750; }
      #${PANEL_ID} .bsb-config-item-sub { display:block; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--ctp-overlay1); font-size:10px; }
      #${PANEL_ID} .bsb-config-badge {
        align-self: start; padding: 2px 5px; border-radius: 999px; font-size: 9px; line-height: 1.3;
        color: var(--ctp-green); background: color-mix(in srgb, var(--ctp-green) 12%, transparent);
      }
      #${PANEL_ID} .bsb-config-sidebar-foot {
        flex: 0 0 auto; padding: 8px; border-top: 1px solid color-mix(in srgb, var(--ctp-surface0) 58%, transparent);
      }
      #${PANEL_ID} .bsb-config-sidebar-foot button { width: 100%; }
      #${PANEL_ID} .bsb-config-editor-shell { overflow: auto; padding: 12px 14px; }
      #${PANEL_ID} .bsb-config-editor-empty {
        height: 100%; min-height: 260px; display:flex; align-items:center; justify-content:center; text-align:center;
        color: var(--ctp-overlay1); font-size:12px; line-height:1.6;
      }
      #${PANEL_ID} .bsb-config-editor-head {
        display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:12px;
      }
      #${PANEL_ID} .bsb-config-editor-title { min-width:0; }
      #${PANEL_ID} .bsb-config-editor-title strong { display:block; font-size:14px; color:var(--ctp-text); }
      #${PANEL_ID} .bsb-config-editor-title span { display:block; margin-top:3px; font-size:10.5px; color:var(--ctp-overlay1); line-height:1.45; }
      #${PANEL_ID} .bsb-config-editor-actions { display:flex; gap:5px; flex-wrap:wrap; justify-content:flex-end; }
      #${PANEL_ID} .bsb-config-editor-actions button { height:28px; padding:0 8px; font-size:10.5px; border-radius:8px; }
      #${PANEL_ID} .bsb-config-editor-shell textarea[data-prompt-field="systemPrompt"] { min-height: 300px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11.5px; }
      #${PANEL_ID} .bsb-config-editor-shell textarea[data-prompt-field="userPromptTemplate"] { min-height: 220px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11.5px; }
      #${PANEL_ID} .bsb-config-list-empty { padding:16px 8px; color:var(--ctp-overlay1); font-size:11px; text-align:center; line-height:1.5; }
      @media (max-width: 720px) {
        #${PANEL_ID} .bsb-config-master-detail { grid-template-columns: minmax(150px, 185px) minmax(0, 1fr); }
      }

      /* 底栏状态 */
      #${PANEL_ID} .bsb-statusbar {
        flex-shrink: 0;
        display: flex; align-items: center; gap: 8px;
        padding: 8px 14px 10px;
        border-top: 1px solid color-mix(in srgb, var(--ctp-surface0) 75%, transparent);
        background: color-mix(in srgb, var(--ctp-mantle) 50%, transparent);
        font-size: 11.5px; color: var(--ctp-subtext0);
        min-height: 36px;
      }
      #${PANEL_ID} .bsb-status-dot {
        width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        background: var(--ctp-overlay0);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ctp-overlay0) 20%, transparent);
      }
      #${PANEL_ID} .bsb-status-dot.ok {
        background: var(--ctp-green);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ctp-green) 22%, transparent);
      }
      #${PANEL_ID} .bsb-status-dot.err {
        background: var(--ctp-red);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ctp-red) 22%, transparent);
      }
      #${PANEL_ID} .bsb-status-dot.busy {
        background: var(--ctp-yellow);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ctp-yellow) 22%, transparent);
        animation: bsb-pulse 1.2s ease-in-out infinite;
      }
      @keyframes bsb-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.45; }
      }
      #${PANEL_ID} .bsb-status {
        flex: 1; min-width: 0; word-break: break-word; line-height: 1.35;
      }
      #${PANEL_ID} .bsb-status.ok { color: var(--ctp-green); }
      #${PANEL_ID} .bsb-status.err { color: var(--ctp-red); }

      /* 滚动条 */
      #${PANEL_ID} .bsb-list::-webkit-scrollbar,
      #${PANEL_ID} .bsb-ai-md::-webkit-scrollbar,
      #${PANEL_ID} .bsb-settings::-webkit-scrollbar { width: 8px; height: 8px; }
      #${PANEL_ID} .bsb-list::-webkit-scrollbar-thumb,
      #${PANEL_ID} .bsb-ai-md::-webkit-scrollbar-thumb,
      #${PANEL_ID} .bsb-settings::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, var(--ctp-surface2) 65%, transparent);
        border-radius: 8px;
      }
      #${PANEL_ID} .bsb-list::-webkit-scrollbar-thumb:hover,
      #${PANEL_ID} .bsb-ai-md::-webkit-scrollbar-thumb:hover {
        background: var(--ctp-overlay0);
      }

      /* ── v5.2 阅读优先布局：默认紧凑，专注模式铺满视口 ── */
      #${PANEL_ID} .bsb-view[data-view-panel="ai"] {
        gap: 6px;
        padding: 7px 8px 8px;
      }
      #${PANEL_ID} .bsb-ai-commandbar {
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex: 0 0 auto;
      }
      #${PANEL_ID} .bsb-ai-command-main {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #${PANEL_ID} .bsb-ai-mode-compact {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex: 0 0 auto;
        color: var(--ctp-subtext0);
        font-size: 10.5px;
        font-weight: 650;
      }
      #${PANEL_ID} .bsb-ai-mode-compact select {
        width: auto;
        max-width: 150px;
        height: 30px;
        padding: 0 25px 0 8px;
        border-radius: 9px;
        border: 1px solid color-mix(in srgb, var(--ctp-surface2) 55%, transparent);
        background: var(--ctp-mantle);
        color: var(--ctp-text);
        outline: none;
        font-size: 11px;
      }
      #${PANEL_ID} .bsb-ai-compact-stats {
        flex-wrap: nowrap;
        overflow: hidden;
        gap: 4px;
      }
      #${PANEL_ID} .bsb-ai-compact-stats .bsb-chip {
        height: 24px;
        padding: 0 7px;
        font-size: 10px;
        white-space: nowrap;
      }
      #${PANEL_ID} .bsb-mode-hint { display: none; }
      #${PANEL_ID} .bsb-ai-command-actions {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex: 0 0 auto;
      }
      #${PANEL_ID} .bsb-ai-command-actions .bsb-btn {
        height: 30px;
        padding: 0 10px;
        border-radius: 9px;
        font-size: 11px;
      }
      #${PANEL_ID} .bsb-ai-command-actions .bsb-btn.accent {
        height: 32px;
        padding-inline: 12px;
      }
      #${PANEL_ID} .bsb-ai-result-tabs {
        padding: 0 0 2px;
        gap: 5px;
      }
      #${PANEL_ID} .bsb-ai-result-tab {
        height: 30px;
        min-width: 96px;
        border-radius: 9px;
      }
      #${PANEL_ID} .bsb-ai-canvas-wrap {
        min-height: 320px;
        border-radius: 12px;
      }
      #${PANEL_ID} .bsb-ai-md {
        padding: 24px clamp(16px, 4vw, 44px) 72px;
      }
      #${PANEL_ID} .bsb-ai-content {
        width: 100%;
        max-width: 56em;
      }
      #${PANEL_ID}:not(.ai-focus) .bsb-focus-stop { display: none !important; }
      #${PANEL_ID} .bsb-focus-stop {
        color: var(--ctp-red) !important;
        border-color: color-mix(in srgb, var(--ctp-red) 42%, transparent) !important;
      }
      #${PANEL_ID} .focus-exit { display: none; }

      #${PANEL_ID}.ai-focus .bsb-sidebar {
        display: flex !important;
        left: 6px !important;
        top: 6px !important;
        right: auto !important;
        bottom: auto !important;
        width: calc(100vw - 12px) !important;
        height: calc(100dvh - 12px) !important;
        min-width: 0 !important;
        min-height: 0 !important;
        border-radius: 12px !important;
      }
      #${PANEL_ID}.ai-focus .bsb-head,
      #${PANEL_ID}.ai-focus .bsb-nav,
      #${PANEL_ID}.ai-focus .bsb-ai-commandbar,
      #${PANEL_ID}.ai-focus .bsb-dock-tab,
      #${PANEL_ID}.ai-focus .bsb-resize {
        display: none !important;
      }
      #${PANEL_ID}.ai-focus .bsb-view { display: none !important; }
      #${PANEL_ID}.ai-focus .bsb-view[data-view-panel="ai"] {
        display: flex !important;
        gap: 5px;
        padding: 6px;
      }
      #${PANEL_ID}.ai-focus .bsb-ai-result-tabs {
        flex: 0 0 31px;
        min-height: 31px;
        padding: 0;
      }
      #${PANEL_ID}.ai-focus .bsb-output-nav { flex:0 0 auto; border-radius:8px; overflow:hidden; }
      #${PANEL_ID}.ai-focus .bsb-output-tabs { padding-top:3px; }
      #${PANEL_ID}.ai-focus .bsb-ai-canvas-wrap {
        min-height: 0;
        border-radius: 9px;
      }
      #${PANEL_ID}.ai-focus .bsb-ai-md {
        padding-top: 28px;
        padding-bottom: 76px;
      }
      #${PANEL_ID}.ai-focus .focus-enter { display: none; }
      #${PANEL_ID}.ai-focus .focus-exit { display: inline; }
      #${PANEL_ID}.ai-focus .bsb-focus-toggle {
        color: var(--ctp-lavender);
        border-color: color-mix(in srgb, var(--ctp-lavender) 42%, transparent);
      }

      @media (max-width: 700px) {
        #${PANEL_ID} .bsb-ai-compact-stats .bsb-chip:not([data-role="chip-model"]) { display: none; }
      }
      @media (max-width: 520px) {
        #${PANEL_ID} .bsb-ai-mode-compact > span,
        #${PANEL_ID} .bsb-ai-compact-stats { display: none; }
        #${PANEL_ID} .bsb-ai-command-actions .bsb-btn { padding-inline: 8px; }
        #${PANEL_ID} .bsb-ai-md { padding-inline: 15px; }
      }

      /* ── v5.10 Studio Shell ──────────────────────────────────────────────
         Design goal: navigation is spatial (left rail), actions are contextual,
         and the reading canvas owns the visual hierarchy. Historical rules
         above are intentionally overridden here so the runtime logic stays
         stable while the product shell changes substantially. */
      #${PANEL_ID} {
        --studio-bg: #111319;
        --studio-panel: #171a21;
        --studio-raised: #1d212a;
        --studio-hover: #242936;
        --studio-line: rgba(255,255,255,.075);
        --studio-line-strong: rgba(255,255,255,.115);
        --studio-text: #eef0f6;
        --studio-muted: #9299a8;
        --studio-faint: #666d7b;
        --studio-accent: #a99df7;
        --studio-accent-soft: rgba(169,157,247,.13);
        --studio-success: #75c995;
        --studio-danger: #ef8299;
      }
      #${PANEL_ID} .bsb-sidebar {
        display: none;
        grid-template-columns: 64px minmax(0, 1fr);
        grid-template-rows: 54px minmax(0, 1fr);
        flex-direction: initial;
        border-radius: 16px;
        border: 1px solid var(--studio-line-strong);
        background: color-mix(in srgb, var(--studio-bg) 96%, transparent);
        backdrop-filter: blur(24px) saturate(1.15);
        -webkit-backdrop-filter: blur(24px) saturate(1.15);
        box-shadow: 0 26px 80px rgba(0,0,0,.48), 0 1px 0 rgba(255,255,255,.04) inset;
      }
      #${PANEL_ID}.open:not(.docked) .bsb-sidebar,
      #${PANEL_ID}.docked.dock-expanded .bsb-sidebar { display: grid; }

      #${PANEL_ID} .bsb-head {
        grid-column: 1 / -1;
        grid-row: 1;
        min-width: 0;
        padding: 8px 10px 8px 12px;
        border-bottom: 1px solid var(--studio-line);
        background: rgba(17,19,25,.88);
      }
      #${PANEL_ID} .bsb-head-title { flex-wrap: nowrap !important; gap: 9px !important; }
      #${PANEL_ID} .bsb-logo {
        width: 30px; height: 30px; border-radius: 9px;
        color: #111319;
        background: #d8d2ff;
        box-shadow: none;
        font-size: 13px;
      }
      #${PANEL_ID} .bsb-brand-stack { display:flex; min-width:0; align-items:baseline; gap:8px; }
      #${PANEL_ID} .bsb-head strong { font-size: 13px; font-weight: 720; letter-spacing: -.01em; }
      #${PANEL_ID} .bsb-head-context {
        color: var(--studio-muted); font-size: 11px; font-weight: 560;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }
      #${PANEL_ID} .bsb-ver {
        border:0 !important; padding:0 !important; background:transparent !important;
        color:var(--studio-faint) !important; font-size:9.5px !important;
      }
      #${PANEL_ID} .bsb-size-switch {
        height: 28px; padding: 2px; border-radius: 8px;
        border-color: var(--studio-line); background: #14171e;
      }
      #${PANEL_ID} .bsb-size-switch button {
        width: 23px; height:22px; border-radius:6px; color:var(--studio-faint); font-size:9px;
      }
      #${PANEL_ID} .bsb-size-switch button.active {
        color: var(--studio-text); background: var(--studio-hover); box-shadow:none;
      }
      #${PANEL_ID} .bsb-icon-btn {
        width: 28px; height:28px; border-radius:8px;
        border:1px solid transparent; background:transparent; color:var(--studio-muted);
      }
      #${PANEL_ID} .bsb-icon-btn:hover {
        color:var(--studio-text); border-color:var(--studio-line); background:var(--studio-hover);
      }

      #${PANEL_ID} .bsb-nav {
        grid-column: 1;
        grid-row: 2;
        min-width: 0;
        padding: 10px 7px 9px;
        border: 0;
        border-right: 1px solid var(--studio-line);
        background: #12151b;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
        gap:10px;
      }
      #${PANEL_ID} .bsb-nav-primary,
      #${PANEL_ID} .bsb-nav-secondary { display:flex; flex-direction:column; gap:5px; }
      #${PANEL_ID} .bsb-nav button {
        flex:0 0 auto;
        width:50px; height:48px;
        padding:5px 3px 4px;
        border-radius:10px;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
        color:var(--studio-muted); background:transparent; box-shadow:none;
      }
      #${PANEL_ID} .bsb-nav button:hover { color:var(--studio-text); background:var(--studio-hover); }
      #${PANEL_ID} .bsb-nav button.active {
        color:var(--studio-text);
        background:var(--studio-accent-soft);
        box-shadow: inset 2px 0 0 var(--studio-accent);
      }
      #${PANEL_ID} .bsb-nav-icon { font-size:17px; line-height:18px; font-weight:550; }
      #${PANEL_ID} .bsb-nav-label { font-size:9.5px; line-height:12px; font-weight:650; }

      #${PANEL_ID} .bsb-body {
        grid-column: 2;
        grid-row: 2;
        min-width:0; min-height:0;
        background:var(--studio-panel);
      }
      #${PANEL_ID} .bsb-view { padding:12px; gap:8px; }
      #${PANEL_ID} .bsb-view[data-view-panel="ai"] { padding:10px 12px 12px; gap:7px; }

      /* Contextual AI toolbar: phase first, controls second. */
      #${PANEL_ID} .bsb-ai-commandbar {
        min-height:42px;
        padding:0;
        border:0;
        background:transparent;
      }
      #${PANEL_ID} .bsb-ai-command-main { gap:10px; }
      #${PANEL_ID} .bsb-ai-stage-tabs {
        height:34px; padding:3px; gap:2px;
        border:1px solid var(--studio-line); border-radius:10px;
        background:#13161d;
      }
      #${PANEL_ID} .bsb-ai-stage-tabs .bsb-stage-connector { display:none; }
      #${PANEL_ID} .bsb-ai-stage-tabs button {
        min-width:105px; height:26px; padding:0 10px;
        border-radius:7px; border:0; background:transparent;
        display:flex; align-items:center; gap:6px; color:var(--studio-muted);
      }
      #${PANEL_ID} .bsb-ai-stage-tabs button.active {
        color:var(--studio-text); background:var(--studio-hover); box-shadow:none;
      }
      #${PANEL_ID} .bsb-ai-stage-tabs button small,
      #${PANEL_ID} .bsb-ai-stage-tabs .bsb-stage-index { display:none; }
      #${PANEL_ID} .bsb-ai-stage-tabs button strong { font-size:11.5px; font-weight:680; }
      #${PANEL_ID} .bsb-ai-compact-stats { opacity:.76; }
      #${PANEL_ID} .bsb-chip {
        border-color:var(--studio-line) !important; background:transparent !important;
        color:var(--studio-muted) !important; box-shadow:none !important;
      }
      #${PANEL_ID} .bsb-ai-command-actions .bsb-btn {
        height:31px; border-radius:9px; border-color:var(--studio-line);
        background:transparent; color:var(--studio-muted);
      }
      #${PANEL_ID} .bsb-ai-command-actions .bsb-btn:hover { color:var(--studio-text); background:var(--studio-hover); }
      #${PANEL_ID} .bsb-ai-command-actions .bsb-btn.accent {
        color:#111319; background:#d8d2ff; border-color:#d8d2ff; font-weight:720; box-shadow:none;
      }
      #${PANEL_ID} .bsb-ai-command-actions .bsb-btn.accent:hover { background:#e3dfff; }

      #${PANEL_ID} .bsb-preprocess-nav,
      #${PANEL_ID} .bsb-output-nav {
        border:1px solid var(--studio-line);
        border-radius:11px;
        background:#14171e;
        box-shadow:none;
      }
      #${PANEL_ID} .bsb-preprocess-tabs button,
      #${PANEL_ID} .bsb-output-tabs button,
      #${PANEL_ID} .bsb-model-tabs button {
        box-shadow:none !important;
      }
      #${PANEL_ID} .bsb-ai-canvas-wrap {
        border:1px solid var(--studio-line);
        background:#15181f;
        border-radius:13px;
        box-shadow:none;
      }
      #${PANEL_ID} .bsb-ai-canvas-bar {
        min-height:38px;
        border-bottom:1px solid var(--studio-line);
        background:#15181f;
      }
      #${PANEL_ID} .bsb-ai-md { padding-top:30px; }
      #${PANEL_ID} .bsb-ai-content { color:var(--studio-text); }

      /* Library: source list behaves like a stable product sidebar. */
      #${PANEL_ID} .bsb-library-topbar {
        gap:7px; padding:0; background:transparent; border:0;
      }
      #${PANEL_ID} .bsb-library-search,
      #${PANEL_ID} .bsb-config-search,
      #${PANEL_ID} .bsb-transcript-search {
        border-color:var(--studio-line) !important;
        background:#13161d !important;
        box-shadow:none !important;
      }
      #${PANEL_ID} .bsb-library-filterbar {
        border-color:var(--studio-line); background:#13161d;
      }
      #${PANEL_ID} .bsb-library-layout {
        gap:0;
        border:1px solid var(--studio-line);
        border-radius:13px;
        overflow:hidden;
        background:#14171e;
      }
      #${PANEL_ID} .bsb-library-master {
        border:0; border-right:1px solid var(--studio-line); border-radius:0; background:#12151b;
      }
      #${PANEL_ID} .bsb-library-detail { background:#171a21; }
      #${PANEL_ID} .bsb-transcript-shell { border:0; border-radius:0; background:transparent; }
      #${PANEL_ID} .bsb-library-master-foot {
        border-top:1px solid var(--studio-line); background:#12151b;
      }
      #${PANEL_ID} .bsb-library-master-foot button { border-radius:7px; }

      /* Settings: editor owns the page; category navigation stays compact. */
      #${PANEL_ID} .bsb-settings { gap:9px; }
      #${PANEL_ID} .bsb-settings-tabs {
        align-self:flex-start; width:auto; padding:3px;
        border:1px solid var(--studio-line); border-radius:10px; background:#13161d;
      }
      #${PANEL_ID} .bsb-settings-tabs button {
        min-width:82px; height:28px; border:0; border-radius:7px; background:transparent;
        color:var(--studio-muted); box-shadow:none;
      }
      #${PANEL_ID} .bsb-settings-tabs button.active { color:var(--studio-text); background:var(--studio-hover); }
      #${PANEL_ID} .bsb-prompt-stage-tabs {
        border-bottom:1px solid var(--studio-line); background:transparent;
      }
      #${PANEL_ID} .bsb-config-master-detail {
        border:1px solid var(--studio-line); border-radius:13px; overflow:hidden; background:#14171e;
      }
      #${PANEL_ID} .bsb-config-sidebar {
        border:0; border-right:1px solid var(--studio-line); border-radius:0; background:#12151b;
      }
      #${PANEL_ID} .bsb-config-editor-shell { background:#171a21; }

      /* Status is feedback, not permanent navigation. */
      #${PANEL_ID} .bsb-statusbar {
        position:absolute;
        right:12px; bottom:12px;
        z-index:20;
        width:auto; max-width:min(420px, calc(100% - 92px));
        min-height:32px; padding:7px 10px;
        border:1px solid var(--studio-line-strong);
        border-radius:10px;
        background:rgba(23,26,33,.94);
        box-shadow:0 10px 28px rgba(0,0,0,.28);
        backdrop-filter:blur(12px);
        pointer-events:none;
      }
      #${PANEL_ID} .bsb-status { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--studio-muted); }
      #${PANEL_ID} .bsb-status-dot { width:6px; height:6px; box-shadow:none !important; }

      /* Small shell keeps icons only; medium/large show labels. */
      #${PANEL_ID}[data-panel-size="small"] .bsb-sidebar { grid-template-columns:50px minmax(0,1fr); }
      #${PANEL_ID}[data-panel-size="small"] .bsb-nav { padding-inline:5px; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-nav button { width:39px; height:40px; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-nav-label { display:none; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-ai-stage-tabs button { min-width:78px; padding-inline:8px; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-brand-stack { gap:5px; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-head-context { display:none; }

      /* v6.0.1 · shortcut center */
      #${PANEL_ID} .bsb-shortcut-settings { height:100%; min-height:0; overflow:auto; }
      #${PANEL_ID} .bsb-shortcut-page { display:flex; flex-direction:column; gap:10px; max-width:920px; padding:2px 0 14px; }
      #${PANEL_ID} .bsb-shortcut-hero {
        display:flex; align-items:flex-start; justify-content:space-between; gap:18px;
        padding:15px 16px; border:1px solid var(--studio-line); border-radius:13px;
        background:linear-gradient(135deg,rgba(137,180,250,.08),rgba(203,166,247,.035) 55%,rgba(23,26,33,.5));
      }
      #${PANEL_ID} .bsb-shortcut-kicker { display:block; margin-bottom:4px; color:var(--ctp-blue); font-size:9px; font-weight:850; letter-spacing:.16em; }
      #${PANEL_ID} .bsb-shortcut-hero h3 { margin:0; color:var(--studio-text); font-size:16px; line-height:1.35; }
      #${PANEL_ID} .bsb-shortcut-hero p { margin:5px 0 0; max-width:650px; color:var(--studio-muted); font-size:10.5px; line-height:1.55; }
      #${PANEL_ID} .bsb-shortcut-card { border:1px solid var(--studio-line); border-radius:13px; overflow:hidden; background:#14171e; }
      #${PANEL_ID} .bsb-shortcut-section-title { display:flex; align-items:baseline; gap:9px; padding:12px 14px 10px; border-bottom:1px solid var(--studio-line); background:#15181f; }
      #${PANEL_ID} .bsb-shortcut-section-title strong { color:var(--studio-text); font-size:12px; }
      #${PANEL_ID} .bsb-shortcut-section-title span { color:var(--studio-muted); font-size:9.5px; }
      #${PANEL_ID} .bsb-shortcut-prefs { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; padding:12px 14px 14px; }
      #${PANEL_ID} .bsb-shortcut-prefs > label { display:flex; flex-direction:column; gap:5px; min-width:0; color:var(--studio-muted); font-size:9.5px; }
      #${PANEL_ID} .bsb-shortcut-prefs .bsb-flow-select { width:100%; }
      #${PANEL_ID} .bsb-shortcut-list { display:flex; flex-direction:column; }
      #${PANEL_ID} .bsb-shortcut-row {
        display:grid; grid-template-columns:minmax(180px,1fr) minmax(230px,auto); gap:14px; align-items:center;
        padding:11px 14px; border-bottom:1px solid color-mix(in srgb,var(--studio-line) 72%,transparent);
      }
      #${PANEL_ID} .bsb-shortcut-row:last-child { border-bottom:0; }
      #${PANEL_ID} .bsb-shortcut-row:hover { background:rgba(255,255,255,.018); }
      #${PANEL_ID} .bsb-shortcut-copy { display:flex; flex-direction:column; gap:3px; min-width:0; }
      #${PANEL_ID} .bsb-shortcut-copy strong { color:var(--studio-text); font-size:11.5px; }
      #${PANEL_ID} .bsb-shortcut-copy span { color:var(--studio-muted); font-size:9.5px; line-height:1.42; }
      #${PANEL_ID} .bsb-shortcut-control { display:grid; grid-template-columns:minmax(150px,1fr) 30px; gap:6px; align-items:center; min-width:230px; }
      #${PANEL_ID} .bsb-shortcut-key {
        height:34px; min-width:150px; padding:0 10px; border:1px solid var(--studio-line-strong); border-radius:9px;
        background:#10131a; color:var(--studio-text); font:700 10.5px/1 ui-monospace,SFMono-Regular,Consolas,monospace;
        letter-spacing:.015em; cursor:pointer; box-shadow:inset 0 1px 0 rgba(255,255,255,.025); outline:none;
      }
      #${PANEL_ID} .bsb-shortcut-key:hover { border-color:color-mix(in srgb,var(--ctp-blue) 40%,var(--studio-line-strong)); background:#151a24; }
      #${PANEL_ID} .bsb-shortcut-key:focus-visible { border-color:var(--ctp-blue); box-shadow:0 0 0 3px rgba(137,180,250,.12); }
      #${PANEL_ID} .bsb-shortcut-key.recording { color:var(--ctp-blue); border-color:var(--ctp-blue); background:rgba(137,180,250,.08); animation:bsb-shortcut-pulse 1.1s ease-in-out infinite; }
      @keyframes bsb-shortcut-pulse { 50% { box-shadow:0 0 0 4px rgba(137,180,250,.08); } }
      #${PANEL_ID} .bsb-shortcut-reset { width:30px; height:30px; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--studio-muted); cursor:pointer; }
      #${PANEL_ID} .bsb-shortcut-reset:hover { color:var(--studio-text); background:var(--studio-hover); border-color:var(--studio-line); }
      #${PANEL_ID} .bsb-shortcut-state { grid-column:1 / -1; justify-self:end; min-height:13px; color:var(--studio-muted); font-size:8.8px; }
      #${PANEL_ID} .bsb-shortcut-state.ok { color:var(--ctp-green); }
      #${PANEL_ID} .bsb-shortcut-state.warn { color:var(--ctp-yellow); }
      #${PANEL_ID} .bsb-shortcut-state.error { color:var(--ctp-red); }
      #${PANEL_ID} .bsb-shortcut-state.off { color:var(--ctp-overlay0); }
      #${PANEL_ID} .bsb-shortcut-foot { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px; border-top:1px solid var(--studio-line); color:var(--studio-muted); font-size:9px; background:#12151b; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-shortcut-prefs { grid-template-columns:1fr; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-shortcut-row { grid-template-columns:1fr; gap:8px; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-shortcut-control { width:100%; min-width:0; }
      #${PANEL_ID}[data-panel-size="small"] .bsb-shortcut-foot { align-items:flex-start; flex-direction:column; }

      /* Focus mode: rail and chrome leave, content becomes a clean reading surface. */
      #${PANEL_ID}.ai-focus .bsb-sidebar {
        display:grid !important;
        grid-template-columns:minmax(0,1fr) !important;
        grid-template-rows:minmax(0,1fr) !important;
      }
      #${PANEL_ID}.ai-focus .bsb-body { grid-column:1; grid-row:1; }
      #${PANEL_ID}.ai-focus .bsb-head,
      #${PANEL_ID}.ai-focus .bsb-nav,
      #${PANEL_ID}.ai-focus .bsb-statusbar { display:none !important; }
    `);
  }

  function applyPanelGeometry() {
    const root = document.getElementById(PANEL_ID);
    if (!root || !state.ui) return;
    const sidebar = root.querySelector(".bsb-sidebar");
    if (!sidebar) return;
    const ui = clampUiToViewport(state.ui);
    const panelSizeClass = isPanelSizePreset(ui.sizePreset)
      ? ui.sizePreset
      : panelSizeClassFromWidth(ui.w);
    root.setAttribute("data-panel-size", panelSizeClass);
    root.style.setProperty("--bsb-note-font", `${Math.max(NOTE_FONT_MIN, Math.min(NOTE_FONT_MAX, Number(ui.noteFont) || 17))}px`);
    root.querySelectorAll('[data-act="panel-size"]').forEach((button) => {
      const active = isPanelSizePreset(ui.sizePreset) && button.dataset.size === ui.sizePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    root.classList.toggle("open", !!state.open);
    root.classList.toggle("ai-focus", !!state.aiFocus);
    root.classList.toggle("docked", !!ui.dock);
    root.querySelectorAll('[data-act="ai-focus"]').forEach((button) => {
      button.setAttribute("aria-pressed", state.aiFocus ? "true" : "false");
      button.title = state.aiFocus
        ? "退出专注阅读（Esc）"
        : "铺满窗口，只保留模型标签与正文";
    });
    root.classList.toggle("dock-expanded", !!(ui.dock && ui.dockExpanded));
    if (ui.dock) root.setAttribute("data-dock", ui.dock);
    else root.removeAttribute("data-dock");

    if (ui.dock && !ui.dockExpanded) {
      // 贴边收起：主面板不占位
      sidebar.style.left = "";
      sidebar.style.top = "";
      sidebar.style.width = "";
      sidebar.style.height = "";
    } else {
      // 悬浮 或 贴边展开
      if (ui.dock === "right") {
        sidebar.style.left = Math.max(0, window.innerWidth - ui.w - 8) + "px";
        sidebar.style.top = Math.max(8, Math.min(ui.y, window.innerHeight - ui.h - 8)) + "px";
      } else if (ui.dock === "left") {
        sidebar.style.left = "8px";
        sidebar.style.top = Math.max(8, Math.min(ui.y, window.innerHeight - ui.h - 8)) + "px";
      } else {
        sidebar.style.left = ui.x + "px";
        sidebar.style.top = ui.y + "px";
      }
      sidebar.style.width = ui.w + "px";
      sidebar.style.height = ui.h + "px";
      sidebar.style.right = "auto";
      sidebar.style.bottom = "auto";
    }

    sidebar.setAttribute(
      "aria-hidden",
      state.open && (!ui.dock || ui.dockExpanded) ? "false" : "true",
    );
    const fab = root.querySelector(".bsb-fab");
    if (fab) fab.setAttribute("aria-expanded", state.open || !!ui.dock ? "true" : "false");
  }

  function bindPanelChrome(root) {
    const sidebar = root.querySelector(".bsb-sidebar");
    const fab = root.querySelector(".bsb-fab");
    const head = root.querySelector(".bsb-head");
    const dockTab = root.querySelector(".bsb-dock-tab");
    let hideTimer = null;

    state.ui = loadUiGeom();

    function setOpen(open) {
      state.open = open;
      if (open) {
        // 从收起打开时，若已 dock 则展开；否则悬浮
        if (state.ui.dock) state.ui.dockExpanded = true;
        refreshContextUI();
      } else {
        closeMermaidFullscreen();
        state.aiFocus = false;
        state.ui.dock = null;
        state.ui.dockExpanded = false;
      }
      applyPanelGeometry();
      saveUiGeom();
    }

    function setDock(side) {
      // side: 'left' | 'right' | null
      if (side) {
        closeMermaidFullscreen();
        state.aiFocus = false;
        state.open = true;
        state.ui.dock = side;
        state.ui.dockExpanded = false;
        if (side === "right") {
          state.ui.x = Math.max(0, window.innerWidth - state.ui.w - 12);
        } else {
          state.ui.x = 12;
        }
      } else {
        state.ui.dock = null;
        state.ui.dockExpanded = false;
        state.open = true;
      }
      applyPanelGeometry();
      saveUiGeom();
      setStatus(
        side
          ? `已贴边收起（${side === "right" ? "右" : "左"}侧）· 点标签展开`
          : "已取消贴边 · 悬浮模式",
      );
    }

    function toggleDockExpanded(force) {
      if (!state.ui.dock) return;
      state.ui.dockExpanded =
        typeof force === "boolean" ? force : !state.ui.dockExpanded;
      state.open = true;
      applyPanelGeometry();
      if (state.ui.dockExpanded) refreshContextUI();
    }

    function scheduleAutoHide() {
      if (!state.ui.dock || !state.ui.dockExpanded) return;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!state.ui.dock) return;
        // 指针仍在面板/标签上则不收
        const hover = root.querySelector(".bsb-sidebar:hover, .bsb-dock-tab:hover");
        if (hover) {
          scheduleAutoHide();
          return;
        }
        state.ui.dockExpanded = false;
        applyPanelGeometry();
      }, 700);
    }

    fab.addEventListener("click", () => {
      if (state.ui.dock) {
        toggleDockExpanded(true);
      } else {
        setOpen(!state.open);
      }
    });

    root.querySelector(".bsb-close").addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(false);
    });
    root.querySelectorAll('[data-act="panel-size"]').forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const next = button.dataset.size;
        if (!isPanelSizePreset(next)) return;
        const oldWidth = state.ui.w;
        const oldRight = state.ui.x + oldWidth;
        const anchorRight = state.ui.dock === "right" || (!state.ui.dock && state.ui.x + oldWidth / 2 >= window.innerWidth / 2);
        state.ui.sizePreset = next;
        state.ui.w = panelPresetWidth(next);
        if (anchorRight && !state.ui.dock) state.ui.x = oldRight - state.ui.w;
        clampUiToViewport(state.ui);
        applyPanelGeometry();
        saveUiGeom();
        setStatus(`面板宽度：${PANEL_SIZE_PRESETS[next].label} · ${Math.round(state.ui.w)}px；高度保持${state.ui.heightMode === "custom" ? "自定义" : "约 90% 视口"}`);
      });
    });
    root.querySelector('[data-act="dock"]').addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.ui.dock) {
        setDock(null);
      } else {
        // 靠近哪边就贴哪边，默认右
        const mid = state.ui.x + state.ui.w / 2;
        setDock(mid < window.innerWidth / 2 ? "left" : "right");
      }
    });
    root.querySelector('[data-act="collapse"]').addEventListener("click", (e) => {
      e.stopPropagation();
      if (!state.ui.dock) {
        const mid = state.ui.x + state.ui.w / 2;
        setDock(mid < window.innerWidth / 2 ? "left" : "right");
      } else {
        toggleDockExpanded(false);
      }
    });

    dockTab.addEventListener("click", () => toggleDockExpanded(true));
    dockTab.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      if (state.ui.dock && !state.ui.dockExpanded) toggleDockExpanded(true);
    });
    sidebar.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    sidebar.addEventListener("mouseleave", () => scheduleAutoHide());
    dockTab.addEventListener("mouseleave", () => scheduleAutoHide());

    // ── drag ──
    let drag = null;
    head.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button, select, input, a, label")) return;
      if (state.ui.dock) {
        // 贴边时拖标题：取消贴边进入悬浮
        state.ui.dock = null;
        state.ui.dockExpanded = false;
        state.open = true;
      }
      drag = {
        pid: e.pointerId,
        ox: e.clientX - state.ui.x,
        oy: e.clientY - state.ui.y,
      };
      head.setPointerCapture(e.pointerId);
      sidebar.classList.add("dragging");
      e.preventDefault();
    });
    head.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      state.ui.x = e.clientX - drag.ox;
      state.ui.y = e.clientY - drag.oy;
      clampUiToViewport(state.ui);
      applyPanelGeometry();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.pid)) return;
      drag = null;
      sidebar.classList.remove("dragging");
      // 贴边吸附
      if (state.ui.x <= DOCK_SNAP_PX) {
        setDock("left");
      } else if (state.ui.x + state.ui.w >= window.innerWidth - DOCK_SNAP_PX) {
        setDock("right");
      } else {
        saveUiGeom();
      }
    }
    head.addEventListener("pointerup", endDrag);
    head.addEventListener("pointercancel", endDrag);

    // ── resize ──
    let resize = null;
    root.querySelectorAll(".bsb-resize").forEach((handle) => {
      handle.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || state.ui.dock) return;
        const dir = handle.getAttribute("data-dir");
        resize = {
          pid: e.pointerId,
          dir,
          sx: e.clientX,
          sy: e.clientY,
          ox: state.ui.x,
          oy: state.ui.y,
          ow: state.ui.w,
          oh: state.ui.h,
        };
        handle.setPointerCapture(e.pointerId);
        sidebar.classList.add("resizing");
        e.preventDefault();
        e.stopPropagation();
      });
      handle.addEventListener("pointermove", (e) => {
        if (!resize || e.pointerId !== resize.pid) return;
        const dx = e.clientX - resize.sx;
        const dy = e.clientY - resize.sy;
        let { x, y, w, h } = {
          x: resize.ox,
          y: resize.oy,
          w: resize.ow,
          h: resize.oh,
        };
        const d = resize.dir;
        if (d.includes("e")) w = resize.ow + dx;
        if (d.includes("s")) h = resize.oh + dy;
        if (d.includes("w")) {
          w = resize.ow - dx;
          x = resize.ox + dx;
        }
        if (d.includes("n")) {
          h = resize.oh - dy;
          y = resize.oy + dy;
        }
        if (w < MIN_W) {
          if (d.includes("w")) x = resize.ox + (resize.ow - MIN_W);
          w = MIN_W;
        }
        if (h < MIN_H) {
          if (d.includes("n")) y = resize.oy + (resize.oh - MIN_H);
          h = MIN_H;
        }
        if (d.includes("e") || d.includes("w")) state.ui.sizePreset = "custom";
        if (d.includes("n") || d.includes("s")) state.ui.heightMode = "custom";
        state.ui.x = x;
        state.ui.y = y;
        state.ui.w = w;
        state.ui.h = h;
        clampUiToViewport(state.ui);
        applyPanelGeometry();
      });
      function endResize(e) {
        if (!resize || (e && e.pointerId !== resize.pid)) return;
        resize = null;
        sidebar.classList.remove("resizing");
        saveUiGeom();
      }
      handle.addEventListener("pointerup", endResize);
      handle.addEventListener("pointercancel", endResize);
    });

    window.addEventListener("resize", () => {
      if (!state.ui) return;
      clampUiToViewport(state.ui);
      applyPanelGeometry();
    });

    // 若上次是 dock，启动时只显示贴边标签
    if (state.ui.dock) {
      state.open = true;
      state.ui.dockExpanded = false;
    }
    applyPanelGeometry();
    // 恢复工作区（AI / 字幕 / 设置）
    try {
      setWorkspace(state.ui.view || "ai", { silent: true });
    } catch (_) {
      /* ensurePanel may not be fully wired yet */
    }

    // expose for external refresh
    root._bsbSetOpen = setOpen;
    root._bsbSetDock = setDock;
    root._bsbToggleDockExpanded = toggleDockExpanded;
  }

  function ensurePanel() {
    let root = document.getElementById(PANEL_ID);
    if (root) return root;
    injectStyles();
    root = document.createElement("div");
    root.id = PANEL_ID;
    root.setAttribute("data-ctp-flavor", "mocha");
    root.innerHTML = `
      <button type="button" class="bsb-dock-tab" title="展开 SubBatch 工作台">AI · CC</button>
      <aside class="bsb-sidebar" role="complementary" aria-label="Bili SubBatch Workspace" aria-hidden="true">
        <div class="bsb-resize n" data-dir="n"></div>
        <div class="bsb-resize s" data-dir="s"></div>
        <div class="bsb-resize e" data-dir="e"></div>
        <div class="bsb-resize w" data-dir="w"></div>
        <div class="bsb-resize ne" data-dir="ne"></div>
        <div class="bsb-resize nw" data-dir="nw"></div>
        <div class="bsb-resize se" data-dir="se"></div>
        <div class="bsb-resize sw" data-dir="sw"></div>
        <div class="bsb-head">
          <div class="bsb-head-title">
            <span class="bsb-logo" aria-hidden="true">S</span>
            <span class="bsb-brand-stack"><strong>SubBatch</strong><span class="bsb-head-context" data-role="workspace-title">AI 工作台</span></span>
            <span class="bsb-ver">v${SCRIPT_VERSION}</span>
          </div>
          <div class="bsb-head-actions">
            <div class="bsb-size-switch" role="group" aria-label="面板宽度">
              <button type="button" data-act="panel-size" data-size="small" aria-pressed="false" title="紧凑宽度">S</button>
              <button type="button" data-act="panel-size" data-size="medium" aria-pressed="false" title="标准宽度">M</button>
              <button type="button" data-act="panel-size" data-size="large" aria-pressed="false" title="宽屏阅读">L</button>
            </div>
            <button type="button" class="bsb-icon-btn" data-act="dock" title="贴边收起" aria-label="贴边收起">◧</button>
            <button type="button" class="bsb-icon-btn" data-act="collapse" title="最小化" aria-label="最小化">−</button>
            <button type="button" class="bsb-icon-btn bsb-close" title="关闭" aria-label="关闭">×</button>
          </div>
        </div>
        <nav class="bsb-nav" aria-label="Workspace">
          <div class="bsb-nav-primary">
            <button type="button" data-view="ai" class="active" title="AI 工作台"><span class="bsb-nav-icon" aria-hidden="true">✦</span><span class="bsb-nav-label">AI</span></button>
            <button type="button" data-view="subs" title="字幕库"><span class="bsb-nav-icon" aria-hidden="true">≡</span><span class="bsb-nav-label">字幕</span></button>
            <button type="button" data-view="knowledge" title="Knowledge"><span class="bsb-nav-icon" aria-hidden="true">◇</span><span class="bsb-nav-label">知识</span></button>
          </div>
          <div class="bsb-nav-secondary">
            <button type="button" data-view="settings" title="设置"><span class="bsb-nav-icon" aria-hidden="true">⚙</span><span class="bsb-nav-label">设置</span></button>
          </div>
        </nav>
        <div class="bsb-body">
          <!-- AI 主画布 -->
          <section class="bsb-view active" data-view-panel="ai">
            <div class="bsb-ai-commandbar bsb-workbench-commandbar">
              <div class="bsb-ai-command-main">
                <div class="bsb-ai-stage-tabs" data-role="ai-stage-tabs" aria-label="AI 处理阶段">
                  <button type="button" data-ai-stage="preprocess" class="active"><span class="bsb-stage-index">1</span><span><strong>预处理</strong><small>字幕整理</small></span></button>
                  <span class="bsb-stage-connector">→</span>
                  <button type="button" data-ai-stage="postprocess"><span class="bsb-stage-index">2</span><span><strong>后处理</strong><small>Mermaid / 其他产物</small></span></button>
                </div>
                <div class="bsb-ai-compact-stats bsb-chips" data-role="ai-chips" title="当前选择状态">
                  <span class="bsb-chip">选 <em data-role="chip-sel">0</em></span>
                  <span class="bsb-chip">字幕 <em data-role="chip-ok">0</em></span>
                  <span class="bsb-chip" data-role="chip-model">0 runs</span>
                </div>
              </div>
              <div class="bsb-ai-command-actions">
                <button type="button" class="bsb-btn ghost" data-act="ai-flow-drawer" title="配置预处理和后处理流程">流程</button>
                <button type="button" class="bsb-btn danger" data-act="ai-stop" style="display:none">停止</button>
                <button type="button" class="bsb-btn accent" data-act="ai-send" title="按照当前处理方案运行">运行</button>
              </div>
            </div>
            <div class="bsb-preprocess-nav" data-role="ai-preprocess-nav" aria-label="预处理字幕导航">
              <div class="bsb-preprocess-tabs">
                <button type="button" data-ai-preprocess-view="raw" class="active"><span class="dot raw"></span><span>原始字幕</span></button>
                <button type="button" data-ai-preprocess-view="processed"><span class="dot processed"></span><span>AI 处理字幕</span></button>
              </div>
              <span class="bsb-preprocess-status" data-role="ai-preprocess-status">等待字幕</span>
            </div>
            <div class="bsb-output-nav" data-role="ai-postprocess-nav" aria-label="后处理产物导航" hidden>
              <div class="bsb-output-tabs" data-role="ai-result-tabs">
                <span class="bsb-ai-result-empty">在“处理方案”中添加一个或多个后处理产物</span>
              </div>
              <div class="bsb-model-tabs" data-role="ai-model-tabs"></div>
            </div>
            <div class="bsb-ai-drawer-backdrop" data-role="ai-drawer-backdrop" hidden></div>
            <aside class="bsb-ai-drawer" data-role="ai-flow-drawer" aria-hidden="true"></aside>
            <aside class="bsb-ai-drawer bsb-ai-input-drawer" data-role="ai-input-drawer" aria-hidden="true"></aside>
            <aside class="bsb-knowledge-rail" data-role="knowledge-rail" aria-hidden="true"></aside>
            <div class="bsb-ai-canvas-wrap">
              <div class="bsb-ai-canvas-bar">
                <span class="bsb-bar-left">
                  <span class="bsb-live-dot" aria-hidden="true"></span>
                  <span data-role="ai-canvas-stage-label">预处理</span>
                  <span data-role="ai-canvas-meta">原始字幕</span>
                </span>
                <span class="bsb-bar-actions">
                  <button type="button" class="bsb-mini bsb-focus-stop" data-act="ai-stop" title="停止本批次所有仍在生成的模型" style="display:none">停止</button>
                  <button type="button" class="bsb-mini" data-preprocess-action data-act="ai-copy-input" title="复制当前字幕">复制字幕</button>
                  <button type="button" class="bsb-mini" data-preprocess-action data-act="ai-reprocess" title="强制重新运行字幕预处理">重做预处理</button>
                  <button type="button" class="bsb-mini on" data-postprocess-action data-act="ai-stick" title="跟随最新 / 暂停跟随（上滑也会自动暂停）" hidden>粘底</button>
                  <button type="button" class="bsb-mini" data-postprocess-action data-act="ai-regenerate-current" title="只重新生成当前产物的当前模型版本" hidden>重试</button>
                  <button type="button" class="bsb-mini" data-postprocess-action data-act="ai-copy" title="复制当前输出" hidden>复制</button>
                  <button type="button" class="bsb-mini" data-postprocess-action data-act="ai-export" title="导出 Markdown" hidden>导出</button>
                  <button type="button" class="bsb-mini" data-act="ai-font-dec" title="减小正文字号">A−</button>
                  <button type="button" class="bsb-mini" data-act="ai-font-inc" title="增大正文字号">A+</button>
                  <button type="button" class="bsb-mini" data-act="ai-top" title="回到顶部">顶部</button>
                  <button type="button" class="bsb-mini bsb-focus-toggle" data-act="ai-focus" aria-pressed="false" title="铺满窗口，只保留模型标签与正文"><span class="focus-enter">专注</span><span class="focus-exit">退出专注</span></button>
                </span>
              </div>
              <div class="bsb-ai-stream" data-role="ai-stream">
                <pre class="bsb-ai-raw" data-role="ai-raw" hidden></pre>
                <div class="bsb-ai-md" data-role="ai-md">
                  <div class="bsb-ai-content" data-role="ai-content" aria-label="AI 笔记输出">
                    <div class="bsb-empty">
                      <div class="bsb-empty-ico">✦</div>
                      <strong>还没有分析结果</strong>
                      <span>在「字幕库」采集并勾选视频，再点「开始分析」。生成中上滑即可自由阅读（不会被拽回底部）；跟随时点「↓ 最新」。</span>
                    </div>
                  </div>
                  <div class="bsb-ai-anchor" data-role="ai-anchor"></div>
                </div>
                <button type="button" class="bsb-jump-latest" data-act="ai-jump" title="跳到最新输出">↓ 最新</button>
              </div>
            </div>
          </section>

          <!-- 字幕资源库 -->
          <section class="bsb-view" data-view-panel="subs">
            <div class="bsb-library-topbar">
              <button type="button" class="bsb-btn primary" data-act="capture-toggle">＋ 采集视频</button>
              <label class="bsb-library-search" title="搜索标题、BV、UP 或来源">
                <span>⌕</span>
                <input type="search" data-role="library-search" placeholder="搜索视频 / BV / UP…" autocomplete="off">
              </label>
              <div class="bsb-library-filterbar" data-role="library-filters" aria-label="字幕状态筛选">
                <button type="button" data-library-filter="all" class="active">全部 <span data-library-count="all">0</span></button>
                <button type="button" data-library-filter="ok">有字幕 <span data-library-count="ok">0</span></button>
                <button type="button" data-library-filter="wait">待抓取 <span data-library-count="wait">0</span></button>
                <button type="button" data-library-filter="error">失败 <span data-library-count="error">0</span></button>
                <button type="button" data-library-filter="empty">无字幕 <span data-library-count="empty">0</span></button>
              </div>
            </div>

            <div class="bsb-capture-drawer" data-role="capture-drawer" hidden>
              <div class="bsb-capture-head">
                <div><strong>采集视频</strong><br><span>扫描结果会按 BV + P 增量合并到资源库，不会覆盖已有字幕。</span></div>
                <button type="button" class="bsb-btn ghost" data-act="capture-toggle">关闭</button>
              </div>
              <div>
                <span class="bsb-badge" data-role="type">—</span>
                <div class="bsb-meta" data-role="ctx">—</div>
              </div>
              <div class="bsb-mode-row">
                <label>来源
                  <select data-role="mode" title="自动识别或强制类型">
                    <option value="auto" selected>自动识别</option>
                    <option value="video">单个视频</option>
                    <option value="selection">视频选集</option>
                    <option value="user">个人主页</option>
                    <option value="favorite">收藏夹</option>
                    <option value="collection">合集</option>
                    <option value="search">搜索页</option>
                  </select>
                </label>
                <span class="bsb-auto-hint" data-role="auto-hint">识别：—</span>
              </div>
              <div class="bsb-opts">
                <label class="bsb-auto-capture"><input type="checkbox" data-role="auto-capture" checked> 打开视频自动抓字幕</label>
                <label><input type="checkbox" data-role="auto-analyze" checked> 抓到字幕后自动分析</label>
                <label><input type="checkbox" data-role="player-subtitle" checked> 自动开启播放器字幕</label>
                <label>最多页 <input type="number" data-role="max-pages" min="1" max="100" value="${DEFAULT_MAX_PAGES}"></label>
                <label>间隔ms <input type="number" data-role="delay" min="0" max="5000" step="50" value="${DEFAULT_DELAY_MS}"></label>
              </div>
              <div class="bsb-capture-actions">
                <button type="button" class="bsb-btn danger" data-act="cancel" style="display:none">停止</button>
                <button type="button" class="bsb-btn primary" data-act="scan">扫描并加入资源库</button>
              </div>
            </div>

            <div class="bsb-library-layout">
              <aside class="bsb-library-master">
                <div class="bsb-library-master-head">
                  <strong>视频资源</strong>
                  <span data-role="library-visible-count">0 / 0</span>
                </div>
                <div class="bsb-list" data-role="list">
                  <div class="bsb-empty">
                    <div class="bsb-empty-ico">≡</div>
                    <strong>字幕库为空</strong>
                    <span>点击「＋ 采集视频」，或直接打开一个视频自动加入。</span>
                  </div>
                </div>
                <div class="bsb-library-master-foot">
                  <button type="button" data-act="sel-all">全选</button>
                  <button type="button" data-act="sel-none">全不选</button>
                  <button type="button" data-act="clear">清空</button>
                  <button type="button" data-act="copy-bvid">复制 BV</button>
                  <button type="button" data-act="fetch-selected">抓取所选</button>
                  <button type="button" data-act="ai-send">送去 AI</button>
                </div>
              </aside>

              <main class="bsb-library-detail">
                <section class="bsb-transcript-shell" aria-label="当前视频工作区">
                  <div class="bsb-transcript-head">
                    <div class="bsb-transcript-title">
                      <strong data-role="transcript-title">当前视频字幕</strong>
                      <span data-role="transcript-meta">从左侧选择一个视频</span>
                    </div>
                  </div>
                  <div class="bsb-detail-tabs" role="tablist" aria-label="当前视频内容">
                    <button type="button" class="active" role="tab" aria-selected="true">字幕</button>
                    <button type="button" data-act="open-ai-workspace" role="tab" title="打开该资源库共用的 AI 学习图谱工作区">AI 学习图谱 ↗</button>
                  </div>
                  <div class="bsb-transcript-tools">
                    <label class="bsb-transcript-search" title="检索当前视频字幕">
                      <span>⌕</span>
                      <input type="search" data-role="transcript-search" placeholder="检索当前字幕…" autocomplete="off">
                      <span class="bsb-transcript-count" data-role="transcript-count"></span>
                    </label>
                    <select class="bsb-transcript-track" data-role="transcript-track" aria-label="字幕语言" disabled>
                      <option>自动</option>
                    </select>
                    <label class="bsb-transcript-follow"><input type="checkbox" data-role="transcript-follow" checked> 跟随播放</label>
                    <button type="button" class="bsb-transcript-refresh" data-act="transcript-refresh" title="忽略缓存重新读取">刷新</button>
                  </div>
                  <div class="bsb-transcript-list" data-role="transcript-list">
                    <div class="bsb-transcript-empty">从左侧选择已有字幕的视频即可阅读全文。<br>点击时间可以跳转到播放器对应位置。</div>
                  </div>
                  <div class="bsb-actions" style="padding:7px 9px 9px">
                    <button type="button" class="primary" data-act="dl-srt">下载 SRT</button>
                    <button type="button" data-act="dl-txt">下载 TXT</button>
                    <button type="button" data-act="copy">复制全文</button>
                  </div>
                </section>
              </main>
            </div>
          </section>

          <!-- Knowledge Workspace · v6 -->
          <section class="bsb-view" data-view-panel="knowledge">
            <div class="bsb-knowledge-workspace">
              <div class="bsb-knowledge-topbar">
                <label class="bsb-knowledge-search"><span>⌕</span><input type="search" data-role="knowledge-search" placeholder="搜索知识锚点 / 视频 / 上下文…" autocomplete="off"></label>
                <span class="bsb-knowledge-count"><strong data-role="knowledge-count">0</strong> anchors</span>
              </div>
              <div class="bsb-knowledge-master-detail">
                <aside class="bsb-knowledge-library" data-role="knowledge-list"></aside>
                <main class="bsb-knowledge-detail" data-role="knowledge-detail"><div class="bsb-empty"><div class="bsb-empty-ico">◇</div><strong>Knowledge Workspace</strong><span>从 AI 处理字幕中选中一个知识概念开始。</span></div></main>
              </div>
            </div>
          </section>

          <!-- 设置 · v5.5 Master–Detail -->
          <section class="bsb-view" data-view-panel="settings">
            <div class="bsb-settings">
              <div class="bsb-settings-tabs" role="tablist" aria-label="设置分类">
                <button type="button" class="active" data-settings-tab="prompt" role="tab">Prompt</button>
                <button type="button" data-settings-tab="llm" role="tab">LLM</button>
                <button type="button" data-settings-tab="shortcuts" role="tab">快捷键</button>
              </div>

              <section class="bsb-settings-pane active" data-settings-pane="prompt">
                <div class="bsb-prompt-stage-tabs" role="tablist" aria-label="Prompt 阶段">
                  <button type="button" class="active" data-prompt-stage-tab="preprocess" role="tab">预处理</button>
                  <button type="button" data-prompt-stage-tab="postprocess" role="tab">后处理</button>
                  <button type="button" data-prompt-stage-tab="knowledge" role="tab">Knowledge</button>
                </div>
                <div class="bsb-prompt-stage-context" data-role="prompt-stage-context">
                  <span>预处理 · 原始字幕 → 规范化简体中文字幕稿</span>
                  <span>PRE</span>
                </div>
                <div class="bsb-config-master-detail">
                  <aside class="bsb-config-sidebar">
                    <div class="bsb-config-sidebar-head">
                      <label class="bsb-config-search"><span>⌕</span><input type="search" data-role="prompt-search" placeholder="搜索预处理 Prompt…" autocomplete="off"></label>
                      <button type="button" class="bsb-btn ghost bsb-config-create" data-act="prompt-add-pre" data-prompt-create-stage="preprocess">＋ 新建预处理</button>
                      <button type="button" class="bsb-btn ghost bsb-config-create" data-act="prompt-add" data-prompt-create-stage="postprocess" hidden>＋ 新建后处理</button>
                      <button type="button" class="bsb-btn ghost bsb-config-create" data-act="prompt-add-knowledge" data-prompt-create-stage="knowledge" hidden>＋ 新建 Knowledge</button>
                    </div>
                    <div class="bsb-config-list" data-role="prompt-list"></div>
                    <div class="bsb-config-sidebar-foot">
                      <button type="button" class="bsb-btn ghost" data-act="prompt-reset">恢复内置 Prompt</button>
                    </div>
                  </aside>
                  <main class="bsb-config-editor-shell bsb-ai-config" data-role="prompt-editor"></main>
                </div>
              </section>

              <section class="bsb-settings-pane" data-settings-pane="llm">
                <div class="bsb-config-master-detail">
                  <aside class="bsb-config-sidebar">
                    <div class="bsb-config-sidebar-head">
                      <label class="bsb-config-search"><span>⌕</span><input type="search" data-role="ai-search" placeholder="搜索模型配置…" autocomplete="off"></label>
                      <button type="button" class="bsb-btn ghost bsb-config-create" data-act="ai-profile-add">＋ 新建 LLM</button>
                    </div>
                    <div class="bsb-config-list" data-role="ai-list"></div>
                    <div class="bsb-config-sidebar-foot">
                      <button type="button" class="bsb-btn ghost" data-act="ai-reset">恢复默认模型</button>
                    </div>
                  </aside>
                  <main class="bsb-config-editor-shell bsb-ai-config" data-role="ai-editor"></main>
                </div>
              </section>

              <section class="bsb-settings-pane" data-settings-pane="shortcuts">
                <div class="bsb-shortcut-settings" data-role="shortcut-settings"></div>
              </section>
            </div>
          </section>
        </div>
        <div class="bsb-statusbar">
          <span class="bsb-status-dot" data-role="status-dot"></span>
          <div class="bsb-status" data-role="status" role="status" aria-live="polite">就绪 · AI 工作台</div>
        </div>
      </aside>
      <div class="bsb-selection-toolbar" data-role="knowledge-selection-toolbar" hidden>
        <span class="bsb-selection-toolbar-text" data-role="knowledge-selection-text"></span>
        <div class="bsb-selection-toolbar-actions">
          <button type="button" data-knowledge-selection-act="explain">✦ 解释</button>
          <button type="button" data-knowledge-selection-act="deep">↳ 深入</button>
          <button type="button" data-knowledge-selection-act="question">? 提问</button>
          <button type="button" data-knowledge-selection-act="save">☆ 收藏</button>
        </div>
      </div>
      <button type="button" class="bsb-fab" title="SubBatch 工作台" aria-expanded="false">CC</button>
    `;
    document.documentElement.appendChild(root);
    bindPanelChrome(root);

    root.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => setWorkspace(btn.getAttribute("data-view")));
    });

    root.querySelector('[data-role="max-pages"]').addEventListener("change", (e) => {
      state.maxPages = Math.max(1, Math.min(100, Number(e.target.value) || DEFAULT_MAX_PAGES));
    });
    root.querySelector('[data-role="delay"]').addEventListener("change", (e) => {
      state.delayMs = Math.max(0, Math.min(5000, Number(e.target.value) || DEFAULT_DELAY_MS));
    });
    const autoCaptureInput = root.querySelector('[data-role="auto-capture"]');
    if (autoCaptureInput) {
      autoCaptureInput.checked = state.autoCaptureEnabled;
      autoCaptureInput.addEventListener("change", (e) => {
        state.autoCaptureEnabled = !!e.target.checked;
        saveAutoCaptureSetting(state.autoCaptureEnabled);
        if (state.autoCaptureEnabled) {
          setStatus("已开启：打开视频自动抓字幕");
          scheduleAutoCapture("setting-enabled", 0);
        } else {
          state.autoCaptureAbortController?.abort();
          clearTimeout(state.autoCaptureTimer);
          setStatus("已关闭自动抓取；仍可手动扫描", "ok");
        }
      });
    }
    const autoAnalyzeInput = root.querySelector('[data-role="auto-analyze"]');
    if (autoAnalyzeInput) {
      autoAnalyzeInput.checked = state.autoAnalyzeEnabled;
      autoAnalyzeInput.addEventListener("change", (e) => {
        state.autoAnalyzeEnabled = !!e.target.checked;
        saveAutoAnalyzeSetting(state.autoAnalyzeEnabled);
        clearTimeout(state.autoAnalyzeTimer);
        state.autoAnalyzePendingKey = "";
        if (state.autoAnalyzeEnabled) {
          state.autoAnalyzeKey = "";
          const item = currentTranscriptItem();
          if (item?.subStatus === "ok" && item.data?.length) {
            scheduleAutoAnalyze(item, routeVideoKey(item.bvid, item.page || 1), "setting-enabled", 0);
          } else {
            setStatus("已开启：抓到字幕后自动开始分析");
          }
        } else {
          setStatus("已关闭自动分析；仍可点击“开始分析”", "ok");
        }
      });
    }
    const playerSubtitleInput = root.querySelector('[data-role="player-subtitle"]');
    if (playerSubtitleInput) {
      playerSubtitleInput.checked = state.autoEnablePlayerSubtitle;
      playerSubtitleInput.addEventListener("change", (e) => {
        state.autoEnablePlayerSubtitle = !!e.target.checked;
        storageSet(PLAYER_SUBTITLE_STORE_KEY, state.autoEnablePlayerSubtitle ? "true" : "false");
        if (state.autoEnablePlayerSubtitle) enablePlayerSubtitle(currentTranscriptItem()).catch(() => {});
      });
    }

    root.querySelector('[data-role="mode"]').addEventListener("change", (e) => {
      state.mode = e.target.value || "auto";
      refreshContextUI();
      setStatus(
        state.mode === "auto"
          ? "已切回自动识别（默认偏单个视频）"
          : `已手动指定：${TYPE_LABEL[state.mode] || state.mode}`,
      );
    });

    const promptSel = root.querySelector('[data-role="prompt-select"]');
    if (promptSel) {
      promptSel.addEventListener("change", (e) => {
        const activeId = String(e.target.value || "");
        savePromptProfilesFromForm({ activeId });
        updatePromptUi(root, getActivePromptProfile());
        setStatus(activeId ? `提示词：${getActivePromptProfile()?.name || "未命名"}` : "当前没有提示词", activeId ? "ok" : "err");
      });
    }

    const preprocessToggle = root.querySelector('[data-role="preprocess-enabled"]');
    if (preprocessToggle) {
      preprocessToggle.checked = !!state.preprocessEnabled;
      preprocessToggle.addEventListener("change", (e) => {
        state.preprocessEnabled = !!e.target.checked;
        savePreprocessEnabledSetting(state.preprocessEnabled);
        refreshPromptSelector(root);
        refreshPreprocessModelSelector(root);
        setStatus(state.preprocessEnabled ? "字幕预处理已开启" : "字幕预处理已关闭：后处理将直接使用原始字幕", "ok");
      });
    }
    root.querySelector('[data-role="preprocess-prompt-select"]')?.addEventListener("change", (e) => {
      const id = String(e.target.value || "");
      savePromptProfilesFromForm({ activeId: state.activePromptId });
      savePromptProfiles(state.promptProfiles, state.activePromptId, id);
      setStatus(`预处理 Prompt：${getActivePreprocessPromptProfile()?.name || "未命名"}`, "ok");
    });
    root.querySelector('[data-role="preprocess-model-select"]')?.addEventListener("change", (e) => {
      state.preprocessModelId = String(e.target.value || "");
      storageSet(PREPROCESS_MODEL_STORE_KEY, state.preprocessModelId);
      const cfg = getPreprocessModelConfig();
      setStatus(`预处理模型：${cfg?.name || cfg?.model || "未选择"}`, cfg ? "ok" : "err");
    });

    root.querySelector('[data-role="prompt-search"]')?.addEventListener("input", debounce((e) => {
      state.promptSearch = String(e.target.value || "");
      renderPromptList(root);
    }, 60));
    root.querySelector('[data-role="ai-search"]')?.addEventListener("input", debounce((e) => {
      state.aiSearch = String(e.target.value || "");
      renderAiList(root);
    }, 60));
    root.querySelector('[data-role="knowledge-search"]')?.addEventListener("input", debounce((e) => {
      state.knowledgeSearch = String(e.target.value || "");
      renderKnowledgeWorkspace().catch(() => {});
    }, 70));
    root.addEventListener("mouseup", (e) => {
      if (e.target.closest?.('[data-role="knowledge-selection-toolbar"], [data-role="knowledge-rail"]')) return;
      setTimeout(captureKnowledgeSelection, 0);
    });

    const listBox = root.querySelector('[data-role="list"]');
    if (listBox) {
      listBox.addEventListener("change", (e) => {
        const cb = e.target.closest?.('input[type="checkbox"][data-i]');
        if (!cb) return;
        const i = Number(cb.getAttribute("data-i"));
        if (state.items[i]) state.items[i].selected = cb.checked;
        refreshAiChips();
      });
      listBox.addEventListener("click", (e) => {
        if (e.target.closest?.('input[type="checkbox"]')) return;
        const open = e.target.closest?.("[data-transcript-i]");
        if (!open) return;
        const item = state.items[Number(open.dataset.transcriptI)];
        if (item) selectTranscriptItem(item);
      });
    }
    root.querySelector('[data-role="library-search"]')?.addEventListener("input", debounce((e) => {
      state.libraryQuery = String(e.target.value || "").trim();
      renderList({ renderTranscript: false });
    }, 70));
    root.querySelector('[data-role="library-filters"]')?.addEventListener("click", (e) => {
      const button = e.target.closest?.("[data-library-filter]");
      if (!button) return;
      state.libraryFilter = String(button.dataset.libraryFilter || "all");
      renderList({ renderTranscript: false });
    });

    const transcriptSearch = root.querySelector('[data-role="transcript-search"]');
    transcriptSearch?.addEventListener("input", debounce((e) => {
      state.transcriptQuery = String(e.target.value || "").trim();
      renderTranscriptPanel();
    }, 80));
    root.querySelector('[data-role="transcript-track"]')?.addEventListener("change", (e) => {
      switchTranscriptTrack(Number(e.target.value)).catch((error) => {
        if (error?.name !== "AbortError") setStatus(`切换字幕失败: ${error.message || error}`, "err");
      });
    });
    const followInput = root.querySelector('[data-role="transcript-follow"]');
    if (followInput) {
      followInput.checked = state.transcriptAutoFollow;
      followInput.addEventListener("change", (e) => {
        state.transcriptAutoFollow = !!e.target.checked;
        storageSet(TRANSCRIPT_FOLLOW_STORE_KEY, state.transcriptAutoFollow ? "true" : "false");
        if (state.transcriptAutoFollow) updateTranscriptActiveCue(currentVideoTime(), true);
      });
    }
    const transcriptList = root.querySelector('[data-role="transcript-list"]');
    transcriptList?.addEventListener("click", (e) => {
      const timeButton = e.target.closest?.("[data-transcript-time]");
      if (!timeButton) return;
      seekTranscriptTime(Number(timeButton.dataset.transcriptTime));
    });
    transcriptList?.addEventListener("wheel", () => {
      state.transcriptUserScrollUntil = Date.now() + 3500;
    }, { passive: true });
    transcriptList?.addEventListener("touchmove", () => {
      state.transcriptUserScrollUntil = Date.now() + 3500;
    }, { passive: true });

    root.addEventListener("change", (e) => {
      const shortcutPref = e.target.closest?.("[data-shortcut-pref]");
      if (shortcutPref) {
        const key = String(shortcutPref.dataset.shortcutPref || "");
        if (key === "enabled") state.shortcutConfig.enabled = !!shortcutPref.checked;
        else if (["summonLayout", "summonTarget", "preferredDock"].includes(key)) state.shortcutConfig[key] = String(shortcutPref.value || "");
        saveShortcutSettings();
        renderShortcutSettings(root);
        setStatus(key === "enabled" ? `快捷键已${state.shortcutConfig.enabled ? "开启" : "关闭"}` : "快捷召唤偏好已保存", "ok");
        return;
      }
      const knowledgeModel = e.target.closest?.('[data-role="knowledge-model"]');
      if (knowledgeModel) {
        state.knowledgeModelId = String(knowledgeModel.value || "");
        storageSet(KNOWLEDGE_MODEL_STORE_KEY, state.knowledgeModelId);
        return;
      }
      const preEnabled = e.target.closest?.("[data-flow-preprocess-enabled]");
      if (preEnabled) {
        state.preprocessEnabled = !!preEnabled.checked;
        savePreprocessEnabledSetting(state.preprocessEnabled);
        renderAiFlowDrawer(); refreshAiChips();
        return;
      }
      const prePrompt = e.target.closest?.("[data-flow-preprompt]");
      if (prePrompt) {
        const id = String(prePrompt.value || "");
        savePromptProfiles(state.promptProfiles, state.activePromptId, id);
        renderAiFlowDrawer();
        return;
      }
      const preModel = e.target.closest?.("[data-flow-premodel]");
      if (preModel) {
        state.preprocessModelId = String(preModel.value || "");
        storageSet(PREPROCESS_MODEL_STORE_KEY, state.preprocessModelId);
        renderAiFlowDrawer();
        return;
      }
      const preConcurrency = e.target.closest?.("[data-flow-preconcurrency]");
      if (preConcurrency) {
        state.preprocessConcurrency = saveBoundedNumberSetting(PREPROCESS_CONCURRENCY_STORE_KEY, preConcurrency.value, PREPROCESS_DEFAULT_CONCURRENCY, 1, 8);
        return;
      }
      const preTargetMinutes = e.target.closest?.("[data-flow-pretarget-minutes]");
      if (preTargetMinutes) {
        state.preprocessTargetMinutes = saveBoundedNumberSetting(PREPROCESS_TARGET_MINUTES_STORE_KEY, preTargetMinutes.value, PREPROCESS_DEFAULT_TARGET_MINUTES, 2, 30);
        return;
      }
      const preOverlap = e.target.closest?.("[data-flow-preoverlap-seconds]");
      if (preOverlap) {
        state.preprocessOverlapSeconds = saveBoundedNumberSetting(PREPROCESS_OVERLAP_SECONDS_STORE_KEY, preOverlap.value, PREPROCESS_DEFAULT_OVERLAP_SECONDS, 0, 120);
        return;
      }
      const preMaxChars = e.target.closest?.("[data-flow-premax-chars]");
      if (preMaxChars) {
        state.preprocessMaxChars = saveBoundedNumberSetting(PREPROCESS_MAX_CHARS_STORE_KEY, preMaxChars.value, PREPROCESS_DEFAULT_MAX_CHARS, 8000, 60000);
        return;
      }
      const preRetries = e.target.closest?.("[data-flow-preretries]");
      if (preRetries) {
        state.preprocessRetries = saveBoundedNumberSetting(PREPROCESS_RETRIES_STORE_KEY, preRetries.value, PREPROCESS_DEFAULT_RETRIES, 0, 4);
        return;
      }
      const taskCard = e.target.closest?.("[data-flow-task-id]");
      if (taskCard) {
        const taskId = String(taskCard.dataset.flowTaskId || "");
        const tasks = currentPostTasks().map((t) => ({ ...t, modelIds: [...(t.modelIds || [])] }));
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        const promptSelect = e.target.closest?.("[data-flow-task-prompt]");
        if (promptSelect) task.promptId = String(promptSelect.value || "");
        const modelToggle = e.target.closest?.("[data-flow-task-model]");
        if (modelToggle) {
          const modelId = String(modelToggle.dataset.flowTaskModel || "");
          const set = new Set(task.modelIds || []);
          if (modelToggle.checked) set.add(modelId); else set.delete(modelId);
          task.modelIds = [...set];
        }
        savePostTasks(tasks);
      }
    });

    root.addEventListener("click", (e) => {
      const knowledgeSelectionAction = e.target.closest?.("[data-knowledge-selection-act]");
      if (knowledgeSelectionAction) {
        e.preventDefault();
        const action = knowledgeSelectionAction.dataset.knowledgeSelectionAct;
        Promise.resolve((async () => {
          const anchor = await ensureKnowledgeAnchorFromSelection({ starred: action === "save" });
          if (action === "save") { setStatus(`已收藏知识锚点：${anchor.selectedText}`, "ok"); return; }
          if (action === "question") {
            await renderKnowledgeRail();
            ensurePanel().querySelector('[data-role="knowledge-rail"] [data-role="knowledge-question"]')?.focus();
            return;
          }
          const question = action === "deep"
            ? `请深入解释「${anchor.selectedText}」，重点说明它在当前字幕语境中的机制、为什么重要、常见误解以及与相邻概念的关系。`
            : `什么是「${anchor.selectedText}」？请结合当前字幕说明它在这里的具体含义和作用。`;
          await knowledgeAsk(anchor.id, null, question);
        })()).catch((error) => setStatus(`Knowledge 操作失败：${error?.message || error}`, "err"));
        return;
      }
      const knowledgeMark = e.target.closest?.("[data-knowledge-anchor-id]");
      if (knowledgeMark) {
        e.preventDefault();
        openKnowledgeAnchor(knowledgeMark.dataset.knowledgeAnchorId).catch((error) => setStatus(`打开知识锚点失败：${error?.message || error}`, "err"));
        return;
      }
      if (e.target.closest?.("[data-knowledge-close]")) { e.preventDefault(); closeKnowledgeRail(); return; }
      if (e.target.closest?.("[data-knowledge-stop]")) { e.preventDefault(); abortKnowledgeRequest(); return; }
      if (e.target.closest?.("[data-knowledge-star-anchor]")) {
        e.preventDefault();
        const anchor = knowledgeAnchorById(state.knowledgeActiveAnchorId);
        if (anchor) {
          anchor.starred = !anchor.starred;
          anchor.updatedAt = Date.now();
          knowledgePutAnchor(anchor).then(() => {
            if (state.ui?.view === "knowledge") return renderKnowledgeWorkspace();
            return Promise.all([renderKnowledgeRail(), decorateKnowledgeAnchors()]);
          }).catch((error) => setStatus(`收藏失败：${error?.message || error}`, "err"));
        }
        return;
      }
      if (e.target.closest?.("[data-knowledge-star-node]")) {
        e.preventDefault();
        const node = knowledgeNodeById(state.knowledgeActiveNodeId);
        if (node) {
          node.starred = !node.starred;
          node.updatedAt = Date.now();
          knowledgePutNode(node).then(() => { if (state.ui?.view === "knowledge") return renderKnowledgeWorkspace(); return renderKnowledgeRail(); }).catch((error) => setStatus(`收藏失败：${error?.message || error}`, "err"));
        }
        return;
      }
      if (e.target.closest?.("[data-knowledge-back-list]")) { e.preventDefault(); state.knowledgeActiveAnchorId = ""; state.knowledgeActiveNodeId = ""; renderKnowledgeWorkspace().catch(() => {}); return; }
      if (e.target.closest?.("[data-knowledge-tree-toggle]")) { e.preventDefault(); state.knowledgeTreeOpen = !state.knowledgeTreeOpen; renderKnowledgeRail().catch(() => {}); return; }
      if (e.target.closest?.("[data-knowledge-open-workspace]")) { e.preventDefault(); setWorkspace("knowledge"); renderKnowledgeWorkspace().catch(() => {}); return; }
      if (e.target.closest?.("[data-knowledge-new-root]")) { e.preventDefault(); state.knowledgeActiveNodeId = ""; state.knowledgeTreeOpen = false; renderKnowledgeRail().then(() => ensurePanel().querySelector('[data-role="knowledge-question"]')?.focus()).catch(() => {}); return; }
      const knowledgeAnchorList = e.target.closest?.("[data-knowledge-anchor-list]");
      if (knowledgeAnchorList) { e.preventDefault(); state.knowledgeActiveAnchorId = String(knowledgeAnchorList.dataset.knowledgeAnchorList || ""); state.knowledgeActiveNodeId = ""; renderKnowledgeWorkspace().catch(() => {}); return; }
      const knowledgeNode = e.target.closest?.("[data-knowledge-node-id]");
      if (knowledgeNode) { e.preventDefault(); state.knowledgeActiveNodeId = String(knowledgeNode.dataset.knowledgeNodeId || ""); state.knowledgeTreeOpen = false; if (state.ui?.view === "knowledge") renderKnowledgeWorkspace().catch(() => {}); else renderKnowledgeRail().catch(() => {}); return; }
      const knowledgeSuggestion = e.target.closest?.("[data-knowledge-suggestion]");
      if (knowledgeSuggestion) {
        e.preventDefault();
        const q = String(knowledgeSuggestion.dataset.knowledgeSuggestion || "");
        knowledgeAsk(state.knowledgeActiveAnchorId, state.knowledgeActiveNodeId || null, q).catch((error) => setStatus(`Knowledge 追问失败：${error?.message || error}`, "err"));
        return;
      }
      const knowledgeQuick = e.target.closest?.("[data-knowledge-quick]");
      if (knowledgeQuick) {
        e.preventDefault();
        const anchor = knowledgeAnchorById(state.knowledgeActiveAnchorId);
        if (anchor) knowledgeAsk(anchor.id, null, `什么是「${anchor.selectedText}」？请结合当前字幕说明它在这里的具体含义和作用。`).catch((error) => setStatus(`Knowledge 追问失败：${error?.message || error}`, "err"));
        return;
      }
      const knowledgeSend = e.target.closest?.("[data-knowledge-send]");
      if (knowledgeSend) {
        e.preventDefault();
        const shell = knowledgeSend.closest('.bsb-knowledge-rail-body, .bsb-knowledge-detail-pane') || root;
        const input = shell.querySelector('[data-role="knowledge-question"]');
        const q = String(input?.value || "").trim();
        if (q) knowledgeAsk(state.knowledgeActiveAnchorId, state.knowledgeActiveNodeId || null, q).catch((error) => setStatus(`Knowledge 追问失败：${error?.message || error}`, "err"));
        return;
      }
      if (e.target.closest?.("[data-knowledge-seek]")) {
        e.preventDefault();
        const anchor = knowledgeAnchorById(state.knowledgeActiveAnchorId);
        if (anchor) {
          setWorkspace("ai");
          state.aiInputView = "processed";
          setAiWorkbenchStage("preprocess").then(() => {
            if (anchor.timeStart != null) seekToVideoTimestamp(anchor.timeStart, anchor.bvid, anchor.page || 1);
            openKnowledgeAnchor(anchor.id).catch(() => {});
          });
        }
        return;
      }
      if (e.target.closest?.("[data-knowledge-delete-anchor]")) {
        e.preventDefault();
        const anchor = knowledgeAnchorById(state.knowledgeActiveAnchorId);
        if (anchor && confirm(`删除知识锚点「${anchor.selectedText}」及其全部追问？`)) {
          knowledgeDeleteAnchor(anchor.id).then(() => renderKnowledgeWorkspace()).then(() => decorateKnowledgeAnchors()).catch((error) => setStatus(`删除失败：${error?.message || error}`, "err"));
        }
        return;
      }
      const flowStep = e.target.closest?.("[data-flow-step]");
      if (flowStep) {
        e.preventDefault();
        const shell = flowStep.closest(".bsb-flow-stepper");
        const input = shell?.querySelector('input[type="number"]');
        if (!input || input.disabled) return;
        const direction = Number(flowStep.dataset.flowStep || 0);
        const step = Math.max(0.000001, Number(input.step) || 1);
        const min = input.min === "" ? -Infinity : Number(input.min);
        const max = input.max === "" ? Infinity : Number(input.max);
        const current = Number(input.value);
        const base = Number.isFinite(current) ? current : 0;
        const next = Math.min(max, Math.max(min, base + direction * step));
        input.value = String(next);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
      const drawerBackdrop = e.target.closest?.('[data-role="ai-drawer-backdrop"]');
      if (drawerBackdrop) { e.preventDefault(); setAiDrawer(""); return; }
      const drawerAction = e.target.closest?.('[data-role="ai-flow-drawer"] button[data-act], [data-role="ai-input-drawer"] button[data-act]');
      if (drawerAction) {
        e.preventDefault();
        Promise.resolve(onAction(drawerAction.dataset.act)).catch((error) => setStatus(`操作失败: ${error?.message || error}`, "err"));
        return;
      }
      const inputView = e.target.closest?.("[data-input-view]");
      if (inputView) { e.preventDefault(); state.aiInputView = String(inputView.dataset.inputView || "raw"); renderAiInputDrawer(); return; }
      const aiStageTab = e.target.closest?.("[data-ai-stage]");
      if (aiStageTab) { e.preventDefault(); setAiWorkbenchStage(aiStageTab.dataset.aiStage).catch((error) => setStatus(`切换 AI 阶段失败: ${error?.message || error}`, "err")); return; }
      const preprocessView = e.target.closest?.("[data-ai-preprocess-view]");
      if (preprocessView) { e.preventDefault(); state.aiInputView = String(preprocessView.dataset.aiPreprocessView || "raw"); renderPreprocessCanvas().catch((error) => setStatus(`打开字幕失败: ${error?.message || error}`, "err")); return; }
      const outputTask = e.target.closest?.("[data-ai-output-task]");
      if (outputTask) { e.preventDefault(); selectAiOutputTask(outputTask.dataset.aiOutputTask).catch((error) => setStatus(`切换产物失败: ${error?.message || error}`, "err")); return; }
      const taskRemove = e.target.closest?.("[data-flow-task-remove]");
      if (taskRemove) {
        e.preventDefault();
        const id = String(taskRemove.dataset.flowTaskRemove || "");
        savePostTasks(currentPostTasks().filter((t) => t.id !== id));
        renderAiFlowDrawer();
        return;
      }
      const editorAction = e.target.closest?.('[data-role="prompt-editor"] button[data-act], [data-role="ai-editor"] button[data-act]');
      if (editorAction) {
        e.preventDefault();
        Promise.resolve(onAction(editorAction.dataset.act)).catch((error) => {
          setStatus(`设置操作失败: ${error?.message || error}`, "err");
        });
        return;
      }
      const shortcutRecord = e.target.closest?.("[data-shortcut-record]");
      if (shortcutRecord) {
        e.preventDefault();
        const id = String(shortcutRecord.dataset.shortcutRecord || "");
        if (!SHORTCUT_COMMANDS.some((command) => command.id === id)) return;
        state.shortcutRecordingId = id;
        renderShortcutSettings(root);
        root.querySelector(`[data-shortcut-record="${CSS.escape(id)}"]`)?.focus();
        setStatus("快捷键录制中 · 按 Esc 取消，Backspace / Delete 清除");
        return;
      }
      const shortcutReset = e.target.closest?.("[data-shortcut-reset]");
      if (shortcutReset) {
        e.preventDefault();
        const id = String(shortcutReset.dataset.shortcutReset || "");
        const command = SHORTCUT_COMMANDS.find((item) => item.id === id);
        if (!command) return;
        state.shortcutRecordingId = "";
        state.shortcutConfig.bindings[id] = command.defaultChord;
        saveShortcutSettings();
        renderShortcutSettings(root);
        setStatus(`已恢复：${command.label} · ${shortcutDisplayChord(command.defaultChord)}`, "ok");
        return;
      }
      const shortcutResetAll = e.target.closest?.("[data-shortcut-reset-all]");
      if (shortcutResetAll) {
        e.preventDefault();
        const preserved = {
          enabled: state.shortcutConfig.enabled,
          summonLayout: state.shortcutConfig.summonLayout,
          summonTarget: state.shortcutConfig.summonTarget,
          preferredDock: state.shortcutConfig.preferredDock,
        };
        state.shortcutConfig = { ...shortcutDefaults(), ...preserved, bindings: shortcutDefaults().bindings };
        state.shortcutRecordingId = "";
        saveShortcutSettings();
        renderShortcutSettings(root);
        setStatus("已恢复默认快捷键", "ok");
        return;
      }
      const settingsTab = e.target.closest?.("[data-settings-tab]");
      if (settingsTab) {
        e.preventDefault();
        try { savePromptProfilesFromForm({ activeId: state.activePromptId }); } catch (_) { /* noop */ }
        try { saveAiProfilesFromForm(); } catch (_) { /* noop */ }
        setSettingsTab(settingsTab.dataset.settingsTab);
        return;
      }
      const promptStageTab = e.target.closest?.("[data-prompt-stage-tab]");
      if (promptStageTab) {
        e.preventDefault();
        try { savePromptProfilesFromForm({ activeId: state.activePromptId }); } catch (_) { /* noop */ }
        setPromptStageTab(promptStageTab.dataset.promptStageTab);
        return;
      }
      const promptListItem = e.target.closest?.("[data-prompt-list-id]");
      if (promptListItem) {
        e.preventDefault();
        savePromptProfilesFromForm({ activeId: state.activePromptId });
        state.promptEditorId = String(promptListItem.dataset.promptListId || "");
        fillPromptConfigForm(root);
        return;
      }
      const aiListItem = e.target.closest?.("[data-ai-list-id]");
      if (aiListItem) {
        e.preventDefault();
        saveAiProfilesFromForm();
        state.aiEditorId = String(aiListItem.dataset.aiListId || "");
        fillAiConfigForm(root);
        return;
      }
      const promptTool = e.target.closest?.("[data-prompt-act]");
      if (promptTool) {
        e.preventDefault();
        handlePromptProfileAction(promptTool);
        return;
      }
      const profileTool = e.target.closest?.("[data-ai-profile-act]");
      if (profileTool) {
        e.preventDefault();
        handleAiProfileAction(profileTool);
        return;
      }
      const preprocessTab = e.target.closest?.("[data-ai-preprocess-tab]");
      if (preprocessTab) {
        e.preventDefault();
        selectPreprocessResult().catch((error) => setStatus(`打开预处理稿失败: ${error?.message || error}`, "err"));
        return;
      }
      const retryTab = e.target.closest?.("[data-ai-retry-id]");
      if (retryTab) {
        e.preventDefault();
        const runId = retryTab.dataset.aiRetryId;
        selectAiRun(runId)
          .then(() => regenerateActiveAiRun())
          .catch((error) => setStatus(`重新生成失败: ${error?.message || error}`, "err"));
        return;
      }
      const resultTab = e.target.closest?.("[data-ai-result-id]");
      if (resultTab) {
        e.preventDefault();
        selectAiRun(resultTab.dataset.aiResultId).catch((error) => {
          setStatus(`切换结果失败: ${error?.message || error}`, "err");
        });
        return;
      }
      const mermaidTool = e.target.closest?.("[data-mmd-act]");
      if (mermaidTool) {
        e.preventDefault();
        handleMermaidTool(mermaidTool);
        return;
      }
      const ts = e.target.closest?.(".bsb-time-link");
      if (!ts) return;
      e.preventDefault();
      seekToVideoTimestamp(
        Number(ts.dataset.seconds),
        ts.dataset.bvid || "",
        Number(ts.dataset.page) || 1,
      );
    });
    root.addEventListener("wheel", (e) => {
      const viewport = e.target.closest?.(".bsb-mermaid-viewport");
      if (!viewport || !e.ctrlKey) return;
      const card = viewport.closest(".bsb-mermaid-card");
      if (!card) return;
      e.preventDefault();
      setMermaidScale(card, getMermaidScale(card) + (e.deltaY < 0 ? 0.12 : -0.12));
    }, { passive: false });
    root.addEventListener("keydown", (e) => {
      const input = e.target.closest?.('[data-role="knowledge-question"]');
      if (!input || e.key !== "Enter" || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const q = String(input.value || "").trim();
      if (q) knowledgeAsk(state.knowledgeActiveAnchorId, state.knowledgeActiveNodeId || null, q).catch((error) => setStatus(`Knowledge 追问失败：${error?.message || error}`, "err"));
    });
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      hideKnowledgeSelectionToolbar();
      if (state.knowledgeRailOpen) { closeKnowledgeRail(); return; }
      if (state.aiDrawer) { setAiDrawer(""); return; }
      const hadMermaidModal = !!root.querySelector(".bsb-mermaid-modal");
      if (hadMermaidModal) {
        closeMermaidFullscreen();
        return;
      }
      if (state.aiFocus) {
        state.aiFocus = false;
        applyPanelGeometry();
        setStatus("已退出专注阅读");
      }
    });

    root.querySelectorAll("button[data-act]").forEach((btn) => {
      const act = btn.getAttribute("data-act");
      if (act === "dock" || act === "collapse") return;
      btn.addEventListener("click", () => onAction(act));
    });

    fillPromptConfigForm(root);
    setPromptStageTab(state.ui?.promptStage || "preprocess", { silent: true, preserveEditor: true });
    fillAiConfigForm(root);
    renderShortcutSettings(root);
    refreshShortcutHints();
    loadPostTasks();
    renderAiFlowDrawer();
    renderAiInputDrawer();
    refreshPreprocessModelSelector(root);
    setSettingsTab(state.ui?.settingsTab || "prompt", { silent: true });
    const captureDrawer = root.querySelector('[data-role="capture-drawer"]');
    if (captureDrawer) captureDrawer.hidden = !state.captureDrawerOpen;
    renderAiResultTabs();
    setAiWorkbenchStage(state.ui?.aiStage || "preprocess", { silent: true }).catch(() => {});
    bindAiScrollBehavior(root);
    setWorkspace((state.ui && state.ui.view) || "ai", { silent: true });
    refreshAiChips();
    return root;
  }

  function setWorkspace(view, opts) {
    const v = ["ai", "subs", "knowledge", "settings"].includes(view) ? view : "ai";
    const root = ensurePanel();
    if (state.ui) state.ui.view = v;
    const workspaceTitle = root.querySelector('[data-role="workspace-title"]');
    if (workspaceTitle) workspaceTitle.textContent = v === "subs" ? "字幕库" : v === "knowledge" ? "Knowledge" : v === "settings" ? "设置" : "AI 工作台";
    root.querySelectorAll(".bsb-nav [data-view]").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-view") === v);
    });
    root.querySelectorAll("[data-view-panel]").forEach((p) => {
      p.classList.toggle("active", p.getAttribute("data-view-panel") === v);
    });
    if (v === "ai") setAiWorkbenchStage(state.ui?.aiStage || "preprocess", { silent: true }).catch(() => {});
    if (v === "knowledge") renderKnowledgeWorkspace().catch((error) => setStatus(`知识库加载失败: ${error?.message || error}`, "err"));
    if (!opts?.silent) {
      saveUiGeom();
      if (v === "ai") refreshAiChips();
      if (v === "subs") {
        renderTranscriptPanel();
        bindTranscriptVideoEvents();
      }
      if (v === "settings") {
        setPromptStageTab(state.ui?.promptStage || "preprocess", { silent: true, preserveEditor: true });
        fillPromptConfigForm(root);
        fillAiConfigForm(root);
        setSettingsTab(state.ui?.settingsTab || "prompt", { silent: true });
      }
    }
  }

  function setSettingsTab(tab, opts) {
    const root = ensurePanel();
    const next = ["prompt", "llm", "shortcuts"].includes(tab) ? tab : "prompt";
    if (next !== "shortcuts" && state.shortcutRecordingId) state.shortcutRecordingId = "";
    if (state.ui) state.ui.settingsTab = next;
    root.querySelectorAll("[data-settings-tab]").forEach((button) => {
      const active = button.dataset.settingsTab === next;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    root.querySelectorAll("[data-settings-pane]").forEach((pane) => {
      pane.classList.toggle("active", pane.dataset.settingsPane === next);
    });
    if (next === "shortcuts") renderShortcutSettings(root);
    if (!opts?.silent) saveUiGeom();
  }


  function panelIsVisiblyOpen() {
    return !!(state.open && state.ui && (!state.ui.dock || state.ui.dockExpanded));
  }

  function applyShortcutSummonLayout(layout = state.shortcutConfig?.summonLayout || "remember") {
    const root = ensurePanel();
    const mode = ["remember", "floating", "right", "left"].includes(layout) ? layout : "remember";
    if (mode === "floating") {
      root._bsbSetDock?.(null);
      root._bsbSetOpen?.(true);
      return;
    }
    if (mode === "right" || mode === "left") {
      root._bsbSetDock?.(mode);
      root._bsbSetOpen?.(true);
      return;
    }
    root._bsbSetOpen?.(true);
  }

  async function openShortcutTarget(target = "remember") {
    const next = ["remember", "processed", "postprocess"].includes(target) ? target : "remember";
    if (next === "remember") return;
    setWorkspace("ai");
    if (next === "processed") {
      state.aiInputView = "processed";
      await setAiWorkbenchStage("preprocess");
      setStatus("快捷打开：AI 处理字幕", "ok");
      return;
    }
    await setAiWorkbenchStage("postprocess");
    setStatus("快捷打开：后处理结果", "ok");
  }

  async function executeShortcutCommand(commandId) {
    const root = ensurePanel();
    const config = state.shortcutConfig || loadShortcutSettings();
    if (commandId === "toggle-panel") {
      if (panelIsVisiblyOpen()) {
        if (state.ui?.dock) root._bsbToggleDockExpanded?.(false);
        else root._bsbSetOpen?.(false);
        return;
      }
      applyShortcutSummonLayout(config.summonLayout);
      await openShortcutTarget(config.summonTarget);
      return;
    }
    if (commandId === "open-processed") {
      applyShortcutSummonLayout(config.summonLayout);
      await openShortcutTarget("processed");
      return;
    }
    if (commandId === "open-postprocess") {
      applyShortcutSummonLayout(config.summonLayout);
      await openShortcutTarget("postprocess");
      return;
    }
    if (commandId === "toggle-dock") {
      if (state.ui?.dock) {
        root._bsbSetDock?.(null);
        root._bsbSetOpen?.(true);
        setStatus("快捷切换：悬浮模式", "ok");
      } else {
        const side = config.preferredDock === "left" ? "left" : "right";
        root._bsbSetDock?.(side);
        root._bsbSetOpen?.(true);
        setStatus(`快捷切换：${side === "right" ? "右" : "左"}侧靠边`, "ok");
      }
    }
  }

  let shortcutKeyHandlerBound = false;
  function bindGlobalShortcuts() {
    if (shortcutKeyHandlerBound) return;
    shortcutKeyHandlerBound = true;
    document.addEventListener("keydown", (event) => {
      if (state.shortcutRecordingId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const commandId = state.shortcutRecordingId;
        if (event.key === "Escape") {
          state.shortcutRecordingId = "";
          renderShortcutSettings();
          setStatus("已取消快捷键录制");
          return;
        }
        if ((event.key === "Backspace" || event.key === "Delete") && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
          state.shortcutConfig.bindings[commandId] = "";
          state.shortcutRecordingId = "";
          saveShortcutSettings();
          renderShortcutSettings();
          setStatus("已清除快捷键", "ok");
          return;
        }
        if (event.getModifierState?.("AltGraph")) {
          setStatus("AltGr 属于输入法修饰键，请换一个组合", "err");
          return;
        }
        const chord = shortcutChordFromEvent(event);
        if (!chord) return;
        if (!shortcutHasStrongModifier(chord)) {
          setStatus("为避免和 Bilibili 播放器冲突，请至少使用 Ctrl / Alt / Meta 之一", "err");
          return;
        }
        const conflict = shortcutConflictInfo(chord, commandId);
        if (conflict.level === "error") {
          setStatus(`快捷键冲突：${conflict.text}`, "err");
          return;
        }
        state.shortcutConfig.bindings[commandId] = chord;
        state.shortcutRecordingId = "";
        saveShortcutSettings();
        renderShortcutSettings();
        setStatus(conflict.level === "warn" ? `已绑定 ${shortcutDisplayChord(chord)} · ${conflict.text}` : `已绑定 ${shortcutDisplayChord(chord)}`, conflict.level === "warn" ? "" : "ok");
        return;
      }

      const config = state.shortcutConfig || loadShortcutSettings();
      if (!config.enabled || event.repeat || event.isComposing || event.getModifierState?.("AltGraph")) return;
      if (shortcutEditableTarget(event.target)) return;
      const chord = shortcutChordFromEvent(event);
      if (!chord) return;
      const command = SHORTCUT_COMMANDS.find((item) => config.bindings?.[item.id] && config.bindings[item.id] === chord);
      if (!command) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      Promise.resolve(executeShortcutCommand(command.id)).catch((error) => setStatus(`快捷键执行失败：${error?.message || error}`, "err"));
    }, true);
  }

  function setPromptStageTab(stage, opts) {
    const root = ensurePanel();
    const next = stage === "postprocess" ? "postprocess" : stage === "knowledge" ? "knowledge" : "preprocess";
    if (state.ui) state.ui.promptStage = next;
    if (!opts?.preserveEditor) {
      const prompts = state.promptProfiles?.length ? state.promptProfiles : loadPromptProfiles().prompts;
      const preferredId = next === "preprocess" ? state.activePrePromptId : next === "knowledge" ? state.activeKnowledgePromptId : state.activePromptId;
      state.promptEditorId = prompts.find((p) => p.stage === next && p.id === preferredId)?.id
        || prompts.find((p) => p.stage === next)?.id || "";
      state.promptSearch = "";
    }
    root.querySelectorAll("[data-prompt-stage-tab]").forEach((button) => {
      const active = button.dataset.promptStageTab === next;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    root.querySelectorAll("[data-prompt-create-stage]").forEach((button) => {
      button.hidden = button.dataset.promptCreateStage !== next;
    });
    const search = root.querySelector('[data-role="prompt-search"]');
    if (search) {
      search.placeholder = next === "preprocess" ? "搜索预处理 Prompt…" : next === "knowledge" ? "搜索 Knowledge Prompt…" : "搜索后处理 Prompt…";
      if (search.value !== state.promptSearch) search.value = state.promptSearch;
    }
    const context = root.querySelector('[data-role="prompt-stage-context"]');
    if (context) {
      context.innerHTML = next === "preprocess"
        ? '<span>预处理 · 原始字幕 → 规范化简体中文字幕稿</span><span>PRE</span>'
        : next === "knowledge"
          ? '<span>Knowledge · 字幕锚点 → 独立追问树</span><span>DRILL</span>'
          : '<span>后处理 · 规范化字幕稿 → Mermaid / 笔记 / 自测等产物</span><span>POST</span>';
    }
    fillPromptConfigForm(root);
    if (!opts?.silent) saveUiGeom();
  }

  function refreshAiChips() {
    const root = document.getElementById(PANEL_ID);
    if (!root) return;
    const sel = state.items.filter((it) => it.selected).length;
    const ok = state.items.filter((it) => it.selected && it.subStatus === "ok").length;
    const elSel = root.querySelector('[data-role="chip-sel"]');
    const elOk = root.querySelector('[data-role="chip-ok"]');
    const elModel = root.querySelector('[data-role="chip-model"]');
    if (elSel) elSel.textContent = String(sel);
    if (elOk) elOk.textContent = String(ok);
    if (elModel) {
      const tasks = currentPostTasks().filter((t) => t.enabled !== false);
      const runCount = tasks.reduce((n, t) => n + (t.modelIds || []).length, 0);
      elModel.textContent = `${tasks.length} 产物 · ${runCount} runs`;
    }
    const inputLabel = root.querySelector('[data-role="ai-input-label"]');
    if (inputLabel) {
      const ready = !!state.aiSessionInput;
      const mode = state.preprocessEnabled ? (state.aiSessionInput?.vars?.processedSubtitle ? "已规范化" : "预处理开启") : "原始字幕";
      inputLabel.textContent = `输入 · ${sel} 视频 · ${ready ? mode : "待运行"}`;
    }
    const flowSummary = root.querySelector('[data-role="flow-summary"]');
    if (flowSummary) {
      const tasks = currentPostTasks().filter((t) => t.enabled !== false);
      const runs = tasks.reduce((n, t) => n + (t.modelIds || []).length, 0);
      flowSummary.textContent = `${tasks.length} 个产物 · ${runs} 个版本`;
    }
    renderAiResultTabs();
    applyAiWorkbenchStageUi();
    if (currentAiWorkbenchStage() === "preprocess") {
      const status = root.querySelector('[data-role="ai-preprocess-status"]');
      if (status) {
        const raw = currentInputPreviewText("raw");
        const processed = currentInputPreviewText("processed");
        status.textContent = !raw ? "当前视频暂无字幕" : processed ? "AI 字幕已就绪" : state.preprocessEnabled ? "原始字幕已就绪" : "预处理已关闭";
      }
    }
  }

  function setStatus(text, cls) {
    const el = document.querySelector(`#${PANEL_ID} [data-role="status"]`);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("ok", "err");
    if (cls) el.classList.add(cls);
    const dot = document.querySelector(`#${PANEL_ID} [data-role="status-dot"]`);
    if (dot) {
      dot.classList.remove("ok", "err", "busy");
      if (cls === "ok") dot.classList.add("ok");
      else if (cls === "err") dot.classList.add("err");
      else if (state.busy || state.aiBusy) dot.classList.add("busy");
    }
    const meta = document.querySelector(`#${PANEL_ID} [data-role="ai-canvas-meta"]`);
    if (meta && (state.ui?.view === "ai" || !state.ui)) {
      meta.textContent = (text || "").slice(0, 48);
    }
  }

  /**
   * 不再用一个布尔值禁用整个工具栏。
   * 主入口（扫描、全选、全不选、送去 AI）始终可点击；冲突操作由各自函数排队、重启或提示。
   */
  function operationBusy() {
    return !!(state.scanBusy || state.batchBusy);
  }

  function refreshActionDisabledState() {
    const root = document.getElementById(PANEL_ID);
    if (!root) return;

    const mainActions = new Set([
      "scan", "sel-all", "sel-none", "ai-send",
      "cancel", "ai-stop", "dock", "collapse",
    ]);
    const batchActions = new Set(["copy", "copy-bvid", "dl-srt", "dl-txt", "dl-ok-only", "fetch-selected"]);

    root.querySelectorAll("button[data-act]").forEach((button) => {
      const act = button.getAttribute("data-act");
      if (act === "cancel") {
        button.style.display = operationBusy() ? "" : "none";
        button.disabled = false;
        return;
      }
      if (mainActions.has(act)) {
        button.disabled = false;
        return;
      }

      // 只有会读取/改写同一字幕列表的批处理按钮在操作期间临时锁定。
      // 不再把设置、阅读、字幕搜索、模型结果等无关控件一起变灰。
      button.disabled = batchActions.has(act) && operationBusy();
    });
  }

  function syncOperationBusy() {
    state.busy = operationBusy();
    refreshActionDisabledState();
  }

  function setScanBusy(busy) {
    state.scanBusy = !!busy;
    syncOperationBusy();
  }

  function setBatchBusy(busy) {
    state.batchBusy = !!busy;
    syncOperationBusy();
  }

  // 兼容旧调用；新代码不再使用全局 setBusy。
  function setBusy(busy) {
    setBatchBusy(busy);
  }

  function flushPendingMainAction() {
    if (operationBusy()) return;
    if (state.pendingRescan) {
      state.pendingRescan = false;
      window.setTimeout(() => doScan(), 0);
      return;
    }
    if (state.pendingAiSend) {
      state.pendingAiSend = false;
      window.setTimeout(() => doAiAnalyze(), 0);
    }
  }

  function stopAiBatchForRestart() {
    if (!state.aiBusy) return;
    // 先使旧 doAiAnalyze 的 finally 失效，避免它稍后清理新会话。
    state.aiSessionSeq += 1;
    state.aiAbort = true;
    abortAllAiRuns();
    state.aiRunOrder.forEach((id) => {
      const run = state.aiRuns.get(id);
      if (!run || !run.busy) return;
      run.busy = false;
      run.status = "stopped";
      run.statusText = "已停止 · 准备重新分析";
      run.finishedAt = Date.now();
    });
    setAiBusy(false);
    state.aiAbort = false;
  }

  function refreshContextUI() {
    const root = ensurePanel();
    const modeSel = root.querySelector('[data-role="mode"]');
    if (modeSel) {
      // 下拉为源：用户手动选择会保留；非法值回退 state.mode
      if (MODE_OPTIONS.includes(modeSel.value)) state.mode = modeSel.value;
      else modeSel.value = state.mode || "auto";
    }

    const auto = detectContext(location.href);
    state.autoCtx = auto;
    const ctx = resolveContext();
    state.ctx = ctx;

    const badge = root.querySelector('[data-role="type"]');
    badge.textContent =
      (ctx.source === "manual" ? "手动 · " : "自动 · ") +
      (TYPE_LABEL[ctx.type] || ctx.type);
    badge.classList.toggle("manual", ctx.source === "manual");

    root.querySelector('[data-role="ctx"]').textContent = formatCtxBits(ctx);

    const hint = root.querySelector('[data-role="auto-hint"]');
    if (hint) {
      const autoLabel = TYPE_LABEL[auto.type] || auto.type;
      if (state.mode === "auto") {
        hint.innerHTML = `识别：<strong>${escapeHtml(autoLabel)}</strong>`;
      } else {
        hint.innerHTML = `自动本会是：<strong>${escapeHtml(autoLabel)}</strong>（已手动覆盖）`;
      }
    }
  }

  function libraryStatus(item) {
    const status = String(item?.subStatus || "wait");
    return ["ok", "empty", "error", "wait"].includes(status) ? status : "wait";
  }

  function libraryStatusLabel(item) {
    const status = libraryStatus(item);
    if (status === "ok") return `${item?.cue_count || item?.data?.length || 0} 条`;
    if (status === "empty") return "无字幕";
    if (status === "error") return "失败";
    return "待抓取";
  }

  function libraryFilteredEntries() {
    const query = String(state.libraryQuery || "").trim().toLocaleLowerCase();
    const filter = String(state.libraryFilter || "all");
    return state.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => filter === "all" || libraryStatus(item) === filter)
      .filter(({ item }) => {
        if (!query) return true;
        const haystack = [
          item?.title, item?.bvid, item?.author, item?.part,
          ...(Array.isArray(item?.sources) ? item.sources : []),
        ].filter(Boolean).join(" ").toLocaleLowerCase();
        return haystack.includes(query);
      });
  }

  function renderLibraryCounts(root) {
    const counts = { all: state.items.length, ok: 0, wait: 0, error: 0, empty: 0 };
    state.items.forEach((item) => { counts[libraryStatus(item)] += 1; });
    Object.entries(counts).forEach(([key, value]) => {
      const el = root.querySelector(`[data-library-count="${key}"]`);
      if (el) el.textContent = String(value);
    });
    root.querySelectorAll("[data-library-filter]").forEach((button) => {
      button.classList.toggle("active", button.dataset.libraryFilter === state.libraryFilter);
    });
    return counts;
  }

  function renderList({ renderTranscript = true } = {}) {
    const root = document.getElementById(PANEL_ID);
    const box = root?.querySelector('[data-role="list"]');
    if (!box || !root) return;
    renderLibraryCounts(root);
    const entries = libraryFilteredEntries();
    const visible = root.querySelector('[data-role="library-visible-count"]');
    if (visible) visible.textContent = `${entries.length} / ${state.items.length}`;

    if (!state.items.length) {
      box.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">≡</div><strong>字幕库为空</strong><span>点击「＋ 采集视频」，或直接打开一个视频自动加入。</span></div>`;
      if (renderTranscript) renderTranscriptPanel();
      refreshAiChips();
      return;
    }
    if (!entries.length) {
      box.innerHTML = `<div class="bsb-empty"><strong>没有匹配项</strong><span>调整搜索词或字幕状态筛选。</span></div>`;
      if (renderTranscript) renderTranscriptPanel();
      refreshAiChips();
      return;
    }

    box.innerHTML = entries.map(({ item: it, index: i }) => {
      const status = libraryStatus(it);
      const stClass = status === "ok" ? "st-ok" : status === "empty" ? "st-empty" : status === "error" ? "st-err" : "st-wait";
      const active = routeVideoKey(it.bvid, it.page || 1) === state.transcriptItemKey;
      const bvPart = `${escapeHtml(it.bvid || "")}${Number(it.page || 1) > 1 ? ` · P${Number(it.page || 1)}` : ""}`;
      const author = escapeHtml(it.author || "");
      const source = Array.isArray(it.sources) && it.sources.length ? escapeHtml(it.sources[it.sources.length - 1]) : "";
      const secondary = [author, bvPart, source].filter(Boolean).join(" · ");
      return `<div class="bsb-resource-item${active ? " active" : ""}" data-transcript-i="${i}" title="${escapeAttr(it.title || it.bvid || "")}">
        <input type="checkbox" data-i="${i}" ${it.selected ? "checked" : ""} aria-label="选择 ${escapeAttr(it.title || it.bvid || "视频")}">
        <div class="bsb-resource-main">
          <div class="bsb-resource-title">${escapeHtml(it.title || it.bvid || "未命名视频")}</div>
          <div class="bsb-resource-meta"><span>${secondary}</span><span class="bsb-resource-status ${stClass}">${libraryStatusLabel(it)}</span></div>
        </div>
      </div>`;
    }).join("");
    refreshAiChips();
    if (renderTranscript) renderTranscriptPanel();
  }

  function waitForPlayerElement(selector, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (!element) return;
        observer.disconnect();
        clearTimeout(timer);
        resolve(element);
      });
      const timer = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error(`等待播放器元素超时: ${selector}`));
      }, timeout);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  async function enablePlayerSubtitle(item) {
    if (!state.autoEnablePlayerSubtitle) return;
    if (state.playerSubtitleOperation) return state.playerSubtitleOperation;
    state.playerSubtitleOperation = (async () => {
      const button = await waitForPlayerElement(PLAYER_SUBTITLE_SELECTORS.button, 9000);
      let panel = document.querySelector(PLAYER_SUBTITLE_SELECTORS.panel);
      if (!panel || panel.offsetParent === null) {
        button.click();
        panel = await waitForPlayerElement(PLAYER_SUBTITLE_SELECTORS.panel, 2500);
        await sleep(100);
      }
      const active = panel.querySelector(PLAYER_SUBTITLE_SELECTORS.active);
      if (!active) {
        const items = Array.from(panel.querySelectorAll(PLAYER_SUBTITLE_SELECTORS.item));
        if (!items.length) throw new Error("播放器没有可开启字幕");
        const wanted = String(item?.lan || "");
        const target = (wanted && items.find((node) => node.dataset.lan === wanted))
          || items.find((node) => /^(ai-zh|zh-CN|zh-Hans|zh)$/i.test(node.dataset.lan || ""))
          || items[0];
        target.click();
        await sleep(140);
      }
      if (panel.offsetParent !== null) button.click();
    })().catch((error) => {
      console.debug("[bili-subbatch] player subtitle not enabled", error?.message || error);
    }).finally(() => {
      state.playerSubtitleOperation = null;
    });
    return state.playerSubtitleOperation;
  }

  function formatTranscriptTime(seconds, withHours = false) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    if (withHours || h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function currentTranscriptItem() {
    if (state.transcriptItemKey) {
      const exact = state.items.find(
        (item) => routeVideoKey(item.bvid, item.page || 1) === state.transcriptItemKey,
      );
      // 列表中的同一视频已有完整字幕时，以列表对象为准并同步独立引用。
      if (exact?.subStatus === "ok" && exact.data?.length) {
        state.transcriptItem = exact;
        return exact;
      }
      // 兼容独立字幕引用：即使当前条目暂时不在可见筛选结果中也继续显示。
      if (
        state.transcriptItem &&
        routeVideoKey(state.transcriptItem.bvid, state.transcriptItem.page || 1) ===
          state.transcriptItemKey
      ) {
        return state.transcriptItem;
      }
      return exact || null;
    }
    const first = state.items.find((item) => item.subStatus === "ok" && item.data?.length) || null;
    if (first) state.transcriptItem = first;
    return first;
  }

  function rememberTranscriptItem(item) {
    if (!item) return null;
    state.transcriptItem = item;
    state.transcriptItemKey = routeVideoKey(item.bvid, item.page || 1);
    return item;
  }

  function copySubtitleState(target, source) {
    if (!target || !source) return target;
    const fields = [
      "aid", "cid", "pages", "subStatus", "cue_count", "data", "error",
      "lan", "lan_doc", "tracks", "activeTrackIndex", "cachePath", "cacheLevel",
      "cacheStale", "source", "autoCaptured",
    ];
    fields.forEach((field) => {
      if (source[field] !== undefined) target[field] = source[field];
    });
    return target;
  }

  function selectTranscriptItem(item, { focusSearch = false } = {}) {
    if (!item) return;
    rememberTranscriptItem(item);
    state.transcriptQuery = "";
    state.transcriptFilteredIndexes = null;
    state.transcriptActiveCueIndex = -1;
    const root = ensurePanel();
    const input = root.querySelector('[data-role="transcript-search"]');
    if (input) input.value = "";
    renderList();
    bindTranscriptVideoEvents();
    updateTranscriptActiveCue(currentVideoTime(), true);
    if (focusSearch) {
      setWorkspace("subs");
      input?.focus();
    }
  }

  function appendTranscriptHighlightedText(container, text, query) {
    if (!query) {
      container.textContent = text;
      return;
    }
    const source = String(text || "");
    const lower = source.toLocaleLowerCase();
    const needle = query.toLocaleLowerCase();
    let cursor = 0;
    let index = lower.indexOf(needle);
    while (index >= 0) {
      if (index > cursor) container.append(document.createTextNode(source.slice(cursor, index)));
      const mark = document.createElement("mark");
      mark.textContent = source.slice(index, index + query.length);
      container.append(mark);
      cursor = index + query.length;
      index = lower.indexOf(needle, cursor);
    }
    if (cursor < source.length) container.append(document.createTextNode(source.slice(cursor)));
  }

  function populateTranscriptTrackSelect(item) {
    const select = document.querySelector(`#${PANEL_ID} [data-role="transcript-track"]`);
    if (!select) return;
    const tracks = Array.isArray(item?.tracks) ? item.tracks : [];
    select.replaceChildren();
    if (!tracks.length) {
      select.appendChild(new Option(item?.lan_doc || item?.lan || "默认字幕", "0"));
      select.disabled = true;
      return;
    }
    tracks.forEach((track, index) => {
      select.appendChild(new Option(track.lan_doc || track.lan || `字幕 ${index + 1}`, String(index)));
    });
    const active = Number.isInteger(item.activeTrackIndex) ? item.activeTrackIndex : preferredTrackIndex(tracks);
    state.transcriptTrackIndex = active;
    select.value = String(Math.max(0, active));
    select.disabled = tracks.length <= 1;
  }

  function filterTranscriptIndexes(cues, query) {
    const needle = String(query || "").trim().toLocaleLowerCase();
    const indexes = [];
    (cues || []).forEach((cue, index) => {
      if (!needle || String(cue?.content || "").toLocaleLowerCase().includes(needle)) indexes.push(index);
    });
    return indexes;
  }

  function renderTranscriptPanel() {
    const root = document.getElementById(PANEL_ID);
    if (!root) return;
    const list = root.querySelector('[data-role="transcript-list"]');
    const title = root.querySelector('[data-role="transcript-title"]');
    const meta = root.querySelector('[data-role="transcript-meta"]');
    const count = root.querySelector('[data-role="transcript-count"]');
    if (!list || !title || !meta || !count) return;

    const item = currentTranscriptItem();
    if (!item || item.subStatus !== "ok" || !item.data?.length) {
      title.textContent = item?.title || "当前视频字幕";
      const status = item ? libraryStatus(item) : "";
      meta.textContent = !item
        ? "从左侧选择一个视频"
        : status === "error"
          ? `${item.bvid || ""}${item.page > 1 ? ` · P${item.page}` : ""} · 抓取失败`
          : status === "empty"
            ? `${item.bvid || ""}${item.page > 1 ? ` · P${item.page}` : ""} · 无字幕`
            : `${item.bvid || ""}${item.page > 1 ? ` · P${item.page}` : ""} · 待抓取`;
      count.textContent = "";
      populateTranscriptTrackSelect(null);
      list.innerHTML = item
        ? `<div class="bsb-transcript-empty">${status === "error" ? "字幕抓取失败，可点击右上角刷新重试。" : status === "empty" ? "这个视频没有可读取字幕。" : "该视频尚未抓取字幕，可勾选后点击左侧「抓取所选」。"}</div>`
        : `<div class="bsb-transcript-empty">从左侧选择一个视频。<br>已有字幕的项目会直接显示全文。</div>`;
      return;
    }

    if (!state.transcriptItemKey) state.transcriptItemKey = routeVideoKey(item.bvid, item.page || 1);
    title.textContent = item.title || `${item.bvid} 字幕`;
    meta.textContent = `${item.cue_count || item.data.length} 条 · ${item.lan_doc || item.lan || "字幕"} · ${item.cachePath || item.source || "已加载"}`;
    populateTranscriptTrackSelect(item);

    const query = state.transcriptQuery.trim();
    const indexes = filterTranscriptIndexes(item.data, query);
    state.transcriptFilteredIndexes = query ? indexes : null;
    count.textContent = query ? `${indexes.length}/${item.data.length}` : String(item.data.length);

    const epoch = ++state.transcriptRenderEpoch;
    const fragment = document.createDocumentFragment();
    for (const index of indexes) {
      const cue = item.data[index];
      const row = document.createElement("div");
      row.className = "bsb-transcript-row";
      if (index === state.transcriptActiveCueIndex) row.classList.add("active");
      row.dataset.cueIndex = String(index);

      const time = document.createElement("button");
      time.type = "button";
      time.className = "bsb-transcript-time";
      time.dataset.transcriptTime = String(cue.from_sec ?? parseSeconds(cue.from));
      time.textContent = formatTranscriptTime(cue.from_sec ?? parseSeconds(cue.from));
      time.title = `跳转到 ${formatTranscriptTime(cue.from_sec ?? parseSeconds(cue.from), true)}`;

      const text = document.createElement("p");
      text.className = "bsb-transcript-text";
      appendTranscriptHighlightedText(text, cue.content || "", query);
      row.append(time, text);
      fragment.appendChild(row);
    }
    if (epoch !== state.transcriptRenderEpoch) return;
    list.replaceChildren(fragment);
    updateTranscriptActiveCue(currentVideoTime(), true);
  }

  function transcriptCueIndexAt(cues, time) {
    let low = 0;
    let high = cues.length - 1;
    let candidate = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const from = Number(cues[mid].from_sec ?? parseSeconds(cues[mid].from));
      if (time < from) high = mid - 1;
      else { candidate = mid; low = mid + 1; }
    }
    if (candidate < 0) return -1;
    const cue = cues[candidate];
    const to = Number(cue.to_sec ?? parseSeconds(cue.to));
    return time <= to + 0.2 ? candidate : -1;
  }

  function currentVideoTime() {
    return Number(document.querySelector("video")?.currentTime || 0);
  }

  function updateTranscriptActiveCue(time, force = false) {
    const item = currentTranscriptItem();
    if (!item?.data?.length) return;
    const index = transcriptCueIndexAt(item.data, Number(time) || 0);
    const root = document.getElementById(PANEL_ID);
    if (index < 0) {
      root?.querySelector(".bsb-transcript-row.active")?.classList.remove("active");
      state.transcriptActiveCueIndex = -1;
      return;
    }
    if (!force && index === state.transcriptActiveCueIndex) return;
    root?.querySelector(".bsb-transcript-row.active")?.classList.remove("active");
    state.transcriptActiveCueIndex = index;
    const row = root?.querySelector(`.bsb-transcript-row[data-cue-index="${index}"]`);
    row?.classList.add("active");
    if (!row || !state.transcriptAutoFollow || state.ui?.view !== "subs") return;
    if (!force && Date.now() < state.transcriptUserScrollUntil) return;
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    row.scrollIntoView({ block: "center", behavior });
  }

  function bindTranscriptVideoEvents() {
    state.transcriptVideoAbort?.abort();
    const video = document.querySelector("video");
    if (!video) return;
    const controller = new AbortController();
    state.transcriptVideoAbort = controller;
    const update = () => updateTranscriptActiveCue(video.currentTime);
    video.addEventListener("timeupdate", update, { passive: true, signal: controller.signal });
    video.addEventListener("seeking", update, { passive: true, signal: controller.signal });
    video.addEventListener("loadedmetadata", update, { passive: true, signal: controller.signal });
    update();
  }

  function seekTranscriptTime(seconds) {
    const item = currentTranscriptItem();
    if (!item || !Number.isFinite(seconds)) return;
    seekToVideoTimestamp(seconds, item.bvid, item.page || 1);
    updateTranscriptActiveCue(seconds, true);
  }

  async function switchTranscriptTrack(index) {
    const item = currentTranscriptItem();
    if (!item?.tracks?.length || !item.tracks[index]) return;
    state.transcriptSwitchAbort?.abort();
    const controller = new AbortController();
    state.transcriptSwitchAbort = controller;
    setStatus(`正在切换到 ${item.tracks[index].lan_doc || item.tracks[index].lan || "字幕"}…`);
    const base = {
      bvid: item.bvid, aid: item.aid, cid: item.cid, title: item.title,
      author: item.author, pages: item.pages || [], page: item.page || 1,
    };
    const result = await fetchTrackBodyFast(base, item.tracks, index, controller.signal);
    if (controller.signal.aborted) return;
    Object.assign(item, result, { selected: item.selected !== false });
    rememberTranscriptItem(item);
    lruSet(state.fastSubtitleCache, `${item.bvid}:${item.cid}`, item);
    persistentCacheWrite(`subtitle:${item.bvid}:${item.cid}`, item).catch(() => {});
    state.transcriptQuery = "";
    const input = ensurePanel().querySelector('[data-role="transcript-search"]');
    if (input) input.value = "";
    renderList();
    setStatus(`已切换 ${item.lan_doc || item.lan} · ${item.cue_count} 条`, "ok");
  }

  async function refreshCurrentTranscript() {
    const item = currentTranscriptItem();
    const ctx = detectContext(location.href);
    const bvid = item?.bvid || ctx.bvid;
    const page = item?.page || ctx.page || 1;
    if (!bvid) return setStatus("当前页面没有可刷新的视频", "err");
    state.autoCaptureKey = "";
    state.autoAnalyzeKey = "";
    state.autoAnalyzePendingKey = "";
    clearTimeout(state.autoAnalyzeTimer);
    state.fastSubtitleCache.delete(`${bvid}:${item?.cid || ""}`);
    await autoCaptureCurrentVideo("manual-refresh", { forceNetwork: true, requestedBvid: bvid, requestedPage: page });
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function selectedItems() {
    return state.items.filter((it) => it.selected);
  }

  async function onAction(act) {
    if (act === "cancel") {
      state.cancel = true;
      state.cancelScan = true;
      state.cancelBatch = true;
      setStatus("正在停止扫描/字幕任务…");
      return;
    }
    if (act === "ai-stop") {
      state.aiAbort = true;
      abortAllAiRuns();
      setStatus("正在停止 AI Pipeline（预处理 + 后处理）…");
      return;
    }
    if (act === "ai-toggle") {
      toggleAiPanel();
      return;
    }
    if (act === "ai-flow-drawer") {
      setAiDrawer(state.aiDrawer === "flow" ? "" : "flow");
      return;
    }
    if (act === "ai-input-drawer") {
      setAiDrawer(state.aiDrawer === "input" ? "" : "input");
      return;
    }
    if (act === "ai-drawer-close") {
      setAiDrawer("");
      return;
    }
    if (act === "ai-copy-input") {
      const text = currentInputPreviewText(state.aiInputView);
      if (!text) { setStatus("当前没有可复制的输入", "err"); return; }
      if (typeof GM_setClipboard === "function") GM_setClipboard(text); else await navigator.clipboard.writeText(text);
      setStatus(`已复制${state.aiInputView === "processed" ? "规范化稿" : "原始字幕"}`, "ok");
      return;
    }
    if (act === "post-task-add") {
      const prompts = state.promptProfiles?.length ? state.promptProfiles : loadPromptProfiles().prompts;
      const posts = prompts.filter((p) => p.stage === "postprocess");
      if (!posts.length) { setStatus("请先在设置 → Prompt 新建一个后处理 Prompt", "err"); return; }
      const tasks = currentPostTasks().map((t) => ({ ...t, modelIds: [...(t.modelIds || [])] }));
      const used = new Set(tasks.map((t) => t.promptId));
      const prompt = posts.find((p) => !used.has(p.id)) || posts.find((p) => p.id === state.activePromptId) || posts[0];
      const modelIds = (state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles()).filter((p) => p.enabled).map((p) => p.id);
      const task = normalizePostTask({ id: makePostTaskId(), promptId: prompt.id, modelIds, enabled: true, order: tasks.length }, tasks.length);
      tasks.push(task);
      state.aiActiveTaskId = task.id;
      savePostTasks(tasks);
      renderAiFlowDrawer();
      setStatus(`已添加产物：${prompt.name}`, "ok");
      return;
    }
    if (act === "prompt-save") {
      const library = savePromptProfilesFromForm({ activeId: ensurePanel().querySelector('[data-role="prompt-select"]')?.value || state.activePromptId });
      fillPromptConfigForm(ensurePanel());
      const current = library.prompts.find((p) => p.id === state.promptEditorId);
      setStatus(`已保存 Prompt：${current?.name || getActivePromptProfile()?.name || "未命名"}`, "ok");
      return;
    }
    if (act === "prompt-add" || act === "prompt-add-pre" || act === "prompt-add-knowledge") {
      const library = savePromptProfilesFromForm({ activeId: state.activePromptId });
      const stage = act === "prompt-add-pre" ? "preprocess" : act === "prompt-add-knowledge" ? "knowledge" : "postprocess";
      const next = createPromptProfile({
        id: makePromptProfileId(),
        stage,
        name: stage === "preprocess" ? `字幕预处理 ${library.prompts.filter((p) => p.stage === "preprocess").length + 1}` : stage === "knowledge" ? `知识追问 ${library.prompts.filter((p) => p.stage === "knowledge").length + 1}` : `后处理提示词 ${library.prompts.filter((p) => p.stage === "postprocess").length + 1}`,
        hint: stage === "preprocess" ? "字幕预处理" : stage === "knowledge" ? "局部知识追问" : "后处理提示词",
        systemPrompt: "",
        userPromptTemplate: stage === "knowledge" ? "{{question}}" : "{{subtitle}}",
      }, library.prompts.length);
      const prompts = [...library.prompts, next];
      savePromptProfiles(prompts, library.activeId, library.activePreprocessId, library.activeKnowledgeId);
      state.promptEditorId = next.id;
      state.promptSearch = "";
      if (state.ui) state.ui.promptStage = stage;
      setPromptStageTab(stage, { silent: true, preserveEditor: true });
      fillPromptConfigForm(ensurePanel());
      setStatus(`已新增提示词：${next.name}`, "ok");
      return;
    }
    if (act === "prompt-reset") {
      const library = savePromptProfilesFromForm({ activeId: state.activePromptId });
      const pre = createPromptProfile(DEFAULT_PREPROCESS_PROMPT, 0);
      const post = createPromptProfile(DEFAULT_MERMAID_PROMPT, 1);
      const knowledge = createPromptProfile(DEFAULT_KNOWLEDGE_PROMPT, 2);
      const prompts = library.prompts.filter((p) => ![DEFAULT_PREPROCESS_PROMPT_ID, DEFAULT_PROMPT_ID, DEFAULT_KNOWLEDGE_PROMPT_ID].includes(p.id));
      prompts.unshift(knowledge);
      prompts.unshift(post);
      prompts.unshift(pre);
      savePromptProfiles(prompts, post.id, pre.id, knowledge.id);
      state.promptEditorId = pre.id;
      state.promptSearch = "";
      if (state.ui) state.ui.promptStage = "preprocess";
      setPromptStageTab("preprocess", { silent: true, preserveEditor: true });
      setStatus("已恢复内置『字幕规范化』『全 Mermaid 学习图谱』『局部知识追问』；其他自定义提示词保持不变", "ok");
      return;
    }
    if (act === "ai-save") {
      const profiles = saveAiProfilesFromForm();
      fillAiConfigForm(ensurePanel());
      const current = profiles.find((p) => p.id === state.aiEditorId);
      setStatus(`已保存 LLM：${current?.name || "未命名"} · ${profiles.filter((x) => x.enabled).length}/${profiles.length} 启用`, "ok");
      if (state.autoAnalyzeEnabled) {
        const item = currentTranscriptItem();
        if (item?.subStatus === "ok" && item.data?.length) {
          state.autoAnalyzeKey = "";
          scheduleAutoAnalyze(item, routeVideoKey(item.bvid, item.page || 1), "config-saved", 80);
        }
      }
      return;
    }
    if (act === "ai-reset") {
      const prev = loadAiProfiles();
      const first = prev.find((x) => x.enabled) || prev[0] || {};
      const resetProfile = createAiProfile({
        ...AI_DEFAULTS,
        name: "默认模型",
        apiKey: first.apiKey || "",
        baseUrl: first.baseUrl || "",
      }, 0);
      saveAiProfiles([resetProfile]);
      state.aiEditorId = resetProfile.id;
      state.aiSearch = "";
      fillAiConfigForm(ensurePanel());
      setStatus("已恢复为单个默认模型配置（保留首个配置的 Base URL 与 API Key）", "ok");
      return;
    }
    if (act === "ai-profile-add") {
      const profiles = saveAiProfilesFromForm();
      const source = profiles.find((p) => p.id === state.aiEditorId) || profiles[profiles.length - 1] || createAiProfile(AI_DEFAULTS, 0);
      const next = createAiProfile({
        ...source,
        id: makeAiProfileId(),
        name: `模型 ${profiles.length + 1}`,
        enabled: true,
      }, profiles.length);
      profiles.push(next);
      saveAiProfiles(profiles);
      state.aiEditorId = next.id;
      state.aiSearch = "";
      fillAiConfigForm(ensurePanel());
      setStatus("已新增 LLM；已沿用当前配置的连接参数，可直接修改", "ok");
      return;
    }
    if (act === "ai-focus") {
      closeMermaidFullscreen();
      state.aiFocus = !state.aiFocus;
      if (state.aiFocus) setWorkspace("ai", { silent: true });
      applyPanelGeometry();
      setStatus(state.aiFocus ? "已进入专注阅读 · 按 Esc 或点「退出专注」恢复" : "已退出专注阅读", "ok");
      return;
    }
    if (act === "ai-reprocess") {
      if (!state.preprocessEnabled) {
        setStatus("预处理当前已关闭；开启后才能重跑预处理", "err");
        return;
      }
      if (state.aiBusy) {
        setStatus("AI Pipeline 正在运行，请先停止当前任务再重跑预处理", "err");
        return;
      }
      state.forcePreprocessOnce = true;
      try { await doAiAnalyze(); } finally { state.forcePreprocessOnce = false; }
      return;
    }
    if (act === "ai-regenerate-current") {
      await regenerateActiveAiRun();
      return;
    }
    if (act === "ai-regenerate-all") {
      await regenerateAllAiRuns();
      return;
    }
    if (act === "ai-send") {
      if (operationBusy()) {
        state.pendingAiSend = true;
        setStatus("扫描或字幕任务仍在运行 · 已排队，结束后自动送入 AI");
        return;
      }
      if (state.aiBusy) {
        const restart = typeof pageWindow.confirm === "function"
          ? pageWindow.confirm("已有 AI 模型仍在生成。是否停止当前批次并用当前勾选内容重新分析？")
          : false;
        if (!restart) {
          setStatus("当前 AI 批次仍在生成；可先停止，或再次点击并确认重新分析");
          return;
        }
        stopAiBatchForRestart();
      }
      await doAiAnalyze();
      return;
    }
    if (act === "ai-stick") {
      if (state.aiStickBottom && !state.aiUserReading) {
        // 关跟随 → 进入阅读锁
        detachAiFollow("toggle");
        setStatus("已暂停跟随 · 可自由滚动 · 点「↓ 最新」回到底部");
      } else {
        resumeAiFollow();
        setStatus("跟随最新输出");
      }
      return;
    }
    if (act === "ai-jump") {
      resumeAiFollow();
      setStatus("已跳到最新");
      return;
    }
    if (act === "ai-copy") {
      const text = getActiveAiRun()?.raw || state.aiRaw || "";
      if (!text.trim()) {
        setStatus("没有可复制的内容", "err");
        return;
      }
      clipboardWrite(text);
      setStatus("已复制 AI 输出", "ok");
      return;
    }
    if (act === "ai-export") {
      const run = getActiveAiRun();
      const text = run?.raw || state.aiRaw || "";
      if (!text.trim()) return setStatus("没有可导出的笔记", "err");
      const bvid = (run?.sourceBvids || state.aiSourceBvids)[0] || "bilibili";
      const modelName = run?.config?.name || run?.config?.model || "AI";
      downloadText(`${safeFilename(`${bvid}_${modelName}_AI笔记`)}.md`, text);
      setStatus(`已导出 ${modelName} 的 Markdown`, "ok");
      return;
    }
    if (act === "ai-font-dec" || act === "ai-font-inc") {
      const delta = act === "ai-font-inc" ? 1 : -1;
      const current = Number(state.ui?.noteFont || 17);
      const next = Math.max(NOTE_FONT_MIN, Math.min(NOTE_FONT_MAX, current + delta));
      if (state.ui) state.ui.noteFont = next;
      ensurePanel().style.setProperty("--bsb-note-font", `${next}px`);
      saveUiGeom();
      setStatus(`正文字号 ${next}px`);
      return;
    }
    if (act === "ai-top") {
      scrollAiToTop();
      setStatus("已回到顶部");
      return;
    }
    if (act === "capture-toggle") {
      state.captureDrawerOpen = !state.captureDrawerOpen;
      const drawer = ensurePanel().querySelector('[data-role="capture-drawer"]');
      if (drawer) drawer.hidden = !state.captureDrawerOpen;
      if (state.captureDrawerOpen) refreshContextUI();
      return;
    }
    if (act === "open-ai-workspace") {
      setWorkspace("ai");
      refreshAiChips();
      setStatus("已打开 AI 学习图谱工作区 · 使用左侧资源库勾选项作为输入");
      return;
    }
    if (act === "transcript-refresh") {
      await refreshCurrentTranscript();
      return;
    }
    if (act === "clear") {
      state.items = [];
      state.meta = {};
      state.transcriptItemKey = "";
      state.transcriptItem = null;
      state.transcriptQuery = "";
      state.transcriptActiveCueIndex = -1;
      state.libraryQuery = "";
      state.libraryFilter = "all";
      const librarySearch = ensurePanel().querySelector('[data-role="library-search"]');
      if (librarySearch) librarySearch.value = "";
      renderList();
      setStatus("已清空");
      return;
    }
    if (act === "sel-all") {
      state.items.forEach((it) => (it.selected = true));
      renderList();
      return;
    }
    if (act === "sel-none") {
      state.items.forEach((it) => (it.selected = false));
      renderList();
      return;
    }
    if (act === "scan") {
      await doScan();
      return;
    }
    if (act === "copy-bvid") {
      const list = selectedItems();
      if (!list.length) {
        setStatus("请先勾选视频", "err");
        return;
      }
      const text = list.map((it) => it.bvid).filter(Boolean).join("\n");
      clipboardWrite(text);
      setStatus(`已复制 ${list.length} 个 BV`, "ok");
      return;
    }
    if (act === "dl-srt" || act === "dl-txt" || act === "copy" || act === "dl-ok-only" || act === "fetch-selected") {
      await doBatch(act);
    }
  }

  function clipboardWrite(text) {
    if (typeof GM_setClipboard === "function") GM_setClipboard(text, "text");
    else if (navigator.clipboard) navigator.clipboard.writeText(text);
  }

  // ─── AI config / stream / render ────────────────────────────────────────
  function storageGet(key, fallback) {
    try {
      if (typeof GM_getValue === "function") {
        const v = GM_getValue(key, null);
        if (v != null && v !== "") return v;
      }
    } catch (_) { /* ignore */ }
    try {
      const legacy = localStorage.getItem(key);
      if (legacy != null) return legacy;
    } catch (_) { /* ignore */ }
    return fallback;
  }

  function storageSet(key, value) {
    let storedByGm = false;
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(key, value);
        storedByGm = true;
      }
    } catch (_) { /* ignore */ }
    // 密钥优先只进入 userscript 隔离存储；仅无 GM API 时才退回页面 localStorage。
    if (!storedByGm) {
      try { localStorage.setItem(key, value); } catch (_) { /* ignore */ }
    } else {
      try { localStorage.removeItem(key); } catch (_) { /* migrate legacy */ }
    }
  }


  function shortcutDefaults() {
    return {
      schemaVersion: SHORTCUT_SCHEMA_VERSION,
      enabled: true,
      summonLayout: "remember", // remember | floating | right | left
      summonTarget: "remember", // remember | processed | postprocess
      preferredDock: "right", // right | left
      bindings: Object.fromEntries(SHORTCUT_COMMANDS.map((command) => [command.id, command.defaultChord])),
    };
  }

  function loadShortcutSettings() {
    const defaults = shortcutDefaults();
    try {
      const raw = storageGet(SHORTCUT_STORE_KEY, "");
      if (!raw) return defaults;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== "object") return defaults;
      const parsedSchemaVersion = Number(parsed.schemaVersion) || 1;
      const parsedBindings = { ...(parsed.bindings || {}) };
      // v6.0.2: migrate only the old built-in summon default. Explicit custom bindings remain untouched.
      if (parsedSchemaVersion < 2 && parsedBindings["toggle-panel"] === "Ctrl+Alt+KeyB") {
        parsedBindings["toggle-panel"] = "Ctrl+KeyB";
      }
      const bindings = { ...defaults.bindings };
      for (const command of SHORTCUT_COMMANDS) {
        if (Object.prototype.hasOwnProperty.call(parsedBindings, command.id)) {
          bindings[command.id] = String(parsedBindings[command.id] || "");
        }
      }
      return {
        schemaVersion: SHORTCUT_SCHEMA_VERSION,
        enabled: parsed.enabled !== false,
        summonLayout: ["remember", "floating", "right", "left"].includes(parsed.summonLayout) ? parsed.summonLayout : defaults.summonLayout,
        summonTarget: ["remember", "processed", "postprocess"].includes(parsed.summonTarget) ? parsed.summonTarget : defaults.summonTarget,
        preferredDock: parsed.preferredDock === "left" ? "left" : "right",
        bindings,
      };
    } catch (_) {
      return defaults;
    }
  }

  function saveShortcutSettings(config = state.shortcutConfig) {
    const defaults = shortcutDefaults();
    const next = config && typeof config === "object" ? config : defaults;
    next.schemaVersion = SHORTCUT_SCHEMA_VERSION;
    next.enabled = next.enabled !== false;
    next.summonLayout = ["remember", "floating", "right", "left"].includes(next.summonLayout) ? next.summonLayout : defaults.summonLayout;
    next.summonTarget = ["remember", "processed", "postprocess"].includes(next.summonTarget) ? next.summonTarget : defaults.summonTarget;
    next.preferredDock = next.preferredDock === "left" ? "left" : "right";
    next.bindings = { ...defaults.bindings, ...(next.bindings || {}) };
    state.shortcutConfig = next;
    storageSet(SHORTCUT_STORE_KEY, JSON.stringify(next));
    refreshShortcutHints();
    return next;
  }

  function shortcutKeyLabel(code) {
    const c = String(code || "");
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit[0-9]$/.test(c)) return c.slice(5);
    if (/^Numpad[0-9]$/.test(c)) return `Num ${c.slice(6)}`;
    const labels = {
      Space: "Space", Enter: "Enter", Tab: "Tab", Escape: "Esc", Backspace: "Backspace", Delete: "Delete",
      ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
      Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", Backslash: "\\", Backquote: "`",
      Home: "Home", End: "End", PageUp: "PgUp", PageDown: "PgDn", Insert: "Insert",
    };
    if (labels[c]) return labels[c];
    if (/^F\d{1,2}$/.test(c)) return c;
    return c.replace(/^(Arrow|Numpad)/, "") || c;
  }

  function shortcutChordFromEvent(event) {
    const code = String(event?.code || "");
    if (!code || /^(Control|Shift|Alt|Meta)(Left|Right)?$/.test(code)) return "";
    const parts = [];
    if (event.ctrlKey) parts.push("Ctrl");
    if (event.altKey) parts.push("Alt");
    if (event.shiftKey) parts.push("Shift");
    if (event.metaKey) parts.push("Meta");
    parts.push(code);
    return parts.join("+");
  }

  function shortcutDisplayChord(chord) {
    const parts = String(chord || "").split("+").filter(Boolean);
    if (!parts.length) return "未绑定";
    return parts.map((part) => ["Ctrl", "Alt", "Shift", "Meta"].includes(part) ? part : shortcutKeyLabel(part)).join(" + ");
  }

  function shortcutHasStrongModifier(chord) {
    const parts = new Set(String(chord || "").split("+"));
    return parts.has("Ctrl") || parts.has("Alt") || parts.has("Meta");
  }

  function shortcutConflictInfo(chord, commandId = "") {
    const value = String(chord || "");
    if (!value) return { level: "off", text: "未绑定" };
    const duplicate = SHORTCUT_COMMANDS.find((command) => command.id !== commandId && state.shortcutConfig?.bindings?.[command.id] === value);
    if (duplicate) return { level: "error", text: `与“${duplicate.label}”重复` };
    const chrome = new Set([
      "Ctrl+KeyN", "Ctrl+Shift+KeyN", "Ctrl+KeyT", "Ctrl+Shift+KeyT", "Ctrl+KeyW", "Ctrl+Shift+KeyW",
      "Ctrl+KeyL", "Ctrl+KeyK", "Ctrl+KeyE", "Ctrl+KeyF", "Ctrl+KeyG", "Ctrl+Shift+KeyG", "Ctrl+KeyR", "Ctrl+KeyP", "Ctrl+KeyS", "Ctrl+KeyD",
      "Ctrl+KeyH", "Ctrl+KeyJ", "Ctrl+KeyU", "Ctrl+Shift+KeyJ", "Ctrl+Shift+KeyB", "Ctrl+Shift+KeyO", "Ctrl+Shift+Delete", "Ctrl+Tab", "Ctrl+Shift+Tab",
      "Alt+KeyD", "Alt+ArrowLeft", "Alt+ArrowRight", "Alt+Home", "Shift+Escape", "F11", "F12", "Alt+Shift+KeyI",
      ...Array.from({ length: 9 }, (_, i) => `Ctrl+Digit${i + 1}`),
    ]);
    if (chrome.has(value)) return { level: "warn", text: "Chrome 常用快捷键，页面可能收不到" };
    const parts = new Set(value.split("+"));
    const code = value.split("+").at(-1) || "";
    const biliCodes = new Set(["Space", "KeyK", "KeyJ", "KeyL", "KeyW", "KeyT", "KeyF", "KeyP", "KeyI", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyM", "Minus", "Equal", "Digit0", "KeyQ", "KeyE", "KeyD", "KeyC", "KeyG", "KeyH", "KeyB", "Enter"]);
    if (!parts.has("Ctrl") && !parts.has("Alt") && !parts.has("Meta") && (biliCodes.has(code) || value === "Shift+KeyS")) {
      return { level: "warn", text: "Bilibili 播放器常用键，容易冲突" };
    }
    if (!shortcutHasStrongModifier(value)) return { level: "warn", text: "建议至少使用 Ctrl / Alt / Meta 之一" };
    return { level: "ok", text: "推荐组合" };
  }

  function shortcutEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    return !!target.closest('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]');
  }

  function refreshShortcutHints() {
    const root = document.getElementById(PANEL_ID);
    if (!root) return;
    const toggle = state.shortcutConfig?.bindings?.["toggle-panel"] || "";
    const label = shortcutDisplayChord(toggle);
    const fab = root.querySelector(".bsb-fab");
    const dockTab = root.querySelector(".bsb-dock-tab");
    if (fab) fab.title = toggle ? `SubBatch 工作台 · ${label}` : "SubBatch 工作台";
    if (dockTab) dockTab.title = toggle ? `展开 SubBatch 工作台 · ${label}` : "展开 SubBatch 工作台";
  }

  function shortcutCommandHtml(command) {
    const chord = state.shortcutConfig?.bindings?.[command.id] || "";
    const conflict = shortcutConflictInfo(chord, command.id);
    const recording = state.shortcutRecordingId === command.id;
    return `<article class="bsb-shortcut-row" data-shortcut-row="${escapeAttr(command.id)}"><div class="bsb-shortcut-copy"><strong>${escapeHtml(command.label)}</strong><span>${escapeHtml(command.hint)}</span></div><div class="bsb-shortcut-control"><button type="button" class="bsb-shortcut-key${recording ? " recording" : ""}" data-shortcut-record="${escapeAttr(command.id)}" aria-pressed="${recording ? "true" : "false"}">${recording ? "按下组合键…" : escapeHtml(shortcutDisplayChord(chord))}</button><button type="button" class="bsb-shortcut-reset" data-shortcut-reset="${escapeAttr(command.id)}" title="恢复默认">↺</button><span class="bsb-shortcut-state ${escapeAttr(conflict.level)}">${escapeHtml(conflict.text)}</span></div></article>`;
  }

  function renderShortcutSettings(root = document.getElementById(PANEL_ID)) {
    const host = root?.querySelector('[data-role="shortcut-settings"]');
    if (!host) return;
    const config = state.shortcutConfig || loadShortcutSettings();
    host.innerHTML = `<div class="bsb-shortcut-page"><div class="bsb-shortcut-hero"><div><span class="bsb-shortcut-kicker">QUICK SUMMON</span><h3>快捷召唤</h3><p>快捷键只在 Bilibili 页面生效。正在输入文字时默认不触发，避免干扰搜索、弹幕和表单。</p></div><label class="bsb-flow-switch"><input type="checkbox" data-shortcut-pref="enabled" ${config.enabled ? "checked" : ""}><span class="bsb-flow-switch-track" aria-hidden="true"></span><span class="bsb-flow-switch-text">${config.enabled ? "已开启" : "已关闭"}</span></label></div>
      <section class="bsb-shortcut-card"><div class="bsb-shortcut-section-title"><strong>召唤行为</strong><span>主快捷键打开面板时，决定它出现在哪里、先看什么。</span></div><div class="bsb-shortcut-prefs"><label><span>面板布局</span><div class="bsb-flow-select"><select data-shortcut-pref="summonLayout"><option value="remember"${config.summonLayout === "remember" ? " selected" : ""}>记住上次</option><option value="floating"${config.summonLayout === "floating" ? " selected" : ""}>悬浮</option><option value="right"${config.summonLayout === "right" ? " selected" : ""}>右侧靠边</option><option value="left"${config.summonLayout === "left" ? " selected" : ""}>左侧靠边</option></select><span class="bsb-flow-select-icon">⌄</span></div></label><label><span>默认内容</span><div class="bsb-flow-select"><select data-shortcut-pref="summonTarget"><option value="remember"${config.summonTarget === "remember" ? " selected" : ""}>记住上次</option><option value="processed"${config.summonTarget === "processed" ? " selected" : ""}>AI 处理字幕</option><option value="postprocess"${config.summonTarget === "postprocess" ? " selected" : ""}>后处理 · 上次产物/模型</option></select><span class="bsb-flow-select-icon">⌄</span></div></label><label><span>靠边方向</span><div class="bsb-flow-select"><select data-shortcut-pref="preferredDock"><option value="right"${config.preferredDock === "right" ? " selected" : ""}>右侧</option><option value="left"${config.preferredDock === "left" ? " selected" : ""}>左侧</option></select><span class="bsb-flow-select-icon">⌄</span></div></label></div></section>
      <section class="bsb-shortcut-card"><div class="bsb-shortcut-section-title"><strong>命令快捷键</strong><span>点击快捷键框后直接按新的组合；Esc 取消，Backspace / Delete 清除。</span></div><div class="bsb-shortcut-list">${SHORTCUT_COMMANDS.map(shortcutCommandHtml).join("")}</div><div class="bsb-shortcut-foot"><span>建议使用 Ctrl + Alt + 字母/数字，避开 Chrome 与 B 站播放器常用键。</span><button type="button" class="bsb-btn ghost" data-shortcut-reset-all>恢复默认快捷键</button></div></section></div>`;
  }

  function makePromptProfileId() {
    return `prompt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createPromptProfile(seed, index = 0) {
    const o = seed && typeof seed === "object" ? seed : {};
    const stage = o.stage === "preprocess" ? "preprocess" : o.stage === "knowledge" ? "knowledge" : "postprocess";
    return {
      id: String(o.id || makePromptProfileId()),
      stage,
      name: String(o.name || `提示词 ${index + 1}`).slice(0, 100),
      hint: String(o.hint || (stage === "preprocess" ? "字幕预处理" : stage === "knowledge" ? "局部知识追问" : "后处理提示词")).slice(0, 160),
      systemPrompt: String(o.systemPrompt || ""),
      userPromptTemplate: String(o.userPromptTemplate || ""),
    };
  }

  function normalizePromptProfiles(input) {
    return (Array.isArray(input) ? input : [])
      .filter((x) => x && typeof x === "object")
      .map(createPromptProfile);
  }

  function ensureBuiltinStagePrompts(prompts) {
    const list = [...(prompts || [])];
    if (!list.some((p) => p.stage === "preprocess")) list.unshift(createPromptProfile(DEFAULT_PREPROCESS_PROMPT, 0));
    if (!list.some((p) => p.stage === "knowledge")) list.push(createPromptProfile(DEFAULT_KNOWLEDGE_PROMPT, list.length));
    return list;
  }

  function migrateBuiltinPromptLanguageRules(prompts, storedVersion) {
    if (Number(storedVersion || 0) >= 3) return { prompts, changed: false };
    let changed = false;
    const next = (prompts || []).map((prompt) => {
      if (!prompt || ![DEFAULT_PREPROCESS_PROMPT_ID, DEFAULT_PROMPT_ID].includes(prompt.id)) return prompt;
      if (/简体中文/.test(String(prompt.systemPrompt || ""))) return prompt;
      const addition = prompt.id === DEFAULT_PREPROCESS_PROMPT_ID
        ? [
            "【输出语言（v5.8.1）】",
            "无论输入字幕是英语、日语、韩语或其他语言，规范化正文必须统一转换为简体中文；完整外语句子应忠实翻译。专有名词、模型名、API、代码、命令、参数和缩写可保留必要原文。",
          ].join("\n")
        : [
            "【输出语言（v5.8.1）】",
            "所有最终可见标题与 Mermaid 节点文字统一使用简体中文；若输入为其他语言先忠实转换。专有名词、模型名、API、代码、命令、参数和缩写可保留必要原文。",
          ].join("\n");
      changed = true;
      return { ...prompt, systemPrompt: `${String(prompt.systemPrompt || "").trim()}\n\n${addition}`.trim() };
    });
    return { prompts: next, changed };
  }

  function migrateBuiltinPreprocessChunkRules(prompts, storedVersion) {
    if (Number(storedVersion || 0) >= 4) return { prompts, changed: false };
    let changed = false;
    const next = (prompts || []).map((prompt) => {
      if (!prompt || prompt.id !== DEFAULT_PREPROCESS_PROMPT_ID) return prompt;
      let systemPrompt = String(prompt.systemPrompt || "");
      let userPromptTemplate = String(prompt.userPromptTemplate || "");
      if (!/本地拼接器|overlap/i.test(systemPrompt)) {
        systemPrompt = `${systemPrompt.trim()}\n\n【长视频分块（v5.9.0）】\n长字幕会按真实时间戳切成多个块；从第二块开始可能携带上一块末尾的少量 overlap 上下文。正常规范化并保留真实时间戳，不要自行删除或改写时间戳；脚本会依据“新内容起点”确定性去除 overlap 重复。`.trim();
        changed = true;
      }
      if (!/\{\{coreStart\}\}/.test(userPromptTemplate)) {
        userPromptTemplate = userPromptTemplate.replace(
          /字幕分块：\{\{chunkIndex\}\} \/ \{\{chunkCount\}\}/,
          "字幕分块：{{chunkIndex}} / {{chunkCount}}\n本块上下文起点：{{chunkStart}}\n本块新内容起点：{{coreStart}}\n本块结束：{{chunkEnd}}",
        );
        changed = true;
      }
      return { ...prompt, systemPrompt, userPromptTemplate };
    });
    return { prompts: next, changed };
  }

  function resolvePromptActiveIds(prompts, postId, preId, knowledgeId) {
    const posts = prompts.filter((p) => p.stage === "postprocess");
    const pres = prompts.filter((p) => p.stage === "preprocess");
    const knowledge = prompts.filter((p) => p.stage === "knowledge");
    return {
      activeId: posts.some((p) => p.id === postId) ? postId : (posts[0]?.id || ""),
      activePreprocessId: pres.some((p) => p.id === preId) ? preId : (pres[0]?.id || ""),
      activeKnowledgeId: knowledge.some((p) => p.id === knowledgeId) ? knowledgeId : (knowledge[0]?.id || ""),
    };
  }

  function loadPromptProfiles() {
    try {
      const raw = storageGet(PROMPT_STORE_KEY, null);
      if (raw != null && raw !== "") {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        let prompts = normalizePromptProfiles(Array.isArray(parsed) ? parsed : parsed?.prompts);
        // v1 migration: all legacy prompts are postprocess; inject the transparent built-in subtitle normalizer.
        prompts = ensureBuiltinStagePrompts(prompts);
        const storedVersion = Array.isArray(parsed) ? 0 : Number(parsed?.version || 0);
        const migratedLanguage = migrateBuiltinPromptLanguageRules(prompts, storedVersion);
        prompts = migratedLanguage.prompts;
        const migratedChunking = migrateBuiltinPreprocessChunkRules(prompts, storedVersion);
        prompts = migratedChunking.prompts;
        const migrated = { changed: migratedLanguage.changed || migratedChunking.changed || storedVersion < PROMPT_SCHEMA_VERSION };
        const ids = resolvePromptActiveIds(
          prompts,
          String(Array.isArray(parsed) ? "" : parsed?.activeId || ""),
          String(Array.isArray(parsed) ? "" : parsed?.activePreprocessId || ""),
          String(Array.isArray(parsed) ? "" : parsed?.activeKnowledgeId || ""),
        );
        if (migrated.changed) {
          try {
            storageSet(PROMPT_STORE_KEY, JSON.stringify({ version: PROMPT_SCHEMA_VERSION, activeId: ids.activeId, activePreprocessId: ids.activePreprocessId, activeKnowledgeId: ids.activeKnowledgeId, prompts }));
          } catch (_) { /* ignore migration persistence failure */ }
        }
        state.promptProfiles = prompts;
        state.activePromptId = ids.activeId;
        state.activePrePromptId = ids.activePreprocessId;
        state.activeKnowledgePromptId = ids.activeKnowledgeId;
        return { prompts, ...ids };
      }
    } catch (_) {
      /* fall through to first-run default */
    }
    const pre = createPromptProfile(DEFAULT_PREPROCESS_PROMPT, 0);
    const post = createPromptProfile(DEFAULT_MERMAID_PROMPT, 1);
    const knowledge = createPromptProfile(DEFAULT_KNOWLEDGE_PROMPT, 2);
    const prompts = [pre, post, knowledge];
    state.promptProfiles = prompts;
    state.activePromptId = post.id;
    state.activePrePromptId = pre.id;
    state.activeKnowledgePromptId = knowledge.id;
    return { prompts, activeId: post.id, activePreprocessId: pre.id, activeKnowledgeId: knowledge.id };
  }

  function savePromptProfiles(prompts, activeId, activePreprocessId = state.activePrePromptId, activeKnowledgeId = state.activeKnowledgePromptId) {
    let normalized = normalizePromptProfiles(prompts);
    const ids = resolvePromptActiveIds(normalized, String(activeId || ""), String(activePreprocessId || ""), String(activeKnowledgeId || ""));
    try {
      storageSet(PROMPT_STORE_KEY, JSON.stringify({
        version: PROMPT_SCHEMA_VERSION,
        activeId: ids.activeId,
        activePreprocessId: ids.activePreprocessId,
        activeKnowledgeId: ids.activeKnowledgeId,
        prompts: normalized,
      }));
    } catch (_) {
      /* ignore */
    }
    state.promptProfiles = normalized;
    state.activePromptId = ids.activeId;
    state.activePrePromptId = ids.activePreprocessId;
    state.activeKnowledgePromptId = ids.activeKnowledgeId;
    refreshPromptSelector(document.getElementById(PANEL_ID));
    if (state.postTasks?.length) savePostTasks(state.postTasks);
    else loadPostTasks();
    return { prompts: normalized, ...ids };
  }

  function getActiveKnowledgePromptProfile() {
    const prompts = state.promptProfiles?.length || state.activeKnowledgePromptId
      ? state.promptProfiles
      : loadPromptProfiles().prompts;
    return prompts.find((p) => p.id === state.activeKnowledgePromptId && p.stage === "knowledge")
      || prompts.find((p) => p.stage === "knowledge") || null;
  }

  function getActivePromptProfile() {
    const prompts = state.promptProfiles?.length || state.activePromptId
      ? state.promptProfiles
      : loadPromptProfiles().prompts;
    return prompts.find((p) => p.id === state.activePromptId && p.stage === "postprocess")
      || prompts.find((p) => p.stage === "postprocess") || null;
  }

  function getActivePreprocessPromptProfile() {
    const prompts = state.promptProfiles?.length || state.activePrePromptId
      ? state.promptProfiles
      : loadPromptProfiles().prompts;
    return prompts.find((p) => p.id === state.activePrePromptId && p.stage === "preprocess")
      || prompts.find((p) => p.stage === "preprocess") || null;
  }



  // ─── Knowledge Drill-down · v6 ─────────────────────────────────────────
  function makeKnowledgeId(prefix = "k") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function openKnowledgeDb() {
    if (state.knowledgeDbPromise) return state.knowledgeDbPromise;
    state.knowledgeDbPromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open(KNOWLEDGE_DB_NAME, KNOWLEDGE_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(KNOWLEDGE_ANCHOR_STORE)) {
          const store = db.createObjectStore(KNOWLEDGE_ANCHOR_STORE, { keyPath: "id" });
          store.createIndex("sourceKey", "sourceKey", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(KNOWLEDGE_NODE_STORE)) {
          const store = db.createObjectStore(KNOWLEDGE_NODE_STORE, { keyPath: "id" });
          store.createIndex("anchorId", "anchorId", { unique: false });
          store.createIndex("parentId", "parentId", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Knowledge DB open failed"));
    }).catch((error) => {
      state.knowledgeDbPromise = null;
      throw error;
    });
    return state.knowledgeDbPromise;
  }

  async function knowledgeStoreRequest(storeName, mode, handler) {
    const db = await openKnowledgeDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let req;
      let result;
      let settled = false;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(error || tx.error || new Error("Knowledge DB transaction failed"));
      };
      try { req = handler(store); } catch (error) { fail(error); return; }
      if (req && typeof req === "object" && "onsuccess" in req) {
        req.onsuccess = () => { result = req.result; };
        req.onerror = () => fail(req.error || new Error("Knowledge DB request failed"));
      } else {
        result = req;
      }
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      tx.onerror = () => fail(tx.error);
      tx.onabort = () => fail(tx.error || new Error("Knowledge DB transaction aborted"));
    });
  }

  async function knowledgeRefreshCache() {
    try {
      const [anchors, nodes] = await Promise.all([
        knowledgeStoreRequest(KNOWLEDGE_ANCHOR_STORE, "readonly", (s) => s.getAll()),
        knowledgeStoreRequest(KNOWLEDGE_NODE_STORE, "readonly", (s) => s.getAll()),
      ]);
      state.knowledgeAnchors = (anchors || []).sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
      const recovered = [];
      const liveRunning = state.knowledgeBusy
        ? new Map((state.knowledgeNodes || []).filter((node) => node?.status === "running").map((node) => [node.id, node]))
        : new Map();
      state.knowledgeNodes = (nodes || []).map((node) => {
        const live = liveRunning.get(node?.id);
        if (live) return live;
        if (!state.knowledgeBusy && node?.status === "running") {
          const fixed = { ...node, answer: knowledgeVisibleAnswer(node.answer || node.preview || ""), preview: "", status: "stopped", error: "", updatedAt: Date.now() };
          recovered.push(fixed);
          return fixed;
        }
        return node;
      }).sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
      if (recovered.length) Promise.all(recovered.map((node) => knowledgeStoreRequest(KNOWLEDGE_NODE_STORE, "readwrite", (s) => s.put(node)))).catch(() => {});
    } catch (error) {
      state.knowledgeAnchors = state.knowledgeAnchors || [];
      state.knowledgeNodes = state.knowledgeNodes || [];
      throw error;
    }
    return { anchors: state.knowledgeAnchors, nodes: state.knowledgeNodes };
  }

  async function knowledgePutAnchor(anchor) {
    await knowledgeStoreRequest(KNOWLEDGE_ANCHOR_STORE, "readwrite", (s) => s.put(anchor));
    const i = state.knowledgeAnchors.findIndex((x) => x.id === anchor.id);
    if (i >= 0) state.knowledgeAnchors[i] = anchor; else state.knowledgeAnchors.unshift(anchor);
    state.knowledgeAnchors.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    return anchor;
  }

  async function knowledgePutNode(node) {
    await knowledgeStoreRequest(KNOWLEDGE_NODE_STORE, "readwrite", (s) => s.put(node));
    const i = state.knowledgeNodes.findIndex((x) => x.id === node.id);
    if (i >= 0) state.knowledgeNodes[i] = node; else state.knowledgeNodes.push(node);
    return node;
  }

  async function knowledgeDeleteAnchor(anchorId) {
    const nodeIds = state.knowledgeNodes.filter((n) => n.anchorId === anchorId).map((n) => n.id);
    await Promise.all(nodeIds.map((id) => knowledgeStoreRequest(KNOWLEDGE_NODE_STORE, "readwrite", (s) => s.delete(id))));
    await knowledgeStoreRequest(KNOWLEDGE_ANCHOR_STORE, "readwrite", (s) => s.delete(anchorId));
    state.knowledgeAnchors = state.knowledgeAnchors.filter((a) => a.id !== anchorId);
    state.knowledgeNodes = state.knowledgeNodes.filter((n) => n.anchorId !== anchorId);
    if (state.knowledgeActiveAnchorId === anchorId) {
      state.knowledgeActiveAnchorId = "";
      state.knowledgeActiveNodeId = "";
    }
  }

  function knowledgeSourceKey(bvid, page) {
    return `${String(bvid || "").toUpperCase()}:P${Math.max(1, Number(page) || 1)}`;
  }

  function currentKnowledgeSource() {
    const routeKey = currentRouteVideoKey();
    const current = routeKey
      ? (state.items.find((it) => routeVideoKey(it.bvid, it.page || 1) === routeKey)
        || (routeVideoKey(state.transcriptItem?.bvid, state.transcriptItem?.page || 1) === routeKey ? state.transcriptItem : null))
      : (state.transcriptItem || selectedItems()[0] || null);
    const bvid = current?.bvid || state.aiSessionInput?.vars?.bvid?.match(/BV[\w]+/i)?.[0] || "";
    const page = Math.max(1, Number(current?.page || 1));
    return {
      sourceKey: knowledgeSourceKey(bvid, page),
      bvid,
      page,
      title: current?.title || state.aiSessionInput?.vars?.title || document.title || bvid,
      author: current?.author || state.aiSessionInput?.vars?.author || "",
    };
  }

  function knowledgeNodesForAnchor(anchorId) {
    return (state.knowledgeNodes || []).filter((n) => n.anchorId === anchorId);
  }

  function knowledgeAnchorById(id) {
    return (state.knowledgeAnchors || []).find((a) => a.id === id) || null;
  }

  function knowledgeNodeById(id) {
    return (state.knowledgeNodes || []).find((n) => n.id === id) || null;
  }

  function knowledgeAncestorNodes(node) {
    const out = [];
    let cur = node;
    const seen = new Set();
    while (cur?.parentId && !seen.has(cur.parentId) && out.length < 12) {
      seen.add(cur.parentId);
      const parent = knowledgeNodeById(cur.parentId);
      if (!parent) break;
      out.unshift(parent);
      cur = parent;
    }
    return out;
  }

  function knowledgeBranchContext(parentNode) {
    if (!parentNode) return "（这是该锚点下的新分支）";
    const chain = [...knowledgeAncestorNodes(parentNode), parentNode].slice(-6);
    return chain.map((node, i) => {
      const answer = String(node.answer || "").trim().replace(/\s+/g, " ").slice(0, 1800);
      return `${i + 1}. 问题：${node.question}\n   回答摘要：${answer || "（尚无回答）"}`;
    }).join("\n");
  }

  function parseKnowledgeOutput(raw) {
    const source = String(raw || "");
    const match = source.match(/<suggestions>([\s\S]*?)(?:<\/suggestions>|$)/i);
    const answer = source.replace(/\n?<suggestions>[\s\S]*$/i, "").trim();
    const suggestions = match
      ? match[1].split(/\r?\n/).map((x) => x.replace(/^\s*[-*\d.)]+\s*/, "").trim()).filter(Boolean).slice(0, 4)
      : [];
    return { answer, suggestions };
  }

  function knowledgeVisibleAnswer(raw) {
    return parseKnowledgeOutput(raw).answer || String(raw || "").replace(/<suggestions>[\s\S]*$/i, "").trim();
  }

  function knowledgeMarkdownHtml(text) {
    const source = String(text || "");
    const { md, maths } = prepareMarkdownMath(source);
    let html = "";
    try {
      html = typeof marked !== "undefined" && marked?.parse ? marked.parse(md) : simpleMarkdownFallback(md);
    } catch (_) {
      html = simpleMarkdownFallback(md);
    }
    if (maths.length) html = replaceMathPlaceholders(html, maths, katexToHtml);
    return sanitizeRenderedHtml(html);
  }

  function knowledgeGetModelConfig() {
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    const ready = profiles.filter((p) => p.enabled !== false && p.apiKey && p.baseUrl && p.model);
    let model = ready.find((p) => p.id === state.knowledgeModelId);
    if (!model) model = ready.find((p) => p.enabled) || ready[0] || null;
    if (model && state.knowledgeModelId !== model.id) {
      state.knowledgeModelId = model.id;
      storageSet(KNOWLEDGE_MODEL_STORE_KEY, model.id);
    }
    return model;
  }

  function knowledgeModelOptionsHtml() {
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    const ready = profiles.filter((p) => p.enabled !== false && p.apiKey && p.baseUrl && p.model);
    const selected = knowledgeGetModelConfig();
    if (!ready.length) return '<option value="">没有可用 LLM</option>';
    return ready.map((p) => `<option value="${escapeAttr(p.id)}"${selected?.id === p.id ? " selected" : ""}>${escapeHtml(p.name || p.model)}</option>`).join("");
  }

  function knowledgeTreeHtml(anchorId, activeNodeId) {
    const nodes = knowledgeNodesForAnchor(anchorId);
    const children = new Map();
    for (const node of nodes) {
      const key = node.parentId || "__root__";
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(node);
    }
    const renderLevel = (parentId, depth = 0) => {
      if (depth > 64) return "";
      return (children.get(parentId || "__root__") || []).map((node) => {
        const kids = children.get(node.id) || [];
        const cls = node.id === activeNodeId ? " active" : "";
        return `<div class="bsb-knowledge-tree-node" style="--depth:${depth}"><button type="button" class="${cls}" data-knowledge-node-id="${escapeAttr(node.id)}"><span class="bsb-knowledge-tree-branch">${kids.length ? "⌄" : "·"}</span><span>${escapeHtml(node.question)}</span>${node.starred ? '<span class="bsb-knowledge-star">★</span>' : ""}</button>${kids.length ? renderLevel(node.id, depth + 1) : ""}</div>`;
      }).join("");
    };
    return renderLevel(null) || '<div class="bsb-knowledge-empty-small">还没有追问。直接提出第一个问题。</div>';
  }

  function knowledgeBreadcrumbHtml(node) {
    if (!node) return "";
    const chain = [...knowledgeAncestorNodes(node), node];
    return chain.map((n, i) => `<button type="button" data-knowledge-node-id="${escapeAttr(n.id)}" title="${escapeAttr(n.question)}">${escapeHtml(n.question.length > 28 ? `${n.question.slice(0, 28)}…` : n.question)}</button>${i < chain.length - 1 ? '<span>›</span>' : ""}`).join("");
  }

  function knowledgeSuggestionsHtml(node) {
    const suggestions = Array.isArray(node?.suggestions) ? node.suggestions.filter(Boolean).slice(0, 4) : [];
    if (!suggestions.length) return "";
    return `<div class="bsb-knowledge-suggestions"><span class="bsb-knowledge-kicker">继续深入</span>${suggestions.map((q) => `<button type="button" data-knowledge-suggestion="${escapeAttr(q)}"><span>→</span>${escapeHtml(q)}</button>`).join("")}</div>`;
  }

  function knowledgeRailBodyHtml(anchor, activeNode, { showTree = state.knowledgeTreeOpen } = {}) {
    const nodes = knowledgeNodesForAnchor(anchor.id);
    const answer = activeNode ? knowledgeVisibleAnswer(activeNode.answer || activeNode.preview || "") : "";
    const answerFallback = !activeNode ? ""
      : activeNode.status === "error" ? `<div class="bsb-knowledge-thinking">回答失败${activeNode.error ? `：${escapeHtml(activeNode.error)}` : ""}</div>`
      : activeNode.status === "stopped" ? '<div class="bsb-knowledge-thinking">回答已停止。可以从这个节点继续提出新的问题。</div>'
      : '<div class="bsb-knowledge-thinking">正在组织回答…</div>';
    const answerBody = activeNode
      ? `<div class="bsb-knowledge-question"><div class="bsb-knowledge-question-meta"><span>${activeNode.status === "running" ? "正在回答" : activeNode.status === "stopped" ? "已停止" : activeNode.status === "error" ? "回答失败" : "当前问题"}</span><button type="button" class="bsb-knowledge-node-star${activeNode.starred ? " active" : ""}" data-knowledge-star-node title="${activeNode.starred ? "取消收藏这个回答" : "收藏这个回答"}">${activeNode.starred ? "★" : "☆"}</button></div><h3>${escapeHtml(activeNode.question)}</h3></div>
         <div class="bsb-knowledge-answer${activeNode.status === "running" ? " streaming" : ""}">${answer ? knowledgeMarkdownHtml(answer) : answerFallback}</div>
         ${knowledgeSuggestionsHtml(activeNode)}`
      : `<div class="bsb-knowledge-welcome"><div class="bsb-knowledge-orb">✦</div><strong>从这里向下钻</strong><span>这个锚点还没有问题。可以直接提问，或者先让 AI 解释它。</span><button type="button" data-knowledge-quick="explain">解释这个概念</button></div>`;
    return `<div class="bsb-knowledge-crumbs">${knowledgeBreadcrumbHtml(activeNode)}</div>
      <div class="bsb-knowledge-panel-main">${showTree ? `<div class="bsb-knowledge-tree">${knowledgeTreeHtml(anchor.id, activeNode?.id || "")}</div>` : answerBody}</div>
      <div class="bsb-knowledge-composer">
        <textarea data-role="knowledge-question" rows="2" placeholder="继续追问这个知识点…" ${state.knowledgeBusy ? "disabled" : ""}></textarea>
        <div class="bsb-knowledge-compose-foot"><label class="bsb-knowledge-model"><span>LLM</span><select data-role="knowledge-model" ${state.knowledgeBusy ? "disabled" : ""}>${knowledgeModelOptionsHtml()}</select></label><button type="button" class="bsb-btn accent" data-knowledge-send ${state.knowledgeBusy ? "disabled" : ""}>${state.knowledgeBusy ? "生成中" : "发送"}</button></div>
      </div>`;
  }

  function scheduleKnowledgeRender() {
    if (state.knowledgePaintRaf) return;
    state.knowledgePaintRaf = window.setTimeout(() => {
      state.knowledgePaintRaf = 0;
      if (state.ui?.view === "knowledge") renderKnowledgeWorkspace().catch(() => {});
      else if (state.knowledgeRailOpen) renderKnowledgeRail().catch(() => {});
    }, 72);
  }

  async function renderKnowledgeRail() {
    const root = document.getElementById(PANEL_ID);
    const rail = root?.querySelector('[data-role="knowledge-rail"]');
    const aiView = root?.querySelector('[data-view-panel="ai"]');
    if (!rail || !aiView) return;
    const oldPanel = rail.querySelector('.bsb-knowledge-panel-main');
    const oldScroll = oldPanel?.scrollTop || 0;
    const stickBottom = !!oldPanel && oldPanel.scrollHeight - oldPanel.scrollTop - oldPanel.clientHeight < 56;
    aiView.classList.toggle("knowledge-open", !!state.knowledgeRailOpen);
    rail.classList.toggle("open", !!state.knowledgeRailOpen);
    rail.setAttribute("aria-hidden", state.knowledgeRailOpen ? "false" : "true");
    if (!state.knowledgeRailOpen) return;
    if (!state.knowledgeAnchors.length) {
      try { await knowledgeRefreshCache(); } catch (_) { /* render empty */ }
    }
    const anchor = knowledgeAnchorById(state.knowledgeActiveAnchorId);
    if (!anchor) {
      rail.innerHTML = '<div class="bsb-knowledge-rail-empty"><span>✦</span><strong>Knowledge</strong><p>在 AI 处理字幕中选中文字，创建一个局部知识锚点。</p><button type="button" class="bsb-btn ghost" data-knowledge-close>关闭</button></div>';
      return;
    }
    const nodes = knowledgeNodesForAnchor(anchor.id);
    if (!nodes.some((n) => n.id === state.knowledgeActiveNodeId)) {
      const latest = [...nodes].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
      state.knowledgeActiveNodeId = latest?.id || "";
    }
    const activeNode = knowledgeNodeById(state.knowledgeActiveNodeId);
    rail.innerHTML = `<div class="bsb-knowledge-rail-head">
        <div class="bsb-knowledge-anchor-title"><span class="bsb-knowledge-kicker">KNOWLEDGE ANCHOR</span><strong>${escapeHtml(anchor.selectedText)}</strong><small>${escapeHtml(anchor.title || anchor.bvid)} · ${anchor.timeStart != null ? formatClock(anchor.timeStart) : "局部字幕"}${anchor.timeEnd > anchor.timeStart ? `–${formatClock(anchor.timeEnd)}` : ""}</small></div>
        <div class="bsb-knowledge-rail-actions">${state.knowledgeBusy ? '<button type="button" class="bsb-icon-btn" data-knowledge-stop title="停止回答">■</button>' : ''}<button type="button" class="bsb-icon-btn${anchor.starred ? " active" : ""}" data-knowledge-star-anchor title="${anchor.starred ? "取消收藏锚点" : "收藏锚点"}">${anchor.starred ? "★" : "☆"}</button><button type="button" class="bsb-icon-btn" data-knowledge-new-root title="新建独立根问题">＋</button><button type="button" class="bsb-icon-btn${state.knowledgeTreeOpen ? " active" : ""}" data-knowledge-tree-toggle title="追问树">☷</button><button type="button" class="bsb-icon-btn" data-knowledge-open-workspace title="在 Knowledge 工作区打开">↗</button><button type="button" class="bsb-icon-btn" data-knowledge-close title="关闭">×</button></div>
      </div>
      <div class="bsb-knowledge-rail-body">${knowledgeRailBodyHtml(anchor, activeNode)}</div>`;
    const nextPanel = rail.querySelector('.bsb-knowledge-panel-main');
    if (nextPanel) nextPanel.scrollTop = stickBottom ? nextPanel.scrollHeight : oldScroll;
  }

  async function openKnowledgeAnchor(anchorId, { workspace = false } = {}) {
    try { await knowledgeRefreshCache(); } catch (error) { setStatus(`知识库读取失败：${error.message || error}`, "err"); }
    const anchor = knowledgeAnchorById(anchorId);
    if (!anchor) return;
    state.knowledgeActiveAnchorId = anchor.id;
    const nodes = knowledgeNodesForAnchor(anchor.id);
    const latest = [...nodes].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
    state.knowledgeActiveNodeId = latest?.id || "";
    if (workspace) {
      setWorkspace("knowledge");
      await renderKnowledgeWorkspace();
    } else {
      state.knowledgeRailOpen = true;
      state.knowledgeTreeOpen = false;
      await renderKnowledgeRail();
    }
  }

  function closeKnowledgeRail() {
    state.knowledgeRailOpen = false;
    state.knowledgeTreeOpen = false;
    renderKnowledgeRail().catch(() => {});
  }

  function hideKnowledgeSelectionToolbar() {
    const root = document.getElementById(PANEL_ID);
    const toolbar = root?.querySelector('[data-role="knowledge-selection-toolbar"]');
    if (toolbar) toolbar.hidden = true;
  }

  function captureKnowledgeSelection() {
    const root = document.getElementById(PANEL_ID);
    const toolbar = root?.querySelector('[data-role="knowledge-selection-toolbar"]');
    if (!root || !toolbar || currentAiWorkbenchStage() !== "preprocess" || state.aiInputView !== "processed") return hideKnowledgeSelectionToolbar();
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return hideKnowledgeSelectionToolbar();
    const text = sel.toString().trim();
    if (text.length < KNOWLEDGE_SELECTION_MIN || text.length > KNOWLEDGE_SELECTION_MAX) return hideKnowledgeSelectionToolbar();
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    const body = node?.closest?.(".bsb-preprocess-block-body");
    const article = body?.closest?.(".bsb-preprocess-block");
    if (!body || !article || !root.contains(body)) return hideKnowledgeSelectionToolbar();
    const source = currentKnowledgeSource();
    const articleSourceKey = article.dataset.knowledgeSourceKey || source.sourceKey;
    const cards = Array.from(article.parentElement?.querySelectorAll?.(".bsb-preprocess-block") || [])
      .filter((card) => (card.dataset.knowledgeSourceKey || articleSourceKey) === articleSourceKey);
    const idx = cards.indexOf(article);
    const contextCards = cards.slice(Math.max(0, idx - 1), Math.min(cards.length, idx + 2));
    const contextText = contextCards.map((card) => {
      const topic = card.dataset.knowledgeTopic || "";
      const clock = card.dataset.knowledgeClock || "";
      const value = card.querySelector(".bsb-preprocess-block-body")?.textContent?.trim() || "";
      return `${clock ? `[${clock}] ` : ""}${topic ? `${topic}：` : ""}${value}`;
    }).join("\n\n");
    const rect = range.getBoundingClientRect();
    state.knowledgeSelection = {
      selectedText: text,
      sourceKey: articleSourceKey,
      bvid: article.dataset.knowledgeBvid || source.bvid,
      page: Number(article.dataset.knowledgePage || source.page || 1),
      title: article.dataset.knowledgeTitle || source.title,
      author: article.dataset.knowledgeAuthor || source.author,
      segmentId: article.dataset.knowledgeSegment || "",
      timeStart: Number(article.dataset.knowledgeStart || 0),
      timeEnd: Number(article.dataset.knowledgeEnd || article.dataset.knowledgeStart || 0),
      contextText,
      sourceHash: md5(currentInputPreviewText("processed") || ""),
    };
    const compactSelection = text.replace(/\s+/g, " ");
    toolbar.querySelector('[data-role="knowledge-selection-text"]').textContent = compactSelection.length > 42 ? `${compactSelection.slice(0, 42)}…` : compactSelection;
    const width = 300;
    const left = Math.min(window.innerWidth - width - 10, Math.max(10, rect.left + rect.width / 2 - width / 2));
    const top = Math.max(10, rect.top - 48);
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
    toolbar.hidden = false;
  }

  async function ensureKnowledgeAnchorFromSelection({ starred = false } = {}) {
    const sel = state.knowledgeSelection;
    if (!sel?.selectedText) throw new Error("当前没有有效字幕选区");
    if (!state.knowledgeAnchors.length) await knowledgeRefreshCache();
    let anchor = state.knowledgeAnchors.find((a) => a.sourceKey === sel.sourceKey && a.selectedText === sel.selectedText && Math.abs(Number(a.timeStart || 0) - Number(sel.timeStart || 0)) <= 5);
    const now = Date.now();
    if (!anchor) {
      anchor = {
        id: makeKnowledgeId("anchor"),
        sourceKey: sel.sourceKey,
        bvid: sel.bvid,
        page: sel.page,
        title: sel.title,
        author: sel.author,
        segmentId: sel.segmentId,
        selectedText: sel.selectedText,
        timeStart: sel.timeStart,
        timeEnd: sel.timeEnd,
        contextText: sel.contextText,
        sourceHash: sel.sourceHash,
        starred: !!starred,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      anchor = { ...anchor, contextText: sel.contextText || anchor.contextText, sourceHash: sel.sourceHash || anchor.sourceHash, starred: anchor.starred || !!starred, updatedAt: now };
    }
    await knowledgePutAnchor(anchor);
    state.knowledgeActiveAnchorId = anchor.id;
    state.knowledgeActiveNodeId = "";
    state.knowledgeRailOpen = true;
    hideKnowledgeSelectionToolbar();
    await decorateKnowledgeAnchors();
    await renderKnowledgeRail();
    renderKnowledgeWorkspace().catch(() => {});
    return anchor;
  }

  async function knowledgeAsk(anchorId, parentId, question) {
    const q = String(question || "").trim();
    if (!q || state.knowledgeBusy) return;
    if (!state.knowledgeAnchors.length) await knowledgeRefreshCache();
    const anchor = knowledgeAnchorById(anchorId);
    if (!anchor) throw new Error("知识锚点不存在");
    const model = knowledgeGetModelConfig();
    if (!model) throw new Error("没有可用的 LLM。请先在设置 → LLM 配置 Base URL / API Key / Model");
    const prompt = getActiveKnowledgePromptProfile();
    if (!prompt || (!prompt.systemPrompt.trim() && !prompt.userPromptTemplate.trim())) throw new Error("没有可用的 Knowledge Prompt");
    const parent = parentId ? knowledgeNodeById(parentId) : null;
    const now = Date.now();
    const node = {
      id: makeKnowledgeId("node"),
      anchorId: anchor.id,
      parentId: parent?.id || null,
      question: q,
      answer: "",
      preview: "",
      suggestions: [],
      modelId: model.id,
      starred: false,
      status: "running",
      createdAt: now,
      updatedAt: now,
    };
    state.knowledgeNodes.push(node);
    state.knowledgeActiveNodeId = node.id;
    state.knowledgeBusy = true;
    state.knowledgeTreeOpen = false;
    await knowledgePutNode(node);
    await renderKnowledgeRail();
    renderKnowledgeWorkspace().catch(() => {});
    const vars = {
      title: anchor.title || "",
      bvid: `${anchor.bvid || ""}${anchor.page > 1 ? ` P${anchor.page}` : ""}`,
      author: anchor.author || "",
      anchorText: anchor.selectedText || "",
      sourceContext: anchor.contextText || anchor.selectedText || "",
      ancestorPath: knowledgeBranchContext(parent),
      question: q,
    };
    const messages = [];
    const systemPrompt = renderPromptTemplate(prompt.systemPrompt, vars).trim();
    const userPrompt = renderPromptTemplate(prompt.userPromptTemplate, vars).trim();
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    if (userPrompt) messages.push({ role: "user", content: userPrompt });
    if (!messages.length) {
      state.knowledgeBusy = false;
      node.status = "error";
      await knowledgePutNode(node).catch(() => {});
      throw new Error("Knowledge Prompt 为空");
    }
    const runtime = createAiRuntime(`Knowledge · ${model.name || model.model}`);
    state.knowledgeRuntime = runtime;
    let latest = "";
    let lastPreviewPersistAt = 0;
    await new Promise((resolve, reject) => {
      requestChatCompletion({
        runtime,
        baseUrl: model.baseUrl,
        apiKey: model.apiKey,
        model: model.model,
        temperature: model.temperature,
        maxTokens: model.maxTokens,
        messages,
        stream: model.stream !== false,
        onStatus() {},
        onDelta(_delta, full) {
          latest = String(full || "");
          node.preview = latest;
          node.updatedAt = Date.now();
          if (node.updatedAt - lastPreviewPersistAt > 1800) {
            lastPreviewPersistAt = node.updatedAt;
            knowledgeStoreRequest(KNOWLEDGE_NODE_STORE, "readwrite", (s) => s.put(node)).catch(() => {});
          }
          scheduleKnowledgeRender();
        },
        onDone(full) {
          latest = String(full || latest || "");
          resolve();
        },
        onError(error) { reject(error instanceof Error ? error : new Error(String(error || "Knowledge 请求失败"))); },
      });
    }).then(async () => {
      const parsed = parseKnowledgeOutput(latest);
      node.answer = parsed.answer || latest.trim();
      node.preview = "";
      node.suggestions = parsed.suggestions;
      node.status = "done";
      node.updatedAt = Date.now();
      anchor.updatedAt = node.updatedAt;
      await Promise.all([knowledgePutNode(node), knowledgePutAnchor(anchor)]);
      await ensureMarkdownCore().catch(() => {});
      if (hasMathSyntax(node.answer)) await ensureKatex().catch(() => {});
      setStatus(`Knowledge · 已回答：${q.slice(0, 28)}${q.length > 28 ? "…" : ""}`, "ok");
    }).catch(async (error) => {
      const stopped = !!runtime.abort;
      node.answer = knowledgeVisibleAnswer(latest);
      node.preview = "";
      node.status = stopped ? "stopped" : "error";
      node.error = stopped ? "" : String(error?.message || error || "请求失败");
      node.updatedAt = Date.now();
      await knowledgePutNode(node).catch(() => {});
      setStatus(stopped ? "Knowledge 已停止" : `Knowledge 失败：${node.error}`, stopped ? "" : "err");
    }).finally(async () => {
      state.knowledgeBusy = false;
      state.knowledgeRuntime = null;
      await renderKnowledgeRail();
      await renderKnowledgeWorkspace().catch(() => {});
    });
  }

  function abortKnowledgeRequest() {
    const runtime = state.knowledgeRuntime;
    if (!runtime) return;
    runtime.abort = true;
    try { runtime.abortController?.abort(); } catch (_) { /* noop */ }
    try { runtime.xhr?.abort?.(); } catch (_) { /* noop */ }
    setStatus("正在停止 Knowledge 回答…");
  }

  async function decorateKnowledgeAnchors(host = null) {
    const root = document.getElementById(PANEL_ID);
    const scope = host || root?.querySelector('[data-role="ai-content"]');
    if (!scope || !scope.querySelector(".bsb-preprocess-reading")) return;
    try { await knowledgeRefreshCache(); } catch (_) { return; }
    const anchors = state.knowledgeAnchors;
    const bodies = Array.from(scope.querySelectorAll(".bsb-preprocess-block-body"));
    for (const body of bodies) {
      const article = body.closest(".bsb-preprocess-block");
      const original = body.textContent || "";
      const articleSourceKey = article?.dataset.knowledgeSourceKey || currentKnowledgeSource().sourceKey;
      const relevant = anchors.filter((a) => a.sourceKey === articleSourceKey && original.includes(a.selectedText));
      if (!relevant.length) continue;
      const ranges = relevant.map((a) => ({ a, start: original.indexOf(a.selectedText), end: original.indexOf(a.selectedText) + a.selectedText.length })).filter((x) => x.start >= 0).sort((x, y) => x.start - y.start || y.end - x.end);
      const accepted = [];
      let cursor = -1;
      for (const r of ranges) {
        if (r.start < cursor) continue;
        accepted.push(r); cursor = r.end;
      }
      let html = ""; cursor = 0;
      for (const r of accepted) {
        html += escapeHtml(original.slice(cursor, r.start));
        html += `<mark class="bsb-knowledge-anchor-mark" data-knowledge-anchor-id="${escapeAttr(r.a.id)}" title="${knowledgeNodesForAnchor(r.a.id).length} 个追问 · 点击继续">${escapeHtml(original.slice(r.start, r.end))}</mark>`;
        cursor = r.end;
      }
      html += escapeHtml(original.slice(cursor));
      body.innerHTML = html;
      if (article) article.classList.add("has-knowledge");
    }
  }

  function knowledgeAnchorListItemHtml(anchor) {
    const count = knowledgeNodesForAnchor(anchor.id).length;
    const active = anchor.id === state.knowledgeActiveAnchorId;
    return `<button type="button" class="bsb-knowledge-list-item${active ? " active" : ""}" data-knowledge-anchor-list="${escapeAttr(anchor.id)}"><span class="bsb-knowledge-list-dot"></span><span class="bsb-knowledge-list-main"><strong>${escapeHtml(anchor.selectedText)}</strong><small>${escapeHtml(anchor.title || anchor.bvid)} · ${count} 个追问${anchor.timeStart != null ? ` · ${formatClock(anchor.timeStart)}` : ""}</small></span>${anchor.starred ? '<span class="bsb-knowledge-star">★</span>' : ""}</button>`;
  }

  async function renderKnowledgeWorkspace() {
    const root = document.getElementById(PANEL_ID);
    const workspace = root?.querySelector(".bsb-knowledge-workspace");
    const list = root?.querySelector('[data-role="knowledge-list"]');
    const detail = root?.querySelector('[data-role="knowledge-detail"]');
    const count = root?.querySelector('[data-role="knowledge-count"]');
    if (!list || !detail) return;
    const isSmall = root?.getAttribute("data-panel-size") === "small";
    const oldPanel = detail.querySelector('.bsb-knowledge-panel-main');
    const oldScroll = oldPanel?.scrollTop || 0;
    const stickBottom = !!oldPanel && oldPanel.scrollHeight - oldPanel.scrollTop - oldPanel.clientHeight < 56;
    try {
      if (!state.knowledgeBusy) await knowledgeRefreshCache();
    } catch (error) {
      detail.innerHTML = `<div class="bsb-empty"><strong>知识库不可用</strong><span>${escapeHtml(error.message || error)}</span></div>`;
      return;
    }
    const q = String(state.knowledgeSearch || "").trim().toLocaleLowerCase();
    const nodeMatchIds = new Set();
    if (q) {
      for (const node of state.knowledgeNodes) {
        const hay = `${node.question || ""}\n${node.answer || ""}\n${node.preview || ""}`.toLocaleLowerCase();
        if (hay.includes(q)) nodeMatchIds.add(node.anchorId);
      }
    }
    const anchors = q
      ? state.knowledgeAnchors.filter((a) => `${a.selectedText}\n${a.title}\n${a.contextText}`.toLocaleLowerCase().includes(q) || nodeMatchIds.has(a.id))
      : state.knowledgeAnchors;
    if (count) count.textContent = `${anchors.length}`;
    list.innerHTML = anchors.length ? anchors.map(knowledgeAnchorListItemHtml).join("") : '<div class="bsb-knowledge-library-empty">没有匹配的知识锚点。<br>你也可以搜索追问内容或 AI 回答。</div>';

    const activeStillVisible = anchors.some((a) => a.id === state.knowledgeActiveAnchorId);
    if (!activeStillVisible) {
      state.knowledgeActiveAnchorId = isSmall ? "" : (anchors[0]?.id || "");
      state.knowledgeActiveNodeId = "";
    }
    const anchor = knowledgeAnchorById(state.knowledgeActiveAnchorId);
    workspace?.classList.toggle("detail-open", !!anchor);
    if (!anchor) {
      detail.innerHTML = '<div class="bsb-empty"><div class="bsb-empty-ico">◇</div><strong>Knowledge Workspace</strong><span>从左侧选择一个知识锚点，或去 AI → 预处理 → AI 处理字幕中选中概念开始。</span></div>';
      return;
    }
    const nodes = knowledgeNodesForAnchor(anchor.id);
    if (!nodes.some((n) => n.id === state.knowledgeActiveNodeId)) state.knowledgeActiveNodeId = [...nodes].sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0))[0]?.id || "";
    const activeNode = knowledgeNodeById(state.knowledgeActiveNodeId);
    detail.innerHTML = `<div class="bsb-knowledge-workspace-head"><div><span class="bsb-knowledge-kicker">ANCHOR</span><h2>${escapeHtml(anchor.selectedText)}</h2><p>${escapeHtml(anchor.title || anchor.bvid)} · ${anchor.bvid}${anchor.page > 1 ? ` P${anchor.page}` : ""}${anchor.timeStart != null ? ` · ${formatClock(anchor.timeStart)}` : ""}</p></div><div><button type="button" class="bsb-btn ghost bsb-knowledge-mobile-back" data-knowledge-back-list>← 返回</button><button type="button" class="bsb-btn ghost${anchor.starred ? " active" : ""}" data-knowledge-star-anchor>${anchor.starred ? "★ 已收藏" : "☆ 收藏"}</button><button type="button" class="bsb-btn ghost" data-knowledge-seek>回到字幕</button><button type="button" class="bsb-btn danger" data-knowledge-delete-anchor>删除</button></div></div>
      <div class="bsb-knowledge-workspace-body"><aside class="bsb-knowledge-tree-pane"><div class="bsb-knowledge-kicker">THREAD TREE</div>${knowledgeTreeHtml(anchor.id, activeNode?.id || "")}</aside><main class="bsb-knowledge-detail-pane">${knowledgeRailBodyHtml(anchor, activeNode, { showTree: false })}</main></div>`;
    const nextPanel = detail.querySelector('.bsb-knowledge-panel-main');
    if (nextPanel) nextPanel.scrollTop = stickBottom ? nextPanel.scrollHeight : oldScroll;
  }

  // ─── Postprocess output tasks ───────────────────────────────────────────
  // A task is a user-facing output artifact. It references one POST Prompt and
  // one or more LLM profiles. This is intentionally separate from Prompt/LLM
  // definitions so the main AI surface can organize results by artifact first.
  function makePostTaskId() {
    return `output-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizePostTask(seed, index = 0) {
    const o = seed && typeof seed === "object" ? seed : {};
    return {
      id: String(o.id || makePostTaskId()),
      promptId: String(o.promptId || ""),
      modelIds: Array.from(new Set((Array.isArray(o.modelIds) ? o.modelIds : []).map(String).filter(Boolean))),
      enabled: !(o.enabled === false || o.enabled === "false" || o.enabled === 0),
      order: Number.isFinite(Number(o.order)) ? Number(o.order) : index,
    };
  }

  function sanitizePostTasks(tasks, prompts, profiles, { createDefault = true } = {}) {
    const posts = (prompts || []).filter((p) => p.stage === "postprocess");
    const postIds = new Set(posts.map((p) => p.id));
    const profileIds = new Set((profiles || []).map((p) => p.id));
    let out = (Array.isArray(tasks) ? tasks : [])
      .map(normalizePostTask)
      .filter((t) => postIds.has(t.promptId))
      .map((t, i) => ({ ...t, modelIds: t.modelIds.filter((id) => profileIds.has(id)), order: i }));
    if (!out.length && createDefault && posts.length) {
      const preferred = posts.find((p) => p.id === state.activePromptId) || posts[0];
      const enabledModels = (profiles || []).filter((p) => p.enabled).map((p) => p.id);
      out = [normalizePostTask({ promptId: preferred.id, modelIds: enabledModels, enabled: true, order: 0 }, 0)];
    }
    return out;
  }

  function loadPostTasks() {
    const prompts = state.promptProfiles?.length ? state.promptProfiles : loadPromptProfiles().prompts;
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    let tasks = [];
    try {
      const raw = storageGet(POST_TASKS_STORE_KEY, null);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        tasks = Array.isArray(parsed) ? parsed : parsed?.tasks;
      }
    } catch (_) { /* use default */ }
    tasks = sanitizePostTasks(tasks, prompts, profiles, { createDefault: true });
    state.postTasks = tasks;
    if (!tasks.some((t) => t.id === state.aiActiveTaskId)) state.aiActiveTaskId = tasks[0]?.id || "";
    return tasks;
  }

  function savePostTasks(tasks) {
    const prompts = state.promptProfiles?.length ? state.promptProfiles : loadPromptProfiles().prompts;
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    const normalized = sanitizePostTasks(tasks, prompts, profiles, { createDefault: true });
    try {
      storageSet(POST_TASKS_STORE_KEY, JSON.stringify({ version: POST_TASKS_SCHEMA_VERSION, tasks: normalized }));
    } catch (_) { /* ignore */ }
    state.postTasks = normalized;
    if (!normalized.some((t) => t.id === state.aiActiveTaskId)) state.aiActiveTaskId = normalized[0]?.id || "";
    renderAiFlowDrawer();
    renderAiResultTabs();
    refreshAiChips();
    return normalized;
  }

  function currentPostTasks() {
    return state.postTasks?.length ? state.postTasks : loadPostTasks();
  }

  function promptForTask(task) {
    return (state.promptProfiles || []).find((p) => p.id === task?.promptId && p.stage === "postprocess") || null;
  }

  function promptListItemHtml(prompt) {
    const selected = prompt.id === state.promptEditorId;
    const active = prompt.stage === "preprocess" ? prompt.id === state.activePrePromptId : prompt.stage === "knowledge" ? prompt.id === state.activeKnowledgePromptId : prompt.id === state.activePromptId;
    return `<button type="button" class="bsb-config-list-item${selected ? " selected" : ""}" data-prompt-list-id="${escapeAttr(prompt.id)}" title="${escapeAttr(prompt.name)}">
      <span class="bsb-config-dot${active ? " current" : ""}"></span>
      <span class="bsb-config-item-main">
        <span class="bsb-config-item-name">${escapeHtml(prompt.name)}</span>
        <span class="bsb-config-item-sub">${escapeHtml(prompt.hint || "自定义提示词")}</span>
      </span>
      ${active ? `<span class="bsb-config-badge">${prompt.stage === "preprocess" ? "当前" : prompt.stage === "knowledge" ? "Knowledge" : "默认"}</span>` : ''}
    </button>`;
  }

  function promptEditorHtml(prompt, index) {
    if (!prompt) {
      return '<div class="bsb-config-editor-empty">没有可编辑的 Prompt。<br>请从左侧新建，或恢复内置 Prompt。</div>';
    }
    const active = prompt.stage === "preprocess" ? prompt.id === state.activePrePromptId : prompt.stage === "knowledge" ? prompt.id === state.activeKnowledgePromptId : prompt.id === state.activePromptId;
    const stageName = prompt.stage === "preprocess" ? "预处理" : prompt.stage === "knowledge" ? "Knowledge" : "后处理";
    const activeMeaning = prompt.stage === "preprocess" ? "当前输入整理默认" : prompt.stage === "knowledge" ? "局部追问默认 Prompt" : "新建产物默认 Prompt";
    return `<section data-prompt-id="${escapeAttr(prompt.id)}" data-prompt-stage="${escapeAttr(prompt.stage)}">
      <div class="bsb-config-editor-head">
        <div class="bsb-config-editor-title">
          <strong>${escapeHtml(prompt.name || `提示词 ${index + 1}`)}</strong>
          <span>${stageName} Prompt · ${active ? activeMeaning : "可在处理方案中自由组合"}</span>
        </div>
        <div class="bsb-config-editor-actions">
          <button type="button" class="bsb-btn ${active ? "ghost" : "primary"}" data-prompt-act="use">${active ? "默认" : "设为默认"}</button>
          <button type="button" class="bsb-btn ghost" data-prompt-act="duplicate">复制</button>
          <button type="button" class="bsb-btn danger" data-prompt-act="delete">删除</button>
        </div>
      </div>
      <label>名称
        <input type="text" data-prompt-field="name" value="${escapeAttr(prompt.name)}" placeholder="提示词名称" autocomplete="off">
      </label>
      <label>简短说明
        <input type="text" data-prompt-field="hint" value="${escapeAttr(prompt.hint)}" placeholder="说明它在管线中的用途" autocomplete="off">
      </label>
      <label>System Prompt
        <textarea data-prompt-field="systemPrompt" spellcheck="false">${escapeHtml(prompt.systemPrompt)}</textarea>
      </label>
      <label>User Prompt Template
        <textarea data-prompt-field="userPromptTemplate" spellcheck="false">${escapeHtml(prompt.userPromptTemplate)}</textarea>
      </label>
      <div class="bsb-prompt-vars">${prompt.stage === "preprocess"
        ? "可用变量：<code>{{title}}</code> <code>{{bvid}}</code> <code>{{author}}</code> <code>{{subtitle}}</code> <code>{{chunkIndex}}</code> <code>{{chunkCount}}</code>。"
        : prompt.stage === "knowledge"
          ? "可用变量：<code>{{title}}</code> <code>{{bvid}}</code> <code>{{author}}</code> <code>{{anchorText}}</code> <code>{{sourceContext}}</code> <code>{{ancestorPath}}</code> <code>{{question}}</code>。"
          : "可用变量：<code>{{title}}</code> <code>{{bvid}}</code> <code>{{author}}</code> <code>{{subtitle}}</code> <code>{{rawSubtitle}}</code> <code>{{processedSubtitle}}</code>。"}脚本只替换变量，不追加隐藏任务指令。</div>
      <div class="bsb-preprocess-note">${prompt.stage === "preprocess"
        ? "这是预处理 Prompt：只负责原始字幕的清洗、翻译与规范化，不做摘要、制图或知识重构。输出会成为后处理的输入。"
        : prompt.stage === "knowledge"
          ? "这是 Knowledge Prompt：只处理当前字幕锚点与当前追问分支。字幕局部上下文、祖先路径和当前问题会明确传入，不会隐藏整段视频上下文。"
          : "这是后处理 Prompt：负责把规范化字幕转换成 Mermaid、笔记、自测等最终产物。<code>{{subtitle}}</code> 在预处理开启时就是规范化稿，关闭时自动退回原始字幕。"}</div>
      <div class="bsb-ai-cfg-actions" style="margin-top:12px">
        <button type="button" class="bsb-btn primary" data-act="prompt-save">保存当前 Prompt</button>
      </div>
    </section>`;
  }

  function readPromptEditor(editor, index) {
    if (!editor) return null;
    const get = (key) => editor.querySelector(`[data-prompt-field="${key}"]`);
    return createPromptProfile({
      id: editor.dataset.promptId || makePromptProfileId(),
      stage: editor.dataset.promptStage === "preprocess" ? "preprocess" : editor.dataset.promptStage === "knowledge" ? "knowledge" : "postprocess",
      name: String(get("name")?.value || `提示词 ${index + 1}`),
      hint: String(get("hint")?.value || "自定义提示词"),
      systemPrompt: String(get("systemPrompt")?.value || ""),
      userPromptTemplate: String(get("userPromptTemplate")?.value || ""),
    }, index);
  }

  function savePromptProfilesFromForm({ activeId } = {}) {
    const root = ensurePanel();
    const current = state.promptProfiles?.length || state.activePromptId
      ? [...state.promptProfiles]
      : [...loadPromptProfiles().prompts];
    const editor = root.querySelector('[data-role="prompt-editor"] [data-prompt-id]');
    if (editor) {
      const index = current.findIndex((p) => p.id === editor.dataset.promptId);
      if (index >= 0) current[index] = readPromptEditor(editor, index);
    }
    const selected = activeId != null
      ? String(activeId)
      : String(root.querySelector('[data-role="prompt-select"]')?.value || state.activePromptId || "");
    return savePromptProfiles(current, selected, state.activePrePromptId, state.activeKnowledgePromptId);
  }

  function refreshPromptSelector(root) {
    if (!root) return;
    const postSelect = root.querySelector('[data-role="prompt-select"]');
    const preSelect = root.querySelector('[data-role="preprocess-prompt-select"]');
    const prompts = state.promptProfiles || [];
    const posts = prompts.filter((p) => p.stage === "postprocess");
    const pres = prompts.filter((p) => p.stage === "preprocess");

    if (postSelect) {
      postSelect.disabled = !posts.length;
      postSelect.innerHTML = posts.length
        ? posts.map((p) => `<option value="${escapeAttr(p.id)}">${escapeHtml(p.name)}</option>`).join("")
        : '<option value="">没有后处理 Prompt</option>';
      const active = posts.some((p) => p.id === state.activePromptId) ? state.activePromptId : (posts[0]?.id || "");
      state.activePromptId = active;
      postSelect.value = active;
    }
    if (preSelect) {
      preSelect.disabled = !pres.length || !state.preprocessEnabled;
      preSelect.innerHTML = pres.length
        ? pres.map((p) => `<option value="${escapeAttr(p.id)}">${escapeHtml(p.name)}</option>`).join("")
        : '<option value="">没有预处理 Prompt</option>';
      const active = pres.some((p) => p.id === state.activePrePromptId) ? state.activePrePromptId : (pres[0]?.id || "");
      state.activePrePromptId = active;
      preSelect.value = active;
    }
    const toggle = root.querySelector('[data-role="preprocess-enabled"]');
    if (toggle) toggle.checked = !!state.preprocessEnabled;
    updatePromptUi(root, getActivePromptProfile());
  }

  function renderPromptList(root) {
    const host = root?.querySelector('[data-role="prompt-list"]');
    if (!host) return;
    const q = String(state.promptSearch || "").trim().toLocaleLowerCase();
    const stage = state.ui?.promptStage === "postprocess" ? "postprocess" : state.ui?.promptStage === "knowledge" ? "knowledge" : "preprocess";
    const prompts = (state.promptProfiles || []).filter((p) => p.stage === stage);
    const filtered = q
      ? prompts.filter((p) => `${p.name}\n${p.hint}`.toLocaleLowerCase().includes(q))
      : prompts;
    host.innerHTML = filtered.length
      ? filtered.map(promptListItemHtml).join("")
      : `<div class="bsb-config-list-empty">${prompts.length ? "没有匹配的 Prompt" : (stage === "preprocess" ? "还没有预处理 Prompt" : stage === "knowledge" ? "还没有 Knowledge Prompt" : "还没有后处理 Prompt")}</div>`;
  }

  function fillPromptConfigForm(root) {
    if (!root) return;
    const library = loadPromptProfiles();
    const stage = state.ui?.promptStage === "postprocess" ? "postprocess" : state.ui?.promptStage === "knowledge" ? "knowledge" : "preprocess";
    if (!library.prompts.some((p) => p.id === state.promptEditorId && p.stage === stage)) {
      const preferredId = stage === "preprocess" ? library.activePreprocessId : stage === "knowledge" ? library.activeKnowledgeId : library.activeId;
      state.promptEditorId = library.prompts.find((p) => p.id === preferredId && p.stage === stage)?.id
        || library.prompts.find((p) => p.stage === stage)?.id || "";
    }
    const search = root.querySelector('[data-role="prompt-search"]');
    if (search && search.value !== state.promptSearch) search.value = state.promptSearch;
    renderPromptList(root);
    const editorHost = root.querySelector('[data-role="prompt-editor"]');
    if (editorHost) {
      const index = library.prompts.findIndex((p) => p.id === state.promptEditorId);
      editorHost.innerHTML = promptEditorHtml(index >= 0 ? library.prompts[index] : null, Math.max(0, index));
    }
    refreshPromptSelector(root);
  }

  function handlePromptProfileAction(button) {
    const editor = button.closest?.("[data-prompt-id]");
    const action = button.dataset.promptAct;
    if (!editor || !action) return;
    const library = savePromptProfilesFromForm({ activeId: state.activePromptId });
    const index = library.prompts.findIndex((p) => p.id === editor.dataset.promptId);
    if (index < 0) return;
    const current = library.prompts[index];
    if (action === "use") {
      if (current.stage === "preprocess") savePromptProfiles(library.prompts, library.activeId, current.id, library.activeKnowledgeId);
      else if (current.stage === "knowledge") savePromptProfiles(library.prompts, library.activeId, library.activePreprocessId, current.id);
      else savePromptProfiles(library.prompts, current.id, library.activePreprocessId, library.activeKnowledgeId);
      state.promptEditorId = current.id;
      fillPromptConfigForm(ensurePanel());
      setStatus(`当前${current.stage === "preprocess" ? "预处理" : current.stage === "knowledge" ? "Knowledge" : "后处理"}提示词：${current.name}`, "ok");
      return;
    }
    if (action === "duplicate") {
      const copy = createPromptProfile({ ...current, id: makePromptProfileId(), name: `${current.name} 副本` }, index + 1);
      const prompts = [...library.prompts];
      prompts.splice(index + 1, 0, copy);
      savePromptProfiles(prompts, library.activeId, library.activePreprocessId, library.activeKnowledgeId);
      state.promptEditorId = copy.id;
      fillPromptConfigForm(ensurePanel());
      setStatus(`已复制提示词：${copy.name}`, "ok");
      return;
    }
    if (action === "delete") {
      const prompts = [...library.prompts];
      const [removed] = prompts.splice(index, 1);
      const sameStage = prompts.filter((p) => p.stage === removed.stage);
      let nextActiveId = library.activeId;
      let nextPreId = library.activePreprocessId;
      let nextKnowledgeId = library.activeKnowledgeId;
      if (removed.stage === "preprocess" && removed.id === library.activePreprocessId) nextPreId = sameStage[0]?.id || "";
      if (removed.stage === "postprocess" && removed.id === library.activeId) nextActiveId = sameStage[0]?.id || "";
      if (removed.stage === "knowledge" && removed.id === library.activeKnowledgeId) nextKnowledgeId = sameStage[0]?.id || "";
      savePromptProfiles(prompts, nextActiveId, nextPreId, nextKnowledgeId);
      state.promptEditorId = sameStage[0]?.id || "";
      fillPromptConfigForm(ensurePanel());
      setStatus(`已删除提示词：${removed.name}${sameStage.length ? "" : ` · 当前没有${removed.stage === "preprocess" ? "预处理" : removed.stage === "knowledge" ? "Knowledge" : "后处理"} Prompt`}`, sameStage.length ? "ok" : "err");
    }
  }

  function updatePromptUi(root, prompt) {
    const hint = root?.querySelector('[data-role="prompt-hint"]');
    if (hint) hint.textContent = prompt?.hint || "请在设置中新增或恢复提示词";
  }

  function renderPromptTemplate(template, vars) {
    const values = {
      title: String(vars?.title || ""),
      bvid: String(vars?.bvid || ""),
      author: String(vars?.author || ""),
      subtitle: String(vars?.subtitle || ""),
      rawSubtitle: String(vars?.rawSubtitle || ""),
      processedSubtitle: String(vars?.processedSubtitle || ""),
      chunkIndex: String(vars?.chunkIndex || ""),
      chunkCount: String(vars?.chunkCount || ""),
      anchorText: String(vars?.anchorText || ""),
      sourceContext: String(vars?.sourceContext || ""),
      ancestorPath: String(vars?.ancestorPath || ""),
      question: String(vars?.question || ""),
    };
    return String(template || "").replace(/\{\{\s*(title|bvid|author|subtitle|rawSubtitle|processedSubtitle|chunkIndex|chunkCount|anchorText|sourceContext|ancestorPath|question)\s*\}\}/g, (_, key) => values[key] ?? "");
  }

  function makeAiProfileId() {
    return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createAiProfile(seed, index = 0) {
    const o = seed && typeof seed === "object" ? seed : {};
    const temperature = Number(o.temperature);
    return {
      id: String(o.id || makeAiProfileId()),
      name: String(o.name || o.label || o.model || `模型 ${index + 1}`).slice(0, 80),
      enabled: o.enabled !== false,
      baseUrl: String(o.baseUrl || AI_DEFAULTS.baseUrl).trim().replace(/\/+$/, ""),
      apiKey: String(o.apiKey != null ? o.apiKey : AI_DEFAULTS.apiKey).trim(),
      model: String(o.model || AI_DEFAULTS.model).trim(),
      temperature: Number.isFinite(temperature) ? temperature : AI_DEFAULTS.temperature,
      maxTokens: Math.max(256, Math.min(128000, Math.floor(Number(o.maxTokens) || AI_DEFAULTS.maxTokens))),
      stream: !(o.stream === false || o.stream === "false" || o.stream === 0),
    };
  }

  function normalizeAiProfiles(input) {
    const list = Array.isArray(input) ? input : [];
    const normalized = list.filter((x) => x && typeof x === "object").map(createAiProfile);
    return normalized.length ? normalized : [createAiProfile(AI_DEFAULTS, 0)];
  }

  function loadAiProfiles() {
    try {
      const raw = storageGet(AI_PROFILES_STORE_KEY, null);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        const list = Array.isArray(parsed) ? parsed : parsed?.profiles;
        if (Array.isArray(list) && list.length) {
          const storedVersion = Array.isArray(parsed) ? 1 : Number(parsed?.version || 1);
          const seeds = storedVersion < AI_PROFILES_SCHEMA_VERSION
            ? list.map((profile) => ({
                ...profile,
                // v2 以前的默认值 4096 自动升级；用户自定义的其它值保持不变。
                maxTokens: Number(profile?.maxTokens) === 4096 ? AI_DEFAULTS.maxTokens : profile?.maxTokens,
                // v4 起模型配置只保留 API 与采样参数；提示词迁移到独立模板库。
              }))
            : list;
          const normalized = normalizeAiProfiles(seeds);
          if (storedVersion < AI_PROFILES_SCHEMA_VERSION) {
            storageSet(AI_PROFILES_STORE_KEY, JSON.stringify({
              version: AI_PROFILES_SCHEMA_VERSION,
              profiles: normalized,
            }));
          }
          return normalized;
        }
      }
    } catch (_) {
      /* fall through to legacy migration */
    }

    // 首次升级时把旧的单配置无损迁移为第一个 profile。
    try {
      const raw = storageGet(AI_STORE_KEY, null);
      if (raw) {
        const legacy = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (legacy && typeof legacy === "object") {
          const migrated = [createAiProfile({ ...legacy, name: legacy.name || legacy.model || "默认模型" }, 0)];
          storageSet(AI_PROFILES_STORE_KEY, JSON.stringify({ version: AI_PROFILES_SCHEMA_VERSION, profiles: migrated }));
          return migrated;
        }
      }
    } catch (_) {
      /* ignore */
    }
    return [createAiProfile({ ...AI_DEFAULTS, name: "默认模型" }, 0)];
  }

  function saveAiProfiles(profiles) {
    const normalized = normalizeAiProfiles(profiles);
    try {
      storageSet(AI_PROFILES_STORE_KEY, JSON.stringify({ version: AI_PROFILES_SCHEMA_VERSION, profiles: normalized }));
    } catch (_) {
      /* ignore */
    }
    state.aiProfiles = normalized;
    state.ai = normalized.find((x) => x.enabled) || normalized[0] || null;
    refreshPreprocessModelSelector(document.getElementById(PANEL_ID));
    if (state.postTasks?.length) savePostTasks(state.postTasks);
    else loadPostTasks();
    refreshAiChips();
    renderAiResultTabs();
    return normalized;
  }

  function enabledAiProfiles({ requireReady = false } = {}) {
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    return profiles.filter((p) => p.enabled && (!requireReady || (p.apiKey && p.baseUrl && p.model)));
  }

  // 兼容脚本中“取一个配置”的辅助功能（例如 Mermaid 修复）：优先当前结果对应配置。

  function refreshPreprocessModelSelector(root) {
    root = root || document.getElementById(PANEL_ID);
    const select = root?.querySelector('[data-role="preprocess-model-select"]');
    if (!select) return;
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    const ready = profiles.filter((p) => p.apiKey && p.baseUrl && p.model);
    const fallback = ready.find((p) => p.enabled) || ready[0] || null;
    if (!ready.length) {
      select.innerHTML = '<option value="">没有可用 LLM</option>';
      select.value = "";
      select.disabled = true;
      state.preprocessModelId = "";
      return;
    }
    select.disabled = !state.preprocessEnabled;
    select.innerHTML = ready.map((p) => `<option value="${escapeAttr(p.id)}">${escapeHtml(p.name || p.model)}</option>`).join("");
    if (!ready.some((p) => p.id === state.preprocessModelId)) {
      state.preprocessModelId = fallback?.id || ready[0].id;
      storageSet(PREPROCESS_MODEL_STORE_KEY, state.preprocessModelId);
    }
    select.value = state.preprocessModelId;
  }

  function getPreprocessModelConfig(profiles) {
    const all = Array.isArray(profiles) && profiles.length ? profiles : (state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles());
    const ready = all.filter((p) => p.apiKey && p.baseUrl && p.model);
    const selected = ready.find((p) => p.id === state.preprocessModelId);
    return selected || ready.find((p) => p.enabled) || ready[0] || null;
  }

  function loadAiConfig() {
    const active = getActiveAiRun();
    if (active?.config) return active.config;
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    return profiles.find((x) => x.enabled) || profiles[0] || createAiProfile(AI_DEFAULTS, 0);
  }

  function saveAiConfig(cfg) {
    const profiles = state.aiProfiles?.length ? [...state.aiProfiles] : loadAiProfiles();
    const index = Math.max(0, profiles.findIndex((x) => x.id === cfg?.id));
    profiles[index] = createAiProfile({ ...(profiles[index] || {}), ...(cfg || {}) }, index);
    saveAiProfiles(profiles);
    return profiles[index];
  }

  function aiListItemHtml(profile) {
    const selected = profile.id === state.aiEditorId;
    return `<button type="button" class="bsb-config-list-item${selected ? " selected" : ""}" data-ai-list-id="${escapeAttr(profile.id)}" title="${escapeAttr(profile.name)}">
      <span class="bsb-config-dot${profile.enabled ? " enabled" : ""}"></span>
      <span class="bsb-config-item-main">
        <span class="bsb-config-item-name">${escapeHtml(profile.name || profile.model || "未命名模型")}</span>
        <span class="bsb-config-item-sub">${escapeHtml(profile.model || "未填写 model")}</span>
      </span>
      ${profile.enabled ? '<span class="bsb-config-badge">启用</span>' : ''}
    </button>`;
  }

  function aiEditorHtml(profile, index) {
    if (!profile) return '<div class="bsb-config-editor-empty">没有可编辑的 LLM 配置。</div>';
    const summary = [profile.baseUrl || "未填写 Base URL", profile.model || "未填写 model"].join(" · ");
    return `<section data-ai-profile-id="${escapeAttr(profile.id)}">
      <div class="bsb-config-editor-head">
        <div class="bsb-config-editor-title">
          <strong>${escapeHtml(profile.name || `模型 ${index + 1}`)}</strong>
          <span>${escapeHtml(summary)}</span>
        </div>
        <div class="bsb-config-editor-actions">
          <button type="button" class="bsb-btn ghost" data-ai-profile-act="duplicate">复制</button>
          <button type="button" class="bsb-btn danger" data-ai-profile-act="delete">删除</button>
        </div>
      </div>
      <label style="flex-direction:row;align-items:center;gap:8px;margin-bottom:10px">
        <input type="checkbox" data-ai-field="enabled" style="width:auto" ${profile.enabled ? "checked" : ""}>
        启用此模型（启用后参与并发分析）
      </label>
      <label>配置名称
        <input type="text" data-ai-field="name" value="${escapeAttr(profile.name || `模型 ${index + 1}`)}" placeholder="例如：NVIDIA - GPT OSS 120B" autocomplete="off">
      </label>
      <label>Base URL（含 /v1）
        <input type="text" data-ai-field="baseUrl" value="${escapeAttr(profile.baseUrl)}" placeholder="https://api.example.com/v1" autocomplete="off">
      </label>
      <label>API Key
        <input type="password" data-ai-field="apiKey" value="${escapeAttr(profile.apiKey)}" placeholder="sk-..." autocomplete="off">
      </label>
      <label>Model
        <input type="text" data-ai-field="model" value="${escapeAttr(profile.model)}" placeholder="gpt-4o-mini" autocomplete="off">
      </label>
      <div class="row2">
        <label>Temperature
          <input type="number" data-ai-field="temperature" min="0" max="2" step="0.1" value="${escapeAttr(profile.temperature)}">
        </label>
        <label>Max tokens
          <input type="number" data-ai-field="maxTokens" min="256" max="128000" step="256" value="${escapeAttr(profile.maxTokens)}">
        </label>
      </div>
      <label style="flex-direction:row;align-items:center;gap:8px;margin-bottom:10px">
        <input type="checkbox" data-ai-field="stream" style="width:auto" ${profile.stream ? "checked" : ""}>
        流式输出（建议开启）
      </label>
      <div class="bsb-ai-cfg-actions">
        <button type="button" class="bsb-btn primary" data-act="ai-save">保存当前 LLM</button>
      </div>
    </section>`;
  }

  function renderAiList(root) {
    const host = root?.querySelector('[data-role="ai-list"]');
    if (!host) return;
    const q = String(state.aiSearch || "").trim().toLocaleLowerCase();
    const profiles = state.aiProfiles || [];
    const filtered = q
      ? profiles.filter((p) => `${p.name}\n${p.model}\n${p.baseUrl}`.toLocaleLowerCase().includes(q))
      : profiles;
    host.innerHTML = filtered.length
      ? filtered.map(aiListItemHtml).join("")
      : `<div class="bsb-config-list-empty">${profiles.length ? "没有匹配的 LLM" : "还没有 LLM 配置"}</div>`;
  }

  function fillAiConfigForm(root) {
    if (!root) return;
    state.aiProfiles = loadAiProfiles();
    state.ai = state.aiProfiles.find((x) => x.enabled) || state.aiProfiles[0] || null;
    if (!state.aiProfiles.some((p) => p.id === state.aiEditorId)) {
      state.aiEditorId = state.aiProfiles.find((p) => p.enabled)?.id || state.aiProfiles[0]?.id || "";
    }
    const search = root.querySelector('[data-role="ai-search"]');
    if (search && search.value !== state.aiSearch) search.value = state.aiSearch;
    renderAiList(root);
    const host = root.querySelector('[data-role="ai-editor"]');
    if (!host) return;
    const index = state.aiProfiles.findIndex((p) => p.id === state.aiEditorId);
    host.innerHTML = aiEditorHtml(index >= 0 ? state.aiProfiles[index] : null, Math.max(0, index));
  }

  function readAiProfileCard(card, index) {
    const get = (key) => card.querySelector(`[data-ai-field="${key}"]`);
    return createAiProfile({
      id: card.dataset.aiProfileId || makeAiProfileId(),
      enabled: !!get("enabled")?.checked,
      name: String(get("name")?.value || `模型 ${index + 1}`),
      baseUrl: String(get("baseUrl")?.value || "").trim().replace(/\/+$/, ""),
      apiKey: String(get("apiKey")?.value || "").trim(),
      model: String(get("model")?.value || AI_DEFAULTS.model).trim(),
      temperature: Number(get("temperature")?.value),
      maxTokens: Number(get("maxTokens")?.value) || AI_DEFAULTS.maxTokens,
      stream: !!get("stream")?.checked,
    }, index);
  }

  function saveAiProfilesFromForm() {
    const root = ensurePanel();
    const profiles = state.aiProfiles?.length ? [...state.aiProfiles] : [...loadAiProfiles()];
    const editor = root.querySelector('[data-role="ai-editor"] [data-ai-profile-id]');
    if (editor) {
      const index = profiles.findIndex((x) => x.id === editor.dataset.aiProfileId);
      if (index >= 0) profiles[index] = readAiProfileCard(editor, index);
    }
    return saveAiProfiles(profiles);
  }

  function saveAiConfigFromForm() {
    const profiles = saveAiProfilesFromForm();
    return profiles.find((x) => x.enabled) || profiles[0];
  }

  function handleAiProfileAction(button) {
    const editor = button.closest?.("[data-ai-profile-id]");
    const action = button.dataset.aiProfileAct;
    if (!editor || !action) return;
    const profiles = saveAiProfilesFromForm();
    const index = profiles.findIndex((x) => x.id === editor.dataset.aiProfileId);
    if (index < 0) return;
    if (action === "duplicate") {
      const copy = createAiProfile({ ...profiles[index], id: makeAiProfileId(), name: `${profiles[index].name} 副本` }, index + 1);
      profiles.splice(index + 1, 0, copy);
      saveAiProfiles(profiles);
      state.aiEditorId = copy.id;
      fillAiConfigForm(ensurePanel());
      setStatus(`已复制配置：${copy.name}`, "ok");
    } else if (action === "delete") {
      if (profiles.length <= 1) {
        setStatus("至少保留一个模型配置", "err");
        return;
      }
      const [removed] = profiles.splice(index, 1);
      const next = profiles[Math.min(index, profiles.length - 1)] || profiles[0];
      saveAiProfiles(profiles);
      state.aiEditorId = next?.id || "";
      fillAiConfigForm(ensurePanel());
      setStatus(`已删除配置：${removed.name}`, "ok");
    }
  }

  function toggleAiPanel(forceShow) {
    const root = ensurePanel();
    // v0.7：AI 是独立全高工作区，不再挤在底部小条
    if (forceShow === false) {
      setWorkspace("subs");
      return;
    }
    setWorkspace("ai");
    if (state.ui && state.ui.h < 640) {
      state.ui.h = Math.min(860, Math.max(640, state.ui.h));
      state.ui.w = Math.max(state.ui.w, 480);
      clampUiToViewport(state.ui);
      applyPanelGeometry();
      saveUiGeom();
    }
    refreshAiChips();
    // 不在这里重绘设置表单：否则“送去 AI”会先用存储值覆盖用户刚输入的 Key / maxTokens。
  }

  function createAiRuntime(label = "AI") {
    return {
      label,
      abort: false,
      xhr: null,
      abortController: null,
    };
  }

  function createAiRun(profile, sessionId, task = null, promptProfile = null) {
    const taskId = String(task?.id || "legacy-output");
    const prompt = promptProfile ? createPromptProfile(promptProfile, 0) : null;
    return {
      ...createAiRuntime(profile.name || profile.model),
      id: `${sessionId}:${taskId}:${profile.id}`,
      profileId: profile.id,
      taskId,
      taskSnapshot: task ? { ...task, modelIds: [...(task.modelIds || [])] } : null,
      promptId: prompt?.id || String(task?.promptId || ""),
      promptName: prompt?.name || "后处理",
      promptProfile: prompt ? { ...prompt } : null,
      config: { ...profile },
      raw: "",
      status: "queued",
      statusText: "等待发送",
      busy: false,
      error: "",
      sourceBvids: [],
      startedAt: 0,
      finishedAt: 0,
      scrollTop: 0,
      stickBottom: true,
      userReading: false,
      mermaidRepairing: false,
    };
  }

  function getActiveAiRun() {
    return state.aiActiveRunId ? state.aiRuns.get(state.aiActiveRunId) || null : null;
  }

  function anyAiRunBusy() {
    return state.aiRunOrder.some((id) => state.aiRuns.get(id)?.busy);
  }

  function activeAiRunBusy() {
    return !!getActiveAiRun()?.busy;
  }

  function aggregateRunStatus(runs) {
    if (runs.some((r) => r.busy || r.status === "running")) return "running";
    if (runs.some((r) => r.status === "error")) return "error";
    if (runs.length && runs.every((r) => r.status === "done")) return "done";
    if (runs.some((r) => r.status === "stopped")) return "stopped";
    return "queued";
  }

  function taskDisplayName(task) {
    const run = state.aiRunOrder.map((id) => state.aiRuns.get(id)).find((r) => r?.taskId === task?.id);
    return run?.promptName || promptForTask(task)?.name || "未命名产物";
  }

  function currentAiWorkbenchStage() {
    return state.ui?.aiStage === "postprocess" ? "postprocess" : "preprocess";
  }

  function applyAiWorkbenchStageUi() {
    const root = document.getElementById(PANEL_ID);
    if (!root) return;
    const stage = currentAiWorkbenchStage();
    root.querySelectorAll("[data-ai-stage]").forEach((button) => {
      const active = button.dataset.aiStage === stage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    const preNav = root.querySelector('[data-role="ai-preprocess-nav"]');
    const postNav = root.querySelector('[data-role="ai-postprocess-nav"]');
    if (preNav) preNav.hidden = stage !== "preprocess";
    if (postNav) postNav.hidden = stage !== "postprocess";
    root.querySelectorAll("[data-preprocess-action]").forEach((el) => { el.hidden = stage !== "preprocess"; });
    root.querySelectorAll("[data-postprocess-action]").forEach((el) => { el.hidden = stage !== "postprocess"; });
    const label = root.querySelector('[data-role="ai-canvas-stage-label"]');
    if (label) label.textContent = stage === "preprocess" ? "预处理" : "后处理";
    root.querySelectorAll("[data-ai-preprocess-view]").forEach((button) => {
      const active = button.dataset.aiPreprocessView === state.aiInputView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function parseProcessedTimestampToken(token) {
    const match = String(token || "").match(/^\[(BV[\w]+)\s+P(\d+)\s+(\d{1,2}:\d{2}(?::\d{2})?)\]$/i);
    if (!match) return null;
    const parts = match[3].split(":").map(Number);
    const seconds = parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
    return { token: match[0], bvid: match[1], page: Number(match[2]) || 1, clock: match[3], seconds };
  }

  function processedTranscriptReadingBlocks(text) {
    const source = String(text || "").replace(/\r\n?/g, "\n").trim();
    if (!source) return [];
    const blocks = [];
    let paragraph = [];
    let topic = "";
    const flush = () => {
      const value = paragraph.join("\n").trim();
      paragraph = [];
      if (!value) return;
      blocks.push({ type: "paragraph", text: value, topic });
    };
    for (const rawLine of source.split("\n")) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();
      if (!trimmed) { flush(); continue; }
      const sourceMatch = trimmed.match(/^===\s*(.*?)\s*===$/);
      if (sourceMatch) {
        flush();
        blocks.push({ type: "source", text: sourceMatch[1].trim() });
        topic = "";
        continue;
      }
      const heading = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (heading) {
        flush();
        topic = heading[1].replace(/[*_`]+/g, "").trim();
        blocks.push({ type: "heading", text: topic });
        continue;
      }
      paragraph.push(line);
    }
    flush();
    return blocks;
  }

  function renderProcessedTranscriptCards(text) {
    const blocks = processedTranscriptReadingBlocks(text);
    if (!blocks.length) return `<pre class="bsb-main-input-preview">${escapeHtml(text)}</pre>`;
    let paragraphIndex = 0;
    let sourceCount = 0;
    let readingSource = currentKnowledgeSource();
    const timestampRe = /\[(BV[\w]+)\s+P(\d+)\s+(\d{1,2}:\d{2}(?::\d{2})?)\]/gi;
    const html = blocks.map((block) => {
      if (block.type === "source") {
        sourceCount += 1;
        const match = block.text.match(/^(BV[\w]+)(?:\s+P(\d+))?\s*(.*)$/i);
        const id = match?.[1] || "字幕";
        const page = Number(match?.[2]) || 1;
        const title = (match?.[3] || block.text).trim() || id;
        readingSource = { ...readingSource, bvid: id, page, sourceKey: knowledgeSourceKey(id, page), title };
        return `<div class="bsb-preprocess-source"><span class="bsb-preprocess-source-mark">${sourceCount}</span><span class="bsb-preprocess-source-text"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(id)}${page > 1 ? ` · P${page}` : ""} · AI 规范化稿</span></span></div>`;
      }
      if (block.type === "heading") {
        return `<div class="bsb-preprocess-section-title">${escapeHtml(block.text)}</div>`;
      }
      paragraphIndex += 1;
      const timestamps = [];
      let m;
      timestampRe.lastIndex = 0;
      while ((m = timestampRe.exec(block.text))) {
        const parsed = parseProcessedTimestampToken(m[0]);
        if (parsed) timestamps.push(parsed);
      }
      const clean = block.text.replace(timestampRe, "").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim();
      const first = timestamps[0] || null;
      const last = timestamps[timestamps.length - 1] || first;
      const timeHtml = first
        ? `<span class="bsb-preprocess-block-time"><button type="button" class="bsb-time-link" data-seconds="${first.seconds}" data-bvid="${escapeAttr(first.bvid)}" data-page="${first.page}" title="跳到这段字幕">${escapeHtml(first.clock)}</button>${last && last.clock !== first.clock ? `<span class="bsb-preprocess-time-end">→ ${escapeHtml(last.clock)}</span>` : ""}</span>`
        : "";
      const warning = /识别存疑/.test(clean) ? `<span class="bsb-preprocess-warning">△ 识别存疑</span>` : "";
      const fallbackSource = readingSource || currentKnowledgeSource();
      const kbvid = first?.bvid || fallbackSource.bvid || "";
      const kpage = first?.page || fallbackSource.page || 1;
      const kstart = first?.seconds ?? 0;
      const kend = last?.seconds ?? kstart;
      const segmentId = `seg-${kbvid || "local"}-p${kpage}-${Math.round(kstart * 10)}-${md5(clean || block.text).slice(0, 7)}`;
      const sourceKey = knowledgeSourceKey(kbvid, kpage);
      return `<article class="bsb-preprocess-block" data-preprocess-block="${paragraphIndex}" data-knowledge-segment="${escapeAttr(segmentId)}" data-knowledge-source-key="${escapeAttr(sourceKey)}" data-knowledge-bvid="${escapeAttr(kbvid)}" data-knowledge-page="${kpage}" data-knowledge-start="${kstart}" data-knowledge-end="${kend}" data-knowledge-clock="${escapeAttr(first?.clock || "")}" data-knowledge-topic="${escapeAttr(block.topic || "")}" data-knowledge-title="${escapeAttr(fallbackSource.title || "")}" data-knowledge-author="${escapeAttr(fallbackSource.author || "")}"><div class="bsb-preprocess-block-head"><span class="bsb-preprocess-block-index">${String(paragraphIndex).padStart(2, "0")}</span>${block.topic ? `<span class="bsb-preprocess-block-topic">${escapeHtml(block.topic)}</span>` : ""}${warning}${timeHtml}</div><div class="bsb-preprocess-block-body">${escapeHtml(clean || block.text)}</div></article>`;
    }).join("");
    return `<div class="bsb-preprocess-reading">${html}</div>`;
  }

  async function renderPreprocessCanvas() {
    const root = ensurePanel();
    if (state.ui) state.ui.aiStage = "preprocess";
    applyAiWorkbenchStageUi();
    const kind = state.aiInputView === "processed" ? "processed" : "raw";
    const text = currentInputPreviewText(kind);
    const processed = currentInputPreviewText("processed");
    const raw = currentInputPreviewText("raw");
    const status = root.querySelector('[data-role="ai-preprocess-status"]');
    if (status) {
      if (!raw) status.textContent = "当前视频暂无字幕";
      else if (!state.preprocessEnabled) status.textContent = "预处理已关闭";
      else if (state.preprocessRun?.busy) status.textContent = state.preprocessRun.statusText || "AI 正在处理字幕…";
      else if (processed) status.textContent = state.preprocessRun?.statusText || "AI 字幕已就绪";
      else status.textContent = "原始字幕已就绪 · 尚未生成 AI 字幕";
    }
    const meta = root.querySelector('[data-role="ai-canvas-meta"]');
    if (meta) meta.textContent = kind === "processed" ? "AI 处理字幕" : "原始字幕";
    state.renderEpoch += 1;
    state.aiViewingPreprocess = kind === "processed";
    const content = root.querySelector('[data-role="ai-content"]');
    if (!content) return;
    if (kind === "processed" && state.preprocessRun?.busy) {
      content.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">◌</div><strong>AI 正在处理字幕…</strong><span>${escapeHtml(state.preprocessRun.statusText || "正在规范化、翻译并整理字幕")}</span></div>`;
    } else if (text) {
      content.innerHTML = kind === "processed"
        ? renderProcessedTranscriptCards(text)
        : `<pre class="bsb-main-input-preview">${escapeHtml(text)}</pre>`;
      if (kind === "processed") await decorateKnowledgeAnchors(content);
    } else {
      const title = kind === "processed" ? "还没有 AI 处理字幕" : "还没有原始字幕";
      const detail = kind === "processed"
        ? (state.preprocessEnabled ? "运行处理方案后，这里会显示规范化后的简体中文字幕。" : "当前预处理已关闭，可在“处理方案”中开启。")
        : "先在字幕库抓取当前视频字幕。";
      content.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">◇</div><strong>${title}</strong><span>${detail}</span></div>`;
    }
    refreshAiChips();
    saveUiGeom();
  }

  async function renderPostprocessCanvas() {
    const root = ensurePanel();
    if (state.ui) state.ui.aiStage = "postprocess";
    applyAiWorkbenchStageUi();
    renderAiResultTabs();
    const meta = root.querySelector('[data-role="ai-canvas-meta"]');
    const activeRun = getActiveAiRun();
    if (activeRun) {
      if (meta) meta.textContent = `${activeRun.promptName || "产物"} · ${activeRun.config.name || activeRun.config.model}`;
      await selectAiRun(activeRun.id);
      return;
    }
    const tasks = currentPostTasks().filter((t) => t.enabled !== false);
    const task = tasks.find((t) => t.id === state.aiActiveTaskId) || tasks[0];
    if (task) {
      if (meta) meta.textContent = taskDisplayName(task);
      await selectAiOutputTask(task.id);
      return;
    }
    const content = root.querySelector('[data-role="ai-content"]');
    if (meta) meta.textContent = "暂无后处理产物";
    if (content) content.innerHTML = '<div class="bsb-empty"><div class="bsb-empty-ico">◇</div><strong>还没有后处理产物</strong><span>打开“处理方案”添加全 Mermaid 学习图谱或其他 POST Prompt。</span></div>';
    saveUiGeom();
  }

  async function setAiWorkbenchStage(stage, opts = {}) {
    const next = stage === "postprocess" ? "postprocess" : "preprocess";
    if (state.ui) state.ui.aiStage = next;
    applyAiWorkbenchStageUi();
    if (!opts.silent) saveUiGeom();
    if (opts.render === false) return;
    if (next === "preprocess") await renderPreprocessCanvas();
    else await renderPostprocessCanvas();
  }

  function renderAiResultTabs() {
    const root = document.getElementById(PANEL_ID);
    const outputHost = root?.querySelector('[data-role="ai-result-tabs"]');
    const modelHost = root?.querySelector('[data-role="ai-model-tabs"]');
    if (!outputHost || !modelHost) return;
    const tasks = currentPostTasks().filter((t) => t.enabled !== false);
    if (!tasks.some((t) => t.id === state.aiActiveTaskId)) state.aiActiveTaskId = tasks[0]?.id || "";
    if (!tasks.length) {
      outputHost.innerHTML = '<span class="bsb-ai-result-empty">还没有输出产物 · 打开“处理方案”添加</span>';
      modelHost.innerHTML = "";
      return;
    }

    outputHost.innerHTML = tasks.map((task) => {
      const runs = state.aiRunOrder.map((id) => state.aiRuns.get(id)).filter((r) => r?.taskId === task.id);
      const status = aggregateRunStatus(runs);
      const active = task.id === state.aiActiveTaskId ? " active" : "";
      const configuredModels = task.modelIds?.length || 0;
      return `<button type="button" class="bsb-output-tab ${escapeAttr(status)}${active}" data-ai-output-task="${escapeAttr(task.id)}" title="${escapeAttr(taskDisplayName(task))}"><span class="dot"></span><span class="name">${escapeHtml(taskDisplayName(task))}</span><span class="count">${runs.length || configuredModels}</span></button>`;
    }).join("");

    const activeTask = tasks.find((t) => t.id === state.aiActiveTaskId) || tasks[0];
    const runs = state.aiRunOrder.map((id) => state.aiRuns.get(id)).filter((r) => r?.taskId === activeTask.id);
    if (runs.length) {
      if (!runs.some((r) => r.id === state.aiActiveRunId)) {
        state.aiActiveRunId = runs[0].id;
        syncActiveRunBridge(runs[0]);
      }
      modelHost.innerHTML = runs.map((run) => {
        const active = run.id === state.aiActiveRunId ? " active" : "";
        const status = run.status || (run.busy ? "running" : "queued");
        const name = run.config.name || run.config.model;
        return `<button type="button" class="bsb-model-tab ${escapeAttr(status)}${active}" data-ai-result-id="${escapeAttr(run.id)}" title="${escapeAttr(`${run.promptName} · ${name} · ${run.statusText || status}`)}"><span class="dot"></span><span>${escapeHtml(name)}</span></button>`;
      }).join("");
    } else {
      const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
      const modelNames = (activeTask.modelIds || []).map((id) => profiles.find((p) => p.id === id)).filter(Boolean);
      modelHost.innerHTML = modelNames.length
        ? modelNames.map((p) => `<span class="bsb-model-tab queued"><span class="dot"></span><span>${escapeHtml(p.name || p.model)}</span></span>`).join("")
        : '<span class="bsb-ai-result-empty">这个产物还没有选择 LLM</span>';
    }
  }

  function flowSelectHtml(dataAttr, optionsHtml, disabled = false) {
    return `<div class="bsb-flow-select"><select ${dataAttr} ${disabled ? "disabled" : ""}>${optionsHtml}</select><span class="bsb-flow-select-icon" aria-hidden="true">⌄</span></div>`;
  }

  function flowStepperHtml(dataAttr, value, min, max, step, unit = "", disabled = false) {
    const off = disabled ? "disabled" : "";
    return `<div class="bsb-flow-stepper ${disabled ? "disabled" : ""}"><button type="button" data-flow-step="-1" ${off} aria-label="减少">−</button><div class="bsb-flow-stepper-value"><input type="number" min="${min}" max="${max}" step="${step}" value="${escapeAttr(value)}" ${dataAttr} ${off}>${unit ? `<span class="bsb-flow-stepper-unit">${escapeHtml(unit)}</span>` : ""}</div><button type="button" data-flow-step="1" ${off} aria-label="增加">＋</button></div>`;
  }

  function flowTaskCardHtml(task, index, prompts, profiles) {
    const posts = prompts.filter((p) => p.stage === "postprocess");
    const prompt = posts.find((p) => p.id === task.promptId) || posts[0] || null;
    const promptOptions = posts.map((p) => `<option value="${escapeAttr(p.id)}"${p.id === task.promptId ? " selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
    const modelPicks = profiles.map((p) => {
      const checked = (task.modelIds || []).includes(p.id);
      return `<label class="bsb-model-pick" title="${escapeAttr(p.model || p.name)}"><input type="checkbox" data-flow-task-model="${escapeAttr(p.id)}" ${checked ? "checked" : ""}> ${escapeHtml(p.name || p.model)}${p.enabled ? "" : " · 停用"}</label>`;
    }).join("");
    return `<article class="bsb-output-task-card" data-flow-task-id="${escapeAttr(task.id)}">
      <div class="bsb-output-task-head"><span class="bsb-output-task-index">${String(index + 1).padStart(2, "0")}</span><span class="bsb-output-task-name">${escapeHtml(prompt?.name || "未命名产物")}</span><button type="button" class="bsb-mini" data-flow-task-remove="${escapeAttr(task.id)}" title="移除这个产物">移除</button></div>
      <div class="bsb-flow-field"><span class="bsb-flow-label">产物 Prompt</span>${flowSelectHtml("data-flow-task-prompt", promptOptions || '<option value="">没有 POST Prompt</option>')}</div>
      <div class="bsb-flow-field" style="margin-top:9px"><span class="bsb-flow-label">LLM · 可多选</span><div class="bsb-model-picks">${modelPicks || '<span class="bsb-ai-result-empty">请先在设置 → LLM 新建模型</span>'}</div></div>
    </article>`;
  }

  function renderAiFlowDrawer() {
    const root = document.getElementById(PANEL_ID);
    const host = root?.querySelector('[data-role="ai-flow-drawer"]');
    if (!host) return;
    const prompts = state.promptProfiles?.length ? state.promptProfiles : loadPromptProfiles().prompts;
    const profiles = state.aiProfiles?.length ? state.aiProfiles : loadAiProfiles();
    const tasks = state.postTasks?.length ? state.postTasks : loadPostTasks();
    const pres = prompts.filter((p) => p.stage === "preprocess");
    const preOptions = pres.map((p) => `<option value="${escapeAttr(p.id)}"${p.id === state.activePrePromptId ? " selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
    const readyProfiles = profiles.filter((p) => p.apiKey && p.baseUrl && p.model);
    const preModelOptions = readyProfiles.map((p) => `<option value="${escapeAttr(p.id)}"${p.id === state.preprocessModelId ? " selected" : ""}>${escapeHtml(p.name || p.model)}</option>`).join("");
    host.innerHTML = `<div class="bsb-drawer-head"><div class="bsb-drawer-title"><strong>处理方案</strong><span>配置输入整理与最终要生成的产物。这里只定义流程，不展示结果。</span></div><button type="button" class="bsb-icon-btn" data-act="ai-drawer-close" aria-label="关闭">×</button></div>
      <div class="bsb-drawer-body">
        <section class="bsb-flow-section">
          <div class="bsb-flow-section-head"><div><strong>输入整理</strong><span>一次规范化，供所有产物复用</span></div><label class="bsb-flow-switch"><input type="checkbox" data-flow-preprocess-enabled ${state.preprocessEnabled ? "checked" : ""}><span class="bsb-flow-switch-track" aria-hidden="true"></span><span class="bsb-flow-switch-text">${state.preprocessEnabled ? "已开启" : "已关闭"}</span></label></div>
          <div class="bsb-flow-grid">
            <div class="bsb-flow-field"><span class="bsb-flow-label">Prompt</span>${flowSelectHtml("data-flow-preprompt", preOptions || '<option value="">没有 PRE Prompt</option>', !state.preprocessEnabled)}</div>
            <div class="bsb-flow-field"><span class="bsb-flow-label">LLM</span>${flowSelectHtml("data-flow-premodel", preModelOptions || '<option value="">没有可用 LLM</option>', !state.preprocessEnabled)}</div>
            <div class="bsb-flow-field"><span class="bsb-flow-label">全局并发</span>${flowStepperHtml("data-flow-preconcurrency", state.preprocessConcurrency, 1, 8, 1, "", !state.preprocessEnabled)}</div>
            <div class="bsb-flow-field"><span class="bsb-flow-label">目标块时长</span>${flowStepperHtml("data-flow-pretarget-minutes", state.preprocessTargetMinutes, 2, 30, 1, "分钟", !state.preprocessEnabled)}</div>
          </div>
          <details class="bsb-flow-advanced">
            <summary>高级切块设置</summary>
            <div class="bsb-flow-grid">
              <div class="bsb-flow-field"><span class="bsb-flow-label">上下文重叠</span>${flowStepperHtml("data-flow-preoverlap-seconds", state.preprocessOverlapSeconds, 0, 120, 5, "秒", !state.preprocessEnabled)}</div>
              <div class="bsb-flow-field"><span class="bsb-flow-label">单块字符硬上限</span>${flowStepperHtml("data-flow-premax-chars", state.preprocessMaxChars, 8000, 60000, 1000, "字符", !state.preprocessEnabled)}</div>
              <div class="bsb-flow-field"><span class="bsb-flow-label">失败重试</span>${flowStepperHtml("data-flow-preretries", state.preprocessRetries, 0, 4, 1, "次", !state.preprocessEnabled)}</div>
            </div>
          </details>
          <div class="bsb-preprocess-note">关闭后，各产物直接读取原始字幕。长视频按真实时间戳优先切块；单块超过字符硬上限会提前截断。Overlap 只用于跨块上下文，最终按真实时间戳确定性去重。并发是全局 Worker 数，不会乘以视频数量。</div>
        </section>
        <section class="bsb-flow-section">
          <div class="bsb-flow-section-head"><div><strong>输出产物</strong><span>${tasks.length} 个 · 每个产物独立选择 Prompt 与 LLM</span></div><button type="button" class="bsb-btn ghost" data-act="post-task-add">＋ 添加产物</button></div>
          <div data-role="flow-task-list">${tasks.map((t, i) => flowTaskCardHtml(t, i, prompts, profiles)).join("") || '<div class="bsb-input-empty">还没有产物。</div>'}</div>
        </section>
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="bsb-ai-result-empty">Prompt 与 LLM 的具体内容仍在“设置”中维护。</span><button type="button" class="bsb-btn" data-act="ai-reprocess" ${state.preprocessEnabled ? "" : "disabled"}>重做输入整理</button></div>
      </div>`;
  }

  function currentInputPreviewText(kind) {
    const input = state.aiSessionInput;
    if (kind === "processed") return String(input?.vars?.processedSubtitle || state.preprocessRun?.text || "");
    if (input?.vars?.rawSubtitle) return String(input.vars.rawSubtitle);
    const routeKey = currentRouteVideoKey();
    const current = routeKey
      ? (state.items.find((it) => routeVideoKey(it.bvid, it.page || 1) === routeKey)
        || (routeVideoKey(state.transcriptItem?.bvid, state.transcriptItem?.page || 1) === routeKey ? state.transcriptItem : null))
      : null;
    if (current?.subStatus === "ok" && current.data?.length) return buildSubtitlePayload([current]);
    const ready = selectedItems().filter((it) => it.subStatus === "ok" && it.data?.length);
    return ready.length ? buildSubtitlePayload(ready) : "";
  }

  function renderAiInputDrawer() {
    const root = document.getElementById(PANEL_ID);
    const host = root?.querySelector('[data-role="ai-input-drawer"]');
    if (!host) return;
    const raw = currentInputPreviewText("raw");
    const processed = currentInputPreviewText("processed");
    if (state.aiInputView === "processed" && !processed && raw) state.aiInputView = "raw";
    const text = state.aiInputView === "processed" ? processed : raw;
    const preLabel = state.preprocessEnabled ? (processed ? "已规范化" : "等待规范化") : "预处理关闭";
    host.innerHTML = `<div class="bsb-drawer-head"><div class="bsb-drawer-title"><strong>输入</strong><span>${escapeHtml(preLabel)} · 这里用于核查 AI 真正读取的材料</span></div><button type="button" class="bsb-icon-btn" data-act="ai-drawer-close" aria-label="关闭">×</button></div>
      <div class="bsb-drawer-body">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div class="bsb-input-tabs"><button type="button" data-input-view="raw" class="${state.aiInputView === "raw" ? "active" : ""}">原始字幕</button><button type="button" data-input-view="processed" class="${state.aiInputView === "processed" ? "active" : ""}" ${processed ? "" : "disabled"}>规范化稿</button></div><button type="button" class="bsb-mini" data-act="ai-copy-input">复制当前输入</button></div>
        ${text ? `<pre class="bsb-input-preview">${escapeHtml(text)}</pre>` : '<div class="bsb-input-empty">当前没有可查看的输入。先在字幕库选择有字幕的视频，或运行一次处理方案。</div>'}
      </div>`;
  }

  function setAiDrawer(kind = "") {
    const root = document.getElementById(PANEL_ID);
    if (!root) return;
    state.aiDrawer = ["flow", "input"].includes(kind) ? kind : "";
    const flow = root.querySelector('[data-role="ai-flow-drawer"]');
    const input = root.querySelector('[data-role="ai-input-drawer"]');
    const backdrop = root.querySelector('[data-role="ai-drawer-backdrop"]');
    if (state.aiDrawer === "flow") renderAiFlowDrawer();
    if (state.aiDrawer === "input") renderAiInputDrawer();
    flow?.classList.toggle("open", state.aiDrawer === "flow");
    input?.classList.toggle("open", state.aiDrawer === "input");
    flow?.setAttribute("aria-hidden", state.aiDrawer === "flow" ? "false" : "true");
    input?.setAttribute("aria-hidden", state.aiDrawer === "input" ? "false" : "true");
    if (backdrop) backdrop.hidden = !state.aiDrawer;
  }

  async function selectAiOutputTask(taskId) {
    if (state.ui) state.ui.aiStage = "postprocess";
    applyAiWorkbenchStageUi();
    const task = currentPostTasks().find((t) => t.id === String(taskId || ""));
    if (!task) return;
    state.aiActiveTaskId = task.id;
    const runs = state.aiRunOrder.map((id) => state.aiRuns.get(id)).filter((r) => r?.taskId === task.id);
    renderAiResultTabs();
    if (runs.length) await selectAiRun(runs[0].id);
    else {
      const root = ensurePanel();
      const content = root.querySelector('[data-role="ai-content"]');
      if (content) content.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">◇</div><strong>${escapeHtml(taskDisplayName(task))}</strong><span>这个产物还没有运行结果。点击“运行全部”按照当前处理方案生成。</span></div>`;
    }
  }

  function syncActiveRunBridge(run) {
    state.aiRaw = run?.raw || "";
    state.aiSourceBvids = run?.sourceBvids || [];
    state.ai = run?.config || state.ai;
  }

  async function selectAiRun(runId) {
    if (state.ui) state.ui.aiStage = "postprocess";
    applyAiWorkbenchStageUi();
    const run = state.aiRuns.get(String(runId || ""));
    if (!run) return;
    state.aiViewingPreprocess = false;
    if (run.taskId) state.aiActiveTaskId = run.taskId;
    const root = ensurePanel();
    const box = root.querySelector('[data-role="ai-md"]');
    const previous = getActiveAiRun();
    if (previous && box) {
      previous.scrollTop = box.scrollTop;
      previous.stickBottom = state.aiStickBottom;
      previous.userReading = state.aiUserReading;
    }
    state.aiActiveRunId = run.id;
    // 使上一个标签仍在进行的 marked/Mermaid 异步渲染立即失效，避免覆盖新标签。
    state.renderEpoch += 1;
    syncActiveRunBridge(run);
    state.aiRenderedText = "";
    state.aiPendingText = run.raw || "";
    state.aiStreamTextNode = null;
    state.aiStickBottom = run.busy ? run.stickBottom !== false : false;
    state.aiUserReading = run.busy ? !!run.userReading : true;
    renderAiResultTabs();
    refreshAiChips();
    setAiBusy(anyAiRunBusy());

    const content = root.querySelector('[data-role="ai-content"]');
    if (run.busy) {
      if (content && !run.raw) {
        content.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">◌</div><strong>${escapeHtml(run.config.name || run.config.model)} 正在生成…</strong><span>${escapeHtml(run.statusText || "正在连接模型")}</span></div>`;
      }
      paintAiStreamText(run.raw || "正在等待模型返回…");
      requestAnimationFrame(() => scrollAiToBottom(true));
    } else if (run.raw) {
      await renderAiMarkdown(run.raw, { streaming: false });
      if (box) box.scrollTop = Math.max(0, Number(run.scrollTop) || 0);
    } else if (content) {
      content.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">${run.status === "error" ? "!" : "◌"}</div><strong>${escapeHtml(run.config.name || run.config.model)}</strong><span>${escapeHtml(run.error || run.statusText || "暂无输出")}</span></div>`;
    }
    setStatus(`${run.promptName || "产物"} · ${run.config.name || run.config.model} · ${run.statusText || run.status}`, run.status === "error" ? "err" : run.status === "done" ? "ok" : undefined);
  }

  function abortAiRun(run) {
    if (!run) return;
    run.abort = true;
    try { run.abortController?.abort(); } catch (_) { /* noop */ }
    try { if (run.xhr && typeof run.xhr.abort === "function") run.xhr.abort(); } catch (_) { /* noop */ }
  }

  function abortAllAiRuns() {
    state.aiRunOrder.forEach((id) => abortAiRun(state.aiRuns.get(id)));
    if (state.preprocessRun?.runtime) {
      state.preprocessRun.runtime.abort = true;
      try { state.preprocessRun.runtime.abortController?.abort(); } catch (_) { /* noop */ }
      try { state.preprocessRun.runtime.xhr?.abort?.(); } catch (_) { /* noop */ }
      for (const child of state.preprocessRun.childRuntimes || []) abortPreprocessChildRuntime(child);
    }
  }

  function latestAiConfigForRun(run) {
    let profiles = [];
    try {
      profiles = saveAiProfilesFromForm();
    } catch (_) {
      profiles = loadAiProfiles();
    }
    const latest = profiles.find((profile) => profile.id === run?.profileId);
    return createAiProfile(latest || run?.config || AI_DEFAULTS, 0);
  }

  function validateAiRunConfigs(configs) {
    const invalid = (configs || []).filter((cfg) => !cfg?.apiKey || !cfg?.baseUrl || !cfg?.model);
    if (!invalid.length) return true;
    setStatus(`以下模型配置不完整：${invalid.map((cfg) => cfg?.name || cfg?.model || "未命名模型").join("、")}`, "err");
    return false;
  }

  function cloneAiSessionInput(input, sessionId) {
    if (!input?.vars?.subtitle) return null;
    return {
      sessionId: Number(sessionId ?? input.sessionId),
      vars: { ...input.vars },
      promptProfile: input.promptProfile ? { ...input.promptProfile } : null, // legacy
      taskSnapshots: Array.isArray(input.taskSnapshots) ? input.taskSnapshots.map((x) => ({ task: x.task ? { ...x.task, modelIds: [...(x.task.modelIds || [])] } : null, prompt: x.prompt ? { ...x.prompt } : null })) : [],
      preprocessPrompt: input.preprocessPrompt ? { ...input.preprocessPrompt } : null,
      preprocessConfig: input.preprocessConfig ? { ...input.preprocessConfig } : null,
      preprocessEnabled: !!input.preprocessEnabled,
      commonMeta: {
        ...(input.commonMeta || {}),
        sourceBvids: [...(input.commonMeta?.sourceBvids || [])],
      },
    };
  }

  function summarizeAiRuns(prefix = "全部产物生成结束") {
    setAiBusy(anyAiRunBusy());
    if (anyAiRunBusy()) return;
    const runs = state.aiRunOrder.map((id) => state.aiRuns.get(id)).filter(Boolean);
    if (!runs.length) return;
    const done = runs.filter((run) => run.status === "done").length;
    const failed = runs.filter((run) => run.status === "error").length;
    const stopped = runs.filter((run) => run.status === "stopped").length;
    setStatus(`${prefix} · 成功 ${done} · 失败 ${failed} · 停止 ${stopped}`, failed ? "err" : "ok");
  }

  async function regenerateActiveAiRun() {
    const oldRun = getActiveAiRun();
    const input = cloneAiSessionInput(state.aiSessionInput);
    if (!oldRun || !input) {
      setStatus("当前没有可重新生成的模型结果，请先完成一次分析", "err");
      return;
    }
    if (oldRun.busy) {
      const restart = typeof pageWindow.confirm === "function"
        ? pageWindow.confirm(`“${oldRun.config.name || oldRun.config.model}”仍在生成。是否只停止该模型并重新生成？`)
        : false;
      if (!restart) return;
    }

    const config = latestAiConfigForRun(oldRun);
    if (!validateAiRunConfigs([config])) return;

    const runId = oldRun.id;
    abortAiRun(oldRun);
    const replacement = createAiRun(config, input.sessionId, oldRun.taskSnapshot, oldRun.promptProfile);
    // 保持结果身份和排列位置不变；只替换该产物的当前模型运行实例与输出。
    replacement.id = runId;
    replacement.profileId = oldRun.profileId;
    replacement.sourceBvids = [...(input.commonMeta.sourceBvids || [])];
    state.aiRuns.set(runId, replacement);
    state.aiActiveRunId = runId;
    syncActiveRunBridge(replacement);
    renderAiResultTabs();
    await selectAiRun(runId);
    setStatus(`${replacement.promptName} · ${config.name || config.model} · 仅重新生成当前版本 · 复用现有${input.preprocessEnabled ? "规范化稿" : "原始字幕"}`);

    await runAiProfile(replacement, input.vars, replacement.promptProfile, input.commonMeta);
    summarizeAiRuns("当前模型重新生成结束");
  }

  async function regenerateAllAiRuns() {
    const input = cloneAiSessionInput(state.aiSessionInput);
    const oldRuns = state.aiRunOrder.map((id) => state.aiRuns.get(id)).filter(Boolean);
    if (!input || !oldRuns.length) {
      setStatus("当前没有可重新生成的批次，请先完成一次分析", "err");
      return;
    }
    if (anyAiRunBusy()) {
      const restart = typeof pageWindow.confirm === "function"
        ? pageWindow.confirm("仍有模型正在生成。是否停止所有当前请求并重新生成全部模型？")
        : false;
      if (!restart) return;
    }

    const runSpecs = oldRuns.map((run) => ({ old: run, config: latestAiConfigForRun(run) }));
    if (!validateAiRunConfigs(runSpecs.map((x) => x.config))) return;
    const activeOld = getActiveAiRun();

    state.aiAbort = true;
    abortAllAiRuns();
    const sessionId = ++state.aiSessionSeq;
    state.aiAbort = false;
    state.aiRuns = new Map();
    state.aiRunOrder = [];
    for (const spec of runSpecs) {
      const run = createAiRun(spec.config, sessionId, spec.old.taskSnapshot, spec.old.promptProfile);
      state.aiRuns.set(run.id, run);
      state.aiRunOrder.push(run.id);
    }
    state.aiActiveRunId = state.aiRunOrder.find((id) => {
      const run = state.aiRuns.get(id);
      return run?.profileId === activeOld?.profileId && run?.taskId === activeOld?.taskId;
    }) || state.aiRunOrder[0] || "";
    state.aiActiveTaskId = getActiveAiRun()?.taskId || state.aiActiveTaskId;
    state.aiSessionInput = cloneAiSessionInput(input, sessionId);
    syncActiveRunBridge(getActiveAiRun());
    renderAiResultTabs();
    setAiBusy(true);
    if (state.aiActiveRunId) await selectAiRun(state.aiActiveRunId);
    setStatus(`正在重新生成全部 ${state.aiRunOrder.length} 个产物版本 · 不重复运行输入整理…`);

    await Promise.allSettled(state.aiRunOrder.map((id) => {
      const run = state.aiRuns.get(id);
      return runAiProfile(run, state.aiSessionInput.vars, run.promptProfile, state.aiSessionInput.commonMeta);
    }));
    if (sessionId === state.aiSessionSeq) summarizeAiRuns("全部模型重新生成结束");
  }

  function setAiBusy(busy) {
    const anyBusy = busy == null ? anyAiRunBusy() : !!busy;
    state.aiBusy = anyBusy;
    const root = ensurePanel();
    root.classList.toggle("ai-busy", anyBusy);
    root.querySelectorAll('[data-act="ai-stop"]').forEach((b) => {
      b.style.display = anyBusy ? "" : "none";
    });
    refreshActionDisabledState();
    const stream = root.querySelector('[data-role="ai-stream"]');
    if (stream) stream.classList.toggle("streaming", activeAiRunBusy());
    renderAiResultTabs();
  }

  function updateJumpLatestBtn() {
    const root = document.getElementById(PANEL_ID);
    if (!root) return;
    const jump = root.querySelector('[data-act="ai-jump"]');
    const stickBtn = root.querySelector('[data-act="ai-stick"]');
    // 粘底按钮：仅在真正跟随中亮
    if (stickBtn) {
      stickBtn.classList.toggle(
        "on",
        !!state.aiStickBottom && !state.aiUserReading,
      );
    }
    if (!jump) return;
    // 用户阅读锁 或 未跟随时显示「↓ 最新」
    const show =
      (!state.aiStickBottom || state.aiUserReading) &&
      !!(state.aiRaw || activeAiRunBusy());
    jump.classList.toggle("show", show);
  }

  function applyAiScrollResolved(r) {
    state.aiStickBottom = r.stick;
    state.aiUserReading = r.userReading;
    updateJumpLatestBtn();
  }

  /** 用户主动离开底部：进入阅读锁，后续 paint 绝对不改 scrollTop */
  function detachAiFollow(_reason) {
    applyAiScrollResolved(
      resolveAiScrollState(
        {
          stick: state.aiStickBottom,
          userReading: state.aiUserReading,
          progScroll: state.aiProgScroll,
        },
        { type: "detach" },
      ),
    );
  }

  /** 仅按钮/开始分析：恢复跟随并滚到底 */
  function resumeAiFollow() {
    applyAiScrollResolved(
      resolveAiScrollState(
        {
          stick: state.aiStickBottom,
          userReading: state.aiUserReading,
          progScroll: false,
        },
        { type: "resume" },
      ),
    );
    scrollAiToBottom(true);
  }

  /**
   * v0.8.4 自由滚动硬模型（修「永远滚不动」）：
   *
   * 旧 bug：scroll 事件在距底 <80px 时自动 stick=true → 流式 paint 下一帧拽回底部。
   * 用户刚上滑几像素就被重新粘底，体感永远「在原地」。
   *
   * 新规则：
   * 1) 跟随只由：开始分析 / 「粘底」开 / 「↓ 最新」打开
   * 2) 任意向上 wheel / 上滑 touch / PageUp → 立即 detach，加阅读锁
   * 3) 程序化 scrollTop 带 aiProgScroll 标记，scroll 监听忽略
   * 4) 阅读锁期间 paint **完全不碰** scrollTop
   * 5) 用户自己滚到真正贴底（gap<=12）才解除阅读锁并恢复跟随
   */
  function bindAiScrollBehavior(root) {
    const box = root.querySelector('[data-role="ai-md"]');
    if (!box || box.dataset.bsbScrollBound === "1") return;
    box.dataset.bsbScrollBound = "1";

    const onLeaveBottom = () => {
      if (state.aiUserReading && !state.aiStickBottom) {
        updateJumpLatestBtn();
        return;
      }
      detachAiFollow("gesture");
    };

    // 捕获：向上意图优先于任何 paint
    box.addEventListener(
      "wheel",
      (e) => {
        if (e.deltaY < 0) onLeaveBottom();
      },
      { passive: true, capture: true },
    );
    // 触控板/手指：touchmove 向上
    box.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches && e.touches[0];
        box._bsbTouchY = t ? t.clientY : null;
      },
      { passive: true, capture: true },
    );
    box.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches && e.touches[0];
        if (!t || box._bsbTouchY == null) return;
        if (t.clientY - box._bsbTouchY > 8) onLeaveBottom();
        box._bsbTouchY = t.clientY;
      },
      { passive: true, capture: true },
    );
    box.addEventListener(
      "pointerdown",
      () => {
        box._bsbPtrY = null;
      },
      { passive: true },
    );
    box.addEventListener(
      "pointermove",
      (e) => {
        if (e.buttons === 0 && e.pointerType === "mouse") return;
        if (box._bsbPtrY != null && e.clientY - box._bsbPtrY > 8) {
          onLeaveBottom();
        }
        box._bsbPtrY = e.clientY;
      },
      { passive: true },
    );
    box.addEventListener(
      "keydown",
      (e) => {
        if (
          e.key === "ArrowUp" ||
          e.key === "PageUp" ||
          e.key === "Home"
        ) {
          onLeaveBottom();
        }
      },
      true,
    );

    box.addEventListener(
      "scroll",
      () => {
        const gap = box.scrollHeight - box.scrollTop - box.clientHeight;
        const r = resolveAiScrollState(
          {
            stick: state.aiStickBottom,
            userReading: state.aiUserReading,
            progScroll: state.aiProgScroll,
          },
          { type: "scroll", gap },
        );
        applyAiScrollResolved(r);
      },
      { passive: true },
    );
  }

  function scrollAiToBottom(force) {
    if (!force && (!state.aiStickBottom || state.aiUserReading)) {
      updateJumpLatestBtn();
      return;
    }
    const box = document.querySelector(`#${PANEL_ID} [data-role="ai-md"]`);
    if (!box) return;
    state.aiProgScroll = true;
    box.scrollTop = box.scrollHeight;
    requestAnimationFrame(() => {
      box.scrollTop = box.scrollHeight;
      // 再等一帧清标记，吞掉浏览器延迟的 scroll 事件
      requestAnimationFrame(() => {
        state.aiProgScroll = false;
        updateJumpLatestBtn();
      });
    });
  }

  function scrollAiToTop() {
    const box = document.querySelector(`#${PANEL_ID} [data-role="ai-md"]`);
    if (box) {
      state.aiProgScroll = true;
      box.scrollTop = 0;
      requestAnimationFrame(() => {
        state.aiProgScroll = false;
      });
    }
    detachAiFollow("top");
  }

  /** 流式绘制：只更新 text；非跟随模式零碰 scrollTop */
  function paintAiStreamText(full) {
    state.aiPendingText = String(full || "");
    if (state.aiPaintRaf || state.aiPaintTimer) return;

    const run = () => {
      state.aiPaintTimer = 0;
      state.aiPaintRaf = requestAnimationFrame(() => {
        state.aiPaintRaf = 0;
        const root = ensurePanel();
        const box = root.querySelector('[data-role="ai-md"]');
        const content = root.querySelector('[data-role="ai-content"]') || box;
        if (!box || !content) return;
        const text = state.aiPendingText || "…";
        let pre = content.querySelector(".bsb-ai-stream-body");
        let caret = content.querySelector(".bsb-ai-caret");
        if (!pre) {
          content.replaceChildren();
          pre = document.createElement("pre");
          pre.className = "bsb-ai-stream-body";
          state.aiStreamTextNode = document.createTextNode("");
          pre.appendChild(state.aiStreamTextNode);
          content.appendChild(pre);
          state.aiRenderedText = "";
        }
        if (!state.aiStreamTextNode || state.aiStreamTextNode.parentNode !== pre) {
          state.aiStreamTextNode = pre.firstChild || pre.appendChild(document.createTextNode(""));
          state.aiRenderedText = state.aiStreamTextNode.data || "";
        }
        if (activeAiRunBusy() && !caret) {
          caret = document.createElement("span");
          caret.className = "bsb-ai-caret";
          caret.setAttribute("aria-hidden", "true");
          content.appendChild(caret);
        } else if (!activeAiRunBusy() && caret) caret.remove();

        const follow = resolveAiScrollState(
          { stick: state.aiStickBottom, userReading: state.aiUserReading, progScroll: false },
          { type: "paint" },
        ).allowPaintScroll;
        const freezeTop = box.scrollTop;

        // 追加尾部而不是每个 token 重写整段文本，避免累计 O(n²) DOM 写入。
        if (text.startsWith(state.aiRenderedText)) {
          state.aiStreamTextNode.appendData(text.slice(state.aiRenderedText.length));
        } else {
          state.aiStreamTextNode.data = text;
        }
        state.aiRenderedText = text;

        if (follow) {
          state.aiProgScroll = true;
          box.scrollTop = box.scrollHeight;
          requestAnimationFrame(() => { state.aiProgScroll = false; });
        } else if (box.scrollTop !== freezeTop && freezeTop > 0) {
          state.aiProgScroll = true;
          box.scrollTop = freezeTop;
          requestAnimationFrame(() => { state.aiProgScroll = false; });
        }
        updateJumpLatestBtn();
      });
    };
    state.aiPaintTimer = window.setTimeout(run, STREAM_PAINT_INTERVAL_MS);
  }

  function buildSubtitlePayload(items) {
    return items
      .map((it) => {
        const head = `=== ${it.bvid}${it.page > 1 ? " P" + it.page : ""} ${it.title || ""} ===`;
        return `${head}\n${cuesToAiText(it.data || [], it.bvid, it.page || 1)}`;
      })
      .join("\n\n");
  }

  function loadScriptOnce(src, globalCheck) {
    return new Promise((resolve, reject) => {
      if (globalCheck && globalCheck()) return resolve();
      const existed = document.querySelector(`script[data-bsb-src="${src}"]`);
      if (existed) {
        if (globalCheck && globalCheck()) return resolve();
        existed.addEventListener("load", () => resolve(), { once: true });
        existed.addEventListener("error", () => reject(new Error("load " + src)), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = src; s.async = true; s.dataset.bsbSrc = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("failed to load " + src));
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function loadCssOnce(href) {
    if (document.querySelector(`link[data-bsb-href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href; l.dataset.bsbHref = href;
    (document.head || document.documentElement).appendChild(l);
  }

  async function ensureMarkdownCore() {
    if (state.renderLibs.core) return;
    await Promise.all([
      loadScriptOnce("https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js", () => typeof marked !== "undefined"),
      loadScriptOnce("https://cdn.jsdelivr.net/npm/dompurify@3.4.12/dist/purify.min.js", () => typeof DOMPurify !== "undefined"),
    ]);
    if (typeof marked !== "undefined") {
      marked.setOptions({ gfm: true, breaks: true, mangle: false, headerIds: false });
    }
    state.renderLibs.core = true;
  }

  async function ensureHighlight() {
    if (state.renderLibs.highlight) return;
    loadCssOnce("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css");
    await loadScriptOnce("https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js", () => typeof hljs !== "undefined");
    state.renderLibs.highlight = true;
  }

  async function ensureKatex() {
    if (state.renderLibs.katex) return;
    loadCssOnce("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css");
    await loadScriptOnce("https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js", () => typeof katex !== "undefined");
    state.renderLibs.katex = true;
  }

  async function ensureMermaid() {
    if (state.renderLibs.mermaid) return;
    await loadScriptOnce("https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js", () => typeof mermaid !== "undefined");
    if (typeof mermaid !== "undefined") {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "strict",
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
        suppressErrorRendering: true,
        deterministicIds: false,
        themeVariables: {
          darkMode: true,
          background: "#181825",
          primaryColor: "#313244",
          primaryTextColor: "#f5e0dc",
          primaryBorderColor: "#89b4fa",
          secondaryColor: "#45475a",
          secondaryTextColor: "#cdd6f4",
          secondaryBorderColor: "#a6e3a1",
          tertiaryColor: "#1e1e2e",
          tertiaryTextColor: "#cdd6f4",
          tertiaryBorderColor: "#cba6f7",
          lineColor: "#bac2de",
          textColor: "#cdd6f4",
          mainBkg: "#313244",
          nodeBorder: "#89b4fa",
          clusterBkg: "#1e1e2e",
          clusterBorder: "#585b70",
          edgeLabelBackground: "#181825",
          actorBkg: "#313244",
          actorBorder: "#89b4fa",
          actorTextColor: "#f5e0dc",
          signalColor: "#bac2de",
          signalTextColor: "#cdd6f4",
          labelBoxBkgColor: "#313244",
          labelBoxBorderColor: "#89b4fa",
          labelTextColor: "#f5e0dc",
          loopTextColor: "#cdd6f4",
          noteBkgColor: "#45475a",
          noteBorderColor: "#f9e2af",
          noteTextColor: "#f5e0dc",
          fontSize: "16px",
        },
        themeCSS: `
          .nodeLabel, .edgeLabel, .label, text { font-size: 16px !important; }
          .edgeLabel rect { fill: #181825 !important; opacity: .96 !important; }
          .flowchart-link { stroke-width: 2px !important; }
          .marker { fill: #bac2de !important; stroke: #bac2de !important; }
          .cluster rect { rx: 10px; ry: 10px; }
        `,
        flowchart: {
          htmlLabels: false,
          useMaxWidth: false,
          curve: "basis",
          nodeSpacing: 48,
          rankSpacing: 64,
          padding: 16,
        },
        sequence: {
          useMaxWidth: false,
          wrap: true,
          diagramMarginX: 32,
          diagramMarginY: 24,
          actorMargin: 72,
          width: 180,
          height: 72,
          boxMargin: 12,
          messageMargin: 42,
        },
      });
    }
    state.renderLibs.mermaid = true;
  }

  function hasMathSyntax(md) {
    return /```(?:math|latex|tex)|\$\$[\s\S]+?\$\$|\\\[|\\\(|\$[^\n$]+\$/.test(md);
  }

  function hasCodeSyntax(md) {
    return /```(?!mermaid|math|latex|tex)[^\n]*\n/i.test(md);
  }

  function hasMermaidSyntax(md) {
    return /```mermaid\s*\n/i.test(md);
  }

  async function yieldToMain() {
    if (globalThis.scheduler && typeof globalThis.scheduler.yield === "function") {
      await globalThis.scheduler.yield();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  /** KaTeX → HTML；失败返回 null 走 fallback */
  function katexToHtml(tex, display) {
    if (typeof katex === "undefined" || !katex.renderToString) return null;
    try {
      const html = katex.renderToString(String(tex || ""), {
        displayMode: !!display, throwOnError: false, strict: "ignore", trust: false, output: "html",
      });
      return display ? `<div class="bsb-katex-display">${html}</div>` : `<span class="bsb-katex-inline">${html}</span>`;
    } catch (_) { return null; }
  }

  function simpleMarkdownFallback(md) {
    let html = escapeHtml(md);
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><span class="bsb-code-lang">${escapeHtml(lang || "text")}</span><code>${escapeHtml(code)}</code></pre>`);
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\n\n/g, "</p><p>");
    return `<p>${html}</p>`;
  }

  function sanitizeRenderedHtml(html) {
    if (typeof DOMPurify === "undefined") return simpleMarkdownFallback(stripHtml(html));
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      SANITIZE_NAMED_PROPS: true,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
      ADD_ATTR: ["target", "rel", "aria-label", "data-bsb-m"],
    });
  }

  async function replaceHostInBatches(host, html, epoch) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const nodes = Array.from(tpl.content.childNodes);
    host.replaceChildren();
    for (let i = 0; i < nodes.length; i += RENDER_BATCH_SIZE) {
      if (epoch !== state.renderEpoch) return false;
      const frag = document.createDocumentFragment();
      nodes.slice(i, i + RENDER_BATCH_SIZE).forEach((node) => frag.appendChild(node));
      host.appendChild(frag);
      if (i + RENDER_BATCH_SIZE < nodes.length) await yieldToMain();
    }
    return true;
  }

  function linkifyTimestamps(host) {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const p = walker.currentNode.parentElement;
      if (!p || p.closest("pre,code,a,button,.katex,.mermaid,.bsb-toc")) continue;
      if (/\[(?:BV[\w]+\s+)?(?:P\d+\s+)?(?:\d{1,2}:)?\d{1,2}:\d{2}\]/i.test(walker.currentNode.data)) nodes.push(walker.currentNode);
    }
    const re = /\[((BV[\w]+)\s+)?(?:P(\d+)\s+)?((?:\d{1,2}:)?\d{1,2}:\d{2})\]/gi;
    for (const node of nodes) {
      const text = node.data; let last = 0; let m; const frag = document.createDocumentFragment();
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const parts = m[4].split(":").map(Number);
        const sec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
        const btn = document.createElement("button");
        btn.type = "button"; btn.className = "bsb-time-link";
        btn.dataset.seconds = String(sec); btn.dataset.bvid = m[2] || ""; btn.dataset.page = m[3] || "1";
        btn.textContent = m[0]; btn.title = "跳到视频对应时间";
        frag.appendChild(btn); last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.replaceWith(frag);
    }
  }

  function seekToVideoTimestamp(seconds, bvid, page) {
    if (!Number.isFinite(seconds)) return;
    const currentBvid = extractBvid(location.href);
    let currentPage = 1;
    try { currentPage = Math.max(1, Number(new URL(location.href).searchParams.get("p")) || 1); } catch (_) { /* ignore */ }
    const targetPage = Math.max(1, Number(page) || 1);
    const sameVideo = !bvid || !currentBvid || bvid.toLowerCase() === currentBvid.toLowerCase();
    const video = document.querySelector("video");
    if (video && sameVideo && currentPage === targetPage) {
      video.currentTime = Math.max(0, seconds);
      if (video.paused) video.play().catch(() => {});
      video.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (bvid) {
      const u = new URL(`https://www.bilibili.com/video/${bvid}`);
      u.searchParams.set("p", String(targetPage));
      u.searchParams.set("t", String(Math.floor(seconds)));
      window.open(u.toString(), "_blank", "noopener");
    }
  }

  function buildToc(host) {
    const headings = Array.from(host.querySelectorAll("h1,h2,h3")).filter((h) => !h.closest(".bsb-toc"));
    if (headings.length < 2) return;
    const details = document.createElement("details"); details.className = "bsb-toc"; details.open = true;
    const summary = document.createElement("summary"); summary.textContent = `本页目录 · ${headings.length}`;
    const nav = document.createElement("nav");
    headings.forEach((h, i) => {
      h.id = `bsb-note-h-${state.renderEpoch}-${i}`;
      const b = document.createElement("button"); b.type = "button"; b.dataset.level = h.tagName.slice(1);
      b.textContent = h.textContent.trim() || `章节 ${i + 1}`;
      b.addEventListener("click", () => h.scrollIntoView({ behavior: "smooth", block: "start" }));
      nav.appendChild(b);
    });
    details.append(summary, nav); host.prepend(details);
  }

  async function enhanceCodeBlocks(host, epoch) {
    const blocks = Array.from(host.querySelectorAll("pre code"));
    if (!blocks.length) return;
    try { await ensureHighlight(); } catch (e) { console.warn("[bili-subbatch] highlight load", e); return; }
    for (let i = 0; i < blocks.length; i++) {
      if (epoch !== state.renderEpoch) return;
      const block = blocks[i]; const pre = block.parentElement;
      const m = (block.className || "").match(/language-([\w#+-]+)/i);
      if (m && pre && !pre.querySelector(".bsb-code-lang")) {
        const tag = document.createElement("span"); tag.className = "bsb-code-lang"; tag.textContent = m[1]; pre.insertBefore(tag, block);
      }
      try { if (typeof hljs !== "undefined") hljs.highlightElement(block); } catch (_) { /* unknown language */ }
      if (i % 5 === 4) await yieldToMain();
    }
  }

  function parseMermaidViewBox(svg) {
    const raw = String(svg?.getAttribute("viewBox") || "").trim();
    const values = raw.split(/[\s,]+/).map(Number);
    if (values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0) {
      return { x: values[0], y: values[1], width: values[2], height: values[3] };
    }
    const width = Number.parseFloat(svg?.getAttribute("width")) || 960;
    const height = Number.parseFloat(svg?.getAttribute("height")) || 540;
    return { x: 0, y: 0, width, height };
  }

  function getMermaidScale(card) {
    const scale = Number(card?.dataset?.scale);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  function updateMermaidScaleLabel(card) {
    const label = card?.querySelector(".bsb-mermaid-scale");
    if (label) label.textContent = `${Math.round(getMermaidScale(card) * 100)}%`;
  }

  function setMermaidScale(card, scale, mode = "manual") {
    if (!card) return;
    const stage = card.querySelector(".bsb-mermaid-stage");
    if (!stage) return;
    const baseWidth = Number(stage.dataset.baseWidth) || 760;
    const next = Math.max(0.35, Math.min(3, Number(scale) || 1));
    card.dataset.scale = String(next);
    card.dataset.fit = mode;
    stage.style.setProperty("--bsb-mermaid-width", `${Math.max(240, Math.round(baseWidth * next))}px`);
    updateMermaidScaleLabel(card);
  }

  function fitMermaidToViewport(card) {
    const viewport = card?.querySelector(".bsb-mermaid-viewport");
    const stage = card?.querySelector(".bsb-mermaid-stage");
    if (!viewport || !stage) return;
    const baseWidth = Number(stage.dataset.baseWidth) || 760;
    const available = Math.max(240, viewport.clientWidth - 36);
    setMermaidScale(card, Math.min(1.5, available / baseWidth), "fit");
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }

  function closeMermaidFullscreen() {
    const root = document.getElementById(PANEL_ID);
    const modal = root?.querySelector(".bsb-mermaid-modal");
    if (!modal) return;
    const card = modal.querySelector(".bsb-mermaid-card");
    const placeholder = card?._bsbMermaidPlaceholder;
    if (card && placeholder?.parentNode) {
      card.classList.remove("is-fullscreen");
      placeholder.replaceWith(card);
      card._bsbMermaidPlaceholder = null;
      const full = card.querySelector('[data-mmd-act="fullscreen"]');
      if (full) { full.textContent = "全屏"; full.title = "全屏查看"; }
    }
    modal.remove();
  }

  function openMermaidFullscreen(card) {
    if (!card || card.closest(".bsb-mermaid-modal")) return;
    closeMermaidFullscreen();
    const root = document.getElementById(PANEL_ID);
    if (!root) return;
    const placeholder = document.createComment("bsb-mermaid-placeholder");
    card.before(placeholder);
    card._bsbMermaidPlaceholder = placeholder;
    const modal = document.createElement("div");
    modal.className = "bsb-mermaid-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Mermaid 图表全屏查看");
    modal.addEventListener("click", (e) => { if (e.target === modal) closeMermaidFullscreen(); });
    card.classList.add("is-fullscreen");
    const full = card.querySelector('[data-mmd-act="fullscreen"]');
    if (full) { full.textContent = "退出"; full.title = "退出全屏"; }
    modal.appendChild(card);
    root.appendChild(modal);
    requestAnimationFrame(() => fitMermaidToViewport(card));
  }

  /**
   * Mermaid 是结构图，不承担证据引用展示。模型偶尔会忽略提示词，
   * 因此在渲染、修复和持久化前统一移除图内 BV/P 时间戳。
   * 普通 Markdown 正文中的时间戳完全不受影响。
   */
  function stripMermaidTimestampCitations(code) {
    return String(code || "")
      // [BV1xxx P1 03:21] / [BV号 P号 mm:ss] / [P2 01:02:03]
      .replace(
        /[ \t]*\[\s*(?:BV(?:号|[A-Za-z0-9]+)?\s+)?P(?:号|\d+)\s+(?:mm:ss|\d{1,2}:\d{2}(?::\d{2})?)\s*\]/gi,
        "",
      )
      // 少数模型省略 P，只输出 [BV1xxx 03:21]
      .replace(
        /[ \t]*\[\s*BV(?:号|[A-Za-z0-9]+)?\s+(?:mm:ss|\d{1,2}:\d{2}(?::\d{2})?)\s*\]/gi,
        "",
      )
      .replace(/[ \t]+(?=\r?\n|$)/g, "")
      .trim();
  }

  function sanitizeMermaidTimestampCitationsInMarkdown(markdown) {
    return String(markdown || "").replace(
      /```mermaid\s*\r?\n([\s\S]*?)```/gi,
      (_, code) => `\`\`\`mermaid\n${stripMermaidTimestampCitations(code)}\n\`\`\``,
    );
  }

  function extractMermaidCode(text) {
    let source = String(text || "").trim();
    const fenced = source.match(/```(?:mermaid)?[ \t]*\r?\n([\s\S]*?)```/i);
    if (fenced) source = fenced[1];
    source = source
      .replace(/^\s*```(?:mermaid)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .replace(/^\s*mermaid\s*\r?\n/i, "")
      .trim();
    return stripMermaidTimestampCitations(source);
  }

  function replaceMermaidBlockAt(markdown, targetIdx, nextCode) {
    let current = -1;
    let replaced = false;
    const value = String(markdown || "").replace(
      /```mermaid\s*\r?\n([\s\S]*?)```/gi,
      (full) => {
        current += 1;
        if (current !== Number(targetIdx)) return full;
        replaced = true;
        return `\`\`\`mermaid\n${stripMermaidTimestampCitations(nextCode)}\n\`\`\``;
      },
    );
    return { value, replaced };
  }

  function persistRepairedMermaid(targetRun, idx, nextCode) {
    // targetRun 必须由点击“重绘”时捕获，不能在异步修复结束后重新读取当前标签。
    const run = targetRun || getActiveAiRun();
    const source = run?.raw ?? state.aiRaw;
    const result = replaceMermaidBlockAt(source, idx, nextCode);
    if (!result.replaced) return false;

    if (run) {
      run.raw = result.value;
      // 只有目标模型仍是当前标签时才更新全局渲染桥；否则保留当前标签内容。
      if (run.id === state.aiActiveRunId) {
        syncActiveRunBridge(run);
        state.aiRenderedText = run.raw;
        state.aiPendingText = run.raw;
      }
    } else {
      state.aiRaw = result.value;
      state.aiRenderedText = state.aiRaw;
      state.aiPendingText = state.aiRaw;
    }
    return true;
  }

  function requestMermaidCodeRepair(code, error, idx, targetRun) {
    // 使用点击时锁定的模型配置，切换结果标签不会改变修复所用模型。
    const cfg = targetRun?.config || getActiveAiRun()?.config || loadAiConfig();
    const runtime = createAiRuntime(`Mermaid 修复 · ${cfg.name || cfg.model || "AI"}`);
    if (!cfg.apiKey) throw new Error("AI 修复需要先在设置中填写 API Key");
    if (!cfg.baseUrl) throw new Error("AI 修复需要先在设置中填写 Base URL");

    const parseError = String(error?.message || error || "未知渲染错误").slice(0, 4000);
    const originalCode = String(code || "").slice(0, 30000);
    const messages = [
      {
        role: "system",
        content: [
          "你是 Mermaid 10.9.1 的确定性语法修复器，只处理用户给出的单个 flowchart。",
          "修复目标仅限语法和兼容性：引号、括号、节点 ID、标签、换行、箭头和不受支持的指令。",
          "必须保留原图的节点含义、关系方向、顺序和信息量；移除 Mermaid 节点、边和子图标题中的所有 BV/P/时间戳引用；不得补充字幕外事实，也不要把图改写成新的总结。",
          "输出只允许一个完整的 ```mermaid``` 代码块。使用 flowchart TD 或 flowchart LR；节点 ID 仅用 ASCII 字母数字；标签使用双引号。",
          "禁止 click、classDef、style、init、实验语法和除 <br/> 外的复杂 HTML。不要输出解释、前言或修改说明。",
        ].join("\n"),
      },
      {
        role: "user",
        content:
          `请修复第 ${Number(idx) + 1} 张 Mermaid 图。\n\n` +
          `【渲染错误】\n${parseError}\n\n` +
          `【原始 Mermaid】\n\`\`\`mermaid\n${originalCode}\n\`\`\``,
      },
    ];

    return new Promise((resolve, reject) => {
      let latest = "";
      requestChatCompletion({
        runtime,
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        model: cfg.model,
        temperature: 0.1,
        maxTokens: 32768,
        messages,
        stream: cfg.stream !== false,
        onStatus(msg) {
          setStatus(`Mermaid AI 修复 · ${msg}`);
        },
        onDelta(_delta, full, parts) {
          latest = String(parts?.content || full || latest);
        },
        onDone(full, parts) {
          const repaired = extractMermaidCode(parts?.content || full || latest);
          if (!repaired) {
            reject(new Error("AI 没有返回可用的 Mermaid 代码"));
            return;
          }
          resolve(repaired);
        },
        onError(err) {
          reject(err instanceof Error ? err : new Error(String(err || "AI 修复失败")));
        },
      });
    });
  }

  async function handleMermaidTool(button) {
    const action = button?.dataset?.mmdAct;
    const card = button?.closest(".bsb-mermaid-card");

    if (action === "retry") {
      const host = button.closest?.(".mermaid[data-bsb-m]") || card?._bsbMermaidHost;
      const job = host?._bsbMermaidJob || card?._bsbMermaidJob;
      if (!host || !job) {
        setStatus("重绘失败：没有找到该图对应的 Mermaid 源码", "err");
        return;
      }
      // 重绘只受当前模型约束：其他模型仍在生成时，不阻塞这个已完成模型。
      // 同时锁定目标 run，防止修复过程中切换标签后写错模型。
      const targetRun = getActiveAiRun();
      const targetName = targetRun?.config?.name || targetRun?.config?.model || "当前模型";
      if (targetRun ? targetRun.busy : state.aiBusy) {
        setStatus(`${targetName} 的 AI 笔记仍在生成，请完成或停止后再修复 Mermaid`, "err");
        return;
      }
      if (targetRun ? targetRun.mermaidRepairing : state.mermaidRepairing) {
        setStatus(`${targetName} 已有 Mermaid 图正在重绘`, "err");
        return;
      }

      if (card?.closest(".bsb-mermaid-modal")) closeMermaidFullscreen();
      if (targetRun) targetRun.mermaidRepairing = true;
      else state.mermaidRepairing = true;
      button.disabled = true;
      button.textContent = "重试中…";

      const originalCode = String(job.code || "");
      let activeCode = originalCode;
      try {
        // 第一步：原代码本地重试一次，解决偶发的库加载/并发问题，不消耗 AI。
        setStatus(`Mermaid 图 ${job.idx + 1} · 正在用原代码重试…`);
        const local = await renderMermaidNode(host, originalCode, job.idx, job.epoch, {
          force: true,
          maxAttempts: 1,
          showError: false,
          repaired: !!job.repaired,
          originalCode: job.originalCode || originalCode,
        });
        if (local.ok) {
          setStatus(`Mermaid 图 ${job.idx + 1} 已重新渲染；代码未改变`, "ok");
          return;
        }

        // 第二步：原代码稳定失败，说明大概率是语法/兼容性问题；只让 AI 修复此代码块。
        button.textContent = "AI 修复中…";
        setStatus(`Mermaid 图 ${job.idx + 1} 本地重试失败，正在修复代码…`);
        activeCode = await requestMermaidCodeRepair(originalCode, local.error, job.idx, targetRun);
        if (activeCode.trim() === originalCode.trim()) {
          throw new Error("AI 返回的 Mermaid 代码与原代码相同，未完成修复");
        }

        // 第三步：只有修复后的代码真实通过 Mermaid 渲染，才写回完整笔记源码。
        button.textContent = "验证中…";
        const repairedResult = await renderMermaidNode(host, activeCode, job.idx, job.epoch, {
          force: true,
          maxAttempts: 2,
          showError: false,
          repaired: true,
          originalCode,
        });
        if (!repairedResult.ok) throw repairedResult.error || new Error("修复后的代码仍无法渲染");

        const persisted = persistRepairedMermaid(targetRun, job.idx, activeCode);
        const currentJob = host._bsbMermaidJob;
        if (currentJob) {
          currentJob.code = activeCode;
          currentJob.repaired = true;
          currentJob.originalCode = originalCode;
          currentJob.persisted = persisted;
        }
        setStatus(
          `Mermaid 图 ${job.idx + 1} 修复成功：代码已替换并重新渲染${persisted ? "，已写回笔记源码" : ""}`,
          "ok",
        );
      } catch (err) {
        console.error("[bili-subbatch] mermaid repair", err);
        host.dataset.bsbState = "error";
        host._bsbMermaidJob = {
          code: originalCode,
          idx: job.idx,
          epoch: job.epoch,
          originalCode: job.originalCode || originalCode,
          repaired: false,
        };
        renderMermaidError(host, originalCode, err, job.idx);
        setStatus(`Mermaid 图 ${job.idx + 1} 重绘失败：${err?.message || err}`, "err");
      } finally {
        if (targetRun) targetRun.mermaidRepairing = false;
        else state.mermaidRepairing = false;
        if (button.isConnected) {
          button.disabled = false;
          button.textContent = "重绘";
        }
      }
      return;
    }

    if (!card) return;
    const viewport = card.querySelector(".bsb-mermaid-viewport");
    if (action === "fit") fitMermaidToViewport(card);
    else if (action === "actual") setMermaidScale(card, 1, "actual");
    else if (action === "zoom-in") setMermaidScale(card, getMermaidScale(card) + 0.15);
    else if (action === "zoom-out") setMermaidScale(card, getMermaidScale(card) - 0.15);
    else if (action === "fullscreen") {
      if (card.closest(".bsb-mermaid-modal")) closeMermaidFullscreen();
      else openMermaidFullscreen(card);
    }
    if (viewport && action === "actual") { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
  }

  function buildMermaidCard(svg, idx, host) {
    svg.classList.add("bsb-mermaid-svg");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `架构流程图 ${idx + 1}`);
    const viewBox = parseMermaidViewBox(svg);
    if (!svg.hasAttribute("viewBox")) svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);

    const baseWidth = Math.round(Math.max(760, Math.min(3600, viewBox.width)));
    const card = document.createElement("section");
    card.className = "bsb-mermaid-card";
    card.dataset.scale = "1";
    card.dataset.fit = "actual";

    const toolbar = document.createElement("div");
    toolbar.className = "bsb-mermaid-toolbar";
    const title = document.createElement("span");
    title.className = "bsb-mermaid-title";
    const repaired = !!host?._bsbMermaidJob?.repaired;
    title.textContent = `架构流程图 ${idx + 1}${repaired ? " · AI 已修复" : ""} · 可滚动查看`;
    const tools = document.createElement("span");
    tools.className = "bsb-mermaid-tools";
    const makeButton = (toolAction, text, titleText) => {
      const toolButton = document.createElement("button");
      toolButton.type = "button";
      toolButton.className = "bsb-mermaid-tool";
      toolButton.dataset.mmdAct = toolAction;
      toolButton.textContent = text;
      toolButton.title = titleText;
      toolButton.setAttribute("aria-label", titleText);
      return toolButton;
    };
    tools.append(
      makeButton("fit", "适宽", "适应可视区域宽度"),
      makeButton("actual", "100%", "恢复清晰原始尺寸"),
      makeButton("zoom-out", "−", "缩小图表"),
    );
    const scaleLabel = document.createElement("span");
    scaleLabel.className = "bsb-mermaid-scale";
    scaleLabel.textContent = "100%";
    tools.append(
      scaleLabel,
      makeButton("zoom-in", "+", "放大图表"),
      makeButton("retry", "重绘", "先重试渲染；若语法失败则只修复该 Mermaid 代码块"),
      makeButton("fullscreen", "全屏", "全屏查看"),
    );
    toolbar.append(title, tools);

    const viewport = document.createElement("div");
    viewport.className = "bsb-mermaid-viewport";
    viewport.tabIndex = 0;
    viewport.setAttribute("aria-label", "可滚动和缩放的 Mermaid 图表");
    const stage = document.createElement("div");
    stage.className = "bsb-mermaid-stage";
    stage.dataset.baseWidth = String(baseWidth);
    stage.style.setProperty("--bsb-mermaid-width", `${baseWidth}px`);
    stage.appendChild(svg);
    const hint = document.createElement("span");
    hint.className = "bsb-mermaid-hint";
    hint.textContent = "Ctrl + 滚轮缩放";
    viewport.append(stage, hint);
    card.append(toolbar, viewport);
    card._bsbMermaidHost = host || null;
    card._bsbMermaidJob = host?._bsbMermaidJob || null;
    return card;
  }

  function enqueueMermaidRender(task) {
    const run = state.mermaidQueue.catch(() => undefined).then(task);
    state.mermaidQueue = run.catch(() => undefined);
    return run;
  }

  function renderMermaidError(node, code, err, idx) {
    const message = String(err?.message || err || "未知错误");
    node.replaceChildren();

    const box = document.createElement("section");
    box.className = "bsb-mermaid-error";
    const head = document.createElement("div");
    head.className = "bsb-mermaid-error-head";
    const title = document.createElement("strong");
    title.textContent = `架构流程图 ${idx + 1} 渲染失败`;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "bsb-mermaid-tool";
    retry.dataset.mmdAct = "retry";
    retry.textContent = "重绘";
    retry.title = "先用原代码重试；仍失败则调用现有 AI 配置修复此 Mermaid 代码块";
    head.append(title, retry);

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "查看 Mermaid 源码与错误";
    const pre = document.createElement("pre");
    const codeNode = document.createElement("code");
    codeNode.textContent = `${code}\n\n${message}`;
    pre.appendChild(codeNode);
    details.append(summary, pre);
    box.append(head, details);
    node.appendChild(box);
  }

  async function renderMermaidNode(
    node,
    code,
    idx,
    epoch,
    { force = false, maxAttempts, showError = true, repaired = false, originalCode = "" } = {},
  ) {
    if (!node || epoch !== state.renderEpoch) return { ok: false, aborted: true };
    if (!force && node.dataset.bsbState === "done") return { ok: true, skipped: true };
    if (node.dataset.bsbState === "rendering") return { ok: false, busy: true };

    const previousState = node.dataset.bsbState || "pending";
    const previousJob = node._bsbMermaidJob || null;
    const job = {
      code: stripMermaidTimestampCitations(code),
      idx,
      epoch,
      repaired: !!repaired,
      originalCode: stripMermaidTimestampCitations(originalCode || previousJob?.originalCode || code),
    };
    node._bsbMermaidJob = job;
    node.dataset.bsbState = "rendering";
    const attempts = Math.max(1, Number(maxAttempts) || (force ? 2 : 3));
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const rendered = await enqueueMermaidRender(async () => {
          await ensureMermaid();
          if (attempt > 0 && typeof mermaid !== "undefined") {
            // 只重新应用配置；不能把语法错误误认为 CDN/运行时故障。
            state.renderLibs.mermaid = false;
            await ensureMermaid();
          }
          if (epoch !== state.renderEpoch) return null;
          const id = `bsb-mmd-${Date.now()}-${idx}-${++state.mermaidRenderSeq}`;
          return mermaid.render(id, job.code);
        });
        if (!rendered || epoch !== state.renderEpoch) return { ok: false, aborted: true };
        const { svg } = rendered;
        const safeSvg = typeof DOMPurify !== "undefined"
          ? DOMPurify.sanitize(svg, {
              USE_PROFILES: { svg: true, svgFilters: true },
              ADD_ATTR: ["class", "style", "viewBox", "preserveAspectRatio", "role", "aria-label"],
            })
          : svg;
        const tpl = document.createElement("template");
        tpl.innerHTML = safeSvg;
        const svgNode = tpl.content.querySelector("svg");
        if (!svgNode) throw new Error("Mermaid 未返回有效 SVG");

        node.replaceChildren(buildMermaidCard(svgNode, idx, node));
        node.dataset.bsbState = "done";
        return { ok: true, code: job.code, repaired: job.repaired };
      } catch (err) {
        lastError = err;
        if (epoch !== state.renderEpoch) return { ok: false, aborted: true, error: err };
        if (attempt + 1 < attempts) await sleep(180 * (attempt + 1));
      }
    }

    if (showError) {
      node.dataset.bsbState = "error";
      renderMermaidError(node, job.code, lastError, idx);
    } else {
      node.dataset.bsbState = previousState;
      node._bsbMermaidJob = previousJob || job;
    }
    return { ok: false, error: lastError, code: job.code };
  }

  function scheduleMermaid(host, blocks, epoch, scrollRoot) {
    const nodes = Array.from(host.querySelectorAll(".mermaid[data-bsb-m]"));
    if (!nodes.length) return;
    if (state.mermaidObserver) state.mermaidObserver.disconnect();
    if ("IntersectionObserver" in window) {
      state.mermaidObserver = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          const idx = Number(entry.target.dataset.bsbM);
          renderMermaidNode(entry.target, blocks[idx] || "", idx, epoch);
        }
      }, { root: scrollRoot || null, rootMargin: "320px 0px", threshold: 0.01 });
      nodes.forEach((node) => { node.dataset.bsbState = "pending"; state.mermaidObserver.observe(node); });
    } else {
      nodes.forEach((node, idx) => renderMermaidNode(node, blocks[idx] || "", idx, epoch));
    }
  }

  async function renderAiMarkdown(md, { streaming } = {}) {
    const root = ensurePanel();
    const box = root.querySelector('[data-role="ai-md"]');
    const host = root.querySelector('[data-role="ai-content"]') || box;
    if (!host) return;
    if (streaming) return paintAiStreamText(md);
    closeMermaidFullscreen();

    // 防止最后一个流式定时绘制在增强渲染完成后反向覆盖 DOM。
    if (state.aiPaintTimer) { clearTimeout(state.aiPaintTimer); state.aiPaintTimer = 0; }
    if (state.aiPaintRaf) { cancelAnimationFrame(state.aiPaintRaf); state.aiPaintRaf = 0; }

    const epoch = ++state.renderEpoch;
    const originalSource = String(md || "");
    const source = sanitizeMermaidTimestampCitationsInMarkdown(originalSource);
    if (source !== originalSource) {
      const activeRun = getActiveAiRun();
      if (activeRun && String(activeRun.raw || "") === originalSource) {
        activeRun.raw = source;
        syncActiveRunBridge(activeRun);
      } else if (String(state.aiRaw || "") === originalSource) {
        state.aiRaw = source;
      }
    }
    const needsMath = hasMathSyntax(source);
    const needsCode = hasCodeSyntax(source);
    const needsMermaid = hasMermaidSyntax(source);
    try {
      await ensureMarkdownCore();
      if (needsMath) await ensureKatex();
    } catch (e) {
      host.innerHTML = simpleMarkdownFallback(source) + `<p style="color:var(--ctp-peach)">增强渲染库加载失败，已使用安全简易渲染。</p>`;
      if (box) box.scrollTop = 0;
      return;
    }
    if (epoch !== state.renderEpoch) return;

    const { md: mdMath, maths } = prepareMarkdownMath(source);
    const mermaidBlocks = [];
    const md2 = mdMath.replace(/```mermaid\s*\n([\s\S]*?)```/gi, (_, code) => {
      const i = mermaidBlocks.length; mermaidBlocks.push(code.trim());
      return `\n\n<div class="mermaid" data-bsb-m="${i}">${escapeHtml(code.trim())}</div>\n\n`;
    });
    let html;
    try { html = marked.parse(md2); } catch (_) { html = simpleMarkdownFallback(md2); }
    if (maths.length) html = replaceMathPlaceholders(html, maths, katexToHtml);
    html = sanitizeRenderedHtml(html);
    if (!(await replaceHostInBatches(host, html, epoch))) return;

    host.querySelectorAll("a[href]").forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
    linkifyTimestamps(host);
    buildToc(host);
    if (needsMermaid) scheduleMermaid(host, mermaidBlocks, epoch, box);
    if (needsCode) await enhanceCodeBlocks(host, epoch);

    if (box && !box.querySelector('[data-role="ai-anchor"]')) {
      const a = document.createElement("div"); a.className = "bsb-ai-anchor"; a.dataset.role = "ai-anchor"; box.appendChild(a);
    }
    if (box) {
      state.aiProgScroll = true; box.scrollTop = 0;
      requestAnimationFrame(() => { state.aiProgScroll = false; });
    }
    state.aiStickBottom = false; state.aiUserReading = true; updateJumpLatestBtn();
  }

  /**
   * OpenAI-compatible chat.completions.
   *
   * 路径优先级（peer + opencli 实测）：
   * 1) 页面原生 fetch + ReadableStream
   * 2) GM_xmlhttpRequest 回退（无 timeout；优先 responseType stream + reader）
   */
  function requestChatCompletion(opts) {
    const runtime = opts.runtime || createAiRuntime(opts.model || "AI");
    const {
      baseUrl,
      apiKey,
      model,
      temperature,
      maxTokens,
      messages,
      stream,
      onDelta,
      onDone,
      onError,
      onStatus,
    } = opts;
    const url = String(baseUrl || "").trim().replace(/\/+$/, "") + "/chat/completions";
    const useStream = stream !== false;
    const effectiveMaxTokens = Math.max(256, Math.min(128000, Math.floor(Number(maxTokens) || AI_DEFAULTS.maxTokens)));
    const body = {
      model: String(model || "").trim(),
      messages,
      temperature,
      max_tokens: effectiveMaxTokens,
      stream: useStream,
    };
    onStatus && onStatus(`准备请求 · max_tokens=${effectiveMaxTokens}`);

    // cancel previous
    try {
      if (runtime.abortController) runtime.abortController.abort();
    } catch (_) {
      /* */
    }
    try {
      if (runtime.xhr && typeof runtime.xhr.abort === "function") {
        runtime.xhr.abort();
      }
    } catch (_) {
      /* */
    }
    runtime.abortController = null;
    runtime.xhr = null;

    // Prefer page fetch (validated via opencli browser eval)
    requestChatViaPageFetch({
      runtime,
      url,
      apiKey,
      body,
      useStream,
      onDelta,
      onDone,
      onError: (err) => {
        // CORS / network → fall back to GM
        const msg = String(err && err.message ? err.message : err);
        if (
          /cors|failed to fetch|networkerror|load failed|blocked/i.test(msg) ||
          err?.name === "TypeError"
        ) {
          onStatus && onStatus(`页内 fetch 失败(${msg.slice(0, 60)})，改用 GM…`);
          requestChatViaGm({
            runtime,
            url,
            apiKey,
            body,
            useStream,
            onDelta,
            onDone,
            onError,
            onStatus,
          });
        } else {
          onError && onError(err);
        }
      },
      onStatus,
    });
    return runtime;
  }

  function requestChatViaPageFetch({
    runtime,
    url,
    apiKey,
    body,
    useStream,
    onDelta,
    onDone,
    onError,
    onStatus,
  }) {
    let assembledContent = "";
    let assembledReasoning = "";
    let settled = false;
    let lineBuf = "";
    let lastStatusAt = 0;
    let sawDone = false;
    let finishReason = "";
    const ac = new AbortController();
    runtime.abortController = ac;

    const finish = (err) => {
      if (settled) return;
      settled = true;
      if (runtime.abortController === ac) runtime.abortController = null;
      if (err) onError && onError(err);
      else {
        onDone &&
          onDone(formatAiDisplay(assembledContent, assembledReasoning), {
            content: assembledContent,
            reasoning: assembledReasoning,
            finishReason,
            sawDone,
          });
      }
    };

    const emit = () => {
      onDelta &&
        onDelta("", formatAiDisplay(assembledContent, assembledReasoning), {
          content: assembledContent,
          reasoning: assembledReasoning,
        });
    };

    const applyPiece = (c, r) => {
      let ch = false;
      if (c) {
        assembledContent += c;
        ch = true;
      }
      if (r) {
        assembledReasoning += r;
        ch = true;
      }
      if (ch) emit();
    };

    const handleSseLine = (line) => {
      const parsed = parseSseDataLine(line);
      if (parsed.kind === "done") sawDone = true;
      if (parsed.kind === "delta") {
        applyPiece(parsed.content, parsed.reasoning);
        if (parsed.finishReason) finishReason = parsed.finishReason;
      }
      if (parsed.kind === "error") throw new Error(parsed.message);
    };

    onStatus && onStatus("页内 fetch 流式请求（peer/opencli 路径）…");

    (async () => {
      try {
        if (runtime.abort) throw new Error("用户停止");
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
            Accept: useStream
              ? "text/event-stream, application/json"
              : "application/json",
          },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`HTTP ${res.status}: ${t.slice(0, 300)}`);
        }

        if (!useStream || !res.body || !res.body.getReader) {
          const text = await res.text();
          const j = JSON.parse(text);
          if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
          const choice = j.choices?.[0];
          const { content, reasoning } = extractFromChoice(choice);
          finishReason = String(choice?.finish_reason || "");
          assembledContent = content || "";
          assembledReasoning = reasoning || "";
          emit();
          if (!assembledContent && !assembledReasoning) {
            throw new Error("响应无正文: " + text.slice(0, 200));
          }
          if (finishReason === "length") {
            throw new Error(`输出达到 max_tokens=${body.max_tokens}，结果已截断`);
          }
          finish(null);
          return;
        }

        onStatus && onStatus("已连接，流式读取中…");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let totalBytes = 0;
        while (true) {
          if (runtime.abort) {
            try {
              await reader.cancel();
            } catch (_) {
              /* */
            }
            throw new Error("用户停止");
          }
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value ? value.length : 0;
          lineBuf += dec.decode(value, { stream: true });
          const lines = lineBuf.split(/\r?\n/);
          lineBuf = lines.pop() || "";
          for (const line of lines) handleSseLine(line);
          const now = Date.now();
          if (now - lastStatusAt > 400) {
            lastStatusAt = now;
            onStatus &&
              onStatus(
                `页内流式… ${totalBytes}B · 正文 ${assembledContent.length} · 思考 ${assembledReasoning.length}`,
              );
          }
        }
        if (lineBuf.trim()) handleSseLine(lineBuf);
        if (!assembledContent && !assembledReasoning) {
          throw new Error("流式结束但 content/reasoning 皆空");
        }
        if (finishReason === "length") {
          throw new Error(`输出达到 max_tokens=${body.max_tokens}，结果已截断`);
        }
        if (!sawDone && !finishReason) {
          throw new Error("流式连接在 [DONE]/finish_reason 之前中断，已保留部分内容");
        }
        finish(null);
      } catch (e) {
        if (runtime.abort || (e && e.name === "AbortError")) {
          if (assembledContent || assembledReasoning) {
            onStatus && onStatus("已停止，保留已接收内容");
            finish(null);
          } else {
            finish(new Error("用户停止"));
          }
          return;
        }
        // 有部分内容：不重试以免重复计费，但必须标记为失败/截断，不能伪装成完整成功。
        if (assembledContent || assembledReasoning) {
          onStatus && onStatus("连接异常结束，保留已接收内容并标记失败");
          finish(e instanceof Error ? e : new Error(String(e)));
          return;
        }
        finish(e instanceof Error ? e : new Error(String(e)));
      }
    })();
  }

  function requestChatViaGm({
    runtime,
    url,
    apiKey,
    body,
    useStream,
    onDelta,
    onDone,
    onError,
    onStatus,
  }) {
    let assembledContent = "";
    let assembledReasoning = "";
    let settled = false;
    let lineBuf = "";
    let lastSeenLen = 0;
    let lastStatusAt = 0;
    let sawDone = false;
    let finishReason = "";
    let xhrHandle = null;
    let usedStreamReader = false;
    /** Only one text POST may start (prevents parallel billing) */
    let textPathStarted = false;
    /** When true, stream onabort is expected and must not finish/error */
    let switchingToText = false;

    const finish = (err) => {
      if (settled) return;
      settled = true;
      switchingToText = false;
      if (runtime.xhr === xhrHandle) runtime.xhr = null;
      if (err) onError && onError(err);
      else {
        onDone &&
          onDone(formatAiDisplay(assembledContent, assembledReasoning), {
            content: assembledContent,
            reasoning: assembledReasoning,
            finishReason,
            sawDone,
          });
      }
    };

    const softFinishOrError = (label) => {
      if (assembledContent || assembledReasoning) {
        onStatus && onStatus(`${label}，保留已接收内容并标记失败`);
      }
      finish(new Error(label));
    };

    const emit = () => {
      onDelta &&
        onDelta("", formatAiDisplay(assembledContent, assembledReasoning), {
          content: assembledContent,
          reasoning: assembledReasoning,
        });
    };

    const applyPiece = (c, r) => {
      let ch = false;
      if (c) {
        assembledContent += c;
        ch = true;
      }
      if (r) {
        assembledReasoning += r;
        ch = true;
      }
      if (ch) emit();
    };

    const handleSseLine = (line) => {
      const parsed = parseSseDataLine(line);
      if (parsed.kind === "done") sawDone = true;
      if (parsed.kind === "delta") {
        applyPiece(parsed.content, parsed.reasoning);
        if (parsed.finishReason) finishReason = parsed.finishReason;
      }
      if (parsed.kind === "error") softFinishOrError(parsed.message);
    };

    const ingestSseText = (fullText) => {
      if (fullText.length < lastSeenLen) lastSeenLen = 0;
      const neu = fullText.slice(lastSeenLen);
      lastSeenLen = fullText.length;
      if (!neu) return;
      lineBuf += neu;
      const lines = lineBuf.split(/\r?\n/);
      lineBuf = lines.pop() || "";
      for (const line of lines) handleSseLine(line);
      const now = Date.now();
      if (now - lastStatusAt > 400) {
        lastStatusAt = now;
        onStatus &&
          onStatus(
            `GM流式… ${fullText.length}B · 正文 ${assembledContent.length} · 思考 ${assembledReasoning.length}`,
          );
      }
    };

    const abortXhr = (handle) => {
      if (!handle) return;
      try {
        if (typeof handle.abort === "function") handle.abort();
      } catch (_) {
        /* */
      }
    };

    const commonHeaders = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
      Accept: useStream
        ? "text/event-stream, application/json"
        : "application/json",
    };

    function startGmTextPath(reason) {
      if (settled || textPathStarted) return;
      textPathStarted = true;
      // Abort any in-flight stream XHR before opening a second POST
      if (xhrHandle) {
        switchingToText = true;
        const prev = xhrHandle;
        xhrHandle = null;
        abortXhr(prev);
        switchingToText = false;
      }
      onStatus &&
        onStatus(
          `GM text/onprogress（无 timeout）${reason ? " · " + reason : ""}…`,
        );
      xhrHandle = GM_xmlhttpRequest({
        method: "POST",
        url,
        headers: commonHeaders,
        data: JSON.stringify(body),
        responseType: "text",
        onloadstart() {
          onStatus && onStatus("GM text 已连接…");
        },
        onprogress(res) {
          if (runtime.abort) {
            abortXhr(xhrHandle);
            softFinishOrError("用户停止");
            return;
          }
          if (useStream) ingestSseText(res.responseText || "");
        },
        onreadystatechange(res) {
          if (runtime.abort) return;
          if (res.readyState === 3 && useStream && res.responseText) {
            ingestSseText(res.responseText);
          }
        },
        onload(res) {
          if (runtime.abort) {
            softFinishOrError("用户停止");
            return;
          }
          const text = res.responseText || "";
          if (res.status < 200 || res.status >= 300) {
            softFinishOrError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
            return;
          }
          try {
            if (useStream) {
              ingestSseText(text);
              if (lineBuf.trim()) handleSseLine(lineBuf);
            } else {
              const j = JSON.parse(text);
              if (j.error) {
                throw new Error(j.error.message || JSON.stringify(j.error));
              }
              const choice = j.choices?.[0];
              const { content, reasoning } = extractFromChoice(choice);
              finishReason = String(choice?.finish_reason || "");
              assembledContent = content || "";
              assembledReasoning = reasoning || "";
              emit();
            }
          } catch (e) {
            softFinishOrError(e.message || String(e));
            return;
          }
          if (!assembledContent && !assembledReasoning) {
            softFinishOrError("GM 响应无正文");
            return;
          }
          if (finishReason === "length") {
            softFinishOrError(`输出达到 max_tokens=${body.max_tokens}，结果已截断`);
            return;
          }
          if (useStream && !sawDone && !finishReason) {
            softFinishOrError("GM 流式连接在 [DONE]/finish_reason 之前中断");
            return;
          }
          finish(null);
        },
        onerror() {
          softFinishOrError("GM 网络错误");
        },
        ontimeout() {
          softFinishOrError("GM ontimeout 误触");
        },
        onabort() {
          if (runtime.abort) softFinishOrError("用户停止");
          // ignore aborts while replacing handles
        },
      });
      runtime.xhr = xhrHandle;
    }

    // Peer practice (GreasyFork 459997): responseType stream + getReader
    if (useStream) {
      onStatus && onStatus("GM stream reader 回退…");
      xhrHandle = GM_xmlhttpRequest({
        method: "POST",
        url,
        headers: commonHeaders,
        data: JSON.stringify(body),
        responseType: "stream",
        onloadstart(streamRes) {
          if (settled || textPathStarted) return;
          try {
            const reader =
              streamRes.response &&
              streamRes.response.getReader &&
              streamRes.response.getReader();
            if (!reader) throw new Error("no stream reader");
            usedStreamReader = true;
            onStatus && onStatus("GM stream reader 已连接…");
            const dec = new TextDecoder();
            let buf = "";
            const pump = () => {
              if (settled || textPathStarted) return;
              if (runtime.abort) {
                try {
                  reader.cancel();
                } catch (_) {
                  /* */
                }
                softFinishOrError("用户停止");
                return;
              }
              reader
                .read()
                .then(({ done, value }) => {
                  if (settled || textPathStarted) return;
                  if (done) {
                    if (buf.trim()) {
                      buf.split(/\r?\n/).forEach(handleSseLine);
                    }
                    if (!assembledContent && !assembledReasoning) {
                      softFinishOrError("GM stream 结束无正文");
                    } else if (finishReason === "length") {
                      softFinishOrError(`输出达到 max_tokens=${body.max_tokens}，结果已截断`);
                    } else if (!sawDone && !finishReason) {
                      softFinishOrError("GM stream 在 [DONE]/finish_reason 之前中断");
                    } else finish(null);
                    return;
                  }
                  buf += dec.decode(value, { stream: true });
                  const lines = buf.split(/\r?\n/);
                  buf = lines.pop() || "";
                  for (const line of lines) handleSseLine(line);
                  onStatus &&
                    onStatus(
                      `GM stream… 正文 ${assembledContent.length} · 思考 ${assembledReasoning.length}`,
                    );
                  pump();
                })
                .catch((e) => {
                  if (settled || textPathStarted) return;
                  softFinishOrError(e.message || String(e));
                });
            };
            pump();
          } catch (_) {
            // stream unsupported → single text POST after aborting this handle
            if (!settled && !usedStreamReader && !textPathStarted) {
              onStatus && onStatus("GM stream 不可用，改 text…");
              startGmTextPath("stream unsupported");
            }
          }
        },
        onerror() {
          if (settled || textPathStarted) return;
          if (!usedStreamReader) {
            startGmTextPath("stream onerror");
          } else {
            softFinishOrError("GM stream 网络错误");
          }
        },
        onabort() {
          // Intentional abort when switching to text path — do not finish
          if (switchingToText || textPathStarted) return;
          if (settled) return;
          softFinishOrError(runtime.abort ? "用户停止" : "GM stream 中止");
        },
      });
      runtime.xhr = xhrHandle;
      return xhrHandle;
    }

    startGmTextPath("non-stream");
    return xhrHandle;
  }

  async function ensureSubtitlesForAi(targets) {
    const delay = state.delayMs;
    for (let i = 0; i < targets.length; i++) {
      if (state.aiAbort) throw new Error("用户停止");
      const it = targets[i];
      if (it.subStatus === "ok" && it.data?.length) continue;
      setStatus(`AI 准备字幕 ${i + 1}/${targets.length} · ${it.bvid}…`);
      const r = await fetchSubtitle(it.bvid, it.page || 1);
      it.subStatus = r.status;
      it.cue_count = r.cue_count || 0;
      it.data = r.data || null;
      it.error = r.error || "";
      if (!it.title && r.title) it.title = r.title;
      if (!it.author && r.author) it.author = r.author;
      renderList();
      if (i < targets.length - 1) await sleep(delay);
    }
    return targets.filter((it) => it.subStatus === "ok" && it.data?.length);
  }

  function currentPreprocessSettings() {
    return {
      concurrency: Math.min(8, Math.max(1, Number(state.preprocessConcurrency) || PREPROCESS_DEFAULT_CONCURRENCY)),
      targetMinutes: Math.min(30, Math.max(2, Number(state.preprocessTargetMinutes) || PREPROCESS_DEFAULT_TARGET_MINUTES)),
      overlapSeconds: Math.min(120, Math.max(0, Number(state.preprocessOverlapSeconds) || 0)),
      maxChars: Math.min(60000, Math.max(8000, Number(state.preprocessMaxChars) || PREPROCESS_DEFAULT_MAX_CHARS)),
      retries: Math.min(4, Math.max(0, Number(state.preprocessRetries) || 0)),
    };
  }

  function cueTextLength(cue, bvid, page) {
    const sec = cue?.from_sec != null ? cue.from_sec : parseSeconds(cue?.from);
    return String(`[${bvid || "BV"} P${Math.max(1, Number(page) || 1)} ${formatClock(sec)}] ${String(cue?.content || "").trim()}\n`).length;
  }

  /**
   * 长视频 PRE 智能切块：
   * - 以字幕真实时间为主要边界（默认 8 分钟）
   * - maxChars 是硬上限，语速很快/中文 token 密度高时会提前切
   * - 从第二块开始向前带 overlapSeconds 的字幕作为上下文
   * - coreStartSec 标记真正属于该块的新内容起点，最终 stitch 时据此去掉 overlap
   */
  function splitCuesForPreprocess(item, settings = currentPreprocessSettings()) {
    const cues = (item?.data || []).filter((cue) => String(cue?.content || "").trim());
    if (!cues.length) return [];
    const page = item.page || 1;
    const bvid = item.bvid || "BV";
    const targetSec = Math.max(120, settings.targetMinutes * 60);
    const overlapSec = Math.max(0, settings.overlapSeconds);
    const hardChars = Math.max(8000, settings.maxChars);
    const specs = [];
    let coreStartIdx = 0;

    while (coreStartIdx < cues.length) {
      const coreStartSec = Number(cues[coreStartIdx].from_sec ?? parseSeconds(cues[coreStartIdx].from));
      let endIdx = coreStartIdx;
      let chars = 0;
      while (endIdx < cues.length) {
        const cue = cues[endIdx];
        const nextChars = chars + cueTextLength(cue, bvid, page);
        const cueEnd = Number(cue.to_sec ?? parseSeconds(cue.to) ?? cue.from_sec ?? 0);
        const duration = Math.max(0, cueEnd - coreStartSec);
        if (endIdx > coreStartIdx && (nextChars > hardChars || duration >= targetSec)) break;
        chars = nextChars;
        endIdx += 1;
      }
      if (endIdx <= coreStartIdx) endIdx = coreStartIdx + 1;

      let overlapStartIdx = coreStartIdx;
      if (specs.length && overlapSec > 0) {
        const wanted = coreStartSec - overlapSec;
        while (overlapStartIdx > 0) {
          const prevSec = Number(cues[overlapStartIdx - 1].from_sec ?? parseSeconds(cues[overlapStartIdx - 1].from));
          if (prevSec < wanted) break;
          overlapStartIdx -= 1;
        }
      }

      // overlap 也不能突破字符硬上限；必要时从最旧的 overlap cue 开始收缩。
      let chunkText = cuesToAiText(cues.slice(overlapStartIdx, endIdx), bvid, page);
      while (chunkText.length > hardChars && overlapStartIdx < coreStartIdx) {
        overlapStartIdx += 1;
        chunkText = cuesToAiText(cues.slice(overlapStartIdx, endIdx), bvid, page);
      }
      // 极端单 cue 过长：沿用最后一道字符保险，不影响正常按 cue 边界切块。
      if (chunkText.length > hardChars) chunkText = chunkText.slice(0, hardChars);

      const chunkStartSec = Number(cues[overlapStartIdx].from_sec ?? parseSeconds(cues[overlapStartIdx].from));
      const lastCue = cues[Math.max(coreStartIdx, endIdx - 1)];
      const endSec = Number(lastCue.to_sec ?? parseSeconds(lastCue.to) ?? lastCue.from_sec ?? 0);
      specs.push({
        text: chunkText,
        coreStartSec,
        chunkStartSec,
        endSec,
        coreStartIdx,
        overlapStartIdx,
        endIdx,
      });
      coreStartIdx = endIdx;
    }
    return specs;
  }

  function parseEvidenceTimestampSeconds(text) {
    const m = String(text || "").match(/\[[^\]\n]*?\b(?:(\d{1,2}):)?(\d{2}):(\d{2})\]/);
    if (!m) return null;
    const h = Number(m[1] || 0), min = Number(m[2] || 0), sec = Number(m[3] || 0);
    if (![h, min, sec].every(Number.isFinite)) return null;
    return h * 3600 + min * 60 + sec;
  }

  function trimProcessedOverlap(text, coreStartSec) {
    const source = String(text || "").trim();
    if (!source || !(coreStartSec > 0)) return source;
    const blocks = source.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
    const kept = [];
    let pending = [];
    let sawKeptTimestamp = false;
    let sawAnyTimestamp = false;
    for (const block of blocks) {
      const sec = parseEvidenceTimestampSeconds(block);
      if (sec == null) {
        if (sawKeptTimestamp) kept.push(block);
        else pending.push(block);
        continue;
      }
      sawAnyTimestamp = true;
      if (sec + 0.75 < coreStartSec) {
        pending = [];
        continue;
      }
      if (!sawKeptTimestamp && pending.length) kept.push(...pending);
      pending = [];
      kept.push(block);
      sawKeptTimestamp = true;
    }
    // 如果某个自定义 PRE Prompt 完全不保留时间戳，宁可保留 overlap 重复，也不能误删正文。
    if (!sawAnyTimestamp || !sawKeptTimestamp) return source;
    return kept.join("\n\n").trim();
  }

  function dedupeExactBlocks(text) {
    const seen = new Set();
    const out = [];
    for (const block of String(text || "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)) {
      const key = block.replace(/\s+/g, " ").trim().toLocaleLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(block);
    }
    return out.join("\n\n").trim();
  }

  function stitchPreprocessChunks(chunkSpecs, outputs) {
    const parts = [];
    for (let i = 0; i < chunkSpecs.length; i++) {
      const cleaned = i === 0
        ? String(outputs[i] || "").trim()
        : trimProcessedOverlap(outputs[i], chunkSpecs[i].coreStartSec);
      if (cleaned) parts.push(cleaned);
    }
    return dedupeExactBlocks(parts.join("\n\n"));
  }

  function preprocessCacheKey(item, raw, prompt, cfg, settings = currentPreprocessSettings()) {
    const source = `${item.bvid || "BV"}:P${item.page || 1}`;
    const promptSig = md5(`${prompt.systemPrompt}\n---\n${prompt.userPromptTemplate}`);
    const modelSig = md5(`${cfg.baseUrl}|${cfg.model}|${cfg.temperature}|${cfg.maxTokens}`);
    const chunkSig = md5(`${settings.targetMinutes}|${settings.overlapSeconds}|${settings.maxChars}`);
    return `ai-preprocess:${source}:${md5(raw)}:${promptSig}:${modelSig}:${chunkSig}`;
  }

  function abortPreprocessChildRuntime(runtime) {
    if (!runtime) return;
    runtime.abort = true;
    try { runtime.abortController?.abort(); } catch (_) { /* noop */ }
    try { runtime.xhr?.abort?.(); } catch (_) { /* noop */ }
  }

  async function requestPreprocessChunk(runtime, cfg, prompt, vars, statusPrefix) {
    const messages = buildAiMessagesForProfile(cfg, vars, prompt);
    if (!messages.length) throw new Error("预处理 Prompt 为空");
    let latest = "";
    return await new Promise((resolve, reject) => {
      requestChatCompletion({
        runtime,
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        model: cfg.model,
        temperature: cfg.temperature,
        maxTokens: cfg.maxTokens,
        messages,
        stream: cfg.stream !== false,
        onStatus(msg) {
          if (runtime.abort || state.aiAbort) return;
          if (state.preprocessRun) state.preprocessRun.statusText = `${statusPrefix} · ${msg}`;
          renderAiResultTabs();
          setStatus(`预处理 · ${statusPrefix} · ${msg}`);
        },
        onDelta(_delta, full) {
          latest = String(full || "");
          if (state.aiViewingPreprocess && state.preprocessRun) {
            state.preprocessRun.preview = `### ${statusPrefix}\n\n${latest}`;
            paintAiStreamText(state.preprocessRun.preview || "正在规范化字幕…");
          }
        },
        onDone(full) { resolve(String(full || latest || "").trim()); },
        onError(err) { reject(err instanceof Error ? err : new Error(String(err || "预处理失败"))); },
      });
    });
  }

  async function requestPreprocessChunkWithRetry(job, cfg, prompt, settings, workerId) {
    let lastError = null;
    for (let attempt = 0; attempt <= settings.retries; attempt++) {
      if (state.aiAbort || state.preprocessRun?.runtime?.abort) throw new Error("用户停止");
      const runtime = createAiRuntime(`PRE W${workerId} ${job.item.bvid} ${job.chunkIndex + 1}/${job.chunkCount}`);
      state.preprocessRun?.childRuntimes?.add(runtime);
      const vars = {
        title: job.item.title || "",
        bvid: `${job.item.bvid || ""}${(job.item.page || 1) > 1 ? ` P${job.item.page}` : ""}`,
        author: job.item.author || "",
        subtitle: job.chunk.text,
        rawSubtitle: job.raw,
        chunkIndex: job.chunkIndex + 1,
        chunkCount: job.chunkCount,
        chunkStart: formatClock(job.chunk.chunkStartSec),
        coreStart: formatClock(job.chunk.coreStartSec),
        chunkEnd: formatClock(job.chunk.endSec),
      };
      const attemptSuffix = attempt ? ` · 重试 ${attempt}/${settings.retries}` : "";
      const label = `${job.itemIndex + 1}/${job.itemCount} ${job.item.bvid}${(job.item.page || 1) > 1 ? ` P${job.item.page}` : ""} · 块 ${job.chunkIndex + 1}/${job.chunkCount} · W${workerId}${attemptSuffix}`;
      try {
        return await requestPreprocessChunk(runtime, cfg, prompt, vars, label);
      } catch (error) {
        lastError = error;
        if (state.aiAbort || state.preprocessRun?.runtime?.abort || runtime.abort) throw error;
        if (attempt >= settings.retries) break;
        if (state.preprocessRun) state.preprocessRun.statusText = `${label} · 失败，准备重试`;
        await sleep(Math.min(2500, 600 * (attempt + 1)));
      } finally {
        state.preprocessRun?.childRuntimes?.delete(runtime);
        abortPreprocessChildRuntime(runtime);
      }
    }
    throw lastError || new Error("预处理分块失败");
  }

  async function runPreprocessWorkerPool(jobs, workerCount, handler) {
    let cursor = 0;
    async function worker(workerId) {
      while (true) {
        if (state.aiAbort || state.preprocessRun?.runtime?.abort) throw new Error("用户停止");
        const index = cursor++;
        if (index >= jobs.length) return;
        await handler(jobs[index], workerId);
      }
    }
    const count = Math.min(Math.max(1, workerCount), Math.max(1, jobs.length));
    await Promise.all(Array.from({ length: count }, (_, i) => worker(i + 1)));
  }

  function buildProcessedSubtitlePayload(items) {
    return items.map((it) => {
      const head = `=== ${it.bvid}${it.page > 1 ? " P" + it.page : ""} ${it.title || ""} ===`;
      return `${head}\n${String(it.preprocessedText || "").trim()}`;
    }).join("\n\n");
  }

  async function preprocessItemsForAi(items, prompt, cfg) {
    const settings = currentPreprocessSettings();
    const runtime = createAiRuntime(`字幕预处理 · ${cfg.name || cfg.model}`); // parent runtime: logical cancel token only
    state.preprocessRun = {
      runtime,
      childRuntimes: new Set(),
      raw: "",
      preview: "",
      status: "running",
      statusText: "准备智能切块",
      busy: true,
      modelName: cfg.name || cfg.model,
      promptName: prompt.name,
      cacheHits: 0,
      total: items.length,
      totalChunks: 0,
      completedChunks: 0,
      settings: { ...settings },
    };
    state.aiViewingPreprocess = true;
    renderAiResultTabs();
    setAiBusy(true);

    const prepared = [];
    const jobs = [];
    let hits = 0;
    try {
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const item = items[itemIndex];
        const raw = cuesToAiText(item.data || [], item.bvid, item.page || 1);
        const cacheKey = preprocessCacheKey(item, raw, prompt, cfg, settings);
        const cached = state.forcePreprocessOnce ? null : await persistentCacheRead(cacheKey);
        if (cached?.value?.text) {
          item.preprocessedText = String(cached.value.text);
          item.preprocessCacheKey = cacheKey;
          hits += 1;
          prepared.push({ item, raw, cacheKey, cached: true, chunks: [], outputs: [] });
          continue;
        }
        const chunks = splitCuesForPreprocess(item, settings);
        const record = { item, raw, cacheKey, cached: false, chunks, outputs: new Array(chunks.length) };
        prepared.push(record);
        chunks.forEach((chunk, chunkIndex) => jobs.push({
          record,
          item,
          raw,
          chunk,
          chunkIndex,
          chunkCount: chunks.length,
          itemIndex,
          itemCount: items.length,
        }));
      }

      state.preprocessRun.cacheHits = hits;
      state.preprocessRun.totalChunks = jobs.length;
      state.preprocessRun.statusText = jobs.length
        ? `智能切块完成 · ${jobs.length} 块 · 并发 ${settings.concurrency}`
        : `全部命中缓存 · ${hits}/${items.length}`;
      renderAiResultTabs();

      if (jobs.length) {
        await runPreprocessWorkerPool(jobs, settings.concurrency, async (job, workerId) => {
          const text = await requestPreprocessChunkWithRetry(job, cfg, prompt, settings, workerId);
          job.record.outputs[job.chunkIndex] = text;
          if (state.preprocessRun) {
            state.preprocessRun.completedChunks += 1;
            state.preprocessRun.preview = "";
            state.preprocessRun.statusText = `分块 ${state.preprocessRun.completedChunks}/${state.preprocessRun.totalChunks} · 并发 ${settings.concurrency}`;
            renderAiResultTabs();
          }
        });
      }

      for (const record of prepared) {
        if (record.cached) continue;
        const text = stitchPreprocessChunks(record.chunks, record.outputs);
        record.item.preprocessedText = text;
        record.item.preprocessCacheKey = record.cacheKey;
        persistentCacheWrite(record.cacheKey, {
          text,
          bvid: record.item.bvid,
          page: record.item.page || 1,
          model: cfg.model,
          chunkSettings: settings,
          chunkCount: record.chunks.length,
        }, PREPROCESS_CACHE_TTL_MS).catch(() => {});
      }

      state.preprocessRun.raw = buildProcessedSubtitlePayload(items);
      state.preprocessRun.text = state.preprocessRun.raw;
      state.preprocessRun.cacheHits = hits;
      state.preprocessRun.status = "done";
      state.preprocessRun.statusText = `完成 · ${items.length} 个视频 · ${jobs.length} 个新分块 · 缓存 ${hits} · 并发 ${settings.concurrency}`;
      state.preprocessRun.busy = false;
      renderAiResultTabs();
      if (currentAiWorkbenchStage() === "preprocess" && state.aiInputView === "processed") renderPreprocessCanvas().catch(() => {});
      return state.preprocessRun.raw;
    } catch (error) {
      const userStopped = !!state.aiAbort || !!runtime.abort;
      runtime.abort = true; // 任一分块最终失败后停止其余 worker，避免继续消耗 API。
      for (const child of state.preprocessRun?.childRuntimes || []) abortPreprocessChildRuntime(child);
      state.preprocessRun.status = userStopped ? "stopped" : "error";
      state.preprocessRun.statusText = userStopped ? "已停止" : `失败 · ${String(error?.message || error).slice(0, 80)}`;
      state.preprocessRun.busy = false;
      renderAiResultTabs();
      throw error;
    }
  }

  async function selectPreprocessResult() {
    const run = state.preprocessRun;
    if (!run) return;
    if (state.ui) state.ui.aiStage = "preprocess";
    state.aiInputView = "processed";
    applyAiWorkbenchStageUi();
    state.aiViewingPreprocess = true;
    state.renderEpoch += 1;
    state.aiStickBottom = !!run.busy;
    state.aiUserReading = !run.busy;
    renderAiResultTabs();
    const text = run.raw || run.preview || "";
    if (run.busy) paintAiStreamText(text || "正在规范化字幕…");
    else if (text) await renderAiMarkdown(text, { streaming: false });
    else {
      const content = ensurePanel().querySelector('[data-role="ai-content"]');
      if (content) content.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">◌</div><strong>预处理稿</strong><span>${escapeHtml(run.statusText || "暂无内容")}</span></div>`;
    }
    setStatus(`预处理 · ${run.promptName || "字幕规范化"} · ${run.statusText || run.status}`, run.status === "error" ? "err" : run.status === "done" ? "ok" : undefined);
  }

  function buildAiMessagesForProfile(_cfg, vars, promptProfile) {
    const prompt = promptProfile ? createPromptProfile(promptProfile, 0) : null;
    if (!prompt) return [];
    const system = renderPromptTemplate(prompt.systemPrompt, vars).trim();
    const user = renderPromptTemplate(prompt.userPromptTemplate, vars).trim();
    return [
      system ? { role: "system", content: system } : null,
      user ? { role: "user", content: user } : null,
    ].filter(Boolean);
  }

  function isCurrentAiRun(run) {
    return !!run && state.aiRuns.get(run.id) === run;
  }

  function updateAiRun(run, patch) {
    Object.assign(run, patch || {});
    // 单模型重试会以同一标签 ID 替换运行对象。旧请求即使稍后回调，也不得覆盖新结果。
    if (!isCurrentAiRun(run)) return;
    if (run.id === state.aiActiveRunId) syncActiveRunBridge(run);
    renderAiResultTabs();
    setAiBusy(anyAiRunBusy());
  }

  async function runAiProfile(run, vars, promptProfile, commonMeta) {
    const cfg = run.config;
    run.abort = false;
    updateAiRun(run, {
      busy: true,
      status: "running",
      statusText: `正在连接 · max_tokens=${cfg.maxTokens}`,
      startedAt: Date.now(),
      sourceBvids: [...commonMeta.sourceBvids],
    });
    const messages = buildAiMessagesForProfile(cfg, vars, promptProfile);
    if (!messages.length) {
      updateAiRun(run, { busy: false, status: "error", statusText: "提示词为空", error: "当前提示词没有可发送内容" });
      return run;
    }
    const useStream = cfg.stream !== false;

    try {
      await new Promise((resolve, reject) => {
        requestChatCompletion({
          runtime: run,
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey,
          model: cfg.model,
          temperature: cfg.temperature,
          maxTokens: cfg.maxTokens,
          messages,
          stream: useStream,
          onStatus(msg) {
            if (!isCurrentAiRun(run)) return;
            run.statusText = msg;
            if (run.id === state.aiActiveRunId) setStatus(`${run.promptName || "产物"} · ${cfg.name || cfg.model} · ${msg}`);
            renderAiResultTabs();
          },
          onDelta(_delta, full) {
            if (!isCurrentAiRun(run)) return;
            run.raw = sanitizeMermaidTimestampCitationsInMarkdown(full);
            if (run.id === state.aiActiveRunId) {
              syncActiveRunBridge(run);
              if (currentAiWorkbenchStage() === "postprocess") paintAiStreamText(run.raw);
            }
          },
          onDone(full) {
            if (isCurrentAiRun(run)) {
              run.raw = sanitizeMermaidTimestampCitationsInMarkdown(full || run.raw || "");
            }
            resolve(isCurrentAiRun(run) ? run.raw : "");
          },
          onError(err) {
            reject(err instanceof Error ? err : new Error(String(err || "AI 请求失败")));
          },
        });
      });

      if (!isCurrentAiRun(run)) return run;
      if (run.abort || state.aiAbort) {
        if (run.raw && !/\*\(已停止\)\*\s*$/.test(run.raw)) run.raw += "\n\n*(已停止)*";
        updateAiRun(run, { busy: false, status: "stopped", statusText: "已停止", finishedAt: Date.now() });
      } else {
        updateAiRun(run, {
          busy: false,
          status: "done",
          statusText: `完成 · ${run.raw.length} 字符`,
          finishedAt: Date.now(),
        });
      }
    } catch (error) {
      if (!isCurrentAiRun(run)) return run;
      const message = String(error?.message || error || "未知错误");
      if (run.abort || state.aiAbort || /用户停止|abort/i.test(message)) {
        if (run.raw && !/\*\(已停止\)\*\s*$/.test(run.raw)) run.raw += "\n\n*(已停止)*";
        updateAiRun(run, { busy: false, status: "stopped", statusText: "已停止", finishedAt: Date.now() });
      } else {
        run.error = message;
        if (run.raw) run.raw += `\n\n> 错误：${message}`;
        updateAiRun(run, { busy: false, status: "error", statusText: `失败 · ${message.slice(0, 80)}`, finishedAt: Date.now() });
        console.error(`[bili-subbatch] ai ${cfg.name || cfg.model}`, error);
      }
    }

    if (isCurrentAiRun(run) && run.id === state.aiActiveRunId) {
      syncActiveRunBridge(run);
      if (currentAiWorkbenchStage() === "postprocess") {
        if (run.raw) await renderAiMarkdown(run.raw, { streaming: false });
        else await selectAiRun(run.id);
      }
    }
    return run;
  }

  async function doAiAnalyze(options = {}) {
    if (state.aiBusy) {
      setStatus("已有 AI 批次仍在生成；再次点击“送去 AI”可选择停止并重新分析", "err");
      return;
    }
    if (operationBusy()) {
      state.pendingAiSend = true;
      setStatus("扫描或字幕任务仍在运行 · 已排队，结束后自动送入 AI");
      return;
    }
    const root = ensurePanel();

    // 必须先读取当前表单，再切换工作区。否则旧实现会用存储值覆盖刚输入的 Key / maxTokens。
    let profiles;
    try {
      profiles = saveAiProfilesFromForm();
    } catch (_) {
      profiles = loadAiProfiles();
      state.aiProfiles = profiles;
    }
    let promptLibrary;
    try {
      promptLibrary = savePromptProfilesFromForm({ activeId: state.activePromptId });
    } catch (_) {
      promptLibrary = loadPromptProfiles();
    }
    const preprocessPrompt = promptLibrary.prompts.find((p) => p.id === state.activePrePromptId && p.stage === "preprocess") || null;
    if (state.preprocessEnabled && (!preprocessPrompt || (!preprocessPrompt.systemPrompt.trim() && !preprocessPrompt.userPromptTemplate.trim()))) {
      setStatus("输入整理已开启，但没有可用的 PRE Prompt", "err");
      setWorkspace("settings");
      return;
    }
    toggleAiPanel(true);
    const configuredTasks = savePostTasks(currentPostTasks()).filter((t) => t.enabled !== false);
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const taskPlans = configuredTasks.map((task) => {
      const prompt = promptLibrary.prompts.find((p) => p.id === task.promptId && p.stage === "postprocess") || null;
      const models = (task.modelIds || []).map((id) => profileMap.get(id)).filter((p) => p?.enabled);
      return { task, prompt, models };
    }).filter((plan) => plan.prompt && (plan.prompt.systemPrompt.trim() || plan.prompt.userPromptTemplate.trim()) && plan.models.length);
    if (!taskPlans.length) {
      setStatus("当前处理方案没有可运行的产物：请为至少一个 POST Prompt 选择已启用的 LLM", "err");
      setAiDrawer("flow");
      return;
    }
    const usedProfiles = Array.from(new Map(taskPlans.flatMap((p) => p.models).map((m) => [m.id, m])).values());
    const invalid = usedProfiles.filter((x) => !x.apiKey || !x.baseUrl || !x.model);
    if (invalid.length) {
      setStatus(`以下产物引用的 LLM 配置不完整：${invalid.map((x) => x.name || x.model).join("、")}`, "err");
      setWorkspace("settings");
      setSettingsTab("llm");
      return;
    }

    const preprocessConfig = state.preprocessEnabled ? getPreprocessModelConfig(profiles) : null;
    if (state.preprocessEnabled && !preprocessConfig) {
      setStatus("预处理已开启，但没有可用的 LLM 配置", "err");
      setWorkspace("settings");
      return;
    }

    const explicitTargets = Array.isArray(options.targets) ? options.targets.filter(Boolean) : null;
    let targets = explicitTargets ? [...explicitTargets] : selectedItems();
    if (!targets.length && !explicitTargets) {
      if (!state.items.length) {
        try { await doScan(); } catch (_) { /* noop */ }
      }
      targets = selectedItems();
    }
    if (options.expectedRouteKey && currentRouteVideoKey() !== options.expectedRouteKey) return;
    if (!targets.length) {
      setStatus("请先扫描并勾选要分析的视频", "err");
      return;
    }

    state.aiAbort = false;
    state.aiRuns = new Map();
    state.aiRunOrder = [];
    state.aiActiveRunId = "";
    state.preprocessRun = null;
    state.aiViewingPreprocess = false;
    const sessionId = ++state.aiSessionSeq;
    for (const plan of taskPlans) {
      for (const profile of plan.models) {
        const run = createAiRun(profile, sessionId, plan.task, plan.prompt);
        state.aiRuns.set(run.id, run);
        state.aiRunOrder.push(run.id);
      }
    }
    state.aiActiveTaskId = taskPlans[0]?.task?.id || "";
    state.aiActiveRunId = state.aiRunOrder.find((id) => state.aiRuns.get(id)?.taskId === state.aiActiveTaskId) || state.aiRunOrder[0] || "";
    syncActiveRunBridge(getActiveAiRun());
    renderAiResultTabs();
    setAiBusy(true);
    setStatus(`准备输入 · ${taskPlans.length} 个产物 · ${state.aiRunOrder.length} 个模型版本…`);

    const contentHost = root.querySelector('[data-role="ai-content"]');
    if (contentHost && currentAiWorkbenchStage() === "postprocess") {
      contentHost.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">◌</div><strong>正在准备后处理输入…</strong><span>${state.preprocessEnabled ? "字幕只规范化一次，然后共享给" : "原始字幕将直接发送给"} ${taskPlans.length} 个后处理产物</span></div>`;
    } else if (currentAiWorkbenchStage() === "preprocess") {
      await renderPreprocessCanvas();
    }

    try {
      const ready = await ensureSubtitlesForAi(targets);
      if (options.expectedRouteKey && currentRouteVideoKey() !== options.expectedRouteKey) throw new Error("页面已切换到其他视频");
      if (!ready.length) {
        state.aiRunOrder.forEach((id) => {
          const run = state.aiRuns.get(id);
          if (run) updateAiRun(run, { busy: false, status: "error", statusText: "无可用字幕", error: "勾选项均无字幕" });
        });
        setStatus("勾选项均无字幕，无法发送 AI", "err");
        return;
      }
      if (state.aiAbort) throw new Error("用户停止");

      const rawBuilt = buildSubtitlePayload(ready);
      const first = ready[0];
      const sourceBvids = ready.map((x) => x.bvid).filter(Boolean);
      let stageInput = rawBuilt;
      if (state.preprocessEnabled) {
        setStatus(`阶段 1/2 · 字幕预处理 · ${preprocessPrompt.name} · ${preprocessConfig.name || preprocessConfig.model}`);
        stageInput = await preprocessItemsForAi(ready, preprocessPrompt, preprocessConfig);
        if (state.aiAbort) throw new Error("用户停止");
      }
      const cut = truncateForAi(stageInput, MAX_SUBTITLE_CHARS);
      const vars = {
        title: ready.map((x) => x.title).filter(Boolean).join(" / ") || first.title || "",
        bvid: ready.map((x) => x.bvid).join(", "),
        author: first.author || "",
        subtitle: cut.text,
        rawSubtitle: rawBuilt,
        processedSubtitle: state.preprocessEnabled ? stageInput : "",
      };
      const commonMeta = {
        sourceBvids,
        truncated: cut.truncated,
        readyCount: ready.length,
        preprocessEnabled: !!state.preprocessEnabled,
        preprocessPromptName: preprocessPrompt?.name || "",
        preprocessModelName: preprocessConfig?.name || preprocessConfig?.model || "",
      };
      state.aiSessionInput = cloneAiSessionInput({
        sessionId,
        vars,
        taskSnapshots: taskPlans.map((plan) => ({ task: { ...plan.task, modelIds: [...(plan.task.modelIds || [])] }, prompt: { ...plan.prompt } })),
        preprocessPrompt: preprocessPrompt ? { ...preprocessPrompt } : null,
        preprocessConfig: preprocessConfig ? { ...preprocessConfig } : null,
        preprocessEnabled: !!state.preprocessEnabled,
        commonMeta,
      }, sessionId);
      state.aiRunOrder.forEach((id) => {
        const run = state.aiRuns.get(id);
        if (run) run.sourceBvids = [...sourceBvids];
      });
      state.aiViewingPreprocess = false;
      renderAiResultTabs();
      renderAiInputDrawer();
      refreshAiChips();
      if (currentAiWorkbenchStage() === "preprocess") await renderPreprocessCanvas();
      setStatus(`开始生成 · ${taskPlans.length} 个产物 · ${state.aiRunOrder.length} 个版本 · ${ready.length} 条字幕${cut.truncated ? " · 输入已截断" : ""}`);

      await Promise.allSettled(state.aiRunOrder.map((id) => {
        const run = state.aiRuns.get(id);
        return runAiProfile(run, vars, run.promptProfile, commonMeta);
      }));
      if (sessionId === state.aiSessionSeq) summarizeAiRuns("全部产物生成结束");
    } catch (error) {
      const message = String(error?.message || error);
      if (sessionId === state.aiSessionSeq) {
        if (!state.aiAbort) setStatus(`AI 准备失败: ${message}`, "err");
        abortAllAiRuns();
        state.aiRunOrder.forEach((id) => {
          const run = state.aiRuns.get(id);
          if (!run || ["done", "error", "stopped"].includes(run.status)) return;
          updateAiRun(run, {
            busy: false,
            status: state.aiAbort ? "stopped" : "error",
            statusText: state.aiAbort ? "已停止" : `准备失败 · ${message.slice(0, 80)}`,
            error: state.aiAbort ? "" : message,
          });
        });
      }
    } finally {
      // 这里只同步当前真实运行状态。单模型重试可能已替换某个运行实例，
      // 原始批次的 finally 绝不能把新实例标记为“未完成”或解除其 busy。
      if (sessionId === state.aiSessionSeq) {
        setAiBusy(anyAiRunBusy());
        if (!anyAiRunBusy()) state.aiAbort = false;
        if (state.aiPaintRaf) { cancelAnimationFrame(state.aiPaintRaf); state.aiPaintRaf = 0; }
        if (state.aiPaintTimer) { clearTimeout(state.aiPaintTimer); state.aiPaintTimer = 0; }
      }
    }
  }

  function validateCtxForScan(ctx) {
    if (ctx.type === "video" || ctx.type === "selection") {
      if (!ctx.bvid) {
        throw new Error("缺少 BV 号。请打开视频页，或切到「单个视频/视频选集」后重试");
      }
    } else if (ctx.type === "user") {
      if (!ctx.mid) {
        throw new Error("缺少 mid。请打开个人主页，或模式选「个人主页」");
      }
    } else if (ctx.type === "collection") {
      if (!ctx.mid || !ctx.season_id) {
        throw new Error(
          "合集需要 mid + season_id。请打开合集页（space/lists 或 /list/{mid}?sid=），或从下拉切到「合集」",
        );
      }
    } else if (ctx.type === "favorite") {
      if (!ctx.media_id) {
        throw new Error("收藏夹需要 fid/media_id。请打开带 fid 的收藏夹页");
      }
    } else if (ctx.type === "search") {
      if (!ctx.keyword) {
        throw new Error("搜索需要 keyword。请打开搜索结果页");
      }
    } else if (ctx.type === "unknown") {
      throw new Error(
        "未能识别页面。可手动选择模式：单个视频 / 视频选集 / 个人主页 / 收藏夹 / 合集 / 搜索页",
      );
    }
  }

  async function doScan() {
    if (state.scanBusy) {
      state.cancelScan = true;
      state.pendingRescan = true;
      setStatus("当前扫描仍在运行 · 正在停止，随后自动重新扫描");
      return;
    }
    if (state.batchBusy) {
      state.cancel = true;
      state.cancelBatch = true;
      state.pendingRescan = true;
      setStatus("字幕任务仍在运行 · 正在停止，随后自动扫描当前页");
      return;
    }
    const scanId = ++state.scanSeq;
    refreshContextUI();
    const ctx = resolveContext();
    state.ctx = ctx;
    state.cancel = false;
    state.cancelScan = false;
    setScanBusy(true);
    setStatus("扫描中…");
    try {
      const root = ensurePanel();
      state.maxPages = Math.max(
        1,
        Math.min(100, Number(root.querySelector('[data-role="max-pages"]').value) || DEFAULT_MAX_PAGES),
      );
      state.delayMs = Math.max(
        0,
        Math.min(5000, Number(root.querySelector('[data-role="delay"]').value) || DEFAULT_DELAY_MS),
      );

      validateCtxForScan(ctx);

      let items = [];
      let meta = {};

      // 单个视频 = 当前分P；视频选集 = 展开全部分P
      if (ctx.type === "video" || ctx.type === "selection") {
        const bvid = ctx.bvid || extractBvid(location.href);
        if (!bvid) throw new Error("未识别 BV 号");
        const expandParts = ctx.type === "selection";
        setStatus(
          expandParts
            ? `读取选集 ${bvid}（全部分P）…`
            : `读取单个视频 ${bvid}${ctx.page > 1 ? " P" + ctx.page : ""}…`,
        );
        const loaded = await loadVideoAsItems(bvid, expandParts);
        // 单个视频：只保留当前 p（loadVideoAsItems 非 expand 时已是 1 条；
        // 若 expand=false 但我们要当前 p，需按 page 取）
        if (!expandParts) {
          const page = ctx.page || 1;
          if (loaded.pages && loaded.pages.length && page > 1) {
            // 重新按指定分P构造一条
            const part = loaded.pages[page - 1];
            items = [
              {
                bvid,
                aid: loaded.items[0]?.aid,
                title: part
                  ? `${loaded.meta?.title || bvid} - P${page}【${part.part || ""}】`
                  : loaded.meta?.title || bvid,
                author: loaded.meta?.author || "",
                page,
                part: part?.part || "",
              },
            ];
          } else {
            items = loaded.items.map((it) => ({ ...it, page: page || 1 }));
          }
        } else {
          items = loaded.items;
        }
        meta = loaded.meta || {};
        if (meta.multip && ctx.type === "video") {
          meta.hint = "多分P视频：可切换模式「视频选集」拉全部分P";
        }
      } else if (
        ctx.type === "user" ||
        ctx.type === "favorite" ||
        ctx.type === "collection" ||
        ctx.type === "search"
      ) {
        const pageSize =
          ctx.type === "favorite" ? 20 : ctx.type === "search" ? 42 : 30;
        const res = await loadAllListItems(ctx, {
          maxPages: state.maxPages,
          pageSize,
          delayMs: Math.min(state.delayMs, 400),
          onProgress: (t) => setStatus(t),
          shouldCancel: () => state.cancelScan || scanId !== state.scanSeq,
        });
        items = res.items;
        meta = res.meta || {};
        if (res.truncated) meta.truncated = true;
      } else {
        const fromDom = harvestBvidsFromDom();
        if (fromDom.length) {
          items = fromDom.map((b) => ({
            bvid: b,
            title: b,
            author: "",
            page: 1,
          }));
          meta = { fromDom: true };
        } else {
          throw new Error(
            "当前页未识别。请手动选择模式，或确认 URL 含 BV/mid/fid/keyword",
          );
        }
      }

      if (state.cancelScan || scanId !== state.scanSeq) {
        const error = new Error("扫描已取消");
        error.name = "AbortError";
        throw error;
      }

      const modeTag =
        ctx.source === "manual"
          ? `手动·${TYPE_LABEL[ctx.type]}`
          : `自动·${TYPE_LABEL[ctx.type]}`;
      const sourceLabel = String(meta.name || meta.title || meta.keyword || modeTag);
      const existingByKey = new Map(
        state.items.map((item) => [routeVideoKey(item.bvid, item.page || 1), item]),
      );
      let added = 0;
      let existed = 0;
      for (const raw of items) {
        const key = routeVideoKey(raw.bvid, raw.page || 1);
        const previous = existingByKey.get(key);
        if (previous) {
          existed += 1;
          // 更新标题等轻量元数据，但绝不抹掉已抓取字幕与用户选择状态。
          previous.title = raw.title || previous.title;
          previous.author = raw.author || previous.author;
          previous.aid = raw.aid ?? previous.aid;
          previous.part = raw.part ?? previous.part;
          previous.sources = Array.from(new Set([...(previous.sources || []), sourceLabel].filter(Boolean)));
          continue;
        }
        const next = {
          ...raw,
          selected: true,
          subStatus: "wait",
          cue_count: 0,
          data: null,
          error: "",
          sources: sourceLabel ? [sourceLabel] : [],
        };
        state.items.push(next);
        existingByKey.set(key, next);
        added += 1;
      }
      state.meta = meta;
      state.captureDrawerOpen = false;
      const drawer = ensurePanel().querySelector('[data-role="capture-drawer"]');
      if (drawer) drawer.hidden = true;
      renderList();
      refreshContextUI();
      const trunc = meta.truncated ? "（已达页数上限，可调大「最多页」）" : "";
      let msg = `[${modeTag}] 扫描 ${items.length} 条 · 新增 ${added} · 已存在 ${existed}${trunc}`;
      if (meta.hint) msg += ` · ${meta.hint}`;
      setStatus(msg, "ok");
      if (meta.name || meta.title || meta.keyword) {
        const label = meta.name || meta.title || meta.keyword;
        const ctxEl = ensurePanel().querySelector('[data-role="ctx"]');
        if (ctxEl && !ctxEl.textContent.includes(String(label))) {
          ctxEl.textContent += ` · ${label}`;
        }
      }
    } catch (e) {
      if (e?.name === "AbortError" || state.cancelScan) {
        setStatus(state.pendingRescan ? "旧扫描已停止 · 准备重新扫描…" : "扫描已停止");
      } else {
        console.error("[bili-subbatch] scan", e);
        setStatus(`扫描失败: ${e.message || e}`, "err");
      }
    } finally {
      if (scanId === state.scanSeq) {
        state.cancelScan = false;
        setScanBusy(false);
        flushPendingMainAction();
      }
    }
  }

  function harvestBvidsFromDom() {
    const seen = new Set();
    const out = [];
    document.querySelectorAll('a[href*="/video/BV"]').forEach((a) => {
      const b = extractBvid(a.getAttribute("href") || a.href || "");
      if (b && !seen.has(b)) {
        seen.add(b);
        out.push(b);
      }
    });
    return out;
  }

  async function doBatch(act) {
    if (state.batchBusy) {
      setStatus("已有字幕任务正在运行；可点击“停止”后重试", "err");
      return;
    }
    if (state.scanBusy) {
      setStatus("当前页仍在扫描；扫描完成后再执行字幕下载/复制", "err");
      return;
    }
    const batchId = ++state.batchSeq;
    let targets =
      act === "dl-ok-only"
        ? state.items.filter((it) => it.selected && it.subStatus === "ok" && it.data)
        : selectedItems();
    if (!targets.length) {
      setStatus(act === "dl-ok-only" ? "没有已成功的勾选项" : "请先勾选视频", "err");
      return;
    }

    state.cancel = false;
    state.cancelBatch = false;
    setBatchBusy(true);
    // copy / download / fetch-selected 都会在缺字幕时补抓。
    const needData = act !== "copy-bvid";

    let ok = 0,
      empty = 0,
      err = 0;
    const delay = state.delayMs;

    try {
      for (let i = 0; i < targets.length; i++) {
        if (state.cancelBatch || state.cancel) {
          setStatus(`已停止 · 完成 ${i}/${targets.length}`, "err");
          break;
        }
        const it = targets[i];
        setStatus(`字幕 ${i + 1}/${targets.length} · ${it.bvid}${it.page > 1 ? " P" + it.page : ""}…`);

        if (needData && (!it.data || it.subStatus !== "ok")) {
          try {
            const r = await fetchSubtitle(it.bvid, it.page || 1);
            it.subStatus = r.status;
            it.cue_count = r.cue_count || 0;
            it.data = r.data || null;
            it.error = r.error || "";
            it.lan = r.lan || "";
            if (!it.title && r.title) it.title = r.title;
            if (!it.author && r.author) it.author = r.author;
            if (r.status === "ok") ok++;
            else if (r.status === "empty") empty++;
            else err++;
          } catch (e) {
            it.subStatus = "error";
            it.error = e.message || String(e);
            err++;
          }
          renderList();
          if (i < targets.length - 1 && !state.cancelBatch && !state.cancel) await sleep(delay);
        } else if (it.subStatus === "ok") {
          ok++;
        }
      }

      // export after fetch (or reuse)
      const ready = targets.filter((it) => it.subStatus === "ok" && it.data?.length);
      if ((state.cancelBatch || state.cancel) && act !== "dl-ok-only") {
        // still allow export of what we have if user stopped mid-way? skip for clarity
      }

      if (act === "fetch-selected") {
        setStatus(`字幕抓取完成 · ok=${ok} empty=${empty} err=${err}`, err && !ok ? "err" : "ok");
        return;
      }

      if (act === "copy") {
        if (!ready.length) {
          setStatus(`无可用字幕 · ok=${ok} empty=${empty} err=${err}`, "err");
          return;
        }
        const text = ready
          .map((it) => {
            const head =
              ready.length > 1
                ? `=== ${it.bvid}${it.page > 1 ? " P" + it.page : ""} ${it.title || ""} ===\n`
                : "";
            return head + cuesToTxt(it.data);
          })
          .join("\n\n");
        clipboardWrite(text);
        setStatus(`已复制 ${ready.length} 条字幕全文`, "ok");
        return;
      }

      if (act === "dl-srt" || act === "dl-txt" || act === "dl-ok-only") {
        const ext = act === "dl-txt" ? "txt" : "srt";
        const convert = ext === "txt" ? cuesToTxt : cuesToSrt;
        const pool =
          act === "dl-ok-only"
            ? state.items.filter((it) => it.selected && it.subStatus === "ok" && it.data)
            : ready;
        if (!pool.length) {
          setStatus(`无可用字幕 · ok=${ok} empty=${empty} err=${err}`, "err");
          return;
        }
        for (let i = 0; i < pool.length; i++) {
          const it = pool[i];
          const base = safeFilename(
            `${it.bvid}${it.page > 1 ? "_P" + String(it.page).padStart(2, "0") : ""}_${it.title || "sub"}`,
          );
          downloadText(`${base}.${ext}`, convert(it.data));
          if (pool.length > 1) await sleep(200);
        }
        setStatus(
          `已下载 ${pool.length} 个 ${ext.toUpperCase()} · 抓取 ok=${ok} empty=${empty} err=${err}`,
          "ok",
        );
      }
    } catch (e) {
      console.error("[bili-subbatch] batch", e);
      setStatus(`失败: ${e.message || e}`, "err");
    } finally {
      if (batchId === state.batchSeq) {
        state.cancelBatch = false;
        state.cancel = false;
        setBatchBusy(false);
        renderList();
        flushPendingMainAction();
      }
    }
  }

  /**
   * 字幕抓取成功后的自动分析调度：
   * - 默认开启，行为等同点击“开始分析”；
   * - 同一路由只自动触发一次；
   * - stale revalidate / 静默刷新不重复分析；
   * - AI 配置尚未完成时等待用户保存配置，保存后自动续跑。
   */
  function scheduleAutoAnalyze(item, captureKey, reason = "capture", delay = AUTO_ANALYZE_DELAY_MS) {
    if (!state.autoAnalyzeEnabled || !item || item.subStatus !== "ok" || !item.data?.length) return;
    const key = captureKey || routeVideoKey(item.bvid, item.page || 1);
    if (!key || state.autoAnalyzeKey === key || state.autoAnalyzePendingKey === key) return;

    const readyProfiles = enabledAiProfiles({ requireReady: true });
    if (!readyProfiles.length) {
      setStatus(`已抓取 ${item.cue_count || item.data.length} 条字幕 · 保存并启用至少一个完整 AI 配置后将自动分析`, "ok");
      return;
    }

    clearTimeout(state.autoAnalyzeTimer);
    state.autoAnalyzePendingKey = key;
    state.autoAnalyzeTimer = window.setTimeout(async () => {
      state.autoAnalyzePendingKey = "";
      if (!state.autoAnalyzeEnabled || state.autoAnalyzeKey === key) return;

      if (currentRouteVideoKey() !== key) return;
      const target =
        state.items.find((x) => routeVideoKey(x.bvid, x.page || 1) === key) ||
        (routeVideoKey(state.transcriptItem?.bvid, state.transcriptItem?.page || 1) === key
          ? state.transcriptItem
          : null);
      if (!target || target.subStatus !== "ok" || !target.data?.length) return;

      // 同一视频的一次分析内部会并发运行多个配置；不同视频会话仍串行，避免结果互相覆盖。
      if (state.aiBusy) {
        scheduleAutoAnalyze(target, key, reason, 500);
        return;
      }

      state.autoAnalyzeKey = key;
      setStatus(`字幕已就绪 · 正在自动开始分析（${reason}）…`);
      try {
        await doAiAnalyze({ targets: [target], expectedRouteKey: key, automatic: true });
      } catch (error) {
        // doAiAnalyze 内部通常已处理错误；这里只防止未捕获异常污染页面。
        console.warn("[bili-subbatch] auto analyze", error);
      }
    }, Math.max(0, Number(delay) || 0));
  }

  function abortAiForAutoNavigation(nextRouteKey = "") {
    // 即使上一批已经生成结束，也必须让旧视频的输入/预处理稿立即失效。
    // 否则 B 站 SPA 换视频时抽屉会继续展示第一个视频的规范化稿。
    state.aiSessionSeq += 1;
    if (state.aiBusy) {
      state.aiAbort = true;
      abortAllAiRuns();
    }
    state.aiSessionInput = null;
    state.preprocessRun = null;
    state.aiViewingPreprocess = false;
    state.aiRuns = new Map();
    state.aiRunOrder = [];
    state.aiActiveRunId = "";
    state.aiActiveTaskId = "";
    state.aiRaw = "";
    state.aiRenderedText = "";
    state.aiPendingText = "";
    state.knowledgeRailOpen = false;
    hideKnowledgeSelectionToolbar();
    renderKnowledgeRail().catch(() => {});
    setAiBusy(false);
    renderAiResultTabs();
    renderAiInputDrawer();
    refreshAiChips();
    if (currentAiWorkbenchStage() === "preprocess") renderPreprocessCanvas().catch(() => {});
    const root = document.getElementById(PANEL_ID);
    const content = root?.querySelector('[data-role="ai-content"]');
    if (content && currentAiWorkbenchStage() !== "preprocess") {
      content.innerHTML = `<div class="bsb-empty"><div class="bsb-empty-ico">◌</div><strong>当前视频已切换</strong><span>${nextRouteKey ? escapeHtml(nextRouteKey) + " · " : ""}正在读取当前字幕，旧视频 AI 结果已解除绑定</span></div>`;
    }
  }

  function scheduleAutoCapture(reason, delay = AUTO_CAPTURE_DELAY_MS) {
    clearTimeout(state.autoCaptureTimer);
    if (!state.autoCaptureEnabled || document.hidden) return;
    state.autoCaptureTimer = window.setTimeout(() => {
      autoCaptureCurrentVideo(reason).catch((error) => {
        if (error?.name !== "AbortError") {
          console.warn("[bili-subbatch] auto capture", error);
        }
      });
    }, Math.max(0, Number(delay) || 0));
  }

  async function autoCaptureCurrentVideo(reason = "route", options = {}) {
    if (!state.autoCaptureEnabled && !options.forceNetwork) return;
    const ctx = detectContext(location.href);
    const routeRef = options.requestedBvid ? null : currentRouteVideoRef();
    const bvid = options.requestedBvid || routeRef?.bvid || ctx.bvid;
    if (!bvid) return;
    const page = Math.max(1, Number(options.requestedPage || routeRef?.page || ctx.page || currentPageNumber()) || 1);
    const captureKey = routeVideoKey(bvid, page);
    const existing = state.items.find(
      (item) => routeVideoKey(item.bvid, item.page || 1) === captureKey,
    ) || (
      state.transcriptItem &&
      routeVideoKey(state.transcriptItem.bvid, state.transcriptItem.page || 1) === captureKey
        ? state.transcriptItem
        : null
    );
    if (!options.forceNetwork && state.autoCaptureKey === captureKey && ["ok", "empty"].includes(existing?.subStatus)) {
      if (existing?.subStatus === "ok") selectTranscriptItem(existing);
      return;
    }

    const epoch = ++state.autoCaptureEpoch;
    state.autoCaptureAbortController?.abort();
    const controller = new AbortController();
    state.autoCaptureAbortController = controller;
    state.autoCaptureKey = captureKey;

    const placeholder = options.silent && existing
      ? { ...existing }
      : {
          bvid,
          title: document.title.replace(/_哔哩哔哩_bilibili$/i, "") || bvid,
          author: "",
          page,
          selected: true,
          subStatus: "wait",
          cue_count: 0,
          data: null,
          error: "",
          autoCaptured: true,
        };
    if (!options.silent) {
      rememberTranscriptItem(placeholder);
      // 资源库语义：打开视频只新增/更新当前 BV+P，不覆盖之前采集的合集或收藏夹。
      const placeholderIndex = state.items.findIndex(
        (entry) => routeVideoKey(entry.bvid, entry.page || 1) === captureKey,
      );
      if (placeholderIndex >= 0) {
        const existingItem = state.items[placeholderIndex];
        Object.assign(existingItem, {
          title: placeholder.title || existingItem.title,
          author: placeholder.author || existingItem.author,
          autoCaptured: true,
        });
        rememberTranscriptItem(existingItem);
      } else {
        placeholder.sources = ["打开视频"];
        state.items.push(placeholder);
      }
      state.meta = { autoCaptured: true, reason };
      renderList();
      refreshContextUI();
      setStatus(`自动读取 ${bvid}${page > 1 ? " P" + page : ""} 字幕…`);
    }

    let result = null;
    let fastError = null;
    try {
      result = await fetchCurrentSubtitleFast(bvid, page, controller.signal, { forceNetwork: !!options.forceNetwork });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      fastError = error;
    }

    // 快速接口无轨道、受限或发生变化时，继续使用原脚本的完整 WBI/DM/AI 回退链。
    if (!result || result.status !== "ok") {
      if (controller.signal.aborted) throw new DOMException("操作已取消", "AbortError");
      try {
        result = await fetchSubtitle(bvid, page);
        if (result && result.status === "ok") result.source = "robust_fallback";
      } catch (error) {
        if (!result) result = { bvid, page, status: "error", error: error.message || String(error) };
      }
    }

    if (epoch !== state.autoCaptureEpoch || controller.signal.aborted) return;
    if (currentRouteVideoKey() !== captureKey) return;

    const item = {
      ...placeholder,
      bvid: result?.bvid || bvid,
      aid: result?.aid || null,
      cid: result?.cid || null,
      title: result?.title || placeholder.title,
      author: result?.author || "",
      page: result?.page || page,
      pages: result?.pages || [],
      selected: true,
      subStatus: result?.status || "error",
      cue_count: result?.cue_count || 0,
      data: result?.data || null,
      error: result?.error || fastError?.message || "",
      lan: result?.lan || "",
      lan_doc: result?.lan_doc || "",
      tracks: result?.tracks || placeholder.tracks || [],
      activeTrackIndex: Number.isInteger(result?.activeTrackIndex) ? result.activeTrackIndex : (placeholder.activeTrackIndex ?? -1),
      cachePath: result?.cachePath || "",
      cacheLevel: result?.cacheLevel || "",
      cacheStale: !!result?.cacheStale,
      source: result?.source || (fastError ? "fast_failed" : "fast"),
      autoCaptured: true,
    };
    rememberTranscriptItem(item);
    const sameIndex = state.items.findIndex(
      (entry) => routeVideoKey(entry.bvid, entry.page || 1) === captureKey,
    );
    if (sameIndex >= 0) {
      const target = state.items[sameIndex];
      target.title = item.title || target.title;
      target.author = item.author || target.author;
      target.aid = item.aid ?? target.aid;
      target.cid = item.cid ?? target.cid;
      target.pages = item.pages || target.pages;
      target.sources = Array.from(new Set([...(target.sources || []), "打开视频"].filter(Boolean)));
      copySubtitleState(target, item);
      state.transcriptItem = target;
      state.transcriptItemKey = captureKey;
    } else {
      item.sources = Array.from(new Set([...(item.sources || []), "打开视频"]));
      state.items.push(item);
      rememberTranscriptItem(item);
    }
    state.meta = {
      autoCaptured: true,
      title: item.title,
      author: item.author,
      source: item.source,
    };
    renderList();
    bindTranscriptVideoEvents();

    if (item.subStatus === "ok") {
      if (state.autoEnablePlayerSubtitle) {
        window.setTimeout(() => enablePlayerSubtitle(item).catch(() => {}), 280);
      }
      setStatus(`已自动抓取 ${item.cue_count} 条字幕 · ${item.cachePath || item.cacheLevel || item.source}`, "ok");
      // 静默的 stale-while-revalidate 只更新字幕缓存，不重复消耗一次 AI 请求。
      if (!options.silent && reason !== "stale-revalidate") {
        scheduleAutoAnalyze(item, captureKey, reason);
      }
      if (item.cacheStale && !options.forceNetwork) {
        window.setTimeout(() => {
          if (currentRouteVideoKey() === captureKey) {
            autoCaptureCurrentVideo("stale-revalidate", { forceNetwork: true, silent: true, requestedBvid: item.bvid, requestedPage: item.page }).catch(() => {});
          }
        }, 80);
      }
    } else if (item.subStatus === "empty") {
      setStatus("当前视频没有可读取字幕", "err");
    } else {
      setStatus(`自动抓取失败: ${item.error || "未知错误"}`, "err");
    }
  }

  // ─── SPA watch ──────────────────────────────────────────────────────────
  let lastHref = location.href;
  let lastRouteVideoKey = currentRouteVideoKey();
  function onMaybeNavigate() {
    const href = location.href;
    const nextRef = currentRouteVideoRef();
    const nextVideoKey = nextRef?.key || "";
    const hrefChanged = href !== lastHref;
    const videoChanged = nextVideoKey !== lastRouteVideoKey;
    if (!hrefChanged && !videoChanged) return;
    lastHref = href;

    // 只有 BV+P 真正变化才清空 AI/字幕绑定；同一视频的无关 URL 参数变化不扰动阅读。
    if (videoChanged) {
      lastRouteVideoKey = nextVideoKey;
      state.autoCaptureAbortController?.abort();
      clearTimeout(state.autoAnalyzeTimer);
      state.autoAnalyzePendingKey = "";
      state.autoAnalyzeKey = "";
      abortAiForAutoNavigation(nextVideoKey);
      state.transcriptVideoAbort?.abort();
      state.transcriptSwitchAbort?.abort();
      state.transcriptActiveCueIndex = -1;
      state.transcriptItemKey = nextVideoKey;
      state.transcriptItem = null;
      refreshContextUI();
      renderTranscriptPanel();
      if (nextVideoKey) scheduleAutoCapture("route-change");
      return;
    }

    refreshContextUI();
  }

  function boot() {
    initCacheChannel();
    ensurePanel();
    bindGlobalShortcuts();
    refreshContextUI();
    bindTranscriptVideoEvents();
    const _push = pageWindow.history.pushState;
    const _replace = pageWindow.history.replaceState;
    pageWindow.history.pushState = function () {
      const result = _push.apply(this, arguments);
      setTimeout(onMaybeNavigate, 0);
      return result;
    };
    pageWindow.history.replaceState = function () {
      const result = _replace.apply(this, arguments);
      setTimeout(onMaybeNavigate, 0);
      return result;
    };
    pageWindow.addEventListener("popstate", onMaybeNavigate);
    pageWindow.addEventListener("hashchange", onMaybeNavigate);
    window.addEventListener("pageshow", () => {
      onMaybeNavigate();
      scheduleAutoCapture("pageshow", 120);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        onMaybeNavigate();
        scheduleAutoCapture("visible", 120);
      }
    });
    // History hook 是主路径；低频 URL 比较只为处理少数 B 站站内切换。
    setInterval(() => {
      if (document.visibilityState === "visible") onMaybeNavigate();
    }, 2000);

    // 初次打开页面也默认抓取，不要求先打开面板或点击“扫描”。
    scheduleAutoCapture("initial", 180);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
