---
title: 'SSE与流式响应'
description: 'SSE（Server-Sent Events）是基于 HTTP 的服务器单向推送技术，配合流式响应成为 LLM 时代「打字机输出」的底层通道。本文讲清 SSE 协议格式、EventSource 与 fetch + ReadableStream 两种客户端方案、与 WebSocket/轮询的对比、AbortController 中断控制，以及在 Next.js 中实现流式接口的服务端写法，并与 AI Engineer 板块的流式输出篇互为支撑。'
updatedAt: '2026-10-02'
module: '浏览器与网络'
order: 11
status: 'done'
---

# SSE与流式响应

## 一、是什么

**SSE（Server-Sent Events，服务器发送事件）是一种基于 HTTP 的「服务器 → 客户端」单向实时推送技术。** 客户端发起一次请求后，服务器保持连接**持续、分块地推送数据**，而不是等全部处理完再一次性返回。

```text
   普通 HTTP 请求：      请求 ──────────▶ [等待…全部算完] ──────────▶ 一次性完整响应
   SSE / 流式响应：      请求 ──▶ 数据块1 ──▶ 数据块2 ──▶ 数据块3 ──▶ …（边生成边推送）
                              └──── 连接保持，服务器持续推 ────┘
```

它是 Web **实时通信三件套**之一，与 HTTP 轮询、WebSocket 并列。而在 LLM 时代，SSE 因「大模型逐 token 生成」的天然需求重新变得重要——ChatGPT 式「打字机效果」的底层，正是 SSE / 流式响应。

## 二、为什么

- **首字节更快（TTFB）**：不必等全部结果，第一批数据立即到达，感知延迟大幅降低。
- **契合 LLM 生成模式**：大模型本就逐 token 产出，流式推送让「生成」与「展示」并行，体验远优于「转圈等待」。
- **比 WebSocket 轻量**：SSE 复用普通 HTTP，无需协议升级、无需自建心跳/重连（浏览器 `EventSource` 自带断线重连）。
- **实时三件套的分工**：

```text
   HTTP 轮询：客户端定时问「有新数据吗」——实现简单，但有延迟、空请求浪费
   WebSocket ：全双工，双向实时——适合聊天/协作/游戏，但需独立协议、服务端更重
   SSE       ：单向（服务器→客户端）流式——适合通知、进度、LLM 输出，轻量且自动重连
```

> 本文是前端侧的**技术底座**；其在 AI 应用中的落地（Prompt → 流式接口 → 打字机 UI），见 `AI Engineer / 02-LLM基础 / 流式输出与SSE`，两篇互为支撑。

## 三、核心原理

### 1. SSE 协议格式

SSE 的响应 `Content-Type` 为 **`text/event-stream`**，数据是按行组织的纯文本：

```text
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: 这是第一条消息

        ← data: 前缀，空行(

)表示一条事件结束

event: token\n                   ← 可选：自定义事件名
data: {"delta":"你好"}\n\n

id: 42\n                         ← 可选：事件 ID（断线重连时通过 Last-Event-ID 续传）
data: 带 ID 的消息\n\n

retry: 3000\n                    ← 可选：重连间隔（毫秒）
```

```text
   字段速记：
   data:  消息体（必需，可多行）
   event: 事件类型（默认 "message"）
   id:    事件 ID（用于重连续传）
   retry: 重连等待时间
   —— 每条事件以「空行」分隔（\n\n）
```

### 2. 客户端方案一：EventSource（原生 SSE API）

浏览器内置 `EventSource`，专门消费 SSE，**自带断线自动重连**：

```js
const es = new EventSource('/api/stream');

es.onmessage = (e) => {          // 接收默认 message 事件
  console.log(e.data);
};
es.addEventListener('token', (e) => {  // 接收自定义 event: token
  render(JSON.parse(e.data).delta);
});
es.onerror = () => { /* 浏览器会自动重连，一般无需手动处理 */ };

// 主动关闭
es.close();
```

**局限**：`EventSource` **只支持 GET 请求，不能自定义请求头/请求体**——而 LLM 场景常需 POST 提交 prompt，此时要用方案二。

### 3. 客户端方案二：fetch + ReadableStream（现代主流）

用 `fetch` 拿到响应体的 `ReadableStream`，手动读取流——**支持 POST、自定义 header，是 LLM 应用的主流做法**：

