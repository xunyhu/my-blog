import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import PostContent from '@/app/blog/post/PostContent'; // Client Component

function extractHeadings(markdown: string) {
  const regex = /^(#{1,3})\s+(.*)/gm;
  const headings = [];
  let match;
  while ((match = regex.exec(markdown))) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/\s+/g, '-'),
    });
  }
  return headings;
}

interface PageProps {
  params: Promise<{ slug: string[] }>; // 注意是数组
}

export default async function PostPage({ params }: PageProps) {
  const slugArray = (await params).slug || [];

  if (slugArray.length === 0) {
    return <div className="p-10 text-center text-gray-500">文章不存在</div>;
  }

  // 拼接文章路径
  const filePath =
    path.join(process.cwd(), 'content', 'blog', ...slugArray) + '.md';

  if (!fs.existsSync(filePath)) {
    return <div className="p-10 text-center text-gray-500">文章不存在</div>;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(fileContent);
  const headings = extractHeadings(content);

  return <PostContent content={content} headings={headings} />;
}
