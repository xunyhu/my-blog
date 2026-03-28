# TreeShaking

## 一、是什么

Tree Shaking 是移除未使用代码（Dead Code）的优化技术。

## 二、核心条件

1. 使用 ES Module
2. 静态分析

## 三、示例

```js
// utils.js
export const a = 1;
export const b = 2;

// index.js
import { a } from './utils';
```

👉 b 会被删除

## 四、原理

- 构建依赖图
- 标记使用代码
- 删除未引用代码

## 五、注意事项

避免副作用：

```js
import './style.css';
```

## 六、总结

Tree Shaking本质：

基于静态分析的 Dead Code Elimination
