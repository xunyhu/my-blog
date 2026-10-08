---
title: 'CSS变量与主题化'
description: 'CSS 自定义属性（变量）让样式值可复用、可动态切换，是主题化的基石。本文讲清变量的作用域与继承、var() 用法与回退值、用 :root + 类切换实现明暗主题、Tailwind 4 的 @theme 设计令牌，以及变量的动态计算与工程化组织，并结合本博客项目的真实主题配置示范落地。'
updatedAt: '2026-10-02'
module: 'CSS与样式工程'
order: 6
status: 'done'
---

# CSS变量与主题化

## 一、是什么

**CSS 自定义属性（CSS Variables），俗称 CSS 变量**，是以 `--` 开头、可通过 `var()` 引用的动态值。它让「颜色、间距、字号」等设计值**集中定义、一处修改、处处生效**，是实现主题化（换肤、明暗模式）的基石。

```css
:root {
  --primary: #3b82f6; /* 定义变量 */
  --radius: 8px;
}
.btn {
  background: var(--primary); /* 使用变量 */
  border-radius: var(--radius);
}
```

本项目的 `globals.css` 正是用变量定义全局色彩基线：

```css
/* app/globals.css（本项目真实代码） */
:root {
  --background: #ffffff;
  --foreground: #171717;
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
body {
  background: var(--background);
  color: var(--foreground);
}
```

## 二、为什么

- **DRY**：设计值只定义一次，改主题色不必全局搜索替换。
- **可动态切换**：变量能在运行时被 JS 或 CSS 规则覆盖——这是明暗主题、换肤的技术前提。
- **作用域继承**：变量随 DOM 树继承，可在不同层级覆盖，实现「局部主题」。
- **可读性**：`var(--color-primary)` 比 `#3b82f6` 语义清晰得多。

> 对比预处理器变量（Sass 的 `$primary`）：Sass 变量在**编译期**就被替换成固定值，运行时不可变；**CSS 变量活在运行时**，能被 JS 修改、被媒体查询/类选择器覆盖——这正是 CSS 原生变量取代预处理器变量的关键。

## 三、核心原理

### 1. 作用域与继承

CSS 变量遵循 DOM 树的**继承**规则：定义在祖先元素上，后代都能访问；后代也可「就近覆盖」。

```css
:root {
  --text: #333;
} /* 全局默认（:root 优先级高于 html） */
.card {
  --text: #666;
} /* .card 内覆盖 */
.card p {
  color: var(--text);
} /* 这里的 --text 是 #666（就近继承） */
```

```text
   :root { --text:#333 }
        │ 继承
        ▼
   .card { --text:#666 }  ← 就近覆盖，只影响 .card 子树
        │ 继承
        ▼
   .card p → var(--text) = #666
```

### 2. var() 与回退值（fallback）

```css
.el {
  color: var(--brand); /* 若 --brand 未定义，属性失效（invalid） */
  color: var(--brand, #3b82f6); /* 第二参数是回退值：--brand 无效时用 #3b82f6 */
  padding: var(--gap, var(--default-gap, 8px)); /* 回退值可嵌套变量 */
}
```

**务必给关键变量设回退值**，避免变量未定义时样式整个失效。

### 3. 明暗主题：类切换 + 变量覆盖

主题化的标准范式——**变量集中定义，切换「作用域类」即可整体换肤**：

```css
/* 亮色（默认） */
:root {
  --bg: #ffffff;
  --fg: #171717;
  --card: #f9fafb;
}
/* 暗色：给根元素加 .dark 类时覆盖同名变量 */
.dark {
  --bg: #0a0a0a;
  --fg: #ededed;
  --card: #1a1a1a;
}
/* 所有组件只管用变量，无需关心当前是哪个主题 */
body {
  background: var(--bg);
  color: var(--fg);
}
.card {
  background: var(--card);
}
```

```text
   切换主题 = 给 <html> 增删 .dark 类
   ┌─────────────┐         ┌─────────────┐
   │ <html>       │  加类   │ <html class  │
   │  --bg:#fff   │ ─────▶ │ ="dark">     │
   │  （亮色变量）│         │  --bg:#0a0a0a│ ← 同名变量被覆盖
   └─────────────┘         └─────────────┘
   组件代码零改动，仅变量值切换 → 整站换肤
```

配合 `prefers-color-scheme` 还能自动跟随系统：

```css
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --bg: #0a0a0a;
    --fg: #ededed;
  }
}
```

本项目 `tailwind.config.js` 设 `darkMode: 'class'`，即采用「类切换」策略——给根元素加 `dark` 类激活暗色，与上述范式一致。

### 4. 变量的动态计算

CSS 变量可与 `calc()` 结合，实现「基于一个基准派生一套值」：

