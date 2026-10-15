import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";

// Header links: who is signed in and a sign-out button, or sign-in links.
export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/login" className="hover:text-accent">
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-accent px-3 py-1.5 font-medium text-white"
        >
          Sign up
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      <span className="text-muted">u/{user.username}</span>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-1.5 hover:border-muted"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
