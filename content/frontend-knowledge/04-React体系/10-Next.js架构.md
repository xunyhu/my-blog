# Next.js架构

## 一、是什么

Next.js 是基于 React 的全栈框架。

## 二、核心能力

- SSR（服务端渲染）
- SSG（静态生成）
- ISR（增量更新）
- RSC 支持

## 三、核心架构

### 1. App Router（Next 13+）

```text
app/
  layout.tsx
  page.tsx
```

### 2. 渲染模式

- CSR
- SSR
- SSG
- Streaming

### 3. 数据获取

fetch()

支持缓存策略：

- force-cache
- no-store

## 四、实践

- SEO 页面 → SSR / SSG
- 后台系统 → CSR
- 混合架构（推荐）

## 五、总结

React体系本质是：

```text
组件模型 + 调度机制 + 状态管理 + 渲染优化
```

核心能力分层：

```text
React基础 → 虚拟DOM → Diff → Fiber → Hooks
                  ↓
             性能优化 / 状态管理
                  ↓
        React18 并发能力 + RSC
                  ↓
             Next.js 全栈架构
```
