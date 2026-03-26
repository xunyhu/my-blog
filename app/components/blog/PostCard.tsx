import Link from 'next/link';
import { Post } from '@/types/blog';

export default function PostCard({
  post,
  referrer,
}: {
  post: Post;
  referrer?: string;
}) {
  return (
    <li
      className="
        bg-white
        border border-[#e2e8f0]
        rounded-xl
        p-5
        transition
        hover:border-[#cbd5f5]
        hover:bg-[#fafbff]
      "
    >
      <Link
        href={`/blog/post/${post.slug}${referrer ? `?from=${referrer}` : ''}`}
        className="block"
      >
        {/* 标题 */}
        <h2 className="text-base font-medium text-[#0f172a]">{post.title}</h2>

        {/* 时间 + 标签 */}
        <p className="text-xs text-[#94a3b8] mt-2">
          {new Date(post.date).toLocaleDateString()} ·{' '}
          {post.tags.map((tag) => tag.name).join(' · ')}
        </p>

        {/* 描述 */}
        <p className="mt-3 text-sm text-[#64748b] line-clamp-2">
          {post.description}
        </p>
      </Link>
    </li>
  );
}
