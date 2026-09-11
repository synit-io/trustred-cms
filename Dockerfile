FROM node:26.8.1-alpine AS base

FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/data /app/media /app/public
RUN PAYLOAD_SECRET=trustred-build-only-secret npm run build
RUN npx esbuild scripts/seed.ts scripts/seed-user.ts scripts/run-migrations.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --target=node24 \
  --banner:js="import { createRequire as __trustredCreateRequire } from 'node:module';const require = __trustredCreateRequire(import.meta.url);" \
  --outdir=/app/dist/scripts \
  --external:dotenv \
  --external:sharp \
  --external:@libsql/client
RUN mkdir -p /app/dist/migrations \
  && if [ -f /app/src/migrations/index.ts ]; then \
    npx esbuild /app/src/migrations/index.ts \
      --bundle \
      --platform=node \
      --format=esm \
      --target=node24 \
      --banner:js="import { createRequire as __trustredCreateRequire } from 'node:module';const require = __trustredCreateRequire(import.meta.url);" \
      --outfile=/app/dist/migrations/index.js \
      --external:sharp \
      --external:@libsql/client; \
  fi \
  && if [ -d /app/src/migrations ]; then cp /app/src/migrations/*.json /app/dist/migrations/ 2>/dev/null || true; fi

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:./data/trustred-cms.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir -p /app/data /app/public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/dist/migrations ./migrations
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-kit ./node_modules/drizzle-kit
COPY --chown=nextjs:nodejs docker/package.json ./package.json
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./docker-entrypoint.sh

RUN test -f /app/public/demo-seed-images/fire-station-hero.jpg \
  && test -f /app/public/demo-seed-images/equipment-compartment.jpg \
  && mkdir -p /app/data /app/media \
  && chmod +x /app/docker-entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
