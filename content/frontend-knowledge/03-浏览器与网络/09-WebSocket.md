---
title: 'WebSocket'
description: '理解 WebSocket 升级、消息与连接生命周期，对比 SSE，并用完整本地回显示例实现心跳、退避重连、背压限制和页面清理。'
updatedAt: '2026-10-02'
module: '浏览器与网络'
order: 9
status: 'done'
---

# WebSocket

## 一、是什么

WebSocket 提供持久的双向消息通道，建立后客户端与服务端都可以主动发送消息。
浏览器原生 WebSocket API 支持文本与二进制消息，但不自动提供业务重试、消息持久化和断线续传。

不要再把对比写成“HTTP 短连接，WebSocket 长连接”。
HTTP/1.1 可以持久连接，HTTP/2、HTTP/3 支持多路复用；SSE 也可以保持一个长时间打开的 HTTP 响应。
真正要比较的是消息方向、协议能力、恢复语义与部署成本。

## 二、为什么

| 方案            | 通信模式               | 恢复与限制                        | 适用场景                     |
| --------------- | ---------------------- | --------------------------------- | ---------------------------- |
| HTTP 轮询       | 客户端周期请求         | 需控制间隔和并发                  | 低频状态刷新                 |
| EventSource SSE | 服务端持续推送文本事件 | 自动重连，GET，不能任意设置请求头 | 通知、进度、事件订阅         |
| fetch 流式响应  | 可 POST 后持续读取响应 | 手动解析、取消和恢复              | 提交 Prompt 后流式生成       |
| WebSocket       | 双向消息               | 心跳、重连、业务确认自行设计      | 协同编辑、游戏、双向实时会话 |

聊天并不必然要求 WebSocket：低频上行可以普通 POST，下行可以 SSE。
只有确实需要持续双向低延迟通信时，维护 WebSocket 生命周期的成本才更容易合理化。
SSE 格式与流式解析详见 [SSE与流式响应](/knowledge/03-浏览器与网络/11-SSE与流式响应)，本文不重复展开。

## 三、核心原理

### 握手与消息帧

传统 WebSocket 在 HTTP/1.1 上通过 Upgrade 握手切换协议。
下面只展示关键首部；Sec-WebSocket-Accept 是服务器按规范从请求键计算得到的值。

```text
浏览器                              服务端
  | -- GET /ws HTTP/1.1 ------------> |
  |    Connection: Upgrade            |
  |    Upgrade: websocket             |
  |    Sec-WebSocket-Key: 随机值       |
  |    Sec-WebSocket-Version: 13       |
  |    Origin: 页面来源                |
  | <--- 101 Switching Protocols ---- |
  |      Sec-WebSocket-Accept: 校验值  |
  | <========= 双向消息帧 ===========> |
  | <========= Close 握手 ===========> |
```

