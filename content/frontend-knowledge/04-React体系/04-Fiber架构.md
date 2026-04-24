# Fiber架构

## 一、是什么

Fiber 是 React 16 引入的 可中断渲染架构。

每个 React 组件（函数组件或类组件）在运行时都会对应一个 Fiber 节点。你可以把它想象成一个 “组件卡片”，上面记录了：

- 组件当前的状态（state）
- 组件的 props
- 组件对应的 DOM 节点
- 需要执行的工作（更新、删除等）
- **最重要的：一个专门存放 Hooks 信息的链表**

## 二、为什么

旧架构（Stack Reconciler）：

- 递归不可中断
- 卡顿严重

## 三、核心原理

### 1. Fiber 节点结构

```text
┌─────────────────────────────────────────────────────────┐
│                      Fiber 节点                          │
├─────────────────────────────────────────────────────────┤
│ tag: 组件类型（FunctionComponent / ClassComponent ...） │
│ key: 用于协调（列表 diff）                               │
│ type: 函数本身或类或原生标签名（'div'）                  │
│ stateNode: 对应的 DOM 节点 / 组件实例                    │
│                                                         │
│ === 状态相关 ===                                         │
│ memoizedState: 当前渲染用的状态（对于函数组件，这就是hooks链表的头指针） │
│ memoizedProps: 上次渲染用的 props                       │
│ pendingProps: 新的 props（正在处理）                     │
│ updateQueue: 状态更新队列（setState 产生的更新）         │
│                                                         │
│ === 树结构关系 ===                                       │
│ return: 父 Fiber 节点                                   │
│ child: 第一个子 Fiber 节点                              │
│ sibling: 下一个兄弟 Fiber 节点                          │
│                                                         │
│ === 副作用（Effect）相关 ===                             │
│ flags: 需要执行的操作（Placement / Update / Deletion）   │
│ subtreeFlags: 子树中需要处理的操作汇总                   │
│ nextEffect: 下一个有副作用的 Fiber（用于 effect 链表）   │
│                                                         │
│ === 双缓冲（alternate） ===                             │
│ alternate: 指向另一棵树的对应节点（work-in-progress）    │
└─────────────────────────────────────────────────────────┘
```

#### Fiber 节点之间的连接关系（Fiber 树）

```text
                       [ 根Fiber (HostRoot) ]
                         │ child
                         ▼
                    [ App 组件 ]   ←  return ────────┐
                     │ child                         │
                     ▼                               │
                [ 函数组件 Header ]                   │
                 │            │ sibling              │
                 ▼            ▼                      │
          [  div   ] → [ 函数组件 Main ] ────────────┘
            │                   │ child
          child                 ▼
            ▼              [  Button  ]
         [ span ]
```

#### Fiber 节点 + Hooks 链表

```text
┌───────────────────────────────────┐
│   Fiber 节点 (函数组件)            │
│ ┌───────────────────────────────┐ │
│ │ memoizedState ────────────────┼─┼──→ 指向第一个 Hook 节点
│ │ updateQueue                   │ │
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
                 │
                 ▼
     ┌──────────────────────┐
     │ Hook 节点 (useState)  │
     │ ├─ memoizedState: 0  │
     │ ├─ next ─────────────┼──→ ┌──────────────────────┐
     │ └─ queue              │    │ Hook 节点 (useEffect) │
     └──────────────────────┘    │ ├─ memoizedState: effect
                                 │ ├─ next ─────────────┼──→ null
                                 │ └─ ...                │
                                 └──────────────────────┘
```

#### Hooks 的状态链表

当一个函数组件里使用了 useState、useEffect 等 Hook 时，React 会把它们 按调用顺序 记录到当前 Fiber 节点的一个 链表 上。

一个组件和它的 Fiber 节点

```text
[ 函数组件 Counter ] 
       |
       ▼
┌─────────────────┐
│    Fiber 节点   │
├─────────────────┤
│ props: {...}    │
│ state: 内部存储 │
│ hooksList ──────┼──→ (第一个Hook) ──→ (第二个Hook) ──→ null
└─────────────────┘
```

每个 Hook 节点（比如 useState 产生的）大概包含：

- memoizedState：当前这个 Hook 保存的状态值（比如 count 的值）
- next：指向下一个 Hook 节点的指针
- 其他辅助信息（比如更新队列、effect 回调等）

```text
hooksList ──→ ┌──────────────┐   next   ┌──────────────┐   next   ┌──────────────┐
              │ Hook 节点     │────────▶│ Hook 节点     │────────▶│ Hook 节点     │──▶ null
              │ (useState)    │         │ (useEffect)   │         │ (useState)    │
              │ memoizedState │         │ memoizedState │         │ memoizedState │
              │   = 0         │         │   = effect    │         │   = true      │
              └──────────────┘         └──────────────┘         └──────────────┘
```

#### 初次渲染

第一次渲染组件时，React 会 **按代码书写顺序** 依次创建每个 Hook 的节点，并挂在链表中。

```ts
function MyComponent() {
  const [count, setCount] = useState(0);      // Hook 1
  useEffect(() => { ... }, []);               // Hook 2
  const [visible, setVisible] = useState(true); // Hook 3
  // ...
}
```

