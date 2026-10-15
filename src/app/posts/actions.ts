"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PostFormState =
  | { error?: string; title?: string; body?: string }
  | undefined;

// Must match the check constraints on public.posts.
const MAX_TITLE = 300;
const MAX_BODY = 10000;

function readPost(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  let error: string | undefined;
  if (!title) error = "Please add a title.";
  else if (title.length > MAX_TITLE)
    error = `Title must be ${MAX_TITLE} characters or fewer.`;
  else if (body.length > MAX_BODY)
    error = `Text must be ${MAX_BODY} characters or fewer.`;
  return { title, body, error };
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { title, body, error } = readPost(formData);
  if (error) return { title, body, error };

  const supabase = await createClient();
  if (!(await getCurrentUserId(supabase))) {
    return { title, body, error: "Please sign in to post." };
  }

  // author_id is filled in by the database from the signed-in user.
  const { data, error: insertError } = await supabase
    .from("posts")
    .insert({ title, body })
    .select("id")
    .single();
  if (insertError) return { title, body, error: insertError.message };

  revalidatePath("/");
  redirect(`/posts/${data.id}`);
}

export async function updatePost(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { title, body, error } = readPost(formData);
  if (error) return { title, body, error };

  const supabase = await createClient();
  // Row-level security only lets authors update their own posts; anything
  // else matches zero rows.
  const { data, error: updateError } = await supabase
    .from("posts")
    .update({ title, body })
    .eq("id", id)
    .select("id");
  if (updateError) return { title, body, error: updateError.message };
  if (data.length === 0) {
    return { title, body, error: "You can only edit your own posts." };
  }

  revalidatePath("/");
  redirect(`/posts/${id}`);
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}
