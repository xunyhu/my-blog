import { getAllPosts } from "@/lib/blog";
import Link from "next/link";

export default async function HomePage() {
  const posts = getAllPosts();

  // 分类颜色映射
  const categoryColor: Record<string, string> = {
    "html-css": "bg-yellow-100 text-yellow-800",
    javascript: "bg-green-100 text-green-800",
    typescript: "bg-blue-100 text-blue-800",
    react: "bg-purple-100 text-purple-800",
    vue: "bg-green-200 text-green-900",
    algorithms: "bg-red-100 text-red-800",
    "project-experience": "bg-pink-100 text-pink-800",
    blog: "bg-gray-100 text-gray-800",
  };

  // 分区
  const knowledgePosts = posts.filter(
    (post) => post.category !== "project-experience"
  );
  const projectPosts = posts.filter(
    (post) => post.category === "project-experience"
  );

  return (
    <main className="p-8 max-w-7xl mx-auto">
      {/* Hero 区块 */}
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">胡瑞的博客</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          系统整理前端基础知识 + 项目经验 + Demo
        </p>
      </section>

      {/* 知识体系文章 */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6">知识体系</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledgePosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
              <p className="text-sm text-gray-500 mb-2">
                {new Date(post.date).toLocaleDateString()}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {post.description}
              </p>
              {post.category && (
                <span
                  className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                    categoryColor[post.category] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {post.category}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* 项目经验文章 */}
      {projectPosts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6">项目经验</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1"
              >
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(post.date).toLocaleDateString()}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {post.description}
                </p>
                <span
                  className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                    categoryColor["project-experience"]
                  }`}
                >
                  项目经验
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}