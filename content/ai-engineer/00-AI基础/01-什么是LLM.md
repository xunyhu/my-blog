# 什么是 LLM

## 一、是什么

**LLM（Large Language Model，大语言模型）本质上是一个经过海量文本数据训练、能够根据上下文预测并生成下一个 Token 的模型。**

简单来说：

> **LLM 可以理解为一个非常强大的“语言概率模型”，它通过学习大量文本中的规律，预测在当前上下文之后最可能出现什么内容。**

例如我们输入：

```text
今天天气很好，我准备去
```

LLM 会根据它学习到的语言规律，预测后面可能出现：

```text
公园
```

或者：

```text
上班
```

或者：

```text
散步
```

随着模型规模、训练数据和训练方法不断提升，这种“预测下一个 Token”的能力逐渐表现出了**理解、推理、总结、翻译、代码生成等复杂能力**。

因此，从工程角度来看，可以把 LLM 理解成：

```text
用户输入
   ↓
上下文
   ↓
LLM
   ↓
预测下一个 Token
   ↓
不断生成 Token
   ↓
最终输出文本 / 代码 / 结构化数据
```

---

## 二、为什么

理解 LLM 是 AI 工程化的基础。

如果只知道“ChatGPT 是一个 AI”，在实际开发中很容易把很多概念混在一起。

例如：

- 为什么 LLM 能写代码？
- 为什么 LLM 会产生幻觉？
- 为什么给它一段文档，它就能帮我总结？
- 为什么需要 RAG？
- 为什么 LLM 不能直接访问我的数据库？
- 为什么需要 Agent？
- MCP 到底解决了什么问题？
- 为什么同一个模型换一个 Prompt，效果会差很多？

这些问题最终都可以追溯到对 **LLM 本身能力边界**的理解。

理解 LLM，可以帮助我们：

- 建立 AI 工程化的基础认知
- 理解 Prompt、Token、Context Window 等核心概念
- 理解 RAG、Agent、MCP 等上层技术
- 判断一个需求应该使用 LLM，还是普通程序逻辑
- 在实际项目中做出正确的技术选型
- 避免把 LLM 当成“无所不能的 AI”

---

## 三、核心概念

### 1. 基本定义

#### 什么是 LLM？

LLM 全称：

> **Large Language Model —— 大语言模型**

它是一类专门针对自然语言进行训练的大规模机器学习模型。

这里有三个关键词：

#### Large —— 大

通常意味着模型具有大量参数，并且需要大量计算资源进行训练。

参数可以简单理解成：

> **模型在训练过程中学习到的“内部知识和规律”。**

模型参数越多，并不意味着一定越聪明，但通常更大的模型拥有更强的表达和建模能力。

---

#### Language —— 语言

LLM 最初主要解决的是自然语言相关问题，例如：

- 文本生成
- 文本理解
- 翻译
- 摘要
- 问答
- 分类
- 信息抽取

后来随着模型能力不断提升，它还可以处理：

- 编程语言
- JSON
- Markdown
- SQL
- 数学表达式
- 部分多模态信息

所以现在的“Language Model”已经不只是处理普通的人类语言。

---

#### Model —— 模型

LLM 本质上仍然是一个机器学习模型。

它并不是一个：

```text
搜索引擎
数据库
知识库
操作系统
程序员
```

而是一个经过训练后，可以根据输入上下文生成输出的模型。

---

### 2. 关键特征

#### 特征一：基于上下文生成内容

LLM 并不是简单地对一句话进行固定回答。

它会结合当前上下文进行生成。

例如：

```text
用户：帮我写一个 React Button

LLM：可以使用下面的方式实现：

function Button() {
  return <button>点击</button>
}
```

如果继续告诉它：

```text
要求使用 TypeScript，并且支持 disabled
```

模型就会结合之前的内容继续生成：

```text
interface ButtonProps {
  disabled?: boolean
}

function Button({ disabled }: ButtonProps) {
  return (
    <button disabled={disabled}>
      点击
    </button>
  )
}
```

这就是 **Context（上下文）**的重要性。

可以简单理解成：

```text
Prompt
  +
历史消息
  +
系统指令
  +
其他上下文
  ↓
LLM
  ↓
Output
```

---

#### 特征二：LLM 的核心输出单位是 Token

LLM 并不是直接理解“字、词、句子”。

它处理的是：

> **Token**

例如：

```text
你好，今天怎么样？
```

