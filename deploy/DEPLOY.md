# Deploying متال گالری to Parspack

The storefront and the admin panel are one app in one container. It routes by
`Host`: `metalgallery.ir` serves the shop, `admin.metalgallery.ir` serves the
panel. A single Caddy container in front of it terminates TLS for every site on
the server — this one and the two projects you'll add later.

```
                    ┌─────────────────────────────────────┐
   :80 :443 ───────►│  edge-caddy      /srv/edge          │
                    └──────┬──────────────┬───────────────┘
                           │ edge network │
                    ┌──────▼──────┐  ┌────▼─────────┐  ┌──────────────┐
                    │   mg-web    │  │ project2-web │  │ project3-web │
                    │ /srv/metal… │  │  /srv/p2     │  │  /srv/p3     │
                    └──────┬──────┘  └──────────────┘  └──────────────┘
                           │ volume: mg_data  (the JSON database)
```

No app container publishes a host port. Only Caddy does. This is not a style
preference: Docker inserts its port-publishing rules ahead of UFW's, so a
published port is reachable from the internet even with `ufw default deny
incoming` — a container on the internal network cannot be.

**The image is built on your laptop and shipped over SSH.** Never on the server.
The build needs Docker Hub and the npm registry, and wants 1.5–3 GB of RAM;
`docker save | ssh | docker load` sidesteps all three problems and means the
server never needs to reach a registry at all.

---

## Before you start

Three things I could not check for you. Confirm each:

1. **The server is a VPS / Cloud Server with root SSH**, not shared hosting or a
   cPanel "Node.js hosting" plan. Docker needs a real kernel and root.
   ```bash
   ssh root@SERVER 'docker version || echo "no docker"; sudo -v && echo "sudo ok"'
   ```
   If that fails, none of this applies — stop and tell me, the shape changes
   completely.

