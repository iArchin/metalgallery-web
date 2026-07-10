#!/usr/bin/env bash
#
# Restore the Postgres database from a custom-format dump. Run on the server.
#
#   /opt/metalgallery/ops/restore.sh /opt/metalgallery/backups/mg-db-2026-07-10-031500.dump --force
#
# Destructive: it drops and rebuilds the live database. It refuses to run without
# --force, it dumps the current database first, and it proves the incoming
# archive can actually be restored — into a scratch database — before it destroys
# anything. A mistaken restore is therefore recoverable, and a corrupt archive is
# rejected while the live data is still there.
#
# mg-web is stopped for the duration; mg-db stays UP, because pg_restore needs a
# live server to restore into. The app must be down: it holds a connection pool
# and would write into a half-restored schema.
#
# We drop and recreate only the one database, never the cluster, so the
# metalgallery role that owns the dump's objects survives.
set -euo pipefail
umask 077

ARCHIVE="${1:-}"
FORCE="${2:-}"

CONTAINER="${CONTAINER:-mg-db}"
PROJECT_DIR="${PROJECT_DIR:-/opt/metalgallery}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.yml}"
SCRATCH_DB="${SCRATCH_DB:-mg_restore_check}"
KEEP_PRERESTORE="${KEEP_PRERESTORE:-5}"

die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }
say() { printf '==> %s\n' "$*"; }

[[ -n "$ARCHIVE" ]] || die "usage: restore.sh <dump> --force"
[[ -f "$ARCHIVE" ]] || die "no such dump: $ARCHIVE"
[[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" == "true" ]] ||
  die "container not running: ${CONTAINER} (start the stack first)"

# Full read of the incoming archive before we touch anything: reconstruct it to
# nowhere, so a truncated or corrupt backup fails here, with the live database
# still intact.
docker exec -i "$CONTAINER" pg_restore -f /dev/null <"$ARCHIVE" >/dev/null 2>&1 ||
  die "dump failed verification (truncated or corrupt): ${ARCHIVE}"

if [[ "$FORCE" != "--force" ]]; then
  echo "This DROPS and rebuilds the live database from:"
  echo "    $ARCHIVE"
  echo
  echo "Contents (pg_restore -l):"
  docker exec -i "$CONTAINER" pg_restore -l <"$ARCHIVE" 2>/dev/null |
    grep -v '^;' | head -20 | sed 's/^/    /' || true
  echo
  die "re-run with --force to proceed"
fi

ARCHIVE="$(readlink -f "$ARCHIVE")"
cd "$PROJECT_DIR" || die "no project dir: ${PROJECT_DIR}"
[[ -f "$COMPOSE_FILE" ]] || die "no ${COMPOSE_FILE} in ${PROJECT_DIR}"

# Structural soundness is not the same as "restores cleanly". Prove it applies by
# restoring into a scratch database FIRST, while the real one is still serving.
# --exit-on-error here turns a mid-restore object conflict into a refusal rather
# than into a half-empty production database.
say "Trial-restoring into scratch database ${SCRATCH_DB}"
docker exec "$CONTAINER" sh -c "dropdb -U \"\$POSTGRES_USER\" --force --if-exists ${SCRATCH_DB} && createdb -U \"\$POSTGRES_USER\" -O \"\$POSTGRES_USER\" ${SCRATCH_DB}"
if ! docker exec -i "$CONTAINER" sh -c "exec pg_restore -U \"\$POSTGRES_USER\" -d ${SCRATCH_DB} --no-owner --exit-on-error" <"$ARCHIVE"; then
  docker exec "$CONTAINER" sh -c "dropdb -U \"\$POSTGRES_USER\" --force --if-exists ${SCRATCH_DB}" || true
  die "dump does not restore cleanly — the live database has NOT been touched"
fi
docker exec "$CONTAINER" sh -c "dropdb -U \"\$POSTGRES_USER\" --force --if-exists ${SCRATCH_DB}"

# Snapshot what we are about to destroy, and verify that snapshot before we trust
# our own escape route.
SAFETY="${PROJECT_DIR}/backups/pre-restore-$(date +%Y-%m-%d-%H%M%S).dump"
mkdir -p "${PROJECT_DIR}/backups"
say "Snapshotting current database to ${SAFETY}"
docker exec "$CONTAINER" sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$SAFETY"
chmod 600 "$SAFETY"
docker exec -i "$CONTAINER" pg_restore -f /dev/null <"$SAFETY" >/dev/null 2>&1 ||
  die "safety snapshot is unreadable — refusing to go further; the live database is untouched"

# From here the database is genuinely at risk, so anything that fails must leave
# the site running rather than stopped-and-empty. MG_SKIP_IMPORT keeps the boot
# importer away from a database we are in the middle of rebuilding.
restore_failed() {
  printf '\033[1;31m\nRestore failed.\033[0m Bringing mg-web back up.\n' >&2
  MG_SKIP_IMPORT=1 docker compose -f "$COMPOSE_FILE" up -d --wait web ||
    printf 'mg-web did not come back — investigate: docker logs mg-web\n' >&2
  printf 'The database as it was before this attempt: %s\n' "$SAFETY" >&2
  printf 'Restore it with: %s %s --force\n' "$0" "$SAFETY" >&2
}
trap restore_failed ERR

say "Stopping mg-web"
docker compose -f "$COMPOSE_FILE" stop web

# dropdb --force (PG13+) evicts every remaining connection so DROP cannot hang —
# including any psql session an operator left open, not just the app's pool.
# --no-owner lets the dump restore even if it came from a differently-named role.
say "Rebuilding database and restoring $(basename "$ARCHIVE")"
docker exec "$CONTAINER" sh -c 'dropdb -U "$POSTGRES_USER" --force --if-exists "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" -O "$POSTGRES_USER" "$POSTGRES_DB"'
docker exec -i "$CONTAINER" sh -c 'exec pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --exit-on-error' <"$ARCHIVE"

# MG_SKIP_IMPORT=1 for this one boot. isDatabaseEmpty() should already report a
# populated database, but importing legacy JSON over freshly recovered data is
# not something to leave to a single predicate.
say "Starting mg-web"
MG_SKIP_IMPORT=1 docker compose -f "$COMPOSE_FILE" up -d --wait web

trap - ERR

# The next ordinary deploy recreates web without MG_SKIP_IMPORT, so it does not
# linger. Say so, rather than leaving the operator to wonder.
say "Done. mg-web is running with MG_SKIP_IMPORT=1 until the next deploy recreates it."

# Retention for the safety snapshots, which otherwise accumulate forever. The
# nightly backup.sh only prunes mg-db-*.dump and never touches these.
cd "${PROJECT_DIR}/backups"
ls -1t pre-restore-*.dump 2>/dev/null | tail -n +$((KEEP_PRERESTORE + 1)) | while read -r old; do
  rm -f -- "$old"
  echo "pruned ${old}"
done

echo
echo "Restored from $(basename "$ARCHIVE")."
echo "Previous database is at ${SAFETY} if this was a mistake."