经过 Tokenizer 后，可能会被拆分成多个 Token。

代码也是一样：

```typescript
const user = 'Tom';
```

会被拆分成模型能够处理的 Token 序列。

因此我们经常会看到：

```text
Context Window：128K Tokens
```

它表示模型一次能够处理的上下文 Token 数量。

这也是为什么在实际 AI 应用中，需要关注：

- Prompt 长度
- 历史消息长度
- RAG 文档长度
- 输出长度
- Token 消耗

---

#### 特征三：LLM 并不是传统意义上的“数据库”

这是理解 LLM 非常重要的一点。

很多人会认为：

> “模型训练过这么多数据，所以它应该记得所有知识。”

实际上并不是这样。

LLM 学到的更接近：

```text
大量数据
   ↓
训练
   ↓
模型参数
   ↓
学习语言规律和知识模式
```

而不是：

```text
Wikipedia
 ↓
数据库
 ↓
SELECT * FROM knowledge
```

因此 LLM 并不适合作为企业知识库的唯一存储方案。

例如公司有一份：

```text
2026 年员工报销制度
```

即使模型知道相关领域知识，也不能保证它知道你们公司最新的报销规则。

这时候通常需要：

```text
企业文档
   ↓
RAG
   ↓
检索相关内容
   ↓
把内容放进 Prompt
   ↓
LLM
   ↓
生成答案
```

---

### 3. 与其他概念的关系

理解 LLM 最好的方式，是把它放到整个 AI 应用架构中。

```text
                    AI 应用
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
         RAG         Agent         MCP
          │            │            │
          └────────────┼────────────┘
                       ↓
                      LLM
                       │
                       ↓
                  Token 生成
```

---

#### LLM vs RAG

**LLM 是模型，RAG 是一种增强 LLM 的应用架构。**

LLM 本身可能不知道企业内部最新数据。

RAG 通过：

```text
用户问题
   ↓
检索知识库
   ↓
找到相关文档
   ↓
将文档内容提供给 LLM
   ↓
LLM 根据文档生成答案
```

让 LLM 可以利用外部知识。

所以：

> **RAG 不是模型，而是一种让 LLM 使用外部知识的方法。**

---

#### LLM vs Agent

LLM 本身主要负责：

> **理解上下文并生成内容。**

而 Agent 通常是在 LLM 的基础上增加：

- 工具调用
- 任务规划
- 状态管理
- 多轮执行
- 环境交互

例如用户说：

```text
帮我查一下今天广州的天气，如果下雨就提醒我带伞。
```

单纯的 LLM：

```text
LLM
 ↓
生成一个答案
```

Agent：

```text
用户需求
 ↓
LLM
 ↓
判断需要查询天气
 ↓
调用天气 API
 ↓
获得天气结果
 ↓
LLM 分析
 ↓
决定是否提醒
 ↓
执行后续操作
```

所以可以简单理解：

> **LLM 是“大脑”，Agent 是让这个“大脑”能够规划任务、调用工具并执行任务的一套系统。**

---

#### LLM vs MCP

MCP（Model Context Protocol）主要解决的是：

> **如何让 AI 模型以标准化的方式发现和使用外部工具、资源和能力。**

例如：

```text
LLM
 │
 ├── MCP → GitHub
 │
 ├── MCP → 数据库
 │
 ├── MCP → 文件系统
 │
 └── MCP → 企业内部系统
```

因此：

```text
LLM
 ↓
负责理解和生成

Agent
 ↓
负责规划和执行

MCP
 ↓
提供标准化的工具 / 资源连接方式

RAG
 ↓
提供外部知识检索能力
```

它们解决的是不同层面的问题。

---

## 四、直观示例

假设我们做一个“AI 前端开发助手”。

用户输入：

```text
帮我实现一个优惠券选择组件。
要求：
1. React + TypeScript
2. 支持优惠券选中状态
3. 支持优惠券不可用状态
4. 使用我们的项目代码规范
```

整个过程可以简单理解为：

```text
                    用户需求
                       ↓
                  Context
                       ↓
                      LLM
                       ↓
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       理解需求      生成代码      遵循规范
          │            │            │
          └────────────┼────────────┘
                       ↓
                    最终代码
```

例如：

