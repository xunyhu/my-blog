---
title: 'ECMAScript 简介'
date: '2026-03-01'
tags: [{ name: 'JavaScript', slug: 'javascript' }]
category: 'frontend'
description: 'JavaScript 的标准化规范'
---

ECMAScript（简称 ES）是 JavaScript 的标准化规范，由 Ecma International 组织维护。它定义了脚本语言的语法、类型、语义和核心库，使得不同环境下的 JavaScript 行为保持一致。

JavaScript 是 ECMAScript 的实现之一，浏览器、Node.js 以及其他平台上的 JavaScript 都遵循 ECMAScript 标准。

## ECMAScript 的历史

ECMAScript 的发展经历了多个版本，每个版本都带来了新的语法特性和 API。主要历程如下：

- ES1 (1997)：首个标准化版本，定义了基本语法和核心对象。
- ES2 (1998)：修正小错误，保持与 ES1 的兼容。
- ES3 (1999)：引入正则表达式、try/catch、更多字符串处理方法。
- ES5 (2009)：添加严格模式 ("use strict")、JSON 支持、数组新方法、对象属性特性等。
- ES6 / ES2015：重大更新，引入 let/const、箭头函数、模板字符串、类（class）、模块（module）、Promise 等。
- ES2016 ~ ES2025：每年更新，引入了 async/await、Array.includes、BigInt、可选链（?.）、Nullish 合并操作符（??）等现代特性。

## ECMAScript 的核心特性

### 语法与关键字

ECMAScript 定义了变量声明、函数定义、运算符、控制语句等基础语法。例如：

```js
let name = 'ECMAScript';
const version = 2026;

function greet(msg) {
  console.log(`${msg}, ${name} v${version}`);
}

greet('Hello');
```

### 数据类型

标准定义了以下数据类型：

- 原始类型：Number、String、Boolean、BigInt、Symbol、null、undefined
- 引用类型：Object（包括数组、函数、Map、Set 等）

### 对象与类

ECMAScript 提供了对象和面向对象编程的支持：

```js
class Person {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(`Hi, I'm ${this.name}`);
  }
}

const alice = new Person('Alice');
alice.greet();
```

### 模块化

ES6 引入了标准模块系统，使代码可以分文件组织：

```js
// math.js
export function add(a, b) {
  return a + b;
}

// main.js
import { add } from './math.js';
console.log(add(2, 3)); // 5
```

### 异步编程

ECMAScript 提供了多种异步处理方式，包括 Promise、async/await：

```js
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  console.log(data);
}

fetchData();
```

## ECMAScript 的现代发展

现代 ECMAScript 强调以下趋势：

- 模块化与组件化：模块成为前端和 Node.js 开发的标准。
- 异步与响应式：支持 async/await、Promise、生成器、Observable 等模式。
- 增强的类型与安全性：引入 Symbol、BigInt 等，方便处理大型应用。
- 逐年更新：每年 ECMAScript 都会发布新特性，如可选链、Nullish 合并、逻辑赋值等。

了解 ECMAScript 的标准和演进，对于编写高质量、跨平台的 JavaScript 代码至关重要。

## 结语

ECMAScript 是 JavaScript 的核心规范，学习 ECMAScript 不只是掌握语法，更是理解 JavaScript 行为、设计模式和现代前端开发趋势的基础。

无论你是前端开发、Node.js 开发，还是全栈开发，熟悉 ECMAScript 的新特性都能显著提升代码质量和开发效率。

## ECMAScript 特性一览表

| 版本             | 发布时间  | 主要特性                                                                                                  |
| ---------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| **ES1**          | 1997      | JavaScript 基础语法、对象、数组、函数                                                                     |
| **ES2**          | 1998      | 小幅修正，保证与 ES1 兼容                                                                                 |
| **ES3**          | 1999      | 正则表达式、try/catch、更多字符串和数组方法                                                               |
| **ES5**          | 2009      | 严格模式 `"use strict"`、JSON 支持、数组新增方法（forEach、map、filter）、Object.defineProperty           |
| **ES6 / ES2015** | 2015      | `let`/`const`、箭头函数、模板字符串、类（class）、模块（module）、Promise、解构赋值、默认参数、扩展运算符 |
| **ES2016**       | 2016      | Array.includes、指数操作符（\*\*）                                                                        |
| **ES2017**       | 2017      | async/await、Object.values、Object.entries                                                                |
| **ES2018**       | 2018      | 扩展正则表达式、异步迭代（for-await-of）                                                                  |
| **ES2019**       | 2019      | Array.flat/flatMap、Object.fromEntries、可选 catch 绑定                                                   |
| **ES2020**       | 2020      | Nullish 合并操作符 (`??`)、可选链操作符 (`?.`)、BigInt、动态 import                                       |
| **ES2021**       | 2021      | String.replaceAll、Promise.any、逻辑赋值操作符                                                            |
| **ES2022**       | 2022      | 顶层 await、class 字段声明、Error.cause                                                                   |
| **ES2023**       | 2023      | Array.findLast/findLastIndex、Hashbang 注释 (`#!`)                                                        |
| **ES2024+**      | 2024-2025 | 正在提案和实验阶段的新特性，如 Records & Tuples、Array Grouping、模式匹配等                               |
