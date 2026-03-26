import { getAllPosts } from '@/lib/blog';
import { filterPosts, getTagsByCategory } from '@/lib/utils';
import CategoryNav from '@/app/components/blog/CategoryNav';
import TagFilter from '@/app/components/blog/TagFilter';
import PostCard from '@/app/components/blog/PostCard';
import HomeButton from '@/app/components/HomeButton';
import { Category } from '@/types/blog';

export default async function Page({
  params,
}: {
  params: Promise<{ category: Category }>;
}) {
  const { category } = await params;

  const posts = getAllPosts();
  const filtered = filterPosts(posts, category);
  const tags = getTagsByCategory(posts, category);

  return (
    <main className="container mx-auto px-4 py-10">
      <HomeButton />

      <CategoryNav currentCategory={category} />

      {category === 'frontend' && <TagFilter tags={tags} category={category} />}

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <PostCard key={post.slug} post={post} referrer={category} />
        ))}
      </ul>
    </main>
  );
}
