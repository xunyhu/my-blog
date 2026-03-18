---
title: "TypeScript 泛型与实用类型"
date: "2026-03-17"
tags: ["TypeScript", "泛型", "类型"]
category: "typescript"
description: "TypeScript 泛型和实用工具类型系统化总结"
---

# TypeScript 泛型与实用类型

## 背景
泛型是 TypeScript 的核心能力之一，能提升函数、类和组件的复用性。实用类型让类型操作更简洁。

## 泛型基础
```typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<number>(42);