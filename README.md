# Content-Flow / SubBatch

SubBatch 将成熟的 Bili SubBatch v6.0.2 逐步迁移为可测试、可双端构建并可继续接入 Local Hub 的 Monorepo。

当前迭代：**P4.5 Safe Incremental Takeover**。正式 Userscript 始终携带完整维护版行为主体；pure API bundle 仅用于迁移实验，不能替代产品。Chrome Extension、Side Panel 和 Local Hub 尚未启动。

## 开发命令

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build:userscript          # 正式完整功能版（bootstrap + 维护版 v6 body）
pnpm build:compat-userscript   # 正式构建的兼容别名
pnpm build:pure-userscript     # 实验 API bundle（尚无产品 UI/boot）
pnpm verify:dist
pnpm verify:compat-dist
```

| 产物 | 路径 |
| --- | --- |
| 正式完整功能 userscript | `dist/userscript/subbatch.user.js` |
| 正式构建兼容别名 | `dist/userscript/subbatch.compat.user.js` |
| 实验 pure API bundle | `dist/userscript/subbatch.pure.user.js` |

## Legacy 基线

`legacy/Bili-SubBatch-v6.0.2.user.js` 是来自指定外部基线的只读 Golden Reference。其 SHA-256 记录在 `legacy/SHA256SUMS`。根目录 `loop-bilibili.js` 是保留全部基线能力并承载审查后修复的维护版主体。

详见 `docs/migration/P4-userscript.md`。
