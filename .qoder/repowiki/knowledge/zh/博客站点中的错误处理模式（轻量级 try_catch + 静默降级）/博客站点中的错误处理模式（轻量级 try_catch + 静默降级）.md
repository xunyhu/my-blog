---
kind: error_handling
name: 博客站点中的错误处理模式（轻量级 try/catch + 静默降级）
category: error_handling
scope:
    - '**'
source_files:
    - lib/blog.ts
    - scripts/generate-ai-engineer.js
    - scripts/generate-frontend-knowledge.js
    - scripts/inject-frontmatter.js
    - next.config.ts
---

## 1. 总体情况

这是一个基于 Next.js App Router 的个人博客与知识站点，代码体量较小、以静态内容渲染为主。仓库中**没有定义自定义错误类型、错误码枚举、统一错误中间件或全局异常处理器**。唯一的运行时错误处理集中在 `lib/blog.ts` 的 `readStatus` 函数中，采用最基础的 `try/catch` 包裹文件读取，捕获后返回默认值 `'outline'`，属于“静默降级”风格。

## 2. 关键文件

- `lib/blog.ts`：唯一出现 `try/catch` 的业务逻辑文件，负责 Markdown 内容扫描、frontmatter 解析、分类/标签聚合。
- `scripts/generate-ai-engineer.js` / `scripts/generate-frontend-knowledge.js` / `scripts/inject-frontmatter.js`：构建期 Node 脚本，使用 `fs.existsSync` 做存在性检查来跳过已有文件，但没有显式 `try/catch`；IO 异常会直接向上抛出由 Node 进程终止。
- `next.config.ts`：空的 Next.js 配置对象，未注册任何错误相关钩子（如 `onRequestError`、`experimental_ppr` 等）。
- `app/**/*.{ts,tsx}`：页面组件中未发现 `try/catch` 或 `throw` 语句，数据获取依赖 Next.js 构建期的同步 `fs.readFileSync`。

## 3. 架构与约定

### 3.1 构建期 IO 无异常传播

`getAllPosts`、`getKnowledgeMap`、`getAIEngineerMap` 等均直接使用 `fs.readFileSync` / `fs.readdirSync`，不捕获异常。这意味着如果 `content/` 目录缺失或某个 Markdown 文件损坏，构建阶段会直接失败——这是预期的“快速失败”策略，因为该站点是静态生成型博客，构建失败即意味着内容不可用。

### 3.2 单点 try/catch 降级

`readStatus`（`lib/blog.ts:74-80`）是唯一显式处理异常的函数：

```ts
function readStatus(filePath: string): string {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    return (data.status as string) || 'outline';
  } catch {
    return 'outline';
  }
}
```

当 `fs.readFileSync` 或 `gray-matter` 解析 frontmatter 失败时，函数返回默认状态 `'outline'`，而不是向调用方抛出错误。该行为被 `getKnowledgeMap` 和 `getAIEngineerMap` 复用，用于为每篇文章计算导航树中的完成度状态。

### 3.3 不存在全局错误处理

- 没有 `errors/` 目录、没有自定义 Error 子类。
- 没有 Express/Koa 风格的错误中间件（Next.js App Router 本身也不适用）。
- 没有 Sentry、Pino、Winston 等日志/监控库集成。
- 没有 `catch` 块对外暴露用户可见的错误信息。

## 4. 观察到的约定与约束

- **约定：构建期 IO 不捕获异常** —— `lib/blog.ts` 中除 `readStatus` 外的所有 `fs.*Sync` 调用均无 `try/catch`，表明作者期望在开发/构建阶段直接暴露文件系统问题。
- **约定：对可选 frontmatter 字段采用默认值而非报错** —— `readStatus` 将解析失败回退到 `'outline'`；`getAllPosts` 中对缺失 `date` 的文章使用 `Date.now()`，对缺失 `description` 使用空字符串，对缺失 `category` 使用 `'blog'`，对缺失 `tags` 使用空数组。
- **约定：构建脚本通过存在性检查避免覆盖** —— `scripts/generate-ai-engineer.js` 使用 `fs.existsSync(filePath)` 判断是否跳过已存在的文章，注释明确说明“绝不覆盖既有内容”。
- **约束：未引入第三方错误处理库** —— `package.json` 中未见 `@sentry/*`、`winston`、`pino`、`zod`（校验错误）等依赖，错误处理完全依赖原生 JS 能力。
- **约束：页面层无异步错误边界** —— App Router 页面中没有 `error.tsx` 或 `catch` 块，也没有 `Suspense` 错误边界，错误处理不在 UI 层实现。

## 5. 结论

该仓库的错误处理处于“最小可用”状态：仅有一处针对可选 frontmatter 解析的 `try/catch` 降级，其余 IO 操作依赖构建期快速失败。这与其作为个人静态博客的定位一致——不需要生产级的错误上报、用户友好错误页或可恢复的运行时异常处理。