# 服务端组件RSC

## 一、是什么

React Server Components 是在服务端运行的组件。

## 二、为什么

解决：

- bundle 过大
- 首屏慢

## 三、核心原理

### 1. 服务端渲染组件

```js
// Server Component
export default async function Page() {
  const data = await fetch(...)
}
```

### 2. 零 JS 发送

👉 不会打包到客户端

### 3. 与客户端组件协作

`'use client'`

## 四、实践

- 数据请求放服务端
- UI 交互放客户端
