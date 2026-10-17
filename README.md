``` bash
> run db 
alias docker-db='docker compose -f docker-compose.db.yml --env-file .env.dev'
```

## Menjalankan lewat Docker (untuk tim)

Teman tim cukup clone repo ini, lalu jalankan:

``` bash
docker compose up -d
```

`docker compose` akan otomatis:
1. Build image API dari `questions-test/api/Dockerfile` (tidak perlu push ke registry).
2. Menjalankan Postgres + API.

- API: `http://localhost:3100/api` (cek `GET /api/health`)
- Database (Postgres): `localhost:5432`

Saat container API pertama kali start, migrasi (`drizzle`) dan seeding otomatis dijalankan lebih dulu.
Kredensial DB default (`renzi`/`renzi`) bisa dioverride lewat env `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

Untuk rebuild setelah ada perubahan kode:

``` bash
docker compose up -d --build
```
