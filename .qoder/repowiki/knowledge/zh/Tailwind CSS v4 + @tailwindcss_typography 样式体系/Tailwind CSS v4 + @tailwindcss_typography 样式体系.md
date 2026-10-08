---
kind: frontend_style
name: Tailwind CSS v4 + @tailwindcss/typography 样式体系
category: frontend_style
scope:
    - '**'
source_files:
    - tailwind.config.js
    - postcss.config.mjs
    - app/globals.css
    - app/layout.tsx
    - package.json
---

## 1. 系统与方法论

本项目采用 **Tailwind CSS v4**（`tailwindcss: ^4`，`@tailwindcss/postcss: ^4`）作为原子化样式框架，配合 `@tailwindcss/typography` 插件统一 Markdown 内容排版。样式入口为 Next.js App Router 的 `app/globals.css`，通过 `@import 'tailwindcss'` 引入 Tailwind 核心，并通过 PostCSS 插件 `@tailwindcss/postcss` 处理。

- 暗色模式：`darkMode: 'class'`（在 `tailwind.config.js` 中声明），根布局 `<body>` 上通过 `bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100` 切换。
- 设计令牌：使用 CSS 自定义属性定义基础色板与字体，并通过 Tailwind v4 的 `@theme inline` 块暴露给工具类。
- 代码高亮：通过 `highlight.js/styles/github.css` 引入 GitHub 风格主题。
- 动画：依赖 `framer-motion`（运行时动画库），而非 Tailwind 内置动画。

## 2. 关键文件

- `tailwind.config.js` — Tailwind 配置，仅启用 `@tailwindcss/typography` 插件并设置 `darkMode: 'class'`。
- `postcss.config.mjs` — PostCSS 配置，仅注册 `@tailwindcss/postcss`。
- `app/globals.css` — 全局样式入口，包含 Tailwind 导入、CSS 变量、`@theme inline` 设计令牌、以及 `.prose` 覆盖规则。
- `app/layout.tsx` — 根布局，注入 `globals.css` 并在 `<body>` 上应用暗色模式 class。
- `package.json` — 声明 Tailwind v4、`@tailwindcss/typography`、`framer-motion`、`react-icons` 等前端样式相关依赖。

## 3. 架构与约定

### 设计令牌（Design Tokens）

`app/globals.css` 中通过 CSS 变量集中定义基础语义：

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}
```

并通过 Tailwind v4 的 `@theme inline` 将变量映射到 Tailwind 语义化 token：

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

这意味着组件应优先使用 `bg-background` / `text-foreground` / `font-sans` / `font-mono` 等语义化类名，而非硬编码颜色值。

### Markdown 排版策略

项目大量渲染 Markdown 文章，样式集中在 `.prose` 选择器下（由 `@tailwindcss/typography` 提供基类，再被 `globals.css` 覆盖）。覆盖范围包括：

- 段落行高（`line-height: 1.75`）、标题字号与分割线；
- 代码块（`pre`）使用 highlight.js 的 github 主题，带圆角与阴影；
- 行内代码（`code`）使用浅灰背景与圆角；
- 图片响应式（`max-width: 100%`、`height: auto`）；
- 表格通过外层 `.table-wrapper` 实现横向滚动；
- 链接使用蓝色系（`#3b82f6` → hover `#2563eb`）。

所有 `.prose *` 规则置于 `@layer utilities` 中，确保优先级可控。

### 响应式策略

- 页面级防溢出：`body { overflow-x: hidden; }` 与 `.prose * { max-width: 100%; }` 双重兜底。
- 图片与表格：`max-width: 100%` + `overflow-x: auto` 保证长内容不撑破容器。
- 未使用媒体查询断点或 Tailwind 的 `sm:`/`md:` 前缀进行响应式适配（当前站点以桌面阅读为主）。

### 暗色模式

通过 `darkMode: 'class'` 与 `<body className="... dark:bg-gray-900 ...">` 组合，所有使用 `dark:` 前缀的 Tailwind 类（如 `dark:text-gray-100`）在父元素添加 `dark` class 时生效。具体切换逻辑未在仓库中体现（可能由外部脚本或浏览器扩展控制）。

## 4. 约定与约束

- **样式入口唯一**：所有全局样式集中于 `app/globals.css`，通过 `next.config.ts` 或 `layout.tsx` 自动注入，组件内部不使用独立 CSS 文件（项目中未发现 `.module.css` 或 `styled-components`）。
- **Tailwind v4 语法**：使用 `@import 'tailwindcss'`（v4 新语法）替代 v3 的 `@tailwind base/components/utilities` 指令。
- **设计令牌优先**：颜色与字体通过 `:root` 变量 + `@theme inline` 暴露，组件应引用 `--color-*` / `--font-*` 语义 token。
- **Markdown 样式隔离**：所有文章内容样式限定在 `.prose` 作用域内，避免污染全局 DOM。
- **无组件级样式库**：项目未引入 Ant Design、MUI、shadcn 等 UI 组件库，纯手写 React 组件 + Tailwind 原子类。
- **lint 约束**：`.prettierrc` 存在但未见针对 CSS 的专门规则；`lint-staged` 仅对 `*.ts, *.tsx` 执行 `tsc --noEmit` 与 `next lint --fix`，CSS 文件未被纳入预提交检查。
- **字体来源**：`--font-sans` 指向 `var(--font-geist-sans)`、`--font-mono` 指向 `var(--font-geist-mono)`，表明项目依赖 Next.js 内置的 Geist 字体家族。