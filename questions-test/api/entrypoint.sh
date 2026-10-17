#!/bin/sh
set -e

echo "[entrypoint] Menjalankan migrasi database..."
attempt=0
until node dist/db/migrate.js; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "[entrypoint] Migrasi gagal setelah $attempt percobaan." >&2
    exit 1
  fi
  echo "[entrypoint] Database belum siap (percobaan $attempt), menunggu 2 detik..."
  sleep 2
done

echo "[entrypoint] Menjalankan seeding database..."
node dist/db/seed.js

echo "[entrypoint] Menjalankan API..."
exec node dist/main.js
