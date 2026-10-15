import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updatePost } from "@/app/posts/actions";
import { PostForm } from "@/components/post-form";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit post · Discussion Clone" };

export default function EditPostPage({
  params,
}: PageProps<"/posts/[id]/edit">) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h1 className="mb-4 text-xl font-semibold">Edit post</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        {params.then(({ id }) => (
          <EditForm id={id} />
        ))}
      </Suspense>
    </div>
  );
}

async function EditForm({ id }: { id: string }) {
  const supabase = await createClient();
  const [userId, { data: post }] = await Promise.all([
    getCurrentUserId(supabase),
    supabase
      .from("posts")
      .select("author_id, title, body")
      .eq("id", id)
      .maybeSingle(),
  ]);

  // Hide the form unless the signed-in user wrote this post.
  if (!post || post.author_id !== userId) notFound();

  return (
    <PostForm
      action={updatePost.bind(null, id)}
      initial={{ title: post.title, body: post.body }}
      submitLabel="Save changes"
      cancelHref={`/posts/${id}`}
    />
  );
}
