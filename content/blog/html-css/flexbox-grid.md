---
title: "Flexbox 与 Grid 布局"
date: "2026-03-17"
tags: ["CSS", "布局"]
category: "html-css"
description: "前端布局方式 Flexbox 与 Grid 系统化总结"
---

# Flexbox 与 Grid 布局

## 背景
Flexbox 和 Grid 是现代 CSS 布局核心方案，解决响应式和复杂布局问题。

## Flexbox 基础
- `display: flex;`
- `justify-content`, `align-items`
- 弹性盒子方向、换行

## Grid 基础
- `display: grid;`
- `grid-template-columns`, `grid-template-rows`
- `gap`, `auto-fit`, `auto-fill`

## 代码示例
```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

## 总结

Flexbox 用于一维布局

Grid 用于二维布局

可结合使用，增强页面弹性