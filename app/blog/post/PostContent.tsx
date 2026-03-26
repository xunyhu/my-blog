'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import TOC from '@/app/components/TOC';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PostContentProps {
  content: string;
  headings: { level: number; text: string; id: string }[];
  referrer?: string;
}

export default function PostContent({
  content,
  headings,
  referrer,
}: PostContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromHome = searchParams.get('referrer');
  const handleBack = () => {
    if (fromHome) {
      router.push('/');
    } else if (window.location.hash || referrer) {
      const target = referrer ? `/blog/${referrer}` : '/blog';
      router.push(target);
    } else {
      history.back();
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 relative">
      {/* 返回按钮固定在视口左上方 */}
      <button
        onClick={handleBack}
        className="fixed top-6 left-6 z-50 inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 shadow-md"
      >
        ← 返回
      </button>

      <div className="flex gap-10">
        {/* TOC 左侧固定 */}
        <aside className="w-64 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
          <TOC headings={headings} />
        </aside>

        {/* 正文 */}
        <article
          className="
            prose prose-lg max-w-none flex-1 space-y-6
            prose-p:leading-relaxed prose-p:text-gray-700
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4
            prose-h2:text-3xl prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-2xl prose-h3:mt-4 prose-h3:mb-2
          "
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeHighlight,
              rehypeSlug,
              rehypeAutolinkHeadings,
            ]}
            components={{
              a: ({ href = '', children }) => {
                const isInternal = href.startsWith('/');

                // ✅ 站内链接（走 Next.js）
                if (isInternal) {
                  return <Link href={href}>{children}</Link>;
                }

                // ✅ 外链（新开标签页）
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
