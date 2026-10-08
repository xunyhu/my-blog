---
title: 'Hooks原理'
description: '沿用 Fiber 的 Hook 链表模型，理解调用顺序、use 的例外、状态快照与闭包，并用可运行的队列模型及计时器实验验证 Effect 清理。'
updatedAt: '2026-10-02'
module: 'React体系'
order: 5
status: 'done'
---

# Hooks原理

## 一、是什么

Hooks 是函数组件接入 React 状态、上下文、引用与外部系统同步等能力的 API。
函数调用结束后局部变量会消失，但 React 把组件身份关联的数据保存在组件之外，下一次渲染再提供给组件。

其中要区分三类对象：

- 当前渲染的局部变量：这一次调用看到的状态快照。
- 与组件身份关联的 Hook 数据：跨渲染保存状态、更新队列或依赖。
- 事件与 Effect 的回调：普通 JavaScript 闭包，捕获创建时那次渲染的变量。

自定义 Hook 组合这些 API，复用的是逻辑，而不是自动让多个调用者共享一份 state。
如果要共享状态，需要提升状态、Context 或外部 store 等明确的数据所有者。

## 二、为什么

仅记住 `useState` 返回两个值，无法解释下列现象：

1. 为什么不能在条件分支里调用普通 Hook？
2. 为什么调用 setter 后，当前回调里的变量没有立即改变？
3. 为什么定时器持续读到旧 count？
4. 为什么空依赖 Effect 在开发环境还会执行额外一次？
5. 为什么同一组件改变 key 后，所有 Hook 状态都重新初始化？

这些问题分别对应调用顺序、更新队列、闭包快照、清理对称性与组件身份。
本篇聚焦机制；常用 API 的入门用法可参见博客 [React Hooks](/blog/post/react/react-hooks)，不再逐项重复 API 教程。

## 三、核心原理

### 复用 Fiber 的链表模型

沿用 [Fiber 架构](/knowledge/04-React体系/04-Fiber架构) 中“函数组件 Fiber 指向 Hook 链表”的图解，缩小到本篇需要的状态关系：

```text
函数组件 Fiber
  memoizedState
       |
       v
  Hook A                  Hook B                  Hook C
  useState(count) ------> useEffect(...) -------> useState(open) --> null
  memoizedState           Effect 信息             memoizedState
  queue: 状态更新         deps / setup / cleanup   queue: 状态更新

更新渲染：
current 的 Hook A/B/C --按调用次序读取--> work-in-progress 的 Hook A/B/C
```

这里是 `useState`、`useEffect` 等常见 Hook 的心智模型，不表示每个 React API 都严格对应一个同形节点。
例如读取 Context 与 `use` 不能简单套用“占一个 state 槽”的推断。
Fiber 篇中的 `hooksList` 是教学别名；这里使用函数组件 Fiber 的 `memoizedState` 表示链表入口。
状态 Hook 的更新队列与 Fiber 层面的 Effect 管理结构也不是同一个东西。

### 调用顺序是寻址方式

React 不会根据局部变量名 `count` 查找状态，而是在渲染过程中按既定次序读取 Hook。
如果上次为 A、B、C，本次跳过 B，就会让 C 对应错误的位置。
因此普通 Hook 必须放在组件或自定义 Hook 的顶层，并在可能的提前返回之前调用。

```text
上次：useState(count) -> useState(open) -> useEffect
本次：useState(count) ------------------> useEffect
                                   ^
                            第 2 个位置不再匹配
```

条件逻辑应放进 Effect 回调内部，或拆分成独立组件，而不是有时调用、有时跳过 `useEffect`。
不要在事件处理器、普通工具函数、循环或 `useMemo` 回调里调用普通 Hook。
自定义 Hook 也必须遵守这些规则，因为它内部的调用仍属于调用者的渲染顺序。

### use 是明确的例外

React 19 的 `use(resource)` 用于在渲染期间读取 Promise 或 Context。
它允许出现在条件与循环中，但仍只能从组件或 Hook 中调用，不能放在事件处理器或普通函数中任意执行。
读取 Promise 时不能用 `try/catch` 包住 `use`；挂起交给 Suspense，失败交给 Error Boundary。
Promise 实例还需保持稳定，不能每次客户端 render 都新建请求 Promise。

下面是完整的 Context 示例，没有异步请求依赖；可作为 React 19 的客户端 `App.jsx`：

