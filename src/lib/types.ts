export type Author = { username: string } | null;

export type PostSummary = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  author: Author;
  comments: { count: number }[];
};

export type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: Author;
};

export type Comment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: Author;
};
