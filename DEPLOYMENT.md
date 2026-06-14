# Mercado Ahora Deployment

Production runs on the VPS with Docker Compose and is redeployed from GitHub Actions after pushes to `main`.

## Services

- `caddy`: public reverse proxy on ports `80` and `443`
- `frontend`: Next.js standalone production server
- `backend`: Laravel API server
- `postgres`: PostgreSQL database with persistent volume

## Required GitHub Secrets

```text
VPS_HOST=187.127.254.101
VPS_USER=root
VPS_SSH_KEY=<private SSH key>
VPS_APP_DIR=/opt/mercado-ahora
APP_DOMAIN=mercadoahora.com.ar,www.mercadoahora.com.ar
APP_URL=https://mercadoahora.com.ar
ACME_EMAIL=<admin email for Caddy certificates>
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_SCHEME=smtp
MAIL_USERNAME=resend
MAIL_PASSWORD=<Resend API key>
MAIL_FROM_ADDRESS=no-reply@mercadoahora.com.ar
MAIL_FROM_NAME=Mercado Ahora
```

If SSH key auth is not available, the workflow may use `VPS_PASSWORD`, but key auth is preferred.

## Cloudflare DNS

Cloudflare should resolve all public hosts to the VPS:

```text
Type   Name   Target            Proxy
A      @      187.127.254.101   Proxied
A      www    187.127.254.101   Proxied
A      api    187.127.254.101   Proxied
```

SSL/TLS mode should be `Full`. Caddy must receive both `mercadoahora.com.ar` and `www.mercadoahora.com.ar` through `APP_DOMAIN` so it can issue certificates for both hosts.

## First Deploy / VPS Setup

The deploy script can install Docker on Ubuntu if missing. The application directory defaults to:

```bash
/opt/mercado-ahora
```

The first deploy creates `.env.production`, builds containers, runs migrations, creates the Laravel storage link, and starts Caddy.

## Manual Deploy Command On VPS

```bash
export APP_DIR=/opt/mercado-ahora
export REPO_URL=https://github.com/Taras-Progo/Mercado-Ahora.git
export BRANCH=main
bash deploy/deploy.sh
```

## Useful Production Commands

```bash
cd /opt/mercado-ahora
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend php artisan storage:link
```

## Smoke Test

After each deploy verify:

```text
https://mercadoahora.com.ar
https://www.mercadoahora.com.ar
https://mercadoahora.com.ar/api/v1/categories
https://mercadoahora.com.ar/api/v1/products?q=miel
https://mercadoahora.com.ar/api/v1/catalog/filters?q=miel
```

Also test login, password recovery email through Resend, product image URLs under `/storage/*`, checkout, seller order management, and returns.

## Rollback / Retry

If GitHub Actions cannot SSH to the VPS, confirm port `22` is reachable and that Cloudflare is not proxying SSH. Then rerun the workflow. If a release breaks after deploy, SSH into the VPS, checkout the previous known-good commit in `VPS_APP_DIR`, and rerun `bash deploy/deploy.sh`.
