import Link from 'next/link';
import { CATEGORY_CONFIG } from '@/config/category';

export default function CategoryNav({
  currentCategory,
}: {
  currentCategory?: string;
}) {
  return (
    <div className="flex gap-4 mb-8">
      <Link
        href="/blog"
        className={`px-4 py-2 rounded-lg ${
          !currentCategory ? 'bg-blue-600 text-white' : 'bg-gray-100'
        }`}
      >
        全部
      </Link>

      {Object.entries(CATEGORY_CONFIG).map(([key, item]) => (
        <Link
          key={key}
          href={`/blog/${key}`}
          className={`px-4 py-2 rounded-lg transition ${
            currentCategory === key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
