---
title: 'Diff算法'
description: '理解 React 协调的 O(n) 启发式、key 与状态身份，用可执行的列表计划器观察复用、插入、移动与删除，并区分教学算法和源码。'
updatedAt: '2026-10-02'
module: 'React体系'
order: 3
status: 'done'
---

# Diff算法

## 一、是什么

React 的 Diff 通常指 reconciliation（协调）中的匹配过程：根据下一次 element 描述，决定已有组件身份能否继续使用，以及需要哪些宿主变更。
它不只是比较两段 HTML，也不只是找两个 JS 对象的不同字段。

一次列表更新可能同时涉及：

- 复用已有组件及其 Hook 状态。
- 为原组件提供新 props，并继续协调其输出。
- 插入新组件、移动已有宿主节点。
- 卸载不再存在的组件并清理 Effect。

所以 key 首先是**状态身份协议**，其次才是帮助协调的性能信息。
“看起来文本正确”并不能证明 Diff 身份正确，表单中的草稿可能已经跟错了人。

## 二、为什么

### 用约束换取可预测成本

React 旧版官方协调文档用 O(n³) 描述其对照的一类通用树编辑算法，再给出 O(n) 启发式。
这不是说所有树比较问题都必然需要 O(n³)，也不是 React 每次更新的总耗时都严格线性。

启发式依赖两条关键假设：

1. 不同类型的元素通常代表不同的树，不尝试寻找跨类型的最佳复用方案。
2. 开发者提供稳定 key，提示同一父级下哪些子元素跨渲染仍是同一个身份。

若一个父级的新旧子列表长度为 n、m，在 Map 查找按常数成本估算时，扫描和索引可做到 O(n + m)。
组件中的排序、业务计算、DOM 操作与浏览器 layout 不包含在这个复杂度口号内。
嵌套树要在各层继续协调；O(n) 也不代表每个节点的处理成本相同。

### 不追求全局最少移动

比较速度、内存开销、常见更新路径和宿主操作数量之间存在取舍。
React 不会为了把一次罕见的重排减少到绝对最少操作，就求解任意树的全局最优编辑序列。
因此要分别讨论“身份是否正确”“标记了多少次放置”“页面实际耗时”，不能混成一个指标。

## 三、核心原理

### 身份由父级上下文、key 和类型共同决定

```text
同一父 Fiber 的 children
旧： [Row key=A state=草稿A] [Row key=B state=草稿B]
新： [Row key=B           ] [Row key=A           ]
             |                       |
             v                       v
        复用 B 的状态            复用 A 的状态

换成 index key
旧： [key=0 业务A 草稿A] [key=1 业务B 草稿B]
新： [key=0 业务B 草稿A] [key=1 业务A 草稿B]
             ^                       ^
        文案变了，但状态跟着位置而不是业务实体
```

- key 只需要在当前兄弟集合里唯一，不是全局 ID 注册表。
- 相同 key 但类型不同，不能据此保留旧组件状态。
- 同一个 key 移到另一个父组件下，通常仍会卸载并重新挂载。
- key 是 React 的特殊信息，不作为普通 props 传给组件；业务 ID 要另外传入。
- `useId` 面向可访问性等 ID 关联，不应该用来生成列表 key。

### React 数组协调不是双端 Diff

以官方 React v19.2.0 的 `ReactChildFiber.js` 为边界，普通数组协调的主路径是：

```text
从头顺序匹配旧 Fiber 与新 children
           |
           +--> 新列表结束：删除剩余旧项
           +--> 旧列表结束：插入剩余新项
           |
           v
遇到不能继续匹配的位置
           |
           v
剩余旧项建 Map --> 扫描剩余新项，按 key 查找并检查类型
           |
           v
标记插入 / 移动 --> 删除 Map 中未复用的旧项
```

