'use client';

import TOC from '@/app/components/TOC';
import { ReactNode } from 'react';

interface ContentLayoutProps {
  content: string;
  headings: Array<{ id: string; text: string; level: number }>;
  children: ReactNode;
}

export default function ContentLayout({
  headings,
  children,
}: ContentLayoutProps) {
  return (
    <main className="max-w-7xl mx-auto px-6 py-10 relative">
      <div className="flex gap-10">
        <aside className="w-64 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
          <TOC headings={headings} />
        </aside>

        <article className="flex-1 prose max-w-none">{children}</article>
      </div>
    </main>
  );
}
