# AI Engineer 模块 PRD

## 模块定位

「AI Engineer」是博客的第三大内容板块，聚焦 **AI 工程化实践**，面向有前端/后端基础、希望系统掌握 AI 应用开发的工程师。

**核心理念**: 不研究模型本身，聚焦于 **如何用 AI 构建产品**。

**入口**: 首页卡片 → `/ai-engineer`
**关键词**: LLM · Agent · RAG · MCP

---

## 知识体系设计

### 整体结构

```
AI Engineer 知识体系（58 篇）
│
│  ── 基础篇（入门） ──
├── 00-AI基础 ──────────────── 8 个核心概念入门：LLM/Token/Embedding/Agent/RAG/Function Calling/MCP/AI Workflow
│
│  ── 进阶篇（深入） ──
├── 01-AI工程认知 ──────────── AI 发展脉络、工程师角色定位、技术全景
├── 02-LLM基础 ─────────────── 大语言模型原理、Prompt Engineering、API 调用
├── 03-RAG体系 ─────────────── 检索增强生成：Embedding、向量数据库、检索策略
├── 04-Agent架构 ───────────── AI Agent：规划、工具调用、记忆、多Agent协作
├── 05-MCP协议 ─────────────── Model Context Protocol：协议设计、Server开发、生态
├── 06-工程化实践 ───────────── AI应用工程化：评测、可观测性、部署、安全
└── 07-产品与架构 ───────────── AI产品设计模式、典型架构、行业案例
```

> **分层设计**：`00-AI基础` 为入门篇，以「什么是 X」的形式快速建立概念认知；`01-07` 为进阶篇，深入原理与工程实践。基础篇与进阶篇中部分主题有概念递进关系（如「什么是LLM」→「大语言模型原理」）。

### 文章清单

| 模块              | 篇数 | 文章                                                                                                                                            |
| ----------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **00-AI基础**     | 8    | 什么是LLM、什么是Token、什么是Embedding、什么是Agent、什么是RAG、Function Calling、MCP、AI Workflow                                             |
| **01-AI工程认知** | 3    | AI发展简史、AI工程师能力模型、AI应用技术全景                                                                                                    |
| **02-LLM基础**    | 8    | 大语言模型原理、Transformer架构概要、Token与Tokenizer、Prompt Engineering基础、高级Prompt技巧、Function Calling、流式输出与SSE、LLM API设计模式 |
| **03-RAG体系**    | 8    | RAG概述与架构、文本Embedding原理、向量数据库选型、文档切分策略、检索策略与重排序、混合检索、RAG评估指标、高级RAG架构                            |
| **04-Agent架构**  | 8    | Agent概述与范式、ReAct推理框架、工具调用机制、Agent记忆系统、规划与任务分解、多Agent协作、Agent开发框架、Agent调试与优化                        |
| **05-MCP协议**    | 7    | MCP协议概述、MCP架构与设计原则、MCP Server开发、MCP工具定义、MCP资源与提示、MCP传输层、MCP生态与最佳实践                                        |
| **06-工程化实践** | 8    | AI应用评测体系、Prompt版本管理、LLM可观测性、成本控制与Token优化、AI应用安全、Guardrails护栏机制、AI应用部署方案、AI应用的CI/CD                 |
| **07-产品与架构** | 8    | AI产品设计模式、AI Chatbot架构、AI代码助手架构、AI知识库架构、AI工作流自动化、多模态应用架构、AI应用性能优化、AI工程前沿趋势                    |

---

## 路由设计

```
/ai-engineer                    → 知识图谱首页（模块卡片网格）
/ai-engineer/[...slug]          → 知识点详情页
```

与 `/knowledge` 模块采用相同架构模式：首页分类卡片网格 + 详情页 Markdown 渲染 + TOC 侧栏。

### Next.js App Router 结构

```
app/
  ai-engineer/
    page.tsx                    → /ai-engineer（首页）
    [...slug]/
      page.tsx                  → /ai-engineer/02-LLM基础/01-大语言模型原理
```

---

## 数据流设计

复用已有的数据获取和渲染管线：

| 文件                                 | 改动                                                            |
| ------------------------------------ | --------------------------------------------------------------- |
| `lib/post/getContent.ts`             | `ContentType` 新增 `'ai-engineer'`，`baseMap` 新增映射          |
| `lib/blog.ts`                        | 新增 `getAIEngineerMap()` 或扩展 `getKnowledgeMap()` 支持多目录 |
| `app/ai-engineer/page.tsx`           | 新建，类似 knowledge 首页                                       |
| `app/ai-engineer/[...slug]/page.tsx` | 新建，复用 `ContentLayout` + `MarkdownRenderer`                 |

