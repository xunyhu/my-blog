---
title: 'Proxy 与 Reflect'
description: '以 13 个拦截器与对应的内部方法为骨架，讲清 Reflect 存在的三条理由（默认行为复用、返回值规范化、receiver 正确性），手写一份 Vue3 风格的 mini reactive，并用实测抛错原文与性能数据标注不变量、内部槽、trap 轨迹这些真实陷阱。'
updatedAt: '2026-10-08'
module: 'JavaScript进阶'
order: 7
status: 'done'
---

# Proxy 与 Reflect

## 一、是什么

`Proxy` 为对象安装一层**由你定义的拦截逻辑**：外界拿到的不是目标对象本身，而是一个「代理对象」，所有对该对象的语言级操作都会先经过你注册的函数。

```ts
const proxy = new Proxy(target, handler);
```

被拦截的不是「方法」，而是 ECMAScript 规范里的**内部方法（internal methods）**——它们是语言本身在求值时调用的双中括号操作，JS 代码无法直接访问，但每一行代码最终都会落到它们上面。`Reflect` 则是这些内部方法的**规范化默认实现**：它与 handler 里的 trap 一一对应，名字相同、语义相同。

规范列出的内部方法与对应 trap 共 13 个（普通对象 11 个 + 函数对象 2 个）：

| 内部方法                | 对应 trap                  | 触发它的典型语言操作                                   |
| ----------------------- | -------------------------- | ------------------------------------------------------ |
| `[[GetPrototypeOf]]`    | `getPrototypeOf`           | `Object.getPrototypeOf`、`instanceof`、原型链查找      |
| `[[SetPrototypeOf]]`    | `setPrototypeOf`           | `Object.setPrototypeOf`、`class extends`               |
| `[[IsExtensible]]`      | `isExtensible`             | `Object.isExtensible`、赋值前的可扩展性检查            |
| `[[PreventExtensions]]` | `preventExtensions`        | `Object.preventExtensions` / `Object.freeze`           |
| `[[GetOwnProperty]]`    | `getOwnPropertyDescriptor` | `Object.getOwnPropertyDescriptor`、`Object.keys` 过滤  |
| `[[DefineOwnProperty]]` | `defineProperty`           | `Object.defineProperty`、**class 字段声明**            |
| `[[HasProperty]]`       | `has`                      | `in`、`with`、`indexOf` 的存在性检查                   |
| `[[Get]]`               | `get`                      | `obj.x`、解构、`arr[i]`、`includes`/`indexOf` 的取元素 |
| `[[Set]]`               | `set`                      | `obj.x = 1`、`arr.push()` 写索引与 `length`            |
| `[[Delete]]`            | `deleteProperty`           | `delete obj.x`                                         |
| `[[OwnPropertyKeys]]`   | `ownKeys`                  | `for...in`、`Object.keys/ownKeys/getOwnPropertyNames`  |
| `[[Call]]`              | `apply`                    | `fn()`、`fn.call`、`Reflect.apply`                     |
| `[[Construct]]`         | `construct`                | `new fn()`                                             |

另外还有 `Proxy.revocable()`——构造出一个可被 `revoke()` 一次性作废的代理。

因为**所有**内部方法都可被替换，Proxy 的能力上限远高于「监听属性变化」：它允许你定义一个语义完全自定的 exotic object（数组之于普通对象就是这个道理）。[Proxy 是 Baseline 广泛可用特性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)，各主流浏览器自 2016 年 9 月起支持，这也是 Vue 3 能把最低版本定在 Safari 10 / Chrome 60 一档的原因。

## 二、为什么

### 与 `Object.defineProperty` 方案对比（Vue 2 → Vue 3 的动机）

响应式只是 Proxy 的一个应用点，它的优势要放到「数据监听该怎么做」的语境里才看得清：

