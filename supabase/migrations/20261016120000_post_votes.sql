-- Extra: upvotes and downvotes on posts.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ============================================================
-- Table
-- ============================================================

-- One vote per user per post: +1 (up) or -1 (down). Removing a vote deletes the row.
create table public.votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index votes_user_id_idx on public.votes (user_id);

-- Running total of votes, kept up to date by the trigger below.
alter table public.posts add column score integer not null default 0;

-- ============================================================
-- Triggers
-- ============================================================

-- Only mark a post as edited when its title or body changes, not its score.
drop trigger posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update of title, body on public.posts
  for each row execute function public.set_updated_at();

-- Apply the change in vote value to the post's score.
create function public.apply_vote_to_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  delta integer :=
    coalesce(case when tg_op <> 'DELETE' then new.value end, 0)
    - coalesce(case when tg_op <> 'INSERT' then old.value end, 0);
  target uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts set score = score + delta where id = target;
  return null;
end;
$$;

revoke execute on function public.apply_vote_to_score() from public, anon, authenticated;

create trigger votes_apply_to_score
  after insert or update of value or delete on public.votes
  for each row execute function public.apply_vote_to_score();

-- ============================================================
-- Privileges
-- ============================================================

-- Signed-in users may vote and change or remove their vote. user_id comes
-- from the default; post_id can't be changed once cast. anon gets select so
-- pages can ask for "my vote" while signed out; RLS returns no rows to them.
grant select on public.votes to anon, authenticated;
grant insert (post_id, value), update (value), delete on public.votes to authenticated;

-- ============================================================
-- Row-level security
-- ============================================================

alter table public.votes enable row level security;

-- Votes are private: users see only their own. Totals are public via posts.score.
create policy "Users can see their own votes"
  on public.votes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can cast their own votes"
  on public.votes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can change their own votes"
  on public.votes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can remove their own votes"
  on public.votes for delete
  to authenticated
  using ((select auth.uid()) = user_id);
