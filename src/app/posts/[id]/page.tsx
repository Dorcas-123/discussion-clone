import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";
import type { Comment, Post } from "@/lib/types";

// Postgres error for malformed input, e.g. /posts/abc instead of a UUID.
const INVALID_TEXT_REPRESENTATION = "22P02";

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <>
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← All posts
      </Link>
      <Suspense fallback={<p className="mt-4 text-muted">Loading post…</p>}>
        {params.then(({ id }) => (
          <Discussion id={id} />
        ))}
      </Suspense>
    </>
  );
}

async function Discussion({ id }: { id: string }) {
  const supabase = await createClient();

  const [postResult, commentsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, body, created_at, author:profiles(username)")
      .eq("id", id)
      .maybeSingle()
      .overrideTypes<Post | null, { merge: false }>(),
    supabase
      .from("comments")
      .select("id, body, created_at, author:profiles(username)")
      .eq("post_id", id)
      .order("created_at", { ascending: true })
      .overrideTypes<Comment[], { merge: false }>(),
  ]);

  if (postResult.error?.code === INVALID_TEXT_REPRESENTATION) notFound();
  if (postResult.error) throw new Error(postResult.error.message);
  if (commentsResult.error) throw new Error(commentsResult.error.message);

  const post = postResult.data;
  if (!post) notFound();
  const comments = commentsResult.data;

  return (
    <>
      <article className="mt-4 rounded-lg border border-border bg-surface p-5">
        <p className="text-xs text-muted">
          u/{post.author?.username ?? "deleted"} · {timeAgo(post.created_at)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{post.title}</h1>
        {post.body && (
          <p className="mt-3 whitespace-pre-wrap leading-relaxed">
            {post.body}
          </p>
        )}
      </article>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>
        {comments.length === 0 ? (
          <p className="text-muted">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <p className="text-xs text-muted">
                  u/{comment.author?.username ?? "deleted"} ·{" "}
                  {timeAgo(comment.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {comment.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
