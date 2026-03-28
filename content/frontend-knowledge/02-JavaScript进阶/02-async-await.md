# async / await

## 一、是什么

async / await 是基于 Promise 的语法糖，用于简化异步代码。

## 二、为什么

让异步代码看起来像同步代码：

```js
// Promise
fetch()
  .then((res) => res.json())
  .then((data) => console.log(data));

// async/await
const data = await fetch();
```

## 三、核心原理

1. async 返回 Promise

   ```js
   async function fn() {
     return 1;
   }
   ```

   等价于：

   ```js
   function fn() {
     return Promise.resolve(1);
   }
   ```

2. await 本质

   await 会：
   - 暂停函数执行
   - 等 Promise resolve
   - 再继续执行

3. 语法糖本质

   async/await 本质是：` 👉 Promise + Generator 的封装`

## 四、使用示例

```js
async function getData() {
  try {
    const res = await fetch('/api');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

## 五、总结

- async/await 是 Promise 的语法糖
- 本质仍是异步
- 推荐统一使用 try/catch