```jsx
'use client';

import { createContext, use, useState } from 'react';

const ThemeContext = createContext('light');

function Badge({ visible }) {
  if (!visible) return null;
  const theme = use(ThemeContext); // 条件 return 之后仍合法，use 是例外
  return <p>当前主题：{theme}</p>;
}

export default function App() {
  const [visible, setVisible] = useState(true);
  return (
    <ThemeContext value="dark">
      <button onClick={() => setVisible((value) => !value)}>切换显示</button>
      <Badge visible={visible} />
    </ThemeContext>
  );
}
```

不要由这个例外推导出 `useContext`、`useState` 也可以条件调用。

### 更新队列与闭包快照

setter 提交的是更新请求，不是改写当前 render 已经拿到的变量。
同一个回调连续三次 `setCount(count + 1)`，传入的是同一份快照算出的相同值。
连续三次 `setCount((n) => n + 1)` 则会把三个转换函数排入队列，依次作用于前一个结果。

```text
当前 render：count = 0
值更新队列：   [1, 1, 1]           --> 下一状态 1
函数更新队列： [n=>n+1, n=>n+1, n=>n+1] --> 下一状态 3
```

定时器中的旧值不是 React 随机丢数据，而是回调闭包仍属于旧渲染。
函数式更新适合“基于前值求新值”；如果回调还依赖其他 props，仍需把这些依赖正确纳入同步设计。
更新函数必须纯净，因为开发检查或渲染重试可能再次调用它。

### Effect 是同步过程而非渲染中的动作

```text
提交版本 A --> setup(A)
依赖变化并提交版本 B --> cleanup(A) --> setup(B)
卸载 --> cleanup(B)

StrictMode 根边界下的开发检查：setup --> cleanup --> setup
被丢弃且未提交的 render：不会执行它的 Effect setup
```

依赖数组逐项用 `Object.is` 比较，不做深比较。
省略依赖表示每次该组件提交后重新同步；空数组表示不依赖响应式值，不是“整个应用生命周期只执行一次”。
Effect 只在客户端执行；一般非交互 Effect 会在 paint 后运行，但这不是所有情形的固定顺序。
`useLayoutEffect` 用于需要在浏览器绘制前同步处理的布局逻辑，其重活会阻塞绘制。

## 四、代码实现

### 可执行的队列与顺序模型

以下代码可直接在 Node.js 中运行，只模拟单组件的 state 槽与更新队列。
它用数组代替上文链表以降低实验成本，**不是 React Hook 的生产实现**。
不支持并发、优先级、多个组件、Effect 或 `use`，也不会自动调度渲染。

```js
function createStateModel() {
  const slots = [];
  let cursor = 0;
  let expectedCount;

  function state(initial) {
    const index = cursor++;
    if (!slots[index]) {
      slots[index] = { value: initial, pending: [] };
    }
    const slot = slots[index];
    for (const update of slot.pending) {
      slot.value = typeof update === 'function' ? update(slot.value) : update;
    }
    slot.pending = [];
    return [slot.value, (update) => slot.pending.push(update)];
  }

  function render(component) {
    cursor = 0;
    const result = component();
    if (expectedCount !== undefined && cursor !== expectedCount) {
      throw new Error('状态槽调用数量改变');
    }
    expectedCount = cursor;
    return result;
  }
  return { state, render };
}

const model = createStateModel();
function Counter() {
  const [count, setCount] = model.state(0);
  return { count, setCount };
}

const first = model.render(Counter);
first.setCount(first.count + 1);
first.setCount(first.count + 1);
const second = model.render(Counter);
if (second.count !== 1) throw new Error('值更新应为 1');
second.setCount((n) => n + 1);
second.setCount((n) => n + 1);
const third = model.render(Counter);
if (third.count !== 3) throw new Error('函数更新应累加到 3');
if (first.count !== 0) throw new Error('旧快照不应被改写');

let rejected = false;
try {
  model.render(() => null); // 少调用一个状态槽，故意触发模型检查
} catch {
  rejected = true;
}
if (!rejected) throw new Error('应拒绝改变调用数量');
console.log('队列、快照、调用数量检查通过');
```

这个检查只比较数量，无法发现“数量相同但顺序交换”等所有错误。
工程中应依赖 React 的规则与 ESLint 检查，而不是复制这个模型替代 React。

### 完整计时器实验

