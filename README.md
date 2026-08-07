# Content-Flow / SubBatch

SubBatch 将成熟的 Bili SubBatch v6.0.2 逐步迁移为可测试、可双端构建并可继续接入 Local Hub 的 Monorepo。

当前迭代：**P4.5 Real Userscript Takeover**。Chrome Extension、Side Panel 和 Local Hub 尚未启动。

## 开发命令

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build:userscript          # 纯 monorepo 产物（禁止完整 legacy body）
pnpm build:compat-userscript   # 安全兼容版（bootstrap + 冻结 v6 body）
pnpm verify:dist
pnpm verify:compat-dist
```

| 产物 | 路径 |
| --- | --- |
| 纯 monorepo userscript | `dist/userscript/subbatch.user.js` |
| 兼容 userscript | `dist/userscript/subbatch.compat.user.js` |

## Legacy 基线

`legacy/Bili-SubBatch-v6.0.2.user.js` 是只读 Golden Reference。其 SHA-256 记录在 `legacy/SHA256SUMS`，迁移期间禁止修改。

详见 `docs/migration/P4-userscript.md`。
