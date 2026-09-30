---
title: 'React 条件渲染异常'
date: '2026-09-04'
tags:
  - { name: 'React', slug: 'react' }
category: 'projects'
description: '一个看似无害的 &&，却可能在页面上悄悄渲染出一个你意想不到的 "0"'
---

# React 条件渲染异常

支付金额为 0 时页面出现多余的「0」

## 一、问题背景

> 背景：需要展示xx积分 + xx金额；如果没有支付金额则不展示金额。

```text
99积分 + ¥99.00

99积分
```

> 问题：当某条数据的支付金额为 `0` 时，页面会额外显示一个单独的 `0`。

```text
99积分 0
```

经过排查发现，这个问题并不是接口数据异常，也不是组件本身的问题，而是 **JavaScript `&&` 短路求值 + React JSX 渲染机制**共同导致的。

---

## 二、问题现象

相关代码如下：

```tsx
{
  payAmount && <Text> + ¥{payAmount}</Text>;
}
```

接口返回的数据：

```json
{
  "payAmount": 0
}
```

按照最初的预期：

```text
payAmount = 0
↓
条件不成立
↓
不渲染 Text
```

但实际页面却出现：

```text
0
```

也就是说：

```tsx
{
  payAmount && <Text> + ¥{payAmount}</Text>;
}
```

在 `payAmount = 0` 的情况下，并没有完全“不渲染”。

---

## 三、问题定位

最开始看到这个问题时，很容易认为是 React 的条件渲染出了问题。

于是先单独验证：

```tsx
{
  payAmount && <Text> + ¥{payAmount}</Text>;
}
```

当：

```ts
payAmount = 0;
```

打印：

```ts
console.log(payAmount);
```

结果确认确实是：

```text
0
```

接口数据本身没有问题。

接下来把代码简化：

```tsx
{
  0 && <Text> + ¥0</Text>;
}
```

页面依然出现：

```text
0
```

到这里基本可以确定：

> 问题与具体业务组件无关，而是 JSX 表达式本身导致的。

---

## 四、根因分析

### 4.1 JavaScript 的 `&&` 并不会返回 Boolean

这是整个问题最关键的地方。很多时候我们会把：

```js
A && B;
```

理解成：

> A 为 true 才执行 B，否则什么都不做。

但 JavaScript 中，`&&` 实际遵循的是**短路求值**规则：

> 如果左侧表达式为 falsy，直接返回左侧表达式的值；如果为 truthy，则返回右侧表达式的值。

例如：

```js
true && 'hello';
// 'hello'

false && 'hello';
// false

null && 'hello';
// null

undefined && 'hello';
// undefined

0 && 'hello';
// 0

'' && 'hello';
// ''
```

所以：

```tsx
payAmount && <Text> + ¥{payAmount}</Text>;
```

当：

```ts
payAmount === 0;
```

实际上相当于：

```tsx
0 && <Text> + ¥0</Text>;
```

最终 JavaScript 返回的不是：

```js
false;
```

而是：

```js
0;
```

---

## 五、为什么 React 最终把 `0` 渲染出来？

这一步是第二个关键点。

React 在 JSX 中会对不同类型的值采用不同的处理方式。

例如：

```tsx
{
  null;
}
{
  undefined;
}
{
  false;
}
```

这些值不会产生实际 DOM 内容。

但是：

```tsx
{
  0;
}
```

React 会把它作为文本内容进行渲染：

```text
0
```

所以整个过程实际上是：

```text
  payAmount
      ↓
      0
      ↓
0 && <Text> + ¥0</Text>
      ↓
JavaScript 短路求值
      ↓
      0
      ↓
React 接收到 0
      ↓
渲染文本 "0"
```

这就是页面出现多余 `0` 的真正原因。

---

## 六、为什么 `null` / `undefined` 没有这个问题？

例如：

```tsx
{
  payAmount && <Text> + ¥{payAmount}</Text>;
}
```

如果接口返回：

```json
{
  "payAmount": null
}
```

那么：

```js
null && <Text> + ¥0</Text>;
```

结果是：

```js
null;
```

React 对 `null` 不进行渲染。

因此页面不会出现任何内容。

而：

```js
0 && <Text> + ¥0</Text>;
```

结果是：

```js
0;
```

React 又恰好会渲染数字 `0`。

所以才产生了这个看起来比较反直觉的结果：

| `payAmount` | `&&` 表达式结果    | React        |
| ----------- | ------------------ | ------------ |
| `null`      | `null`             | 不渲染       |
| `undefined` | `undefined`        | 不渲染       |
| `false`     | `false`            | 不渲染       |
| `0`         | `0`                | **渲染 `0`** |
| `1`         | `<Text>...</Text>` | 正常渲染     |

---

## 七、最终修复方案

## 方案一：明确判断金额是否大于 0

经过确认，该页面的业务需求是：

> 支付金额大于 0 时才展示支付金额，支付金额为 0 时不展示。

因此最终修改为：

```tsx
{
  payAmount > 0 && <Text> + ¥{payAmount}</Text>;
}
```

这样：

```ts
payAmount = 0;
```

执行：

```js
0 > 0;
// false
```

最终 JSX 相当于：

```tsx
{
  false;
}
```

React 不会渲染任何内容。

---

