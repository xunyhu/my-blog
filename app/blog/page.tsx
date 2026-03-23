import { getAllPosts } from "@/lib/blog";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">博客</h1>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between"
          >
            <div>
              <a
                href={`/blog/${post.slug}`}
                className="text-2xl font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {post.title}
              </a>

              <p className="text-gray-400 dark:text-gray-300 text-sm mt-2">
                {new Date(post.date).toLocaleDateString()} &middot;{" "}
                {post.tags?.join(", ")}
              </p>

              <p className="mt-4 text-gray-700 dark:text-gray-200 line-clamp-3">
                {post.description}
              </p>
            </div>

            <a
              href={`/blog/${post.slug}`}
              className="mt-6 inline-block text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              阅读更多 →
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}