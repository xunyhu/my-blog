import path from 'path';
import { getFileContent } from './reader';

type ContentType = 'blog' | 'knowledge';

export function getContent(type: ContentType, slug: string[]) {
  const baseMap = {
    blog: 'content/blog',
    knowledge: 'content/frontend-knowledge',
  };

  if (type === 'knowledge') {
    slug = slug.map((s) => decodeURIComponent(s));
  }

  const filePath = path.join(process.cwd(), baseMap[type], ...slug) + '.md';

  return getFileContent(filePath);
}