## 八、为什么不推荐简单改成三元表达式？

有些同学可能会想到：

```tsx
{
  payAmount ? <Text> + ¥{payAmount}</Text> : null;
}
```

这个写法确实可以解决当前问题。

但从代码语义来说，它表达的是：

> `payAmount` 是 truthy 时展示。

而我们的真实业务需求其实是：

> `payAmount > 0` 时展示。

因此：

```tsx
{
  payAmount > 0 && <Text> + ¥{payAmount}</Text>;
}
```

比：

```tsx
{
  payAmount ? <Text> + ¥{payAmount}</Text> : null;
}
```

更加准确。

**修复 Bug 的同时，最好让代码表达真实的业务规则。**

---

## 九、另一个业务场景：0 本身就是合法值

需要注意的是，并不是所有情况下都应该写：

```tsx
value > 0;
```

例如某些页面中：

```json
{
  "payAmount": 0
}
```

可能代表：

> 用户实际支付金额为 0 元。

这时候 `0` 是一个有业务意义的合法值。

如果需求是：

> 只要后端返回了 `payAmount`，即使是 0，也需要展示。

那么：

```tsx
{
  payAmount && <Text>¥{payAmount}</Text>;
}
```

显然是不合适的。

此时应该判断：

```tsx
{
  payAmount != null && <Text>¥{payAmount}</Text>;
}
```

这里：

```js
value != null;
```

主要用于判断：

```text
value !== null
&&
value !== undefined
```

它不会把 `0` 排除掉。

因此：

```js
0 != null;
// true
```

---

## 十、同类问题：数组 `length`

这类问题在项目中其实非常常见。

例如：

```tsx
{
  list.length && <List data={list} />;
}
```

当：

```ts
list.length === 0;
```

实际上执行：

```js
0 && <List />;
```

最终得到：

```js
0;
```

React 于是渲染：

```text
0
```

页面同样会出现一个多余的 `0`。

更合理的写法：

```tsx
{
  list.length > 0 && <List data={list} />;
}
```

---

## 十一、哪些字段需要特别警惕？

以后在 React 项目中看到：

```tsx
{
  xxx && <Component />;
}
```

建议重点检查 `xxx` 的类型。

尤其是以下数字字段：

```text
金额
数量
库存
排名
计数
数组 length
分数
状态码
```

例如：

```tsx
{
  count && <Component />;
}

{
  amount && <Component />;
}

{
  stock && <Component />;
}

{
  list.length && <Component />;
}

{
  score && <Component />;
}
```

这些都存在 `0` 导致异常渲染的可能。

---

## 十二、Code Review 中应该如何判断？

看到：

```tsx
{
  xxx && <Component />;
}
```

可以快速问自己一个问题：

> **如果 `xxx === 0`，最终 JSX 会得到什么？**

如果 `xxx` 是 Boolean：

```tsx
{
  isVisible && <Component />;
}
```

通常没有问题。

因为：

```ts
isVisible;
```

一般只有：

```ts
true | false;
```

但如果 `xxx` 是数字：

```tsx
{
  count && <Component />;
}
```

就需要进一步确认业务逻辑。

---

## 十三、正确的写法总结

### 1. Boolean 条件

推荐：

```tsx
{
  isVisible && <Component />;
}
```

---

### 2. 数字大于 0

推荐：

```tsx
{
  count > 0 && <Component />;
}
```

---

### 3. 判断数字是否存在

推荐：

```tsx
{
  count != null && <Component />;
}
```

---

### 4. 数组是否有数据

推荐：

```tsx
{
  list.length > 0 && <Component />;
}
```

---

### 5. 金额是否大于 0

推荐：

```tsx
{
  payAmount > 0 && <Component />;
}
```

---

## 十四、经验沉淀

这次 Bug 表面上只是页面多了一个 `0`，但背后其实涉及两个容易被忽略的知识点：

```text
JavaScript && 短路求值
+
React JSX 对数字 0 的处理
```

以前我们经常把：

```tsx
{
  value && <Component />;
}
```

理解成：

> value 有值就渲染，没有值就不渲染。

但这个理解并不完全准确。

更准确的理解应该是：

> **React 会先拿到 JavaScript 表达式 `value && <Component />` 的计算结果，然后再决定如何渲染这个结果。**

因此：

```tsx
{
  0 && <Component />;
}
```

最终不是：

```tsx
{
  false;
}
```

而是：

```tsx
{
  0;
}
```

于是 React 就把 `0` 渲染出来了。

---

## 十五、最终结论

这次问题的核心可以总结成一句话：

> **不要把 JavaScript 的 truthy / falsy 判断，等同于 React 中的“是否渲染”。**

特别是在 React 中使用：

```tsx
{
  value && <Component />;
}
```

时，如果 `value` 是数字类型，就需要特别注意 `0`。

### 推荐原则

```tsx
// Boolean
{
  isShow && <Component />;
}

// 数字条件
{
  count > 0 && <Component />;
}

// 判断是否存在
{
  value != null && <Component />;
}

// 数组
{
  list.length > 0 && <Component />;
}
```

**条件渲染的最佳实践不是追求代码最短，而是让条件本身准确表达业务含义。**

这不仅可以避免 `0` 渲染问题，也能让后续 Code Review 和代码维护更加直观。
