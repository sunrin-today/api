import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';
import { PrismaClient } from './generated/prisma/client';

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
  // Pooled connection for runtime queries
  connectionString: withLibpqSslCompat(env.DATABASE_URL),
  connectionTimeoutMillis: 5_000,
});

export const prisma = new PrismaClient({ adapter });
