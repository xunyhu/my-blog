---
kind: configuration_system
name: Next.js 博客项目的配置系统
category: configuration_system
scope:
    - '**'
source_files:
    - config/category.ts
    - config/tag.ts
    - next.config.ts
    - package.json
    - lib/post/reader.ts
    - lib/post/getContent.ts
    - scripts/inject-frontmatter.js
    - scripts/generate-ai-engineer.js
    - scripts/generate-frontend-knowledge.js
---

## 概述

本项目是一个基于 Next.js App Router 的个人博客与知识站点，**没有引入外部配置框架**（如 dotenv、config、conf），也没有 `.env` / `.env.local` 等环境变量文件。运行时配置以 **TypeScript 常量模块 + Markdown frontmatter** 的形式组织，构建期通过 Node 脚本注入元数据。

## 关键文件与位置

- `config/category.ts`：分类映射表（`CATEGORY_CONFIG`）
- `config/tag.ts`：标签映射表（`TAG_CONFIG`）
- `next.config.ts`：Next.js 应用配置（当前为空壳）
- `package.json`：依赖声明与 scripts
- `lib/post/reader.ts`、`lib/post/getContent.ts`：Markdown 内容读取与 frontmatter 解析
- `scripts/inject-frontmatter.js`：批量注入 frontmatter 的构建脚本
- `content/**/*.md`：所有文章正文，frontmatter 作为事实上的“文档级配置”

## 架构与约定

### 1. 全局枚举类配置集中在 `config/`

`config/category.ts` 导出 `CATEGORY_CONFIG`，`config/tag.ts` 导出 `TAG_CONFIG`，均为纯 TS 对象字面量，键为 slug，值为包含 `label`（以及可选 `color`）的对象。这些是站点级的“字典式配置”，被页面组件和导航逻辑直接 import 使用。

```ts
// config/category.ts
export const CATEGORY_CONFIG = {
  frontend: { label: '前端知识' },
  projects: { label: '项目经验' },
};
```

该目录目前仅承担“静态常量集中地”的职责，没有加载器、校验层或运行时覆盖机制。

### 2. 文档级配置采用 Markdown frontmatter

文章内容位于 `content/` 下，每篇 Markdown 通过 YAML frontmatter 描述标题、分类、标签、日期等元信息。`gray-matter`（见 `package.json` 依赖）在 `lib/post/reader.ts` 中用于解析 frontmatter，将其与正文分离后交给渲染层。

`scripts/inject-frontmatter.js` 会在生成骨架文章时统一注入 frontmatter，保证每篇文章具备一致的元数据结构——这是由脚本强制的约束。

### 3. 构建期脚本替代运行时配置

`scripts/generate-ai-engineer.js`、`scripts/generate-frontend-knowledge.js` 负责批量生成知识库目录与 Markdown 骨架；`scripts/inject-frontmatter.js` 负责向已存在的文章注入 frontmatter。这些脚本是“配置变更”的主要入口，而非编辑配置文件。

### 4. 无环境变量体系

仓库根目录不存在 `.env`、`.env.local`、`.env.production` 等文件；`grep_code` 搜索 `process.env` / `NEXT_PUBLIC_` 仅在 Markdown 示例代码中出现，未在项目源码中使用。`next.config.ts` 为空壳，未定义任何 `env` 或 `publicRuntimeConfig`。

### 5. 样式与工具链配置

- `tailwind.config.js`：Tailwind CSS 主题配置
- `postcss.config.mjs`：PostCSS 插件链
- `eslint.config.mjs`：ESLint 规则
- `prettier` 相关：`.prettierrc`、`.prettierignore`
- `tsconfig.json`：TypeScript 编译选项
- `.husky/pre-commit`：提交钩子（配合 `lint-staged` 在 `package.json` 中声明）

这些属于工程化配置，不属于应用运行时配置范畴。

## 约定与约束

- **分类/标签必须通过 `config/category.ts` 与 `config/tag.ts` 维护**：新增分类或标签应在此处添加对应条目，而不是散落在页面组件中。
- **文章元数据必须通过 frontmatter 提供**：`inject-frontmatter.js` 会统一注入，确保每篇文章拥有相同的字段结构。
- **不引入环境变量**：项目未使用 `.env` 文件，也未在源码中读取 `process.env`（除 Markdown 示例代码外），因此不存在环境变量分层（dev/prod）或密钥管理策略。
- **Next.js 配置保持最小化**：`next.config.ts` 当前为空对象，未启用自定义 webpack、环境变量暴露等扩展。
- **构建产物不包含动态配置**：由于所有配置都是编译期常量，构建输出是静态站点，无需服务端配置加载。

## 总结

本项目的“配置系统”本质上是：**TS 常量模块（`config/`）+ Markdown frontmatter + 构建期脚本**。它简单直接，适合个人博客这种静态内容站点；若未来需要多环境、远程配置或运行时开关，则需要引入环境变量与配置加载层。