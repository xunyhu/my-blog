import Link from 'next/link';
import HomeButton from '@/app/components/HomeButton';
import { getAIEngineerMap } from '@/lib/blog';

export default function AIEngineerPage() {
  const aiEngineerMap = getAIEngineerMap();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <HomeButton />

      <div className="mb-10 pt-10 md:pt-0">
        <h1 className="text-lg text-[#64748b]">AI Engineer</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          LLM · Agent · RAG · MCP
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiEngineerMap.map((section) => (
          <div
            key={section.title}
            className="
              bg-white border border-[#e2e8f0]
              rounded-xl p-5
              transition
              hover:border-[#cbd5f5]
              hover:bg-[#fafbff]
            "
          >
            <h2 className="text-sm font-medium text-[#0f172a] mb-3">
              {section.title}
            </h2>

            <ul className="space-y-2">
              {section.children.map((item) => (
                <li key={item.name} className="flex items-center gap-2">
                  <Link
                    href={item.slug}
                    className={`text-sm hover:text-[#3b82f6] ${
                      item.status === 'outline'
                        ? 'text-[#94a3b8]'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {item.name}
                  </Link>
                  {item.status === 'outline' && (
                    <span className="shrink-0 rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] text-[#94a3b8]">
                      待完善
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
