# React基础

## 一、是什么

React 是由 Meta（原名Facebook） 开发的一个用于构建用户界面的 JavaScript 库，核心思想是：

- 组件化
- 声明式 UI
- 单向数据流

## 二、为什么

传统 DOM 操作：

- 手动更新 → 易出错
- 性能差（频繁操作 DOM）

React：

- 自动更新 UI
- 提升开发效率
- 可维护性强

## 三、核心原理

### 1. JSX 本质

```js
const element = <h1>Hello</h1>;
```

会被编译为：

```js
React.createElement('h1', null, 'Hello');
```

### 2. 组件本质

```js
function App() {
  return <div>Hello</div>;
}
```

本质：

```text
App() → 返回 Virtual DOM
```

### 3. 单向数据流

```text
父组件 → props → 子组件
```

## 四、实践

- 函数组件 + Hooks（主流）
- 拆分组件粒度（可复用）
- props + state 分离职责
