#!/usr/bin/env bash
#
# One-time server preparation. Run as root on a fresh Ubuntu 22.04/24.04 VPS:
#
#   DEPLOY_PUBKEY="ssh-ed25519 AAAA... you@laptop" bash bootstrap-server.sh
#
# Idempotent: every step checks before it acts, so re-running is safe.
# It does NOT deploy the app — see deploy/DEPLOY.md for that.
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PUBKEY="${DEPLOY_PUBKEY:-}"
SWAP_GB="${SWAP_GB:-2}"

[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
skip() { printf '    \033[2m(already done: %s)\033[0m\n' "$*"; }

# -----------------------------------------------------------------------------
step "0. What already listens on this box?"
# Read this before you go further. If something already owns 80/443 — very
# likely a system nginx fronting your existing project — you must decide between
# migrating it behind the shared Caddy (recommended, see DEPLOY.md) or keeping
# it and NOT running the edge stack. Two proxies cannot both bind 443.
ss -tlnp 2>/dev/null | awk 'NR==1 || /:(80|443|3000) /' || true
echo
echo "    If ports 80/443 are taken, stop and read deploy/DEPLOY.md §'existing project'."

# -----------------------------------------------------------------------------
step "1. Egress preflight (this decides your whole install path)"
# None of this can be checked from a developer machine — the answers depend on
# where this server sits. Record them; DEPLOY.md branches on the results.
probe() {
  local name="$1" url="$2" want="$3"
  if curl -sS -o /dev/null -m 12 -w '%{http_code}' "$url" 2>/dev/null | grep -qE "$want"; then
    printf '    \033[1;32mOK\033[0m    %s\n' "$name"
  else
    printf '    \033[1;31mFAIL\033[0m  %s  <- %s\n' "$name" "$url"
  fi
}
command -v curl >/dev/null || apt-get update -qq && apt-get install -y -qq curl
probe "Docker Hub"      "https://registry-1.docker.io/v2/"                "401|200"
probe "Let's Encrypt"   "https://acme-v02.api.letsencrypt.org/directory"  "200"
probe "npm registry"    "https://registry.npmjs.org/"                     "200"
echo
echo "    Docker Hub FAIL  -> you must pre-load base images or set a registry mirror (step 6)."
echo "    Let's Encrypt FAIL -> automatic TLS will not work; see DEPLOY.md 'TLS fallbacks'."
echo "    npm FAIL         -> irrelevant here; the image is built on your laptop, not this box."

# -----------------------------------------------------------------------------
step "2. System packages, timezone, automatic security updates"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg ufw fail2ban unattended-upgrades
timedatectl set-timezone Asia/Tehran
systemctl enable --now fail2ban >/dev/null 2>&1 || true
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true

# -----------------------------------------------------------------------------
step "3. Swap (${SWAP_GB}G)"
# Not for the build — that happens on your laptop — but a 1 GB VPS running Node,
# Caddy and a nightly tar will OOM-kill something without it.
if swapon --show | grep -q '/swapfile'; then
  skip "swapfile active"
else
  fallocate -l "${SWAP_GB}G" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -qw vm.swappiness=10
  grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

# -----------------------------------------------------------------------------
step "4. Deploy user"
if id "$DEPLOY_USER" >/dev/null 2>&1; then
  skip "user $DEPLOY_USER"
else
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
if [[ -n "$DEPLOY_PUBKEY" ]]; then
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
  grep -qF "$DEPLOY_PUBKEY" "/home/$DEPLOY_USER/.ssh/authorized_keys" \
    || echo "$DEPLOY_PUBKEY" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
else
  echo "    DEPLOY_PUBKEY not set — add your key to /home/$DEPLOY_USER/.ssh/authorized_keys yourself."
fi

# -----------------------------------------------------------------------------
step "5. Docker Engine + compose plugin"
if command -v docker >/dev/null 2>&1; then
  skip "docker $(docker --version | awk '{print $3}' | tr -d ,)"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
# Membership of the docker group is equivalent to root on this host — anyone in
# it can mount / into a container. That is an accepted trade for the deploy user.
usermod -aG docker "$DEPLOY_USER"
systemctl enable --now docker

# -----------------------------------------------------------------------------
step "6. Docker daemon: global log rotation (+ optional registry mirror)"
# Without this, every container's json log grows unbounded until the disk fills.
if [[ -f /etc/docker/daemon.json ]]; then
  skip "/etc/docker/daemon.json exists — leaving it alone"
  cat /etc/docker/daemon.json | sed 's/^/    /'
else
  cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true
}
JSON
  systemctl restart docker
fi
cat <<'NOTE'

    If step 1 reported Docker Hub as FAIL, you have two options:

    (a) Pre-load the base images from your laptop (no mirror needed, works
        today, what DEPLOY.md assumes):
            docker pull caddy:2-alpine
            docker save caddy:2-alpine | gzip -1 | ssh deploy@SERVER 'gunzip | docker load'
        The app image is already shipped this way, and node:22-bookworm-slim is
        only needed at build time — on your laptop, not here.

    (b) Add a registry mirror to /etc/docker/daemon.json:
            { "registry-mirrors": ["https://<mirror-host>"] }
        then `systemctl restart docker`.
        Get <mirror-host> from Parspack support or your panel. Do not take one
        from a blog post or from me — Iranian Docker mirrors change often and a
        wrong or hostile mirror silently serves you someone else's images.
NOTE

# -----------------------------------------------------------------------------
step "7. Firewall"
# Docker publishes ports by writing iptables NAT rules AHEAD of UFW's chains, so
# UFW cannot protect a published container port. The design relies on this
# instead: only the edge proxy publishes anything, everything else talks over
# the internal `edge` network.
ufw allow 22/tcp   >/dev/null
ufw allow 80/tcp   >/dev/null
ufw allow 443/tcp  >/dev/null
ufw allow 443/udp  >/dev/null   # HTTP/3
ufw --force enable >/dev/null
ufw status verbose | sed 's/^/    /'
echo "    If Parspack's control panel needs another port, add it now: ufw allow <port>/tcp"

# -----------------------------------------------------------------------------
step "8. Directory layout for three projects"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 755 /srv/edge /srv/metalgallery /srv/metalgallery/ops /srv/metalgallery/backups
chmod 700 /srv/metalgallery/backups
tree -L 2 /srv 2>/dev/null || find /srv -maxdepth 2 | sed 's/^/    /'

# -----------------------------------------------------------------------------
step "9. Shared network"
if docker network inspect edge >/dev/null 2>&1; then
  skip "network edge"
else
  docker network create edge >/dev/null
fi

# -----------------------------------------------------------------------------
cat <<EOF

Done. Next, from your laptop:

  1. scp deploy/edge/{compose.yml,Caddyfile}      ${DEPLOY_USER}@SERVER:/srv/edge/
  2. scp deploy/metalgallery/compose.yml          ${DEPLOY_USER}@SERVER:/srv/metalgallery/
  3. scp deploy/metalgallery/.env.example         ${DEPLOY_USER}@SERVER:/srv/metalgallery/.env
     ssh ${DEPLOY_USER}@SERVER 'chmod 600 /srv/metalgallery/.env && \$EDITOR /srv/metalgallery/.env'
  4. scp deploy/ops/{backup.sh,restore.sh}        ${DEPLOY_USER}@SERVER:/srv/metalgallery/ops/
  5. SSH_HOST=${DEPLOY_USER}@SERVER ./deploy/ops/deploy.sh

Full sequence, including DNS: deploy/DEPLOY.md
EOF
