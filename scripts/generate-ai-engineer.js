import fs from 'fs';
import path from 'path';

const baseDir = path.join(process.cwd(), 'content/ai-engineer');

/**
 * 文章模板
 */
function generateContent(title, category) {
  return `# ${title}

## 一、是什么

${title}是 AI 工程化中的一个核心概念，属于${category}知识模块。

## 二、为什么

理解${title}可以帮助我们：
- 更好地设计 AI 应用架构
- 提升 AI 系统的工程化水平
- 构建更可靠的 AI 产品

## 三、核心原理

### 1. 基本概念

围绕${title}的核心机制展开。

### 2. 工作流程

通常涉及：
- 输入处理
- 核心逻辑
- 输出结果

### 3. 关键细节

- 可控性
- 性能影响
- 实际应用场景

## 四、代码实现

\`\`\`typescript
// ${title} 示例代码
console.log("${title} example");
\`\`\`

## 五、工程实践

在生产环境中应用${title}时的经验与注意事项。

## 六、总结

${title}是 AI 工程师必须掌握的知识点，建议结合实际项目不断加深理解。
`;
}

/**
 * 知识体系结构
 */
const structure = {
  '00-AI基础': [
    '什么是LLM',
    '什么是Token',
    '什么是Embedding',
    '什么是Agent',
    '什么是RAG',
    'Function Calling',
    'MCP',
    'AI Workflow',
  ],

  '01-AI工程认知': ['AI发展简史', 'AI工程师能力模型', 'AI应用技术全景'],

  '02-LLM基础': [
    '大语言模型原理',
    'Transformer架构概要',
    'Token与Tokenizer',
    'Prompt Engineering基础',
    '高级Prompt技巧',
    'Function Calling',
    '流式输出与SSE',
    'LLM API设计模式',
  ],

  '03-RAG体系': [
    'RAG概述与架构',
    '文本Embedding原理',
    '向量数据库选型',
    '文档切分策略',
    '检索策略与重排序',
    '混合检索',
    'RAG评估指标',
    '高级RAG架构',
  ],

  '04-Agent架构': [
    'Agent概述与范式',
    'ReAct推理框架',
    '工具调用机制',
    'Agent记忆系统',
    '规划与任务分解',
    '多Agent协作',
    'Agent开发框架',
    'Agent调试与优化',
  ],

  '05-MCP协议': [
    'MCP协议概述',
    'MCP架构与设计原则',
    'MCP Server开发',
    'MCP工具定义',
    'MCP资源与提示',
    'MCP传输层',
    'MCP生态与最佳实践',
  ],

  '06-工程化实践': [
    'AI应用评测体系',
    'Prompt版本管理',
    'LLM可观测性',
    '成本控制与Token优化',
    'AI应用安全',
    'Guardrails护栏机制',
    'AI应用部署方案',
    'AI应用的CI-CD',
  ],

  '07-产品与架构': [
    'AI产品设计模式',
    'AI Chatbot架构',
    'AI代码助手架构',
    'AI知识库架构',
    'AI工作流自动化',
    '多模态应用架构',
    'AI应用性能优化',
    'AI工程前沿趋势',
  ],
};

/**
 * 生成文件
 */
function generate() {
  fs.mkdirSync(baseDir, { recursive: true });

  let totalCount = 0;

  Object.entries(structure).forEach(([category, files]) => {
    const categoryPath = path.join(baseDir, category);
    fs.mkdirSync(categoryPath, { recursive: true });

    files.forEach((name, index) => {
      const fileName = `${String(index + 1).padStart(2, '0')}-${name}.md`;
      const filePath = path.join(categoryPath, fileName);

      const content = generateContent(name, category.replace(/^\d+-/, ''));
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('✅', filePath);
      totalCount++;
    });
  });

  console.log(`\n🎉 AI Engineer 知识库生成完成！共 ${totalCount} 篇`);
}

generate();
