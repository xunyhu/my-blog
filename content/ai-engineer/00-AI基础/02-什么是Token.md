---
title: '什么是Token'
description: 'Token 是大语言模型处理文本的最小单位——它既不是「字」也不是「词」，而是介于两者之间的「子词」。本文用一句话讲清 Token 的本质，解释为什么它决定了 LLM 的成本、上下文窗口与性能，拆解中英文分词差异与计数规则，并通过分词示例与常见误区帮你建立对 Token 的准确直觉。'
updatedAt: '2026-10-02'
module: 'AI基础'
order: 2
status: 'done'
---

# 什么是Token

## 一、是什么

**一句话：Token 是大语言模型（LLM）处理文本的「最小单位」——它既不是一个「字」，也不是一个「词」，而是介于两者之间的「子词（subword）」片段。**

模型不认识「文字」，只认识 Token。任何输入输出，都要先被**分词器（Tokenizer）**切成一串 Token，再转成数字喂给模型。

```text
   你输入：  "ChatGPT 很强"
                │  Tokenizer 切分
                ▼
   Token 序列： ["Chat", "G", "PT", " 很", "强"]
                │  每个 Token 映射为一个数字 ID
                ▼
   模型看到：  [9906, 38, 3984, 1084, 2523]  ← 模型真正的输入
```

理解 Token，是理解 LLM **成本、上下文限制、性能**的第一把钥匙。

## 二、为什么

作为 AI 工程师，你几乎在每个环节都会撞上 Token：

- **计费按 Token 算**：OpenAI 等 API 按「输入 Token + 输出 Token」收费，不懂 Token 就无法估算成本。
- **上下文窗口按 Token 限**：所谓「128K 上下文」，指的是 **128K 个 Token**，不是字符数；超限就会被截断或报错。
- **性能与 Token 数正相关**：Token 越多，推理越慢、延迟越高。
- **流式输出以 Token 为粒度**：LLM「逐字」吐出的其实是「逐 Token」（详见前端板块《SSE 与流式响应》）。

> 一句话：**Token 是 LLM 世界的「字节」**——你度量文本、算成本、控上下文、优化性能，全都以它为单位。

## 三、核心概念

### 1. 基本定义：子词单元（Subword）

现代 LLM 普遍采用 **BPE（Byte Pair Encoding）** 等子词分词算法：把文本切成「常见词保持完整、罕见词拆成片段」的子词单元。

```text
   常见词 → 一个 Token：      "the" → [the]
   罕见/长词 → 拆成多个：      "tokenization" → [token, ization]
   专有名 → 拆得更碎：         "ChatGPT" → [Chat, G, PT]
```

这样做的好处：既能覆盖海量词汇（包括没见过的词），又能保持词表规模可控。

### 2. 关键特征

```text
   特征一：Token ≠ 字符，也 ≠ 单词
           "unbelievable" 可能是 1~3 个 Token，取决于分词器
   特征二：空格、标点、换行也算 Token
           "a, b." 里的逗号、句号、空格都占 Token
   特征三：中文比英文「更费 Token」
           英文 1 Token ≈ 4 字符 ≈ 0.75 词
           中文 1 个汉字常 ≈ 1~2 个 Token（同样语义，中文 Token 更多）
   特征四：不同模型的分词器不同
           同一段文本在 GPT / Claude / Llama 下 Token 数可能不一样
```

**经验换算**（以 GPT 系列英文为例）：

| 单位            | 约等于                 |
| --------------- | ---------------------- |
| 1 Token         | ≈ 4 个英文字符         |
| 1 Token         | ≈ 0.75 个英文单词      |
| 100 Token       | ≈ 75 个英文单词        |
| 1 个汉字        | ≈ 1~2 个 Token（偏多） |

### 3. 与其他概念的关系

```text
   Token ──是──▶ LLM 的输入输出单位（模型「读」「写」的都是 Token）
     │
     ├──决定──▶ 上下文窗口（多少 Token 能被一次处理）
     ├──决定──▶ API 成本（按 Token 计费）
     └──被处理于──▶ Embedding（Token 序列 → 向量，见《什么是Embedding》）
```

