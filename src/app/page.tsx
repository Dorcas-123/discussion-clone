import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import type { PostSummary } from "@/lib/types";

export default function Home() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Latest posts</h1>
        <Link
          href="/submit"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Create post
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted">Loading posts…</p>}>
        <PostList />
      </Suspense>
    </>
  );
}

async function PostList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, body, created_at, author:profiles(username), comments(count)",
    )
    .order("created_at", { ascending: false })
    .overrideTypes<PostSummary[], { merge: false }>();

  if (error) throw new Error(error.message);

  if (data.length === 0) {
    return <p className="text-muted">No posts yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((post) => {
        const commentCount = post.comments[0]?.count ?? 0;
        return (
          <li key={post.id}>
            <Link
              href={`/posts/${post.id}`}
              className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-muted"
            >
              <p className="text-xs text-muted">
                u/{post.author?.username ?? "deleted"} ·{" "}
                {timeAgo(post.created_at)}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{post.title}</h2>
              {post.body && (
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm">
                  {post.body}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
