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

V8 是 Google 开源的 JavaScript 引擎，采用即时编译(JIT)技术，将JavaScript代码直接编译为机器码执行。用于

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

## 源码到机器码的旅程

### 词法分析

```js
function sum(a, b) {
  return a + b;
}
```

Parser将源码 👉 转换成 AST：

```js
// 简化AST结构
{
  type: "FunctionDeclaration",
  name: "sum",
  params: ["a", "b"],
  body: {
    type: "ReturnStatement",
    argument: {
      type: "BinaryExpression",
      operator: "+",
      left: { type: "Identifier", name: "a" },
      right: { type: "Identifier", name: "b" }
    }
  }
}
```

### 解释器Ignition

Ignition 👉 把 AST 转换成字节码（Bytecode）

```text
// 字节码示例（简化）
StackCheck
Ldar a          // 加载参数a到累加器
Add b           // 累加器 + b
Return          // 返回累加器值
```

### 编译器TurboFan

核心作用: 👉 把热点代码（Hot Code）编译成机器码

```text
字节码 → Sea of Nodes → 类型特化 → 内联优化 → 逃逸分析 → 寄存器分配 → 机器码生成
```

关键优化技术

1. 函数优化
2. 类型优化
3. 逃逸分析
4. 反优化

## 垃圾回收(GC)

### 内存分区

栈空间存储原始类型和对象引用（由操作系统自动分配释放），堆空间存储引用类型对象（由V8垃圾回收器管理）。

```text
┌──────────────────────────────────┐
│        Stack (栈空间)             │
│  - 原始类型值                     │
│  - 对象引用指针                   │
├──────────────────────────────────┤
│        Heap (堆空间)              │
│  ┌────────────────────────────┐  │
│  │   New Space (新生代)       │  │
│  │   - 存活时间短的对象        │  │
│  │   - 1-8MB                  │  │
│  ├────────────────────────────┤  │
│  │   Old Space (老生代)       │  │
│  │   - 存活时间长的对象        │  │
│  │   - 数百MB                 │  │
│  │   ├─ Map Space (隐藏类)    │  │
│  │   ├─ Old Data Space        │  │
│  │   └─ Large Object Space    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 垃圾回收策略

采用分代回收（新生代Scavenge算法 + 老生代Mark-Sweep/Mark-Compact）

1. 新生代：Scavenge算法（复制式）

```text
From-Space (活动对象)          To-Space (空闲)
┌───┬───┬───┬───┐            ┌───┬───┬───┬───┐
│ A │ B │ C │   │            │   │   │   │   │
└───┴───┴───┴───┘            └───┴───┴───┴───┘
         ↓ 垃圾回收
┌───┬───┬───┬───┐            ┌───┬───┬───┬───┐
│   │   │   │   │            │ A │ B │   │   │
└───┴───┴───┴───┘            └───┴───┴───┴───┘
         ↓ 角色互换
To-Space (新活动区)           From-Space (新空闲区)
┌───┬───┬───┬───┐            ┌───┬───┬───┬───┐
│ A │ B │   │   │            │   │   │   │   │
└───┴───┴───┴───┘            └───┴───┴───┴───┘
```

2. 老生代：Mark-Sweep & Mark-Compact

   Mark-Sweep（标记-清除）

   ```text
      标记阶段                   清除阶段
   ┌───┬───┬───┬───┐        ┌───┬───┬───┬───┐
   │ A │ B │ C │ D │        │ A │   │   │ D │
   │ ✓ │ ✗ │ ✓ │ ✓ │      │ ✓ │   │   │ ✓ │
   └───┴───┴───┴───┘        └───┴───┴───┴───┘
                               内存碎片化
   ```

   Mark-Compact（标记-整理）

   ```text
   标记阶段                   整理阶段
   ┌───┬───┬───┬───┐        ┌───┬───┬───┬───┐
   │ A │ B │ C │ D │        │ A │ C │ D │   │
   │ ✓ │✗ │ ✓ │ ✓│        │ ✓ │ ✓ │ ✓ │   │
   └───┴───┴───┴───┘        └───┴───┴───┴───┘
                         内存连续
   ```

3. 增量标记（Incremental Marking）
4. 并发标记（Concurrent Marking）

## 总结

V8 通过 Parser 生成 AST，Ignition 生成字节码执行，TurboFan 对热点代码进行 JIT 优化，并结合隐藏类和内联缓存提升执行效率。

## 参考

- [V8 官方博客](https://v8.dev/)
