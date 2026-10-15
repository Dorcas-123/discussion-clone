import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createPost } from "@/app/posts/actions";
import { PostForm } from "@/components/post-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "New post · Discussion Clone" };

export default function SubmitPage() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h1 className="mb-4 text-xl font-semibold">Create a post</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <SubmitForm />
      </Suspense>
    </div>
  );
}

async function SubmitForm() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <p className="text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="text-accent hover:underline">
          create an account
        </Link>{" "}
        to post.
      </p>
    );
  }

  return <PostForm action={createPost} submitLabel="Post" cancelHref="/" />;
}
