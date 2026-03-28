# Hooks原理

## 一、是什么

Hooks 是 React 让函数组件拥有状态和副作用的机制。

## 二、为什么

解决：

- 类组件复杂
- 逻辑复用困难

## 三、核心原理

### 1. 链表结构

Hooks 按调用顺序存储： fiber.memoizedState → linked list

### 2. useState 原理

```js
const [state, setState] = useState(0);
```

内部：

- 初始化 state
- 维护 update queue

### 3. 为什么不能条件调用

```js
if (flag) useState() ❌
```

因为：
👉 Hooks 依赖调用顺序

## 四、实践

- 自定义 Hooks 抽逻辑
- 避免闭包陷阱
