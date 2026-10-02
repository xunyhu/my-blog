---
title: '什么是AI Workflow'
description: 'AI Workflow（AI 工作流）是把多个 LLM 调用、工具、判断步骤按预先编排好的固定流程组合起来，以稳定、可复现地完成复杂任务的范式，与「运行时自主决策」的 Agent 相对。本文讲清 Workflow 的本质、与 Agent 的关键区别、四种基础编排模式（链式/路由/并行/编排器-工作者），以及何时该用 Workflow、何时该用 Agent 的选型判断。'
updatedAt: '2026-10-02'
module: 'AI基础'
order: 8
status: 'done'
---

# 什么是AI Workflow

## 一、是什么

**一句话：AI Workflow（AI 工作流）是把多个 LLM 调用、工具、判断步骤，按照「预先编排好的固定路径」组合起来，以稳定、可复现地完成复杂任务的范式。**

它与 Agent 最大的区别在于「谁决定流程」：**Workflow 的路径是你事先写死的（确定性），Agent 的路径是模型运行时自主决定的（自主性）。**

```text
   Workflow（编排好的固定流程）：
   输入 ─▶ 步骤A ─▶ 步骤B ─▶ 步骤C ─▶ 输出    ← 每一步、每一分支都由开发者预先定义

   Agent（自主决策流程）：
   目标 ─▶ 模型自己决定下一步 ─▶ 调工具 ─▶ 看结果 ─▶ 再决定…  ← 路径不确定，运行时生成
```

一个类比：**Workflow 像「按菜谱做菜」（步骤固定），Agent 像「给厨师一个目标让他自由发挥」（路径自主）。**

## 二、为什么

单次 LLM 调用难以完成复杂任务，而 Workflow 用「编排」把它拆解、串联，换来三大好处：

- **可复现、可预测**：固定流程意味着相同输入走相同路径，结果稳定，便于测试与调试。
- **质量可控**：把复杂任务拆成「每步只做一件事」的简单 prompt，每步质量都更高（分而治之）。
- **成本与延迟可优化**：可并行、可缓存、可在简单分支用便宜模型。

> 一句话：**不是所有 AI 任务都需要「自主智能」；大量场景下，一个编排良好的 Workflow 比 Agent 更稳、更省、更可控。**

## 三、核心概念

### 1. 基本定义：预编排的确定性流程

Workflow 由开发者用代码/配置**显式定义**每一步与分支条件，LLM 只负责每个节点内的具体任务，**不决定整体流程走向**（或仅在预设的有限分支里选择）。

### 2. 四种基础编排模式

业界（如 Anthropic《Building Effective Agents》）总结的核心 Workflow 模式：

```text
   ① 链式（Prompt Chaining）：前一步输出作为后一步输入，串行分解
      写大纲 ─▶ 写正文 ─▶ 校对润色
      适用：可清晰拆成有序子步骤的任务

   ② 路由（Routing）：先分类，再分发到不同的专门处理分支
      输入 ─▶ [分类器] ─┬─▶ 客服问题 → 客服 prompt
                        ├─▶ 技术问题 → 技术 prompt
                        └─▶ 闲聊     → 通用 prompt
      适用：输入类型多样、需差异化处理

   ③ 并行（Parallelization）：多个子任务同时跑，再聚合
      ┌─▶ 子任务A ─┐
      输入 ─▶ 子任务B ─┼─▶ 聚合结果   （分片 / 投票）
      └─▶ 子任务C ─┘
      适用：可拆分独立子任务，或多次采样提升可靠性

   ④ 编排器-工作者（Orchestrator-Workers）：一个主 LLM 动态拆任务、分派给子 LLM
      [编排器 LLM] ─分派─▶ [工作者1] [工作者2] [工作者3] ─汇总─▶ 结果
      适用：子任务数量/内容不固定，需动态拆解（介于 Workflow 与 Agent 之间）
```

### 3. 关键特征

```text
   特征一：确定性 —— 流程路径预先定义，相同输入走相同路径
   特征二：可复现 —— 便于测试、调试、审计
   特征三：分而治之 —— 每步用简单专注的 prompt，整体质量更高
   特征四：LLM 是「节点」而非「指挥官」—— 模型执行步骤，不掌控全局流程
```

### 4. 与其他概念的关系（Workflow vs Agent）

这是本篇的核心辨析：

| 维度       | AI Workflow                    | Agent                            |
| ---------- | ------------------------------ | -------------------------------- |
| 流程决定者 | **开发者预先编排**             | **模型运行时自主决定**           |
| 确定性     | 高（可复现、可预测）           | 低（路径不定）                   |
| 灵活性     | 低（只走预设路径）             | 高（可临场应变）                 |
| 可控/可测  | 强                             | 弱（需额外护栏与追踪）           |
| 适用场景   | 流程固定、步骤明确的任务       | 开放式、需自主探索的任务         |
| 成本       | 通常更低、更可预测             | 可能多轮调用、成本不确定         |

