---
kind: external_dependency
name: Tailwind CSS v4 样式系统
slug: tailwind-css
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - tailwind.config.js
    - postcss.config.mjs
    - app/globals.css
---

### 样式方案
- Tailwind CSS v4（`tailwindcss@^4` + `@tailwindcss/postcss@^4`），通过 PostCSS 集成。
- 使用 `@tailwindcss/typography` 插件处理 Markdown 文章排版。
- 全局样式入口在 `app/globals.css`。

v4 的配置语法与 v3 不同，新增样式时参考官方 v4 迁移指南。