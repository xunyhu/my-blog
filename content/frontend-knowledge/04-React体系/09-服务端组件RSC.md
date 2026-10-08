---
title: '服务端组件RSC'
description: 'React Server Components（RSC）是只在服务端执行、渲染为 Flight 流式载荷、不下发客户端 JS 的组件模型。本文讲清 RSC 与 SSR 的区别、use client 边界规则、Server Actions，以及 Next.js 16 的 Cache Components 与 PPR。'
updatedAt: '2026-10-02'
module: 'React体系'
order: 9
status: 'done'
---

# 服务端组件RSC

## 一、是什么

**React Server Components（RSC，服务端组件）是一种只在服务端执行、把渲染结果序列化为一种特殊的流式载荷（Flight Payload）下发给客户端、而自身 JS 永远不会进入浏览器 bundle 的组件模型。**

它自 React 19 起正式 stable，在 Next.js App Router 中作为默认渲染模型落地。理解 RSC 的关键，是先把它和三个容易混淆的概念区分开：

| 概念                  | 运行位置           | 产物                                 | 解决的问题                           |
| --------------------- | ------------------ | ------------------------------------ | ------------------------------------ |
| **CSR**（客户端渲染） | 浏览器             | HTML（空壳）+ JS                     | 交互丰富，但首屏慢、SEO 差           |
| **SSR**（服务端渲染） | 服务端（每次请求） | HTML 字符串                          | 首屏快、SEO 好，但组件 JS 仍全量下发 |
| **RSC**（服务端组件） | 服务端             | **Flight Payload**（非 HTML、非 JS） | 组件代码零下发、可直接访问后端资源   |

> 一句话：**SSR 解决「首屏 HTML 从哪来」，RSC 解决「组件 JS 要不要下发」。** 二者不是替代关系，而是叠加协作——RSC 负责在服务端把大部分组件「消化」掉，SSR/流式负责把结果尽早送到浏览器。

## 二、为什么需要 RSC

传统 React（纯 CSR 或 SSR）有一个根本矛盾：**无论组件是否需要交互，它和它依赖的所有库都要打包进客户端 bundle。**

```text
传统模式：一个「文章详情页」的 bundle 构成
┌────────────────────────────────────────────────┐
│  页面组件 + 数据请求逻辑                          │
│  + Markdown 解析器（markdown-it / remark …）      │  ← 只在渲染时用一次
│  + 语法高亮库（highlight.js，动辄上百 KB）        │  ← 却被全量下发到浏览器
│  + 日期格式化库（date-fns …）                     │
│  + 只有「点赞按钮」才需要的 useState/事件逻辑      │
└────────────────────────────────────────────────┘
        全部打进 bundle → 首屏 JS 体积膨胀 → 下载/解析/执行变慢
```

RSC 从三个维度破解这个矛盾：

- **零客户端 JS**：纯展示、无交互的组件（如文章正文、数据看板）只在服务端运行，其代码与依赖**完全不进入 bundle**。上例中的 Markdown 解析器、高亮库都可以留在服务端。
- **数据就近获取**：Server Component 可以直接 `await` 数据库、文件系统、内部服务——无需暴露 API 端点，也没有客户端 `useEffect` 请求造成的「瀑布流」（waterfall）。
- **自动代码分割的天然边界**：客户端组件即分割点，交互逻辑按需加载。

## 三、核心原理

### 1. 两类组件与渲染位置

App Router 中，组件默认是 **Server Component**；只有在文件顶部显式标注 `'use client'` 的才是 **Client Component**。

```text
                    一次请求的渲染分工
   ┌──────────────────────── 服务端 ────────────────────────┐
   │  Server Component（默认）                                │
   │  · 可 async/await、直接读 DB/FS、访问密钥                 │
   │  · 渲染为 Flight Payload                                 │
   │  · 遇到 'use client' 边界时「停下」，留一个占位引用        │
   └───────────────────────────┬─────────────────────────────┘
                               │  Flight Payload（流式）
                               ▼
   ┌──────────────────────── 浏览器 ────────────────────────┐
   │  Client Component（'use client'）                        │
   │  · 承载 state / effect / 事件监听 / 浏览器 API            │
   │  · 首次由 SSR 出 HTML，随后 hydrate 接管交互             │
   └──────────────────────────────────────────────────────────┘
```

