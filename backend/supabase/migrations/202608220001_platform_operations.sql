-- Platform operations: customer management, wishlist, discounts, CMS and analytics.

create table if not exists public.wishlists (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  product_slug text not null references public.products(slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_slug)
);

create table if not exists public.discounts (
  id bigserial primary key,
  code text not null unique,
  kind text not null default 'percentage' check (kind in ('percentage', 'fixed')),
  amount numeric(12, 2) not null check (amount > 0),
  minimum_order numeric(12, 2) not null default 0 check (minimum_order >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_content (
  id bigserial primary key,
  content_key text not null unique,
  title text not null,
  body text not null default '',
  image text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigserial primary key,
  event_name text not null,
  path text,
  user_id bigint references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wishlists_user_id on public.wishlists(user_id);
create index if not exists idx_discounts_active on public.discounts(active, expires_at);
create index if not exists idx_cms_content_status on public.cms_content(status);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_name on public.analytics_events(event_name);

alter table public.wishlists enable row level security;
alter table public.discounts enable row level security;
alter table public.cms_content enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Users manage own wishlist" on public.wishlists;
create policy "Users manage own wishlist" on public.wishlists for all to authenticated
using (exists (select 1 from public.users u where u.id = user_id and lower(u.email) = lower(auth.jwt() ->> 'email')) or public.is_admin())
with check (exists (select 1 from public.users u where u.id = user_id and lower(u.email) = lower(auth.jwt() ->> 'email')) or public.is_admin());

drop policy if exists "Admins manage discounts" on public.discounts;
create policy "Admins manage discounts" on public.discounts for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read published content" on public.cms_content;
create policy "Public read published content" on public.cms_content for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "Admins manage content" on public.cms_content;
create policy "Admins manage content" on public.cms_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users create analytics events" on public.analytics_events;
create policy "Users create analytics events" on public.analytics_events for insert to anon, authenticated with check (true);
drop policy if exists "Admins read analytics events" on public.analytics_events;
create policy "Admins read analytics events" on public.analytics_events for select to authenticated using (public.is_admin());