| 维度                | `defineProperty` 遍历定义 getter/setter | `Proxy`                          |
| ------------------- | --------------------------------------- | -------------------------------- |
| 新增/删除属性       | 捕获不到，需 `$set` / `$delete`         | `set` / `deleteProperty` 覆盖    |
| 数组索引与 `length` | 需要专门 hack                           | 天然走 `[[Set]]`                 |
| 初始化成本          | 递归遍历整个对象图，一次性定义完        | 惰性：访问到哪层才代理哪层       |
| 原型链读取          | 只能定义自身属性                        | `get` 拦截包含继承链             |
| 只读/冻结对象       | 完全无法插入 setter                     | 可拦截（但受不变量约束，见 3.4） |

一句话：`defineProperty` 是**在已有对象上打补丁**，`Proxy` 是**替换对象的语义**。后者才能把「监听」做完整。

### 更一般的能力清单

- 校验与写入闸门（`set` 里比较类型、归一化或拒绝）
- 敏感字段脱敏（`get` + `has` + `ownKeys` + `getOwnPropertyDescriptor` 四处协同）
- 访问审计与埋点（记录「谁在什么时候读了哪个字段」）
- 不可变数据（写时复制：`set` 不动原对象，写入副本后返回新代理）
- 惰性求值与自动补全（`get` 未定义 key 时返回占位对象，实现按需生成深层结构）
- 沙箱与临时授权（`Proxy.revocable`：`revoke()` 后任何操作立即抛错）
- RPC / Worker 远程对象门面、函数参数校验与调用计数（`apply`/`construct`）

## 三、核心原理

### 3.1 一次属性读取的完整链路

```text
proxy.name
   │
   ▼
[[Get]]("name", receiver = proxy)          ← 语言规范层
   │
   ├─ handler.get 存在？
   │     ├─ 是 → handler.get(target, "name", receiver)
   │     │          │
   │     │          └─ Reflect.get(target, "name", receiver)   ← 默认语义
   │     │                  ├─ target 自身有数据属性 → 返回值
   │     │                  └─ 命中原型上的 accessor → 以 receiver 作为 this 调用 getter
   │     └─ 否 → 直接执行默认 [[Get]]（等价于 Reflect.get）
   ▼
返回值 ──► 不变量校验（invariant check）
             若 target 上该属性是 non-writable + non-configurable，trap 返回别的值 → TypeError
```

`receiver` 是这条链路里最容易被忽略的参数：**它是「本次访问的发起对象」**，代理场景下就是 proxy 本身。传与不传，决定了原型链上 getter 的 `this` 指向谁。

### 3.2 Reflect 存在的三条理由

**理由 1：默认行为复用。** 手写 `target[key]` 不等于默认 `[[Get]]`：它处理不好继承链与 accessor。`Reflect.get(target, key, receiver)` 就是引擎自己那套语义。规范文档明确说明「Reflect 方法所做的就是调用对应的内部方法，此外只做输入的规范化/校验」。

**理由 2：返回值规范化。** `set` / `defineProperty` / `deleteProperty` 这些 trap **必须返回布尔**（表示操作成功与否），而不是被设置的值。写 `return (target[key] = value)` 会把赋值的右值当结果返回，语义就走形了；`Reflect.set(...)` 天然返回布尔，也天然把失败如实上报。

**理由 3：`receiver` 正确性（最关键的那条）。** 实测对比：

```ts
const raw = {
  first: 'Hu',
  last: 'Rui',
  get full() {
    return `${this.first}.${this.last}`;
  },
};

// ✅ 传 receiver：getter 里的 this 是代理，读 this.first 会再次进入 get trap
const ok = new Proxy(raw, {
  get(t, k, receiver) {
    return Reflect.get(t, k, receiver);
  },
});

// ❌ 少传 receiver：等价于以 target 作为 getter 的 this
const bad = new Proxy(raw, {
  get(t, k) {
    return Reflect.get(t, k);
  },
});

// ❌ 更糟的手写版：直接下标，同样丢掉 accessor 语义与拦截机会
const worse = new Proxy(raw, {
  get(t, k) {
    return (t as Record<string, unknown>)[k as string];
  },
});
```

在同一份验证脚本里跑出的结果：`ok.full` 得到 `Hu.Rui`，改 `first` 后自动变为 `Blog.Rui`（依赖追踪生效）；而 `bad.full` / `worse.full` 虽然也能拿到字符串，但**内部对 `this.first` 的访问一次都没有被拦截**——打印的 trap 调用计数是 `0`。含义很直接：**少传一个 `receiver`，getter 内部的所有依赖收集与审计全部失效**。在响应式系统里它就是「改了值但视图不动」，在访问审计里它就是「漏记录」。