```text
   选型光谱（从确定到自主）：
   单次调用 ──▶ 链式 Workflow ──▶ 路由/并行 ──▶ 编排器-工作者 ──▶ 自主 Agent
   越靠左：越可控、越可复现、越省     越靠右：越灵活、越自主、越难控
```

- **Workflow vs LLM**：单次 LLM 调用是「一个节点」，Workflow 是「多个节点 + 编排」。
- **Workflow vs Agent**：见上表；核心是「预设路径」vs「自主路径」。
- **Workflow 里也能用 Function Calling / RAG**：它们常作为 Workflow 的某个节点（如「检索节点」「工具节点」）。

## 四、直观示例

### 1. 链式 Workflow（内容生成流水线）

```typescript
// 把「写一篇技术博客」拆成有序步骤，每步专注一件事
async function writeBlog(topic: string): Promise<string> {
  const outline = await llm(`为「${topic}」列一份技术博客大纲`);        // 步骤1：大纲
  const draft = await llm(`根据大纲写正文：\n${outline}`);              // 步骤2：正文
  const polished = await llm(`校对并润色以下内容，修正术语：\n${draft}`); // 步骤3：润色
  return polished;
}
// 流程固定：outline → draft → polished，可复现、每步质量可控
```

### 2. 路由 Workflow（意图分发）

```typescript
async function route(userInput: string): Promise<string> {
  const intent = await classify(userInput); // 先分类：'billing' | 'tech' | 'other'
  switch (intent) {                          // 按意图路由到不同 prompt（分支预设）
    case 'billing': return await llm(BILLING_PROMPT + userInput);
    case 'tech':    return await llm(TECH_PROMPT + userInput);
    default:        return await llm(GENERAL_PROMPT + userInput);
  }
}
```

### 3. 一个真实感的组合 Workflow

```text
   用户提交一份合同 PDF，要求「提取关键条款并评估风险」：
     [解析节点] PDF → 文本
        │
     [路由节点] 判断合同类型（劳动/采购/租赁…）
        │
     [并行节点] 同时提取「金额条款」「期限条款」「违约条款」
        │
     [链式节点] 汇总条款 → 调用 LLM 评估风险 → 生成报告
   —— 全程路径预设，稳定可复现，比让 Agent 自由发挥更可靠
```

## 五、常见误区

- **误区一：Workflow 和 Agent 是一回事。** 核心区别在「谁决定流程」：Workflow 预设路径、Agent 自主路径；可控性与灵活性截然不同。
- **误区二：Agent 一定比 Workflow 先进/更好。** 对流程明确的任务，Workflow 更稳、更省、更可测。**「能用 Workflow 解决就别上 Agent」** 是务实原则。
- **误区三：Workflow 里不能有 LLM 决策。** 路由型 Workflow 也含「LLM 分类判断」，但那是**预设的有限分支**，不是 Agent 式的开放自主。
- **误区四：把 Workflow 做得过度复杂。** 节点越多越难维护、越易累积误差；应从最简单的链式起步，按需增加编排。
- **误区五：忽视每步的质量校验。** Workflow 的每步输出应可校验（格式、非空、合规），否则错误会沿链路放大。

## 六、总结

- **AI Workflow 是把多个 LLM/工具/判断步骤按「预设固定路径」编排起来的范式**，追求确定性、可复现与质量可控。
- 四种基础模式：**链式、路由、并行、编排器-工作者**，覆盖大多数「分而治之」的任务。
- **Workflow vs Agent** 是关键选型：预设路径 vs 自主路径；流程明确选 Workflow，开放探索选 Agent。
- 选型光谱从「单次调用 → Workflow → Agent」，越自主越灵活也越难控——**够用就好，别过度追求自主**。
- Function Calling、RAG 等常作为 Workflow 的节点存在。

> 进阶阅读：Workflow 的自动化编排见 `AI Engineer / 07-产品与架构 / AI工作流自动化`；Workflow 与 Agent 的架构取舍见 `04-Agent架构 / Agent概述与范式`、`05-规划与任务分解`；产品级落地见 `07-产品与架构 / AI产品设计模式`。

> Workflow 与 Agent 之争，本质是软件工程中「确定性」与「自主性」的永恒权衡在 AI 时代的重演。Workflow 提醒我们一个朴素却常被忽略的道理：**最可靠的系统，往往是把复杂问题拆成简单、可控、可复现步骤的系统**。当业界都在追逐「全自主 Agent」时，懂得在恰当的地方用一条编排良好的 Workflow，才是 AI 工程师真正的成熟——**不是所有问题都值得交给一个会自由发挥的智能体。**
