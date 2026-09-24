# Production Migration Reconciliation

The production project previously reported migration versions that were not present in the local directory. Do not run `supabase migration repair`, `db reset`, or any destructive command as a shortcut.

## Safe procedure

1. Take a production database backup or snapshot.
2. Confirm the linked project with `supabase projects list` and `supabase status`.
3. Run `supabase db pull --linked` into a temporary review branch. Inspect the generated schema and migration history; do not overwrite the current branch blindly.
4. Compare the remote history table with `backend/supabase/migrations/` and preserve every remote version.
5. Apply `202609240001_checkout_hardening.sql` only after the history is reconciled, using `supabase db push --linked` or the Supabase SQL editor after review.
6. Verify the following directly in SQL: order columns and unique idempotency index, `checkout_order(jsonb,jsonb,text,text)`, its execute grant, discount row locking, and admin audit-log policies.
7. Run a rollback rehearsal against a staging project. This migration is additive and keeps legacy order rows valid, but the checkout function should be restored from the previous migration if a rollback is required.

Production application startup deliberately does not seed or mutate data. Use a reviewed, one-time provisioning job for admin credentials, catalog, and coupons.