> 反方向也要防：`Reflect` 不会「解除代理」。在 trap 里对 **proxy 自身** 调用 `Reflect.get(proxy, key)`，这次调用会再次进入同一个 trap，形成无限递归直到栈溢出。trap 里操作的第一个参数永远是 `target`。

### 3.3 手写 mini reactive（Vue3 风格）

下面是完整可运行的实现（TypeScript，Node 22.14 实测），只用到 5 个 trap：`get` / `set` / `deleteProperty` / `has` / `ownKeys`。

```ts
type EffectFn = (() => void) & { deps: Set<Set<EffectFn>> };

let activeEffect: EffectFn | null = null;
const effectStack: EffectFn[] = [];
// 依赖仓库：target → key → 该 key 上的所有副作用
const targetMap = new WeakMap<object, Map<PropertyKey, Set<EffectFn>>>();
const ITERATE_KEY = Symbol('iterate'); // 「遍历这个集合」这一抽象依赖

function track(target: object, key: PropertyKey): void {
  if (!activeEffect) return; // 不在 effect 中 → 不建立依赖
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect);
  activeEffect.deps.add(dep); // 反向索引：重跑时能清掉旧依赖
}

function trigger(target: object, key: PropertyKey): void {
  const dep = targetMap.get(target)?.get(key);
  if (!dep) return;
  for (const run of [...dep]) run(); // 拷贝一份：迭代中允许依赖集合变化
}

export function effect(fn: () => void): EffectFn {
  const run: EffectFn = Object.assign(
    (): void => {
      if (effectStack.includes(run)) return; // 自触发死循环保护
      run.deps.forEach((dep) => dep.delete(run));
      run.deps.clear(); // 每次重跑先清空，条件分支的依赖才能收敛
      effectStack.push(run);
      activeEffect = run;
      try {
        fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1] ?? null;
      }
    },
    { deps: new Set<Set<EffectFn>>() },
  );
  run();
  return run;
}

const proxyCache = new WeakMap<object, object>(); // 同一 target 复用同一 proxy

export function reactive<T extends object>(target: T): T {
  if (proxyCache.has(target)) return proxyCache.get(target) as T;

  const proxy = new Proxy(target, {
    get(t, key, receiver) {
      const value = Reflect.get(t, key, receiver);
      if (typeof value === 'function') return value; // 方法不追踪，避免 this 错位
      track(t, key);
      if (value && typeof value === 'object') return reactive(value); // 惰性深层代理
      return value;
    },
    set(t, key, value, receiver) {
      const had = Object.prototype.hasOwnProperty.call(t, key);
      const prev = Reflect.get(t, key, t);
      const ok = Reflect.set(t, key, value, receiver);
      if (ok && (!had || !Object.is(prev, value))) {
        trigger(t, key);
        if (Array.isArray(t) && key !== 'length') trigger(t, 'length');
        if (!had) trigger(t, ITERATE_KEY); // 新增 key → 遍历型依赖也要更新
      }
      return ok;
    },
    deleteProperty(t, key) {
      const had = Reflect.has(t, key);
      const ok = Reflect.deleteProperty(t, key);
      if (ok && had) {
        trigger(t, key);
        trigger(t, ITERATE_KEY);
      }
      return ok;
    },
    has(t, key) {
      const r = Reflect.has(t, key);
      track(t, key); // `in` 也是一次依赖
      return r;
    },
    ownKeys(t) {
      track(t, ITERATE_KEY);
      return Reflect.ownKeys(t);
    },
  });
  proxyCache.set(target, proxy);
  return proxy as T;
}
```

逐条对照实测输出：

