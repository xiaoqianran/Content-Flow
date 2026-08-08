# P4 / P4.5 Userscript 真实接管

## Gate 策略

构建已拆成两条路径：

| 命令 | 产物 | 构建内容 |
| --- | --- | --- |
| `pnpm build:userscript` | `dist/userscript/subbatch.user.js` | **正式发布** — monorepo bootstrap + 完整维护版主体 |
| `pnpm build:compat-userscript` | `dist/userscript/subbatch.compat.user.js` | 正式构建的字节级别名 |
| `pnpm build:pure-userscript` | `dist/userscript/subbatch.pure.user.js` | 实验用途 — 仅 monorepo API，尚无产品 boot/UI |

- Legacy Golden Reference：`legacy/Bili-SubBatch-v6.0.2.user.js`（只读，SHA-256 校验）。
- 正式产物验证：metadata 唯一、无 runtime module 依赖、维护版主体逐字节一致、关键能力标记齐全。
- Pure 验证：不得包含完整维护版主体，也不得作为正式升级产物发布。

P4.5 目标：把生产逻辑逐步从「整包拼接 Legacy」迁移到 monorepo 模块；每迁一个模块先补 `legacy vs new` differential test，再从生产路径删除对应 legacy 实现。当 legacy body 依赖降到 0 时，P4 才算真正完成。

## 已抽取并通过差分测试（尚未全部接入产品调用链）

- Shared Content / Transcript / Artifact / Prompt / Knowledge / Job Schema（含 v6 持久化键与枚举兼容）
- PromptStage 契约：`preprocess` / `postprocess` / `knowledge`
- Shortcut Command ID 契约：`toggle-panel` / `open-processed` / `open-postprocess` / `toggle-dock`
- `renderPromptTemplate`（含 `chunkStart` / `coreStart` / `chunkEnd`）
- Bilibili route key、`detectContext`、`extractUrlHints`、字幕格式化 Pure Core
- PRE chunk / overlap / stitch / cache key Pure Core
- Prompt / Mermaid / Knowledge / shortcut Pure Core（含 editable / IME / repeat / AltGr 保护）
- Runtime Ports：Storage / Network（stream + abort）/ Clipboard / Style / Shortcut / Page(SPA) / Hub stub
- Userscript Host Adapter：SPA（pushState / replaceState / popstate / hashchange / pageshow / visibilitychange / URL poll）

## 仍由 compat body 承载（尚未从产品路径删除）

- Bilibili API / WBI 与合集扫描 orchestration
- Studio DOM / CSS UI
- 浏览器内 PRE / POST Worker Pool 与模型请求编排
- Mermaid / Markdown 第三方渲染加载
- Knowledge IndexedDB 与 Thread Tree UI
- 播放器联动、Selection Toolbar

这些模块不会一次性重写 UI；后续每次接管都必须先扩充 Golden / differential tests，再把真实调用点切到新模块、删除维护版中的旧实现。仅复制函数并不算接管。

## 迁移契约（不可破坏）

1. PromptStage 只能是 `preprocess` | `postprocess` | `knowledge`
2. Shortcut ID 必须保持 v6 持久化值，禁止 `open-ai` / `run-post` 之类改名
3. GM storage key / builtin prompt id 见 `packages/schemas/src/persistence.ts`
4. 在产品 boot/UI 完成接管前，`build:userscript` 必须保留完整维护版主体
