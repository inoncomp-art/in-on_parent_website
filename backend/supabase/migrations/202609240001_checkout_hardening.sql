-- Safe additive checkout hardening. Run after the existing catalog/platform migrations.
-- This migration is intentionally backward-compatible with existing orders.

alter table public.orders add column if not exists subtotal numeric(12, 2);
alter table public.orders add column if not exists shipping_fee numeric(12, 2) not null default 0;
alter table public.orders add column if not exists discount numeric(12, 2) not null default 0;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists idempotency_key text;
alter table public.orders add column if not exists shipping_phone text;
alter table public.orders add column if not exists shipping_address text;
alter table public.orders add column if not exists shipping_city text;
alter table public.orders add column if not exists shipping_state text;
alter table public.orders add column if not exists shipping_postal_code text;
alter table public.orders add column if not exists shipping_country text;

update public.orders
set subtotal = coalesce(subtotal, total),
    shipping_fee = coalesce(shipping_fee, 0),
    discount = coalesce(discount, 0)
where subtotal is null;

create unique index if not exists orders_customer_idempotency_key_uq
  on public.orders(customer_id, idempotency_key)
  where idempotency_key is not null;

alter table public.orders drop constraint if exists orders_subtotal_nonnegative;
alter table public.orders add constraint orders_subtotal_nonnegative check (coalesce(subtotal, total) >= 0);
alter table public.orders drop constraint if exists orders_discount_nonnegative;
alter table public.orders add constraint orders_discount_nonnegative check (discount >= 0);
alter table public.orders drop constraint if exists orders_shipping_fee_nonnegative;
alter table public.orders add constraint orders_shipping_fee_nonnegative check (shipping_fee >= 0);

create table if not exists public.admin_audit_log (
  id bigserial primary key,
  admin_user_id bigint references public.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
drop policy if exists "Admins read audit log" on public.admin_audit_log;
create policy "Admins read audit log" on public.admin_audit_log for select
  to authenticated using (public.is_admin());
drop policy if exists "Admins insert audit log" on public.admin_audit_log;
create policy "Admins insert audit log" on public.admin_audit_log for insert
  to authenticated with check (public.is_admin());

insert into public.discounts (code, kind, amount, minimum_order, active)
values ('GLOW15', 'percentage', 15, 0, true)
on conflict (code) do update set kind = excluded.kind, amount = excluded.amount, minimum_order = excluded.minimum_order, active = true;

create or replace function public.checkout_order(
  p_items jsonb,
  p_shipping jsonb,
  p_coupon_code text default null,
  p_idempotency_key text default null
)
returns table(order_id bigint, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_customer_id bigint;
  v_customer_name text;
  v_existing public.orders%rowtype;
  v_order_id bigint;
  v_order_number text;
  v_subtotal numeric(12, 2) := 0;
  v_shipping_fee numeric(12, 2) := 0;
  v_discount numeric(12, 2) := 0;
  v_total numeric(12, 2) := 0;
  v_item_count integer := 0;
  v_item record;
  v_product public.products%rowtype;
  v_discount_row public.discounts%rowtype;
begin
  if v_email is null or v_email = '' then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select id, first_name || ' ' || last_name into v_customer_id, v_customer_name
  from public.users where lower(email) = v_email limit 1;
  if v_customer_id is null then
    raise exception using errcode = '42501', message = 'Customer profile not found';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 16 then
    raise exception using errcode = '22023', message = 'A valid idempotency key is required';
  end if;

  -- Serialize retries for the same customer/key before checking the unique index.
  perform pg_advisory_xact_lock(hashtextextended(v_customer_id::text || ':' || p_idempotency_key, 0));

  select * into v_existing from public.orders
  where customer_id = v_customer_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return query select v_existing.id, v_existing.number;
    return;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one product is required';
  end if;

  for v_item in select product_slug, quantity from jsonb_to_recordset(p_items) as item(product_slug text, quantity integer) loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 20 then
      raise exception using errcode = '22023', message = 'Invalid product quantity';
    end if;
    select * into v_product from public.products where slug = v_item.product_slug for update;
    if not found then raise exception using errcode = 'P0002', message = 'Product is unavailable'; end if;
    if v_product.stock < v_item.quantity then
      raise exception using errcode = 'P0001', message = 'Insufficient stock for ' || v_product.name;
    end if;
    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
    v_item_count := v_item_count + v_item.quantity;
  end loop;

  if nullif(trim(p_coupon_code), '') is not null then
    select * into v_discount_row from public.discounts
    where upper(code) = upper(trim(p_coupon_code)) for update;
    if not found or not v_discount_row.active then
      raise exception using errcode = '22023', message = 'Coupon is not active';
    end if;
    if v_discount_row.expires_at is not null and v_discount_row.expires_at <= now() then
      raise exception using errcode = '22023', message = 'Coupon has expired';
    end if;
    if v_discount_row.max_uses is not null and v_discount_row.uses_count >= v_discount_row.max_uses then
      raise exception using errcode = '22023', message = 'Coupon usage limit reached';
    end if;
    if v_subtotal < v_discount_row.minimum_order then
      raise exception using errcode = '22023', message = 'Minimum order is ₹' || v_discount_row.minimum_order;
    end if;
    v_discount := case when v_discount_row.kind = 'percentage'
      then least(v_subtotal, round(v_subtotal * v_discount_row.amount / 100, 2))
      else least(v_subtotal, v_discount_row.amount) end;
    update public.discounts set uses_count = uses_count + 1 where id = v_discount_row.id;
  end if;

  v_total := greatest(0, v_subtotal - v_discount + v_shipping_fee);
  v_order_number := 'INON' || to_char(clock_timestamp(), 'YYMMDDHH24MISS') || upper(substr(md5(gen_random_uuid()::text), 1, 4));
  insert into public.orders (
    number, customer_id, customer_name, customer_email, status, subtotal, shipping_fee,
    discount, coupon_code, total, item_count, shipping_eta, idempotency_key,
    shipping_phone, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country
  ) values (
    v_order_number, v_customer_id,
    coalesce(nullif(trim(p_shipping ->> 'first_name'), '') || ' ' || nullif(trim(p_shipping ->> 'last_name'), ''), v_customer_name),
    v_email, 'Confirmed', v_subtotal, v_shipping_fee, v_discount, nullif(upper(trim(p_coupon_code)), ''), v_total,
    v_item_count, 'Dispatches in 2-4 days', p_idempotency_key, p_shipping ->> 'phone', p_shipping ->> 'address',
    p_shipping ->> 'city', p_shipping ->> 'state', p_shipping ->> 'postal_code', coalesce(p_shipping ->> 'country', 'India')
  ) returning id into v_order_id;

  for v_item in select product_slug, quantity from jsonb_to_recordset(p_items) as item(product_slug text, quantity integer) loop
    select * into v_product from public.products where slug = v_item.product_slug for update;
    insert into public.order_items (order_id, product_slug, product_name, price, quantity)
      values (v_order_id, v_product.slug, v_product.name, v_product.price, v_item.quantity);
    update public.products set stock = stock - v_item.quantity where id = v_product.id;
  end loop;
  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.checkout_order(jsonb, jsonb, text, text) from public;
grant execute on function public.checkout_order(jsonb, jsonb, text, text) to authenticated;
