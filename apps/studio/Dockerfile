# ---- Build Stage ----
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/ai/package.json packages/ai/
COPY packages/scene3d/package.json packages/scene3d/
COPY apps/studio/package.json apps/studio/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:schema
RUN pnpm --filter @gis-engine/studio build

# ---- Runtime Stage ----
FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=build /app/apps/studio/dist ./public
COPY --from=build /app/examples/ai-map-workbench/server.mjs ./server.mjs
COPY --from=build /app/examples/ai-map-workbench/initial-map.mjs ./initial-map.mjs
COPY --from=build /app/examples/ai-map-workbench/mock-ai.mjs ./mock-ai.mjs
COPY --from=build /app/examples/ai-map-workbench/openai-compatible-provider.mjs ./openai-compatible-provider.mjs
COPY --from=build /app/examples/ai-map-workbench/provider-profiles.mjs ./provider-profiles.mjs
COPY --from=build /app/packages/engine/dist ./node_modules/@gis-engine/engine/dist
COPY --from=build /app/packages/ai/dist ./node_modules/@gis-engine/ai/dist
COPY --from=build /app/packages/scene3d/dist ./node_modules/@gis-engine/scene3d/dist
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["node", "--experimental-vm-modules", "server.mjs"]
