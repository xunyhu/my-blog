# this 指向

## 一、是什么

this 是函数执行时绑定的对象。

👉 和定义位置无关，只和调用方式有关

## 二、四种绑定规则

### 1. 默认绑定

```js
function foo() {
  console.log(this);
}

foo(); // window / undefined（严格模式）
```

### 2. 隐式绑定

```js
const obj = {
  name: 'A',
  foo() {
    console.log(this.name);
  },
};

obj.foo(); // A
```

### 3. 显式绑定

```js
function foo() {
  console.log(this.name);
}

foo.call({ name: 'B' });
```

### 4. new 绑定

```js
function Person(name) {
  this.name = name;
}

const p = new Person('C');
```

## 三、优先级

new > call/apply > 对象调用 > 默认

## 四、箭头函数

箭头函数没有 this：

```js
const obj = {
  name: 'A',
  foo: () => {
    console.log(this.name);
  },
};
```

👉 this 继承外层作用域

## 五、总结

this 本质：`“函数执行上下文中的动态绑定对象”`
