---
title: '层叠上下文与BFC'
description: '层叠上下文（Stacking Context）决定元素在 Z 轴上的堆叠与 z-index 的比较范围；块级格式化上下文（BFC）决定块级盒子如何布局、如何隔离浮动与外边距塌陷。本文用图解讲清二者的形成条件、内部规则、常见现象（z-index 失效、margin 塌陷、清除浮动）与实战用法。'
updatedAt: '2026-10-02'
module: 'CSS与样式工程'
order: 2
status: 'done'
---

# 层叠上下文与BFC

## 一、是什么

这是 CSS 视觉格式模型中两个「看不见却无处不在」的概念：

- **层叠上下文（Stacking Context）**：一个三维的「堆叠范围」。元素在其中按 Z 轴（垂直屏幕方向）分层排列，`z-index` 只在**同一个层叠上下文内部**比较。
- **块级格式化上下文（BFC, Block Formatting Context）**：页面上一个**独立的布局区域**，内部的块级盒子布局不受外部影响、也不影响外部。

```text
   层叠上下文 = 关于「谁盖在谁上面」（Z 轴 / 堆叠）
   BFC        = 关于「盒子如何排布、如何隔离」（布局 / 边距 / 浮动）
   一个管「叠」，一个管「排」，都是 CSS 渲染的底层规则
```

理解它们，才能解释「为什么 `z-index: 9999` 还是被盖住」「为什么两个盒子的 margin 会合并」「为什么浮动会撑破父容器」这类经典现象。

## 二、为什么

- **z-index 失效之谜**：不懂层叠上下文，就会陷入「拼命加大 z-index 却没用」的困境。
- **margin 塌陷 / 浮动溢出**：不懂 BFC，就无法优雅地解决外边距合并、清除浮动。
- **布局隔离**：BFC 提供「内部布局不外泄」的能力，是很多组件样式的隐形护栏。

> 一句话：层叠上下文回答「谁在上面」，BFC 回答「怎么排布」。二者是排查 CSS 诡异现象的两把钥匙。

## 三、核心原理（上）：层叠上下文

### 1. 层叠顺序：一个上下文内部的分层

在同一个层叠上下文内，元素从**后（底）到前（顶）** 的绘制顺序是固定的：

```text
   ┌─────────────────────────────┐  ↑ 顶（离用户最近）
   │ 7. z-index > 0 的定位元素     │
   │ 6. z-index: auto/0 的定位元素 │
   │ 5. float 浮动元素             │
   │ 4. inline / inline-block 行内 │
   │ 3. z-index < 0 的定位元素     │
   │ 2. block 块级盒子的背景/边框   │
   │ 1. 层叠上下文的根（背景/边框） │
   └─────────────────────────────┘  ↓ 底
```

### 2. 什么会创建层叠上下文

常见触发条件：

```css
/* ① 根元素 <html> 本身 */

/* ② 定位 + z-index 不为 auto */
.el {
  position: relative;
  z-index: 1;
}

/* ③ flex/grid 子项 + z-index 不为 auto */
.flex-child {
  z-index: 2;
}

/* ④ opacity < 1 */
.el {
  opacity: 0.99;
}

/* ⑤ transform / filter / perspective / clip-path 等非 none */
.el {
  transform: translateZ(0);
}

/* ⑥ position: fixed / sticky */
.el {
  position: fixed;
}

/* ⑦ will-change 指定了会创建上下文的属性 */
.el {
  will-change: transform;
}

/* ⑧ isolation: isolate（专门用来「凭空」创建上下文） */
.el {
  isolation: isolate;
}
```

### 3. 关键规则：z-index 只在同一上下文内比较

**这是所有「z-index 失效」的根源**：子元素的 z-index 再大，也无法突破其所属层叠上下文的整体层级。

```text
   父 A（层叠上下文，z-index:1）    父 B（层叠上下文，z-index:2）
   ┌───────────────┐              ┌───────────────┐
   │ 子 A1 z-index:9999│           │ 子 B1 z-index:1│
   └───────────────┘              └───────────────┘
        结果：B1 盖在 A1 之上！
        因为 B(2) > A(1)，整个 B 上下文都在 A 之上，
        A1 的 9999 只在 A 内部有效，无法「越狱」
```

```css
/* ❌ 常见 bug：弹窗被盖住 */
.modal-parent {
  transform: translateX(0);
} /* 意外创建了层叠上下文！ */
.modal {
  z-index: 9999;
} /* 仍被外部其他上下文盖住 */

/* ✅ 修复：让弹窗脱离受限上下文，或调整父级层叠顺序 */
```

## 三、核心原理（下）：BFC

### 1. 什么会触发 BFC

