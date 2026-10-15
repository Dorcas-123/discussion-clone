"use client";

import { useActionState, useState } from "react";
import {
  deleteComment,
  updateComment,
  type CommentFormState,
} from "@/app/comments/actions";
import { DeleteButton } from "@/components/delete-button";

type Props = {
  id: string;
  body: string;
  username: string;
  // Formatted on the server so it matches between server and browser.
  when: string;
  edited: boolean;
  isAuthor: boolean;
};

export function CommentItem({ id, body, username, when, edited, isAuthor }: Props) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: CommentFormState, formData: FormData) => {
      const result = await updateComment(id, prev, formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    undefined,
  );

  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">
        u/{username} · {when}
        {edited && " · edited"}
      </p>

      {editing ? (
        <form action={action} className="mt-2 space-y-2">
          <label htmlFor={`edit-${id}`} className="sr-only">
            Edit comment
          </label>
          <textarea
            id={`edit-${id}`}
            name="body"
            required
            rows={3}
            maxLength={5000}
            defaultValue={state?.body ?? body}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {state?.error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-3 py-1 font-medium text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
      )}

      {isAuthor && !editing && (
        <div className="mt-2 flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-muted hover:text-foreground"
          >
            Edit
          </button>
          <form action={deleteComment.bind(null, id)}>
            <DeleteButton confirmText="Delete this comment?" />
          </form>
        </div>
      )}
    </li>
  );
}
