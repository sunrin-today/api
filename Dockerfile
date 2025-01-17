FROM node:23.6.0-alpine3.21 AS builder

ENV TZ=Asia/Seoul
RUN apk add --no-cache bash openssl tzdata libc6-compat \
    && cp /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/
COPY packages/database/package.json packages/database/
RUN corepack enable && corepack prepare pnpm --activate
RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/packages/database
RUN pnpm run generate

WORKDIR /app/packages/api
RUN pnpm run build

FROM node:23.6.0-alpine3.21 AS runtime

ENV NODE_ENV=production \
    TZ=Asia/Seoul

RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

WORKDIR /app
COPY --from=builder /app .

EXPOSE 3000
CMD ["node", "packages/api/dist/main"]