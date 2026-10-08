---
title: 'HTTP协议'
description: '从请求语义到 HTTP/1.1、HTTP/2、HTTP/3 与 QUIC，理解多路复用、队头阻塞、重试边界和协议排障。'
updatedAt: '2026-10-02'
module: '浏览器与网络'
order: 3
status: 'done'
---

# HTTP协议

## 一、是什么

HTTP 是应用层协议，规定客户端如何表达请求，以及服务器如何返回资源的表示、状态与元数据。
HTTP/1.1、HTTP/2、HTTP/3 共享方法、状态码、缓存等核心语义，区别主要在消息编码和传输机制。

不要把 HTTP 简化为“明文、短连接”：

- `http://` 与 `https://` 是 URL scheme，不是 HTTP 版本号。
- HTTPS 为 HTTP 提供安全传输；浏览器中的 HTTP/2 通常运行于 TLS 上。
- HTTP/3 使用集成 TLS 的 QUIC，不是“把明文 HTTP 放进 UDP”。
- HTTP 的“无状态”表示协议不要求请求间保存应用会话，不表示底层连接不能复用。

规范以 [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) 为语义基础，版本细节由各自 RFC 定义。

## 二、为什么

一次页面加载可能包含 HTML、脚本、字体、图片和接口请求。
这些请求能否并发、是否复用连接、失败后是否允许重试，会直接影响延迟和业务正确性。

| 工程问题               | 先判断什么                     | 不能直接下的结论         |
| ---------------------- | ------------------------------ | ------------------------ |
| 小资源排队             | 连接数、流并发限制、请求优先级 | 一定是服务器慢           |
| 弱网下多个请求同时停顿 | 丢包、重传、传输协议           | HTTP/2 没有多路复用      |
| POST 超时              | 服务端是否已提交事务           | 没收到响应就是没执行     |
| 开启 HTTP/3 后无变化   | 浏览器到边缘节点实际协商结果   | 配置开关等于所有连接升级 |

学习目标不是背版本表，而是把“语义问题”和“传输问题”分开定位。

## 三、核心原理

### 请求与响应的共同语义

下面是 HTTP/1.1 的文本表示，真实报文行尾使用 CRLF，头部与正文间有一个空行。
HTTP/2 和 HTTP/3 不会原样传输这段请求行，而是使用帧与伪首部。

```http
GET /articles?limit=10 HTTP/1.1
Host: example.com
Accept: application/json

```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 2
Cache-Control: no-cache

[]
```

方法表达意图，状态码表达处理结果，正文只是其中一部分。

| 方法或状态   | 核心含义                         | 工程边界                                   |
| ------------ | -------------------------------- | ------------------------------------------ |
| GET / HEAD   | 安全且幂等；HEAD 不返回正文      | 安全是语义约定，不保证错误实现没有副作用   |
| PUT / DELETE | 幂等，但不是安全方法             | 多次请求的响应码可以不同，预期最终效果相同 |
| POST / PATCH | 不默认保证幂等                   | 自动重试需要业务幂等机制                   |
| 204          | 成功且没有正文                   | 不应继续调用 JSON 解析                     |
| 304          | 条件 GET / HEAD 的表示未修改     | 使用已有缓存体，不是业务 JSON              |
| 307 / 308    | 临时或永久重定向，保留方法与正文 | 301 / 302 对 POST 存在改为 GET 的历史行为  |
| 429 / 503    | 限流或暂时不可用                 | 结合 Retry-After、重试预算和方法语义       |

### 三代协议解决的瓶颈

| 维度     | HTTP/1.1         | HTTP/2                      | HTTP/3                   |
| -------- | ---------------- | --------------------------- | ------------------------ |
| 常见传输 | TCP，可叠加 TLS  | TCP，浏览器通常叠加 TLS     | QUIC，运行于 UDP         |
| 消息编码 | 文本头部与消息体 | 二进制帧                    | 二进制帧                 |
| 并发单位 | 通常用多个连接   | 一个连接中的多个流          | 一个 QUIC 连接中的多个流 |
| 头部压缩 | 无专用机制       | HPACK                       | QPACK                    |
| 有序交付 | 单连接字节流     | 所有 HTTP 流共用 TCP 字节流 | 每个 QUIC 流独立有序交付 |

HTTP/1.1 默认支持持久连接，不需要每个请求重新握手。
流水线允许连续发送请求，但响应仍要按请求顺序返回，慢响应可能堵住后续响应；浏览器通常不用流水线，而是维护连接池。

HTTP/2 的 HEADERS、DATA 等帧带有流标识，可以交错发送。
因此慢接口不会仅因“排在同一连接前面”就阻塞所有其他响应。
但 TCP 只认识一个有序字节流，缺失字节之前的空洞仍会阻止后续字节交给 HTTP/2。

```text
HTTP/1.1 单连接响应顺序
请求 A ---> [慢响应 A................] ---> 响应 B
请求 B --------------------------------------^

HTTP/2 多流映射到一个 TCP 字节流
TCP: [A1][B1][丢失 A2][B2][C1]
                     ^ 缺口未补齐，后续字节暂不能上交

