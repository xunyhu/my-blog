# Proxy 与 Reflect

## 一、是什么

Proxy 用于拦截对象操作。

Reflect 提供对应的默认行为。

## 二、为什么

- 数据监听（Vue3 响应式）
- 权限控制
- 日志记录

## 三、核心原理

```js
const obj = new Proxy(target, {
  get(target, key) {
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    return Reflect.set(target, key, value);
  },
});
```

## 四、总结

- Proxy：拦截
- Reflect：执行默认行为
