---
name: git-commit
description: 分析 Git 变更并完成代码提交，遵循 Conventional Commits 规范（英文类型前缀 + 中文描述），提交前主动运行 TypeScript 类型检查，仅本地 commit 不自动 push。当用户要求提交代码、执行 git commit、生成提交信息或完成提交流程时使用。
---

# Git Commit

完成一次规范的代码提交：遵循 Conventional Commits 规范，提交信息使用「英文类型前缀 + 中文描述」，**仅执行本地 commit，不自动 push**。

## 项目约定

- 本项目使用 husky pre-commit 钩子，提交时会自动运行 `npx tsc --noEmit`。**类型检查失败会导致 commit 被拒绝**。
- lint-staged 对 `*.{ts,tsx}` 文件运行 `tsc --noEmit` 与 `next lint --fix`。
- 默认分支为 `master`。

## 提交流程

复制以下清单并逐步执行：

```
提交进度：
- [ ] 步骤 1：查看变更状态
- [ ] 步骤 2：分析 diff 内容
- [ ] 步骤 3：运行类型检查
- [ ] 步骤 4：暂存变更
- [ ] 步骤 5：生成提交信息
- [ ] 步骤 6：执行 commit
- [ ] 步骤 7：确认结果并汇报
```

**步骤 1：查看变更状态**

```bash
git status
```

**步骤 2：分析 diff 内容**

```bash
git diff --staged   # 已暂存的变更
git diff            # 未暂存的变更
```

仔细阅读变更，判断本次改动的意图（新功能 / 修复 / 文档 / 重构等）。

**步骤 3：运行类型检查（重要）**

在 commit 前主动运行，避免 husky 钩子失败：

```bash
npx tsc --noEmit
```

若报错，先修复再提交，**不要跳过或绕过**。

**步骤 4：暂存变更**

```bash
git add -A          # 全部暂存
# 或按需精确暂存：git add <file>
```

**步骤 5：生成提交信息**

按下方「提交信息规范」生成。

**步骤 6：执行 commit**

```bash
git commit -m "<type>(<scope>): <中文描述>"
```

需要正文时使用多个 `-m`：

```bash
git commit -m "<标题>" -m "<正文>"
```

**步骤 7：确认结果并汇报**

```bash
git log -1 --stat
```

向用户汇报提交结果。**到此为止，不要执行 git push**，除非用户明确要求。

## 提交信息规范

格式：`<type>(<scope>): <中文描述>`

- **type**（英文，必填）：

  | type     | 用途                       |
  | -------- | -------------------------- |
  | feat     | 新功能                     |
  | fix      | 修复 bug                   |
  | docs     | 文档 / 内容变更            |
  | style    | 代码格式（不影响功能）     |
  | refactor | 重构（非新增功能、非修复） |
  | perf     | 性能优化                   |
  | test     | 测试相关                   |
  | build    | 构建系统 / 依赖变更        |
  | ci       | CI 配置变更                |
  | chore    | 杂项 / 其他                |
  | revert   | 回滚提交                   |

- **scope**（可选）：影响范围，如 `blog`、`ai-engineer`、`knowledge`、`deps`。
- **描述**（中文，必填）：一句话说明改了什么，使用祈使语气，结尾不加句号。

### 示例

**新增功能**

```
feat(ai-engineer): 新增 AI 工程师知识板块及文章路由
```

**修复 bug**

```
fix(blog): 修复分类页标签筛选不生效的问题
```

**新增 / 修改文章内容**

```
docs(content): 补充 RAG 体系与 Agent 架构相关文章
```

**重构**

```
refactor(lib): 重构博客内容读取逻辑
```

**依赖更新（带正文）**

```
build(deps): 升级 next 至 16.1.7

同步更新 eslint-config-next 及相关类型依赖
```

## 注意事项

- 标题建议不超过 50 字符，正文每行不超过 72 字符。
- 一次提交只做一件事；变更过多时按逻辑拆分为多次提交。
- **禁止使用 `--no-verify` 跳过钩子**，除非用户明确要求。
- **禁止自动 push**，提交完成后停下等待用户指示。
- 若 pre-commit 钩子（`tsc`）失败，先定位并修复类型错误，再重新提交。
