# OpenImpact frontend

React + Vite SPA for **OpenImpact**: donation receipts, donor / recipient / organisation dashboards, and public impact pages.

## Stack

- React 19 + Vite 8
- TanStack Router
- Tailwind CSS 4 + shadcn/ui
- Supabase JS (Auth + Postgres when env is set)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

### Env

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without these, the app uses local mock data. With them, ledger reads/writes go to Supabase.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (http://localhost:5173) |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Deploy

Root for Vercel is this `frontend/` folder (`vercel.json` handles SPA rewrites).

CI builds this package via `.github/workflows/ci.yml` at the repo root.

## Related

- Backend / schema: [`../backend/README.md`](../backend/README.md)
- Product plan: [`../docs/backend.md`](../docs/backend.md)
