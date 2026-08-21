# In&On Backend

FastAPI backend for the In&On storefront, customer dashboard, and admin dashboard.

## Local dev

1. Set `DATABASE_URL` to a PostgreSQL URL for production-like use.
2. Optional local fallback:
   - leave `DATABASE_URL` unset to use SQLite for quick development.
3. Run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Key routes

- `GET /health`
- `GET /api/products`
- `GET /api/products/{slug}`
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/account/dashboard`
- `GET /api/admin/overview`
- `GET /api/admin/orders`
- `GET /api/admin/products`
