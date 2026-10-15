"use client";

import { useFormStatus } from "react-dom";

// Submit button for a delete form that asks for confirmation first.
export function DeleteButton({ confirmText }: { confirmText: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
      className="text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
