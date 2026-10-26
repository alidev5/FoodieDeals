# Images for `docker compose up`:
#   api -> the API on http://localhost:3000/api (Node, talks to the postgres service)
#   web -> both web apps served by nginx: customer on :8081, restaurant on :8082

FROM node:22-slim AS base
WORKDIR /repo
ENV HUSKY=0 CI=1
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate
# Manifests first, so code changes don't re-run the install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/customer/package.json apps/customer/
COPY apps/restaurant/package.json apps/restaurant/
COPY packages/shared/package.json packages/shared/
COPY packages/ui-native/package.json packages/ui-native/

# ---- API ----
FROM base AS api
RUN pnpm install --frozen-lockfile --filter "@foodiedeals/api..."
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY supabase supabase
RUN pnpm --filter @foodiedeals/shared build
WORKDIR /repo/apps/api
# The scripts load .env; the real values come from docker-compose and take precedence.
RUN cp .env.example .env
EXPOSE 3000
# Applies new migrations, seeds a fresh database once, then serves the API.
CMD ["sh", "-c", "pnpm db:migrate && pnpm db:seed --if-empty && pnpm start"]

# ---- Web apps ----
FROM base AS web-build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @foodiedeals/shared build
# Set by docker-compose. With API_URL the apps use that API instead of the hosted Supabase one.
ARG API_URL=""
ARG STRIPE_PUBLISHABLE_KEY=""
RUN for app in customer restaurant; do \
      env=apps/$app/.env; \
      [ -f $env ] || cp $env.example $env; \
      if [ -n "$API_URL" ]; then \
        sed -i '/^EXPO_PUBLIC_SUPABASE_/d; /^EXPO_PUBLIC_API_URL=/d' $env; \
        echo "EXPO_PUBLIC_API_URL=$API_URL" >> $env; \
      fi; \
      if [ -n "$STRIPE_PUBLISHABLE_KEY" ]; then \
        sed -i '/^EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=/d' $env; \
        echo "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" >> $env; \
      fi; \
      (cd apps/$app && npx expo export -p web --output-dir /out/$app) || exit 1; \
    done

FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /out/customer /usr/share/nginx/customer
COPY --from=web-build /out/restaurant /usr/share/nginx/restaurant
EXPOSE 8081 8082
