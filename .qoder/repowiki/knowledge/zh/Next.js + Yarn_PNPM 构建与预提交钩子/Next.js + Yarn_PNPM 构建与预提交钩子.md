---
kind: build_system
name: Next.js + Yarn/PNPM 构建与预提交钩子
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.ts
    - .nvmrc
    - .husky/pre-commit
    - eslint.config.mjs
    - .prettierrc
    - tailwind.config.js
    - postcss.config.mjs
    - tsconfig.json
    - scripts/generate-ai-engineer.js
    - scripts/generate-frontend-knowledge.js
    - scripts/inject-frontmatter.js
---

## 1. 使用的系统与工具

- **运行时/包管理器**: Node.js（`.nvmrc` 锁定 `22.14.0`），依赖通过 `package-lock.json` 管理，根目录存在 `.yarn/` 说明项目也兼容 Yarn。
- **框架构建器**: Next.js 16.1.7（`next build` / `next dev` / `next start`）。
- **类型检查**: TypeScript 5，配合 `tsc --noEmit`。
- **代码风格**: ESLint 9 (`eslint.config.mjs`) + Prettier 3 + `eslint-config-prettier` + `eslint-plugin-prettier`。
- **样式构建**: Tailwind CSS v4 + PostCSS (`tailwind.config.js`, `postcss.config.mjs`)。
- **Git 钩子**: Husky 9 + lint-staged 16。
- **内容生成脚本**: `scripts/generate-ai-engineer.js`、`scripts/generate-frontend-knowledge.js`、`scripts/inject-frontmatter.js`（纯 Node.js，非构建系统核心）。

仓库中**没有** Makefile、Dockerfile、CI 流水线文件（如 `.github/workflows/`）、发布脚本或跨编译配置。构建与打包完全委托给 Next.js CLI。

## 2. 关键文件

- `package.json` — 定义 `dev` / `build` / `start` / `lint` / `prepare` 五个 npm script；`prepare` 钩入 `husky`；`lint-staged` 对 `*.{ts,tsx}` 执行 `tsc --noEmit` 和 `next lint --fix`。
- `next.config.ts` — 当前为空对象，未启用自定义 Next.js 构建选项。
- `.nvmrc` — 固定 Node 版本为 `22.14.0`。
- `.husky/pre-commit` — 仅运行 `npx tsc --noEmit`，在提交前进行类型检查。
- `eslint.config.mjs` / `.prettierrc` / `tailwind.config.js` / `postcss.config.mjs` / `tsconfig.json` — 各工具的配置文件。
- `scripts/*.js` — 知识库骨架与 frontmatter 注入脚本，属于内容工程而非产物构建。

## 3. 架构与约定

- **构建入口单一**: 所有构建流程通过 `npm run build` → `next build` 完成，Next.js 负责 TS 编译、MDX/Markdown 静态生成、Tailwind 样式处理与资源优化。
- **开发体验脚本**: `npm run dev` 启动 Next 开发服务器；`npm run lint` 调用 ESLint；`npm run prepare` 安装 Husky 钩子。
- **预提交阶段**: 使用 Husky 的 `pre-commit` 钩子，仅做 `tsc --noEmit` 类型检查，不做 ESLint/Prettier 校验（ESLint/Prettier 由 `lint-staged` 在 staged 文件上触发）。
- **版本策略**: `package.json` 中 `"version": "0.1.0"` 且 `"private": true`，表明该仓库不直接作为 npm 包发布；版本号是占位值，未见自动化语义化版本工具（如 semantic-release）。
- **Node 版本约束**: 通过 `.nvmrc` 声明，但 Husky 钩子用 `npx tsc` 而非 `node_modules/.bin/tsc`，实际版本取决于环境 PATH。

## 4. 约定与约束

- **构建命令约定**: 项目的标准构建命令是 `next build`（经 `npm run build` 调用），开发用 `next dev`，生产运行用 `next start`——全部来自 Next.js CLI，无自定义包装脚本。
- **Node 版本约束**: `.nvmrc` 要求 Node `22.14.0`；这是通过 nvm 等工具读取的约定，并非强制校验逻辑。
- **提交前类型检查**: `.husky/pre-commit` 强制在每次 commit 前运行 `npx tsc --noEmit`，未通过类型检查则提交被拒绝。
- **Staged 文件 lint**: `package.json` 中 `lint-staged` 对 `*.{ts,tsx}` 依次执行 `tsc --noEmit` 和 `next lint --fix`，lint 失败会阻止暂存。
- **私有仓库**: `package.json` 设置 `"private": true`，禁止 `npm publish`。
- **无容器化/CI**: 仓库未发现 Dockerfile、docker-compose、GitHub Actions/GitLab CI 等 CI/CD 配置，部署流程不在本仓库内维护。
- **无 Makefile/Shell 构建脚本**: 构建任务全部由 npm scripts 委派给 Next.js，不存在 Makefile 或 `build*.sh`。
- **内容生成脚本独立于构建**: `scripts/generate-*.js` 与 `inject-frontmatter.js` 未被 `package.json` 的 scripts 引用，需手动运行以生成知识库骨架与 frontmatter，不属于自动构建管线的一部分。