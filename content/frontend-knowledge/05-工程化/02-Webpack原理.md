---
title: 'Webpack原理'
description: '从依赖图、Loader、Plugin 与模块运行时理解 Webpack，并区分 Rspack、Turbopack、esbuild 和 SWC 的职责与迁移边界。'
updatedAt: '2026-10-02'
module: '工程化'
order: 2
status: 'done'
---

# Webpack原理

## 一、是什么

Webpack 是模块打包器（bundler）：从入口发现依赖，把源码组织成可发布的 JavaScript、CSS、图片等资源。
它不只是把文件按顺序拼接，而是维护模块之间的引用关系，再决定哪些代码保留、进入哪个 chunk、如何加载。

先区分三个常混用的词：

| 对象   | 描述                   | 例子                       |
| ------ | ---------------------- | -------------------------- |
| module | 构建系统识别的依赖单元 | 一个 JS 文件、一份 CSS     |
| chunk  | 构建阶段组织模块的分组 | 首屏入口组、动态导入组     |
| asset  | 最终输出文件           | 带内容哈希的 JS、CSS、图片 |

一个 chunk 可能输出多个 asset，多个模块也可能被合并进同一个函数作用域。
所以“源码文件数”“chunk 数”“浏览器请求数”不是同一个指标。

本文以 Webpack 5 的机制为主，工具边界依据文末官方资料核对。
本站实际锁定 Next.js 16.1.7；讨论 Webpack 不代表本站默认在使用 Webpack。

## 二、为什么

只记配置字段，常会遇到“加了 Loader 没效果”“开发正常但生产丢样式”“改一行导致所有包失效”。
理解构建流水线，才能把症状定位到正确阶段：

- 找不到模块：检查解析路径、包导出条件、别名及扩展名。
- 语法不支持：检查转换器是否覆盖该文件、目标语法是否匹配运行环境。
- 包体积过大：检查依赖可达性、导出使用情况及 chunk 分组。
- 首屏加载失败：检查资源发布路径、CDN 缓存和旧版本资源保留。
- 增量编译慢：检查文件失效范围，而不只是笼统更换打包器。

构建速度也要拆开测量：首次无缓存构建、带缓存构建、单文件更新、类型检查各是多少。
把类型检查时间算进 Webpack，再拿另一个工具“不做类型检查”的耗时比较，会得出错误结论。

## 三、核心原理

### 构建流水线

```text
entry
  |
  v
resolve 路径及包条件
  |
  v
读取源码 -> Loader 转换 -> 解析转换后的代码 -> 发现依赖
  ^                                             |
  +---------------- 递归处理依赖 ---------------+
                                                |
                                                v
                                         Module Graph
                                                |
                              标记导出使用、分组、优化
                                                |
                                                v
                                          Chunk Graph
                                                |
                                   生成代码、哈希、资源
                                                |
                                                v
                                      assets + runtime
```

Loader 通常先把输入转换成 Webpack 能分析的代码；随后解析器从转换结果提取依赖。
不能把流程简化成“先分析原始 TS，再让任意 Loader 处理”，因为 Loader 本身可能产生新的 import。
循环依赖让这张图成为有向图，而非严格的树。

### Loader 与 Plugin

Loader 面向单个资源的转换，例如把 TypeScript 转成 JavaScript、把 CSS 转成可被后续步骤处理的模块。
普通 Loader 链按从右到左执行；pitch 阶段方向相反，还可能提前返回并改变后续流程。
因此“所有 Loader 永远从右向左”只适用于正常转换阶段的简写。

Plugin 通过生命周期钩子介入整个构建，可观察模块、改变优化过程或新增输出资源。
Webpack 使用 Tapable 组织钩子；同步钩子与异步钩子的注册方式必须匹配。

`Compiler` 表示一个编译器实例及其配置、插件环境。
`Compilation` 表示某次具体编译，watch 模式下会产生新的编译过程。
把某次编译的数据永久挂在插件实例上，容易产生跨次污染或内存增长。

