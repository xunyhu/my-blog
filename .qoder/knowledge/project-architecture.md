# 项目架构文档

## 1. 项目概述

**项目名称**: my-blog (HuRui.dev)
**定位**: 前端工程师个人博客 & 前端知识体系整理平台
**核心功能**:

- 博客文章展示（支持分类 / 标签筛选）
- 前端知识体系图谱（8 大模块，60+ 知识点）
- 项目案例展示（SaaS、电商、低代码、权限系统）
- AI Engineer 知识板块（规划中）

---

## 2. 技术栈

| 分类              | 技术                                    | 版本        |
| ----------------- | --------------------------------------- | ----------- |
| 框架              | Next.js (App Router)                    | 16.1.7      |
| 语言              | TypeScript / React                      | 5+ / 19.2.3 |
| 样式              | Tailwind CSS + @tailwindcss/typography  | 4+          |
| 动效              | framer-motion                           | 12.38.0     |
| 粒子效果          | react-tsparticles / tsparticles         | 2.12.x      |
| 流程图            | reactflow                               | 11.11.4     |
| Markdown          | react-markdown + remark/rehype 生态     | 10.1.0      |
| 代码高亮          | rehype-highlight                        | 7.0.2       |
| Front Matter 解析 | gray-matter                             | 4.0.3       |
| 图标              | react-icons                             | 5.6.0       |
| 代码质量          | ESLint + Prettier + Husky + lint-staged | 9+ / 3.8.1  |

---

## 3. 目录结构与模块职责

```
my-blog/
├── app/                          # Next.js App Router 根目录
│   ├── layout.tsx                # 全局 Layout（HTML 壳 + 暗色模式）
│   ├── page.tsx                  # 首页（Hero + 技术栈 + 入口卡片 + 最新文章）
│   ├── globals.css               # 全局样式 + Markdown prose 样式
│   │
│   ├── blog/                     # 博客模块
│   │   ├── page.tsx              # 博客首页（全部文章列表）
│   │   ├── [category]/           # 按分类筛选
│   │   │   ├── page.tsx          # 分类文章列表
│   │   │   └── [tag]/page.tsx    # 分类 + 标签筛选
│   │   └── post/[...slug]/       # 文章详情页（catch-all 路由）
│   │       └── page.tsx
│   │
│   ├── knowledge/                # 知识体系模块
│   │   ├── page.tsx              # 知识图谱首页（分类卡片网格）
│   │   └── [...slug]/page.tsx    # 知识点详情页
│   │
│   ├── projects/                 # 项目案例模块
│   │   └── page.tsx              # 项目列表页（卡片展示 + 小程序码）
│   │
│   ├── components/               # 组件层
│   │   ├── blog/                 # 博客专用组件
│   │   │   ├── CategoryNav.tsx   # 分类导航栏
│   │   │   ├── PostCard.tsx      # 文章卡片
│   │   │   └── TagFilter.tsx     # 标签筛选器
│   │   ├── post/                 # 文章详情专用组件
│   │   │   ├── BackButton.tsx    # 返回按钮（支持来源追踪）
│   │   │   ├── ContentLayout.tsx # 文章布局（TOC + 内容区）
│   │   │   └── MarkdownRenderer.tsx # Markdown 渲染器
│   │   ├── HeroParticles.tsx     # 首页粒子背景
│   │   ├── HomeButton.tsx        # 全局返回首页按钮
│   │   └── TOC.tsx               # 目录导航（滚动高亮）
│   │
│   ├── hooks/                    # 自定义 Hooks
│   │   └── useActiveHeading.ts   # 滚动监听，返回当前可视 heading ID
│   │
│   └── data/                     # 静态数据
│       └── projects.ts           # 项目案例数据
│
├── content/                      # 内容层（Markdown 文件）
│   ├── blog/                     # 博客文章
│   │   ├── browser/
│   │   ├── javascript/
│   │   ├── projects/
│   │   ├── react/
│   │   └── typescript/
│   └── frontend-knowledge/       # 前端知识体系（8 大模块 60+ 篇）
│       ├── 00-前端认知/
│       ├── 01-JavaScript核心/
│       ├── 02-JavaScript进阶/
│       ├── 03-浏览器与网络/
│       ├── 04-React体系/
│       ├── 05-工程化/
│       ├── 06-前端架构/
│       └── 07-算法与数据结构/
│
├── lib/                          # 业务逻辑层
│   ├── blog.ts                   # 文章数据获取（读取 MD + frontmatter 解析）
│   ├── utils.ts                  # 过滤工具函数（分类/标签筛选）
│   ├── navigation/               # 导航逻辑
│   │   └── getBackPath.ts        # 来源感知的返回路径计算
│   └── post/                     # 文章内容处理
│       ├── reader.ts             # 文件读取 + frontmatter 解析
│       ├── getContent.ts         # 统一内容获取入口（blog/knowledge）
│       └── toc.ts                # TOC heading 提取
│
├── config/                       # 配置文件
│   ├── category.ts               # 分类元数据（label 映射）
│   └── tag.ts                    # 标签元数据（label + color）
│
├── types/                        # TypeScript 类型定义
│   └── blog.ts                   # Post / Tag / Category 类型
│
├── scripts/                      # 脚本工具
│   └── generate-frontend-knowledge.js # 知识体系骨架生成器
│
├── public/images/                # 静态资源（项目二维码图片）
├── .husky/                       # Git hooks（pre-commit）
├── next.config.ts                # Next.js 配置
├── tailwind.config.js            # Tailwind 配置
├── eslint.config.mjs             # ESLint 配置（flat config）
├── postcss.config.mjs            # PostCSS 配置
└── tsconfig.json                 # TypeScript 配置
```

