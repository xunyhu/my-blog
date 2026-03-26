import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Tag, Post } from '@/types/blog';

const blogDir = path.join(process.cwd(), 'content/blog');
const knowledgeDir = path.join(process.cwd(), 'content/frontend-knowledge');

function getFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

export function getAllPosts(): Post[] {
  const files = getFilesRecursively(blogDir);

  const posts = files.map((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);

    // 计算 slug，去掉 content/blog 前缀和 .md 后缀
    const slug = path
      .relative(blogDir, filePath)
      .replace(/\\/g, '/') // Windows 路径兼容
      .replace(/\.md$/, '');

    const rawDate = data.date ? new Date(data.date) : new Date();
    const date = isNaN(rawDate.getTime()) ? Date.now() : rawDate.getTime();

    return {
      slug,
      title: data.title,
      date,
      description: data.description || data.desc || '',
      category: data.category || 'blog',
      tags: data.tags || [],
    };
  });

  return posts.sort((a, b) => b.date - a.date);
}

export function getAllCategories() {
  const posts = getAllPosts();
  const categories = new Set(posts.map((p) => p.category));
  return ['All', ...Array.from(categories)];
}

export function getAllTags() {
  const posts = getAllPosts();
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag: Tag) => {
      tagSet.add(tag.name);
    });
  });

  return ['all', ...Array.from(tagSet)];
}

export function getKnowledgeMap() {
  const knowledgeDir = path.join(process.cwd(), 'content/frontend-knowledge');

  const categories = fs.readdirSync(knowledgeDir);

  return categories.map((category) => {
    const categoryPath = path.join(knowledgeDir, category);
    const files = fs.readdirSync(categoryPath).sort();

    return {
      title: category.replace(/^\d+-/, ''),
      children: files.map((file) => {
        const name = file.replace('.md', '').replace(/^\d+-/, '');

        return {
          name,
          slug: `/knowledge/${category}/${file.replace('.md', '')}`,
        };
      }),
    };
  });
}
