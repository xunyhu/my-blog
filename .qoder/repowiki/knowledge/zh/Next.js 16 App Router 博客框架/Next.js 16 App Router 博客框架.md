---
kind: external_dependency
name: Next.js 16 App Router 博客框架
slug: nextjs
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - package.json
    - .nvmrc
    - next.config.ts
---

### 项目技术栈
- 基于 create-next-app 脚手架，使用 App Router（`app/` 目录结构）。
- 构建脚本：`dev` / `build` / `start`；部署文档指向 Vercel。
- 内容以 Markdown 静态文件（`content/`）+ `gray-matter` 解析 frontmatter 的方式渲染，非 CMS。
- 字体使用 `next/font` 加载 Vercel 的 Geist。

注意：Next.js 16 与 Node 22 绑定，旧终端环境需先 `nvm use`。