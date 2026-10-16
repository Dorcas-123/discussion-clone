import Link from "next/link";
import { Suspense } from "react";
import { VoteButtons } from "@/components/vote-buttons";
import { getCurrentUserId } from "@/lib/auth";
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
  const [userId, { data, error }] = await Promise.all([
    getCurrentUserId(supabase),
    supabase
      .from("posts")
      .select(
        "id, title, body, created_at, score, author:profiles!posts_author_id_fkey(username), comments(count), my_vote:votes(value)",
      )
      .order("created_at", { ascending: false })
      .overrideTypes<PostSummary[], { merge: false }>(),
  ]);

  if (error) throw new Error(error.message);

  if (data.length === 0) {
    return <p className="text-muted">No posts yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((post) => {
        const commentCount = post.comments[0]?.count ?? 0;
        return (
          <li
            key={post.id}
            className="flex gap-2 rounded-lg border border-border bg-surface py-3 pr-4 pl-2 transition-colors hover:border-muted"
          >
            <VoteButtons
              postId={post.id}
              score={post.score}
              myVote={post.my_vote[0]?.value ?? 0}
              signedIn={userId !== null}
            />
            <Link href={`/posts/${post.id}`} className="block min-w-0 flex-1">
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