---

## 4. 路由架构

基于 Next.js App Router，所有页面默认使用 **Server Component** 渲染（除标注 `'use client'` 的组件外）。

| 路由                     | 页面              | 渲染方式 | 说明                       |
| ------------------------ | ----------------- | -------- | -------------------------- |
| `/`                      | 首页              | Server   | Hero + 卡片导航 + 最新文章 |
| `/blog`                  | 博客列表          | Server   | 全部文章网格展示           |
| `/blog/[category]`       | 分类文章列表      | Server   | 按分类筛选 + 标签过滤器    |
| `/blog/[category]/[tag]` | 分类+标签文章列表 | Server   | 二级筛选                   |
| `/blog/post/[...slug]`   | 文章详情          | Server   | Markdown 渲染 + TOC 侧栏   |
| `/knowledge`             | 知识图谱首页      | Server   | 8 大模块卡片网格           |
| `/knowledge/[...slug]`   | 知识点详情        | Server   | 同文章详情布局             |
| `/projects`              | 项目案例          | Server   | 卡片展示 + 小程序码        |

---

## 5. 数据流架构

```
┌───────────────────────────────────────────────────┐
│                   content/                        │
│  Markdown 文件 + gray-matter frontmatter          │
└────────────────┬──────────────────────────────────┘
                 │ fs.readFileSync (Server-side)
                 ▼
┌───────────────────────────────────────────────────┐
│                   lib/ 层                         │
│                                                   │
│  reader.ts     ── 读取文件 + matter() 解析         │
│  getContent.ts ── 统一入口(blog/knowledge)         │
│  blog.ts       ── getAllPosts / getKnowledgeMap    │
│  utils.ts      ── filterPosts / getTagsByCategory │
│  toc.ts        ── extractHeadings                 │
└────────────────┬──────────────────────────────────┘
                 │ 结构化数据 (Post[] / KnowledgeMap)
                 ▼
┌───────────────────────────────────────────────────┐
│                app/ 页面层 (Server Component)      │
│                                                   │
│  获取数据 → 组装 props → 渲染 JSX                  │
└────────────────┬──────────────────────────────────┘
                 │ React 元素树
                 ▼
┌───────────────────────────────────────────────────┐
│             components/ 组件层                     │
│                                                   │
│  Server: CategoryNav, PostCard, TagFilter          │
│  Client: BackButton, MarkdownRenderer, TOC,       │
│          HeroParticles, HomeButton                │
└───────────────────────────────────────────────────┘
```

### 关键数据流说明

1. **博客文章**: `content/blog/*.md` → `lib/blog.ts:getAllPosts()` → 按 date 排序 → 页面渲染
2. **知识体系**: `content/frontend-knowledge/` → `lib/blog.ts:getKnowledgeMap()` → 分类卡片
3. **文章详情**: URL slug → `lib/post/getContent.ts` → 拼接路径读取 MD → `MarkdownRenderer` 渲染
4. **筛选过滤**: `lib/utils.ts` 提供 `filterPosts()` + `getTagsByCategory()` 供分类/标签页使用

---

## 6. 组件分层策略

### Server Components（默认）