“双端 Diff”会同时尝试旧头/新头、旧尾/新尾以及头尾交叉匹配，旋转列表时可能更快确定可复用部分。
但不能把这种思路直接写成“React 18/19 使用双端 Diff”。
上述版本的源码注释明确说明 Fiber 缺少反向指针，当前主路径采取向前扫描。
这里介绍双端方案是为了对照，不将其他协调器的实现移植为 React 的事实。

### 移动标记与旧下标

对于复用项，React 的放置逻辑维护 `lastPlacedIndex`，表示目前可以维持相对顺序的旧下标边界。
新列表从左向右走：如果某项旧下标小于这个边界，就标记该项需要放置到新位置；否则提高边界。

```text
旧序列：A(0) B(1) C(2) D(3)
新序列：D    A    B    C

D：旧下标 3 >= 0，保持，边界变成 3
A：旧下标 0 <  3，移动标记
B：旧下标 1 <  3，移动标记
C：旧下标 2 <  3，移动标记
```

这个例子标记 A、B、C 三项，而另一种编辑方案只移动 D 到开头也可完成重排。
它说明启发式不保证最少移动，不表示有三次卸载或三次浏览器 paint。
一个 Fiber 可能包含多个宿主节点，放置标记数量也不能无条件等同于 DOM API 调用数量。

## 四、代码实现

### 可运行的列表计划器

以下完整 JavaScript 可在 Node.js 执行，输入只支持同一父级下、唯一字符串 key 的扁平节点。
**这是教学算法，非 React 源码完整实现**：为便于观察，它总是建立 Map，省略顺序快路径。
它不执行 DOM patch，不处理 Fragment、Portal、Suspense、空槽、调度或 hydration。

```js
function assertUnique(nodes) {
  const seen = new Set();
  for (const node of nodes) {
    if (typeof node.key !== 'string' || seen.has(node.key)) {
      throw new Error('key 必须是唯一字符串');
    }
    seen.add(node.key);
  }
}

function planList(oldNodes, newNodes) {
  assertUnique(oldNodes);
  assertUnique(newNodes);
  const remaining = new Map(
    oldNodes.map((node, index) => [node.key, { node, index }]),
  );
  const operations = [];
  let lastPlacedIndex = 0;

  for (const [to, next] of newNodes.entries()) {
    const previous = remaining.get(next.key);
    if (!previous || previous.node.type !== next.type) {
      operations.push({ kind: 'insert', key: next.key, to });
      // 同 key 不同类型的旧节点留在 Map，最后删除。
      continue;
    }
    remaining.delete(next.key);
    const from = previous.index;
    if (from < lastPlacedIndex) {
      operations.push({ kind: 'move', key: next.key, from, to });
    } else {
      lastPlacedIndex = from;
      operations.push({ kind: 'reuse', key: next.key, from, to });
    }
  }

  for (const [key, previous] of remaining) {
    operations.push({ kind: 'delete', key, from: previous.index });
  }
  return operations;
}

const rows = (keys) => [...keys].map((key) => ({ key, type: 'Row' }));
const countKind = (ops, kind) => ops.filter((op) => op.kind === kind).length;
const check = (condition) => {
  if (!condition) throw new Error('断言失败');
};

const rotate = planList(rows('ABCD'), rows('DABC'));
check(countKind(rotate, 'move') === 3);
check(countKind(rotate, 'insert') === 0);
check(countKind(rotate, 'delete') === 0);
check(countKind(planList(rows('AB'), rows('XAB')), 'insert') === 1);
check(countKind(planList(rows('AB'), rows('B')), 'delete') === 1);
check(countKind(planList(rows('AB'), rows('AB')), 'move') === 0);
const replaced = planList(rows('A'), [{ key: 'A', type: 'Editor' }]);
check(countKind(replaced, 'insert') === 1);
check(countKind(replaced, 'delete') === 1);
console.table(rotate);
```

