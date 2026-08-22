-- =========================================================
-- ほしい・やりたい 管理アプリ Supabase スキーマ
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行してください。
-- 何度でも安全に再実行できるよう if not exists / or replace を使っています。
--
-- 認証なしの個人利用アプリのため、RLS は「anon キーを持つ全員に許可」という
-- 最小限のポリシーにしています(データは公開URLの推測困難性のみで守られます)。
-- 家族・友人などに共有する予定がある場合は事前に相談してください。
-- =========================================================

create extension if not exists pgcrypto;

-- ---- 1. 欲しいもの > 日用品ストック ----
-- genre_tag はジャンル分類(食材/日用品など)。プリセット以外も自由入力で追加できる想定。
create table if not exists daily_stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  genre_tag text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---- 2. 欲しいもの > 欲しいものリスト ----
create table if not exists wish_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  decision_type text not null check (decision_type in ('instant', 'encounter')),
  budget_amount integer check (budget_amount is null or budget_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---- 3. 効率化したいこと ----
create table if not exists efficiency_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  priority text not null default 'mid' check (priority in ('high', 'mid', 'low')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_daily_stock_active on daily_stock_items(is_active);
create index if not exists idx_wish_items_active on wish_items(is_active);
create index if not exists idx_efficiency_status on efficiency_tasks(status);
create index if not exists idx_efficiency_completed_at on efficiency_tasks(completed_at);

-- =========================================================
-- RLS: anon キーで全操作を許可(個人利用・認証なし前提)
-- =========================================================

alter table daily_stock_items enable row level security;
alter table wish_items enable row level security;
alter table efficiency_tasks enable row level security;

drop policy if exists daily_stock_items_all on daily_stock_items;
create policy daily_stock_items_all on daily_stock_items for all using (true) with check (true);

drop policy if exists wish_items_all on wish_items;
create policy wish_items_all on wish_items for all using (true) with check (true);

drop policy if exists efficiency_tasks_all on efficiency_tasks;
create policy efficiency_tasks_all on efficiency_tasks for all using (true) with check (true);
