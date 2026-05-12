# Mercado Ahora Deployment

Production deployment uses Docker Compose on the VPS and GitHub Actions for automatic redeploys after pushes to `main`.

## Services

- `caddy`: public reverse proxy on ports `80` and `443`
- `frontend`: Next.js standalone production server
- `backend`: Laravel API server
- `postgres`: PostgreSQL database with persistent volume

## One-time VPS setup

The deploy workflow can install Docker on Ubuntu automatically if it is missing. The application directory defaults to:

```bash
/opt/mercado-ahora
```

The first deploy creates `.env.production` on the VPS with generated database password and Laravel `APP_KEY`.

## GitHub Actions secrets

Add these repository secrets:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
VPS_APP_DIR
APP_URL
APP_DOMAIN
ACME_EMAIL
```

For IP-only deployment, use:

```text
APP_URL=http://187.127.254.101
APP_DOMAIN=:80
```

For a real domain, use:

```text
APP_URL=https://your-domain.com
APP_DOMAIN=your-domain.com
ACME_EMAIL=admin@your-domain.com
```

## Manual deploy command on VPS

```bash
export APP_DIR=/opt/mercado-ahora
export REPO_URL=https://github.com/Taras-Progo/Mercado-Ahora.git
export BRANCH=main
bash deploy/deploy.sh
```

## Useful production commands

```bash
cd /opt/mercado-ahora
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan migrate --force
```