`reuse` 只表示此教学模型未标记移动，并不表示 React 会跳过组件执行或 props 更新。
这些是确定性的计划数量，不是机器测出的毫秒数。
该模型构建 Map 占 O(n) 额外空间，扫描新列表与剩余旧项共 O(n + m)。

### 用输入草稿观察状态身份

以下完整 JSX 可作为已有 React 项目的 `App.jsx` 或 Next.js 客户端页面。
刻意保留 index 模式用于对照；实际列表应使用业务 ID。

```jsx
'use client';

import { useState } from 'react';

const initial = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
];

function Row({ person }) {
  const [draft, setDraft] = useState(person.name);
  return (
    <li>
      <label>
        {person.name} 的草稿
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      </label>
    </li>
  );
}

export default function App() {
  const [people, setPeople] = useState(initial);
  const [indexKey, setIndexKey] = useState(false);
  return (
    <section>
      <label>
        <input
          type="checkbox"
          checked={indexKey}
          onChange={(e) => setIndexKey(e.target.checked)}
        />
        使用 index key
      </label>
      <button onClick={() => setPeople((list) => [...list].reverse())}>
        反转列表
      </button>
      <ul key={String(indexKey)}>
        {people.map((person, index) => (
          <Row key={indexKey ? index : person.id} person={person} />
        ))}
      </ul>
    </section>
  );
}
```

先在 ID 模式编辑 Alice 的草稿，再反转：草稿跟着 Alice。
切换到 index 模式后重新编辑，再反转：草稿留在原位置，标签却换成另一个人。
`ul` 的 key 在切换模式时故意改变，用于清空实验状态，避免两组初始条件相互污染。

## 五、工程实践

### key 的选择与审查

优先用后端主键或创建数据时生成并持久保存的客户端 ID。
不要在 render 中用随机数、当前时间或不断变化的文案构造 key。
纯静态、不会增删重排且没有关联状态的列表可以用 index；重要的是先明确约束，而非背诵禁令。

需要主动重置编辑器时，可以使用业务实体 ID 作为 key。
例如切换订单时重建草稿是合理需求，但在每次输入时改变 key 会不断丢失焦点与状态。
组件定义也应放在模块顶层，不要在父组件内部每次创建新的组件函数类型。

### 常见误区与测试策略

- **稳定 key 会阻止重渲染。** key 保留身份，跳过重渲染是 memo 等机制的另一个问题。
- **key 相同就一定保留状态。** 还要考虑类型、父级与树中的位置。
- **移动就是重新挂载。** 复用的组件可以保留状态和 DOM；不要用 mount 次数替代移动数量。
- **列表文字显示正确就算通过。** 回归测试应编辑草稿、头部插入、删除中间项、反转及切换实体，检查状态归属。

真实性能应使用 [性能优化](/knowledge/04-React体系/07-性能优化) 中的测量方式复核。
不要把本篇计划器输出的三个移动标记包装成“React 实测快三倍”。

## 六、总结

Diff 的核心是受约束的身份匹配：同一父级、稳定 key、兼容类型，使 React 能保留正确的状态。
O(n) 是协调启发式的成本模型，不是整个更新过程的性能承诺。
理解 [虚拟 DOM](/knowledge/04-React体系/02-虚拟DOM) 的描述层，再结合 [Fiber 架构](/knowledge/04-React体系/04-Fiber架构) 的工作单元，才能把“匹配什么”和“如何调度”分开。

### 官方来源

于 2026-10-02 联网核对；源码机制以固定版本为准，不把实现细节当公共 API 保证。

- [React：Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React：Rendering Lists](https://react.dev/learn/rendering-lists)
- [React：Reconciliation（历史文档，复杂度与启发式背景）](https://legacy.reactjs.org/docs/reconciliation.html)
- [React v19.2.0：ReactChildFiber.js](https://github.com/facebook/react/blob/v19.2.0/packages/react-reconciler/src/ReactChildFiber.js)
