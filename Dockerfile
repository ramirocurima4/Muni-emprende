# ==============================================================================
# Dockerfile Multi-Etapa — MuniEmprende San Roque (Next.js 16 Standalone)
# Base: Node 20 Debian Bookworm Slim (compatibilidad nativa con sharp WebP y Prisma OpenSSL)
# ==============================================================================

# ------------------------------------------------------------------------------
# Etapa 1: deps — Instalación limpia de dependencias y librerías del sistema
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci

# ------------------------------------------------------------------------------
# Etapa 2: builder — Generación del cliente Prisma y compilación Next.js Standalone
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Variables públicas opcionales en tiempo de compilación
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Valor temporal de DATABASE_URL solo para permitir prisma generate y next build
# durante la construcción de la imagen (en runtime se inyecta la URL real desde .env)
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/muniemprende?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build

# ------------------------------------------------------------------------------
# Etapa 3: runner — Imagen de producción liviana con servidor Standalone
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home nextjs

# Archivos estáticos públicos y servidor standalone compilado
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Dependencias nativas (sharp, prisma, tsx) y esquema para ejecutar migraciones y seed en el VPS
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db.ts ./src/lib/db.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
