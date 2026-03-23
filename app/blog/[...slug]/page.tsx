import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import TOC from "@/app/components/TOC";


function extractHeadings(markdown: string) {
  const regex = /^(#{1,3})\s+(.*)/gm;
  const headings = [];
  let match;

  while ((match = regex.exec(markdown))) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/\s+/g, "-"),
    });
  }

  return headings;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const filePath = path.join(
    process.cwd(),
    "content/blog",
    `${slugPath}.md`
  );

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  const headings = extractHeadings(content);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex gap-10">
        {/* TOC */}
        <TOC headings={headings} />
        {/* 正文 */}
        <article className="prose prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeHighlight,
              rehypeSlug,
              rehypeAutolinkHeadings,
            ]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}