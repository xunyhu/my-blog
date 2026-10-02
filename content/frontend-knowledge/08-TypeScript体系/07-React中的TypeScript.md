---
title: 'React中的TypeScript'
description: 'React 与 TypeScript 是现代前端的默认组合。本文讲清组件 props 的类型定义（内联解构 vs interface vs React.FC 的取舍）、children 与事件处理器类型、useState/useRef/自定义 Hook 的泛型标注、泛型组件、React 19 的 ref as prop 与 Context 类型，并结合本博客项目的真实组件示范落地。'
updatedAt: '2026-10-02'
module: 'TypeScript体系'
order: 7
status: 'done'
---

# React中的TypeScript

## 一、是什么

**「React + TypeScript」是现代前端的默认技术栈**：React 负责 UI 组件模型，TypeScript 负责给组件的 props、state、事件、ref 提供编译期类型约束。二者结合，让组件的「输入契约」显式化，重构有据、协作清晰。

本项目（Next.js App Router）全程 TSX，一个组件的 props 类型随处可见——比如博客的 `MarkdownRenderer`：

```tsx
// app/components/post/MarkdownRenderer.tsx（本项目真实代码）
export default function MarkdownRenderer({ content }: { content: string }) {
  return <div className="prose">{/* … 渲染 content … */}</div>;
}
```

`{ content }: { content: string }` 这行就浓缩了 React TS 的核心：**给组件的入参（props）标注类型**。本篇展开 props、children、事件、Hooks、泛型组件、ref、Context 的类型化套路。

## 二、为什么

- **props 即契约**：调用方少传/错传 prop，编辑器立即标红，而非运行时 `undefined` 崩溃。
- **重构安全**：改一个 prop 名或类型，所有 `<Component />` 使用点同步报错。
- **自动补全**：写 JSX 时 IDE 提示所有可用 props 及其类型，开发体验飞跃。
- **自文档化**：类型定义就是最好的组件文档，`interface Props` 一目了然。

> 本项目 `types/blog.ts` 用字面量联合 `type Category = 'frontend' | 'projects'` 约束分类，任何写错的 category 都会在编译期被拦截——这正是「类型即护栏」在日常的体现。

## 三、核心原理

### 1. 组件 props 的三种类型化方式

```tsx
// 方式 A：内联对象类型（props 少时最简洁，本项目 MarkdownRenderer/TagFilter 用此法）
function TagFilter({ tags, category }: { tags: Tag[]; category?: string }) { /* … */ }

// 方式 B：interface（props 多、需继承/复用时首选）
interface PostCardProps {
  title: string;
  date: number;
  tags?: Tag[];
}
function PostCard(props: PostCardProps) { /* … */ }

// 方式 C：type（需要联合/工具类型时）
type ButtonProps = { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

**选型**：props 少用内联；props 多或要复用/继承用 `interface`（见《接口与类型别名》）。

### 2. React.FC 的取舍

早年流行用 `React.FC<Props>`（Function Component）标注组件，但**现代实践普遍不推荐**：

```tsx
// ❌ 不推荐：React.FC 隐式带 children、且对泛型组件/默认值支持不佳
const Card: React.FC<CardProps> = ({ title }) => <div>{title}</div>;

// ✅ 推荐：直接标注 props，children 显式声明
function Card({ title, children }: CardProps) {
  return <div>{title}{children}</div>;
}
```

React 18 起 `React.FC` 已移除隐式 `children`；直接写函数 + 标注 props 更透明、对泛型和 `defaultProps`（也已弃用，改用参数默认值）更友好。

### 3. children 类型：ReactNode

需要接收子内容的组件，`children` 的类型通常是 `React.ReactNode`（能渲染的一切：元素、字符串、数字、数组、null 等）：

```tsx
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;       // 通用容器
  title?: string;
}
function Layout({ children, title }: LayoutProps) {
  return <main><h1>{title}</h1>{children}</main>;
}
```

`ReactNode`（可渲染的宽泛类型）vs `ReactElement`（仅 JSX 元素）——容器组件一般用 `ReactNode`。

### 4. 事件处理器类型

React 的合成事件有自己的类型，位于 `React` 命名空间下：

```tsx
import { useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';

function SearchForm() {
  const [value, setValue] = useState('');

  // 输入框 change 事件：ChangeEvent<HTMLInputElement>
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value); // e.target 被精确推导为 HTMLInputElement
  }
  // 表单 submit：FormEvent
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }
  // 点击：MouseEvent<HTMLButtonElement>
  function handleClick(e: MouseEvent<HTMLButtonElement>) { /* … */ }

  return <form onSubmit={handleSubmit}>{/* … */}</form>;
}
```

```text
   常见事件类型速记：
   ChangeEvent<T>   —— input/select/textarea 变化（T 是元素类型）
   FormEvent        —— form 提交
   MouseEvent<T>    —— 点击/悬停
   KeyboardEvent<T> —— 键盘
   FocusEvent<T>    —— 聚焦/失焦
