FROM node:23-bookworm-slim AS builder

ENV TZ=Asia/Seoul

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/
COPY packages/database/package.json packages/database/
RUN corepack enable && corepack prepare pnpm --activate
RUN pnpm install --frozen-lockfile

RUN apt-get update -y && apt-get install -y openssl

COPY . .

WORKDIR /app/packages/database
RUN pnpm run migrate:prod
RUN pnpm run generate

WORKDIR /app/packages/api
RUN pnpm run build

FROM node:23-bookworm-slim AS runtime

ENV NODE_ENV=production \
    TZ=Asia/Seoul

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app
COPY --from=builder /app .

EXPOSE 3000
CMD ["node", "packages/api/dist/main"]