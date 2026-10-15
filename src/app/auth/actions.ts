"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
  | { error?: string; message?: string; email?: string; username?: string }
  | undefined;

// Must match the check constraint on profiles.username.
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/;
const MIN_PASSWORD_LENGTH = 6;

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const keep = { email, username };

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ...keep,
      error: "Username must be 3–24 letters, numbers or underscores.",
    };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ...keep,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const supabase = await createClient();

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (taken) return { ...keep, error: "That username is already taken." };

  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { ...keep, error: error.message };

  // No session means Supabase is waiting for the user to confirm their email.
  if (!data.session) {
    return {
      ...keep,
      message: "Check your email for a confirmation link, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      email,
      error:
        error.code === "invalid_credentials"
          ? "Incorrect email or password."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