```

**多数情况下无需手写**——内联箭头函数的事件参数会由**上下文类型**自动推导（见《类型推导》）：

```tsx
<input onChange={(e) => setValue(e.target.value)} /> // e 自动是 ChangeEvent<HTMLInputElement>
```

### 5. Hooks 的泛型标注

```tsx
// useState：能推导初值就别标注
const [count, setCount] = useState(0);            // useState<number>，自动推导
// 初值为 null/undefined、或需要联合类型时，显式传泛型
const [user, setUser] = useState<User | null>(null); // useState<User | null>

// useRef：区分「DOM 引用」与「可变值容器」
const inputRef = useRef<HTMLInputElement>(null);   // ref.current 可为 null（挂 DOM）
const timerRef = useRef<number | undefined>(undefined); // 存普通值

// useEffect / useCallback / useMemo：靠回调与依赖推导，一般无需标注
useEffect(() => { /* … */ }, [count]);
```

`useRef<HTMLInputElement>(null)` 是访问 DOM 的标准写法，配合 `<input ref={inputRef} />` 获得类型安全的 `inputRef.current`。

### 6. 泛型组件

组件也能是泛型的——常见于「列表」「选择器」这类不关心具体数据类型的通用 UI：

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}
// 泛型组件：T 由传入的 items 推导
function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}

// 使用：T 自动推导为 User，renderItem 的 item 就是 User
<List items={users} renderItem={(u) => <span>{u.name}</span>} />
```

注意：泛型箭头函数在 `.tsx` 中要写 `<T,>`（避免与 JSX 标签歧义），或直接用 `function` 声明规避。

### 7. ref 类型：React 19 的 ref as prop

React 19 中函数组件可**直接把 `ref` 当普通 prop 接收**，不再需要 `forwardRef`（见《React18与19特性》）：

```tsx
// React 19：ref 作为普通 prop，类型是 Ref<T>
import type { Ref } from 'react';

interface InputProps {
  ref?: Ref<HTMLInputElement>;
  placeholder?: string;
}
function Input({ ref, placeholder }: InputProps) {
  return <input ref={ref} placeholder={placeholder} />;
}
// 使用：<Input ref={inputRef} />
```

### 8. Context 类型

```tsx
import { createContext, useContext } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggle: () => void;
}
// createContext 传入类型；默认值给 null 时标注联合
const ThemeContext = createContext<ThemeContextValue | null>(null);

// 封装 useTheme，内部收窄掉 null
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用');
  return ctx; // 返回类型收窄为 ThemeContextValue
}
```

## 四、实践：本项目模式提炼

- **props 少 → 内联解构类型**：`MarkdownRenderer({ content }: { content: string })`、`TagFilter({ tags, category, currentTag }: { tags: Tag[]; category?: string; currentTag?: string })`，简洁直观。
- **共享数据结构 → 抽到 `types/`**：`Tag`、`Post`、`Category` 定义在 `types/blog.ts`，组件通过 `import type { Tag } from '@/types/blog'` 复用（路径别名见《TS工程配置》）。
- **可选 prop 用 `?`**：`category?: string`，配合 `if (!tags.length) return null` 的早返回，类型与运行时防御双保险。

```tsx
// 本项目的 props 复用模式：组件从 types 导入共享类型
import type { Tag } from '@/types/blog';

interface Props { tags: Tag[]; currentTag?: string; }
```

## 五、常见误区

- **误区一：无脑用 `React.FC`。** 它隐式 children（18 起已移除）、对泛型不友好；直接标注 props 更透明。
- **误区二：事件类型手写 `any`。** 用 `React.ChangeEvent<HTMLInputElement>` 等精确类型，或直接内联让上下文推导。
- **误区三：`useState(null)` 不标泛型。** 会推导成 `null`，后续 `setUser({...})` 报错；应写 `useState<User | null>(null)`。
- **误区四：`useRef` 分不清两种用法。** 挂 DOM 用 `useRef<HTMLInputElement>(null)`；存可变值用 `useRef<T>(initial)`——语义不同。
- **误区五：`.tsx` 里泛型箭头函数写 `<T>` 报错。** 会被当成 JSX 标签，需写 `<T,>` 或改用 `function` 声明。
- **误区六：React 19 还在写 `forwardRef`。** 已可直接接收 `ref` prop，`forwardRef` 弃用。

## 六、总结

- React TS 的核心是**给 props、state、事件、ref 标注类型**，让组件契约显式化。
- **props**：少则内联解构类型，多则 `interface`；避免无脑 `React.FC`，`children` 用 `ReactNode`。
- **事件**：用 `React.ChangeEvent`/`FormEvent`/`MouseEvent` 等，或靠内联上下文自动推导。
- **Hooks**：`useState`/`useRef` 在初值不足以推导时显式传泛型（尤其 `null` 初值与 DOM ref）。
- **泛型组件**让通用 UI 保持类型精确；**React 19 ref as prop** 取代 `forwardRef`；**Context** 配 `createContext<T>` + 封装 `useContext` 收窄。
- 本项目示范了「内联 props + 共享 `types/` + 路径别名」的轻量而一致的落地方式。

> React 与 TypeScript 的结合，本质是把「组件」从一个**运行时约定**升级为一份**编译期契约**：props 是输入签名，state 是内部类型，事件是回调签名。当这些全部显式化，组件便不再是「黑盒」，而是可被静态分析、安全重构、自动补全的**类型化积木**——这正是现代前端工程可靠性的地基。
