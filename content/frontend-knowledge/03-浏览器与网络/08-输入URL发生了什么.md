---
title: '输入URL发生了什么'
description: '串联 URL 解析、缓存、DNS、连接、TLS、HTTP、服务端处理与浏览器渲染，用 Navigation Timing 定位真正的导航瓶颈。'
updatedAt: '2026-10-02'
module: '浏览器与网络'
order: 8
status: 'done'
---

# 输入URL发生了什么

## 一、是什么

输入 URL 到页面可见，是一次由浏览器、网络、中间节点、服务端与渲染流水线共同完成的导航。
它不是永远执行“DNS → TCP → HTTP → 渲染”的固定串行流程。
缓存、连接复用、HTTP/3、重定向、Service Worker 和历史页面恢复，都可能改变路径。

本文以普通 HTTP(S) 文档导航为主，区分硬导航、同文档导航与框架客户端路由。
片段跳转可能只改变滚动位置；客户端路由也可能只请求数据并更新部分 UI，不重新下载完整 HTML。

## 二、为什么

同样是“首屏慢”，瓶颈可能完全不同：

- DNS 或连接建立慢，前端压缩 JS 未必有效。
- 源站排队慢，增加 preload 无法降低服务端计算时间。
- 图片很早下载完但很晚显示，应查样式、主线程与渲染延迟。
- 首屏很快但按钮点击卡顿，应查交互关键路径，而不是只看 load 事件。

完整链路的价值，是让每个优化都能对应一段观测证据。
不能把某次本机秒开当作弱网新用户的真实体验。

## 三、核心原理

### 导航入口与缓存分支

浏览器先解释输入，区分搜索词、URL、scheme、主机、路径、查询与片段。
对 HTTP(S) 导航，还会应用相关安全策略；已生效的 HSTS 可以把 HTTP 升级为 HTTPS。
片段部分通常不随 HTTP 请求发送，服务端看到的是路径与查询等请求目标信息。

```text
输入或点击 URL
   |
   +-- 同文档导航 ------------> 更新片段或客户端状态
   +-- 历史恢复且可用 bfcache -> 恢复页面与 JS 状态
   |
   v
文档获取
   +-- 受控 Service Worker 可拦截并返回响应
   +-- HTTP 缓存可复用或需要验证
   |
   v
网络路径 -> 获取首批 HTML -> 增量解析 -> 发现更多资源
                                 |              |
                                 +-- 解析渲染 <--+
```

这是逻辑依赖图，不表示所有浏览器都以同样的内部线程顺序实现。
预连接和预解析可能提前发生，缓存命中也可能让某些网络阶段消失。
bfcache 恢复不是“缓存了一个 HTML 文件”，而是恢复包含 JavaScript 状态的页面快照。

### DNS 与连接建立

域名解析可能命中浏览器、系统或递归解析器缓存。
未命中时，递归解析器按 DNS 委派关系获得结果，浏览器不一定亲自向每一级权威服务器查询。
A、AAAA 返回 IPv4、IPv6 地址，CNAME 等记录可能引入别名解析。

获得候选地址后，浏览器可能尝试多个地址，也可能直接使用已存在的连接。
HTTP/1.1、HTTP/2 常经 TCP 建连再完成 TLS；HTTP/3 使用 QUIC，不能再叠加一个虚构的 TCP 握手。
TLS 阶段检查服务器身份，并通过 ALPN 协商应用协议。
详细规则分别见 [TCP三次握手](/knowledge/03-浏览器与网络/05-TCP三次握手) 与 [HTTPS原理](/knowledge/03-浏览器与网络/04-HTTPS原理)。

```text
冷连接 h2: DNS -> TCP -> TLS 与 ALPN -> HTTP 请求
热连接 h2:              复用现有连接 -> 新的 HTTP 流
冷连接 h3: DNS -> QUIC 与 TLS 握手  -> HTTP/3 请求
缓存命中: 浏览器直接复用响应，可能不进入以上路径
```

“DNS 耗时为 0”可能表示命中缓存或没有新解析，不是“域名不需要 DNS”。
“连接阶段为 0”同样可能来自连接复用，不能据此推断走了明文。

### HTTP 与服务端链路

请求经过 CDN、负载均衡、网关后才可能到达应用。
任何一层都可能返回缓存结果、重定向、限流或错误，并非每次都执行数据库查询。

```text
浏览器 -> CDN -> 网关 -> 应用 -> 缓存或数据库
          |       |      |
          +-------+------+---- 响应可能在任意一层产生
```

