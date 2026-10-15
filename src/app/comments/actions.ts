"use server";

import { refresh } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CommentFormState = { error?: string; body?: string } | undefined;

// Must match the check constraint on public.comments.
const MAX_BODY = 5000;

function readBody(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  let error: string | undefined;
  if (!body) error = "Comment can't be empty.";
  else if (body.length > MAX_BODY)
    error = `Comment must be ${MAX_BODY} characters or fewer.`;
  return { body, error };
}

export async function createComment(
  postId: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const { body, error } = readBody(formData);
  if (error) return { body, error };

  const supabase = await createClient();
  if (!(await getCurrentUserId(supabase))) {
    return { body, error: "Please sign in to comment." };
  }

  // author_id is filled in by the database from the signed-in user.
  const { error: insertError } = await supabase
    .from("comments")
    .insert({ post_id: postId, body });
  if (insertError) return { body, error: insertError.message };

  refresh();
  return {};
}

export async function updateComment(
  id: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const { body, error } = readBody(formData);
  if (error) return { body, error };

  const supabase = await createClient();
  // Row-level security only lets authors update their own comments;
  // anything else matches zero rows.
  const { data, error: updateError } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", id)
    .select("id");
  if (updateError) return { body, error: updateError.message };
  if (data.length === 0) {
    return { body, error: "You can only edit your own comments." };
  }

  refresh();
  return {};
}

export async function deleteComment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  refresh();
}