```text
R1 首次 effect 执行次数 = 1 | lastName = hurui | countSeen = 0 | lenSeen = 2
R2 state.count = 5 后 countSeen = 5 | 无关 effect 次数仍 = 1   ← 精确依赖，不是全局广播
R2' 连续两次赋同一个值 → Object.is 相同，不触发
R3 嵌套赋值 state.user.name = 'dev' → lastName = dev，effect 次数 = 2  ← 惰性深层代理
R4 state.list.push(3) → lenSeen = 3                            ← 补触发 'length'
R5 state.list = [9]   → lenSeen = 1                            ← 整体替换走 set trap
R6 delete state.count → 依赖它的 effect 重跑，countSeen = undefined
R7/R8 getter full = Hu.Rui → 改 first → Blog.Rui                ← receiver 的价值
```

实现里五个**做不对就行为错误**的点：

1. **`get` 里遇到函数直接返回，不 track、不代理。** 否则 `state.list.push` 会被记成依赖，且把方法包成代理会让 `this` 指向 proxy，数组方法对代理写入更易踩不变量。
2. **`set` 要区分「新增 key」与「修改值」。** 修改用 `Object.is` 避免同值触发；新增必须额外触发 `ITERATE_KEY`，否则 `Object.keys(state)` / `v-for` 这类「依赖集合形状」的 effect 收不到通知。
3. **数组要补触发 `length`。** `push` 的真实写入顺序是 `set(index)` → `set('length')`，但「读 `length` 的 effect」只有被显式通知才可靠，因此实现里补一次（Vue 3 通过 `ownKeys`/`length` 的组合达成同一目的）。
4. **`effect` 重跑前清空旧依赖。** 少了这一步，`if (flag) read(a) else read(b)` 会让依赖只增不减，最终退化成「改什么都重跑」。
5. **`proxyCache` 用 `WeakMap`。** 保证 `reactive(obj) === reactive(obj)`；否则同一对象的不同代理会 track 到不同 `target`，触发链断裂。

真实 Vue 3 在此基础上还处理了 `Map/Set/WeakMap` 的集合专用代理、`toRaw`、`shallowReactive`、`markRaw`、`computed` 的惰性求值与调度器，并把 `trigger` 拆成队列 + 微任务批处理——这些正是「mini」与「可用」之间的距离。

### 3.4 不变量（invariants）：Proxy 不是想骗就能骗

规范给每个 trap 设了不可违反的约束，违反即 `TypeError`。以下抛错原文均为实测：

```text
// target 上有 non-configurable 的 'must'，ownKeys 却漏报
TypeError: 'ownKeys' on proxy: trap result did not include 'must'

// trap 试图为 non-writable + non-configurable 的数据属性返回别的值（期望 1，返回 999）
TypeError: 'get' on proxy: property 'must' is a read-only and non-configurable data
property on the proxy target but the proxy did not return its actual value
(expected '1' but got '999')

// Proxy.revocable 撤销之后的任何操作
TypeError: Cannot perform 'get' on a proxy that has been revoked

// trap 返回 truish，但目标属性是 non-configurable + non-writable 且值不同（宽松模式也抛）
TypeError: 'set' on proxy: trap returned truish for property 'x' which exists in the
proxy target as a non-configurable and non-writable data property with a different value
```

**赋值的静默与抛错，取决于「模式」和「是哪种失败」**，实测矩阵如下：

| 写法                                 | 宽松模式 | 严格模式                                                            |
| ------------------------------------ | -------- | ------------------------------------------------------------------- |
| 直接改 `Object.freeze` 后的对象      | 静默失败 | `TypeError: Cannot assign to read only property 'k'`                |
| 通过**无 set trap 的代理**改冻结对象 | 静默失败 | 同上错误                                                            |
| `set` trap 显式返回 `false`          | 静默失败 | `TypeError: 'set' on proxy: trap returned falsish for property 'a'` |
| `set` trap 返回 `true` 但违反不变量  | **抛错** | 抛错                                                                |

结论：**「操作失败」遵循常规语义（严格模式才抛）；「不变量违规」无论是否严格模式都抛错**。因此不能笼统地说「代理把静默失败变成可见错误」——只有当你试图欺骗引擎时才是。

同一属性若**可配置**，`get` 想返回什么就返回什么（实测得到 `999`）。这条差异极其重要：**篡改值的能力取决于目标属性的可配置性**。对 `Object.freeze` 结果或 class 字段做代理时，校验/脱敏逻辑可能直接抛错而不是静默生效。

