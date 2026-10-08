---
title: 'TreeShaking'
description: '解释 ESM 静态分析、usedExports、sideEffects、CSS 保留及 PURE 注解风险，用内存构建实验验证代码是否真的被移除。'
updatedAt: '2026-10-02'
module: '工程化'
order: 5
status: 'done'
---

# TreeShaking

## 一、是什么

Tree Shaking 是构建阶段依据模块引用关系移除未使用代码的优化。
它利用 ESM 的静态 import/export 建立可分析的关系，再结合副作用判断决定能否删除代码。

“没有使用导出”和“可以不执行这个模块”是两件事。
一个没有任何导出的模块，也可能注册事件、修改全局对象、注入 CSS 或初始化监控。
这些效果即使没有被 import 绑定引用，也可能是应用运行所必需的。

Tree Shaking 不是运行时垃圾回收，也不是把暂时看不见的页面删除。
它只依据构建时可证明的条件和开发者的声明做优化。

## 二、为什么

大型组件库、工具库和多入口应用常有大量可选能力。
如果每个页面只需要一小部分，移除不可达代码可以减少传输、解析和执行成本。

但体积下降不是唯一目标：把注册逻辑或样式误删，通常比多下载几 KB 更危险。
工程上应同时验证两类结果：

- **负向断言**：不需要的实现没有进入产物。
- **正向断言**：需要的样式、polyfill 和初始化逻辑仍然执行。

仅比较 gzip 大小看不出“应用变小是因为功能坏了”。
开发模式与生产模式也应分开比较，前者常保留可读代码用于调试。

## 三、核心原理

### 从 ESM 到产物

```text
entry import { add } from './math.js'
                    |
                    v
           解析静态导入与导出
                    |
                    v
       usedExports 标记 add 被使用
                    |
          +---------+----------+
          |                    |
          v                    v
   未使用的 subtract     顶层 register()
          |                    |
   可证明无副作用        可能修改全局状态
          |                    |
          v                    v
    压缩时可删除          默认保留执行效果
```

Webpack 的 `usedExports` 是导出使用分析；标记 unused 不保证开发产物中函数声明立刻消失。
生产压缩器还会结合控制流、常量和副作用分析完成实际删除。
`mode: 'production'` 提供常用优化默认值，但不是一条能修复所有依赖组织问题的魔法开关。

ESM 的静态结构有利于分析，但 ESM 模块本身仍然可以有副作用。
`import * as utils` 也不必然破坏优化：静态访问 `utils.add` 通常仍可分析。
若使用运行时键 `utils[name]`，构建器可能不得不保留更多导出。

### CommonJS 的边界

```js
// CommonJS 反例：导出由运行时条件决定。
const implementations = {
  fast: () => 'fast',
  safe: () => 'safe',
};
module.exports = implementations[process.env.ENGINE || 'safe'];
```

动态 `require()`、可变 `module.exports` 和运行时分支会增加静态分析难度。
某些构建器能优化简单 CommonJS，不能绝对说“CommonJS 一行也删不了”。
但把整个库提前转为 CommonJS，通常会损失原有 ESM 信息，不能指望使用者再完整恢复。

库作者应提供真实 ESM 出口；使用者应检查包的 `exports` 条件最终解析到了哪份文件。
若 Babel 预先把 ESM 转成 CommonJS，应评估保留模块语法的配置。
本站 `tsconfig.json` 使用 `module: 'esnext'` 与 `moduleResolution: 'bundler'`，没有要求 TS 先转成 CommonJS。

### sideEffects 是承诺而非检测器

`package.json` 中的 `sideEffects: false` 表示：该包的文件若没有被使用的导出，可以跳过其求值。
它不是“所有函数都是纯函数”，也不是“把运行时副作用自动消除”。
错误声明会让构建器合法地做出错误业务结果。

下面是一个组件库的配置片段，须合并到该库自己的 `package.json`，不是覆盖本站配置：

```json
{
  "sideEffects": [
    "**/*.css",
    "**/*.scss",
    "./dist/register.js",
    "./dist/polyfills.js"
  ]
}
```

路径要匹配**实际发布的文件**，不能发布目录是 `dist`，却只列出 `src/register.ts`。
未匹配的文件仍被视为可安全跳过，所以 barrel 文件自身含初始化时，也必须纳入清单。

CSS 是典型副作用资源：`import './button.css'` 的价值不是导出对象，而是改变页面外观。
对于自己维护的 Webpack 项目，还可以在对应 CSS rule 上显式配置 `sideEffects: true`。
这需要已有 CSS Loader 管线，单独写一个 rule 不能凭空获得 CSS 支持。

注意：声明 CSS 有副作用，不会强制收集整个包所有 CSS。
如果某个未使用组件连同依赖子树都被裁剪，它独有的 CSS 仍可能不进入产物。
正确目标是“正在使用的组件保留所需 CSS”，而不是“所有样式永不删除”。

### PURE 注解的局部语义

`/*#__PURE__*/ factory()` 表示这次调用的返回值若无人使用，可以移除调用。
它是开发者提供给优化器的断言，不是运行时指令，也不是纯度证明。
调用参数自身的副作用还需要另行分析，并非注解后整条语句必定消失。

不要给注册事件、写缓存、修改全局对象的调用标 PURE。
尤其不能为了让 bundle analyzer 的数字好看，在不了解第三方代码时批量添加注解。

## 四、实践

### 无依赖验证模块仍会求值

下面代码可直接用 Node 22 的 `node --input-type=module` 从标准输入执行。
使用 data URL 只是为了不创建教学文件；不代表生产 Webpack 推荐用 data URL 导入业务模块。

