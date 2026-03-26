export type Category = 'frontend' | 'projects';

export type Tag = {
  name: string;
  slug: string;
};

export type Post = {
  title: string;
  slug: string;
  date: number;
  description: string;
  category: Category;
  tags: Tag[];
};
