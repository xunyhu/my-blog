import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/blog";
import HeroParticles from "./components/HeroParticles";

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ category?: string, tag?: string }> }) {
  const posts = getAllPosts();
  const tags = getAllTags();

  // ⚡ 处理 URL 参数，默认 all
  const params = await searchParams;
  const currentTag = params?.tag || "all";

  // ⚡ 根据 Tag 过滤文章
  const filteredPosts =
    currentTag === "all"
      ? posts
      : posts.filter((p) => p.tags.includes(currentTag));

  return (
    <main className="p-8 max-w-7xl mx-auto">
      {/* Hero 区 */}
      <HeroParticles/>
      <section className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">HuRui.dev</h1>
          <p className="text-xl mb-6">
            记录前端知识体系与真实项目经验，从会写代码到工程化实践
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/blog"
              className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold shadow hover:bg-gray-100 transition"
            >
              查看博客
            </Link>
            <Link
              href="/projects"
              className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold shadow hover:bg-gray-100 transition"
            >
              查看项目
            </Link>
          </div>
        </div>
      </section>

      {/* Tag 筛选菜单 */}
      <div className="container mx-auto px-4 mt-10 flex flex-wrap gap-2 justify-center">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={tag === "All" ? "/" : `/?tag=${tag}`}
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

      {/* 分类入口卡片 */}
      <div className="container mx-auto px-4 mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Link href="/blog?category=frontend" className="p-6 bg-white shadow rounded-lg hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">前端知识体系</h3>
          <p className="text-gray-600">系统整理前端基础与高级知识</p>
        </Link>
        <Link href="/blog?category=projects" className="p-6 bg-white shadow rounded-lg hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">项目经验笔记</h3>
          <p className="text-gray-600">动态渲染商品、权限系统、骨架屏等项目实战</p>
        </Link>
      </div>

      {/* 最新文章列表 */}
      <section className="container mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold mb-6">最新文章</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="p-6 bg-white shadow rounded-lg hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-2">{post.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {post.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-600">
          © {new Date().getFullYear()} HuRui.dev. All rights reserved.
        </div>
      </footer>
    </main>
  );
}