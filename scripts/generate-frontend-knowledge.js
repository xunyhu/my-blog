import fs from 'fs';
import path from 'path';

// 输出目录（你可以改成你的 blog 目录）
const baseDir = path.join(process.cwd(), '../content/frontend-knowledge');

// 统一模板
const template = (title) => `# ${title}

## 一、是什么

## 二、为什么

## 三、核心原理

## 四、代码实现

\`\`\`js

\`\`\`

## 五、面试题

## 六、总结
`;

// 知识体系结构
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

  '08-项目实战': [
    '博客系统',
    '电商系统',
    '权限系统',
    '低代码平台',
    '酒店SaaS系统',
  ],
};

// 创建目录 + 文件
function generate() {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  Object.entries(structure).forEach(([category, files]) => {
    const categoryPath = path.join(baseDir, category);

    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath);
    }

    files.forEach((name, index) => {
      const fileName = `${String(index + 1).padStart(2, '0')}-${name}.md`;
      const filePath = path.join(categoryPath, fileName);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, template(name));
        console.log('✅ 创建:', filePath);
      } else {
        console.log('⚠️ 已存在:', filePath);
      }
    });
  });

  console.log('\n🎉 前端知识库生成完成！');
}

generate();
