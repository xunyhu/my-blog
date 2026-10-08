---
title: 'Flex布局'
description: 'Flexbox 是 CSS 的一维布局模型，擅长在一条轴（主轴）上分配空间与对齐。本文用主轴/交叉轴模型讲清容器属性（flex-direction/justify-content/align-items/flex-wrap/gap）与项目属性（flex-grow/shrink/basis 及简写 flex、align-self），并给出居中、等分、圣杯、粘性页脚等高频实战模式与常见坑。'
updatedAt: '2026-10-02'
module: 'CSS与样式工程'
order: 3
status: 'done'
---

# Flex布局

## 一、是什么

**Flexbox（弹性盒子）是 CSS 的「一维布局模型」**：让容器内的子项沿**一条轴**灵活地排列、伸缩、对齐，并自动分配剩余空间。它是现代布局最常用的工具，尤其适合导航栏、工具条、卡片行、居中布局等「一维」场景。

```css
.container {
  display: flex;
} /* 容器变成弹性盒，直接子项成为「弹性项目」 */
```

对比传统布局，Flex 的革命性在于：**布局不再依赖浮动和精确宽度计算，而是「声明意图，容器自动分配」。**

```text
   传统：float + 手算宽度 + clearfix hack（脆弱、反直觉）
   Flex：display:flex + 声明对齐/伸缩规则（健壮、语义化）
```

## 二、为什么

- **一维布局的最优解**：一行导航、一组按钮、垂直居中等，Flex 几行搞定。
- **自适应**：子项能按 `flex-grow/shrink` 自动填充或收缩，天然响应式。
- **对齐能力强**：主轴、交叉轴双向对齐，垂直居中不再是世纪难题。
- **DOM 顺序与视觉解耦**：可用 `order`、`flex-direction: row-reverse` 调整视觉顺序而不动 HTML。

> 何时用 Flex、何时用 Grid？**一维（一行或一列）用 Flex，二维（行×列同时控制）用 Grid**——二者互补，也常嵌套（Grid 定大骨架，Flex 排局部）。

## 三、核心原理

### 1. 两根轴：主轴与交叉轴

Flex 的一切都围绕两根轴，理解它们是掌握 Flex 的前提：

```text
   flex-direction: row（默认）
   ┌──────────────── 主轴 (main axis) ────────────────▶┐
   │  ┌────┐ ┌────┐ ┌────┐                            │
   │  │项目│ │项目│ │项目│                            │  ↕ 交叉轴
   │  └────┘ └────┘ └────┘                            │ (cross axis)
   └───────────────────────────────────────────────────┘
   主轴起点(main-start)                    主轴终点(main-end)

   justify-content → 沿【主轴】分布     align-items → 沿【交叉轴】对齐
```

**主轴方向由 `flex-direction` 决定**，`justify-content` 永远作用于主轴、`align-items` 永远作用于交叉轴——方向翻转时，二者的视觉效果也随之互换。

### 2. 容器属性

```css
.container {
  flex-direction: row | row-reverse | column | column-reverse; /* 主轴方向 */
  flex-wrap: nowrap | wrap | wrap-reverse; /* 是否换行 */
  justify-content: flex-start | center | flex-end | space-between | space-around
    | space-evenly; /* 主轴分布 */
  align-items: stretch | flex-start | center | flex-end | baseline; /* 交叉轴对齐 */
  align-content: /* wrap 多行时，行与行在交叉轴的分布 */;
  gap: 12px; /* 项目间距（现代首选，替代 margin hack） */
}
```

`justify-content` 的三种「分散」区别：

```text
   space-between：两端贴边，间距只在项目之间       [A]   [B]   [C]
   space-around ：每个项目两侧等距（两端有半格）    [A]  [B]  [C]
   space-evenly ：所有间隔（含两端）完全相等        [A]  [B]  [C]
```

### 3. 项目属性：flex-grow / shrink / basis

这是 Flex「弹性」的核心，也是最易困惑处：

```css
.item {
  flex-grow: 0; /* 有剩余空间时，是否放大及放大比例（默认 0 不放大） */
  flex-shrink: 1; /* 空间不足时，是否收缩及收缩比例（默认 1 收缩） */
  flex-basis: auto; /* 分配空间前的「初始主尺寸」（默认 auto=按内容） */
}
```

