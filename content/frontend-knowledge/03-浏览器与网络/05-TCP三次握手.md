---
title: 'TCP三次握手'
description: '从序列号解释 TCP 建连、四次挥手与 TIME_WAIT，结合字节流拆包示例和连接状态排障，理解可靠传输的边界。'
updatedAt: '2026-10-02'
module: '浏览器与网络'
order: 5
status: 'done'
---

# TCP三次握手

## 一、是什么

TCP 向应用提供可靠、有序、双向的字节流。
三次握手建立连接状态并同步双方初始序列号，关闭连接则需要分别结束两个方向的数据流。

HTTP/1.1 和 HTTP/2 常使用 TCP；HTTP/3 使用 QUIC，因此不是所有网页请求都会经历 TCP 三次握手。
同一 TCP 连接也可承载多次请求，不应为每个 HTTP 请求都画一次建连流程。

本文依据 [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html)，区分传输层确认与应用层成功。

## 二、为什么

前端看到的“网络错误”可能发生在不同层：

- SYN 没得到回复，连接还没建立。
- TCP 已连上，但 TLS 或 HTTP 处理失败。
- 数据已被对方 TCP 确认，却还没被业务处理。
- 业务处理成功，但响应在断网前没回到客户端。

如果把以上情况都理解为“请求没成功发送”，自动重试就可能重复下单。
理解连接状态也能帮助定位短连接风暴、连接池泄漏和代理空闲超时。

## 三、核心原理

### 三次握手同步什么

设客户端初始序列号为 x，服务端为 y。
ACK 字段表示“下一步期待的序列号”，不是“最后收到的序列号”。
SYN 和 FIN 各占一个序列号；没有负载的纯 ACK 不消耗序列号。

```text
客户端                                            服务端
CLOSED                                            LISTEN
  | -- SYN seq=x --------------------------------> |
SYN-SENT                                      SYN-RECEIVED
  | <---------------- SYN+ACK seq=y ack=x+1 ------- |
  | -- ACK seq=x+1 ack=y+1 -----------------------> |
ESTABLISHED                                   ESTABLISHED
```

服务端的 SYN+ACK 确认客户端的初始序列号，也提出自己的初始序列号。
第三个 ACK 让服务端确认客户端收到自己的同步信息。
它还与序列号检查共同限制旧连接报文对新连接的干扰，而不只是口语化的“双方都能收发”。

第三个 ACK 可以携带应用数据。
如果第三个 ACK 丢失，服务端可能重传 SYN+ACK；后续合法报文也可能推动状态完成，不能理解为“丢一次就永久断开”。

### 可靠并不意味着有消息边界

TCP 根据序列号重排、确认与重传数据，并进行流量控制和拥塞控制。
应用的两次 write 可能被一次 read 收到，一次 write 也可能被多次 read 拆开。
这些是字节流语义，不是 TCP 把业务消息“传错了”。

```text
应用写入:  [消息 A 长度][消息 A][消息 B 长度][消息 B]
网络交付:  [前 2 字节] [中间 7 字节] [剩余字节]
应用解码:  累积字节 -> 读长度 -> 等待完整帧 -> 输出消息
```

因此应用协议需要定长、分隔符或长度前缀等边界机制。
HTTP 自己定义消息边界与帧；使用 fetch 的前端不需要手写 TCP 解码器，但处理自定义流协议时必须理解这个原则。

### 四次挥手与半关闭

以下是客户端主动关闭、服务端稍后关闭的典型路径，假设待发送数据已经处理完毕。

```text
客户端                                            服务端
ESTABLISHED                                   ESTABLISHED
  | -- FIN seq=u --------------------------------> |
FIN-WAIT-1                                      CLOSE-WAIT
  | <------------------------ ACK ack=u+1 -------- |
FIN-WAIT-2                                        |
  | <----------- 剩余响应数据仍可发送 -------------- |
  | <---------------- FIN seq=v, ACK ------------- |
TIME-WAIT                                        LAST-ACK
  | -- ACK ack=v+1 ------------------------------> |
  |                                              CLOSED
  | 等待 2 * MSL
CLOSED
```

收到 FIN 只表示“对方不再发送新字节”，并不表示本端不能继续发送。
对方内核可以先 ACK，但本端应用还需要完成工作并主动关闭，所以 ACK 与 FIN 经常分开发出。
如果正好没有剩余工作，ACK 和 FIN 可以合并；“四次挥手”不是强制四个独立数据包。
同时关闭还会产生其他状态路径，甚至两端都进入 TIME_WAIT。

### TIME_WAIT 为什么不能直接删掉

典型主动关闭方发送最后一个 ACK 后进入 TIME_WAIT，规范等待为 2 倍最大报文生存时间 MSL。
主要目的有两个：

1. 对方若没收到最后 ACK、重传 FIN，本端仍能再次确认。
2. 给旧连接的迟到报文消散时间，降低同一连接标识被复用后的混淆风险。

MSL 与操作系统实现有关，不要把网上某个“固定 60 秒”当作所有平台的协议常量。
TIME_WAIT 通常由内核维护，不代表业务还持有一个未释放的 JavaScript 对象。

CLOSE_WAIT 则表示已经收到对方 FIN，本端应用尚未关闭发送方向。
大量且持续不降的 CLOSE_WAIT，更值得怀疑异常分支没有释放连接。
RST 是异常中止信号，不是正常 FIN 关闭的廉价替代品，不能用它掩盖资源管理问题。

## 四、代码实现

### 可运行的长度前缀解码实验