101 属于 HTTP/1.1 升级路径，不应说所有 WebSocket 都必须返回 101。
HTTP/2 的扩展 CONNECT、HTTP/3 上的相应机制见 [RFC 8441](https://www.rfc-editor.org/rfc/rfc8441.html) 与 [RFC 9220](https://www.rfc-editor.org/rfc/rfc9220.html)，实际使用取决于客户端和基础设施支持。

协议帧包含 opcode、长度等信息；一个消息可以拆成多个帧，浏览器在 message 事件交付重组后的消息。
客户端到服务器的 masking 是协议要求，不是加密；生产安全传输仍使用 wss。
协议 Ping/Pong 由浏览器网络层处理，页面 JavaScript 没有直接发送原生 Ping 控制帧的 API。
应用发送字符串 ping、接收 pong，是另外约定的业务级心跳。

### 连接恢复不等于消息恢复

```text
CONNECTING -- open --> OPEN -- close --> CLOSED
    |                    |                 |
    +-- 超时或失败 ------+                 +-- 策略允许 -> 退避 -> CONNECTING
                         |
                         +-- 页面离开或主动停止 -> 清理，不自动重连
```

浏览器只保证一条正常连接内消息的顺序；断线期间的消息不会凭空补齐。
重连后应重新认证、订阅，并携带最后确认的消息序号，服务端决定补发还是发送完整快照。
写入操作需要业务 ID、确认和去重，不能盲目重发所有未确认消息。

### 安全与资源边界

浏览器 WebSocket 握手不是普通 fetch CORS 流程，不会靠 OPTIONS 和 Allow-Origin 来完成同样的访问控制。
Cookie 可能随握手发送，因此服务器必须校验 Origin，并独立完成认证、授权和会话失效处理。
Origin 可以由非浏览器客户端伪造，所以白名单也不能替代身份认证。

浏览器构造函数不能任意设置 Authorization 请求头。
避免把长期令牌放在 URL 查询串进入日志；认证方案应按部署环境设计短期凭据或受保护会话。
经典 WebSocket API 没有自动接收背压；发送侧需检查 bufferedAmount，接收侧要限速、批处理或使用业务窗口。

## 四、代码实现

### 依赖与运行方式

这是独立本地实验，不需要修改博客项目依赖。
在独立实验目录准备 Node.js 22+，执行 `npm init -y` 和 `npm install ws@8`，使用该主版本可用的最新修补版本并检查安全公告。
保存下面两个文件为 `server.cjs`、`client.html`，执行 `node server.cjs`，打开 `http://127.0.0.1:8082`。
依赖是服务端的 [ws](https://github.com/websockets/ws)，浏览器使用原生 WebSocket，不需要打包。

服务端文件完整如下，只绑定回环地址，不应直接当公网服务部署。

```js
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');

const html = fs.readFileSync(path.join(__dirname, 'client.html'));
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(html);
});
const wss = new WebSocketServer({
  noServer: true,
  maxPayload: 4096,
  perMessageDeflate: false,
});

server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/ws' || req.headers.origin !== 'http://127.0.0.1:8082') {
    socket.end(
      'HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n',
    );
    return;
  }
  // 真实服务在这里验证会话；本地实验只有公开回显。
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws));
});

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  ws.on('error', (error) => console.error(error.message));
  ws.on('message', (data, isBinary) => {
    if (isBinary) return ws.close(1003, 'Text only');
    if (ws.bufferedAmount > 65536) return ws.close(1008, 'Slow consumer');
    const text = data.toString();
    ws.send(text === 'ping' ? 'pong' : `echo: ${text}`);
  });
});

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.isAlive = false;
      ws.ping();
    }
  }
}, 15000);
wss.on('close', () => clearInterval(heartbeat));
server.listen(8082, '127.0.0.1');
process.on('SIGINT', () => {
  clearInterval(heartbeat);
  for (const ws of wss.clients) ws.close(1001, 'Server stopping');
  server.close();
  wss.close();
  setTimeout(() => {
    for (const ws of wss.clients) ws.terminate();
  }, 2000).unref();
});
```

### 浏览器端生命周期

下面是完整 client.html；重试次数有限，连接稳定后才重置退避计数，避免频繁闪断时无限高频重连。
旧连接回调不能覆盖新连接状态，主动停止与页面离开也不会触发自动重连。

```html
<!doctype html>
<html lang="zh-CN">
  <meta charset="utf-8" />
  <title>WebSocket lifecycle lab</title>
  <button id="start">连接</button>
  <button id="send">发送 hello</button>
  <button id="stop">主动停止</button>
  <pre id="log"></pre>
  <script>
    let socket = null;
    let retry = 0;
    let attempts = 0;
    let active = true;
    let manualStop = false;
    let cleanupConnection = () => {};
    const output = document.getElementById('log');
    const log = (message) => {
      output.textContent = (output.textContent + message + '\n').slice(-4000);
    };

    function pause() {
      clearTimeout(retry);
      retry = 0;
      cleanupConnection();
      const old = socket;
      socket = null;
      if (old) old.close(1000, 'Paused');
    }

    function connect() {
      if (
        !active ||
        manualStop ||
        navigator.onLine === false ||
        socket ||
        retry
      )
        return;
      const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${scheme}//${location.host}/ws`);
      socket = ws;
      let heartbeat = 0;
      let stable = 0;
      let lastPong = Date.now();
      const deadline = setTimeout(
        () => ws.close(4000, 'Connect timeout'),
        10000,
      );
      const cleanup = () => {
        clearTimeout(deadline);
        clearTimeout(stable);
        clearInterval(heartbeat);
      };
      cleanupConnection = cleanup;
      ws.onopen = () => {
        if (socket !== ws) return;
        clearTimeout(deadline);
        log('open');
        stable = setTimeout(() => {
          attempts = 0;
        }, 30000);
        heartbeat = setInterval(() => {
          if (Date.now() - lastPong > 25000)
            return ws.close(4001, 'Heartbeat timeout');
          if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 65536)
            ws.send('ping');
        }, 10000);
      };
      ws.onmessage = (event) => {
        if (socket !== ws) return;
        if (event.data === 'pong') lastPong = Date.now();
        else log(String(event.data));
      };
      ws.onerror = () => log('error; waiting for close');
      ws.onclose = (event) => {
        cleanup();
        if (socket !== ws) return;
        socket = null;
        log(`close ${event.code}, clean=${event.wasClean}`);
        if (!active || manualStop) return;
        if ([1000, 1008].includes(event.code) || attempts >= 8) {
          manualStop = true;
          log('stopped; click connect to retry explicitly');
          return;
        }
        const cap = Math.min(30000, 500 * 2 ** attempts++);
        const delay = cap / 2 + (Math.random() * cap) / 2;
        retry = setTimeout(() => {
          retry = 0;
          connect();
        }, delay);
      };
    }

    document.getElementById('send').onclick = () => {
      if (!socket || socket.readyState !== WebSocket.OPEN)
        return log('not open');
      if (socket.bufferedAmount > 65536) return log('send buffer full');
      socket.send('hello');
    };
    document.getElementById('stop').onclick = () => {
      manualStop = true;
      pause();
    };
    document.getElementById('start').onclick = () => {
      manualStop = false;
      attempts = 0;
      connect();
    };
    window.addEventListener('pagehide', () => {
      active = false;
      pause();
    });
    window.addEventListener('pageshow', () => {
      active = true;
      connect();
    });
    window.addEventListener('offline', pause);
    window.addEventListener('online', connect);
    connect();
  </script>
