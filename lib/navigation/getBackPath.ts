const fromMap: Record<string, string> = {
  home: '/',
  frontend: '/blog/frontend',
  projects: '/blog/projects',
};

export function getBackPath({
  from,
  fallback,
}: {
  from?: string | null;
  fallback: string;
}) {
  if (!from) return fallback;
  return fromMap[from] || fallback;
}
