import path from 'path';
import { getFileContent } from './reader';

type ContentType = 'blog' | 'knowledge' | 'ai-engineer';

export function getContent(type: ContentType, slug: string[]) {
  const baseMap = {
    blog: 'content/blog',
    knowledge: 'content/frontend-knowledge',
    'ai-engineer': 'content/ai-engineer',
  };

  if (type === 'knowledge' || type === 'ai-engineer') {
    slug = slug.map((s) => decodeURIComponent(s));
  }

  const filePath = path.join(process.cwd(), baseMap[type], ...slug) + '.md';

  return getFileContent(filePath);
}
