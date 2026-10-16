export type Author = { username: string } | null;

// Row-level security returns only the signed-in user's own vote, if any.
export type MyVote = { value: -1 | 1 }[];

export type PostSummary = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  score: number;
  author: Author;
  comments: { count: number }[];
  my_vote: MyVote;
};

export type Post = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  score: number;
  author: Author;
  my_vote: MyVote;
};

export type Comment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: Author;
};
