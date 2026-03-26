import Link from 'next/link';
import { Tag } from '@/types/blog';

export default function TagFilter({
  tags,
  category,
  currentTag,
}: {
  tags: Tag[];
  category?: string;
  currentTag?: string;
}) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {/* 全部 */}
      <Link
        href={category ? `/blog/${category}` : '/blog'}
        className={`
          px-3 py-1.5 text-xs rounded-full border
          transition
          ${
            !currentTag
              ? 'bg-[#eef2ff] border-[#cbd5f5] text-[#3b82f6]'
              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
          }
        `}
      >
        全部
      </Link>

      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={category ? `/blog/${category}/${tag.slug}` : `/blog`}
          className={`
            px-3 py-1.5 text-xs rounded-full border
            transition
            ${
              currentTag === tag.slug
                ? 'bg-[#eef2ff] border-[#cbd5f5] text-[#3b82f6]'
                : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
            }
          `}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
