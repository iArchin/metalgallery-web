#!/usr/bin/env bash
#
# Restore the JSON database from a backup archive. Run on the server.
#
#   /srv/metalgallery/ops/restore.sh /srv/metalgallery/backups/mg-data-2026-07-09-031500.tgz
#
# Destructive: it REPLACES the live database. It refuses to run without --force,
# and it takes a snapshot of the current data first, so a mistaken restore is
# itself recoverable.
#
# The container is stopped for the duration. It has to be: the app holds the
# single-writer lock on this volume, and swapping files under a running process
# is how you get a half-restored database.
set -euo pipefail

ARCHIVE="${1:-}"
FORCE="${2:-}"

VOLUME="${VOLUME:-mg_data}"
IMAGE="${IMAGE:-metalgallery-web:latest}"
PROJECT_DIR="${PROJECT_DIR:-/srv/metalgallery}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"

die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -n "$ARCHIVE" ]] || die "usage: restore.sh <archive.tgz> --force"
[[ -f "$ARCHIVE" ]] || die "no such archive: $ARCHIVE"
tar tzf "$ARCHIVE" >/dev/null 2>&1 || die "not a readable gzip tar: $ARCHIVE"

if [[ "$FORCE" != "--force" ]]; then
  echo "This REPLACES the live database in volume '${VOLUME}' with:"
  echo "    $ARCHIVE"
  echo
  echo "Contents:"
  tar tzf "$ARCHIVE" | head -20 | sed 's/^/    /'
  echo
  die "re-run with --force to proceed"
fi

ARCHIVE="$(readlink -f "$ARCHIVE")"
cd "$PROJECT_DIR" || die "no project dir: $PROJECT_DIR"
[[ -f "$COMPOSE_FILE" ]] || die "no ${COMPOSE_FILE} in ${PROJECT_DIR}"

# Snapshot what we are about to destroy.
SAFETY="${PROJECT_DIR}/backups/pre-restore-$(date +%Y-%m-%d-%H%M%S).tgz"
mkdir -p "${PROJECT_DIR}/backups"
echo "==> Snapshotting current data to ${SAFETY}"
docker run --rm -u 0:0 --entrypoint sh \
  -v "${VOLUME}:/data:ro" -v "${PROJECT_DIR}/backups:/backup" \
  "$IMAGE" -c "tar czf '/backup/$(basename "$SAFETY")' --exclude='*.tmp' -C /data ."
chmod 600 "$SAFETY"

echo "==> Stopping mg-web"
docker compose -f "$COMPOSE_FILE" stop web

# Wipe then extract, inside one container run. Deleting the contents rather than
# the mount point keeps the volume (and its ownership) intact.
echo "==> Restoring ${ARCHIVE}"
docker run --rm -u 0:0 --entrypoint sh \
  -v "${VOLUME}:/data" \
  -v "$(dirname "$ARCHIVE"):/restore:ro" \
  "$IMAGE" \
  -c "rm -rf /data/* /data/.[!.]* 2>/dev/null || true; tar xzf '/restore/$(basename "$ARCHIVE")' -C /data && chown -R 1001:1001 /data"

echo "==> Starting mg-web"
docker compose -f "$COMPOSE_FILE" up -d --wait web

echo
echo "Restored from $(basename "$ARCHIVE")."
echo "Previous data is at ${SAFETY} if this was a mistake."
