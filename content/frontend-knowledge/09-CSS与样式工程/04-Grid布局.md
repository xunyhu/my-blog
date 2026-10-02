---
title: 'Grid布局'
description: 'CSS Grid 是二维布局模型，能同时控制行与列，是页面骨架与复杂网格的首选。本文讲清网格轨道（grid-template-columns/rows）、fr 单位、间距与显隐式网格、网格区域命名（grid-template-areas）、项目定位（grid-column/row），以及 repeat/auto-fill/minmax 打造响应式自适应网格的实战模式。'
updatedAt: '2026-10-02'
module: 'CSS与样式工程'
order: 4
status: 'done'
---

# Grid布局

## 一、是什么

**CSS Grid（网格布局）是 CSS 的「二维布局模型」**：它同时定义**行（rows）和列（columns）**，把容器划分成一张网格，子项可以被精确放置到任意单元格或跨区域。

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 1fr; /* 三列：固定 + 两个弹性 */
  gap: 16px;                            /* 行列间距 */
}
```

```text
   Grid 是「二维」：行和列一起管
   ┌─────┬───────┬───────┐
   │     │       │       │  ← 第 1 行
   ├─────┼───────┼───────┤
   │     │       │       │  ← 第 2 行
   └─────┴───────┴───────┘
     ↑列1   ↑列2    ↑列3
   对比 Flex：Flex 一次只管一条轴（一维）
```

**Flex vs Grid**：Flex 是「一维」（一行或一列的内容排布），Grid 是「二维」（页面级骨架、规整网格）。二者互补——Grid 定大格局，Flex 排格子内部。

## 二、为什么

- **二维控制**：唯一能「行列同时对齐」的原生方案，做仪表盘、相册、卡片墙、整页布局得心应手。
- **声明式骨架**：用 `grid-template-areas` 可以「画出」布局，语义清晰、易于响应式重排。
- **强大自适应**：`repeat(auto-fill, minmax(...))` 一行实现「无媒体查询的响应式网格」。
- **内容与布局解耦**：项目可通过 `grid-column/row` 跨区、重排，甚至用 `order` 之外的方式调整位置。

> 一句话：**整页骨架、规整网格用 Grid；一行/一列的内容对齐用 Flex。** 大多数现代页面是「Grid 布局 + Flex 细节」的组合。

## 三、核心原理

### 1. 定义网格：轨道（Track）

```css
.grid {
  display: grid;
  grid-template-columns: 200px 1fr 2fr; /* 列轨道：3 列 */
  grid-template-rows: 60px 1fr auto;    /* 行轨道：3 行 */
  gap: 12px;                             /* = row-gap + column-gap */
}
```

- **轨道（track）**：两条网格线之间的行或列。
- **网格线（line）**：分隔轨道的线，从 1 开始编号，是定位项目的基准。
- **`fr`（fraction）**：剩余空间的**份数**单位，是 Grid 的灵魂。

```text
   grid-template-columns: 200px 1fr 2fr;  （容器宽 800px，gap 忽略）
   ┌────────┬──────────┬────────────────┐
   │ 200px  │   1fr    │      2fr       │
   │ 固定   │ 剩 600px │  按 1:2 分配    │
   └────────┴──────────┴────────────────┘
             1fr=200px        2fr=400px
   fr 分配的是「减去固定轨道后的剩余空间」
```

### 2. 显式网格 vs 隐式网格

`grid-template-*` 定义的是**显式网格**；当项目超出定义的行数，Grid 会自动创建**隐式轨道**，其尺寸由 `grid-auto-rows`/`grid-auto-columns` 控制：

```css
.grid {
  grid-template-columns: repeat(3, 1fr); /* 显式：3 列 */
  grid-auto-rows: 120px;                 /* 隐式新增行的高度 */
}
```

### 3. repeat()：轨道的批量定义

```css
grid-template-columns: repeat(3, 1fr);        /* = 1fr 1fr 1fr */
grid-template-columns: repeat(2, 100px 1fr);  /* = 100px 1fr 100px 1fr */
```

### 4. grid-template-areas：可视化命名布局

用「画地图」的方式命名区域，直观且易于响应式重排：

```css
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  gap: 8px;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

