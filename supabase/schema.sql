-- =========================================================================
-- MLFI (Micro-Learning Flashcard Interface) — Database Schema
-- =========================================================================
-- This schema describes the structure the frontend expects from the backend.
-- It is designed for Supabase / PostgreSQL with Row Level Security (RLS).
--
-- Apply this in the Supabase SQL editor, or via the migration tool.
-- =========================================================================

-- ---------- Extensions -----------------------------------------------------
create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. PROFILES
-- One row per authenticated user. Holds learning stats shown in the UI
-- (streak, retention %, total reviews).
-- =========================================================================
create table if not exists public.spark_study_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    streak integer not null default 0,
    last_study_date date,
    total_reviews integer not null default 0,
    successful_reviews integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.spark_study_profiles enable row level security;

create policy "Profiles are viewable by owner" on public.spark_study_profiles for
select using (auth.uid () = id);

create policy "Profiles are insertable by owner" on public.spark_study_profiles for
insert
with
    check (auth.uid () = id);

create policy "Profiles are updatable by owner" on public.spark_study_profiles for
update using (auth.uid () = id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.spark_study_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 2. DECKS
-- A user-owned collection of flashcards. The frontend stores `color`
-- as a tailwind utility class (e.g. "bg-primary").
-- =========================================================================
create table if not exists public.spark_study_decks (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    color text not null default 'bg-primary',
    progress integer not null default 0 check (progress between 0 and 100),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists spark_study_decks_user_id_idx on public.spark_study_decks (user_id);

alter table public.spark_study_decks enable row level security;

create policy "Decks selectable by owner" on public.spark_study_decks for
select using (auth.uid () = user_id);

create policy "Decks insertable by owner" on public.spark_study_decks for
insert
with
    check (auth.uid () = user_id);

create policy "Decks updatable by owner" on public.spark_study_decks for
update using (auth.uid () = user_id);

create policy "Decks deletable by owner" on public.spark_study_decks for delete using (auth.uid () = user_id);

-- =========================================================================
-- 3. CARDS
-- The flashcards themselves. `template` matches the UI options
-- (Definition / Formula / Q&A / Diagram). `tags` is a string array.
-- Soft-delete via `deleted_at` powers the 30-day recovery bin.
-- =========================================================================
create table if not exists public.spark_study_cards (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.spark_study_decks(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  template    text not null default 'Q&A',
  front       text not null default '',
  back        text not null default '',
  tags        text[] not null default '{}',
  -- Spaced-repetition fields used by the Study tab
  interval    integer not null default 1,
  ease        numeric not null default 2.5,
  next_review timestamptz not null default now(),
  last_reviewed timestamptz,
  -- Soft delete (30-day recovery window enforced in the UI / a cron job)
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists spark_study_cards_deck_id_idx on public.spark_study_cards (deck_id);

create index if not exists spark_study_cards_user_id_idx on public.spark_study_cards (user_id);

create index if not exists spark_study_cards_next_review_idx on public.spark_study_cards (user_id, next_review)
where
    deleted_at is null;

alter table public.spark_study_cards enable row level security;

create policy "Cards selectable by owner" on public.spark_study_cards for
select using (auth.uid () = user_id);

create policy "Cards insertable by owner" on public.spark_study_cards for
insert
with
    check (auth.uid () = user_id);

create policy "Cards updatable by owner" on public.spark_study_cards for
update using (auth.uid () = user_id);

create policy "Cards deletable by owner" on public.spark_study_cards for delete using (auth.uid () = user_id);

-- =========================================================================
-- 4. CARD_HISTORY
-- Snapshots of edits, powering the Safety tab's "Version history".
-- The frontend keeps the last ~20 snapshots per card.
-- =========================================================================
create table if not exists public.spark_study_card_history (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.spark_study_cards(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  front       text not null,
  back        text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists spark_study_card_history_card_id_idx on public.spark_study_card_history (card_id, created_at desc);

alter table public.spark_study_card_history enable row level security;

create policy "History selectable by owner" on public.spark_study_card_history for
select using (auth.uid () = user_id);

create policy "History insertable by owner" on public.spark_study_card_history for
insert
with
    check (auth.uid () = user_id);

create policy "History deletable by owner" on public.spark_study_card_history for delete using (auth.uid () = user_id);

-- =========================================================================
-- 5. STUDY_EVENTS
-- One row each time a user marks a card "Know" or "Review again".
-- Powers retention %, streak and dashboard analytics.
-- =========================================================================
create type public.spark_study_result as enum ('know', 'again');

create table if not exists public.spark_study_study_events (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references auth.users (id) on delete cascade,
    card_id uuid not null references public.spark_study_cards (id) on delete cascade,
    deck_id uuid not null references public.spark_study_decks (id) on delete cascade,
    result public.spark_study_result not null,
    reviewed_at timestamptz not null default now()
);

create index if not exists spark_study_study_events_user_idx on public.spark_study_study_events (user_id, reviewed_at desc);

alter table public.spark_study_study_events enable row level security;

create policy "Events selectable by owner" on public.spark_study_study_events for
select using (auth.uid () = user_id);

create policy "Events insertable by owner" on public.spark_study_study_events for
insert
with
    check (auth.uid () = user_id);

-- =========================================================================
-- 6. updated_at triggers
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists spark_study_touch_profiles on public.spark_study_profiles;

create trigger spark_study_touch_profiles before update on public.spark_study_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists spark_study_touch_decks on public.spark_study_decks;

create trigger spark_study_touch_decks before update on public.spark_study_decks
  for each row execute function public.touch_updated_at();

drop trigger if exists spark_study_touch_cards on public.spark_study_cards;

create trigger spark_study_touch_cards before update on public.spark_study_cards
  for each row execute function public.touch_updated_at();