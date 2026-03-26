import HomeButton from '@/app/components/HomeButton';

export default function ProjectsPage() {
  const projects = [
    {
      name: '页面搭建系统',
      tech: ['React', 'Schema', '低代码'],
      desc: '支持拖拽组件与 schema 渲染的页面搭建平台',
      highlights: [
        '动态 schema 渲染引擎',
        '组件拖拽与配置面板',
        '多端适配（H5 + 小程序）',
      ],
      demo: '#',
    },
    {
      name: '酒店 SaaS 商城',
      tech: ['Vue', '小程序', '公众号'],
      desc: '帮助酒店实现订房与商城一体化运营',
      highlights: [
        '多端统一业务逻辑',
        '复杂表单配置系统',
        '公众号 + 小程序打通',
      ],
      demo: '#',
    },
  ];

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <HomeButton />

      {/* 标题 */}
      <h1 className="text-lg text-[#64748b] mb-10">项目实战</h1>

      {/* 列表 */}
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
            {/* 标题 */}
            <h2 className="text-base font-medium text-[#0f172a]">
              {project.name}
            </h2>

            {/* 技术栈（统一标签风格） */}
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
            <p className="mt-3 text-sm text-[#64748b]">{project.desc}</p>

            {/* 亮点 */}
            <ul className="mt-3 text-sm text-[#64748b] space-y-1">
              {project.highlights.map((item, index) => (
                <li key={index}>- {item}</li>
              ))}
            </ul>

            {/* 操作 */}
            <div className="mt-4">
              <a
                href={project.demo}
                className="
                  text-sm
                  text-[#64748b]
                  hover:text-[#3b82f6]
                  transition
                "
              >
                查看项目 →
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
