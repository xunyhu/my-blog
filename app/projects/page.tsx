export default function ProjectsPage() {
  const projects = [
    {
      name: "页面搭建系统",
      tech: ["React", "Schema", "低代码"],
      desc: "支持拖拽组件与 schema 渲染的页面搭建平台",
      highlights: [
        "动态 schema 渲染引擎",
        "组件拖拽与配置面板",
        "多端适配（H5 + 小程序）",
      ],
      demo: "#",
      github: "#",
    },
    {
      name: "酒店 SaaS 商城",
      tech: ["Vue", "小程序", "公众号"],
      desc: "帮助酒店实现订房与商城一体化运营",
      highlights: [
        "多端统一业务逻辑",
        "复杂表单配置系统",
        "公众号 + 小程序打通",
      ],
      demo: "#",
      github: "#",
    },
  ];

  const techColors: Record<string, string> = {
    React: "bg-blue-200 text-blue-800",
    Vue: "bg-green-200 text-green-800",
    Schema: "bg-purple-200 text-purple-800",
    "低代码": "bg-yellow-200 text-yellow-800",
    小程序: "bg-cyan-200 text-cyan-800",
    公众号: "bg-pink-200 text-pink-800",
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
        项目展示
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div
            key={project.name}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-2 transition duration-300 p-6 flex flex-col justify-between"
          >
            {/* 项目名称 */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {project.name}
            </h2>

            {/* 技术栈 */}
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tech.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    techColors[tag] || "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 描述 */}
            <p className="mt-4 text-gray-700 dark:text-gray-200">
              {project.desc}
            </p>

            {/* 亮点 */}
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
              {project.highlights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* 链接 */}
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href={project.demo}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                在线体验 →
              </a>
              {/* <a
                href={project.github}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                GitHub →
              </a> */}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}