```js
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});

const reader = res.body.getReader();     // 拿到流读取器
const decoder = new TextDecoder('utf-8');

while (true) {
  const { done, value } = await reader.read(); // 逐块读取
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  appendToUI(chunk);                     // 边收边渲染 → 打字机效果
}
```

```text
   fetch → res.body (ReadableStream)
        → getReader() 读取器
        → 循环 read()：每次拿到 { done, value }
        → TextDecoder 把字节流解码为字符串
        → 增量渲染到 UI
   这条链路就是「流式响应」在前端的标准消费方式
```

### 4. 中断控制：AbortController

流式请求可随时被用户「停止生成」，靠 `AbortController`：

```js
const controller = new AbortController();

fetch('/api/chat', { method: 'POST', body, signal: controller.signal })
  .then(/* …读流… */)
  .catch((err) => {
    if (err.name === 'AbortError') console.log('用户主动中断');
  });

// 用户点「停止」按钮
stopBtn.onclick = () => controller.abort();
```

## 四、实践：在 Next.js 中实现流式接口

本项目是 Next.js App Router，服务端流式接口用 **Route Handler 返回一个 `ReadableStream`**：

```ts
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { prompt } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      // 模拟逐块推送（实际可对接 LLM SDK 的流式返回）
      for (const word of generateAnswer(prompt)) {
        controller.enqueue(new TextEncoder().encode(`data: ${word}\n\n`));
        await sleep(50);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

对接真实 LLM 时，多数 SDK 直接返回可读流，可**管道透传**：

```ts
// 直接把上游 LLM 的流转给前端（pipe）
const llmStream = await openai.chat.completions.create({ stream: true, /* … */ });
return new Response(llmStream.toReadable(), {
  headers: { 'Content-Type': 'text/event-stream' },
});
```

**要点**：
- 响应头必须设 `Content-Type: text/event-stream`；
- 关掉缓冲（`Cache-Control: no-cache`），确保数据即时下发；
- 部署时注意反向代理（如 Nginx）需关闭对该路由的响应缓冲，否则流会被「攒着」一次性吐出。

## 五、常见误区

- **误区一：SSE 能双向通信。** SSE 是**单向**（服务器 → 客户端）；需要客户端频繁上行（如聊天输入）应选 WebSocket。
- **误区二：用 `EventSource` 发 POST。** `EventSource` 只支持 GET，不能带 body/header；POST 场景必须用 `fetch` + `ReadableStream`。
- **误区三：忘了 `\n\n` 分隔事件。** SSE 每条事件以空行结束，漏写会导致客户端一直等待、数据粘连。
- **误区四：以为流式就一定快。** 若服务端/代理做了响应缓冲，流会退化成一坨；需确保全链路（框架 + 代理）都不缓冲。
- **误区五：不做中断处理。** LLM 长输出若不能「停止」，既浪费 token 又体验差；务必接 `AbortController`。
- **误区六：忽略重连与去重。** `EventSource` 会自动重连，服务端应支持 `Last-Event-ID` 续传或做好幂等，避免重复推送。

## 六、总结

- **SSE** 是基于 HTTP（`text/event-stream`）的服务器单向推送，与轮询、WebSocket 构成 Web 实时通信三件套；LLM「打字机输出」的底层即 SSE/流式响应。
- 客户端两种方案：**`EventSource`**（原生、自动重连，但只支持 GET）与 **`fetch` + `ReadableStream`**（支持 POST/header，LLM 场景主流）。
- **`AbortController`** 提供「停止生成」的中断能力。
- 服务端（Next.js Route Handler）返回 `ReadableStream` + 正确的响应头，对接 LLM 时可管道透传；注意关闭全链路缓冲。
- 选型：单向推送/流式输出用 **SSE**，双向实时用 **WebSocket**，简单低频可用**轮询**。

> SSE 的「翻红」是一个耐人寻味的信号：一项诞生于 2000 年代的老技术，因大模型「逐 token 生成」的特性而重新成为 AI 应用的标配通道。它提醒我们——**前端的核心竞争力从来不是追逐最新框架，而是理解 HTTP、流、事件这些底层机制**；当 AI 浪潮来临，正是这些「旧知识」成了连接前端与 AI Engineer 两座大陆的桥梁。读懂 SSE，你就握住了从前端迈向 AI 应用的第一把钥匙。
