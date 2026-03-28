import fs from 'fs';
import path from 'path';

// 目标目录
const baseDir = path.join(process.cwd(), '../content/frontend-knowledge');

/**
 * 统一文章模板（带基础内容）
 */
function generateContent(title, category) {
  return `# ${title}

## 一、是什么

${title} 是前端开发中的一个重要概念，属于 ${category} 知识体系中的核心内容。

---

## 二、为什么

理解 ${title} 可以帮助我们：
- 提升基础原理理解能力
- 更好定位线上问题
- 构建完整前端知识体系

---

## 三、核心原理

### 1. 基本概念
围绕 ${title} 的核心机制展开理解。

### 2. 执行流程
通常涉及：
- 输入
- 处理过程
- 输出结果

### 3. 关键点
- 可控性
- 性能影响
- 实际应用场景

---

## 四、代码实现

\`\`\`js
// ${title} 示例代码（后续可以继续完善）
console.log("${title} example");
\`\`\`

---

## 五、总结

${title} 是前端进阶中必须掌握的知识点，建议结合实践不断加深理解。
`;
}

/**
 * 知识体系结构
 */
const structure = {
  '00-前端认知': ['前端发展史', '浏览器工作原理总览', '前端架构全景'],

  '01-JavaScript核心': [
    '数据类型',
    '类型转换',
    '作用域与作用域链',
    '闭包',
    'this指向',
    '执行上下文',
    '原型与原型链',
    '继承实现',
    '异步编程',
    '事件循环',
  ],

  '02-JavaScript进阶': [
    'Promise原理',
    'async-await',
    '模块化机制',
    '深拷贝实现',
    '函数柯里化',
    '防抖节流',
    'Proxy与Reflect',
    '垃圾回收机制',
  ],

  '03-浏览器与网络': [
    '浏览器渲染流程',
    '重排与重绘',
    'HTTP协议',
    'HTTPS原理',
    'TCP三次握手',
    '浏览器缓存',
    '跨域问题',
    '输入URL发生了什么',
    'WebSocket',
    '前端性能优化',
  ],

  '04-React体系': [
    'React基础',
    '虚拟DOM',
    'Diff算法',
    'Fiber架构',
    'Hooks原理',
    '状态管理',
    '性能优化',
    'React18特性',
    '服务端组件RSC',
    'Next.js架构',
  ],

  '05-工程化': [
    '模块化演进',
    'Webpack原理',
    'Vite原理',
    'Babel原理',
    'TreeShaking',
    '代码分割',
    '前端监控',
    'CI-CD',
  ],

  '06-前端架构': [
    '设计模式',
    '组件设计',
    '微前端',
    '权限系统设计',
    '低代码平台',
    'SaaS架构',
  ],

  '07-算法与数据结构': [
    '数组与链表',
    '栈与队列',
    '哈希表',
    '排序算法',
    '前端算法场景',
  ],
};

/**
 * 🚀 清空旧目录
 */
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('🧹 已清空旧目录:', dir);
  }
}

/**
 * 🚀 生成文件
 */
function generate() {
  // 1. 先清空旧内容
  // cleanDir(baseDir);

  // 2. 创建基础目录
  fs.mkdirSync(baseDir, { recursive: true });

  Object.entries(structure).forEach(([category, files]) => {
    const categoryPath = path.join(baseDir, category);
    fs.mkdirSync(categoryPath, { recursive: true });

    files.forEach((name, index) => {
      const fileName = `${String(index + 1).padStart(2, '0')}-${name}.md`;
      const filePath = path.join(categoryPath, fileName);

      const content = generateContent(name, category);

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('✅ 创建:', filePath);
    });
  });

  console.log('\n🎉 前端知识库生成完成！');
}

generate();
