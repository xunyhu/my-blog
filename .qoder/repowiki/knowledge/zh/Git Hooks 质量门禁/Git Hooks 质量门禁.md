---
kind: external_dependency
name: Git Hooks 质量门禁
slug: husky-lint-staged
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - .husky/pre-commit
    - package.json
---

### 提交前检查
- Husky v9（`prepare` 脚本自动安装）+ lint-staged v16。
- pre-commit 钩子仅执行 `npx tsc --noEmit`（TypeScript 类型检查）。
- lint-staged 对 `*.{ts,tsx}` 运行 `tsc --noEmit` 和 `next lint --fix`。
- 兼容 husky v10：`.husky/pre-commit` 已移除旧版 `#!/usr/bin/env sh` + `_.husky.sh` 引导行，只保留命令本身。
- 钩子通过 `.husky/_/pre-commit` wrapper 以 `sh -e` 读取执行，无需可执行位。

新增 hook 时保持单行命令格式，不要加 shebang 或 source husky.sh。