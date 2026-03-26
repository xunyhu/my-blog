import { getAllPosts } from '@/lib/blog';
import { filterPosts, getTagsByCategory } from '@/lib/utils';
import CategoryNav from '@/app/components/blog/CategoryNav';
import TagFilter from '@/app/components/blog/TagFilter';
import PostCard from '@/app/components/blog/PostCard';
import { Category } from '@/types/blog';
import HomeButton from '@/app/components/HomeButton';

export default async function Page({
  params,
}: {
  params: Promise<{ category: Category; tag: string }>;
}) {
  const { category, tag } = await params;

  const posts = getAllPosts();
  const filtered = filterPosts(posts, category, tag);
  const tags = getTagsByCategory(posts, category);

  return (
    <main className="container mx-auto px-4 py-10">
      <HomeButton />
      <CategoryNav currentCategory={category} />

      {category === 'frontend' && (
        <TagFilter tags={tags} category={category} currentTag={tag} />
      )}

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <PostCard key={post.slug} post={post} referrer={category} />
        ))}
      </ul>
    </main>
  );
}
