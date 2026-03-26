---
title: 'V8 执行原理'
date: '2026-03-01'
tags:
  [
    { name: 'JavaScript', slug: 'javascript' },
    { name: '浏览器', slug: 'browser' },
  ]
category: 'frontend'
description: 'JavaScript “是怎么跑起来的”'
---

# V8 执行原理

## V8 是什么

V8 是 Google 开源的 JavaScript 引擎，用于

- Chrome 浏览器
- Node.js

👉 本质：**把 JS 代码 → 转换成机器码执行**

## V8 执行流程

```text
JS 源代码
   ↓
Parser（解析器）
   ↓
AST（抽象语法树）
   ↓
Ignition（解释器）生成字节码
   ↓
TurboFan（编译器）优化为机器码
   ↓
CPU 执行
```

## Parser（解析阶段）

做了什么？

```js
const a = 1 + 2;
```

👉 转换成 AST：

```json
{
  "type": "VariableDeclaration",
  "init": {
    "type": "BinaryExpression",
    "operator": "+"
  }
}
```

同时完成：

- 语法检查（报错）
- 作用域构建