2. **What already owns ports 80 and 443.** You have another project on this box.
   ```bash
   ssh root@SERVER "ss -tlnp | grep -E ':(80|443) '"
   ```
   See [Existing project on 80/443](#existing-project-on-80443) below.

3. **`metalgallery.ir`'s nameservers point at Parspack.** `.ir` domains delegate
   at IRNIC first; editing Parspack's zone does nothing until that's done.
   ```bash
   nslookup -type=NS metalgallery.ir
   ```

---

## 1. DNS

In Parspack's DNS panel, for the zone `metalgallery.ir`:

| Type | Name    | Value            | TTL  |
|------|---------|------------------|------|
| A    | `@`     | your server IPv4 | 3600 |
| A    | `www`   | your server IPv4 | 3600 |
| A    | `admin` | your server IPv4 | 3600 |

Three `A` records to one IP. One machine hosts many sites: TLS picks the
certificate by SNI, Caddy picks the site by `Host`, and the app picks storefront
vs panel by `Host` again.

Verify before going further — Caddy cannot issue a certificate for a name that
doesn't resolve to it:

```bash
nslookup metalgallery.ir           # Windows
dig +short metalgallery.ir admin.metalgallery.ir www.metalgallery.ir   # Linux
```

---

## 2. Prepare the server (once)

```bash
scp deploy/ops/bootstrap-server.sh root@SERVER:/tmp/
ssh root@SERVER 'DEPLOY_PUBKEY="'"$(cat ~/.ssh/id_ed25519.pub)"'" bash /tmp/bootstrap-server.sh'
```

It creates the `deploy` user, installs Docker, sets a swapfile, turns on UFW
(22/80/443 only), creates `/srv/{edge,metalgallery}` and the `edge` network —
and, first, prints an **egress preflight**. Read that output. If Docker Hub is
unreachable, the script tells you how to pre-load `caddy:2-alpine` from your
laptop instead of hunting for a registry mirror.

## 3. Copy the deployment files

```bash
scp deploy/edge/compose.yml deploy/edge/Caddyfile   deploy@SERVER:/srv/edge/
scp deploy/metalgallery/compose.yml                 deploy@SERVER:/srv/metalgallery/
scp deploy/ops/backup.sh deploy/ops/restore.sh      deploy@SERVER:/srv/metalgallery/ops/
scp deploy/metalgallery/.env.example                deploy@SERVER:/srv/metalgallery/.env
ssh deploy@SERVER 'chmod 600 /srv/metalgallery/.env && chmod +x /srv/metalgallery/ops/*.sh'
```

Then fill in `/srv/metalgallery/.env`. `SESSION_SECRET` is mandatory — the app
**refuses to boot without it**, by design, because the fallback in the source is
public:

```bash
ssh deploy@SERVER 'openssl rand -hex 32'    # paste into SESSION_SECRET
```

## 4. Admins

Login is SMS OTP — there is no password. Two admins are seeded in
[data.seed/users.json](../data.seed/users.json):

| id | name | phone |
|----|------|-------|
| 1 | مدیر فروشگاه | 09196317160 |
| 2 | مدیر دوم | 09399080489 |

Any phone listed there gets into the panel; every other number is refused with
"این شماره دسترسی مدیریت ندارد". Numbers are matched after normalisation, so
`+98…` and Persian digits both work.

The seed only populates a **fresh** volume. To add or change an admin on a
running deployment, edit the volume — not the seed:

```bash
docker exec -u 0 mg-web sh -c 'cat /app/data/users.json'   # look first
docker exec -u 0 mg-web sh -c '
  f=/app/data/users.json; t=$f.tmp
  sed "s/09196317160/09xxxxxxxxx/" "$f" > "$t" && mv "$t" "$f" && chown 1001:1001 "$f"
'
```

No restart needed — the file is read on each request. Writing through a temp
file and `mv` matches how the app itself writes, so a concurrent read never sees
a half-written file.

## 5. Start the edge, then the app

```bash
ssh deploy@SERVER 'cd /srv/edge && docker compose up -d'   # binds 80/443, issues certs
SSH_HOST=deploy@SERVER ./deploy/ops/deploy.sh              # builds here, ships there
```

`deploy.sh` builds for `linux/amd64`, streams the image over SSH, and runs
`docker compose up -d --wait` — which blocks on the healthcheck, so a broken
image fails the deploy instead of quietly serving errors.

## 6. Verify

```bash
curl -sI https://metalgallery.ir            | head -1     # 200
curl -sI https://www.metalgallery.ir        | head -1     # 301 -> apex
curl -sI https://admin.metalgallery.ir      | head -1     # 307 -> /login
curl -s  https://metalgallery.ir/api/health                # {"ok":true}
ssh deploy@SERVER 'docker logs --tail 30 mg-web'
```

Then open `https://admin.metalgallery.ir`, enter the admin phone, and check your
SMS. A fresh volume already contains the catalog — 14 products, 12 categories, 9
brands — with no customers or orders, so you can place a test order immediately.

---

## Continuous deployment

Pushing to `main` runs [.github/workflows/deploy.yml](../.github/workflows/deploy.yml):
typecheck → build → push `ghcr.io/iarchin/metalgallery-web:{latest,<sha>}` →
SSH to the server and roll onto that exact SHA.

The deploy step cannot do anything else. Its key is pinned in
`/root/.ssh/authorized_keys` with
`restrict,command="/opt/metalgallery/ops/ci-deploy.sh"`, so the only thing a
caller can influence is the argument — and [ci-deploy.sh](ops/ci-deploy.sh)
refuses anything but `deploy <40-hex-sha>`. No shell, no PTY, no forwarding.
A compromised workflow can deploy a commit; it cannot read `.env`.

If the new image never becomes healthy within 120s, `ci-deploy.sh` puts the
previous image digest back, restarts, and exits non-zero. The site stays up on
the last good build and the pipeline goes red.

**Rolling back by hand:**

```bash
docker image ls ghcr.io/iarchin/metalgallery-web   # find the sha you want
sed -i 's|^MG_IMAGE=.*|MG_IMAGE=ghcr.io/iarchin/metalgallery-web:<sha>|' /opt/metalgallery/.env
cd /opt/metalgallery && docker compose up -d --wait
```

Required GitHub repo secrets: `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`.
The server must be logged into GHCR once (`docker login ghcr.io`) so it can pull
a package belonging to a private repo.

## Day-to-day

| Task | Command |
|---|---|
| Deploy a code change | `git push origin main` |
| Deploy without a commit | Actions → *build & deploy* → Run workflow |
| Roll back | edit `MG_IMAGE` in `/opt/metalgallery/.env`, `docker compose up -d --wait` |
| Logs | `ssh deploy@SERVER 'docker logs -f mg-web'` |
| Back up now | `ssh deploy@SERVER '/srv/metalgallery/ops/backup.sh'` |
| Restore | `ssh deploy@SERVER '/srv/metalgallery/ops/restore.sh <archive> --force'` |
| Change a Caddy rule | edit `/srv/edge/Caddyfile`, then `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile` |
| Add project #2 | a stanza in the Caddyfile + a compose file on the `edge` network — see the comments at the bottom of `Caddyfile` |

**Nightly backups.** Install the cron line once:

```bash
ssh deploy@SERVER 'crontab -l 2>/dev/null; echo "15 3 * * * /srv/metalgallery/ops/backup.sh >> /var/log/mg-backup.log 2>&1"' | ssh deploy@SERVER 'crontab -'
```

Backups land in `/srv/metalgallery/backups`, mode 0600, 14 kept. They contain
customer phone numbers and addresses — **copy them off the box**, and remember
that a backup you have never restored is a guess. Do one restore drill.

**Rotating `SESSION_SECRET`** logs every user and admin out. That is the only
consequence; nothing is lost.

**Switching SMS.ir from sandbox to production**: change `SMS_IR_API_KEY` and
`SMS_IR_TEMPLATE_ID` in `/srv/metalgallery/.env`, then
`docker compose up -d --force-recreate web`. No rebuild needed — those are
runtime values. `NEXT_PUBLIC_SITE_URL` is *not*; changing it requires a rebuild,
because Next inlines it into the browser bundle.

---

## Existing project on 80/443

Two proxies cannot both bind 443. Pick one:

**A. Move the existing project behind Caddy** (recommended — one edge, one place
certificates live, one place to add project #3). Stop its nginx
(`systemctl disable --now nginx`), put its container on the `edge` network with
no published ports, and add a stanza to the Caddyfile. Its certificates get
re-issued automatically on first request.

**B. Keep its nginx and let it front metalgallery too.** Don't run the edge
stack. Put `mg-web` on a network nginx can reach, or publish it on
`127.0.0.1:3000` only, and add a vhost. You must then set, by hand, on every
location:

```nginx
proxy_set_header Host              $host;                      # or the admin subdomain silently breaks
proxy_set_header X-Forwarded-Proto $scheme;                    # or Next emits http:// redirects → loop
proxy_set_header X-Forwarded-For   $remote_addr;               # or the OTP rate limiter is spoofable
```

That fragility is exactly why the default is Caddy: it does all three by itself.

## TLS fallbacks

Automatic HTTPS needs inbound `:80` open and outbound access to
`acme-v02.api.letsencrypt.org`. Both are checked by the bootstrap preflight.

- **Let's Encrypt unreachable** → set `email` in the Caddyfile's global block.
  Caddy's built-in ZeroSSL issuer is next in the chain and provisions ZeroSSL's
  required EAB credentials automatically, but only for a registered account.
  Do *not* pin ZeroSSL with a bare `acme_ca` line — that skips EAB and fails.
- **Both unreachable** → buy a certificate from Parspack and load it manually
  with a `tls /path/cert.pem /path/key.pem` line in each site block.
- **Testing** → uncomment the `acme_ca` staging line first. Let's Encrypt allows
  only 5 failures per hostname per hour on the real endpoint.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `502` from Caddy | app container down or unhealthy | `docker logs mg-web`; a boot-time `SESSION_SECRET` error is the usual culprit |
| App exits immediately, logs mention SESSION_SECRET | it's unset, too short, or still the dev fallback | `openssl rand -hex 32` into `/srv/metalgallery/.env` |
| `admin.metalgallery.ir` shows the **shop** | `ADMIN_HOST` unset, or a proxy rewrote `Host` | check `.env`; with nginx see path B above |
| Redirect loop on the admin host | `X-Forwarded-Proto` missing → Next redirects to `http://` | Caddy sets it automatically; nginx needs the line |
| Certificate never issues | DNS not resolving to this IP, or `:80` blocked | `dig +short admin.metalgallery.ir`; `ufw status` |
| `network edge declared as external, but could not be found` | skipped the network step | `docker network create edge` |
| Storefront empty after a fresh volume | seeding didn't run | `docker logs mg-web \| grep entrypoint`; `docker compose exec web ls /app/data` |
| OTP never arrives | sandbox key, unapproved template, or wrong phone in `users.json` | check SMS.ir panel; `docker logs mg-web \| grep OTP` |
| `429` on login | the per-IP limiter (5 sends / 10 min) | expected; wait, or raise the limit in `app/api/auth/otp/send/route.ts` |

---

## Known limits

The database is a directory of JSON files. `lib/server/db.ts` parses a whole
collection on every read and rewrites the whole file on every write, serialized
by an **in-process** queue. That has consequences worth being explicit about:

- **Exactly one container may ever write to `mg_data`.** Never `--scale web=2`.
  There is no horizontal scaling lever, and no HA — one box, one process.
- Each deploy stops the old container before starting the new one. That is a few
  seconds of downtime, which Caddy's `lb_try_duration 10s` turns into a pause
  rather than a 502. It is also the only safe way to hand over the single writer.
- Every checkout rewrites the whole of `orders.json`. Fine at a few dozen orders
  a day; it becomes a problem around **low thousands of orders**, sustained
  **>5–10 req/s**, or the moment you want a second instance.

When you hit that, the migration is SQLite on the same volume (`better-sqlite3`,
one file, no new container, keeps the single-writer model but gives you indexes
and partial writes) — and Postgres only if you actually need concurrency.

There is no CI, no staging environment, and no monitoring. At minimum, point an
external uptime check at `https://metalgallery.ir/api/health`; nothing else will
tell you the site is down.
