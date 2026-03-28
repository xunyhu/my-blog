# 虚拟DOM

## 一、是什么

Virtual DOM 是 JS 对象形式的 DOM 描述：

```js
{
  type: 'div',
  props: { children: [...] }
}
```

## 二、为什么

真实 DOM：

- 操作昂贵
- 重排重绘成本高

Virtual DOM：

- 减少 DOM 操作次数
- 批量更新

## 三、核心原理

### 1. 双树对比

```text
旧 Virtual DOM
新 Virtual DOM
↓
Diff
↓
最小更新
```

### 2. Patch 过程

- 创建
- 更新
- 删除

## 四、实践

- key 必须稳定
- 避免无意义 re-render
