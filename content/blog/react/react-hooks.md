
---

### **react/react-hooks.md**

```markdown
---
title: "React Hooks 入门"
date: "2026-03-17"
tags: ["React", "Hooks"]
category: "react"
description: "React Hooks 使用方法与注意事项"
---

# React Hooks 入门

## 背景
Hooks 是函数组件状态管理的核心方案。

## 核心概念
- useState
- useEffect
- useReducer
- 自定义 Hooks

## 代码示例
```javascript
import { useState, useEffect } from 'react';
const Counter = () => {
  const [count, setCount] = useState(0);
  useEffect(() => console.log(count), [count]);
  return <button onClick={() => setCount(count+1)}>{count}</button>;
};