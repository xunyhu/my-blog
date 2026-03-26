# readme

## 🧠 一、整体架构

```
博客系统
├── 分类（Category）👉 大类（frontend / projects）
├── 标签（Tag）👉 细分领域（react / 性能 / 权限）
├── 文章（Post）
│   ├── 属于一个 category
│   └── 拥有多个 tags
```

## 🧱 二、数据结构设计

### ✅ 1. Post（文章结构）

```ts
export type Category = 'frontend' | 'projects';

export type Post = {
  title: string;
  slug: string;
  date: string;
  description: string;

  category: Category; // ✅ 核心字段
  tags: string[]; // ✅ 标签

  cover?: string;
  readingTime?: string;
};
```

### ✅ 2. Category 配置

```ts
export const CATEGORY_CONFIG = {
  frontend: {
    label: '前端知识体系',
    desc: '系统整理前端基础与高级知识',
    color: 'blue',
  },
  projects: {
    label: '项目经验笔记',
    desc: '真实项目中的架构与实践',
    color: 'green',
  },
};
```

### ✅ 3. Tag 结构

```ts
export type Tag = {
  name: string;
  category: Category; // 👈 关键：归属哪个分类
};
```

## 🔗 三、路由设计

### URL 结构

```
/blog                    👉 所有文章
/blog/frontend           👉 前端分类
/blog/projects           👉 项目分类
/blog/frontend/react     👉 前端 + React
```

### Next.js App Router 设计

```
app/
  blog/
    page.tsx                👉 /blog
    [category]/
      page.tsx              👉 /blog/frontend
      [tag]/
        page.tsx            👉 /blog/frontend/react
```

### 参数获取方式

```ts
export default function Page({ params }) {
  const { category, tag } = params;
}
```

## 🎨 四、页面结构设计

### ✅ 1. 页面布局

```
[ 分类导航（大类） ]
[ Tag 横向筛选（当前分类下） ]
[ 文章列表 ]
```

### ✅ 2. 分类导航

### ✅ 3. Tag 筛选

### ✅ 4. 文章过滤逻辑

## 📁 五、目录结构

```
lib/
  blog/
    index.ts          👉 getAllPosts
    filter.ts         👉 过滤逻辑
    tags.ts           👉 tag处理

config/
  category.ts         👉 分类配置

app/
  blog/
    page.tsx
    [category]/
      page.tsx
      [tag]/
        page.tsx

components/
  blog/
    CategoryNav.tsx
    TagFilter.tsx
    PostCard.tsx
```
