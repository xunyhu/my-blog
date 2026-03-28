# Babel原理

## 一、是什么

Babel 是 JavaScript 编译器，用于将新语法转换为兼容旧浏览器的代码。

## 二、核心流程

`代码 → AST → 转换 → 生成代码`

## 三、核心模块

1. parser

```js
@babel/parser
```

👉 代码 → AST

2. traverse

```js
@babel/traverse
```

👉 遍历 AST

3. generator

```js
@babel/generator
```

👉 AST → 代码

4. types

```js
@babel/types
```

👉 操作 AST 节点

## 四、插件机制

```js
export default function () {
  return {
    visitor: {
      ArrowFunctionExpression(path) {},
    },
  };
}
```

## 五、示例

```js
// 输入
const fn = () => {};

// 输出
var fn = function () {};
```

## 六、总结

Babel本质：

基于 AST 的代码转换器
