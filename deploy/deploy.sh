#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/mercado-ahora}"
REPO_URL="${REPO_URL:-https://github.com/Taras-Progo/Mercado-Ahora.git}"
BRANCH="${BRANCH:-main}"
ENV_FILE="${ENV_FILE:-.env.production}"

set_env_value() {
    key="$1"
    value="$2"

    if grep -q "^${key}=" "$ENV_FILE"; then
        tmp_file="$(mktemp)"
        awk -v key="$key" -v value="$value" 'BEGIN { prefix = key "=" } index($0, prefix) == 1 { print key "=" value; next } { print }' "$ENV_FILE" > "$tmp_file"
        cat "$tmp_file" > "$ENV_FILE"
        rm -f "$tmp_file"
    else
        printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    fi
}

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
NEXT_PUBLIC_STORAGE_URL=/storage
EOF
fi

if [ -n "${APP_URL:-}" ]; then
    set_env_value "APP_URL" "$APP_URL"
fi

if [ -n "${APP_DOMAIN:-}" ]; then
    set_env_value "APP_DOMAIN" "$APP_DOMAIN"
fi

if [ -n "${ACME_EMAIL:-}" ]; then
    set_env_value "ACME_EMAIL" "$ACME_EMAIL"
fi

if [ -n "${SESSION_DOMAIN:-}" ]; then
    set_env_value "SESSION_DOMAIN" "$SESSION_DOMAIN"
fi

if [ -n "${SANCTUM_STATEFUL_DOMAINS:-}" ]; then
    set_env_value "SANCTUM_STATEFUL_DOMAINS" "$SANCTUM_STATEFUL_DOMAINS"
fi

case "${APP_URL:-}" in
    https://*)
        set_env_value "SESSION_SECURE_COOKIE" "true"
        ;;
esac

set_env_value "NEXT_PUBLIC_API_BASE_URL" "${NEXT_PUBLIC_API_BASE_URL:-/api/v1}"
set_env_value "NEXT_PUBLIC_STORAGE_URL" "${NEXT_PUBLIC_STORAGE_URL:-/storage}"

docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml pull postgres caddy || true
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml build
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --remove-orphans
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml ps
docker image prune -f
