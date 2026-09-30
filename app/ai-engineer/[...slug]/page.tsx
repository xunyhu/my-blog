import { getContent } from '@/lib/post/getContent';
import { extractHeadings } from '@/lib/post/toc';
import ContentLayout from '@/app/components/post/ContentLayout';
import MarkdownRenderer from '@/app/components/post/MarkdownRenderer';
import BackButton from '@/app/components/post/BackButton';

export default async function AIEngineerDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const post = getContent('ai-engineer', slug);

  if (!post) return <div className="p-10">404 Not Found</div>;

  const headings = extractHeadings(post.content);

  return (
    <ContentLayout content={post.content} headings={headings}>
      <BackButton fallback="/ai-engineer" />
      <MarkdownRenderer content={post.content} />
    </ContentLayout>
  );
}
