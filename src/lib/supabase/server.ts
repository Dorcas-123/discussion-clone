import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// Supabase client for Server Components, Server Actions and Route Handlers.
// Reads the signed-in user's session from cookies (used from step 4 on).
export async function createClient() {
  // The auth client reads the clock as it starts, which Next.js rejects
  // during prerendering, so only create it while handling a real request.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies. Safe to ignore once a
            // proxy refreshes sessions (added with accounts in step 4).
          }
        },
      },
    },
  );
}
