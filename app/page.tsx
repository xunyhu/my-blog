import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { Tag } from '@/types/blog';
import { FaGithub } from 'react-icons/fa';
import HeroParticles from './components/HeroParticles';

export default async function HomePage() {
  const posts = getAllPosts();

  // 🔹 最新文章取最近 6 篇
  const latestPosts = posts.slice(0, 6);

  return (
    <main className="p-8 max-w-7xl mx-auto pt-0">
      {/* Hero 区 */}
      <HeroParticles />
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-500 text-white py-20 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">HuRui.dev</h1>
          <p className="text-xl mb-6 animate-fade-in-up">
            记录前端知识体系与真实项目经验，从会写代码到工程化实践
          </p>
          <div className="flex justify-center flex-wrap gap-4 animate-fade-in-up animation-delay-200">
            <Link
              href="/blog"
              className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold shadow hover:shadow-lg hover:bg-gray-100 transition transform hover:scale-105"
            >
              查看博客
            </Link>

            <Link
              href="/projects"
              className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold shadow hover:shadow-lg hover:bg-gray-100 transition transform hover:scale-105"
            >
              查看项目
            </Link>
          </div>
        </div>

        {/* 社交链接图标 - 右下角 */}
        <div className="absolute bottom-6 right-6 flex gap-3 z-20">
          <a
            href="https://github.com/xunyhu"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-all hover:scale-110"
            aria-label="GitHub"
          >
            <FaGithub className="w-5 h-5" />
          </a>
          <a
            href="https://juejin.cn/user/2260251640083950"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-all hover:scale-110"
            aria-label="掘金"
          >
            {/* 掘金自定义 SVG 图标 */}
            <svg
              className="w-5 h-5"
              viewBox="0 0 1024 1024"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M512 0L256 192v384l256 192 256-192V192L512 0z m0 853.333L341.333 725.333V384L512 512l170.667-128v341.333L512 853.333z" />
            </svg>
          </a>
        </div>
      </section>

      {/* 分类入口卡片 */}
      <div className="container mx-auto px-4 mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Link
          href="/blog/frontend"
          className="p-6 bg-white shadow rounded-lg hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">前端知识体系</h3>
          <p className="text-gray-600">系统整理前端基础与高级知识</p>
        </Link>
        <Link
          href="/blog/projects"
          className="p-6 bg-white shadow rounded-lg hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">项目经验笔记</h3>
          <p className="text-gray-600">
            动态渲染商品、权限系统、骨架屏等项目实战
          </p>
        </Link>
      </div>

      {/* 最新文章列表 */}
      <section className="container mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold mb-6">最新文章</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {latestPosts.map((post) => (
            <div
              key={post.slug}
              className="p-6 bg-white shadow rounded-lg hover:shadow-lg transition"
            >
              <Link href={`/blog/post/${post.slug}`}>
                <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-2">{post.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.tags.map((tag: Tag) => (
                    <span
                      key={tag.slug}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </Link>
            </div>
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