### 2. RSC Payload（Flight）序列化

Server Component 的渲染产物**既不是 HTML，也不是 JS**，而是 React 自定义的一种流式序列化格式——**Flight Payload（RSC Payload）**。它描述的是「一棵已经算好的组件树 + 客户端组件的引用与其 props」。

```text
Flight Payload（示意，实际为分块的流式文本）
──────────────────────────────────────────────
S1: ["$","div",null,{"children":[
       ["$","h1",null,{"children":"服务端组件RSC"}],
       ["$","$L2", ...]        ← 引用：这里是客户端组件
     ]}]
S2: {"id":"MarkdownRenderer","chunks":["..."],"props":{"content":"# 标题…"}}
──────────────────────────────────────────────
· 服务端组件 → 已经「摊平」成渲染结果，看不到原始函数
· 客户端组件 → 只保留一个「引用 + 可序列化 props」，真正的 JS 由浏览器另行加载
```

**只有可序列化的值才能跨越服务端→客户端边界**：字符串、数字、布尔、数组、普通对象、`Date`、`Promise`、以及客户端组件的引用。**函数（除 Server Action 外）、类实例、内建对象（如 `Error`）不能直接作为 props 传给客户端组件。**

### 3. 流式渲染与 Suspense

RSC Payload 是**流式**下发的：服务端不必等整棵树算完，可以先发送已就绪的部分，配合 `<Suspense>` 把慢的部分（如数据库查询）留到后面补齐。

```text
时间线 ──────────────────────────────────────────▶
服务端:  [静态外壳就绪]──发送──▶ [慢数据 await 完成]──补发──▶
浏览器:       │ 立即渲染骨架 + Suspense fallback
              └───────────────▶ 收到补发块，原地替换 fallback
```

这让「首字节时间（TTFB）」与「慢数据」解耦：用户先看到页面骨架，慢的部分就绪后无刷新地流入。

### 4. 完整渲染流程

```text
① 请求到达
      │
② 服务端执行 Server Component 树（可 async 读数据）
      │  遇到 'use client' 边界 → 记录引用，不再深入其内部渲染逻辑
      ▼
③ 生成 Flight Payload（流式）  ───────────────┐
      │                                        │
④ 对客户端组件做 SSR，产出首屏 HTML            │  两条流并行下发
      │                                        │
      ▼                                        ▼
⑤ 浏览器收到 HTML → 立即展示（可见、可 SEO）
      │
⑥ 浏览器加载客户端组件 JS → hydrate → 交互生效
      │
⑦ 后续导航：直接请求 Flight Payload，客户端用其更新 UI（不再请求整页 HTML）
```

## 四、`'use client'` 边界规则

`'use client'` **不是「把一个组件变成客户端组件」的开关，而是声明一条「服务端/客户端边界」**：从该文件起，它及其所有子依赖都进入客户端 bundle，直到遇到下一个边界。

| 能力                            | Server Component | Client Component |
| ------------------------------- | :--------------: | :--------------: |
| `async` / `await` 数据获取      |        ✅        |        ❌        |
| 直接读 DB / 文件系统 / 密钥     |        ✅        |        ❌        |
| `useState` / `useReducer`       |        ❌        |        ✅        |
| `useEffect` / `useLayoutEffect` |        ❌        |        ✅        |
| 事件处理（`onClick` 等）        |        ❌        |        ✅        |
| 浏览器 API（`window` 等）       |        ❌        |        ✅        |
| Context（`useContext`）         |        ❌        |        ✅        |

**导入方向规则（最易错）：**

