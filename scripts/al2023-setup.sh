#!/usr/bin/env bash
# Run as ec2-user on a fresh Amazon Linux 2023 ARM instance.
set -euo pipefail
. /etc/os-release
if [[ "$ID" != amzn || "$VERSION_ID" != 2023 || "$(uname -m)" != aarch64 ]]; then
  echo 'Este script requiere Amazon Linux 2023 ARM64 (aarch64).' >&2
  exit 1
fi

sudo dnf install -y docker git nano
sudo systemctl enable --now docker
sudo install -d -m 0755 /usr/local/lib/docker/cli-plugins

# Fixed official release assets; verify before installing executable files.
# Manual plugins require explicit version/checksum updates in this script.
setup_dir=$(mktemp -d)
trap 'rm -f "$setup_dir/docker-compose" "$setup_dir/docker-buildx"; rmdir "$setup_dir"' EXIT
curl -fsSL --retry 3 https://github.com/docker/compose/releases/download/v5.6.1/docker-compose-linux-aarch64 \
  -o "$setup_dir/docker-compose"
echo "42cfa75f51ad0ccf290bad37899e0038a8c10a0069e85233ecc1d53e3ff1347d  $setup_dir/docker-compose" | sha256sum -c -
curl -fsSL --retry 3 https://github.com/docker/buildx/releases/download/v0.38.1/buildx-v0.38.1.linux-arm64 \
  -o "$setup_dir/docker-buildx"
echo "3b83b3731916ba433feccaaa689fe5bcdc81c641d92c8e6c2ea865dfa141c97a  $setup_dir/docker-buildx" | sha256sum -c -
sudo install -m 0755 "$setup_dir/docker-compose" /usr/local/lib/docker/cli-plugins/docker-compose
sudo install -m 0755 "$setup_dir/docker-buildx" /usr/local/lib/docker/cli-plugins/docker-buildx

sudo docker version
sudo docker compose version
sudo docker buildx version
sudo docker run --rm hello-world
echo 'Docker listo. Continúa con docs/AWS_AL2023_ARM.md; no se inició el bot ni se modificaron tus secretos.'