</html>
```

navigator.onLine 只是浏览器提供的联网提示，不保证目标服务器可达。
后台页面的计时器可能被节流，设备休眠后也可能触发心跳超时；生产系统需为恢复场景设置容错。
示例的发送缓冲阈值不是完整背压方案，真实高频数据还需要服务端限速和接收队列上限。

## 五、工程实践

### 复现实验与预期证据

1. 打开页面，Network 的 WS 面板可见升级成功与持续心跳。
2. 点击发送，收到 echo: hello，说明上下行都通，不只是握手成功。
3. 停止服务端，客户端进入有限退避；重启后观察能否重新连接。
4. 点击主动停止，观察不再产生新连接或心跳；显式点击连接才能恢复。
5. 导航离开再返回，检查页面恢复后只有一条连接，旧定时器没有继续工作。
6. 若要测半开连接，使用受控网络阻断而不是只停止进程，因为后者往往会明确通知断开。

本例不持久化业务消息，因此只验证连接生命周期，不承诺断线消息不丢。
真正的恢复测试还需要制造“服务端已处理、客户端没收到确认”的窗口，验证去重与续传。

### 线上故障检查表

| 现象           | 优先检查                                                    |
| -------------- | ----------------------------------------------------------- |
| 握手 403       | Origin、会话验证、路由与代理转发                            |
| 固定间隔断开   | 代理 idle timeout、心跳间隔与部署时限                       |
| 1006 异常关闭  | 网络中断、进程退出、代理强制终止；1006 不是对端发来的关闭帧 |
| 重连后重复消息 | 业务 ID、订阅恢复、服务端补发与客户端去重                   |
| 页面越来越卡   | 多连接泄漏、日志无限增长、消息处理与渲染队列                |

确认部署平台支持持久连接，不能默认所有短生命周期函数环境都适合 WebSocket 服务。
观测连接数、建连成功率、关闭码、重连次数、最后业务序号和缓冲大小，日志不要记录长期令牌。

### 常见误区

- **WebSocket 会自动重连**：浏览器 API 不提供该保证，示例中的策略由应用实现。
- **重连等于自动补消息**：必须有服务端历史、游标和去重协议。
- **心跳只是定时发送字符串**：还要验证响应、设超时，并在关闭时清理定时器。
- **允许所有 Origin 就能解决跨域**：可能形成跨站 WebSocket 劫持风险。
- **只清理 socket 就够了**：重试定时器、订阅、心跳和旧回调也要清理。

## 六、总结

WebSocket 的难点不是 new WebSocket，而是断开、恢复、授权与资源控制。
先判断业务是否真的需要双向消息，再为连接恢复和消息恢复分别定义协议。

### 延伸阅读

- [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html)：握手、帧、掩码和关闭语义。
- [MDN WebSocket 客户端实践](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)：pagehide、pageshow 与 bfcache。
- [ws 官方仓库](https://github.com/websockets/ws)：安装、升级处理与 Ping/Pong 心跳。
- [SSE与流式响应](/knowledge/03-浏览器与网络/11-SSE与流式响应)：单向推送与 fetch 流式方案。
- [跨域问题](/knowledge/03-浏览器与网络/07-跨域问题)：对比 CORS 与 Origin 检查的责任边界。
