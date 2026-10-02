---
title: 'React18特性'
description: 'React 18 引入 并发渲染（Concurrent Rendering）'
updatedAt: '2026-04-07'
module: 'React体系'
order: 8
status: 'outline'
---

# React18特性

## 一、核心升级

React 18 引入 并发渲染（Concurrent Rendering）

## 二、关键特性

1. 自动批处理

   ```js
   setState();
   setState();
   // 自动合并
   ```

2. startTransition

   ```js
   startTransition(() => {
     setState();
   });
   ```

   低优先级更新

3. useDeferredValue

   延迟更新

4. Suspense

   异步 UI 管理

## 三、实践

- 搜索输入优化
- 大数据渲染优化