以下 JSX 模块可作为已有 React 项目的 `App.jsx`，或 Next.js 客户端页面。
不请求网络，不需要外部组件；“错误版本”专门用于复现旧闭包。

```jsx
'use client';

import { useEffect, useState } from 'react';

function Timer({ stale, delay }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    // 故意捕获初值 0，模拟空依赖闭包一直拿旧值的现象。
    const captured = 0;
    console.log('setup', { stale, delay });
    const id = setInterval(() => {
      if (stale) setSeconds(captured + 1);
      else setSeconds((value) => value + 1);
    }, delay);
    return () => {
      clearInterval(id);
      console.log('cleanup', { stale, delay });
    };
  }, [stale, delay]);
  return (
    <p>
      {stale ? '错误闭包对照' : '函数式更新'}：{seconds}
    </p>
  );
}

export default function App() {
  const [visible, setVisible] = useState(true);
  const [delay, setDelay] = useState(1000);
  return (
    <section>
      <button onClick={() => setVisible((value) => !value)}>挂载或卸载</button>
      <button
        onClick={() => setDelay((value) => (value === 1000 ? 500 : 1000))}
      >
        切换间隔：{delay}ms
      </button>
      {visible && (
        <>
          <Timer stale={true} delay={delay} />
          <Timer stale={false} delay={delay} />
        </>
      )}
    </section>
  );
}
```

真实的常见错误是 `useEffect(() => { setInterval(() => setCount(count + 1), 1000); }, [])`：遗漏 `count` 依赖且没有清理。
实验把旧值显式设为 `captured`，让错误语义可复现，同时不要求读者关闭依赖检查。
预期：错误对照停在 1，函数更新持续递增；切换间隔会先清理旧 interval，再创建新 interval。
卸载时两者都清理，重新挂载从 0 开始。根级 StrictMode 的开发检查会额外出现一次清理与建立，不应有两个存活的计时器。

## 五、工程实践

### 从闭包问题选择正确修复

| 需求                     | 处理方式                       | 不要做什么                |
| ------------------------ | ------------------------------ | ------------------------- |
| 计数基于前值累加         | 函数式 setter                  | 为躲依赖检查读旧 count    |
| roomId 改变需要重新订阅  | 在 Effect 内订阅，依赖 roomId  | 用空数组固定第一次订阅    |
| 请求响应可能乱序         | cleanup 中中止请求或忽略旧响应 | 让旧请求覆盖新实体数据    |
| 保存不参与展示的可变句柄 | ref 保存，Effect 建立与销毁    | 为每次句柄变化触发 render |

函数式 setter 不会替你修复回调内其他旧 props。
ref 也不是逃避依赖的万能补丁：ref 修改不会触发渲染，不适合代替展示状态。
如果需要读取浏览器尺寸，应在客户端 Effect 中订阅并清理，不要在服务端也会执行的状态初始化里直接访问 `window`。

### 清理对称性与常见误区

定时器对应 clear，事件监听对应 remove，连接对应 disconnect，实例对应 destroy。
改变依赖或卸载后，旧资源应停止影响新界面。
请求取消只能取消或忽略客户端工作，不能保证撤销服务器已处理的写操作。

- **空依赖等于绝不再执行。** 重新挂载、key 变化以及开发检查都会挑战这个假设。
- **Effect 越少执行越好。** 正确同步优先，不要通过删依赖隐藏过期数据。
- **可以把 Effect 回调直接声明为 async。** React 期待的是清理函数而非 Promise；应在内部调用异步函数并处理竞态。
- **派生状态都要用 Effect 保存。** 能在 render 中由现有 props/state 算出的值，通常无需再同步一份 state。

## 六、总结

Hook 链表解决跨渲染保存数据，调用顺序保证寻址，更新队列计算下一快照，闭包解释旧值的来源。
Effect 的关键是建立与清理一段外部同步关系，而不是背诵挂载、更新、卸载三个生命周期名称。
继续阅读 [性能优化](/knowledge/04-React体系/07-性能优化) 理解依赖稳定性与记忆化成本；API 入门回到 [React Hooks 博客](/blog/post/react/react-hooks)。

### 官方来源

于 2026-10-02 联网核对；本文示例仅使用本项目 React 19.2 已有 API。

- [React：Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React：use](https://react.dev/reference/react/use)
- [React：useEffect](https://react.dev/reference/react/useEffect)
- [React：State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [React：Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
