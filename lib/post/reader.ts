import fs from 'fs';
import matter from 'gray-matter';

export function getFileContent(filePath: string) {
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(raw);

  return { content, data };
}
