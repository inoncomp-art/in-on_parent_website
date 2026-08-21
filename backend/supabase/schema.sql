-- In&On Supabase schema
-- Paste this into the Supabase SQL editor after the project key setup is finished.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  kicker text not null,
  claim text not null,
  intro text not null,
  price numeric(12, 2) not null,
  mrp numeric(12, 2) not null,
  image text not null,
  tone text not null,
  accent text not null,
  tag text not null,
  rating text not null,
  category text not null,
  ingredients jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id bigserial primary key,
  email text not null unique,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  role text not null default 'customer',
  phone text,
  city text,
  glow_points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigserial primary key,
  number text not null unique,
  customer_id bigint not null references public.users(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  status text not null,
  total numeric(12, 2) not null,
  item_count integer not null,
  shipping_eta text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  price numeric(12, 2) not null,
  quantity integer not null
);

create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_orders_customer_email on public.orders (customer_email);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

insert into public.products (slug, name, kicker, claim, intro, price, mrp, image, tone, accent, tag, rating, category, ingredients, benefits, stock)
values
  (
    'cucumber-face-wash',
    'Cucumber Face Wash',
    'Vitamin C + Niacinamide',
    'A fresh start, bottled.',
    'A cooling daily cleanse that lifts away excess oil and city grime while keeping skin comfortable, soft and visibly refreshed.',
    349,
    449,
    '/products/cucumber.jpg',
    '#e9f7c9',
    '#3c8b28',
    'FRESH START',
    '4.8',
    'Face Wash',
    '["Cucumber extract","Niacinamide","Allantoin","Licorice root"]'::jsonb,
    '["Gently cleanses without over-drying","Supports a brighter-looking complexion","Leaves skin cool, calm and refreshed"]'::jsonb,
    98
  ),
  (
    'mango-sunscreen',
    'Mango Sunscreen SPF 50',
    'PA++++ Broad Spectrum',
    'Sun care with main-character energy.',
    'Lightweight, non-greasy daily SPF with broad-spectrum UVA and UVB protection, designed to disappear into every morning ritual.',
    499,
    649,
    '/products/sunscreen.jpg',
    '#fff0ad',
    '#e67600',
    'DAILY DEFENCE',
    '4.9',
    'Sunscreen',
    '["Niacinamide","3-O-Ethyl Ascorbic Acid","Allantoin","Mango extract"]'::jsonb,
    '["Broad spectrum SPF 50 PA++++","Comfortable, no-heavy-feel finish","Supports an even, radiant look"]'::jsonb,
    74
  ),
  (
    'orange-moisturizer',
    'Orange Moisturizer',
    'Niacinamide + Glycerin',
    'Soft skin. Bright mood.',
    'A silky, lightweight moisturizer that replenishes daily hydration and leaves skin smooth, supple and naturally luminous.',
    449,
    549,
    '/products/moisturizer.jpg',
    '#ffe6d0',
    '#eb6200',
    'DEEP HYDRATION',
    '4.7',
    'Moisturizer',
    '["Orange extract","Glycerin","Niacinamide","Allantoin"]'::jsonb,
    '["Long-lasting daily hydration","Lightweight, fast-absorbing comfort","Supports a healthy skin barrier"]'::jsonb,
    86
  ),
  (
    'strawberry-serum',
    'Strawberry Face Serum',
    'Salicylic Acid + Niacinamide',
    'A few drops. A clearer rhythm.',
    'A multi-active serum for texture, pores and uneven-looking skin with a fresh sensorial finish that slips effortlessly into your routine.',
    549,
    699,
    '/products/serum.jpg',
    '#ffe3eb',
    '#ed1f52',
    'RADIANCE',
    '4.9',
    'Serum',
    '["Salicylic acid","Niacinamide","Alpha arbutin","Licorice extract"]'::jsonb,
    '["Helps reduce excess oil","Gently unclogs the look of pores","Supports smoother, brighter-looking skin"]'::jsonb,
    63
  ),
  (
    'watermelon-face-wash',
    'Watermelon Face Wash',
    'AHA · BHA · PHA',
    'Clean pores. Juicy glow.',
    'A daily exfoliating face wash made to balance excess oil, refresh clogged-feeling skin and reveal a smoother-looking finish.',
    379,
    499,
    '/products/watermelon.jpg',
    '#ffdfe1',
    '#e81432',
    'OIL CONTROL',
    '4.8',
    'Face Wash',
    '["Watermelon extract","Salicylic acid","Niacinamide","Allantoin"]'::jsonb,
    '["Controls excess oil","Gently exfoliates dead surface cells","Soothes redness and discomfort"]'::jsonb,
    52
  )
on conflict (slug) do update set
  name = excluded.name,
  kicker = excluded.kicker,
  claim = excluded.claim,
  intro = excluded.intro,
  price = excluded.price,
  mrp = excluded.mrp,
  image = excluded.image,
  tone = excluded.tone,
  accent = excluded.accent,
  tag = excluded.tag,
  rating = excluded.rating,
  category = excluded.category,
  ingredients = excluded.ingredients,
  benefits = excluded.benefits,
  stock = excluded.stock;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where email = auth.jwt() ->> 'email'
      and lower(role) = 'admin'
  );
$$;

alter table public.products enable row level security;
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins update products" on public.products;
create policy "Admins update products"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products"
on public.products
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Users read own profile" on public.users;
create policy "Users read own profile"
on public.users
for select
to authenticated
using (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile"
on public.users
for update
to authenticated
using (email = auth.jwt() ->> 'email' or public.is_admin())
with check (email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "Admins insert users" on public.users;
create policy "Admins insert users"
on public.users
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
on public.orders
for select
to authenticated
using (customer_email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders"
on public.orders
for insert
to authenticated
with check (customer_email = auth.jwt() ->> 'email' or public.is_admin());

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read own order items" on public.order_items;
create policy "Users read own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (o.customer_email = auth.jwt() ->> 'email' or public.is_admin())
  )
);

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items"
on public.order_items
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins update order items" on public.order_items;
create policy "Admins update order items"
on public.order_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins delete order items" on public.order_items;
create policy "Admins delete order items"
on public.order_items
for delete
to authenticated
using (public.is_admin());

-- The production checkout/RLS migration lives in migrations/20260821_checkout_rpc_rls.sql.
