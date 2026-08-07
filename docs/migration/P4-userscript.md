# P4 Userscript 兼容构建

## Gate 策略

`dist/userscript/subbatch.user.js` 由两部分组成：

1. Vite 内联的新 Monorepo Runtime 组合根。
2. 从只读 Golden Reference 提取且逐字节不变的 v6.0.2 可执行主体。

构建前固定验证 Legacy SHA-256；产物验证再确认 metadata 唯一、无运行时模块依赖，并将兼容主体与 Legacy 逐字节比较。因此在逐模块接管完成前，现有 Studio、采集、PRE、POST、Mermaid、Knowledge、SPA 和快捷键继续走成熟实现，不因迁移丢失。

## 已迁移边界

- Shared Content / Transcript / Artifact / Prompt / Knowledge / Job Schema
- Bilibili route key、上下文识别和字幕格式化 Pure Core
- PRE chunk、overlap、stitch 和 cache key Pure Core
- Prompt、Mermaid、Knowledge、shortcut Pure Core
- Storage、Network、Clipboard、Style、Shortcut、Page、Hub Runtime Ports
- Userscript Host Adapter

## 仍由兼容主体承载

- Bilibili API/WBI 与合集扫描 orchestration
- Studio DOM/CSS UI
- 浏览器内 PRE/POST Worker Pool 与模型请求
- Mermaid/Markdown 第三方渲染加载
- Knowledge IndexedDB 与 Thread Tree UI
- SPA hook、播放器联动、Selection Toolbar

这些模块不会在 P4 一次性重写；后续每次接管都必须先扩充 Golden Tests，再移除兼容主体中的对应实现。

