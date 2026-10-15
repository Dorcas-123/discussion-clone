"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-accent";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const isSignup = mode === "signup";
  const [state, action, pending] = useActionState(
    isSignup ? signUp : signIn,
    undefined,
  );

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-border bg-surface p-6">
      <h1 className="text-xl font-semibold">
        {isSignup ? "Create an account" : "Sign in"}
      </h1>

      <form action={action} className="mt-4 space-y-4">
        {isSignup && (
          <label className="block text-sm font-medium">
            Username
            <input
              name="username"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]+"
              title="Letters, numbers and underscores only"
              autoComplete="username"
              defaultValue={state?.username}
              className={inputClass}
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state?.email}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={isSignup ? 6 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={inputClass}
          />
        </label>

        {state?.error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
        {state?.message && (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Please wait…" : isSignup ? "Sign up" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="text-accent hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
