
---

### **html-css/responsive-design.md**

```markdown
---
title: "响应式设计"
date: "2026-03-17"
tags: ["CSS", "响应式"]
category: "html-css"
description: "媒体查询与移动端适配方法总结"
---

# 响应式设计

## 背景
响应式设计保证页面在各种屏幕设备上都有良好显示效果。

## 核心概念
- 媒体查询 `@media`
- 百分比宽度 / REM / VW
- 移动优先设计

## 代码示例
```css
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}