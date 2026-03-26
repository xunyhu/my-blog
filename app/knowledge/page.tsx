import Link from 'next/link';
import HomeButton from '@/app/components/HomeButton';
import { getKnowledgeMap } from '@/lib/blog';

export default function KnowledgePage() {
  const knowledgeMap = getKnowledgeMap();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <HomeButton />

      <h1 className="text-lg text-[#64748b] mb-10">前端知识体系</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {knowledgeMap.map((section) => (
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
                <li key={item.name}>
                  <Link
                    href={item.slug}
                    className="text-sm text-[#64748b] hover:text-[#3b82f6]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
