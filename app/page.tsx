import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { Tag } from '@/types/blog';
import { FaGithub } from 'react-icons/fa';
import HeroParticles from './components/HeroParticles';

export default async function HomePage() {
  const posts = getAllPosts();
  const latestPosts = posts.slice(0, 6);

  const techStack = [
    'React',
    'Next.js',
    'TypeScript',
    'Node.js',
    'Vue',
    '微前端',
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#eef2ff] to-[#f8fafc] py-16 md:py-20 md:pb-12">
        <HeroParticles />

        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center">
            <h1 className="text-5xl font-semibold tracking-tight text-[#0f172a]">
              HuRui.dev
            </h1>

            <p className="mt-4 text-[#475569]">前端工程师</p>
            <p className="mt-2 text-sm text-[#94a3b8]">
              写不出 UI 的时候，就说这是设计问题
            </p>

            <div className="mt-6 flex items-center gap-4">
              {/* GitHub */}
              <a
                href="https://github.com/xunyhu"
                target="_blank"
                rel="noopener noreferrer"
                className="
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white border border-[#e2e8f0]
            text-[#64748b]
            hover:text-[#3b82f6]
            hover:border-[#cbd5f5]
            transition
          "
              >
                <FaGithub size={18} />
              </a>

              {/* 掘金 */}
              <a
                href="https://juejin.cn/user/2260251640083950"
                target="_blank"
                rel="noopener noreferrer"
                className="
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white border border-[#e2e8f0]
            text-[#64748b]
            hover:text-[#3b82f6]
            hover:border-[#cbd5f5]
            transition
          "
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 1024 1024"
                  fill="currentColor"
                >
                  <path d="M512 0L256 192v384l256 192 256-192V192L512 0z m0 853.333L341.333 725.333V384L512 512l170.667-128v341.333L512 853.333z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 技术栈 */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-wrap justify-center gap-2">
          {techStack.map((t) => (
            <span
              key={t}
              className="
                px-3 py-1 text-xs
                text-[#475569]
                bg-white
                border border-[#e2e8f0]
                rounded-full
              "
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* 卡片 */}
      <section className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-4">
        <Link
          href="/knowledge"
          className="
            p-6 rounded-xl
            bg-white border border-[#e2e8f0]
            hover:shadow-sm hover:-translate-y-0.5
            transition
          "
        >
          <h3 className="font-medium text-[#0f172a]">前端知识体系</h3>
          <p className="text-sm text-[#64748b] mt-2">
            JS · React · 工程化 · 架构
          </p>
        </Link>

        <Link
          href="/projects"
          className="
            p-6 rounded-xl
            bg-white border border-[#e2e8f0]
            hover:shadow-sm hover:-translate-y-0.5
            transition
          "
        >
          <h3 className="font-medium text-[#0f172a]">项目实战</h3>
          <p className="text-sm text-[#64748b] mt-2">SaaS · 电商 · 权限系统</p>
        </Link>
      </section>

      {/* 文章 */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm text-[#64748b]">最新博客</h2>

          <Link href="/blog" className="text-xs text-[#7a8393] hover:underline">
            查看全部 →
          </Link>
        </div>

        <div className="space-y-3">
          {latestPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/post/${post.slug}?from=home`}
              className="
                block p-4 rounded-lg
                bg-white border border-[#e2e8f0]
                hover:border-[#cbd5f5]
                transition
              "
            >
              <h3 className="text-m font-medium">{post.title}</h3>

              <p className="text-s text-[#64748b] mt-1">{post.description}</p>

              <div className="flex gap-2 mt-2 flex-wrap">
                {post.tags.map((tag: Tag) => (
                  <span key={tag.slug} className="text-[12px] text-[#94a3b8]">
                    #{tag.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="py-10 text-center text-[#94a3b8] text-xs">
        © {new Date().getFullYear()} HuRui.dev
      </footer>
    </main>
  );
}