```text
   flex-grow 分配「剩余空间」：
   ┌──────────────────────────────┐
   │ [A:1] [B:2] [   剩余空间   ] │  A grow=1, B grow=2
   └──────────────────────────────┘  → 剩余空间按 1:2 分给 A、B
   flex-shrink 分配「溢出量」（空间不足时按 basis×shrink 加权收缩）
```

### 4. flex 简写（务必理解其展开）

```css
flex: 1; /* = flex: 1 1 0%   —— 等分剩余空间（最常用） */
flex: auto; /* = flex: 1 1 auto —— 先按内容尺寸，再分配剩余 */
flex: none; /* = flex: 0 0 auto —— 完全不伸缩（固定尺寸） */
flex: 0 1 auto; /* 默认值 */
```

**`flex: 1` 与 `flex: auto` 的关键差异**在 basis：前者 basis=0（无视内容，纯按比例等分），后者 basis=auto（以内容为基准再分剩余）。等分布局用 `flex: 1`，内容自适应用 `flex: auto`。

### 5. align-self 与 order

```css
.item {
  align-self: flex-end;
} /* 单个项目覆盖容器的 align-items */
.item {
  order: -1;
} /* 调整视觉顺序（越小越靠前，默认 0） */
```

## 四、实践：高频布局模式

### 1. 水平垂直居中（Flex 最经典用法）

```css
.center-box {
  display: flex;
  justify-content: center; /* 主轴（水平）居中 */
  align-items: center; /* 交叉轴（垂直）居中 */
  min-height: 100vh;
}
```

### 2. 两端对齐导航栏

```css
.nav {
  display: flex;
  justify-content: space-between; /* logo 靠左，菜单靠右 */
  align-items: center;
}
```

### 3. 等分布局（如三列卡片）

```css
.row {
  display: flex;
  gap: 16px;
}
.row > .col {
  flex: 1;
} /* 三列等分，gap 控制间距 */
```

### 4. 粘性页脚（内容不足时也贴底）

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.page > main {
  flex: 1;
} /* main 撑满剩余高度，把 footer 顶到底部 */
```

### 5. 自动换行的标签墙

```css
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
/* 标签超出自动换行，gap 控制行列间距 */
```

## 五、常见误区

- **误区一：`justify-content` 和 `align-items` 记反。** 记住：`justify` = 主轴、`align` = 交叉轴；`flex-direction` 一变，二者视觉方向随之互换。
- **误区二：`flex: 1` 和 `flex: auto` 混用。** 前者 basis=0 纯等分，后者 basis=auto 以内容为基准；等分布局务必用 `flex: 1`。
- **误区三：用 margin 硬凑间距。** 现代应优先用 `gap`，它不会在首尾产生多余间距，也不用处理 `:last-child`。
- **误区四：子项设了 `width` 却不收缩/溢出。** Flex 项目默认 `min-width: auto`，可能拒绝收缩到内容以下；需 `min-width: 0` 才能让其正常收缩（长文本溢出常因此而起）。
- **误区五：所有布局都用 Flex。** 二维对齐（行和列同时）用 Grid 更合适；Flex 强行做二维会嵌套很多层。

## 六、总结

- Flex 是**一维布局模型**，围绕**主轴 + 交叉轴**两根轴展开；`flex-direction` 决定主轴方向。
- **容器属性**：`justify-content`（主轴分布）、`align-items`（交叉轴对齐）、`flex-wrap`（换行）、`gap`（间距）。
- **项目属性**：`flex-grow/shrink/basis` 控制伸缩，简写 `flex: 1`（等分）/`flex: auto`（内容自适应）/`flex: none`（固定）。
- 高频模式：居中、两端导航、等分列、粘性页脚、换行标签墙——几乎覆盖日常一维布局。
- 常见坑：`min-width: 0` 才能让项目收缩、优先用 `gap` 而非 margin。

> Flexbox 的精髓是**从「精确控制尺寸」转向「声明分配意图」**：你不再计算每个子项该多宽，而是告诉容器「如何伸缩、如何对齐」，剩下的交给弹性算法。这种思维转变，正是现代 CSS 布局从「脆弱的手工活」走向「健壮的声明式」的分水岭——而它与 Grid 的一维/二维分工，构成了今天所有复杂界面的布局基石。
