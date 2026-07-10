#!/usr/bin/env bash
#
# Nightly logical backup of the Postgres database. Run on the server.
#
#   /opt/metalgallery/ops/backup.sh
#   BACKUP_DIR=/mnt/backups /opt/metalgallery/ops/backup.sh
#
# Cron (03:15 nightly), as root:
#   15 3 * * * /opt/metalgallery/ops/backup.sh >> /var/log/mg-backup.log 2>&1
#
# Safe to run while the site serves traffic. pg_dump takes its snapshot inside a
# single repeatable-read transaction, so the file is one consistent instant of
# the database no matter what writes land during it. Nothing is locked and
# nothing is stopped — the guarantee the old JSON tar got from atomic renames is
# now given by Postgres itself.
#
# We dump THROUGH the running mg-db container. No image is pulled and no volume
# is mounted, which is what a backup job on a filtered network must never depend
# on. No password appears here or in the host's process list: POSTGRES_USER and
# POSTGRES_DB already live in the container's environment, and the official image
# trusts connections over its local socket. (The app needs a password only
# because it connects over TCP.)
#
# Custom format (-Fc) so a restore can be selective. The dump holds customer
# phone numbers and addresses: it is written 0600 into a root-owned directory.
# Copy it OFF this box — it currently shares a disk with the database it backs up.
set -euo pipefail
umask 077 # every file is 0600 from birth, before any customer data lands in it

CONTAINER="${CONTAINER:-mg-db}"
PROJECT_DIR="${PROJECT_DIR:-/opt/metalgallery}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups}"
KEEP="${KEEP:-14}"

STAMP="$(date +%Y-%m-%d-%H%M%S)"
DUMP="mg-db-${STAMP}.dump"

die() { printf '[backup] error: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "docker not found"
[[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" == "true" ]] ||
  die "container not running: ${CONTAINER}"

# We dump $POSTGRES_DB; the app reads $DATABASE_URL. If those ever name different
# databases, this script would faithfully back up one while customers write to the
# other, and nothing downstream would notice.
if [[ -r "${PROJECT_DIR}/.env" ]]; then
  env_db="$(sed -n 's/^POSTGRES_DB=//p' "${PROJECT_DIR}/.env")"
  url_db="$(sed -n 's#^DATABASE_URL=.*/\([^?]*\)$#\1#p' "${PROJECT_DIR}/.env")"
  if [[ -n "$env_db" && -n "$url_db" && "$env_db" != "$url_db" ]]; then
    die "POSTGRES_DB=${env_db} but DATABASE_URL points at ${url_db} — refusing to back up the wrong database"
  fi
fi

# A dump that is structurally perfect but empty is the most common backup
# disaster, and it passes every integrity check ever written. Ask the live
# database whether it holds anything BEFORE we can rotate a run of empties over
# the last good backup. Same tables as isDatabaseEmpty() in import-json.ts.
rows="$(docker exec "$CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "
  SELECT (SELECT count(*) FROM products)
       + (SELECT count(*) FROM orders)
       + (SELECT count(*) FROM customers)
       + (SELECT count(*) FROM admin_users)
       + (SELECT count(*) FROM categories)"')"
[[ "$rows" =~ ^[0-9]+$ ]] || die "could not count rows (got: ${rows})"
((rows > 0)) || die "database reports 0 rows across products/orders/customers/admin_users/categories — refusing to take, and rotate on, an empty backup"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Dump to .partial first. A dump that dies halfway — a full disk, a killed
# container — must never land under the canonical name, or retention would later
# prune good backups in order to keep a stub. No -t: a TTY corrupts the binary
# stream.
PART="${BACKUP_DIR}/${DUMP}.partial"
trap 'rm -f "$PART"' EXIT
docker exec "$CONTAINER" sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$PART"

# Verify before trusting it and before pruning older ones. `pg_restore -f
# /dev/null` is the `tar tzf` of a custom dump: it reconstructs the whole archive
# to nowhere, reading every data block and touching no database, so a truncation
# or a corrupt page fails HERE. (`pg_restore -l` reads only the table of contents
# at the front, and would happily list a torn tail.) A backup you have never
# opened is a guess, not a backup.
docker exec -i "$CONTAINER" pg_restore -f /dev/null <"$PART" >/dev/null 2>&1 ||
  die "dump failed verification — keeping every older backup"

mv "$PART" "${BACKUP_DIR}/${DUMP}"
trap - EXIT
chmod 600 "${BACKUP_DIR}/${DUMP}"

SIZE=$(du -h "${BACKUP_DIR}/${DUMP}" | cut -f1)
echo "$(date -Is)  backup ok: ${BACKUP_DIR}/${DUMP} (${SIZE}, ${rows} rows)"

# Retention: keep the newest $KEEP. Matches only mg-db-*.dump, so the one-time
# legacy JSON archive and restore.sh's pre-restore-*.dump snapshots are never
# swept up. Unreachable unless every gate above passed.
cd "$BACKUP_DIR"
ls -1t mg-db-*.dump 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f -- "$old"
  echo "$(date -Is)  pruned ${old}"
done