### 模块运行时与缓存

打包后的代码需要建立模块作用域、导出对象及模块缓存。
CommonJS 风格运行时通常先把模块放入缓存，再执行工厂函数，否则循环引用会无限递归。
ESM 还涉及 live binding、初始化顺序与暂时性死区，不能完全等同于 CommonJS 对象拷贝。

动态导入额外需要 chunk 加载运行时：定位 URL、请求脚本、注册模块、完成 Promise。
Tree Shaking 与分包分别解决“不要哪些代码”和“何时加载哪些代码”，详见文末互链。

### 构建工具的层次

```text
框架层     Next.js：路由、RSC、SSR、缓存、部署约定
                    |
打包层     Webpack / Rspack / Turbopack / esbuild 的 bundler 能力
                    |
转换层     Babel / SWC / esbuild 的 transform 能力
                    |
校验层     TypeScript tsc、ESLint（独立质量门禁）
```

这里是职责图，不表示所有框架都能随意组合任意工具。

| 工具      | 主要职责与实现                                  | 工程边界                                               |
| --------- | ----------------------------------------------- | ------------------------------------------------------ |
| Webpack   | JS 生态中的通用 bundler，Loader/Plugin 体系成熟 | 性能取决于依赖图、缓存与插件，不应只贴“慢”标签         |
| Rspack    | Rust 实现的 bundler，重点兼容 Webpack 生态      | 支持大量而非全部插件；内部 API、版本与行为仍需审计     |
| Turbopack | Rust 实现的增量 bundler，与 Next.js 深度集成    | 不等于 Webpack 插件宿主，配置与 Loader 支持范围不同    |
| esbuild   | Go 实现，提供 bundling、转译、压缩 API          | 不是 Rust 工具；不提供完整 TS 类型检查或 Next 路由语义 |
| SWC       | Rust 编译工具链，常承担 JS/TS/JSX 转换与压缩    | 常见 `@swc/core` 转换用法不负责替你完成框架打包与部署  |

SWC 生态也有打包相关能力，不能据此把“用 SWC 转译”直接理解成“替换 Webpack”。
esbuild 同时覆盖打包和转换，说明分类按能力而非按产品名划分。

Next.js 16 的 `next dev` 与 `next build` 默认使用 Turbopack。
本站 `package.json` 就是这两个命令，`next.config.ts` 没有自定义 Webpack 配置。
需要 Webpack 时可以显式使用 `next build --webpack`，但必须验证插件及构建结果。
不能把独立 Webpack 项目的 Rspack 迁移经验，写成 Next.js 可以无缝更换任意 bundler。

## 四、实践

### 可运行的模块缓存模型

下面代码可直接粘贴进 Node 22 的 REPL，或用 `node --input-type=commonjs` 从标准输入执行。
它没有文件写入、网络依赖，也不是对完整 Webpack 的重实现。

```js
const assert = require('node:assert/strict');

function createRuntime(factories) {
  const cache = new Map();

  function load(id) {
    if (cache.has(id)) return cache.get(id).exports;
    const factory = factories.get(id);
    if (!factory) throw new Error(`Unknown module: ${id}`);

    const module = { exports: {} };
    cache.set(id, module);
    try {
      factory(module, module.exports, load);
    } catch (error) {
      cache.delete(id);
      throw error;
    }
    return module.exports;
  }

  return load;
}

let executions = 0;
const load = createRuntime(
  new Map([
    [
      'counter',
      (module) => {
        executions += 1;
        module.exports = { count: 0 };
      },
    ],
    [
      'a',
      (_module, exports, require) => {
        exports.name = 'a';
        exports.partner = require('b').name;
      },
    ],
    [
      'b',
      (_module, exports, require) => {
        exports.name = 'b';
        exports.partner = require('a').name;
      },
    ],
  ]),
);

load('counter').count += 1;
assert.equal(load('counter').count, 1);
assert.equal(executions, 1);
assert.deepEqual(load('a'), { name: 'a', partner: 'b' });
assert.deepEqual(load('b'), { name: 'b', partner: 'a' });
assert.throws(() => load('missing'), /Unknown module/);
console.log('runtime assertions passed');
```