301、302、307、308 等重定向可能引发新的获取过程，跨域重定向还可能需要新连接。
304 表示条件验证成功，浏览器复用已有正文；200 也可能是 CDN 返回，而不是源站实时生成。

TTFB 常按导航起点到 responseStart 计算，包含重定向、缓存处理、连接与请求等待等影响。
`responseStart - requestStart` 更接近发出请求到首字节的等待，但仍包含网络传播、代理与排队，不是纯后端计算时间。
要分离数据库或应用耗时，需要服务端追踪和 Server-Timing 等补充证据。

### 从字节到像素再到可交互

浏览器可以边接收 HTML 边解析，不需要等所有字节下载完才开始工作。
解析器构建 DOM，预加载扫描器帮助提前发现脚本、样式、图片等资源。
CSS 参与样式计算；DOM 与样式共同决定布局，随后是绘制、栅格化与合成。

```text
HTML 字节 -> HTML 解析 -> DOM ------------------+
                    |                          |
                    +-> 发现 CSS -> 样式规则 ----+-> 样式计算
                    +-> 发现 JS -> 执行与 DOM 修改 |      |
                                                       v
布局几何 -> 绘制指令 -> 栅格化图块 -> 合成 -> 屏幕呈现
```

普通经典脚本没有 async、defer 时，可能阻塞 HTML 解析；此前的阻塞样式也可能影响脚本执行。
defer 脚本在解析完成后按顺序执行，并在 DOMContentLoaded 前完成。
模块脚本默认具有类似 defer 的时序；async 脚本就绪即执行，不保证多个脚本的相对顺序。
CSS 通常不阻止 HTML 解析，但会影响首次渲染，不能混淆“阻塞解析”和“阻塞渲染”。

DOMContentLoaded 表示文档解析及相关延迟脚本阶段完成，不保证全部图片加载，也不保证页面从此没有长任务。
load 等待相关依赖资源，但懒加载资源和后续动态请求不属于“所有未来工作”。
SSR 输出 HTML 可先显示；客户端框架接管交互、执行 hydration 后仍可能产生额外主线程成本。
最终体验应同时观察 LCP、INP、CLS，而不是只追求一个事件更早触发。

## 四、代码实现

### 读取当前导航而不是依赖隐藏接口

在一个已加载完成的网页 DevTools Console 粘贴以下代码。
它只读取当前文档的性能条目，不发请求、不安装依赖，也不依赖站点提供额外 API。
在 Node.js 22+ 保存为 `navigation-demo.cjs` 执行时，只运行内存样本断言。

```js
function summarizeNavigation(n) {
  const elapsed = (start, end) =>
    Number.isFinite(start) && Number.isFinite(end) && end >= start
      ? Number((end - start).toFixed(2))
      : null;
  return {
    protocol: n.nextHopProtocol || 'not reported',
    type: n.type,
    redirectMs: elapsed(n.redirectStart, n.redirectEnd),
    dnsMs: elapsed(n.domainLookupStart, n.domainLookupEnd),
    connectionMs: elapsed(n.connectStart, n.connectEnd),
    tlsMs:
      n.secureConnectionStart > 0
        ? elapsed(n.secureConnectionStart, n.connectEnd)
        : null,
    requestToFirstByteMs: elapsed(n.requestStart, n.responseStart),
    navigationToFirstByteMs: elapsed(n.startTime, n.responseStart),
    downloadMs: elapsed(n.responseStart, n.responseEnd),
    domReadyMs:
      n.domContentLoadedEventEnd > 0
        ? elapsed(n.startTime, n.domContentLoadedEventEnd)
        : null,
    loadMs: n.loadEventEnd > 0 ? elapsed(n.startTime, n.loadEventEnd) : null,
  };
}

const fixture = {
  nextHopProtocol: 'h2',
  type: 'navigate',
  startTime: 0,
  redirectStart: 0,
  redirectEnd: 0,
  domainLookupStart: 5,
  domainLookupEnd: 15,
  connectStart: 15,
  secureConnectionStart: 35,
  connectEnd: 65,
  requestStart: 70,
  responseStart: 170,
  responseEnd: 190,
  domContentLoadedEventEnd: 230,
  loadEventEnd: 300,
};
const result = summarizeNavigation(fixture);
if (
  result.dnsMs !== 10 ||
  result.connectionMs !== 50 ||
  result.tlsMs !== 30 ||
  result.navigationToFirstByteMs !== 170
) {
  throw new Error('Navigation calculation failed');
}
const reused = summarizeNavigation({
  ...fixture,
  secureConnectionStart: 0,
  loadEventEnd: 0,
});
if (reused.tlsMs !== null || reused.loadMs !== null)
  throw new Error('Missing phase failed');
console.log('Navigation formulas: passed');

if (typeof window !== 'undefined') {
  function report() {
    const nav = performance.getEntriesByType('navigation')[0];
    if (!nav) return console.warn('No navigation entry available');
    console.table(summarizeNavigation(nav));
    console.table(
      performance
        .getEntriesByType('resource')
        .slice(-15)
        .map((r) => ({
          resource: new URL(r.name, location.href).pathname,
          initiator: r.initiatorType,
          protocol: r.nextHopProtocol,
          durationMs: Number(r.duration.toFixed(2)),
          transferBytes: r.transferSize,
        })),
    );
  }
  if (document.readyState === 'complete') report();
  else
    window.addEventListener('load', () => setTimeout(report, 0), {
      once: true,
    });
}
```

