import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; username: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

// The signed-in user's id, or null when signed out.
export async function getCurrentUserId(supabase: Supabase) {
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

// The signed-in user with their profile username, or null when signed out.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const id = await getCurrentUserId(supabase);
  if (!id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", id)
    .maybeSingle();

  return { id, username: profile?.username ?? "unknown" };
}
