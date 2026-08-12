import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';
import { PrismaClient } from './generated/prisma/client';
import { logger } from './logger';

/**
 * pg v8 treats sslmode=require/prefer/verify-ca as verify-full and warns.
 * Opt into libpq-compatible semantics to silence the warning.
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
function withLibpqSslCompat(connectionString: string): string {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get('sslmode');

  if (
    sslmode === 'prefer' ||
    sslmode === 'require' ||
    sslmode === 'verify-ca'
  ) {
    url.searchParams.set('uselibpqcompat', 'true');
  }

  return url.toString();
}

const adapter = new PrismaPg({
  connectionString: withLibpqSslCompat(env.DATABASE_URL),
  connectionTimeoutMillis: 20_000,
  max: 5,
  idleTimeoutMillis: 30_000,
});

export const prisma = new PrismaClient({ adapter });

const CONNECT_ATTEMPTS = 3;
const CONNECT_RETRY_BASE_MS = 500;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function connectPrisma() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      logger.info({ attempt }, 'database connected');
      return;
    } catch (err) {
      lastError = err;
      logger.warn({ err, attempt }, 'database connect failed');
      if (attempt < CONNECT_ATTEMPTS) {
        await sleep(CONNECT_RETRY_BASE_MS * attempt);
      }
    }
  }

  throw lastError;
}
