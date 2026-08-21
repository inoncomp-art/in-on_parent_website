alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists skin_type text;
alter table public.users add column if not exists skin_concerns text;

create table if not exists public.addresses (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_addresses_user_id on public.addresses(user_id);
alter table public.addresses enable row level security;
drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses" on public.addresses for all to authenticated
using (exists (select 1 from public.users u where u.id = user_id and lower(u.email) = lower(auth.jwt() ->> 'email')) or public.is_admin())
with check (exists (select 1 from public.users u where u.id = user_id and lower(u.email) = lower(auth.jwt() ->> 'email')) or public.is_admin());
