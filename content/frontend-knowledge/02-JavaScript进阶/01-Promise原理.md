# Promise原理

## 一、是什么

Promise 是 JavaScript 中用于处理异步操作的对象。

它有三种状态：

- pending（进行中）
- fulfilled（已成功）
- rejected（已失败）

一旦状态改变，就不可再变。

## 二、为什么

解决传统回调函数的问题：

- 回调地狱（callback hell）
- 错误处理混乱
- 代码可读性差

Promise 提供：

- 链式调用（then）
- 统一错误处理（catch）

## 三、核心原理

### 1. 状态机

Promise 内部维护一个状态：

pending → fulfilled / rejected

不可逆

### 2. then 注册回调

```js
promise.then(onFulfilled, onRejected);
```

本质：

- 把回调函数存起来
- 状态改变时执行

### 3. 微任务机制

Promise 的回调属于： 👉 microtask（微任务）

执行顺序：`同步代码 → 微任务 → 宏任务`

### 4. 简易实现

```js
class MyPromise {
  constructor(fn) {
    this.state = 'pending';
    this.value = null;
    this.callbacks = [];

    const resolve = (value) => {
      this.state = 'fulfilled';
      this.value = value;
      this.callbacks.forEach((cb) => cb(value));
    };

    fn(resolve);
  }

  then(cb) {
    if (this.state === 'fulfilled') {
      cb(this.value);
    } else {
      this.callbacks.push(cb);
    }
  }
}
```

## 四、使用示例

```js
new Promise((resolve) => {
  setTimeout(() => resolve(1), 1000);
}).then((res) => {
  console.log(res);
});
```

## 五、总结

- Promise 是异步编程的核心
- 本质：状态机 + 回调队列 + 微任务
- 解决回调地狱问题
