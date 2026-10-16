import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deletePost } from "@/app/posts/actions";
import { CommentForm } from "@/components/comment-form";
import { CommentItem } from "@/components/comment-item";
import { DeleteButton } from "@/components/delete-button";
import { VoteButtons } from "@/components/vote-buttons";
import { getCurrentUserId } from "@/lib/auth";
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

  const [userId, postResult, commentsResult] = await Promise.all([
    getCurrentUserId(supabase),
    supabase
      .from("posts")
      .select(
        "id, author_id, title, body, created_at, updated_at, score, author:profiles!posts_author_id_fkey(username), my_vote:votes(value)",
      )
      .eq("id", id)
      .maybeSingle()
      .overrideTypes<Post | null, { merge: false }>(),
    supabase
      .from("comments")
      .select(
        "id, author_id, body, created_at, updated_at, author:profiles(username)",
      )
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
  const isAuthor = userId === post.author_id;
  const edited = post.updated_at !== post.created_at;

  return (
    <>
      <article className="mt-4 flex gap-2 rounded-lg border border-border bg-surface py-5 pr-5 pl-2">
        <VoteButtons
          postId={post.id}
          score={post.score}
          myVote={post.my_vote[0]?.value ?? 0}
          signedIn={userId !== null}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            u/{post.author?.username ?? "deleted"} · {timeAgo(post.created_at)}
            {edited && " · edited"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{post.title}</h1>
          {post.body && (
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">
              {post.body}
            </p>
          )}
          {isAuthor && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <Link
                href={`/posts/${post.id}/edit`}
                className="text-muted hover:text-foreground"
              >
                Edit
              </Link>
              <form action={deletePost.bind(null, post.id)}>
                <DeleteButton confirmText="Delete this post and all its comments?" />
              </form>
            </div>
          )}
        </div>
      </article>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>
        <div className="mb-4">
          {userId ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>{" "}
              to join the discussion.
            </p>
          )}
        </div>
        {comments.length === 0 ? (
          <p className="text-muted">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                id={comment.id}
                body={comment.body}
                username={comment.author?.username ?? "deleted"}
                when={timeAgo(comment.created_at)}
                edited={comment.updated_at !== comment.created_at}
                isAuthor={userId === comment.author_id}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
