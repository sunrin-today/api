FROM oven/bun:1.3-debian AS builder

ENV TZ=Asia/Seoul

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY tsconfig.json ./

# generate only needs placeholder URLs; runtime uses real env vars
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
    DATABASE_DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
RUN bunx prisma generate

FROM oven/bun:1.3-debian AS runtime

ENV NODE_ENV=production \
    TZ=Asia/Seoul

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