观察重点不是输出字符串，而是同一个模块多次引用时保持身份，以及循环引用读取部分导出。
模型没有解析源码、没有实现 ESM binding、没有网络 chunk 加载；不能把它当生产 bundler。

### 一个真实的 Webpack 5 插件

以下是独立 Webpack 教学项目的 `webpack.config.cjs`，不是本站配置。
准备导出普通字符串的 `src/index.js`，并在那个项目安装 `webpack@5` 和 `webpack-cli@6` 后运行 `npx webpack`。
输出仅写入该教学项目的 `dist`；不要在已有项目中盲目覆盖配置。

```js
const path = require('node:path');

class BuildInfoPlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap('BuildInfoPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'BuildInfoPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const info = JSON.stringify({ mode: compiler.options.mode });
          compilation.emitAsset('build-info.json', new sources.RawSource(info));
        },
      );
    });
  }
}

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
  },
  plugins: [new BuildInfoPlugin()],
};
```

这比空写 `compiler.hooks.emit.tap()` 更完整：有钩子名、处理函数、明确阶段和正式资源 API。
插件没有修改源文件，也不把时间戳写进 JS，因此不会仅因构建时间变化打散 JS 缓存。

### 工程实践与迁移验收

先记录当前构建耗时、峰值内存、入口体积及动态资源数量，再设计单变量实验。
迁移 Rspack 时列出 Loader、Plugin、资源模块、CSS 提取和 Module Federation 的兼容清单。
迁移 Turbopack 时检查 Next 官方支持范围，不把 `webpack()` 配置原封不动复制过去。

验收至少包括：

1. 生产环境的关键页面、SSR 与 hydration 正常，而非仅首页能打开。
2. CSS 顺序、字体及图片路径一致，动态导入的 URL 能在 CDN 上命中。
3. source map 可还原错误；客户端包没有混入服务端密钥和 Node 专用依赖。
4. 冷构建与热更新分别达标，缓存命中没有掩盖首次构建问题。
5. 保留旧构建和回退命令，避免部署后才发现没有回滚产物。

## 五、误区

- **换成 Rust 就一定快。** JS 插件跨边界调用、磁盘 I/O、类型检查仍可能主导总耗时。
- **SWC 替换 Babel 后等于换 bundler。** 转换器变化与依赖图、chunk 生成是不同层。
- **打包成功等于类型正确。** TS 语法擦除不等于类型检查，CI 仍需单独执行 `tsc --noEmit`。
- **一个模块等于一个请求。** 请求对应输出资源，资源组织受分包、合并与 CSS 提取影响。
- **开发模式正常即可上线。** 生产压缩、Tree Shaking 和路径配置会暴露另一组问题。

## 六、总结

Webpack 的主线是依赖图、编译生命周期、chunk 组织与模块运行时。
选择工具时先区分框架、bundler、compiler 和质量校验，才谈性能或迁移收益。

延伸阅读：

- [TreeShaking](/knowledge/05-工程化/05-TreeShaking)：导出可达性和副作用声明。
- [代码分割](/knowledge/05-工程化/06-代码分割)：异步加载及版本错配。
- [CI-CD](/knowledge/05-工程化/08-CI-CD)：把迁移验收落实为发布门禁。

官方资料（2026-10-02 核对；不把最新官网版本等同于本站锁定版本）：

- [Webpack Compilation hooks](https://webpack.js.org/api/compilation-hooks/)
- [Rspack 从 Webpack 迁移](https://rspack.dev/guide/migration/webpack)
- [Next.js 16 升级说明](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [esbuild FAQ](https://esbuild.github.io/faq/)
- [SWC 入门与转换命令](https://swc.rs/docs/getting-started)
