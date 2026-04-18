# Hue

Hue is Monolith Systematic's internal risk and portfolio dashboard. It provides a real-time view of open positions, P&L, VaR, drawdown, and market data sourced from the Vela decentralized perpetuals engine. The frontend is a Next.js App Router application deployed on Vercel; the backend is a FastAPI service deployed on fly.io that aggregates on-chain Vela state and computes risk metrics.

---

## Local dev setup

### Frontend

```bash
npm install
cp .env.local.example .env.local
# fill in VELA_ADMIN_TOKEN and BACKEND_URL
npm run dev
```

App runs at `http://localhost:3000`.

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# fill in any required secrets
uvicorn main:app --reload
```

API runs at `http://localhost:8000`.

---

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `VELA_ADMIN_TOKEN` | frontend + backend | Auth token for Vela admin endpoints |
| `NEXT_PUBLIC_VELA_BASE` | frontend | Public base URL for the Vela API (browser-side) |
| `BACKEND_URL` | frontend | URL of the FastAPI backend (`http://localhost:8000` locally, `https://hue-backend.fly.dev` in prod) |

---

## Architecture

```
Browser
  │
  ▼
Next.js — Vercel (hue.monolithsystematic.com)
  │
  ├── /api/vela/*  ──────────────────────────► Vela Engine (on-chain / RPC)
  │
  └── /api/portfolio, /api/risk ────────────► FastAPI Backend — fly.io
                                               (hue-backend.monolithsystematic.com)
                                                │
                                                └── IBKR Pro (Phase 2)
```

---

## Deployment

### Vercel (frontend)

Vercel deploys automatically on every push to `main` via the GitHub integration. No manual step required.

Required secrets in the Vercel project settings:

- `VELA_ADMIN_TOKEN`
- `NEXT_PUBLIC_VELA_BASE`
- `BACKEND_URL` → `https://hue-backend.fly.dev`

Custom domain: add `hue.monolithsystematic.com` in the Vercel dashboard after configuring the DNS record (see `CNAME_SETUP.md`).

### fly.io (backend)

fly.io deploys automatically on every push to `main` via the GitHub integration (or `fly deploy` manually).

```bash
cd backend
fly deploy
```

App name: `hue-backend`, region: `ord`.

Set secrets with:

```bash
fly secrets set VELA_ADMIN_TOKEN=<value>
```

### DNS

See `CNAME_SETUP.md` for the two Cloudflare records required to point the custom domains at Vercel and fly.io.