connectionMs 已包含其中的 TLS 时间，不能再把 tlsMs 加上去计算总耗时。
load 回调内 loadEventEnd 尚可能为零，因此示例用下一任务读取完整结束时间。
样本只是断言公式，不是该站点的真实性能结果；控制台输出的当前导航才是观测值。

Navigation Timing 字段定义见 [MDN PerformanceNavigationTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming)。
跨源 Resource Timing 的部分字段可能因缺少 Timing-Allow-Origin 而为零，这与 CORS 读取许可是两套机制。
transferSize 为零也不能单独证明缓存命中，需结合来源、权限与其他尺寸字段判断。

## 五、工程实践

### 用瀑布图提出可证伪的假设

| 证据                    | 假设                      | 下一步验证                            |
| ----------------------- | ------------------------- | ------------------------------------- |
| 初始文档重定向多        | 域名或登录跳转链过长      | 逐跳检查 Location 与最终目标          |
| 首字节前等待高          | CDN 未命中或源站排队      | 缓存命中头、请求 ID、服务端追踪       |
| 首屏图片很晚才请求      | 资源发现晚或被懒加载      | Initiator、HTML 引用位置、优先级      |
| HTML 下载快但主线程繁忙 | 脚本执行或 hydration 过重 | Performance 火焰图与长任务            |
| 返回上一页很快但数据旧  | bfcache 或应用状态恢复    | pageshow.persisted 与恢复后的权限校验 |

把一次性能调查固定为同一 URL、发布版本、设备档位和网络条件。
分别测量冷缓存、热缓存与历史恢复，避免用三个不同场景的数据计算一个平均值。
需要跟踪完整链路时，记录脱敏请求 ID，而不是把 Cookie 或包含隐私的完整查询串上传。

### 关联到用户体验

资源更早下载不一定更早显示：它还可能等样式、字体、主线程和渲染机会。
按钮变色很快也不代表业务处理完成，因此交互反馈和业务完成时间要分别监控。
把导航指标用于定位，把 Core Web Vitals 和真实用户反馈用于验收，二者不要互相替代。

### 常见误区

- **每次输入 URL 都重新 DNS、TCP、TLS**：缓存、连接复用和历史恢复会跳过阶段。
- **HTTPS 必然经过 TCP**：HTTP/3 使用 QUIC。
- **TTFB 就是后端执行时间**：它还包含网络与中间节点影响。
- **拿到完整 HTML 后才开始渲染**：HTML 解析与资源获取可以增量并行。
- **load 越早页面就越流畅**：加载后长任务仍会恶化 INP，动态内容也可能造成 CLS。

## 六、总结

一次导航是带分支、复用和并行的依赖图，而不是八个永远执行的步骤。
先确认走了哪条路径，再用时间线和服务端证据找瓶颈，最后用真实用户体验验证收益。

### 延伸阅读

- [MDN PerformanceNavigationTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming)：导航事件时间字段。
- [浏览器渲染流程](/knowledge/03-浏览器与网络/01-浏览器渲染流程)：DOM、样式、布局与合成。
- [浏览器缓存](/knowledge/03-浏览器与网络/06-浏览器缓存)：为什么网络步骤可能消失。
- [HTTP协议](/knowledge/03-浏览器与网络/03-HTTP协议)：不同版本的连接与流模型。
- [前端性能优化](/knowledge/03-浏览器与网络/10-前端性能优化)：从链路定位走到 CWV 验收。
