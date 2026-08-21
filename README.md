# In&On Launch Stack

## Architecture

- Frontend 1: storefront React/Vite app
- Frontend 2: admin dashboard React/Vite app
- Backend: FastAPI
- Database: PostgreSQL in production, SQLite fallback for local demo runs

## Local URLs

- Storefront: http://localhost:5173
- Admin dashboard: http://localhost:5174
- Backend API: http://localhost:8000

## Backend routes

- `GET /health`
- `GET /api/products`
- `GET /api/products/{slug}`
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/account/dashboard`
- `GET /api/admin/overview`
- `GET /api/admin/orders`
- `GET /api/admin/products`

## Environment

Set `DATABASE_URL` to your Supabase/PostgreSQL connection string for production.
For local demo usage, the backend falls back to SQLite automatically.

## Run locally

Backend:

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Storefront:

```bash
cd inon-storefront-safe
npm run dev -- --host 0.0.0.0 --port 5173
```

Admin:

```bash
cd inon-admin-dashboard-safe
npm run dev -- --host 0.0.0.0 --port 5174
```

## Deploy path

- Cloudflare Pages: storefront and admin frontend builds
- Render: FastAPI backend
- Supabase: PostgreSQL database and storage
