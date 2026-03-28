# Webpack原理

## 一、是什么

Webpack 是一个模块打包工具（Bundler），将多个模块打包成浏览器可运行的资源。

## 二、核心流程

1. 初始化

   读取配置：webpack.config.js

2. 构建依赖图

   从入口开始：index.js → import → 解析 → AST → 收集依赖

3. Loader 处理

```js
module: {
  rules: [
    {
      test: /\.js$/,
      use: 'babel-loader',
    },
  ];
}
```

👉 本质：文件转换器

4. Plugin 扩展

```js
plugins: [new HtmlWebpackPlugin()];
```

👉 本质：生命周期钩子扩展

5. 打包输出

   生成：
   - bundle.js
   - chunk 文件

## 三、核心原理

### 1. AST 解析

```js
import { parse } from '@babel/parser';
```

步骤：

1. 代码 → AST
2. 遍历 AST
3. 找到 import/export

### 2. 依赖收集

```js
{
  './index.js': ['./a.js', './b.js']
}
```

### 3. 模块封装

```js
(function (modules) {
  function require(id) {}
})();
```

### 4. Loader机制

执行顺序：

从右到左（或从下到上）

### 5. Plugin机制（Tapable）

Webpack 使用 Tapable 实现：

```js
compiler.hooks.emit.tap();
```

## 四、优缺点

优点

- 生态丰富
- 功能强大

缺点

- 构建慢
- 配置复杂

## 五、总结

Webpack本质：

基于依赖图的模块打包器 + 插件化架构