---

## 内容目录

```
content/ai-engineer/
├── 00-AI基础/
│   ├── 01-什么是LLM.md
│   ├── 02-什么是Token.md
│   ├── 03-什么是Embedding.md
│   ├── 04-什么是Agent.md
│   ├── 05-什么是RAG.md
│   ├── 06-Function Calling.md
│   ├── 07-MCP.md
│   └── 08-AI Workflow.md
│
├── 01-AI工程认知/
│   ├── 01-AI发展简史.md
│   ├── 02-AI工程师能力模型.md
│   └── 03-AI应用技术全景.md
│
├── 02-LLM基础/
│   ├── 01-大语言模型原理.md
│   ├── 02-Transformer架构概要.md
│   ├── 03-Token与Tokenizer.md
│   ├── 04-Prompt Engineering基础.md
│   ├── 05-高级Prompt技巧.md
│   ├── 06-Function Calling.md
│   ├── 07-流式输出与SSE.md
│   └── 08-LLM API设计模式.md
│
├── 03-RAG体系/
│   ├── 01-RAG概述与架构.md
│   ├── 02-文本Embedding原理.md
│   ├── 03-向量数据库选型.md
│   ├── 04-文档切分策略.md
│   ├── 05-检索策略与重排序.md
│   ├── 06-混合检索.md
│   ├── 07-RAG评估指标.md
│   └── 08-高级RAG架构.md
│
├── 04-Agent架构/
│   ├── 01-Agent概述与范式.md
│   ├── 02-ReAct推理框架.md
│   ├── 03-工具调用机制.md
│   ├── 04-Agent记忆系统.md
│   ├── 05-规划与任务分解.md
│   ├── 06-多Agent协作.md
│   ├── 07-Agent开发框架.md
│   └── 08-Agent调试与优化.md
│
├── 05-MCP协议/
│   ├── 01-MCP协议概述.md
│   ├── 02-MCP架构与设计原则.md
│   ├── 03-MCP Server开发.md
│   ├── 04-MCP工具定义.md
│   ├── 05-MCP资源与提示.md
│   ├── 06-MCP传输层.md
│   └── 07-MCP生态与最佳实践.md
│
├── 06-工程化实践/
│   ├── 01-AI应用评测体系.md
│   ├── 02-Prompt版本管理.md
│   ├── 03-LLM可观测性.md
│   ├── 04-成本控制与Token优化.md
│   ├── 05-AI应用安全.md
│   ├── 06-Guardrails护栏机制.md
│   ├── 07-AI应用部署方案.md
│   └── 08-AI应用的CI-CD.md
│
└── 07-产品与架构/
    ├── 01-AI产品设计模式.md
    ├── 02-AI Chatbot架构.md
    ├── 03-AI代码助手架构.md
    ├── 04-AI知识库架构.md
    ├── 05-AI工作流自动化.md
    ├── 06-多模态应用架构.md
    ├── 07-AI应用性能优化.md
    └── 08-AI工程前沿趋势.md
```

---

## 文章内容规范

### 基础篇模板（00-AI基础）

```markdown
# 什么是 X

## 一、是什么 → 一句话说清本质

## 二、为什么 → 为什么需要了解它

## 三、核心概念 → 定义、特征、与其他概念的关系

## 四、直观示例 → 简单代码/图示

## 五、常见误区 → 容易搞混的点

## 六、总结 → 要点回顾 + 进阶阅读指引
```

### 进阶篇模板（01-07 模块）

```markdown
# 知识点标题

## 一、是什么 → 概念定义

## 二、为什么 → 解决什么问题

## 三、核心原理 → 基本概念、工作流程、关键细节

## 四、代码实现 → TypeScript / Python 示例

## 五、工程实践 → 生产环境经验与注意事项

## 六、总结 → 要点回顾，关联其他知识点
```

---

## 实施计划

| 阶段 | 任务                                        | 状态      |
| ---- | ------------------------------------------- | --------- |
| P0   | 创建 content/ai-engineer/ 目录与骨架文章    | ✅ 已完成 |
| P0   | 扩展 `getContent()` 支持 `ai-engineer` 类型 | ✅ 已完成 |
| P1   | 创建 `/ai-engineer` 首页路由与页面          | ✅ 已完成 |
| P1   | 创建 `/ai-engineer/[...slug]` 详情页路由    | ✅ 已完成 |
| P2   | 逐步填充文章内容                            | 🚧 进行中（00-AI基础 8/8 已完成） |
| P2   | 首页增加 AI Engineer 最新文章展示           | 待开发    |