- ✅ Server Component **可以**导入并渲染 Client Component。
- ❌ Client Component **不能**直接 `import` 一个 Server Component。
- ✅ 但 Server Component 可以作为 `children` / props **传入** Client Component（此时它已在服务端渲染好，跨过边界的是 Payload 引用）。

```tsx
// ✅ 正确：Server 包裹 Client，把服务端组件作为 children 传下去
// app/.../page.tsx（Server Component，无 'use client'）
import ClientTabs from './ClientTabs'; // 'use client'
import ServerFetchedPanel from './Panel'; // Server Component

export default function Page() {
  return (
    <ClientTabs>
      <ServerFetchedPanel /> {/* 作为 children 穿过边界，合法 */}
    </ClientTabs>
  );
}
```

```tsx
// ❌ 错误：在客户端组件里 import 服务端组件并当作组件渲染
'use client';
import ServerFetchedPanel from './Panel'; // Panel 里用了 await/fs → 报错或行为异常
export default function Tabs() {
  return <ServerFetchedPanel />;
}
```

## 五、Server Actions 与数据变更

数据「读」由 Server Component 负责，数据「写」则由 **Server Actions**（`'use server'`）负责。它是运行在服务端、可从客户端组件直接调用的异步函数，天然适合表单提交与数据变更，无需手写 API 路由。

```tsx
// actions.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function createComment(formData: FormData) {
  const text = formData.get('text') as string;
  await db.comment.insert({ text }); // 直接访问数据库
  revalidatePath('/post/1'); // 变更后让相关路由失效、重新取数
}
```

```tsx
// CommentForm.tsx —— 客户端组件
'use client';
import { createComment } from './actions';

export default function CommentForm() {
  return (
    <form action={createComment}>
      <input name="text" />
      <button type="submit">提交</button>
    </form>
  );
}
```

Next.js 16 进一步细化了变更后的缓存刷新语义：`updateTag()`（Server Action 专用，读己所写、立即刷新）、`refresh()`（只刷新未缓存数据）、以及 `revalidateTag(tag, profile)`（需传 `cacheLife` 档位以启用 SWR）。

## 六、实战：本项目中的 RSC

本站（Next.js 16 App Router）就是一个「Server Component 取数 + Client Component 交互」的典型样例。知识详情页 `app/knowledge/[...slug]/page.tsx` 是一个 **async Server Component**：

```tsx
import type { Metadata } from 'next';
import { getContent } from '@/lib/post/getContent'; // 内部 fs.readFileSync
import ContentLayout from '@/app/components/post/ContentLayout'; // 'use client'
import MarkdownRenderer from '@/app/components/post/MarkdownRenderer'; // 'use client'

// generateMetadata 只在服务端执行，天然可用 fs
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params; // Next.js 16：params 为 Promise，必须 await
  const post = getContent('knowledge', slug); // 直接读文件系统
  if (!post) return {};
  const { title, description } = post.data as {
    title?: string;
    description?: string;
  };
  return { title, description };
}

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const post = getContent('knowledge', slug);
  if (!post) return <div className="p-10">404 Not Found</div>;
  return (
    <ContentLayout
      content={post.content}
      headings={extractHeadings(post.content)}
    >
      <MarkdownRenderer content={post.content} />
    </ContentLayout>
  );
}
```

它精确体现了 RSC 的几条要点：

- **服务端直连文件系统**：`getContent` 内部用 `fs.readFileSync` 读 Markdown。`fs` 在浏览器不存在——正因这是 Server Component，才能安全地直接读盘，无需任何 API 端点。
- **`generateMetadata` 是服务端专属能力**：它同样调用 `getContent`，把 frontmatter 的 `title/description` 输出为 SEO 元信息，全程不产生客户端 JS。
- **边界处只传可序列化值**：页面把 `post.content`（一个字符串）作为 props 交给客户端组件 `MarkdownRenderer`/`ContentLayout`。字符串可序列化，安全跨边界；交互（TOC 高亮、返回按钮）则留在客户端。

