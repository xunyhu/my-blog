# Diff算法

## 一、是什么

React Diff 是一种 O(n) 的启发式算法。

## 二、为什么

传统树 diff：

```text
O(n³)
```

React 优化为：

```text
O(n)
```

## 三、核心原理

### 1. 同层比较

只比较同级节点，不跨层

### 2. key 作用

```js
list.map((item) => <li key={item.id} />);
```

用于标识节点身份

### 3. 三种情况

- 新增
- 删除
- 移动

## 四、实践

❌ 错误： key={index}

✅ 正确： key={id}