保存为 `tcp-framing.cjs`，执行 `node tcp-framing.cjs`，仅需 Node.js 22+。
示例在内存里模拟任意分片，不监听端口，也不声称复现内核握手。
每帧使用 4 字节大端无符号长度，长度表示 UTF-8 正文的字节数。

```js
const assert = require('node:assert/strict');

function encode(text) {
  const body = Buffer.from(text, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length);
  return Buffer.concat([header, body]);
}

function createDecoder(maxBytes = 1024) {
  let pending = Buffer.alloc(0);
  return {
    push(chunk) {
      pending = Buffer.concat([pending, chunk]);
      const messages = [];
      while (pending.length >= 4) {
        const length = pending.readUInt32BE(0);
        if (length > maxBytes) throw new Error('Frame too large');
        if (pending.length < 4 + length) break;
        const body = pending.subarray(4, 4 + length);
        messages.push(body.toString('utf8'));
        pending = pending.subarray(4 + length);
      }
      return messages;
    },
    end() {
      if (pending.length !== 0) throw new Error('Truncated frame');
    },
  };
}

const expected = ['你好', '', 'TCP has no message boundary'];
const wire = Buffer.concat(expected.map(encode));

// 遍历所有单次切分位置，包括切在中文 UTF-8 字节中间。
for (let split = 0; split <= wire.length; split++) {
  const decoder = createDecoder();
  const actual = [
    ...decoder.push(wire.subarray(0, split)),
    ...decoder.push(wire.subarray(split)),
  ];
  decoder.end();
  assert.deepEqual(actual, expected);
}

const byteDecoder = createDecoder();
const output = [];
for (const byte of wire) {
  output.push(...byteDecoder.push(Buffer.from([byte])));
}
byteDecoder.end();
assert.deepEqual(output, expected);

const truncated = createDecoder();
truncated.push(wire.subarray(0, 5));
assert.throws(() => truncated.end(), /Truncated/);
const tooLarge = Buffer.alloc(4);
tooLarge.writeUInt32BE(1025);
assert.throws(() => createDecoder().push(tooLarge), /too large/);
console.log('All split positions, byte chunks and invalid frames: passed');
```

这里等完整帧到齐后再解码字符串，避免半个 UTF-8 字符被提前替换。
生产解码器还应限制连接总缓冲、单次输入大小和等待时长；高吞吐场景可用分段缓冲避免反复 Buffer.concat 拷贝。
异常后应终止该解码会话，不继续信任已经失去边界的后续输入。

## 五、工程实践

### 从状态与时间判断问题

| 观测                   | 可能原因                         | 下一步证据                         |
| ---------------------- | -------------------------------- | ---------------------------------- |
| SYN-SENT 持续积压      | 目标不可达、防火墙丢弃、端口不通 | 目标地址、路由、双端抓包           |
| SYN-RECEIVED 偏多      | 回程丢包、握手负载过高           | SYN 重传率、监听队列、来源分布     |
| ESTABLISHED 多但无流量 | 空闲连接池或半失效链路           | 池上限、空闲时长、代理超时         |
| CLOSE_WAIT 长期增加    | 本端应用没有关闭                 | 异常路径、响应体消费与连接释放     |
| TIME_WAIT 高           | 主动短连接关闭频繁               | 新建连接速率、端口使用、连接复用率 |

在 Linux 可用以下只读命令查看状态；macOS 的参数不同，不要直接套用。
这些命令观察操作系统连接，不会建立测试服务。

```bash
ss -tan state time-wait
ss -tan state close-wait
ss -s
```

看到 TIME_WAIT 高，先判断是否真的发生端口耗尽、建连错误或延迟升高。
正常高吞吐系统出现大量 TIME_WAIT 并不自动构成事故。
优先复用连接、统一上下游空闲超时、限制重试，再评估内核参数，避免照抄“快速回收”配置。

### 应用超时与传输超时分开设计

TCP keepalive 检查长时间空闲连接，通常不能替代秒级业务超时。
HTTP 请求超时、代理 idle timeout、应用心跳分别解决不同问题，需要明确责任层。
在流式响应中，即使连接还活着，业务也可能已经停止产出，必须另设无进展超时。

### 常见误区

- **ACK 证明订单已落库**：它只确认传输层字节，不确认事务提交。
- **主动关闭方永远是浏览器**：服务器、代理也可能先关闭，应按实际 FIN 方向判断。
- **四次挥手一定抓到四个包**：ACK 可合并，数据与控制标志也可共存。
- **TIME_WAIT 和 CLOSE_WAIT 都是内存泄漏**：前者通常是协议保护状态，后者才常与应用未关闭有关。
- **TCP 保证永不丢数据**：持续故障会使连接报错或超时，可靠不代表永远成功。

## 六、总结

三次握手同步双方连接状态，正常关闭分别结束两个方向，TIME_WAIT 则保护关闭后的边界。
对应用而言，TCP 最重要的契约是“可靠有序字节流”，而不是“每次发送对应一次接收”。

### 延伸阅读

- [RFC 9293 第 3.5 与 3.6 节](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5)：建连、关闭与状态转换。
- [HTTP协议](/knowledge/03-浏览器与网络/03-HTTP协议)：连接复用与多路复用。
- [HTTPS原理](/knowledge/03-浏览器与网络/04-HTTPS原理)：TCP 建立后为什么还要 TLS 握手。
- [WebSocket](/knowledge/03-浏览器与网络/09-WebSocket)：长连接的心跳与应用生命周期。
