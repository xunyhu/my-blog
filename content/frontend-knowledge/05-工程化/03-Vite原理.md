---
title: 'Vite原理'
description: 'Vite 是基于原生 ES Module 的前端构建工具。'
updatedAt: '2026-10-02'
module: '工程化'
order: 3
status: 'outline'
---

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

打包器随版本演进：

- **Vite ≤ 7**：生产构建使用 **Rollup**
- **Vite 8（2026）**：默认切换到 **Rolldown**（Rust 编写），统一 dev / build 工具链，构建提速可达数倍~数十倍

👉 Rolldown 的目标是取代 Rollup + esbuild，成为 Vite 唯一的底层打包器

## 五、核心优势

- 启动快
- 热更新快（HMR）
- 按需加载

## 六、总结

Vite 本质：

开发用原生 ESM（免打包）+ 生产用打包器（Rollup → Rolldown 演进）
