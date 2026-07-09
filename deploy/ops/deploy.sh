#!/usr/bin/env bash
#
# Build the image HERE, ship it THERE. Run from the repo root, on a machine with
# working internet (your laptop) — never on the VPS, which cannot reach Google
# Fonts, may not reach Docker Hub, and lacks the RAM for a Next build.
#
#   ./deploy/ops/deploy.sh                     # build, ship, restart
#   ./deploy/ops/deploy.sh --rollback          # restart on the previous image
#   SSH_HOST=deploy@1.2.3.4 ./deploy/ops/deploy.sh
#
# The image is streamed over ssh; nothing is pushed to any registry, so no
# registry needs to be reachable from Iran.
set -euo pipefail

SSH_HOST="${SSH_HOST:-deploy@metalgallery.ir}"
REMOTE_DIR="${REMOTE_DIR:-/srv/metalgallery}"
IMAGE="${IMAGE:-metalgallery-web}"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://metalgallery.ir}"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

# --- rollback -----------------------------------------------------------------
# The previous image is kept as :previous on the server by every successful
# deploy. Rolling back is a retag and a restart — no rebuild, no transfer.
if [[ "${1:-}" == "--rollback" ]]; then
  log "Rolling back $SSH_HOST to ${IMAGE}:previous"
  ssh "$SSH_HOST" bash -seuo pipefail <<EOF
    docker image inspect ${IMAGE}:previous >/dev/null 2>&1 || { echo "no :previous image to roll back to" >&2; exit 1; }
    docker tag ${IMAGE}:previous ${IMAGE}:latest
    cd ${REMOTE_DIR} && docker compose up -d --wait
EOF
  log "Rolled back."
  exit 0
fi

# --- preflight ----------------------------------------------------------------
[[ -f Dockerfile ]] || die "run this from the repo root (no Dockerfile here)"
[[ -d data.seed ]] || die "data.seed/ is missing — the build reads it for the sitemap"
command -v docker >/dev/null || die "docker is not installed on this machine"
docker info >/dev/null 2>&1 || die "the docker daemon is not running"

ssh -o BatchMode=yes -o ConnectTimeout=10 "$SSH_HOST" true 2>/dev/null \
  || die "cannot ssh to $SSH_HOST (set SSH_HOST=user@ip)"

ssh "$SSH_HOST" "test -f ${REMOTE_DIR}/.env" \
  || die "${REMOTE_DIR}/.env is missing on the server — copy deploy/metalgallery/.env.example there and fill it in"

# --- build --------------------------------------------------------------------
# NEXT_PUBLIC_SITE_URL must be a build arg: Next inlines it into the client
# bundle, so a runtime value can never reach it.
log "Building ${IMAGE}:latest for linux/amd64 (NEXT_PUBLIC_SITE_URL=${SITE_URL})"
docker build \
  --platform linux/amd64 \
  --build-arg "NEXT_PUBLIC_SITE_URL=${SITE_URL}" \
  -t "${IMAGE}:latest" \
  .

# --- ship ---------------------------------------------------------------------
# Keep the currently-running image as :previous before overwriting :latest, so
# --rollback has somewhere to go. `|| true` on the first deploy, when there is
# no :latest yet.
log "Tagging the running image as :previous"
ssh "$SSH_HOST" "docker tag ${IMAGE}:latest ${IMAGE}:previous 2>/dev/null || true"

SIZE=$(docker image inspect "${IMAGE}:latest" --format '{{.Size}}' | awk '{printf "%.0f", $1/1024/1024}')
log "Streaming ${SIZE} MB to ${SSH_HOST} (gzip over ssh)"
docker save "${IMAGE}:latest" | gzip -1 | ssh "$SSH_HOST" 'gunzip | docker load'

# --- restart ------------------------------------------------------------------
# --wait blocks until the healthcheck passes, so a broken image fails the deploy
# here rather than silently serving 500s. The fixed container_name means the old
# container is stopped before the new one starts: a few seconds of downtime,
# absorbed by Caddy's lb_try_duration, and required by the single-writer DB.
log "Restarting the stack"
ssh "$SSH_HOST" bash -seuo pipefail <<EOF
  cd ${REMOTE_DIR}
  docker compose up -d --wait
  docker image prune -f >/dev/null
EOF

log "Deployed. Verify:"
echo "    curl -sI https://metalgallery.ir | head -1"
echo "    curl -sI https://admin.metalgallery.ir | head -1"
echo "    ssh $SSH_HOST 'docker logs --tail 20 mg-web'"
