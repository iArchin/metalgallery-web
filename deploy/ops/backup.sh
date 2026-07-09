#!/usr/bin/env bash
#
# Hot backup of the JSON database. Run on the server.
#
#   /srv/metalgallery/ops/backup.sh
#   BACKUP_DIR=/mnt/backups /srv/metalgallery/ops/backup.sh
#
# Cron (03:15 nightly), as the deploy user:
#   15 3 * * * /srv/metalgallery/ops/backup.sh >> /var/log/mg-backup.log 2>&1
#
# Safe to run while the container serves traffic: every write in lib/server/db.ts
# is a write-to-tmp followed by an atomic rename, so tar sees each collection
# either fully old or fully new — never half-written. The in-flight *.tmp files
# are excluded because they are the only files that can be torn.
#
# The archive contains customer phone numbers, addresses and avatars. It is
# created 0600, and you should copy it OFF this box.
set -euo pipefail

VOLUME="${VOLUME:-mg_data}"
IMAGE="${IMAGE:-metalgallery-web:latest}"
BACKUP_DIR="${BACKUP_DIR:-/srv/metalgallery/backups}"
KEEP="${KEEP:-14}"

STAMP="$(date +%Y-%m-%d-%H%M%S)"
ARCHIVE="mg-data-${STAMP}.tgz"

command -v docker >/dev/null || { echo "docker not found" >&2; exit 1; }
docker volume inspect "$VOLUME" >/dev/null 2>&1 || { echo "no such volume: $VOLUME" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Reuse the app image rather than pulling alpine: it is already on the server,
# and on a filtered network a `docker pull` is exactly what you do not want your
# backup job to depend on. --entrypoint sh skips tini + the seeding script;
# -u 0:0 reads a volume owned by uid 1001 and writes to a root-owned dir.
docker run --rm \
  -u 0:0 \
  --entrypoint sh \
  -v "${VOLUME}:/data:ro" \
  -v "${BACKUP_DIR}:/backup" \
  "$IMAGE" \
  -c "tar czf '/backup/${ARCHIVE}' --exclude='*.tmp' -C /data ."

chmod 600 "${BACKUP_DIR}/${ARCHIVE}"

SIZE=$(du -h "${BACKUP_DIR}/${ARCHIVE}" | cut -f1)
echo "$(date -Is)  backup ok: ${BACKUP_DIR}/${ARCHIVE} (${SIZE})"

# Verify the archive is readable before trusting it and pruning older ones. A
# backup you have never opened is a guess, not a backup.
tar tzf "${BACKUP_DIR}/${ARCHIVE}" >/dev/null || { echo "archive is unreadable — keeping every older backup" >&2; exit 1; }

# Retention: keep the newest $KEEP.
cd "$BACKUP_DIR"
ls -1t mg-data-*.tgz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f -- "$old"
  echo "$(date -Is)  pruned ${old}"
done
