---
title: 'TypeScript 从入门到进阶'
date: '2026-03-01'
tags: [{ name: 'TypeScript', slug: 'typescript' }]
category: 'frontend'
description: '解析 TypeScript 的核心概念、类型系统、泛型与进阶技巧。'
---

# TypeScript 从入门到进阶

## 什么是 TypeScript

TypeScript 是由 Microsoft 开发的一种 **JavaScript 超集**，增加了 **静态类型** 和 **编译时检查** 功能。  
它可以编译为标准 JavaScript，在浏览器或 Node.js 上运行。

核心优势：

- 静态类型检查，减少运行时错误
- 提供智能提示（IDE 支持）
- 更好地支持大型项目和团队协作
- 与现有 JS 兼容

---

## 基础类型

TypeScript 提供丰富的基础类型：

```ts
let isDone: boolean = false;
let count: number = 42;
let username: string = 'Alice';

let list: number[] = [1, 2, 3];
let tuple: [string, number] = ['Alice', 25];

enum Color {
  Red,
  Green,
  Blue,
}

let c: Color = Color.Green;

let anything: any = 4;
anything = 'maybe a string';
anything = true;
```

## 函数类型与接口

### 函数类型

```ts
function add(a: number, b: number): number {
  return a + b;
}

const multiply = (x: number, y: number): number => x * y;
```

### 接口

```ts
interface Person {
  name: string;
  age: number;
  sayHi(): void;
}

const alice: Person = {
  name: 'Alice',
  age: 25,
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  },
};

interface Add {
  (a: number, b: number): number;
}
const sum: Add = (x, y) => x + y;
```

## 联合类型与类型别名

```ts
let value: string | number;
value = 'hello';
value = 42;

type ID = string | number;
const userId: ID = 12345;
```

- | 表示联合类型
- 类型别名可以复用复杂类型

## 泛型（Generics）

泛型可以让函数、类、接口在保证类型安全的前提下更加灵活：

```ts
function identity<T>(arg: T): T {
  return arg;
}

const str = identity<string>('hello');
const num = identity<number>(123);

interface Box<T> {
  value: T;
}

const stringBox: Box<string> = { value: 'hello' };
```

泛型常用于组件、工具函数、集合类型等场景

## 高级类型

### 交叉类型（Intersection）

```ts
interface A {
  a: string;
}
interface B {
  b: number;
}

type AB = A & B;
const obj: AB = { a: 'hi', b: 42 };
```

### 可选链与空值合并

```ts
interface User {
  profile?: {
    name: string;
  };
}

const username = user.profile?.name ?? 'Anonymous';
```

### 条件类型与映射类型

```ts
type MessageOf<T> = T extends { message: unknown } ? T['message'] : never;

interface Email {
  message: string;
}

type EmailMessage = MessageOf<Email>; // string
```

## TypeScript 在 React 中的应用

### 函数组件 Props 类型

```ts
interface ButtonProps {
  label: string;
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
);
```

### useState 类型

```ts
const [count, setCount] = React.useState<number>(0);
```

### 泛型 Hooks

```ts
function useArray<T>(initial: T[]) {
  const [arr, setArr] = React.useState<T[]>(initial);
  const push = (item: T) => setArr([...arr, item]);
  return { arr, push };
}

const { arr, push } = useArray<number>([1, 2, 3]);
```

## TypeScript 最佳实践

- 尽量使用明确类型，避免 any
- 使用接口或类型别名封装复杂对象
- 利用泛型提高函数、组件复用性
- 配合 ESLint + Prettier 保持代码风格一致
- 结合 React、Node.js 项目实践类型安全

## 总结

TypeScript 提升了 JavaScript 的类型安全和开发效率，尤其适合中大型前端项目。