## 四、工程实践

### 4.1 字段脱敏：多个 trap 必须协同

目标是「让 `Object.keys`、`JSON.stringify`、`in` 和下标都看不到 `token`」：

```ts
const user = { id: 1, name: 'hurui', token: 'secret' } as Record<
  string,
  unknown
>;

const masked = new Proxy(user, {
  getOwnPropertyDescriptor(t, k) {
    if (k === 'token') return { enumerable: false, configurable: true };
    return Reflect.getOwnPropertyDescriptor(t, k);
  },
  ownKeys(t) {
    return Reflect.ownKeys(t).filter((k) => k !== 'token');
  },
});

console.log(Object.keys(masked)); // ✅ ['id','name']
console.log(JSON.stringify(masked)); // ✅ {"id":1,"name":"hurui"}
console.log(masked.token); // ❌ 'secret' —— get 没拦，直接下标照样读到
console.log('token' in masked); // ❌ true —— has 没拦
```

实测确认了后两行。语义分散在不同内部方法上：`Object.keys`/`JSON.stringify` 走 `ownKeys` + `getOwnPropertyDescriptor`，下标走 `[[Get]]`，`in` 走 `[[HasProperty]]`。做真正的脱敏，`get`/`has`/`ownKeys`/`getOwnPropertyDescriptor` 四处得一起处理，漏一个就是事故。

### 4.2 内置容器与私有字段：内部槽不可代理

```ts
const mapProxy = new Proxy(new Map<string, number>(), {});
mapProxy.set('a', 1);
// TypeError: Method Map.prototype.set called on incompatible receiver #<Map>
```

`Map`/`Set`/`WeakMap`/`Date`/`RegExp` 的实现依赖**内部槽（internal slot）**，只有 `this` 是真实例时才存在；代理对象没有内部槽，方法一调用就抛错。可行的修复是让方法以 target 为接收者：

```ts
const mapProxyFixed = new Proxy(new Map<string, number>(), {
  get(t, k, r) {
    const v = Reflect.get(t, k, r);
    return typeof v === 'function' ? v.bind(t) : v;
  },
});
mapProxyFixed.set('a', 1);
console.log(mapProxyFixed.get('a')); // ✅ 1
```

私有字段同理，且**无法用 bind 绕过**：

```ts
class Counter {
  #n = 0;
  inc(): number {
    return ++this.#n;
  }
}
new Proxy(new Counter(), {}).inc();
// TypeError: Cannot read private member #n from an object whose class did not declare it
```

这就是 Vue 3 对 `Map/Set` 另做一套集合代理、Pinia/Solid 建议对第三方实例用 `markRaw` 的根本原因：**代理不了就别代理，或者用 `WeakMap` 自建存储。**

### 4.3 `revocable`：把「授权」做成可撤销资源

```ts
const { proxy, revoke } = Proxy.revocable(
  { a: 1 } as Record<string, number>,
  {},
);
revoke();
proxy.a; // TypeError: Cannot perform 'get' on a proxy that has been revoked
```

适用场景：把内部对象引用交给插件/子应用/不可信模块，并保证某时刻之后**任何访问硬失败**。比 `Object.freeze` 彻底（冻结只限制写，不限制读），也比「记得置 null」可靠（置 null 只是断掉自己这条引用，已交出去的引用管不到）。注意 `revoke()` 幂等，但撤销后的代理对象仍可作为 `Map` 的 key 存在——资源清理不能完全依赖它。

### 4.4 `apply` / `construct`：函数与构造语义的拦截

```ts
const sum = (a: number, b: number): number => a + b;
const times10 = new Proxy(sum, {
  apply(t, thisArg, args) {
    return t.apply(
      thisArg,
      args.map((n) => n * 10),
    );
  },
});
times10(1, 2); // ✅ 30

class Base {
  tag: string;
  constructor(tag: string) {
    this.tag = tag;
  }
}
const ConstructProxy = new Proxy(Base, {
  construct(t, args) {
    const inst = new (t as new (tag: string) => Base)(String(args[0]) + '!');
    return Object.assign(inst, { extra: true });
  },
});
new ConstructProxy('x'); // ✅ tag = 'x!'，并带上 extra: true
```

