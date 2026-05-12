#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/mercado-ahora}"
REPO_URL="${REPO_URL:-https://github.com/Taras-Progo/Mercado-Ahora.git}"
BRANCH="${BRANCH:-main}"
ENV_FILE="${ENV_FILE:-.env.production}"

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

if [ ! -f "$ENV_FILE" ]; then
    APP_KEY="base64:$(openssl rand -base64 32)"
    POSTGRES_PASSWORD="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 32)"

    cat > "$ENV_FILE" <<EOF
APP_NAME=Mercado Ahora
APP_ENV=production
APP_KEY=$APP_KEY
APP_DEBUG=false
APP_URL=${APP_URL:-http://187.127.254.101}
APP_DOMAIN=${APP_DOMAIN:-:80}
ACME_EMAIL=${ACME_EMAIL:-}

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=mercado_ahora
DB_USERNAME=mercado_ahora
DB_PASSWORD=$POSTGRES_PASSWORD

POSTGRES_DB=mercado_ahora
POSTGRES_USER=mercado_ahora
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

SESSION_DRIVER=database
SESSION_DOMAIN=${SESSION_DOMAIN:-}
SESSION_SECURE_COOKIE=${SESSION_SECURE_COOKIE:-false}
SANCTUM_STATEFUL_DOMAINS=${SANCTUM_STATEFUL_DOMAINS:-}

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
MAIL_MAILER=log

NEXT_PUBLIC_API_BASE_URL=/api/v1
EOF
fi

docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml pull postgres caddy || true
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml build
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --remove-orphans
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml ps
docker image prune -f
