"use server";

import { refresh } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Up (1) or down (-1). Voting the same way again removes the vote;
// voting the other way switches it. posts.score is updated by a trigger.
export async function vote(postId: string, value: 1 | -1) {
  if (value !== 1 && value !== -1) throw new Error("Invalid vote.");

  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);
  if (!userId) throw new Error("Please sign in to vote.");

  const mine = supabase
    .from("votes")
    .select("value")
    .eq("post_id", postId)
    .eq("user_id", userId);
  const { data: existing, error } = await mine.maybeSingle();
  if (error) throw new Error(error.message);

  const result = !existing
    ? await supabase.from("votes").insert({ post_id: postId, value })
    : existing.value === value
      ? await supabase
          .from("votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)
      : await supabase
          .from("votes")
          .update({ value })
          .eq("post_id", postId)
          .eq("user_id", userId);
  if (result.error) throw new Error(result.error.message);

  refresh();
}
