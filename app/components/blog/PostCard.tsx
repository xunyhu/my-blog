import Link from 'next/link';
import { Post } from '@/types/blog';

export default function PostCard({ post }: { post: Post }) {
  return (
    <li className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between">
      <Link href={`/blog/post/${post.slug}`}>
        <h2 className="text-xl font-semibold text-blue-600">{post.title}</h2>
      </Link>

      <p className="text-sm text-gray-400 mt-2">
        {new Date(post.date).toLocaleDateString()} ·{' '}
        {post.tags.map((tag) => tag.name).join(', ')}
      </p>

      <p className="mt-4 text-gray-700 line-clamp-3">{post.description}</p>
    </li>
  );
}
