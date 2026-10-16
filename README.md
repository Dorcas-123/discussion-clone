# Discussion Clone

A small Reddit-style discussion board. Live at https://discussion-clone.vercel.app

Built with Next.js, Supabase, GitHub, Vercel and Claude Code.

## Features

- Browse text posts (newest first) and open a post to read its discussion.
- Sign up with a username, email and password; sign in and sign out.
- Signed-in users can publish posts and comment on any post.
- Authors can edit or delete only their own posts and comments.
- Everyone, signed in or not, can read posts and comments.
- **Extra (beyond the brief):** signed-in users can upvote or downvote posts.
  One vote per user per post; click again to remove it, or the other arrow to
  switch. Scores are public; who voted which way is private.

Out of scope: subreddits, messaging, notifications, image uploads and live
updates. Refresh the page to see new content.

## How it works

- **Database:** three core Supabase tables: `profiles`, `posts` and
  `comments`. The schema, a sign-up trigger that creates profiles, and the
  row-level security policies are in
  [`supabase/migrations/`](supabase/migrations/20261015120000_initial_schema.sql).
  The voting extra adds a fourth table, `votes`, and a `posts.score` column
  that a trigger keeps up to date
  ([migration](supabase/migrations/20261016120000_post_votes.sql)).
- **Security:** row-level security lets anyone read, but only the author can
  update or delete a row. The database sets `author_id` from the signed-in
  user, so nobody can post as someone else. The app hides Edit and Delete
  from non-authors, but the database enforces the rule even if the app is
  bypassed.
- **App:** Next.js App Router with Server Components and Server Actions.
  `src/proxy.ts` refreshes the Supabase session cookie on each request.

## Run locally

1. In a Supabase project, run both migration files in order in the SQL Editor, and turn
   off **Authentication → Sign In / Providers → Email → Confirm email**.
2. Copy `.env.example` to `.env.local` and fill in the project URL and
   publishable key from **Project Settings → API Keys**.
3. `npm install`, then `npm run dev`, and open http://localhost:3000.

On Vercel, set the same two environment variables in the project settings.

## Testing

Tested by hand with two accounts on the live site, and with scripted browser
checks covering:

- sign-up (including a taken username), sign-in, wrong password, sign-out,
  and staying signed in after a reload;
- creating, editing and deleting posts and comments;
- signed-out visitors can read but see no comment box or Edit/Delete;
- a second account sees no Edit/Delete on the first account's content and
  can't open its edit page;
- direct database calls with the second account's session can't update,
  delete, or post as the first account, and signed-out calls can't write.
