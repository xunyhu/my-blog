
---

### **vue/vue-reactive.md**

```markdown
---
title: "Vue 响应式原理"
date: "2026-03-17"
tags: ["Vue", "响应式"]
category: "vue"
description: "Vue 3 响应式数据和计算属性机制"
---

# Vue 响应式原理

## 背景
Vue 响应式系统让数据变化自动更新视图。

## 核心概念
- reactive / ref
- computed / watch
- 响应式依赖收集

## 代码示例
```javascript
import { reactive, computed } from 'vue';
const state = reactive({ count: 0 });
const double = computed(() => state.count * 2);