HTTP/3 多流映射到 QUIC
流 A: [A1][缺 A2][A3 等待]
流 B: [B1][B2] ----------> 可继续交付
流 C: [C1] --------------> 可继续交付
```

QUIC 自己实现可靠传输、丢包恢复、拥塞控制与流控制；UDP 只是承载层。
HTTP/3 消除的是由 TCP 全连接有序交付引起的跨流队头阻塞，不是所有等待。
同一流仍要等缺失数据，多个流共享连接级拥塞预算，QPACK 动态表依赖也可能造成等待。
这些区别可在 [RFC 9114 第 1 至 2 节](https://www.rfc-editor.org/rfc/rfc9114.html#section-1) 查证。

### 协商与部署不是端到端的单一开关

HTTPS 上通常通过 ALPN 协商 `h2` 或 `http/1.1`。
HTTP/3 可以由 Alt-Svc 等机制发现，再通过 QUIC 握手协商 `h3`。
首次访问、缓存的服务发现信息、网络对 UDP 的限制，都会影响实际选择。

```text
浏览器 -- h3/QUIC --> CDN -- h2/TCP+TLS --> 网关 -- h1.1 --> 应用
         用户可见链路        回源链路                内网链路
```

浏览器 Network 的 Protocol 列只能证明浏览器这一跳，不能证明源站也用了 HTTP/3。
若 UDP 不可达，客户端可能回退到基于 TCP 的版本；应保留可工作的回退路径。
不要在 HTTP/2、HTTP/3 响应里照搬 `Connection`、`Keep-Alive` 等连接专用首部。

## 四、代码实现

### 无网络依赖的请求语义实验

将下面代码保存为 `http-demo.mjs`，使用 Node.js 22 或更高版本执行 `node http-demo.mjs`。
只用内置 Request、Response 和断言模块，不需要安装依赖或启动服务。
它验证应用层语义，不模拟真实 HTTP/2 帧或 QUIC 丢包。

```js
import assert from 'node:assert/strict';

async function handle(request) {
  const url = new URL(request.url);
  if (url.pathname !== '/articles') {
    return new Response('Not Found', { status: 404 });
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }
  const body = JSON.stringify([{ id: 1, title: 'HTTP' }]);
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': String(new TextEncoder().encode(body).length),
      'Cache-Control': 'no-cache',
    },
  });
}

const get = await handle(new Request('https://demo.test/articles'));
assert.equal(get.status, 200);
assert.deepEqual(await get.json(), [{ id: 1, title: 'HTTP' }]);

const head = await handle(
  new Request('https://demo.test/articles', {
    method: 'HEAD',
  }),
);
assert.equal(await head.text(), '');
assert.equal(
  head.headers.get('content-length'),
  get.headers.get('content-length'),
);

const post = await handle(
  new Request('https://demo.test/articles', {
    method: 'POST',
  }),
);
assert.equal(post.status, 405);
assert.equal(post.headers.get('allow'), 'GET, HEAD');

const missing = await handle(new Request('https://demo.test/missing'));
assert.equal(missing.status, 404);
assert.equal(missing.ok, false);
console.log('HTTP semantics: 4 cases passed');
```

HEAD 的 Content-Length 描述对应 GET 表示的长度，不表示 HEAD 真的发送了那些字节。
真实 fetch 对 404、500 通常仍兑现为 Response；网络失败才会使 Promise 拒绝，因此业务代码必须检查状态。

## 五、工程实践

### 协议排障顺序

1. 在 Network 同时打开 Protocol、Connection ID、Timing，区分排队与传输耗时。
2. 固定同一设备、网络、缓存条件，分别记录冷连接与热连接，不混比。
3. 若多个 h2 请求一起停顿，对照网络丢包与 TCP 重传，不先调整 React 渲染。
4. 若 h3 连接失败，检查边缘节点 UDP 端口、负载均衡支持和回退耗时。
5. 若 CDN 到源站仍慢，检查回源连接池、并发流上限、源站响应时间。
6. 记录请求 ID 和各跳协议；不要用浏览器单跳观测替代服务端日志。

### 重试必须由业务语义兜底

超时可能发生在“事务提交成功，响应尚未到达”之间。
支付、创建订单等 POST 需要服务端持久化的幂等键，并校验同一键对应相同业务参数。
前端只做有限次数、带抖动的退避，不能因升级为 HTTP/3 就忽略重复提交。
GET 也要设置超时和重试预算，否则大规模故障时会形成重试风暴。

### 常见误区

- **HTTP/2 消灭了所有队头阻塞**：它解决应用层响应串行，TCP 层仍可能阻塞。
- **HTTP/3 必然更快**：收益依赖 RTT、丢包、CPU、连接复用与边缘部署。
- **域名分片永远有效**：为 h1 连接数设计的分片，可能损害 h2/h3 的连接复用。
- **请求少就一定好**：把所有代码打成巨包会拖慢首屏与缓存更新；应按关键路径切分。
- **安全方法等于安全系统**：GET 中藏删除逻辑，仍然是服务端实现错误。

## 六、总结

HTTP 语义决定“能做什么、能否重试”，传输机制决定“如何并发、在哪里等待”。
先用测量找到具体瓶颈，再讨论版本升级，而不是把协议名称当成性能结论。

### 延伸阅读

- [RFC 9113 HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html)：帧、多路复用和连接专用首部约束。
- [RFC 9114 HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)：QUIC 映射、发现和回退。
- [HTTPS原理](/knowledge/03-浏览器与网络/04-HTTPS原理)：TLS 1.3 与早期数据安全边界。
- [浏览器缓存](/knowledge/03-浏览器与网络/06-浏览器缓存)：复用表示与条件请求。
- [前端性能优化](/knowledge/03-浏览器与网络/10-前端性能优化)：用真实用户指标验证协议优化。
