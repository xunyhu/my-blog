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
      <Link
        href={category ? `/blog/${category}` : '/blog'}
        className={`px-3 py-1 rounded-full text-sm ${
          !currentTag ? 'bg-blue-600 text-white' : 'bg-gray-100'
        }`}
      >
        全部
      </Link>

      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={category ? `/blog/${category}/${tag.slug}` : `/blog`}
          className={`px-3 py-1 rounded-full border text-sm ${
            currentTag === tag.slug
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
