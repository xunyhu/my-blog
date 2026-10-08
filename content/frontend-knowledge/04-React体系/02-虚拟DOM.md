---
title: '虚拟DOM'
description: '区分 React element、Fiber 与真实 DOM，理解声明式协调的收益与成本，并用节点身份实验验证重新渲染不等于重建 DOM。'
updatedAt: '2026-10-02'
module: 'React体系'
order: 2
status: 'done'
---

# 虚拟DOM

## 一、是什么

Virtual DOM（虚拟 DOM）是用内存中的描述表达目标 UI，再由渲染器把目标映射到宿主环境的思路。
在 React 中，JSX 产生 React element，组件执行后返回的 element 描述下一次 UI 应是什么样子。
它不是浏览器 DOM 的完整副本，也不是另一套浏览器排版引擎。

先分清三个经常被混用的概念：

| 对象          | 主要职责                           | 是否直接显示像素 |
| ------------- | ---------------------------------- | ---------------- |
| React element | 描述类型、key、props 与 children   | 否               |
| Fiber         | 保存组件身份、状态、调度及协调工作 | 否               |
| DOM 节点      | 浏览器中的宿主节点，参与样式与布局 | 仍需浏览器绘制   |

例如 `<button disabled={busy}>提交</button>` 描述目标属性，而不是命令浏览器“立即创建按钮”。
函数组件返回新的 element，并不意味着一定创建新的按钮 DOM。
只要协调时身份可复用，React 可以继续使用已有节点，按需修改属性。

## 二、为什么

### 声明式描述解决同步难题

在命令式界面中，一个“提交中”状态可能要求同时修改按钮文案、禁用状态、错误区域与进度提示。
如果每个事件回调分别操作这些节点，就容易出现某条错误路径漏恢复按钮的问题。
声明式模型把这些分支收敛到同一份状态与渲染函数，减少手工维护 UI 同步关系的负担。

它的主要价值是：

- 用组件表达 UI 结构，用状态推导输出。
- 让协调器集中判断哪些宿主节点可以复用。
- 为不同宿主渲染器提供共同的组件编程模型。
- 配合调度机制，先计算候选 UI，再提交一致的结果。

这些能力来自 React 的整体架构，不能都归因于“存在一个 JS 对象”。
例如批处理是更新机制的能力，可中断协调依赖 Fiber 与调度器，而不是虚拟 DOM 对象天然会异步执行。

### 虚拟 DOM 不保证更快

如果任务只有“已知节点的一处文本改成新值”，直接更新该文本通常比“运行组件、分配 element、协调、再更新文本”做的工作更少。
这就是“VDOM 总比直接 DOM 快”的反例：额外的抽象层并非零成本。

同样，DOM 写入也不等于立刻发生一次 layout 和 paint。
浏览器可以合并多次写入；读写交错时读取几何信息才可能强制提前布局。
因此不能简单数 DOM API 调用次数，就得出页面耗时结论。

## 三、核心原理

### 从描述到像素

```text
事件 / 数据变化
      |
      v
更新队列 --> Render：执行组件，得到 element 描述
                    |
current Fiber ------+--> Reconciliation：复用身份，标记变更
                    |
                    v
             work-in-progress Fiber
                    |
                    v
Commit：把变更接入真实 DOM，处理 ref / layout Effect
                    |
                    v
浏览器：样式计算 --> layout（按需）--> paint --> 合成
```

Render 可以产生被丢弃的候选结果，所以必须保持纯计算。
并发渲染可以在 React 工作单元之间让出主线程，但不能任意暂停正在执行的一个 JS 函数。
提交中的 DOM 变更与 layout Effect 是同步工作的关键部分，不是浏览器绘制完成的通知。
普通 `useEffect` 在提交后执行，但不承诺永远晚于浏览器 paint。

### 复用不是对象地址相等

每次 JSX 求值通常产生新的 element 描述，协调器仍可能复用旧 Fiber 和旧 DOM。
判断时会考虑父级中的位置、key、类型等信息。
相反，改变组件类型或 key，即使最终 HTML 很像，也可能销毁旧状态并重新挂载。

```text
旧描述：input，key=editor，props={defaultValue: '初始值'}
新描述：input，key=editor，props={defaultValue: '初始值'}
              |
              +--> 描述可不同，底层 input 节点仍可相同

新描述：textarea，key=editor
              |
              +--> 类型改变，不沿用原 input 的组件身份
```

具体的列表身份与移动策略见 [Diff 算法](/knowledge/04-React体系/03-Diff算法)。
Fiber 的工作单元和双缓冲图解见 [Fiber 架构](/knowledge/04-React体系/04-Fiber架构)。

### 与编译时方案的区别

Svelte 的官方定位是把声明式组件编译为优化后的 JavaScript。
它把更多更新逻辑提前到构建时生成，不能套用“每次更新都先构造整棵 VDOM”的模型来理解。
不过，编译时分析不代表浏览器没有运行时开销：依赖追踪、DOM 更新和浏览器渲染仍然需要执行。

React Compiler 也是构建时工具，但其核心目标是自动记忆化组件和计算，不是把 React 换成 Svelte 的更新机制。
**使用 React 19 并不等于已启用 React Compiler**，仍要按构建工具显式接入。
框架选择应结合团队、生态、交互模型与测量结果，而非“有无 VDOM”一个标签。

