import fs from "fs";
import path from "path";
import matter from "gray-matter";

const blogDir = path.join(process.cwd(), "content/blog");

function getFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

export function getAllPosts() {
  const files = getFilesRecursively(blogDir);

  const posts = files.map((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content);

    // 计算 slug，去掉 content/blog 前缀和 .md 后缀
    const slug = path
      .relative(blogDir, filePath)
      .replace(/\\/g, "/") // Windows 路径兼容
      .replace(/\.md$/, "");

    const rawDate = data.date ? new Date(data.date) : new Date();
    const date = isNaN(rawDate.getTime()) ? new Date() : rawDate;

    return {
      slug,
      title: data.title,
      date,
      description: data.description || data.desc || "",
      category: data.category || "blog",
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}