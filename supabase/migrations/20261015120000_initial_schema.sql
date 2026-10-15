-- Step 2: tables and row-level security for the discussion clone.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ============================================================
-- Tables
-- ============================================================

-- One profile per auth user. Created automatically on sign-up (see trigger below).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  body text not null default '' check (char_length(body) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_author_id_idx on public.posts (author_id);
create index comments_post_id_created_at_idx on public.comments (post_id, created_at);
create index comments_author_id_idx on public.comments (author_id);

-- ============================================================
-- Triggers
-- ============================================================

-- Keep updated_at current whenever a post or comment is edited.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- Create a profile when someone signs up. Uses the username passed at sign-up
-- if it is valid and free, otherwise falls back to user_<first 8 chars of id>.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := trim(new.raw_user_meta_data ->> 'username');
begin
  if wanted is null
     or wanted !~ '^[A-Za-z0-9_]{3,24}$'
     or exists (select 1 from public.profiles where username = wanted) then
    wanted := 'user_' || left(new.id::text, 8);
  end if;

  insert into public.profiles (id, username) values (new.id, wanted);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Privileges (new tables are not exposed automatically)
-- ============================================================

-- Everyone may read. Signed-in users may write only the columns listed;
-- author_id and timestamps are filled in by defaults and triggers.
grant select on public.profiles, public.posts, public.comments to anon, authenticated;
grant update (username) on public.profiles to authenticated;
grant insert (title, body), update (title, body), delete on public.posts to authenticated;
grant insert (post_id, body), update (body), delete on public.comments to authenticated;

-- ============================================================
-- Row-level security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- profiles
create policy "Profiles are readable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- posts
create policy "Posts are readable by everyone"
  on public.posts for select
  to anon, authenticated
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- comments
create policy "Comments are readable by everyone"
  on public.comments for select
  to anon, authenticated
  using (true);

create policy "Users can create their own comments"
  on public.comments for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users can update their own comments"
  on public.comments for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using ((select auth.uid()) = author_id);
