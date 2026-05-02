# Mercado Ahora - Initial Setup

This repository is currently structured for Milestone 1A:

- `backend/`: Laravel API foundation.
- `frontend/`: Next.js App Router frontend foundation.
- `docker-compose.yml`: PostgreSQL service configuration for local development.
- `tools/php/php.ini`: local PHP configuration used on this Windows machine to enable Laravel and PostgreSQL extensions.

## Backend

The Laravel app is configured to use PostgreSQL:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=mercado_ahora
DB_USERNAME=mercado_ahora
DB_PASSWORD=mercado_ahora
```

Run the backend locally:

```powershell
$php = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
cd backend
& $php -c ..\tools\php\php.ini artisan serve
```

Run migrations after PostgreSQL is running:

```powershell
$php = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
cd backend
& $php -c ..\tools\php\php.ini artisan migrate
```

Run the current backend tests:

```powershell
$php = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
cd backend
& $php -c ..\tools\php\php.ini .\vendor\bin\phpunit
```

## Frontend

The Next.js app reads the API URL from:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend locally:

```powershell
cd frontend
npm run dev
```

## PostgreSQL

If Docker is available:

```powershell
docker compose up -d postgres
```

This starts a local PostgreSQL database matching the Laravel environment values above.

If Docker is not available, install PostgreSQL locally and create a database/user with the same values from the Laravel `.env` file before running migrations.