- `CategoryNav` — 分类导航
- `PostCard` — 文章卡片
- `TagFilter` — 标签筛选器
- 所有 `page.tsx` — 页面组件

### Client Components（`'use client'`）

- `BackButton` — 使用 `useRouter` / `useSearchParams`
- `MarkdownRenderer` — react-markdown 渲染
- `ContentLayout` — 组合 TOC 的布局容器
- `TOC` — 目录导航
- `HeroParticles` — tsparticles 粒子效果
- `HomeButton` — 固定定位返回按钮

### 自定义 Hooks

- `useActiveHeading` — 监听滚动事件，计算当前可视区域 heading

---

## 7. Markdown 渲染管线

```
原始 Markdown
    │
    ├── gray-matter ─── 解析 frontmatter (title/date/tags/category)
    │
    └── react-markdown ─── 渲染内容
         │
         ├── remark-gfm          (GFM: 表格/任务列表/脚注)
         ├── rehype-highlight    (代码语法高亮)
         ├── rehype-slug         (标题自动添加 id)
         └── rehype-autolink-headings (标题可点击锚点)
```

样式由 `globals.css` 中 `.prose` 系列自定义样式覆盖，包括：

- 代码块圆角 + 阴影
- 表格横向滚动（`.table-wrapper`）
- 行内代码样式
- 链接、列表样式

---

## 8. 内容管理体系

### 博客文章 (`content/blog/`)

- 按目录分类：`javascript/`, `react/`, `typescript/`, `browser/`, `projects/`
- Frontmatter 格式：`title`, `date`, `description`, `category`, `tags`
- Slug 基于文件路径：如 `content/blog/javascript/stack-heap.md` → slug 为 `javascript/stack-heap`

### 前端知识体系 (`content/frontend-knowledge/`)

- 8 大模块，编号前缀排序（`00-` ~ `07-`）
- 文件名编号前缀决定展示顺序
- 可通过 `scripts/generate-frontend-knowledge.js` 批量生成骨架文章
- URL 使用中文目录名（需 `decodeURIComponent` 处理）

### 项目案例 (`app/data/projects.ts`)

- 硬编码 TypeScript 数据
- 支持两种 Demo 类型：`link`（外部链接）和 `qrcode`（小程序码图片）

---

## 9. 导航与返回机制

项目实现了一套**来源感知的返回导航**：

1. 文章链接可携带 `?from=` 参数标记来源页（如 `home`, `frontend`, `projects`）
2. `BackButton` 组件读取 URL `from` 参数
3. `lib/navigation/getBackPath.ts` 根据 `from` 映射到对应返回路径
4. 未匹配时使用 fallback 路径

```
from=home      → /
from=frontend  → /blog/frontend
from=projects  → /blog/projects
其他/缺失      → fallback (如 /blog)
```

---

## 10. 构建与开发流程

### 脚本命令

| 命令              | 说明             |
| ----------------- | ---------------- |
| `npm run dev`     | 启动开发服务器   |
| `npm run build`   | 生产构建         |
| `npm run start`   | 启动生产服务     |
| `npm run lint`    | ESLint 检查      |
| `npm run prepare` | 安装 Husky hooks |

### 代码质量保障

- **ESLint**: flat config 格式，集成 `next/core-web-vitals` + `next/typescript` + `prettier`
- **Prettier**: 代码格式化
- **Husky + lint-staged**: Git pre-commit 时自动执行 `tsc --noEmit` + `next lint --fix`
- **TypeScript strict mode**: 开启严格类型检查

### 路径别名

- `@/*` → 项目根目录（tsconfig.json paths 配置）

---

## 11. 样式方案

- **Tailwind CSS 4**: 通过 `@tailwindcss/postcss` 插件集成，使用 `@import 'tailwindcss'` 引入
- **暗色模式**: `darkMode: 'class'` 策略（已在 layout 中预设 `dark:` 类名）
- **Typography 插件**: `@tailwindcss/typography` 提供 `.prose` 基础排版
- **自定义 prose 样式**: 在 `globals.css` 中通过 `@layer utilities` 覆盖默认样式
- **代码高亮主题**: `highlight.js/styles/github.css`

---

## 12. 部署与运行

- 框架: Next.js 16 App Router
- 渲染模式: 主要使用 Server Component（文件系统读取 MD 在服务端完成）
- 静态资源: `public/images/` 存放项目二维码图片
- 内容: 所有文章以 Markdown 文件形式存储在 `content/` 目录，构建时读取