```css
/* ① 根元素 <html> */

/* ② 浮动元素（float 不为 none） */
.el {
  float: left;
}

/* ③ 绝对/固定定位 */
.el {
  position: absolute;
}

/* ④ inline-block / flex / grid 容器 */
.el {
  display: flow-root;
} /* ★ 专门用于创建 BFC 的现代方案，无副作用 */
.el {
  display: flex;
}
.el {
  display: inline-block;
}

/* ⑤ overflow 不为 visible */
.el {
  overflow: hidden;
} /* 经典（但会裁剪溢出内容） */
```

> **`display: flow-root`** 是「纯粹为了创建 BFC」而生的属性，没有 `overflow: hidden` 的裁剪副作用，也不影响布局，是现代首选。

### 2. BFC 的四条布局规则

```text
① 内部的盒子在垂直方向依次排列
② 同一 BFC 内，相邻盒子的垂直 margin 会发生「塌陷」（合并取大值）
③ BFC 的区域不会与 float 元素重叠
④ BFC 是「隔离的独立容器」：内外互不影响；且计算高度时包含浮动子元素
```

### 3. BFC 解决的三大经典问题

**① margin 塌陷（外边距合并）**——用独立 BFC 隔离：

```css
/* 相邻兄弟的上下 margin 会合并，取较大值 */
.a {
  margin-bottom: 20px;
}
.b {
  margin-top: 30px;
} /* 实际间距 = 30px（不是 50px） */

/* 把 b 包进一个新 BFC，即可阻止与外部塌陷 */
.wrapper {
  display: flow-root;
}
```

**② 清除浮动（父元素高度塌陷）**——让父元素成为 BFC 以包含浮动子元素：

```css
.parent {
  display: flow-root;
} /* 自动包含内部浮动，高度不再塌陷为 0 */
```

**③ 阻止元素被浮动覆盖**——BFC 不与 float 重叠，可实现两栏自适应布局：

```css
.left {
  float: left;
  width: 100px;
}
.right {
  display: flow-root;
} /* 形成 BFC，自动占据剩余宽度且不与 left 重叠 */
```

## 四、实践

### 1. 弹窗/下拉的层叠管理

```css
/* 用 isolation: isolate 主动隔离一个组件的层叠，防止其 z-index 影响外部 */
.dropdown-root {
  isolation: isolate;
}
.dropdown-panel {
  z-index: 10;
} /* 只在 dropdown-root 内部生效 */
```

避免「一个组件的高 z-index 污染全局」，是现代组件化样式的重要实践。

### 2. 用 flow-root 做「现代 clearfix」

```css
/* 过去要用 ::after + clear:both 的 clearfix hack */
/* 现在一行搞定： */
.container {
  display: flow-root;
}
```

### 3. 排查 z-index 失效的清单

发现 z-index 不生效时，依次检查祖先链上是否有：`transform`、`opacity<1`、`filter`、`will-change`、`position:fixed`、`contain`——它们都可能悄悄创建了层叠上下文，把你「困」在里面。

## 五、常见误区

- **误区一：z-index 越大越靠前（全局）。** 错。z-index 只在**同一层叠上下文内**比较；不同上下文之间，先比上下文本身的层级。
- **误区二：以为只有 position+z-index 才创建层叠上下文。** `transform`、`opacity<1`、`filter`、`will-change`、flex/grid 子项带 z-index 等都会创建，且往往是「无意间」创建的。
- **误区三：用 `overflow:hidden` 清浮动导致内容被裁。** 它会裁剪溢出部分（如阴影、下拉）；优先用无副作用的 `display: flow-root`。
- **误区四：把 margin 塌陷当 bug 去「修」。** 它是 BFC 的正常规则；理解后可用 BFC 隔离，或干脆用 padding/gap 替代 margin。
- **误区五：混淆层叠上下文与 BFC。** 一个管 Z 轴堆叠、一个管布局隔离，二者独立，一个元素可以同时属于两者。

## 六、总结

- **层叠上下文**是 Z 轴的堆叠范围，`z-index` 仅在**同一上下文内**比较；`transform`/`opacity`/`filter`/`will-change`/定位等会创建新上下文。
- 排查「z-index 失效」的核心，是找出**无意间创建了层叠上下文的祖先**；可用 `isolation: isolate` 主动隔离组件层级。
- **BFC** 是独立的布局区域，遵循「垂直排列、margin 塌陷、不与浮动重叠、包含浮动子元素」四条规则。
- `display: flow-root` 是创建 BFC 的现代无副作用方案，可优雅解决 **margin 塌陷、清除浮动、两栏自适应**。
- 二者一个管「叠」、一个管「排」，共同构成 CSS 视觉格式模型的底层秩序。

> 层叠上下文与 BFC 是 CSS 里典型的「冰山之下」：平时看不见，一旦遇到诡异现象就成了决定性的关键。它们的共同启示是——**CSS 的很多行为不是「随机的怪癖」，而是「格式化上下文」这套底层模型的确定性结果**。理解了模型，你就从「碰运气调样式」升级为「按规则推演布局」。
