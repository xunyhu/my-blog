# React基础

## 一、是什么

React 是由 Meta（原名Facebook） 开发的一个用于构建用户界面的 JavaScript 库，核心特点是以组件化和声明式的方式构建UI。

## 二、为什么

传统 DOM 操作：

- 手动更新 → 易出错
- 性能差（频繁操作 DOM）

React：

- 自动更新 UI
- 提升开发效率
- 可维护性强

### React 主要解决的问题

1. DOM 操作复杂、性能差的问题

   ```jsx
   // 传统方式：手动操作 DOM（繁琐）
   document.getElementById('count').innerText = newCount;
   document.getElementById('status').className = 'updated';
   setTimeout(() => {
     document.getElementById('status').className = '';
   }, 1000);

   // React 方式：声明式，只需关心数据
   function Counter() {
     const [count, setCount] = useState(0);
     return (
       <div>
         <span>{count}</span>
         <button onClick={() => setCount(count + 1)}>+1</button>
       </div>
     );
   }
   ```

   通过 虚拟 DOM 和 Diff 算法，React 可以批量更新、最小化 DOM 操作，提升性能。

2. UI 状态难以管理和追踪的问题

   ```jsx
   // 声明式：UI 自动与 state 同步
   function Welcome({ name }) {
     const [isLoggedIn, setIsLoggedIn] = useState(false);

     // React 会在 isLoggedIn 变化时自动重新渲染
     return (
       <div>
         {isLoggedIn ? <h1>欢迎回来，{name}!</h1> : <h1>请登录</h1>}
         <button onClick={() => setIsLoggedIn(!isLoggedIn)}>
           切换登录状态
         </button>
       </div>
     );
   }
   ```

   声明式编程：你只需要描述 UI 在某个状态下的样子，React 负责渲染

3. 代码复用困难的问题

   ```jsx
   // 自定义 Hook：逻辑复用
   function useMousePosition() {
     const [position, setPosition] = useState({ x: 0, y: 0 });

     useEffect(() => {
       const update = (e) => setPosition({ x: e.clientX, y: e.clientY });
       window.addEventListener('mousemove', update);
       return () => window.removeEventListener('mousemove', update);
     }, []);

     return position;
   }

   // 多个组件都可以复用这个逻辑
   function ComponentA() {
     const pos = useMousePosition();
     return (
       <div>
         鼠标位置：{pos.x}, {pos.y}
       </div>
     );
   }
   ```

   高阶组件（HOC）、Render Props、Hooks 等多种复用逻辑的方式

4. 大型应用难以维护和扩展的问题

   传统痛点：
   - 代码耦合度高，修改一处可能影响多处

   - 缺乏统一的状态管理方案

   - 测试困难

   React 的解决方案：
   - 单向数据流 + 不可变数据理念（配合 Immutable.js 或 Immer）
   - 丰富的生态：Redux、Zustand、MobX 等状态管理方案
   - 声明式使得 UI 更容易预测和测试
   - 组件树结构天然适合大型应用分层架构

### 示例对比

传统 jQuery 方式（命令式）：

```jsx
let count = 0;
$('#increment').click(() => {
  count++;
  $('#count').text(count);
  if (count % 2 === 0) $('#even').show();
  else $('#even').hide();
});
```

React 方式（声明式）：

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <span>{count}</span>
      {count % 2 === 0 && <span id="even">这是偶数</span>}
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

## 三、核心原理

### 1. JSX

#### 一、JSX 的定义

JSX 是 JavaScript XML 的缩写，它是 React 提供的一种语法扩展，允许我们在 JavaScript 代码中直接编写类似 HTML 的声明式结构。

本质上，JSX 只是 `React.createElement(component, props, ...children)` 函数的语法糖。

```js
// JSX 写法
const element = <h1 className="greeting">Hello, world!</h1>;

// 编译后的纯 JS 代码
const element = React.createElement(
  'h1',
  {
    className: 'greeting',
  },
  'Hello, world!',
);
```

#### 二、JSX 的核心本质

JSX 不是模板引擎，而是 JavaScript 的语法扩展。这意味着：

1. JSX 最终会被编译成普通的 JavaScript 对象（React Elements）
2. 可以在 JSX 中嵌入任何 JavaScript 表达式（用 {} 包裹）
3. JSX 本身也是一个表达式，可以赋值给变量、作为函数参数、作为返回值

```js
// JSX 作为表达式使用
function getGreeting(user) {
  if (user) {
    return <h1>Hello, {user.name}!</h1>;
  }
  return <h1>Hello, Stranger!</h1>;
}

// JSX 赋值给变量
const element = <div>{getGreeting({ name: 'React' })}</div>;
```

#### 三、使用 JSX 的好处

1. 声明式、更直观的 UI 描述

```js
// 不使用 JSX（纯 createElement）
const Input = React.createElement(
  'div',
  { className: 'form-group' },
  React.createElement('label', { htmlFor: 'name' }, '用户名：'),
  React.createElement('input', {
    type: 'text',
    id: 'name',
    value: username,
    onChange: handleChange,
  }),
);

// 使用 JSX（更清晰）
const Input = (
  <div className="form-group">
    <label htmlFor="name">用户名：</label>
    <input type="text" id="name" value={username} onChange={handleChange} />
  </div>
);
```

2. 防止 XSS 注入攻击

   JSX 会自动转义所有嵌入的值，防止注入攻击

3. 充分利用 JavaScript 的完整能力

   JSX 允许在`{}`中嵌入任何 JavaScript 表达式

#### 四、JSX 的限制和注意事项

1. 必须引入 React（React 17+ 可以不用）
2. 特殊的属性命名
3. 必须返回单个根元素

### 2. 组件本质

```js
function App() {
  return <div>Hello</div>;
}
```

4. 更好的开发工具支持
5. 组件组合和复用更加优雅

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
