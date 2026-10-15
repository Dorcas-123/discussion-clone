"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { PostFormState } from "@/app/posts/actions";

type Props = {
  action: (state: PostFormState, formData: FormData) => Promise<PostFormState>;
  initial?: { title: string; body: string };
  submitLabel: string;
  cancelHref: string;
};

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent";

export function PostForm({ action, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Title
        <input
          name="title"
          required
          maxLength={300}
          defaultValue={state?.title ?? initial?.title}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Text <span className="font-normal text-muted">(optional)</span>
        <textarea
          name="body"
          rows={8}
          maxLength={10000}
          defaultValue={state?.body ?? initial?.body}
          className={inputClass}
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
