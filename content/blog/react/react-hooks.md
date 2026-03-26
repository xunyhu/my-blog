---
title: 'React Hooks 深入解析'
date: '2026-03-01'
tags: [{ name: 'React', slug: 'react' }]
category: 'frontend'
description: 'React Hooks 的使用场景、原理以及优化方案。'
---

# React Hooks 深入解析

## 什么是 Hooks

React Hooks 是 React 16.8 引入的一套全新 API，它允许你在函数组件中使用状态（state）和副作用（effect）等功能，而无需编写类组件。

Hooks 的核心目标是：

- 解决函数组件无法使用 state 的问题
- 提高代码复用性，避免高阶组件（HOC）和 render props 的层层嵌套
- 使组件逻辑更加清晰和可维护

常用的 Hooks 包括：

- `useState`
- `useEffect`
- `useContext`
- `useReducer`
- `useRef`
- `useMemo`
- `useCallback`

---

## useState 示例

`useState` 用于在函数组件中添加状态：

```tsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>当前计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```

⚡ 注意点：

- useState 的初始值只会在第一次渲染时使用
- 更新状态是异步的，类似类组件的 setState

## useEffect 使用场景

useEffect 用于处理副作用，例如：

- 数据请求
- 订阅事件
- DOM 操作
- 定时器

```tsx
import React, { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // 清理副作用
    return () => clearInterval(interval);
  }, []);

  return <p>已过去 {seconds} 秒</p>;
}
```

- 第二个参数为空数组 [] 表示只在组件挂载时执行一次
- 如果省略依赖数组，每次渲染都会执行 effect

## 自定义 Hooks

自定义 Hooks 可以封装逻辑，实现代码复用：

```tsx
import { useState, useEffect } from 'react';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

// 使用
function App() {
  const width = useWindowWidth();
  return <p>当前窗口宽度: {width}px</p>;
}
```

## useMemo 与 useCallback

当组件渲染昂贵操作或者传递回调时，可以使用：

- `useMemo` 缓存计算结果
- `useCallback` 缓存函数引用

```tsx
import React, { useState, useMemo, useCallback } from 'react';

function Expensive({ compute, onClick }) {
  const result = useMemo(() => compute(), [compute]);
  return <button onClick={onClick}>计算结果: {result}</button>;
}

function App() {
  const [count, setCount] = useState(0);

  const compute = useCallback(() => {
    console.log('计算执行');
    return count * 2;
  }, [count]);

  return <Expensive compute={compute} onClick={() => setCount(count + 1)} />;
}
```

- 避免重复计算，提高性能
- 避免子组件不必要渲染

## React Hooks 最佳实践

1. 只在顶层调用 Hooks

   避免在条件、循环、嵌套函数里调用 Hooks

2. 不要在类组件中使用 Hooks

   Hooks 只能在函数组件或自定义 Hooks 中使用

3. 依赖数组要完整

   对 useEffect、useMemo、useCallback 的依赖数组保持完整，避免潜在 bug

4. 封装可复用逻辑

   把复杂逻辑抽离成自定义 Hooks，提升可维护性

5. 避免滥用 useMemo/useCallback

   只有在性能瓶颈明确时使用

## 总结

React Hooks 为函数组件提供了强大的状态管理和副作用控制能力，同时让组件逻辑更加清晰、可复用。
掌握 Hooks，不仅可以写出更简洁的组件，还能优化性能和可维护性。
