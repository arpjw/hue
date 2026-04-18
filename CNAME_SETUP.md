# DNS Setup — Cloudflare

Two CNAME records required in the `monolithsystematic.com` zone.

| Name | Type | Value | Proxy |
|------|------|-------|-------|
| `hue` | CNAME | `cname.vercel-dns.com` | DNS only (grey cloud) |
| `hue-backend` | CNAME | `hue-backend.fly.dev` | DNS only (grey cloud) |

**Important:** Both records must be set to **DNS only** (not proxied). Vercel and fly.io handle TLS termination themselves; proxying through Cloudflare will break certificate validation.

After adding the records:

1. In the Vercel dashboard, add `hue.monolithsystematic.com` as a custom domain for the `hue` project. Vercel will verify the CNAME and provision a certificate automatically.
2. fly.io resolves `hue-backend.fly.dev` directly — no additional configuration needed on the fly.io side.
