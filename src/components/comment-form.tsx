"use client";

import { useActionState } from "react";
import { createComment } from "@/app/comments/actions";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(
    createComment.bind(null, postId),
    undefined,
  );

  return (
    <form action={action} className="space-y-2">
      <label htmlFor="new-comment" className="sr-only">
        Add a comment
      </label>
      <textarea
        id="new-comment"
        name="body"
        required
        rows={3}
        maxLength={5000}
        placeholder="What are your thoughts?"
        defaultValue={state?.body}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Posting…" : "Comment"}
      </button>
    </form>
  );
}
