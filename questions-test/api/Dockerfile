# syntax=docker/dockerfile:1

# ================= Build stage =================
FROM node:24.21.0-slim AS build

# Build tools (python3/make/g++) dipakai bila bcrypt perlu kompilasi dari sumber
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Pasang pnpm versi yang dipakai proyek
RUN npm install -g pnpm@12.14.0

WORKDIR /app

# Install dependencies lebih dulu agar ter-cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Salin sumber + aset runtime
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle
COPY openapi ./openapi

# Compile TypeScript -> dist
RUN pnpm build

# Buang devDependencies supaya image runtime ramping
RUN pnpm prune --prod

# ================= Runtime stage =================
FROM node:24.21.0-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Salin hasil build + dependency produksi
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/openapi ./openapi
COPY --from=build /app/package.json ./package.json

# Entrypoint: migrate -> seed -> start
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3100

ENTRYPOINT ["./entrypoint.sh"]
