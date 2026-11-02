# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS manifests
WORKDIR /app
ENV HUSKY=0 PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY apps/whatsapp-bot/package.json apps/whatsapp-bot/package.json

FROM manifests AS build-deps
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM build-deps AS api-build
COPY apps/api apps/api
RUN npm run build --workspace=api

FROM manifests AS api-deps
RUN npm ci --workspace=api --include-workspace-root=false --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:22-bookworm-slim AS api
ENV NODE_ENV=production
WORKDIR /app/apps/api
COPY --from=api-deps /app/node_modules /app/node_modules
COPY --from=api-deps /app/apps /app/apps
COPY --from=api-build /app/apps/api/dist ./dist
# Swagger reads route annotations from the source files.
COPY --from=api-build /app/apps/api/src/routes ./src/routes
RUN mkdir -p tmp logs && chown -R node:node /app/apps/api
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]

FROM build-deps AS bot-build
COPY apps/whatsapp-bot apps/whatsapp-bot
RUN npm run build --workspace=whatsapp-bot

FROM manifests AS bot-deps
RUN npm ci --workspace=whatsapp-bot --include-workspace-root=false --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:22-bookworm-slim AS whatsapp-bot
ENV NODE_ENV=production PUPPETEER_CACHE_DIR=/opt/chrome
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libatspi2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnss3 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libxkbcommon0 \
    xdg-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=bot-deps /app/node_modules ./node_modules
COPY --from=bot-deps /app/apps ./apps
RUN PUPPETEER_SKIP_CHROME_HEADLESS_SHELL_DOWNLOAD=true node node_modules/puppeteer/install.mjs \
    && chmod -R a+rX /opt/chrome \
    && mkdir -p /data/whatsapp && chown node:node /data/whatsapp
WORKDIR /app/apps/whatsapp-bot
COPY --from=bot-build /app/apps/whatsapp-bot/dist ./dist
COPY apps/whatsapp-bot/scripts ./scripts
USER node
CMD ["node", "dist/index.js"]

FROM build-deps AS web-build
# Vite reads each app's .env.production during its production build.
# These two files contain public VITE_* values only, never server credentials.
COPY apps/frontend apps/frontend
COPY apps/docs apps/docs
RUN npm run build --workspace=frontend && npm run build --workspace=docs

FROM nginx:1.28-alpine AS nginx
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/frontend/dist /usr/share/nginx/frontend
COPY --from=web-build /app/apps/docs/dist /usr/share/nginx/docs
EXPOSE 80 81