React 执行到 useState(0) 时，发现这是 第一个 Hook，于是创建一个 Hook 节点（状态 0），挂在 Fiber 的 hooksList 上。
接着执行 useEffect，创建第二个 Hook 节点，接到链表末尾。
然后执行第二个 useState，创建第三个 Hook 节点，再接上去。

最终链表：`Hook1(useState) → Hook2(useEffect) → Hook3(useState) → null`

#### 更新渲染：复用状态

当组件重新渲染（例如 setCount 被调用），React 会再次运行这个函数组件，再次按顺序调用这些 Hook。

此时，React 会：

- 从 Fiber 节点的 hooksList 头部开始，取出第一个 Hook 节点。
- 当你执行第一个 useState(0) 时，React 发现已经有 Hook 节点了，就 复用 它的 memoizedState，忽略你传的初始值（0）。
所以状态会保留为之前的 count 值。
- 接着执行 useEffect，React 取出第二个 Hook 节点，复用它的 effect 定义。
- 执行第三个 useState，复用第三个 Hook 节点的状态。
关键：React 不关心 Hook 的名字，只关心 你是第几个被调用的。所以调用顺序必须和上一次完全一致。

✅ 正确情况：每次调用顺序相同

```text
第一次渲染                      第二次渲染
调用顺序：                     调用顺序：
1. useState (count)           1. useState (count)  → 复用第1个Hook的状态
2. useEffect                  2. useEffect         → 复用第2个Hook的effect
3. useState (visible)         3. useState (visible) → 复用第3个Hook的状态

链表：Hook1 → Hook2 → Hook3    链表：Hook1 → Hook2 → Hook3（不变）
```

❌ 错误情况：顺序改变了（比如放到 if 里）

```jsx
function MyComponent({ flag }) {
  const [count, setCount] = useState(0);
  if (flag) {
    const [visible, setVisible] = useState(true); // 条件性调用
  }
  useEffect(() => { ... }, []);
}
```

### 2. 双阶段

React 渲染的两个阶段

1. Render 阶段（协调阶段，可中断）

   - 做什么：构建 Fiber 树，计算哪些 DOM 需要更新（diff），标记副作用（flags）。
   - 特点：可中断（浏览器空闲时执行，高优先级任务可打断低优先级）。
   - 结果：得到一棵 workInProgress 树，其中每个 Fiber 节点标记了需要执行的操作（Placement、Update、Deletion 等）。
   - 相关函数：beginWork、completeWork。

2. Commit 阶段（提交阶段，不可中断）

   - 做什么：根据 Render 阶段标记的副作用，同步地将变更应用到真实 DOM。
   - 特点：不可中断，必须一次性完成，保证 UI 一致性。
   - 相关函数：commitRoot、commitMutationEffects、commitLayoutEffects。
  
Render 阶段找变化（可打断），Commit 阶段把变化真正画到屏幕上（必须一气呵成）。

#### 双缓冲机制：alternate

React 在内存中维护两棵 Fiber 树：

1. current 树：当前屏幕上显示的内容对应的 Fiber 树

2. workInProgress 树：正在构建的下一棵树

每个 Fiber 节点都有一个 `alternate` 指针，指向另一棵树中对应的节点。

```text
current 树                       workInProgress 树
┌─────────┐                     ┌─────────┐
│ Fiber A │◄──── alternate ────►│ Fiber A'│
└─────────┘                     └─────────┘
    │                                 │
  child                              child
    ▼                                 ▼
┌─────────┐                     ┌─────────┐
│ Fiber B │◄──── alternate ────►│ Fiber B'│
└─────────┘                     └─────────┘
```

- 更新时，React 克隆 current 节点得到 workInProgress 节点（复用 alternate）
- 工作结束后，workInProgress 树变成新的 current 树

#### 副作用链表（effect list）

为了高效执行副作用（DOM 更新、调用生命周期等），React 将需要处理的 Fiber 节点串成一个单向链表（通过 nextEffect）：

```text
根节点 ──nextEffect──► Fiber A ──nextEffect──► Fiber C ──nextEffect──► null
      (需要更新)         (需要删除)              (需要插入)
```

### 概念总结

```text
                    ┌─────────────────────────────────────┐
                    │             Fiber 树 (current)       │
                    │  ┌────┐   child   ┌────┐            │
                    │  │ A  │──────────►│ B  │            │
                    │  └────┘           └────┘            │
                    │    ▲                 │ sibling      │
                    │    │ return          ▼              │
                    │  ┌────┐           ┌────┐            │
                    │  │ C  │◄──────────│ D  │            │
                    │  └────┘           └────┘            │
                    └─────────────────────────────────────┘
                                       │
                        alternate       │ (双缓冲)
                                       ▼
                    ┌─────────────────────────────────────┐
                    │       workInProgress 树 (克隆)       │
                    │  同样的结构，但正在增量更新           │
                    └─────────────────────────────────────┘

每个 Fiber 节点内部：
┌──────────────┐
│  tag / key   │
│  stateNode   │
│  memoizedState ──→ hooks链表  (函数组件)
│  updateQueue     → 更新队列
│  child/sibling/return → 连接树
│  flags / nextEffect → 副作用链表
│  alternate         → 双缓冲
└──────────────┘
```

## 四、实践

避免大组件阻塞，合理拆分 UI
