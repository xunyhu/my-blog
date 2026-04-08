---
title: '你不知道的 JavaScript'
date: '2026-03-01'
tags: [{ name: 'JavaScript', slug: 'javascript' }]
category: 'frontend'
description: '构建 JS 底层认知'
---

## 作用域链

### 概念

- 作用域是一套规则，程序根据这套规则来存储变量，并且能在之后对这个变量的值进行访问或修改。
- 执行上下文是 JS 代码运行时的环境，包含变量环境、作用域链和 this，在创建阶段完成变量提升，在执行阶段逐行运行代码，并通过调用栈进行管理。

### 原理解析

- JS 是**词法作用域（静态作用域）** 词法作用域是由你在写代码时将变量和块作用域写在哪里来决定的。
- 作用域在**定义时确定，而不是执行时**
- 执行上下文包含：
  - 变量环境（var）
  - 词法环境（let / const）
  - this 绑定

### 示例代码

```js
var a = 1;

function foo() {
  var b = 2;

  function bar() {
    console.log(a, b);
  }

  return bar;
}

var fn = foo();
fn();
```

```
                 🌍 全局执行上下文（Global EC）
┌──────────────────────────────────────────────┐
│ 变量环境：                                    │
│   a = 1                                      │
│   foo = function                             │
│                                              │
│ 作用域链： null                               │
│ this → window                                │
└──────────────────────────────────────────────┘
                     ↓ 调用 foo()

        📦 foo 执行上下文（Function EC）
┌──────────────────────────────────────────────┐
│ 变量环境：                                    │
│   b = 2                                      │
│   bar = function                             │
│                                              │
│ 作用域链： → 指向 Global EC                   │
│ this → window                                │
└──────────────────────────────────────────────┘
                     ↓ 调用 bar()

        📦 bar 执行上下文（Function EC）
┌──────────────────────────────────────────────┐
│ 变量环境：                                    │
│   （无局部变量）                              │
│                                              │
│ 作用域链： → foo EC → Global EC               │
│ this → window                                │
└──────────────────────────────────────────────┘
```

## this 绑定

4 种绑定规则（优先级从低到高）

1. 默认绑定（window / undefined）
2. 隐式绑定（obj.fn）
3. 显示绑定（call / apply / bind）
4. new 绑定 (最高)

## 闭包

闭包 = 函数 + 它的词法作用域

闭包是作用域的延续，变量不会被回收（被引用）

## 原型 & 原型链

关键关系

```js
obj.__proto__ === Constructor.prototype;
```

图解逻辑

```text
实例 -> 构造函数.prototype -> Object.prototype -> null
```

```js
function Foo() {}

Foo.prototype.a = 1;

const f = new Foo();

console.log(f.a); // 👉 查找过程：f → Foo.prototype → Object.prototype
```

## new 到底做了什么

```js
function Person(name) {
  this.name = name;
}

const p = new Person('Tom');
```

实际执行过程

```js
function myNew(fn, ...args) {
  const obj = {};
  obj.__proto__ = fn.prototype;
  const res = fn.apply(obj, args);
  return res instanceof Object ? res : obj;
}
```

## == vs ===

常见误区

```js
[] == ![]; // true ❗
//  ![] -> false    [] == false
```

## 事件循环（Event Loop）本质

执行顺序

1. 执行同步代码
2. 执行微任务（Promise）
3. 执行宏任务（setTimeout）

```js
console.log(1);

setTimeout(() => console.log(2));

Promise.resolve().then(() => console.log(3));

console.log(4);

// 输出：1 4 3 2
```

## Promise 的本质

三种状态

- pending
- fulfilled
- rejected

## async / await 本质

```js
async function foo() {
  await bar();
}
```

👉 等价于：

```js
function foo() {
  return Promise.resolve(bar()).then(() => {});
}
```

👉 本质：语法糖 + Promise

## 深拷贝 ≠ JSON.stringify

```js
JSON.parse(JSON.stringify(obj));
```

## 防抖 vs 节流

### 防抖（debounce）

👉 只执行最后一次

```js
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}
```

节流（throttle）

👉 固定时间执行一次

```js
function throttle(fn, delay) {
  let last = 0;
  return function () {
    const now = Date.now();
    if (now - last > delay) {
      fn();
      last = now;
    }
  };
}
```

## 模块化

### ESM

```js
import { a } from './a.js';
export const b = 2;
```

### CommonJS

```js
const a = require('./a');
module.exports = {};
```

## 为什么 0.1 + 0.2 !== 0.3？

```js
0.1 + 0.2 === 0.30000000000000004;
```

👉 原因：浮点数精度问题（IEEE 754）

解决：

```js
(0.1 + 0.2).toFixed(2); // "0.30"
```

## 数组方法的“副作用”

1. 会改变原数组
   - push
   - pop
   - shift
   - unshift
   - splice
   - sort

2. 不会改变
   - map
   - filter
   - slice

## Map vs Object

| 特性     | Object        | Map  |
| -------- | ------------- | ---- |
| key 类型 | string/symbol | 任意 |
| 顺序     | 无保证        | 有序 |
| 性能     | 一般          | 更优 |

## 为什么要用 Symbol？

```js
const key = Symbol('id');
```

特点：唯一; 不会冲突; 可用于隐藏属性

## 浏览器渲染流程

1. HTML → DOM
2. CSS → CSSOM
3. 合并 → Render Tree
4. Layout（回流）
5. Paint（重绘）

[从访问URL到浏览器渲染](https://www.toutiao.com/w/1831791358033920/)

## 垃圾回收

常见算法

- 标记清除（Mark & Sweep）
- 引用计数（已淘汰）

👉 重点：

- 闭包可能导致内存泄漏
- DOM 引用未释放

## 总结

- JS 的核心是：作用域 + this + 原型链
- 异步的核心是：事件循环 + Promise
- 工程的核心是：模块化 + 性能优化
