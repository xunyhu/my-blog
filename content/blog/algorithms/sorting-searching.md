
---

### **algorithms/sorting-searching.md**

```markdown
---
title: "排序与查找算法"
date: "2026-03-17"
tags: ["算法", "排序", "查找"]
category: "algorithms"
description: "前端常用算法总结与示例"
---

# 排序与查找算法

## 背景
掌握基础算法有助于提升前端逻辑能力和面试表现。

## 核心概念
- 冒泡 / 插入 / 快速排序
- 二分查找 / 哈希查找

## 代码示例
```javascript
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while(left <= right) {
    const mid = Math.floor((left + right)/2);
    if(arr[mid] === target) return mid;
    else if(arr[mid] < target) left = mid + 1;
    else right = mid -1;
  }
  return -1;
}