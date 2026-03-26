import { Post, Category } from '../types/blog';

export function getTagsByCategory(posts: Post[], category?: Category) {
  const filtered = category
    ? posts.filter((p) => p.category === category)
    : posts;

  const map = new Map<string, { name: string; slug: string }>();

  filtered.forEach((post) => {
    post.tags.forEach((tag) => {
      map.set(tag.slug, tag);
    });
  });

  return Array.from(map.values());
}

export function filterPosts(
  posts: Post[],
  category?: Category,
  tagSlug?: string,
) {
  return posts.filter((post) => {
    if (category && post.category !== category) return false;

    if (tagSlug) {
      return post.tags.some((tag) => tag.slug === tagSlug);
    }

    return true;
  });
}

export const formatTags = (tags: { name: string }[]) =>
  tags.map((t) => t.name).join(' , ');
