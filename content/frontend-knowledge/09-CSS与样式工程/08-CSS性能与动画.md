---
title: 'CSS性能与动画'
description: 'CSS 性能关乎关键渲染路径与每一帧的流畅度。本文讲清 CSSOM 构建与渲染阻塞、浏览器的重排/重绘/合成三阶段、为何 transform 与 opacity 动画更高效（GPU 合成层）、will-change 与 contain/content-visibility 的隔离优化，以及避免布局抖动、读写分离等动画实战准则与常见误区。'
updatedAt: '2026-10-02'
module: 'CSS与样式工程'
order: 8
status: 'done'
---

# CSS性能与动画

## 一、是什么

**CSS 性能包含两个维度**：一是**加载阶段**——CSS 如何阻塞渲染、影响首屏（关键渲染路径）；二是**运行阶段**——样式变化如何触发浏览器重排/重绘/合成，决定动画是否流畅（60fps）。

```text
   加载性能：CSS 到达 → 构建 CSSOM → 与 DOM 合成渲染树 → 首次绘制
             （CSS 是「渲染阻塞资源」，处理不当会白屏）

   运行性能：修改样式 → Layout(重排) → Paint(重绘) → Composite(合成)
             （动画走哪条路径，决定它卡不卡）
```

理解浏览器「从 CSS 到像素」的流水线，是所有性能优化的前提。

## 二、为什么

- **首屏体验**：CSS 阻塞渲染，体积大或加载慢会导致白屏，直接影响 LCP（最大内容绘制）等 Core Web Vitals。
- **动画流畅度**：触发布局/绘制的动画会掉帧、卡顿；走合成层的动画才能稳定 60fps。
- **移动端功耗**：不必要的重排重绘既卡又费电。

> 一句话：**加载阶段别让 CSS 挡住首屏，运行阶段别让动画触发重排重绘。** 这是 CSS 性能的两条主线。

## 三、核心原理

### 1. 关键渲染路径：CSS 是渲染阻塞资源

```text
   HTML → DOM 树
              ↘
               渲染树(Render Tree) → Layout(布局) → Paint(绘制) → Composite(合成) → 像素
              ↗
   CSS  → CSSOM 树
   （CSS 阻塞渲染：CSSOM 未构建完，浏览器不会绘制，避免「无样式内容闪烁 FOUC」）
```

- **CSS 阻塞渲染**：浏览器要等 CSSOM 构建完成才绘制，防止先显示无样式内容再跳变（FOUC）。
- **CSS 也阻塞 JS 执行**：因为 JS 可能读取样式，脚本执行前需等 CSSOM 就绪。

**优化手段**：

```html
<!-- ① 媒体查询拆分：非当前视口的 CSS 不阻塞渲染 -->
<link rel="stylesheet" href="print.css" media="print" />
<link rel="stylesheet" href="desktop.css" media="(min-width:1024px)" />

<!-- ② 关键 CSS 内联：首屏样式直接内联，省一次请求 -->
<style>/* 首屏关键样式 */</style>

<!-- ③ 预加载关键字体/CSS -->
<link rel="preload" href="main.css" as="style" />
```

配合 `font-display: swap`（字体加载期先用后备字体，避免文字不可见）优化字体渲染。

### 2. 运行的三阶段：Layout / Paint / Composite

一次样式变更，浏览器可能要经过三个阶段，**代价依次递减**：

```text
   ① Layout（重排/回流）：重新计算元素几何位置与尺寸
        触发：改 width/height/margin/padding/font-size/display/位置
        代价：最高（可能波及整棵布局树）
             │
   ② Paint（重绘）：重新绘制像素（颜色、阴影、圆角等）
        触发：改 color/background/box-shadow/visibility
        代价：中等
             │
   ③ Composite（合成）：把已有图层按变换重新组合
        触发：改 transform/opacity
        代价：最低（可在 GPU 上完成，不碰布局和绘制）✅
```

**性能铁律**：动画优先只动 `transform` 和 `opacity`——它们只触发合成，可交给 GPU，不引发重排重绘。

### 3. 为什么 transform / opacity 更快：合成层（Compositing Layer）

浏览器会把某些元素**提升为独立图层（layer）**，图层的位移/缩放/透明度变化只需 GPU 重新合成，无需重跑 Layout/Paint：

```css
/* ❌ 动画 left：每帧都触发 Layout（重排），卡 */
.box-bad { position: absolute; left: 0; transition: left 0.3s; }
.box-bad:hover { left: 100px; }

/* ✅ 动画 transform：只触发 Composite，GPU 加速，流畅 */
.box-good { transition: transform 0.3s; }
.box-good:hover { transform: translateX(100px); }
```

```text
   left 动画：  每帧 → Layout → Paint → Composite   （CPU 重活，掉帧）
   transform：  每帧 → ─────── Composite ───────   （GPU 直接合成，60fps）
```

### 4. will-change：提前告知浏览器「我要变了」

`will-change` 提示浏览器**提前为元素创建合成层**，避免动画开始时的临时提升开销：

```css
.el { will-change: transform; } /* 提前准备，动画更顺滑 */
```