> 本项目被标为 `'use client'` 的是 `ContentLayout`、`MarkdownRenderer`、`TOC`、`BackButton`、`HomeButton`、`HeroParticles`——都是**需要交互或浏览器 API** 的组件；而各 `page.tsx`、`layout.tsx` 都是 Server Component，负责读文件与组装数据。这正是「默认服务端、按需客户端」的推荐心智。

## 七、进阶：PPR、Cache Components 与 Next.js 16

**PPR（Partial Prerendering，部分预渲染）** 于 2023 年提出，目标是让「静态外壳」与「动态内容」共存于同一路由：静态部分在构建时预渲染成极快的首屏，动态部分（包在 `<Suspense>` 里）在请求时流入。

在 **Next.js 16（2025-10 发布）**，PPR 不再是独立的实验开关，而是并入更完整的 **Cache Components** 编程模型：

```ts
// next.config.ts
const nextConfig = {
  cacheComponents: true, // 启用后，缓存改为显式 opt-in（"use cache" 指令）
};
export default nextConfig;
```

- 旧的 `experimental.ppr` 配置与路由级 `export const experimental_ppr` **已被移除**——网上仍流传的这两种写法在 Next.js 16 已失效。
- Cache Components 下，**所有动态代码默认在请求时执行**，缓存需通过 `"use cache"` 显式声明，行为更符合直觉。
- 同期，**Turbopack 成为默认打包器**（stable，2–5× 构建、最高 10× Fast Refresh），**React Compiler** 支持转正（`reactCompiler: true`，自动 memo，默认不开）。

## 八、常见误区

- **误区一：RSC 就是 SSR。** 不是。SSR 产出 HTML 且组件 JS 仍全量下发；RSC 产出 Flight Payload 且服务端组件 JS 零下发。二者协作而非互斥。
- **误区二：`'use client'` 是「把这个组件变成客户端组件」。** 它声明的是一条**边界**，会把该文件及其子依赖一并纳入客户端 bundle。应把边界尽量下推到叶子交互组件。
- **误区三：Server Component 里能用 `useState`/`useEffect`/`onClick`。** 不能。凡需要状态、副作用、事件、浏览器 API 的逻辑，必须放进 Client Component。
- **误区四：可以随意把对象/函数传给客户端组件。** 跨边界的 props 必须可序列化；函数（Server Action 除外）、类实例都会导致报错。
- **误区五：有了 RSC 就该消灭客户端组件。** RSC 不是「反交互」，而是「让不需要交互的部分留在服务端」。输入框、动画、悬停高亮等仍需客户端组件。
- **误区六：RSC 版本可以长期不升。** RSC 协议曾曝出高危漏洞（CVE-2025-66478，CVSS 10.0），务必保持 Next.js/React 版本更新，勿锁死在受影响版本。

## 九、总结

- RSC 是**只在服务端运行、渲染为 Flight Payload、组件 JS 零下发**的组件模型，自 React 19 stable，是 App Router 的默认心智。
- 它解决传统 React「无论是否交互都要下发全部 JS」的顽疾：**零客户端 JS + 数据就近获取 + 天然代码分割**。
- `'use client'` 声明的是**服务端/客户端边界**；服务端组件可导入客户端组件，反之不行（但可作为 `children`/props 传入）。
- 跨边界的只能是**可序列化值**；数据「写」交给 **Server Actions**。
- Next.js 16 中，PPR 已并入 **Cache Components**（`cacheComponents: true` + `"use cache"`），配合默认的 **Turbopack** 与转正的 **React Compiler**，构成 2026 年的渲染与性能基线。

> 掌握 RSC 的判断力，落在一个朴素的问题上：**「这段逻辑真的需要跑在用户的浏览器里吗？」** 把答案是否定的部分留在服务端，bundle 自然瘦身、数据自然就近、首屏自然更快。
