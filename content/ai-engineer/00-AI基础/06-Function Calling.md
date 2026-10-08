---
title: '什么是Function Calling'
description: 'Function Calling（函数调用）是让 LLM 根据用户意图，输出「该调用哪个函数、传什么参数」的结构化 JSON，由开发者执行并把结果回传给模型的机制，是 LLM 连接真实世界、实现工具调用与 Agent 的基础。本文讲清它的本质、完整交互流程、如何用 JSON Schema 定义函数，以及与 Agent、MCP 的关系和常见误区。'
updatedAt: '2026-10-02'
module: 'AI基础'
order: 6
status: 'done'
---

# 什么是Function Calling

## 一、是什么

**一句话：Function Calling（函数调用，也叫 Tool Calling）是一种机制——让 LLM 根据用户意图，输出「应该调用哪个函数、传什么参数」的结构化数据（JSON），再由开发者去真正执行，并把结果回传给模型。**

关键澄清：**LLM 本身并不执行函数**，它只负责「决定要调什么、参数是什么」，真正的执行由你的代码完成。

```text
   用户："北京天气怎么样？"
        │
        ▼
   LLM 判断：需要调 get_weather 函数
        │  输出结构化 JSON（不是执行！）
        ▼
   { "name": "get_weather", "arguments": { "city": "北京" } }
        │
        ▼
   你的代码执行 get_weather("北京") → "晴，18℃"
        │  把结果回传给 LLM
        ▼
   LLM 生成自然语言回答："北京今天晴，气温 18℃，适合出行。"
```

## 二、为什么

- **让 LLM 连接真实世界**：模型本身只会生成文字，不能查天气、订机票、算数、读数据库。Function Calling 是它「伸手做事」的接口。
- **结构化输出**：让 LLM 稳定地产出符合 schema 的 JSON，而非自由文本——便于程序解析、对接系统。
- **Agent 的基石**：Agent 的「工具调用」能力，底层就是 Function Calling（见《什么是Agent》）。
- **突破模型局限**：实时数据、精确计算、私有系统操作，都能通过「调函数」补齐。

> 一句话：**Function Calling 是 LLM 从「会说话」到「能办事」的接口**——它把模型的「意图」翻译成程序可执行的「结构化调用」。

## 三、核心概念

### 1. 基本定义：模型输出「调用意图」

Function Calling 让模型在「回答」和「请求调用工具」之间做选择。当你把可用函数的**描述（schema）** 告诉模型，模型会在需要时返回一个结构化的调用请求。

### 2. 完整交互流程（四步）

```text
   ① 定义函数：用 JSON Schema 描述函数名、用途、参数
        │
   ② 发起请求：把「用户消息 + 可用函数列表」一起发给 LLM
        │
   ③ 模型决策：LLM 返回「要调用的函数名 + 参数 JSON」（或直接回答）
        │
   ④ 执行回传：你的代码执行函数 → 把结果作为新消息回传 → LLM 生成最终回答
        │
        └──▶（可循环：模型可能连续请求多次调用 → 这正是 Agent 的雏形）
```

### 3. 用 JSON Schema 定义函数

函数的「说明书」用 JSON Schema 描述，模型据此理解「这个函数干什么、要什么参数」：

```json
{
  "name": "get_weather",
  "description": "查询指定城市的当前天气",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "城市名称，如'北京'" },
      "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] }
    },
    "required": ["city"]
  }
}
```

**`description` 至关重要**——模型靠它判断「何时该调这个函数」，写不清就会误调或漏调。

### 4. 关键特征

```text
   特征一：模型只「决策」不「执行」—— 执行永远在你的代码里
   特征二：结构化输出 —— 返回符合 schema 的 JSON，可被程序解析
   特征三：可多函数、可并行 —— 一次可返回多个调用请求
   特征四：可循环 —— 执行结果回传后，模型可决定继续调用（→ Agent）
```

### 5. 与其他概念的关系