```text
   ┌────────────── header ──────────────┐
   ├────────┬───────────────────────────┤
   │sidebar │           main            │
   ├────────┴───────────────────────────┤
   └────────────── footer ──────────────┘
   响应式时只需改 grid-template-areas 的「字符画」即可重排
```

### 5. 项目定位：基于网格线

```css
.item {
  grid-column: 1 / 3;   /* 从第 1 条列线跨到第 3 条（占 2 列） */
  grid-row: 2 / 4;      /* 从第 2 条行线跨到第 4 条（占 2 行） */
}
.item2 { grid-column: span 2; } /* 跨 2 列（简写） */
```

```text
   列线： 1 ┃ 2 ┃ 3 ┃ 4    （3 列有 4 条线）
        grid-column: 1 / 3 → 占第 1、2 两列
        grid-column: span 2 → 从当前位置跨 2 列
```

## 四、实践

### 1. 无媒体查询的响应式网格（Grid 杀手锏）

```css
.auto-grid {
  display: grid;
  /* 每列最小 200px，能塞几列塞几列，剩余空间自动均分 */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
```

```text
   容器变宽 → 自动增加列数；变窄 → 自动减少，全程无需 @media！
   auto-fill：填满容器（保留空轨道）  auto-fit：折叠空轨道（项目拉伸占满）
   minmax(200px, 1fr)：每列 ≥200px，有富余则拉伸到 1fr
```

这是本项目卡片列表、相册类布局的理想方案——**自适应且零媒体查询**。

### 2. 整页布局骨架

```css
body {
  display: grid;
  grid-template-rows: auto 1fr auto; /* header / 内容撑满 / footer */
  min-height: 100vh;
}
```

### 3. Grid + Flex 组合

```css
.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.card { display: flex; flex-direction: column; } /* 卡片内部用 Flex 排列 */
.card .footer { margin-top: auto; } /* Flex 把底部推到卡片底端，等高对齐 */
```

**Grid 排卡片矩阵，Flex 排卡片内部**——这是最经典的组合拳。

## 五、常见误区

- **误区一：所有布局都用 Grid（或都用 Flex）。** 二维骨架用 Grid、一维内容用 Flex，混用才是常态。
- **误区二：混淆 `auto-fill` 与 `auto-fit`。** `auto-fill` 保留空轨道（项目不拉伸填满），`auto-fit` 折叠空轨道（项目拉伸占满整行）——项目少于一行时差异明显。
- **误区三：网格线编号从 0 开始。** 网格线从 **1** 开始；3 列有 4 条列线（1/2/3/4）。
- **误区四：`fr` 分配的是全部宽度。** `fr` 分配的是**减去固定轨道和 gap 后的剩余空间**，不是容器总宽。
- **误区五：忘记 `minmax` 的下限导致溢出。** 用 `minmax(min(100%, 200px), 1fr)` 或直接 `1fr` 配合项目 `min-width: 0`，防止长内容撑破网格。

## 六、总结

- Grid 是**二维布局模型**，同时控制行与列，是页面骨架与规整网格的首选。
- 核心概念：**轨道**（`grid-template-columns/rows`）、**网格线**（从 1 编号，项目定位基准）、**`fr`**（剩余空间份数）。
- **`grid-template-areas`** 以「字符画」声明布局，语义直观、易于响应式重排。
- **`repeat(auto-fill/auto-fit, minmax(...))`** 实现无媒体查询的自适应网格，是 Grid 的杀手锏。
- 实战范式：**Grid 定大骨架 + Flex 排内部细节**，二者互补覆盖绝大多数布局需求。

> 如果说 Flex 让「一条线上的对齐」变得简单，那 Grid 则让「整个平面的编排」第一次变得可控。它的深远意义在于：**布局从「基于文档流的层层嵌套 hack」，升级为「基于坐标网格的显式声明」**。当你能用 `grid-template-areas` 像画草图一样描述页面，用一行 `minmax` 替代一堆媒体查询时，就真正体会到现代 CSS 的表达力——布局，本该如此直观。
