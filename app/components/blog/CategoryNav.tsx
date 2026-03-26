import Link from 'next/link';
import { CATEGORY_CONFIG } from '@/config/category';

export default function CategoryNav({
  currentCategory,
}: {
  currentCategory?: string;
}) {
  return (
    <div className="flex gap-3 mb-8 flex-wrap">
      <Link
        href="/blog"
        className={`
          px-3 py-1.5 text-sm rounded-full border
          transition
          ${
            !currentCategory
              ? 'bg-[#eef2ff] border-[#cbd5f5] text-[#3b82f6]'
              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
          }
        `}
      >
        全部
      </Link>

      {Object.entries(CATEGORY_CONFIG).map(([key, item]) => (
        <Link
          key={key}
          href={`/blog/${key}`}
          className={`
            px-3 py-1.5 text-sm rounded-full border
            transition
            ${
              currentCategory === key
                ? 'bg-[#eef2ff] border-[#cbd5f5] text-[#3b82f6]'
                : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
            }
          `}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
