# syntax=docker/dockerfile:1

# ================= Build stage =================
FROM node:24.22.0-slim AS build

# Pasang pnpm versi yang dipakai proyek
RUN npm install -g pnpm@12.14.0

WORKDIR /app

# Install dependencies lebih dulu agar ter-cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Salin seluruh sumber
COPY . .

# API_BASE_URL dipakai next.config.ts saat build untuk rewrites /api/* ke backend.
ARG API_BASE_URL=http://localhost:3100
ENV API_BASE_URL=${API_BASE_URL}

# Build Next.js (output standalone)
RUN pnpm build

# ================= Runtime stage =================
FROM node:24.22.0-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Salin hasil standalone build + static assets
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

ENV HOSTNAME=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
