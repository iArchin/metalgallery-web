#!/bin/sh
# Seeds the data volume, then hands off to the CMD (node server.js).
#
# Invoked as: tini -- /app/docker-entrypoint.sh node server.js
#
# The contract is idempotent and non-destructive: a collection file is copied
# out of the baked, PII-free /app/data.seed only when it is ABSENT from the
# volume. Consequences, all of them intended:
#
#   fresh volume      -> gets all 14 collections, storefront boots with a catalog
#   populated volume  -> nothing is touched, live orders survive every redeploy
#   new collection    -> a release that adds one fills only that file in
#
set -eu

: "${DATA_DIR:=/app/data}"
: "${SEED_DIR:=/app/data.seed}"

mkdir -p "$DATA_DIR"

# Only reachable if someone overrides USER root (e.g. to repair a bind mount).
# Under the normal non-root runtime this is skipped — a uid-1001 process cannot
# chown to another uid anyway, and the named volume already inherited ownership
# from the image's mount point.
if [ "$(id -u)" = "0" ]; then
  chown -R 1001:1001 "$DATA_DIR" 2>/dev/null || true
fi

if [ -d "$SEED_DIR" ]; then
  for src in "$SEED_DIR"/*.json; do
    [ -e "$src" ] || continue   # no matches: the glob stayed literal
    dest="$DATA_DIR/$(basename "$src")"
    if [ ! -e "$dest" ]; then
      cp "$src" "$dest"
      echo "[entrypoint] seeded missing collection: $(basename "$src")"
    fi
  done
fi

# exec, so node replaces this shell and receives the signals tini forwards.
exec "$@"