实测另一条：`new Proxy(Base, {})`（不提供 `construct`）时 `new` 依然可用，且 `instanceof Base === true`——**不写 trap 就走默认行为**，函数对象的两个 trap 是可选覆盖。典型用法：`apply` 做参数校验/调用审计/结果缓存；`construct` 做实例池、依赖注入、给第三方类包默认配置。

### 4.5 原型链与 `instanceof`

```ts
const protoProxy = new Proxy(new Parent(), {
  getPrototypeOf() {
    return Parent.prototype;
  },
});
protoProxy instanceof Parent; // ✅ true

const faked = new Proxy(Object.create(null) as Record<string, unknown>, {
  getPrototypeOf() {
    return Parent.prototype;
  },
});
Object.getPrototypeOf(faked) === Parent.prototype; // ✅ true（原本 null）
```

`instanceof` 沿 `getPrototypeOf` 走，因此**代理可以伪造类型身份**（安全敏感的 `instanceof` 校验不能假定对方不可伪造）。`getPrototypeOf` 的不变量是：若 target 可扩展，返回值必须是 target 的原型或其原型链上的对象。

### 4.6 性能开销：本机实测数量级

代理的属性访问无法被 JIT 完全内联，每次读取至少多一次 trap 调用。2000 万次读取（Node 22.14，本机，先做 100 万次预热）：

```text
PERF plain:          11ms   直接读对象属性
PERF proxy-reflect:  346ms  get trap + Reflect.get
PERF proxy-const:    272ms  get trap 直接返回常量
```

约 **30 倍**的量级差距，且与 trap 内部做什么关系不大（成本主要来自「必须调用 trap」这件事）。工程结论：

1. 代理应放在**状态边界**（store、表单模型、配置对象），不要放进每帧执行百万次读取的热循环。
2. 列表场景「一个大 proxy + 索引访问」通常优于「N 个 proxy」：trap 调用次数由读取次数决定。
3. 不需要观察的对象（图表实例、WebGL 上下文、第三方句柄）显式跳过代理，收益比任何微优化都大。

### 4.7 调试技巧：用 Proxy 找出「谁改了这个值」

```ts
const withWriteTrace = <T extends object>(obj: T, label: string): T =>
  new Proxy(obj, {
    set(t, k, v, r) {
      console.trace(`[trace] ${label}.${String(k)} =`, v);
      return Reflect.set(t, k, v, r);
    },
  });
```

在「某个 state 字段莫名被改」的问题上，它比条件断点更快——直接给出调用栈。排查完记得摘掉：每次写入都多了 trap 与 `console.trace` 的开销。

## 五、常见误区

**1. `get` 忘了传 `receiver`。** 表现：原型链 getter 内的字段读取不再被拦截、依赖收集缺失、Vue3 里「改了值视图不动」。实测 trap 调用计数为 `0`。

**2. `Reflect.get(target, key)` 写成 `Reflect.get(proxy, key)`。** 无限递归直到栈溢出。

**3. 以为拦一个 trap 就够了。** 实测脱敏案例：`Object.keys` 干净了，`masked.token` 仍返回 `'secret'`。一个语义（「这个字段存在/可见」）分散在 `get`/`has`/`ownKeys`/`getOwnPropertyDescriptor` 四个内部方法上。

**4. 猜错数组方法触发了哪个 trap。** 我用一份同时记录 `has` 与 `get` 的代理数组实测出精确轨迹：

```text
2 in p          → ["has:2"]
p.includes(3)   → ["get:includes","get:length","get:0","get:1","get:2"]        ← 完全不进 has
p.indexOf(3)    → ["get:indexOf","get:length","has:0","get:0","has:1","get:1","has:2","get:2"]
```

`in` 只走 `[[HasProperty]]`；`includes` 只走 `[[Get]]`；`indexOf` 是 `has` 与 `get` 交替。**在 `has` 里做「元素隐藏」拦不住 `includes`**，必须同时在 `get` 上处理。别凭直觉猜语言操作走哪条内部方法——用一份会打日志的代理跑一遍。

