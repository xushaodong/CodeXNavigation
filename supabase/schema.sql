-- 哈特导航 Supabase SQL Schema
-- 执行顺序：直接在 Supabase SQL Editor 一次执行即可

begin;

-- 1) Extension
create extension if not exists pgcrypto;

-- 2) updated_at 自动更新时间
create or replace function public.dh_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) 用户配置表（与 auth.users 一一映射）
create table if not exists public.dh_users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  theme_mode text not null default 'light' check (theme_mode in ('light', 'dark')),
  theme_color text not null default '#7c5cff',
  layout_mode text not null default 'grid' check (layout_mode in ('grid', 'drawer', 'list')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_dh_users_updated_at
before update on public.dh_users
for each row execute function public.dh_set_updated_at();

-- 4) 分类表（支持一级/二级）
create table if not exists public.dh_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid null references public.dh_categories(id) on delete cascade,
  name text not null,
  icon text,
  sort_order integer not null default 0,
  bg_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dh_categories_user_id on public.dh_categories(user_id);
create index if not exists idx_dh_categories_parent_id on public.dh_categories(parent_id);
create unique index if not exists uq_dh_categories_user_parent_name
on public.dh_categories(user_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

create trigger trg_dh_categories_updated_at
before update on public.dh_categories
for each row execute function public.dh_set_updated_at();

-- 5) 书签表
create table if not exists public.dh_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.dh_categories(id) on delete cascade,
  title text not null,
  url text not null,
  icon_type text not null default 'fav' check (icon_type in ('upload', 'builtin', 'fav')),
  icon_value text,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dh_bookmarks_user_id on public.dh_bookmarks(user_id);
create index if not exists idx_dh_bookmarks_category_id on public.dh_bookmarks(category_id);
create index if not exists idx_dh_bookmarks_user_category_sort on public.dh_bookmarks(user_id, category_id, sort_order);

create trigger trg_dh_bookmarks_updated_at
before update on public.dh_bookmarks
for each row execute function public.dh_set_updated_at();

-- 6) 分享表
create table if not exists public.dh_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  snapshot jsonb not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dh_shares_user_id on public.dh_shares(user_id);
create index if not exists idx_dh_shares_is_public on public.dh_shares(is_public);

create trigger trg_dh_shares_updated_at
before update on public.dh_shares
for each row execute function public.dh_set_updated_at();

-- 7) Row Level Security
alter table public.dh_users enable row level security;
alter table public.dh_categories enable row level security;
alter table public.dh_bookmarks enable row level security;
alter table public.dh_shares enable row level security;

-- dh_users：仅本人可读写
create policy "dh_users_select_own"
on public.dh_users
for select
using (auth.uid() = id);

create policy "dh_users_insert_own"
on public.dh_users
for insert
with check (auth.uid() = id);

create policy "dh_users_update_own"
on public.dh_users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- dh_categories：仅本人可读写
create policy "dh_categories_select_own"
on public.dh_categories
for select
using (auth.uid() = user_id);

create policy "dh_categories_insert_own"
on public.dh_categories
for insert
with check (auth.uid() = user_id);

create policy "dh_categories_update_own"
on public.dh_categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "dh_categories_delete_own"
on public.dh_categories
for delete
using (auth.uid() = user_id);

-- dh_bookmarks：仅本人可读写
create policy "dh_bookmarks_select_own"
on public.dh_bookmarks
for select
using (auth.uid() = user_id);

create policy "dh_bookmarks_insert_own"
on public.dh_bookmarks
for insert
with check (auth.uid() = user_id);

create policy "dh_bookmarks_update_own"
on public.dh_bookmarks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "dh_bookmarks_delete_own"
on public.dh_bookmarks
for delete
using (auth.uid() = user_id);

-- dh_shares：本人可写；公开分享可匿名只读
create policy "dh_shares_select_public_or_owner"
on public.dh_shares
for select
using (is_public = true or auth.uid() = user_id);

create policy "dh_shares_insert_own"
on public.dh_shares
for insert
with check (auth.uid() = user_id);

create policy "dh_shares_update_own"
on public.dh_shares
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "dh_shares_delete_own"
on public.dh_shares
for delete
using (auth.uid() = user_id);

commit;
