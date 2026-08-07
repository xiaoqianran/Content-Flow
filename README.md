# Content-Flow / SubBatch

SubBatch 将成熟的 Bili SubBatch v6.0.2 逐步迁移为可测试、可双端构建并可继续接入 Local Hub 的 Monorepo。

当前迭代严格限定在 P0～P4：冻结 Legacy、Golden Tests、Pure Core、Runtime Adapter 与新 Userscript 构建。Chrome Extension、Side Panel 和 Local Hub 尚未启动。

## 开发命令

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build:userscript
pnpm verify:dist
```

构建产物位于 `dist/userscript/subbatch.user.js`。

## Legacy 基线

`legacy/Bili-SubBatch-v6.0.2.user.js` 是只读 Golden Reference。其 SHA-256 记录在 `legacy/SHA256SUMS`，迁移期间禁止修改。

