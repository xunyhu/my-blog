import { getAllPosts, getAllCategories, getAllTags } from "@/lib/blog";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ category?: string, tag?: string }> }) {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const params = await searchParams;
  const currentCategory = params.category || "all";
  const tags = getAllTags();
  const currentTag = params.tag || "all";
  const filteredPosts =
    currentTag === "all"
      ? posts
      : posts.filter((p) => p.tags.includes(currentTag));

  return (
    <main className="p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">前端知识体系博客</h1>
        <p className="text-gray-500">知识 + 项目经验沉淀</p>
      </section>

      {/* 分类菜单 */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={tag === "all" ? "/" : `/?tag=${tag}`}
            className={`px-3 py-1 text-sm rounded-full border transition
        ${currentTag === tag
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
          >
            {tag}
          </Link>
        ))}
      </div>

      {/* 文章列表 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block p-5 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
            <p className="text-xs text-gray-400 mb-2">
              {new Date(post.date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">
              {post.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}