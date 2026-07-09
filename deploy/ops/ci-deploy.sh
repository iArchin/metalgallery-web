#!/usr/bin/env bash
#
# Runs on the server, as the forced command behind the CI deploy key.
#
# authorized_keys pins it:
#   restrict,command="/opt/metalgallery/ops/ci-deploy.sh" ssh-ed25519 AAAA... ci@metalgallery
#
# So a caller cannot choose the command — only the argument, which arrives in
# $SSH_ORIGINAL_COMMAND as `deploy <sha>`. Anything else is refused. Even a fully
# compromised GitHub Actions run cannot get a shell on this box.
#
# Deploying is: pull that exact tag, restart onto it, wait for the healthcheck.
# If it never becomes healthy we put the previous image back, because the
# alternative is a container that is up, unhealthy, and serving 500s.
#
# THIS SHIPS THE IMAGE, NOT THE COMPOSE FILE. /opt/metalgallery/compose.yml is
# managed on the server by hand; a push that only changes compose.yml will NOT
# reach production. When you change it in the repo, upload it yourself:
#   scp deploy/metalgallery/compose.yml root@HOST:/opt/metalgallery/compose.yml
# The seam that lets the image change without touching this file is MG_IMAGE,
# which this script rewrites in .env; compose.yml must reference
# ${MG_IMAGE:-metalgallery-web:latest} for that to work.
set -euo pipefail

PROJECT_DIR=/opt/metalgallery
REGISTRY_IMAGE=ghcr.io/iarchin/metalgallery-web

log() { printf '[ci-deploy] %s\n' "$*"; }
die() { printf '[ci-deploy] error: %s\n' "$*" >&2; exit 1; }

# --- parse the forced command -------------------------------------------------
read -r -a argv <<<"${SSH_ORIGINAL_COMMAND:-}"
[[ "${argv[0]:-}" == "deploy" ]] || die "only 'deploy <sha>' is permitted (got: ${SSH_ORIGINAL_COMMAND:-<empty>})"
SHA="${argv[1]:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || die "expected a 40-character commit sha, got '${SHA}'"

cd "$PROJECT_DIR" || die "no $PROJECT_DIR"
[[ -f compose.yml && -f .env ]] || die "compose.yml or .env missing"

NEW="${REGISTRY_IMAGE}:${SHA}"

# What is running right now, so we can go back to it. Resolved to a digest:
# a tag can be repointed, a digest cannot, so this survives a later `:latest`
# push landing between our rollback and the pull.
PREV="$(docker inspect -f '{{.Image}}' mg-web 2>/dev/null || true)"
log "current image: ${PREV:-<none, first deploy>}"

log "pulling $NEW"
docker pull --quiet "$NEW" >/dev/null

# MG_IMAGE is what compose.yml interpolates into `image:`. Rewrite it in place,
# atomically, so a crash mid-write cannot leave .env truncated.
tmp="$(mktemp "${PROJECT_DIR}/.env.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
grep -v '^MG_IMAGE=' .env > "$tmp" || true
printf 'MG_IMAGE=%s\n' "$NEW" >> "$tmp"
chmod 600 "$tmp"
mv "$tmp" .env
trap - EXIT

log "restarting onto $SHA"
if docker compose up -d --wait --wait-timeout 120; then
  log "healthy on $SHA"
  docker image prune -f >/dev/null 2>&1 || true
  exit 0
fi

# --- rollback -----------------------------------------------------------------
log "NEW IMAGE NEVER BECAME HEALTHY — rolling back"
docker logs --tail 40 mg-web 2>&1 | sed 's/^/[mg-web] /' || true

if [[ -z "$PREV" ]]; then
  die "no previous image to roll back to; the container is down"
fi

tmp="$(mktemp "${PROJECT_DIR}/.env.XXXXXX")"
grep -v '^MG_IMAGE=' .env > "$tmp" || true
printf 'MG_IMAGE=%s\n' "$PREV" >> "$tmp"
chmod 600 "$tmp"
mv "$tmp" .env

if docker compose up -d --wait --wait-timeout 120; then
  die "rolled back to $PREV — the site is up on the previous build, this deploy failed"
fi
die "rollback ALSO failed; mg-web is down. Investigate now: docker logs mg-web"