```css
:root {
  --base: 16px;
  --scale: 1.25;
}
h1 {
  font-size: calc(var(--base) * var(--scale) * var(--scale));
}
.gap-sm {
  gap: calc(var(--base) * 0.5);
}
```

变量还能被 **JS 运行时读写**，这是动态主题、跟随鼠标的渐变等效果的基础：

```js
document.documentElement.style.setProperty('--primary', '#ff0000');
const v = getComputedStyle(el).getPropertyValue('--primary');
```

### 5. Tailwind 4 的 @theme：设计令牌

Tailwind CSS v4 采用 **CSS 优先**的配置方式，用 `@theme` 在 CSS 里声明设计令牌（design tokens），它们会同时生成对应的工具类：

```css
/* Tailwind v4：@theme 定义令牌 → 自动生成工具类 */
@theme {
  --color-brand: #3b82f6; /* → 可用 bg-brand / text-brand */
  --spacing-lg: 1.5rem; /* → 可用 p-lg 等 */
  --font-sans: var(--font-geist-sans);
}
@theme inline {
  /* inline：令牌值直接内联引用其它变量（如本项目的 --background） */
  --color-background: var(--background);
}
```

```text
   @theme { --color-brand: #3b82f6 }
        │  Tailwind 扫描后自动生成
        ▼
   .bg-brand { background: var(--color-brand) }
   .text-brand { color: var(--color-brand) }
   —— 令牌即变量、变量即工具类，设计系统「单一事实源」
```

本项目 `globals.css` 顶部的 `@import 'tailwindcss'` 与 `@theme inline`，正是 Tailwind v4「用 CSS 变量承载设计令牌」的体现——**主题色既是 CSS 变量，又自动变成 Tailwind 工具类**。

## 四、实践

### 1. 变量的工程化组织

```css
/* tokens.css —— 设计令牌分层：原始值 → 语义值 */
:root {
  /* 原始令牌（Primitive）：调色板 */
  --blue-500: #3b82f6;
  --gray-900: #111827;
  /* 语义令牌（Semantic）：按用途命名，引用原始值 */
  --color-primary: var(--blue-500);
  --color-text: var(--gray-900);
}
```

**「原始令牌 + 语义令牌」两层结构**是现代设计系统的主流：调色板（原始）稳定，语义层（primary/text/border）随主题切换——组件只引用语义层。

### 2. 组件级变量作用域

```css
.btn {
  --btn-bg: var(--color-primary);
  background: var(--btn-bg);
}
.btn-danger {
  --btn-bg: #ef4444;
} /* 仅改一个变量即派生出变体 */
```

用「局部变量」定义组件的可调点，变体只需覆盖变量，避免重复声明整块样式。

## 五、常见误区

- **误区一：把 CSS 变量当 Sass 变量用。** CSS 变量是**运行时**的（可被 JS/媒体查询/类覆盖），Sass 变量是编译期常量；需要动态切换必须用 CSS 变量。
- **误区二：变量未定义又不设回退。** `var(--x)` 中 `--x` 无效会导致该声明 invalid；关键处应写 `var(--x, 回退值)`。
- **误区三：以为变量名随便起。** 变量遵循作用域继承，命名应有体系（`--color-*`/`--space-*`），否则大型项目会混乱。
- **误区四：明暗主题写两套完整样式。** 应「组件只用语义变量 + 主题类覆盖变量」，而非为暗色重写每个选择器——后者无法维护。
- **误区五：混淆 `:root` 与 `html`。** 二者都指根元素，但 `:root` 优先级更高（伪类 > 类型选择器），定义全局变量惯例用 `:root`。

## 六、总结

- CSS 变量（自定义属性）是**运行时**的动态值，遵循 DOM 作用域继承，可被 JS/类/媒体查询覆盖——这是它超越预处理器变量的核心。
- **主题化范式**：语义变量集中定义于 `:root`，用「作用域类（如 `.dark`）覆盖同名变量」实现整站换肤，组件代码零改动。
- **`var()` 回退值**保障健壮性；**`calc()`** 让变量参与派生计算。
- **Tailwind v4 的 `@theme`** 用 CSS 变量承载设计令牌，令牌即变量、变量即工具类，本项目 `@theme inline` 即此模式。
- 工程上采用**「原始令牌 + 语义令牌」分层**，组件只依赖语义层，是设计系统可维护的关键。

> CSS 变量的意义，远不止「少写重复值」——它第一次让**样式具备了运行时的可编程性**。主题、换肤、动态渐变、组件变体，本质都是「改变量的值」。当设计值从散落的字面量，收敛为有作用域、可继承、能被覆盖的变量体系，CSS 就从「静态描述」进化为「响应上下文的动态系统」——这正是现代主题化与设计令牌的哲学内核。
