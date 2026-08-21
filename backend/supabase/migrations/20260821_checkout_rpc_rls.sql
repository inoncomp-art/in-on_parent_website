-- Atomic checkout and least-privilege policies for In&On.
-- Run after schema.sql in the Supabase SQL editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where lower(email) = lower(auth.jwt() ->> 'email')
      and lower(role) = 'admin'
  );
$$;

create or replace function public.checkout_order(p_items jsonb, p_shipping jsonb)
returns table(order_id bigint, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_customer_id bigint;
  v_customer_name text;
  v_order_id bigint;
  v_order_number text;
  v_total numeric(12, 2) := 0;
  v_item_count integer := 0;
  v_item record;
  v_product public.products%rowtype;
begin
  if v_email is null or v_email = '' then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select id, first_name || ' ' || last_name
    into v_customer_id, v_customer_name
  from public.users
  where lower(email) = v_email
  limit 1;

  if v_customer_id is null then
    raise exception using errcode = '42501', message = 'Customer profile not found';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one product is required';
  end if;

  for v_item in
    select product_slug, quantity
    from jsonb_to_recordset(p_items) as item(product_slug text, quantity integer)
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 20 then
      raise exception using errcode = '22023', message = 'Invalid product quantity';
    end if;

    select * into v_product
    from public.products
    where slug = v_item.product_slug
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'Product is unavailable';
    end if;
    if v_product.stock < v_item.quantity then
      raise exception using errcode = 'P0001', message = 'Insufficient stock for ' || v_product.name;
    end if;

    v_total := v_total + (v_product.price * v_item.quantity);
    v_item_count := v_item_count + v_item.quantity;
  end loop;

  v_order_number := 'INON' || to_char(clock_timestamp(), 'YYMMDDHH24MISS') || upper(substr(md5(gen_random_uuid()::text), 1, 4));

  insert into public.orders (number, customer_id, customer_name, customer_email, status, total, item_count, shipping_eta)
  values (v_order_number, v_customer_id, coalesce(nullif(trim(p_shipping ->> 'first_name'), '') || ' ' || nullif(trim(p_shipping ->> 'last_name'), ''), v_customer_name), v_email, 'Confirmed', v_total, v_item_count, 'Dispatches in 2-4 days')
  returning id into v_order_id;

  for v_item in
    select product_slug, quantity
    from jsonb_to_recordset(p_items) as item(product_slug text, quantity integer)
  loop
    select * into v_product from public.products where slug = v_item.product_slug for update;
    insert into public.order_items (order_id, product_slug, product_name, price, quantity)
    values (v_order_id, v_product.slug, v_product.name, v_product.price, v_item.quantity);
    update public.products set stock = stock - v_item.quantity where id = v_product.id;
  end loop;

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function public.checkout_order(jsonb, jsonb) from public;
grant execute on function public.checkout_order(jsonb, jsonb) to authenticated;

drop policy if exists "Users create own orders" on public.orders;
drop policy if exists "Users create own order items" on public.order_items;

drop policy if exists "Public can read product media" on storage.objects;
create policy "Public can read product media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'products');

drop policy if exists "Admins upload product media" on storage.objects;
create policy "Admins upload product media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "Admins update product media" on storage.objects;
create policy "Admins update product media"
on storage.objects for update
to authenticated
using (bucket_id = 'products' and public.is_admin())
with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "Admins delete product media" on storage.objects;
create policy "Admins delete product media"
on storage.objects for delete
to authenticated
using (bucket_id = 'products' and public.is_admin());
