#!/bin/sh
set -e

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

if [ "${APP_ENV:-production}" = "production" ]; then
    php artisan config:clear
    php artisan view:clear
    php artisan migrate --force
    php artisan config:cache
    php artisan view:cache
else
    php artisan migrate --force
fi

exec "$@"
