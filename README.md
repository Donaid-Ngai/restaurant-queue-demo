# Restaurant Queue Demo

Prototype restaurant queueing system (guest join + restaurant dashboard).

## Tools used (and how they’re linked)

- **Next.js**: frontend framework (routes in `src/app`).
- **Chakra UI**: UI components + styling (`src/components`).
- **Supabase**: the database (shared demo project).
  - Schema: `restaurant_queue.queue_entries` (managed by `demo-db-infra`).
  - App reads/writes via **`@supabase/supabase-js`**.
- **GitHub + Vercel**:
  - Code repo: https://github.com/Donaid-Ngai/restaurant-queue-demo
  - Deployment: https://restaurant-queue-demo.vercel.app
  - DB infra repo (migrations/types): https://github.com/Donaid-Ngai/demo-db-infra

## What it includes

- Guest join form (name + phone + party size)
- Restaurant dashboard (list queue, add walk-ins, seat guests, remove guests)
- Shared, persistent queue state via Supabase (not localStorage)

## Database (source of truth)

- Managed by `demo-db-infra` migrations.
- Table: `restaurant_queue.queue_entries`
- Status values: `waiting`, `seated`, `removed`

## Supabase env vars

These must be set in the **Vercel project** and in **local development**.

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Where to set them

#### Local
Create `.env.local` in this repo (the repo includes `.env.example`).

#### Vercel
Vercel → **Project Settings** → **Environment Variables** → add:
- `NEXT_PUBLIC_SUPABASE_URL` (production)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production)

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

- This prototype relies on Supabase RLS policies for client-side reads/writes.
- Next step toward “types source of truth”: wire the app to import the generated Supabase `Database` type from `demo-db-infra` (so TS is 100% schema-driven).