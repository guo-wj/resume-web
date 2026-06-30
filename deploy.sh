#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${DEPLOY_ENV_FILE:-.env.prod}"

if [[ -f "$ROOT_DIR/$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/$ENV_FILE"
  set +a
fi

HOST="${DEPLOY_HOST:-8.152.214.136}"
USER="${DEPLOY_USER:-root}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/var/www/html/dist}"
SKIP_BUILD=0

if [[ -n "${CI:-}" ]]; then
  SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
else
  SSH_OPTS=(-o BatchMode=no)
fi

if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  KEY_PATH="${DEPLOY_SSH_KEY/#\~/$HOME}"
  if [[ ! -f "$KEY_PATH" ]]; then
    echo "SSH key not found: $KEY_PATH" >&2
    echo "Set DEPLOY_SSH_KEY in $ENV_FILE to your private key file path." >&2
    exit 1
  fi
  SSH_OPTS+=(-i "$KEY_PATH")
fi

run_ssh() {
  if [[ -n "${DEPLOY_SSH_PASSWORD:-}" ]]; then
    if ! command -v sshpass &>/dev/null; then
      echo "Password auth requires sshpass. Install: brew install hudochenkov/sshpass/sshpass" >&2
      exit 1
    fi
    sshpass -p "$DEPLOY_SSH_PASSWORD" ssh "${SSH_OPTS[@]}" "$@"
  else
    ssh "${SSH_OPTS[@]}" "$@"
  fi
}

run_scp() {
  if [[ -n "${DEPLOY_SSH_PASSWORD:-}" ]]; then
    if ! command -v sshpass &>/dev/null; then
      echo "Password auth requires sshpass. Install: brew install hudochenkov/sshpass/sshpass" >&2
      exit 1
    fi
    sshpass -p "$DEPLOY_SSH_PASSWORD" scp "${SSH_OPTS[@]}" "$@"
  else
    scp "${SSH_OPTS[@]}" "$@"
  fi
}

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Build the frontend and upload ./dist to the remote server.

Options:
  --skip-build   Upload existing ./dist without running npm run build
  -h, --help     Show this help message

Local (.env.prod, override with DEPLOY_ENV_FILE):
  DEPLOY_HOST         Remote host
  DEPLOY_USER         SSH user
  DEPLOY_REMOTE_DIR   Remote dist directory
  DEPLOY_SSH_KEY      Path to SSH private key file (recommended)
  DEPLOY_SSH_PASSWORD SSH login password (requires sshpass)

CI (GitHub Actions):
  Set repository secrets: DEPLOY_HOST, DEPLOY_USER, DEPLOY_REMOTE_DIR,
  DEPLOY_SSH_PRIVATE_KEY. Workflow writes the key to ~/.ssh/deploy_key
  and calls this script with DEPLOY_SSH_KEY=~/.ssh/deploy_key.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "==> Building project..."
  npm run build
fi

if [[ ! -d "$ROOT_DIR/dist" ]]; then
  echo "dist directory not found. Run npm run build first." >&2
  exit 1
fi

REMOTE="${USER}@${HOST}"

echo "==> Clearing remote dist: ${REMOTE}:${REMOTE_DIR}"
run_ssh "$REMOTE" "mkdir -p '${REMOTE_DIR}' && rm -rf '${REMOTE_DIR}'/*"

echo "==> Uploading dist to ${REMOTE}:${REMOTE_DIR}"
run_scp -r "$ROOT_DIR/dist/." "${REMOTE}:${REMOTE_DIR}/"

echo "==> Deploy finished."
