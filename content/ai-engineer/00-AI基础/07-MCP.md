---
title: '什么是MCP'
description: 'MCP（Model Context Protocol，模型上下文协议）是 Anthropic 提出的开放协议，用标准化的 Client-Server 架构统一 LLM 应用与外部工具、数据源的连接方式，把「每个工具单独集成」的 M×N 难题降为 M+N。本文讲清 MCP 的本质、为什么需要它、Client-Server 架构与三大能力（Tools/Resources/Prompts），以及与 Function Calling 的区别和常见误区。'
updatedAt: '2026-10-02'
module: 'AI基础'
order: 7
status: 'done'
---

# 什么是MCP

## 一、是什么

**一句话：MCP（Model Context Protocol，模型上下文协议）是一个开放标准协议，用来统一「LLM 应用」与「外部工具、数据源」之间的连接方式——就像 USB-C 之于电子设备，让任何工具都能以同一种接口被任何 AI 应用即插即用。**

它由 Anthropic 于 2024 年底提出并开源，目标是解决「每接一个工具都要写一套定制集成」的碎片化问题。

```text
   没有 MCP：每个 AI 应用 × 每个工具 都要单独对接（M×N 的重复劳动）
   有了 MCP：应用只需实现 MCP Client，工具只需实现 MCP Server（M+N）

   ┌─────────┐                    ┌──────────────┐
   │ AI 应用  │◀──── MCP 协议 ────▶│ 工具/数据源   │
   │ (Client) │    统一的接口       │  (Server)    │
   └─────────┘                    └──────────────┘
```

## 二、为什么

- **消除 M×N 集成地狱**：过去 M 个应用接 N 个工具要写 M×N 套适配；有了统一协议，只需 M+N（各自实现一次协议）。
- **工具可复用、可共享**：一个 MCP Server（如「GitHub Server」）写好后，任何支持 MCP 的应用（Claude Desktop、IDE 等）都能直接用。
- **生态繁荣**：标准化催生大量开箱即用的 Server（文件系统、数据库、Slack、浏览器……）。
- **关注点分离**：AI 应用专注「对话与编排」，工具提供方专注「能力实现」，通过协议解耦。

> 一句话：**MCP 之于 AI 工具，正如 USB-C 之于外设、LSP 之于编辑器——用一个标准接口，终结碎片化的重复集成。**

## 三、核心概念

### 1. 基本定义：Client-Server 架构

```text
   ┌──────────────────────┐         ┌──────────────────────┐
   │   Host（AI 应用）      │         │   MCP Server          │
   │  如 Claude Desktop    │         │  如「文件系统 Server」  │
   │  ┌────────────────┐   │  JSON-  │  ┌────────────────┐   │
   │  │  MCP Client     │◀─┼──RPC───▶│  │ 工具/资源/提示   │   │
   │  └────────────────┘   │  传输    │  └────────────────┘   │
   └──────────────────────┘         └──────────┬───────────┘
        一个 Host 可连多个 Client                 │
        每个 Client 连一个 Server          ┌──────┴──────┐
                                          ▼             ▼
                                       数据库         第三方 API
```

- **Host**：AI 应用本体（如 Claude Desktop、支持 MCP 的 IDE）。
- **Client**：Host 内部与某个 Server 通信的连接器（1:1）。
- **Server**：对外提供能力（工具、数据、提示）的独立进程/服务。

### 2. Server 提供的三大能力

```text
   ① Tools（工具）    可被模型调用执行的操作，如「查询数据库」「发送消息」
                      —— 对应 Function Calling 的「函数」
   ② Resources（资源） 可供读取的数据/上下文，如「文件内容」「数据库记录」
                      —— 类似给模型的「只读资料」
   ③ Prompts（提示）   预定义的提示模板/工作流，供用户或应用复用
```

### 3. 关键特征

```text
   特征一：标准化协议 —— 基于 JSON-RPC，统一消息格式
   特征二：语言无关 —— Server 可用任意语言实现（Python/TS/Go…）
   特征三：本地/远程皆可 —— Server 可在本地进程，也可远程部署
   特征四：能力可发现 —— Client 能动态查询 Server「你提供哪些工具/资源」
```

### 4. 与其他概念的关系（重点：MCP vs Function Calling）

这是最容易混淆的一对概念：