```js
import assert from 'node:assert/strict';

const source = `
  globalThis.__treeDemo = (globalThis.__treeDemo ?? 0) + 1;
  export const used = 42;
  export const unused = 'unused';
`;
const url = `data:text/javascript,${encodeURIComponent(source)}`;
const { used } = await import(url);
await import(url);
assert.equal(used, 42);
assert.equal(globalThis.__treeDemo, 1);
delete globalThis.__treeDemo;
console.log('module evaluation assertions passed');
```

即使只读取 `used`，模块顶层语句仍执行，而且同一 URL 的模块被缓存。
这段实验说明运行时语义，不声称 Node 在做 Tree Shaking。
是否删除 `unused`，必须检查经过 bundler 优化的产物。

### 真正的内存构建实验

在独立教学项目安装 `esbuild@0.25.0`，将下面代码作为 ESM 执行。
这里固定一个可复现的实验版本，不宣称它是 2026 年最新版。
本站没有直接安装 esbuild；不要为了阅读本文修改本站依赖。

该实验通过虚拟模块提供源码，`write: false` 保证构建不写输出文件。
它验证保留副作用、移除 unused、错误 PURE 三种结果，而不是依赖压缩后的函数名。

```js
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';

async function bundle(lib) {
  const result = await build({
    stdin: {
      contents: 'import { used } from "virtual:lib"; globalThis.answer = used;',
      loader: 'js',
    },
    bundle: true,
    format: 'iife',
    minify: true,
    write: false,
    plugins: [
      {
        name: 'virtual-library',
        setup(api) {
          api.onResolve({ filter: /^virtual:lib$/ }, () => ({
            path: 'lib',
            namespace: 'demo',
          }));
          api.onLoad({ filter: /.*/, namespace: 'demo' }, () => ({
            contents: lib,
            loader: 'js',
          }));
        },
      },
    ],
  });
  return result.outputFiles[0].text;
}

const library = `
  export const used = 42;
  export const unused = 'UNUSED_MARKER';
  function register() {
    globalThis.registered = true;
    return {};
  }
  export const registration = register();
`;
const normal = await bundle(library);
const unsafe = await bundle(
  library.replace('= register()', '= /*#__PURE__*/ register()'),
);
const normalContext = {};
const unsafeContext = {};
vm.runInNewContext(normal, normalContext);
vm.runInNewContext(unsafe, unsafeContext);
assert.equal(normal.includes('UNUSED_MARKER'), false);
assert.equal(normalContext.answer, 42);
assert.equal(normalContext.registered, true);
assert.equal(unsafeContext.answer, 42);
assert.equal(unsafeContext.registered, undefined);
console.log('tree shaking assertions passed');
```

两个产物都保留答案 42，但错误注解版本丢失注册效果。
`vm` 仅运行这里写死的教学源码，不应用作执行不可信代码的安全沙箱。

### 工程实践与排查顺序

先用生产模式构建，再打开产物及分析报告，不从开发服务器代码推断最终体积。
按下面顺序排查，避免反复改无关配置：

1. 检查入口实际导入路径及最终解析的 ESM/CJS 文件。
2. 检查转换链是否在打包前丢失 ESM 结构。
3. 检查顶层初始化、动态属性访问和命名空间导出。
4. 检查库的 `sideEffects` 是否对应发布路径。
5. 检查压缩是否启用，以及注解是否被转换器正确保留。
6. 对关键样式和注册效果补正向回归，不只做体积预算。

组件库验收应分别覆盖：只引入一个组件、引入两个共享样式的组件、只引入初始化入口。
CSS 回归应检查真实渲染样式，不能只断言输出目录里存在某个 `.css` 文件。

本站由 Next 管理构建，不应为“启用 Tree Shaking”向根包盲目添加 `sideEffects: false`。
本站还有全局 CSS、Markdown 高亮样式与交互组件，错误声明会改变资源保留语义。
如需比较 Webpack 与 Turbopack，分别构建、分别验证，不把一方配置当作另一方的开关。

## 五、误区

- **ESM 等于无副作用。** ESM 保证结构可分析，不保证顶层语句纯净。
- **sideEffects 数组代表允许执行的文件。** 它参与未使用模块的优化判断，不是运行时访问控制。
- **CSS 不导出变量，应当删除。** 样式生效本身就是可观察效果。
- **标 PURE 是安全优化。** 错误注解等于向编译器提供错误事实，可能删除必要功能。
- **体积不降说明 Tree Shaking 失效。** 代码可能确实被使用，或需要保留副作用；先找证据。
- **动态导入就是 Tree Shaking。** 动态导入改变加载时机，仍可能把完整依赖打进异步 chunk。

## 六、总结

Tree Shaking 的正确性依赖静态关系、保守的副作用分析和真实的开发者声明。
优化结果必须同时满足“无用代码消失”和“必要效果保留”。

延伸阅读：

- [Webpack原理](/knowledge/05-工程化/02-Webpack原理)：模块图与优化阶段。
- [代码分割](/knowledge/05-工程化/06-代码分割)：加载边界与缓存策略。
- [模块化机制](/knowledge/02-JavaScript进阶/03-模块化机制)：ESM 与 CommonJS 的运行时语义。

官方资料（2026-10-02 核对）：

- [Webpack Tree Shaking 指南](https://webpack.js.org/guides/tree-shaking/)
- [Webpack sideEffects 与 usedExports](https://webpack.js.org/configuration/optimization/)
- [esbuild Tree Shaking 与注解语义](https://esbuild.github.io/api/#tree-shaking)