```typescript
interface Coupon {
  id: string
  name: string
  amount: number
  disabled?: boolean
}

interface CouponItemProps {
  coupon: Coupon
  selected: boolean
  onClick: (coupon: Coupon) => void
}

export function CouponItem({
  coupon,
  selected,
  onClick,
}: CouponItemProps) {
  return (
    <div
      className={selected ? 'coupon selected' : 'coupon'}
      onClick={() => !coupon.disabled && onClick(coupon)}
    >
      <span>{coupon.name}</span>
      <span>¥{coupon.amount}</span>
    </div>
  )
}
```

这里真正负责“生成这段代码”的核心就是：

```text
LLM
```

如果进一步加入：

```text
项目代码规范
项目组件库
历史代码
GitLab
数据库
文件系统
```

那么就可以逐渐演变成：

```text
                    AI 编程助手
                         │
             ┌───────────┼───────────┐
             ↓           ↓           ↓
            RAG        Agent        MCP
             │           │           │
             └───────────┼───────────┘
                         ↓
                        LLM
                         ↓
                     生成代码
```

这也是现代 AI 工程应用的基本思路。

---

## 五、常见误区

### 误区一：LLM 就是 ChatGPT

不是。

**ChatGPT 是一个 AI 产品，而 LLM 是其中的核心模型能力之一。**

可以简单理解为：

```text
LLM
 ↓
提供模型能力

ChatGPT
 ↓
产品
 ↓
LLM + UI + 工具 + 搜索 + 文件 + Agent 等能力
```

因此：

> **LLM ≠ ChatGPT。**

---

### 误区二：LLM 就是一个知识库

不是。

LLM 并不是传统数据库。

它学习的是数据中的模式和规律，而不是简单地保存：

```text
问题 → 标准答案
```

因此不能认为：

> “模型训练过某个网站，所以一定可以准确回答这个网站上的所有内容。”

---

### 误区三：LLM 知道最新信息

不一定。

LLM 的知识存在训练数据和系统能力等边界。

例如：

```text
今天股票价格是多少？
```

如果模型没有连接实时行情工具，就不能保证知道当前价格。

这也是：

```text
LLM + Search
LLM + API
LLM + MCP
LLM + Database
```

这些架构存在的原因。

---

### 误区四：LLM 每次都会给出唯一答案

不是。

LLM 的生成具有概率性。

同一个问题：

```text
帮我写一个 React Button
```

可能生成：

```text
function Button() {}
```

也可能生成：

```text
const Button = () => {}
```

甚至可能采用完全不同的组件设计。

因此在 AI 工程中，经常需要通过：

- Prompt
- System Message
- Temperature
- Structured Output
- Tool Calling
- Schema

等方式约束模型输出。

---

### 误区五：模型越大就一定越好

也不一定。

实际项目中需要综合考虑：

```text
效果
+
速度
+
成本
+
上下文长度
+
工具调用能力
+
部署方式
+
数据隐私
```

例如一个简单的文本分类任务，可能根本不需要使用最大的模型。

因此：

> **AI 工程的核心并不是“选择最大的模型”，而是选择能够满足业务需求的模型。**

---

## 六、总结

LLM（Large Language Model，大语言模型）本质上是：

> **一个通过海量数据训练、基于上下文预测和生成 Token 的大规模语言模型。**

可以用一句简单的话记住：

```text
LLM = 根据上下文预测并生成内容的模型
```

而现代 AI 应用通常是在 LLM 的基础上继续构建能力：

```text
                    AI 应用
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
         RAG         Agent         MCP
          │            │            │
          └────────────┼────────────┘
                       ↓
                      LLM
                       ↓
               理解 / 推理 / 生成
```

其中：

| 概念       | 核心作用                             |
| ---------- | ------------------------------------ |
| **LLM**    | 理解上下文、推理并生成内容           |
| **RAG**    | 给 LLM 提供外部知识                  |
| **Agent**  | 让 LLM 能够规划任务、调用工具并执行  |
| **MCP**    | 标准化 AI 与外部工具、资源之间的连接 |
| **Prompt** | 告诉 LLM 要做什么以及如何做          |
| **Token**  | LLM 实际处理和生成的基本单位         |

因此，学习 AI 工程时，一个非常重要的认知是：

> **LLM 不是完整的 AI 应用，而是 AI 应用中的核心模型能力。**

理解这一点之后，再去学习 **Prompt → RAG → Function Calling → Agent → MCP → AI Coding**，就会更加容易建立完整的知识体系。

> **进阶阅读：**参见对应进阶模块中的深度文章。
