"use client";

import { useActiveHeading } from "../hooks/useActiveHeading";

interface TOCProps {
  headings: Array<{ id: string; text: string; level: number }>; 
}

export default function TOC({ headings } : TOCProps) {
  const activeId = useActiveHeading(headings);

  return (
    <aside className="w-64 hidden lg:block">
      <div className="sticky top-20">
        <h3 className="text-sm font-semibold mb-3">目录</h3>

        <ul className="text-sm space-y-2">
          {headings.map((h) => (
            <li
              key={h.id}
              className={
                h.level === 1
                  ? "ml-0"
                  : h.level === 2
                  ? "ml-4"
                  : "ml-8"
              }
            >
              <a
                href={`#${h.id}`}
                className={
                  activeId === h.id
                    ? "text-blue-600 font-medium"
                    : "text-gray-600 hover:text-black"
                }
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}