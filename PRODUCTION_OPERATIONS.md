# In&On Production Operations

## Supabase migration

Apply `backend/supabase/schema.sql` first, then every file in `backend/supabase/migrations/` in filename order. With the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Verify `wishlists`, `discounts`, `cms_content`, and `analytics_events` exist before opening the corresponding admin sections.

## Backups

Enable Supabase database backups and point-in-time recovery in the project billing/backup settings appropriate for the production plan. Export a database snapshot before every schema migration. Storage objects require a separate backup policy because database backups do not include Storage files.

## Monitoring

- Monitor `https://api.your-domain.com/health` every 5 minutes with UptimeRobot, Better Stack, or equivalent.
- Alert on non-200 responses and Render deployment failures.
- Keep Render logs and Supabase Auth/database logs enabled.
- Review `/api/admin/analytics` weekly and export operational data before major releases.

## Launch smoke test

1. Load products from the storefront.
2. Create/login as a customer.
3. Place one COD order.
4. Confirm stock decreases once.
5. Confirm the order appears in the customer dashboard and admin Orders.
6. Move it through Confirmed, Packed, Shipped, Delivered.
7. Verify a non-admin cannot access admin endpoints.