| 维度     | Function Calling                 | MCP                              |
| -------- | -------------------------------- | -------------------------------- |
| 解决什么 | 模型**如何决定**调用哪个函数     | 工具**如何被标准化提供**给应用   |
| 层级     | 模型能力（单次调用机制）         | 连接协议（工具生态标准）         |
| 关系     | MCP 的 Tools 底层**仍靠 FC 触发**| 为 FC 提供「标准化的工具来源」   |

```text
   一句话区分：
   Function Calling = 模型「点菜」的能力（决定要调什么）
   MCP              = 餐厅「标准化菜单 + 上菜通道」（统一提供工具）
   —— MCP 不取代 Function Calling，而是给它的「工具」定了一套标准接口
```

- **MCP vs Agent**：Agent 用 MCP 作为「标准化接入工具」的方式，MCP 让 Agent 的工具生态即插即用。

## 四、直观示例

### 1. 一个最小 MCP Server（概念示意，TypeScript）

```typescript
// 用 MCP SDK 定义一个提供「加法工具」的 Server
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer({ name: 'calculator', version: '1.0.0' });

// 注册一个 Tool：模型可发现并调用它
server.tool(
  'add',
  { a: z.number(), b: z.number() },        // 参数 schema
  async ({ a, b }) => ({                    // 执行逻辑
    content: [{ type: 'text', text: String(a + b) }],
  })
);

// 启动后，任何 MCP Client（如 Claude Desktop）都能发现并调用 add 工具
```

### 2. 使用体验：即插即用

```text
   用户在 Claude Desktop 里配置了「文件系统 MCP Server」
        │
        ▼
   对话："帮我总结 ~/notes 下的会议纪要"
        │
        ▼
   Claude 自动发现该 Server 提供的 read_file 工具 → 读取 → 总结
   —— 用户没写任何集成代码，Server 一接就能用
```

## 五、常见误区

- **误区一：MCP 是 Function Calling 的替代品。** 不是。FC 是「模型如何决定调用」，MCP 是「工具如何标准化提供」；MCP 的 Tools 底层依然靠 FC 触发，二者互补。
- **误区二：任何场景都需要 MCP。** 只对接一两个私有工具、且不复用时，直接写 Function Calling 更简单；MCP 的价值在「标准化、可复用、生态共享」。
- **误区三：MCP Server 天然安全。** Server 能执行操作、访问数据，接入第三方 Server 需审查其权限与来源——**给 AI 装「手」的同时也装上了风险**。
- **误区四：MCP 只能本地用。** Server 既可本地进程，也可远程部署（HTTP/SSE 传输），适配不同场景。
- **误区五：把 MCP 理解成一个「模型」或「框架」。** 它是一个**协议（标准）**，不绑定特定模型或框架——这正是它「通用」的根源。

## 六、总结

- **MCP 是统一「LLM 应用 ↔ 外部工具/数据」连接的开放协议**，把集成的 M×N 难题降为 M+N，堪称「AI 工具的 USB-C」。
- 架构是 **Host（应用）+ Client（连接器）+ Server（能力提供方）**；Server 提供 **Tools / Resources / Prompts** 三大能力。
- **MCP ≠ Function Calling**：FC 管「模型如何决定调用」，MCP 管「工具如何标准化提供」，互补而非替代。
- 它让工具**可复用、可发现、即插即用**，是 Agent 工具生态的重要基础设施。
- 安全需重视：接入第三方 Server 等于给 AI 装上「手」，要审查权限与来源。

> 进阶阅读：MCP 的协议细节与设计原则见 `AI Engineer / 05-MCP协议 / MCP协议概述`、`MCP架构与设计原则`；动手开发见 `05-MCP协议 / MCP Server开发`、`MCP工具定义`；传输层见 `05-MCP协议 / MCP传输层`；生态与实践见 `05-MCP协议 / MCP生态与最佳实践`。

> MCP 的意义，不在于它有多复杂的技术，而在于它做了「标准化」这件朴素却强大的事。历史上，USB、HTTP、LSP 每一个通用协议的普及，都换来了一次生态的爆发——MCP 正试图为「AI 与工具的连接」扮演同样的角色。当工具可以像插件一样被任意 AI 应用即插即用，AI Agent 的生态，才真正具备了规模化的可能。
