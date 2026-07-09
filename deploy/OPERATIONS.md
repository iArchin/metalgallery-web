# metalgallery — operations map

Live at **https://metalgallery.ir** (storefront) and **https://admin.metalgallery.ir**
(panel). This file is the map: what runs where, and where each secret lives. It
deliberately contains **no secret values** — this repo is the CI source, and git
history is permanent. Real values live on the server, in GitHub Actions secrets,
in Cloudflare, and in your password manager.

## Topology

```
             Cloudflare (proxied, Full strict)
                        │  https
                        ▼
        VPS 82.115.26.138 ── Nginx Proxy Manager (:80/:443)
                        │
          ┌─────────────┴───────────────┐
     mg_edge network              npm_default network
          │                             │
        mg-web ── mg_data          inky-web, inky-api ── inky-db
     (this project)                 (unrelated project — isolated)
```

- `mg-web` runs the standalone Next.js image and is reachable only on `mg_edge`.
  It publishes no host ports. NPM reaches it as `mg-web:3000`.
- metalgallery and `inky` share no network and cannot reach each other. Never put
  `mg-web` on `npm_default`.

## Where things live on the server (`/opt/metalgallery/`)

| Path | What |
|---|---|
| `compose.yml` | the stack. `image: ${MG_IMAGE:-…}` — CI sets `MG_IMAGE` in `.env`. Edited by hand; CI does **not** ship it. |
| `.env` (0600) | `SESSION_SECRET`, `SMS_IR_*`, `ADMIN_HOST`, `NEXT_PUBLIC_SITE_URL`. The only home of the session secret. |
| `tls/cf-origin.{pem,key}` | Cloudflare Origin certificate + key (also uploaded into NPM). |
| `ops/ci-deploy.sh` | forced-command target for the CI deploy key. |
| `ops/backup.sh`, `ops/restore.sh` | hot backup / restore of `mg_data`. |
| volume `mg_data` | the JSON database. Back this up. |

## Access — where each credential is (not the value)

- **VPS root SSH** — your key. From a machine whose default route is a VPN, bind
  to the physical interface (`ssh -b <lan-ip> …`).
- **NPM admin** — UI at `127.0.0.1:81` (tunnel: `ssh -L 8181:127.0.0.1:81 …`).
  Email `info@botify.trade`. Keep the password in your password manager.
- **SESSION_SECRET** — server `.env` only. Lost → regenerate with
  `openssl rand -hex 32` (logs everyone out, no data loss).
- **Cloudflare Origin cert** — server `tls/`, NPM custom cert, and regenerable in
  Cloudflare → SSL/TLS → Origin Server.
- **CI deploy key** — GitHub secret `DEPLOY_SSH_KEY`; public half pinned in the
  server's `root` authorized_keys as a forced command (deploy-only, no shell).
- **GHCR pull** — server is `docker login`'d to ghcr.io with a `read:packages` PAT.
- **SMS.ir** — API key + template id in server `.env`. Login is OTP-only, so these
  must be set for anyone to sign in.

## Everyday operations

| Task | How |
|---|---|
| Deploy | `git push origin main` → builds, publishes, rolls the server, health-gated, auto-rollback. |
| Manual deploy | Actions → *build & deploy* → Run workflow. |
| Roll back | edit `MG_IMAGE=` in server `.env`, `docker compose up -d --wait`. |
| Logs | `docker logs -f mg-web`. |
| Backup now | `/opt/metalgallery/ops/backup.sh` (cron it; copy off-box). |
| Restore | `/opt/metalgallery/ops/restore.sh <archive> --force`. |
| Add/change admin | edit `data/users.json` in the `mg_data` volume (see `DEPLOY.md`). |
| Rotate NPM password | NPM UI → top-right → Users, or reset via the container's DB. |

Full first-run and troubleshooting: [DEPLOY.md](DEPLOY.md).

## Rotate what leaked during setup

The root password and the origin private key each passed through a chat during
setup. Neither is catastrophic (origin key is only trusted by Cloudflare), but
when convenient: `passwd` on the server, and reissue the origin cert via a CSR
generated on the server so the key never leaves it.