⚠️ **慎用**：每个合成层都占内存，滥用 `will-change`（尤其加在大量元素或 `will-change: auto`）会导致内存暴涨、反而变卡。**用完可移除**，且应加在「真的要频繁变化」的少数元素上。

### 5. contain 与 content-visibility：隔离渲染开销

```css
/* contain：声明元素的「隔离边界」，其内部变化不影响外部布局/绘制 */
.widget { contain: layout paint; }  /* 布局与绘制被隔离在此 */

/* content-visibility：跳过屏幕外内容的渲染，长列表首屏加速利器 */
.long-list-item {
  content-visibility: auto;          /* 不在视口内时跳过渲染 */
  contain-intrinsic-size: 200px;     /* 占位高度，避免滚动条跳动 */
}
```

```text
   content-visibility: auto 的威力：
   1000 个卡片，首屏只渲染视口内的 ~10 个，其余「按需渲染」
   → 首屏 Layout/Paint 工作量骤降，长页面渲染显著加速
```

`contain-intrinsic-size` 提供占位尺寸，防止未渲染元素高度为 0 导致滚动条抖动。

### 6. 布局抖动（Layout Thrashing）：读写分离

**在 JS 中交替「读取几何属性」和「写样式」会强制浏览器同步重排**，是动画卡顿的隐形杀手：

```js
// ❌ 布局抖动：每次读 offsetWidth 都强制同步布局（因为前面刚写了样式）
els.forEach((el) => {
  el.style.width = el.offsetWidth + 10 + 'px'; // 写→读→写→读…反复强制重排
});

// ✅ 读写分离：先批量读，再批量写
const widths = els.map((el) => el.offsetWidth); // 阶段一：全部读完
els.forEach((el, i) => { el.style.width = widths[i] + 10 + 'px'; }); // 阶段二：全部写
```

```text
   读几何属性（offsetWidth/Height、scrollTop、getComputedStyle）会「刷新」布局队列。
   若刚写过样式又立刻读，浏览器被迫同步计算布局 → 抖动。
   对策：把「读」集中在前、「写」集中在后，或用 requestAnimationFrame 分批。
```

## 四、实践

### 1. 用 requestAnimationFrame 编排动画

```js
// 把视觉更新放进 rAF，与浏览器刷新节奏对齐，避免一帧内多次重排
function animate() {
  el.style.transform = `translateX(${x}px)`; // 只动 transform
  requestAnimationFrame(animate);
}
```

### 2. CSS 动画 vs JS 动画的选择

- **纯视觉、可预知的动画**（hover、loading、过渡）→ **CSS**（浏览器优化好、走合成层）。
- **复杂、依赖运行时计算的动画**（物理、拖拽）→ **JS + rAF**，但仍应尽量只改 `transform/opacity`。

### 3. 减少选择器复杂度与重排范围

- 避免超深的后代选择器（匹配有成本）；
- 对频繁变化的元素用 `position: absolute/fixed` 脱离文档流，减小重排波及范围；
- 批量修改类名，而非逐条改 `style`。

## 五、常见误区

- **误区一：动画用 `top/left/width/margin`。** 这些触发 Layout（重排），每帧都算布局；应改用 `transform`（只合成）。
- **误区二：`will-change` 加满全站求快。** 每个提升层都吃内存，滥用适得其反；只在真正频繁变化处、且用完可移除。
- **误区三：在循环里边读几何边写样式。** 造成布局抖动、强制同步重排；务必读写分离或用 rAF。
- **误区四：以为所有 CSS 都必须阻塞。** 用 `media` 拆分非关键 CSS、内联首屏关键 CSS，可减少阻塞、加速首屏。
- **误区五：忽略 `content-visibility`。** 长列表/长文档不做屏幕外渲染优化，首屏 Layout/Paint 白白浪费。
- **误区六：`opacity: 0` 代替 `visibility: hidden`/`display: none`。** `opacity:0` 仍占位、仍可交互、仍在渲染树；按语义选对隐藏方式。

## 六、总结

- CSS 性能分**加载**与**运行**两条线：加载阶段 CSS 是**渲染阻塞资源**，用媒体拆分、关键 CSS 内联、preload、`font-display` 优化首屏。
- 运行阶段样式变更经过 **Layout（重排，最贵）→ Paint（重绘）→ Composite（合成，最省）**；**动画只动 `transform`/`opacity`** 走 GPU 合成，是流畅的关键。
- **`will-change`** 提前提升合成层（慎用防内存暴涨）；**`contain`** 隔离渲染边界；**`content-visibility: auto`** + `contain-intrinsic-size` 跳过屏幕外渲染，长列表首屏利器。
- **避免布局抖动**：JS 中读写分离，或用 `requestAnimationFrame` 编排。
- 纯视觉动画优先 CSS，复杂运行时动画用 JS + rAF，但都应收敛到合成属性。

> CSS 性能优化的本质，是**理解并顺应浏览器「从样式到像素」的流水线**：加载时别挡住关键渲染路径，运行时把变化推向代价最低的合成阶段。当你知道「改 `transform` 和改 `left` 走的是两条完全不同的路」，性能就不再是玄学调参，而是**基于渲染原理的确定性工程**——这正是从「会写 CSS」到「懂 CSS 性能」的分水岭。
