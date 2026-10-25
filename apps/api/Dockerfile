FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui-native/package.json packages/ui-native/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @foodiedeals/shared build
RUN pnpm --filter @foodiedeals/api exec prisma generate
RUN pnpm --filter @foodiedeals/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/packages/shared /workspace/packages/shared
COPY --from=build /workspace/apps/api /workspace/apps/api
WORKDIR /workspace/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