**5. 只代理一层。** `state.user.name = 'x'` 要求 `state.user` 本身是代理。惰性代理解决了正常路径，但**从代理体系外部拿到的引用**（`toRaw` 结果、深拷贝、`JSON.parse` 的新对象）不在这条链上，写入不会触发。

**6. 把 Proxy 当拷贝。** `new Proxy(target, handler)` 与 target 共享底层存储：通过代理写入会**改到原对象**；`proxy === target` 为 `false`，因此拿它当 `Map` key、传给 `Set.has`、与原对象做相等判断都会失败。需要「原对象」时用 `WeakMap<proxy, target>` 反向表（Vue 的 `toRaw` 就是这个结构，也因此它要求先注册过）。

**7. `set` trap 的返回值语义搞错。** 返回 falsy 表示「赋值失败」：严格模式抛 `TypeError: 'set' on proxy: trap returned falsish...`，宽松模式静默不写（实测矩阵见 3.4）。返回被设置的值是最常见的手误。此外 `construct` 必须返回对象，否则 TypeError；`getOwnPropertyDescriptor` 必须返回 descriptor 或 `undefined`。

**8. 用 Proxy 做深拷贝、或以为 `set` 能拦住所有写入。** 深拷贝的正确做法见 [深拷贝实现](/knowledge/02-JavaScript进阶/04-深拷贝实现)：代理里塞满 trap 引用，`structuredClone` 也带不走它。而 **class 字段声明走 `[[DefineOwnProperty]]` 而不是 `[[Set]]`**，所以只实现 `set` 的写入拦截会漏掉 `this.x = 1` 形式的类字段初始化——这条差异 MDN 在 `[[Set]]` 与 `[[DefineOwnProperty]]` 的对比中专门点明（也是「子类字段不会触发父类 setter」的原因）。

**9. 期待 Proxy 拦截一切。** `typeof`、`==`、原始值、`undefined`、私有字段访问都没有对应 trap；`Proxy` 只能包对象。想代理函数调用与 `new` 才有 `apply`/`construct`，想代理 `Symbol.toPrimitive` 之外的隐式转换是做不到的。

## 六、总结

- Proxy 拦截的是 **13 个内部方法**（对象 11 个 + 函数 `apply`/`construct`），外加 `Proxy.revocable` 的一次性作废；正因为「一切交互最终都落到内部方法」，它才是 JS 里最接近元编程的设施。
- Reflect 的三条价值：复用默认语义、返回规范化（布尔型成功标志）、**传入正确的 `receiver`**。第三点是响应式/审计类实现正确与否的分水岭——实测不传会让 getter 内部的拦截计数归零。
- mini reactive 的读侧是 `Reflect.get(..., receiver) → track → 惰性深层代理`，写侧是 `Reflect.set → trigger(key)`，还要补 `ITERATE_KEY`（新增/删除键）、`length`（数组）、`Object.is`（同值不触发），并在 `effect` 重跑前清空依赖。
- 不变量让 Proxy 骗不了引擎：`ownKeys` 漏报不可配置属性、`get` 篡改只读不可配置属性、撤销后访问，均实测抛 `TypeError`；不变量违规在宽松模式下也抛，而普通「赋值失败」只在严格模式抛。
- 内置容器与私有字段依赖内部槽，代理会失败；能 `bind(target)` 或改 `WeakMap` 自建存储就修，修不了就别代理。
- 性能上代理读取约为直接读取的 **30 倍成本**（本机 2000 万次：11ms vs 346ms），把它用在状态边界而不是热循环里。

延伸阅读：[深拷贝实现](/knowledge/02-JavaScript进阶/04-深拷贝实现)、[垃圾回收机制](/knowledge/02-JavaScript进阶/08-垃圾回收机制)（`WeakMap` 作为代理↔原对象映射的存储选择及其回收语义）、[Fiber架构](/knowledge/04-React体系/04-Fiber架构)（框架如何在不依赖 Proxy 的前提下做状态与调度）、[类型体操](/knowledge/08-TypeScript体系/06-类型体操)（`Proxy` 配合条件类型可实现类型级字符串运算）。