```text
   Function Calling（模型决定「调什么函数」的底层机制）
        │
        ├──是基石──▶ Agent（用 Function Calling 循环调用工具，自主完成多步任务）
        │
        └──被标准化──▶ MCP（把「如何提供工具」标准化，让工具可跨应用复用）
```

- **Function Calling vs Agent**：FC 是「单次工具调用的机制」，Agent 是「用 FC 做多步自主编排的系统」。
- **Function Calling vs MCP**：FC 解决「模型如何决定调用」，MCP 解决「工具如何被标准化地提供与发现」——二者互补，不是替代（见《什么是MCP》）。

## 四、直观示例

### 1. 完整的 Function Calling 流程（TypeScript）

```typescript
// ① 定义可用工具
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '查询指定城市的当前天气',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
  },
];

// ② 发送请求（带 tools）
const resp = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '北京天气怎么样？' }],
  tools,
});

// ③ 模型返回调用意图
const call = resp.choices[0].message.tool_calls?.[0];
if (call) {
  const args = JSON.parse(call.function.arguments); // { city: '北京' }

  // ④ 你的代码真正执行函数
  const result = await getWeather(args.city); // → '晴，18℃'

  // ⑤ 把结果回传，让模型生成自然语言回答
  const final = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: '北京天气怎么样？' },
      resp.choices[0].message, // 模型的调用请求
      { role: 'tool', tool_call_id: call.id, content: result },
    ],
  });
  console.log(final.choices[0].message.content); // "北京今天晴，18℃…"
}
```

### 2. TypeScript 在其中的价值

对前端工程师而言，Function Calling 是 **TS 能力直接迁移**的场景——用类型定义工具 schema，让参数类型安全（详见前端板块《类型体操》与本板块《什么是Agent》）：

```typescript
// 用 TS 类型约束工具参数，避免运行时错误
type WeatherArgs = { city: string; unit?: 'celsius' | 'fahrenheit' };
function getWeather(args: WeatherArgs): Promise<string> {
  /* … */
}
```

## 五、常见误区

- **误区一：以为 LLM 自己执行了函数。** LLM 只输出「调用意图（JSON）」，**执行永远在你的代码里**——这是安全与可控的关键。
- **误区二：函数 `description` 随便写。** 模型靠 description 决定「何时调、怎么调」；描述模糊会导致误调、漏调、传错参。
- **误区三：盲目相信模型返回的参数。** 模型可能生成不合法参数；执行前**必须校验**（用 zod 等做运行时校验，别只靠类型断言）。
- **误区四：以为每次都会调用函数。** 模型会判断——能直接答的就不调；不该调的硬塞工具反而干扰。
- **误区五：把 Function Calling 等同于 Agent。** FC 是「一次工具调用机制」，Agent 是「多步自主编排」；FC 是 Agent 的零件，不是全部。

## 六、总结

- **Function Calling 让 LLM 输出「调哪个函数、传什么参数」的结构化 JSON**，由开发者执行并回传结果，模型再生成最终回答。
- **模型只决策、不执行**——这是安全边界，也是必须校验参数的原因。
- 流程四步：**定义 schema → 发请求 → 模型决策 → 执行回传**，可循环，循环起来就是 Agent。
- 它是 **LLM 连接真实世界、Agent 工具调用**的基石；与 MCP 互补（FC 管「怎么调」，MCP 管「怎么标准化提供工具」）。
- `description` 写得好不好，直接决定调用准确率；TypeScript 的类型能力在此可直接迁移。

> 进阶阅读：工具调用的深入机制见 `AI Engineer / 04-Agent架构 / 工具调用机制`；Function Calling 与 Agent 的结合见 `04-Agent架构 / Agent概述与范式`；工具的标准化协议见本模块《什么是MCP》与 `05-MCP协议`。

> Function Calling 的巧妙，在于它用一个极简的分工解决了「让语言模型操作真实世界」的难题：**模型负责「想清楚要做什么」，代码负责「安全地去做」。** 这道「决策」与「执行」的边界，既是能力的接口，也是安全的护栏。理解了它，你就理解了从 ChatGPT 到能干活的 Agent 之间，最关键的那一步是怎么迈出的。
