# Fiber架构

## 一、是什么

Fiber 是 React 16 引入的 可中断渲染架构。

## 二、为什么

旧架构（Stack Reconciler）：

- 递归不可中断
- 卡顿严重

## 三、核心原理

### 1. Fiber 节点结构

```js
{
  type,
  stateNode,
  child,
  sibling,
  return
}
```

### 2. 双阶段

Render 阶段（可中断）

- 构建 Fiber 树
- 可暂停 / 恢复

Commit 阶段（不可中断）

- 更新 DOM

### 3. 时间切片

任务拆分 → 分帧执行

## 四、实践

避免大组件阻塞，合理拆分 UI