- **Token vs Embedding**：Token 是「离散的文字片段」，Embedding 是「Token 序列映射成的连续向量」——先有 Token，才有 Embedding。
- **Token vs 上下文窗口**：上下文窗口是「模型一次能容纳的最大 Token 数」，是 Token 的「容量上限」。

## 四、直观示例

### 1. 分词演示

```python
# 以 tiktoken（OpenAI 分词器）为例
import tiktoken
enc = tiktoken.encoding_for_model("gpt-4o")

tokens = enc.encode("Hello, world!")
print(tokens)                 # [13225, 11, 2375, 0] —— 4 个 Token
print(enc.decode(tokens))     # "Hello, world!"（可无损还原）

print(len(enc.encode("你好，世界")))  # 中文：Token 数明显多于等义英文
```

### 2. 前端估算 Token（无依赖的粗略法）

```typescript
// 粗略估算：英文按 ~4 字符/Token，中文按 ~1.5 字符/Token
function estimateTokens(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const other = text.length - cjk;
  return Math.ceil(cjk / 1.5 + other / 4);
}
// 精确计数请用对应模型的分词器（如 tiktoken / js-tiktoken）
```

### 3. 成本与截断的直觉

```text
   一次对话 = 系统提示 + 历史消息 + 本轮输入 + 模型输出
   ┌───────────────────────────────────────────┐
   │  ↑ 全部累计算 Token，超过「上下文窗口」就截断 │
   └───────────────────────────────────────────┘
   → 历史越长，越贵、越慢、越容易「忘记」开头（被挤出窗口）
```

### 4. 实用：如何节省 Token

Token 直接等于成本与延迟，工程中常用的压缩手段：

```text
① 精简系统提示：去掉冗余客套，用结构化短句
② 裁剪对话历史：只保留最近 N 轮 + 摘要，而非全量拼接
③ 压缩上下文：RAG 检索时只注入「相关片段」，而非整篇文档
④ 控制输出：用 max_tokens 限制长度，要求「简洁作答」
⑤ 慎用长格式：Markdown 表格/大量缩进会额外吃 Token
```

> 记住：**省 Token 不只是省钱，也是提性能、降延迟、防截断**——它是 AI 应用工程化的基本功（详见 `AI Engineer / 06-工程化实践 / 成本控制与Token优化`）。

## 五、常见误区

- **误区一：1 个 Token = 1 个单词。** 错。常见词可能是 1 个 Token，长词/专有名会被拆成多个；中文更是常「一字多 Token」。
- **误区二：中文和英文 Token 消耗一样。** 同样语义，**中文通常消耗更多 Token**，做中文应用时成本估算要特别注意。
- **误区三：空格、标点不占 Token。** 它们同样被计入，格式化文本（大量换行/缩进）会额外吃 Token。
- **误区四：Token 数只影响成本，不影响效果。** Token 还决定「能否放进上下文窗口」——超限会截断，导致模型「看不到」关键信息。
- **误区五：所有模型 Token 计数通用。** 不同模型分词器不同，跨模型迁移时 Token 数与成本都要重新测算。

## 六、总结

- **Token 是 LLM 处理文本的最小单位（子词）**，模型不认字符/单词，只认 Token。
- 它决定了 **成本（按 Token 计费）、上下文窗口（Token 容量）、性能（Token 越多越慢）、流式粒度（逐 Token 输出）**。
- **中文比英文更费 Token**；空格标点也计数；不同模型分词器不同——这些是成本与截断估算的关键。
- Token 是 Embedding、上下文管理等后续概念的度量基础。

> 进阶阅读：想深入分词算法（BPE/WordPiece）、Tokenizer 实现与优化，见 `AI Engineer / 02-LLM基础 / Token与Tokenizer`；想了解 Token 如何变成向量，见本模块《什么是Embedding》。

> Token 是 AI 工程师最该建立的「第一个直觉」：当你开始用「这段 prompt 大概多少 Token、会不会超窗口、这一次调用花多少钱」来思考时，你就从「调 API 的人」变成了「懂 LLM 的人」——因为**在大模型的世界里，Token 就是一切的度量衡**。