## 四、代码实现

### 实验一：描述本身不会操作 DOM

以下代码可直接粘贴到 Node.js 终端执行，不需要浏览器或 JSX 编译。
这是自定义教学描述格式，不是 React element 的内部结构实现。

```js
function describeCounter(count) {
  return {
    type: 'button',
    props: {
      disabled: count >= 3,
      children: `计数：${count}`,
    },
  };
}

const before = describeCounter(0);
const after = describeCounter(1);
const changed = Object.keys(after.props).filter(
  (name) => !Object.is(before.props[name], after.props[name]),
);

console.assert(before !== after, '两次描述是不同对象');
console.assert(before.type === after.type, '宿主类型相同');
console.assert(changed.join(',') === 'children', '只有文案变化');
console.log(changed); // ['children']，尚未发生任何 DOM 操作
```

这里能证明“输出描述发生了什么变化”，不能证明 React 的实际操作数或渲染耗时。
协调器还需处理嵌套、组件、状态、事件和宿主属性语义。

### 实验二：重新渲染后保留输入节点

下面是完整 JSX 模块，可作为已有 React 项目的 `App.jsx`，或 Next.js App Router 的客户端页面使用。
只依赖 React，不需要额外组件、数据源或样式。

```jsx
'use client';

import { useRef, useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  const [revision, setRevision] = useState(0);
  const inputRef = useRef(null);
  const savedNode = useRef(null);
  const [report, setReport] = useState('先保存节点，再操作');

  function saveNode() {
    savedNode.current = inputRef.current;
    setReport('节点已保存');
  }

  function compareNode() {
    const same = savedNode.current === inputRef.current;
    setReport(`是否同一个 DOM 节点：${same}`);
  }

  return (
    <section>
      <p>组件状态：{count}</p>
      <input key={revision} ref={inputRef} defaultValue="手动修改这里" />
      <div>
        <button onClick={saveNode}>保存节点</button>
        <button onClick={() => setCount((n) => n + 1)}>普通更新</button>
        <button onClick={compareNode}>比较节点</button>
        <button onClick={() => setRevision((n) => n + 1)}>改变 key</button>
      </div>
      <output>{report}</output>
    </section>
  );
}
```

验证步骤：

1. 手动修改输入内容，点击“保存节点”。
2. 点击“普通更新”，再点“比较节点”：应显示 `true`，输入内容保留。
3. 点击“改变 key”，再点“比较节点”：应显示 `false`，输入恢复默认值。
4. 再保存当前节点可以开始下一轮，不必刷新页面。

比较放在单独的按钮事件中，是为了在前一次提交后再读取 ref。
实验验证的是宿主节点身份，不是速度；不要把保留一个节点说成“性能提升了某个百分比”。

## 五、工程实践

### 先确定瓶颈在哪一层

| 现象                     | 先检查什么                             | 可能的改进                     |
| ------------------------ | -------------------------------------- | ------------------------------ |
| 输入时组件计算很慢       | React Profiler、昂贵过滤函数           | 状态下沉、缓存、拆分计算       |
| JS 不重但滚动掉帧        | 浏览器 Performance 中的 layout / paint | 缩小 DOM、虚拟化、减少昂贵样式 |
| 输入值或局部状态意外清空 | key、组件类型、条件分支                | 修复身份而非添加 memo          |
| 首屏下载很多脚本         | 客户端边界、包体积                     | 代码分割、缩小交互边界         |

DOM 所有权也要明确：不要在 React 管理的容器里手动删除它的子节点。
第三方编辑器或图表应通过 ref 管理专用容器，在 Effect 中建立实例并清理，避免两套系统争抢同一片 DOM。

在本博客中，Markdown 被渲染为 React 元素，再由页面展示。
优化长文章时，应区分 Markdown 解析、高亮的计算成本与浏览器展示长 DOM 的成本。
不能看到内容由 React 渲染，就把所有开销都叫作“虚拟 DOM 慢”。

### 常见误区

- **虚拟 DOM 会自动找到全局最少 DOM 操作。** 协调使用启发式策略，不求任意树的全局最优编辑序列。
- **没有 DOM 变化就没有成本。** 组件执行、element 分配和协调本身仍占用 CPU 与内存。
- **React render 就是浏览器绘制。** 前者计算目标 UI，后者负责布局与像素。
- **给每个组件套 memo 就能解决问题。** 如果瓶颈在大 DOM 的 layout，缓存组件不能消除布局成本。

## 六、总结

虚拟 DOM 的核心价值是声明式 UI 与可组合的更新模型，不是保证比手写 DOM 更快。
理解 element 描述、Fiber 身份、真实 DOM 与像素呈现四者的边界，才能准确分析重渲染问题。
下一步可结合 [性能优化](/knowledge/04-React体系/07-性能优化) 的 Profiler 实验定位实际瓶颈。

### 官方来源

以下资料于 2026-10-02 联网核对；React 实验面向本项目 React 19.2。

- [React：Render and Commit](https://react.dev/learn/render-and-commit)
- [React：Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React：React Compiler Introduction](https://react.dev/learn/react-compiler/introduction)
- [Svelte：Overview](https://svelte.dev/docs/svelte/overview)
