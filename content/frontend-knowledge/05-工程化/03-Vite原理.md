# Vite原理

## 一、是什么

Vite 是基于原生 ES Module 的前端构建工具。

## 二、核心思想

👉 开发环境不打包！

## 三、开发环境原理

1. 浏览器直接请求模块

   ```js
   import { foo } from '/src/foo.js';
   ```

2. Dev Server 按需编译
   - 使用 ESBuild
   - 按需转换文件

3. 依赖预构建

```bash
node_modules → esbuild → ESM
```

## 四、生产环境

使用：

Rollup 打包

## 五、核心优势

- 启动快
- 热更新快（HMR）
- 按需加载

## 六、总结

Vite本质：

开发用 ESM + 生产用 Rollup
