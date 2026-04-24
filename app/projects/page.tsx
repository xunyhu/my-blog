import Image from 'next/image';
import HomeButton from '@/app/components/HomeButton';
import { projects } from '@/app/data/projects';

export default function ProjectsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <HomeButton />

      {/* 标题 */}
      <h1 className="text-lg text-[#64748b] mb-10 pt-10 md:pt-0">项目案例</h1>

      {/* 项目列表 */}
      <div className="space-y-6">
        {projects.map((project) => (
          <div
            key={project.name}
            className="
              bg-white
              border border-[#e2e8f0]
              rounded-xl
              p-6
              transition
              hover:border-[#cbd5f5]
              hover:bg-[#fafbff]
            "
          >
            {/* 项目名称 */}
            <h2 className="text-base font-medium text-[#0f172a]">
              {project.name}
            </h2>

            {/* 技术栈 */}
            <div className="mt-2 flex flex-wrap gap-2">
              {project.tech.map((tag) => (
                <span
                  key={tag}
                  className="
                    px-2 py-0.5 text-xs
                    text-[#64748b]
                    bg-[#f8fafc]
                    border border-[#e2e8f0]
                    rounded-full
                  "
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 描述 */}
            <p className="mt-3 text-sm text-[#64748b] leading-relaxed">
              {project.desc}
            </p>

            {/* 亮点 */}
            <ul className="mt-3 text-sm text-[#64748b] space-y-1">
              {project.highlights.map((item, index) => (
                <li key={index}>- {item}</li>
              ))}
            </ul>

            {/* Demo / 小程序码 */}
            <div className="mt-5 flex flex-wrap gap-6 items-start">
              {project.demo.map((demo, index) => {
                if (demo.type === 'qrcode') {
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <Image
                        src={demo.url}
                        alt="二维码"
                        width={100}
                        height={100}
                        className="
                          border border-[#e2e8f0]
                          rounded-md
                          transition
                          hover:scale-105
                        "
                      />
                      {demo.note && (
                        <div className="text-xs text-[#94a3b8] leading-relaxed">
                          {demo.note}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={index}
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-block
                      self-center
                      px-3 py-1
                      text-sm
                      text-[#475569]
                      bg-[#f8fafc]
                      border border-[#e2e8f0]
                      rounded-md
                      hover:bg-[#f1f5f9]
                      transition
                    "
                  >
                    {demo.label || '查看项目'}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
