import { getContent } from '@/lib/post/getContent';
import { extractHeadings } from '@/lib/post/toc';
import ContentLayout from '@/app/components/post/ContentLayout';
import MarkdownRenderer from '@/app/components/post/MarkdownRenderer';
import BackButton from '@/app/components/post/BackButton';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function PostPage({ params }: PageProps) {
  const slugArray = (await params).slug || [];
  const post = getContent('blog', slugArray);

  if (!post) {
    return <div className="p-10 text-center text-gray-500">文章不存在</div>;
  }

  const headings = extractHeadings(post.content);

  return (
    <ContentLayout content={post.content} headings={headings}>
      <BackButton fallback="/blog" />
      <MarkdownRenderer content={post.content} />
    </ContentLayout>
  );
}
