import { getAllPosts } from '@/lib/blog';
import HomeButton from '@/app/components/HomeButton';
import CategoryNav from '@/app/components/blog/CategoryNav';
import PostCard from '@/app/components/blog/PostCard';

export default async function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="container mx-auto px-4 py-10 relative">
      <HomeButton />
      <CategoryNav />
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </ul>
    </main>
  );
}
