function required(name: string): string {
  const value = Bun.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function swaggerPath() {
  const raw = Bun.env.SWAGGER_ENDPOINT || '/docs';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export const env = {
  NODE_ENV: Bun.env.NODE_ENV ?? 'development',
  PORT: Number(
    Bun.env.PORT ?? (Bun.env.NODE_ENV === 'production' ? 3000 : 8000),
  ),
  API_KEY: required('API_KEY'),
  /** Pooled connection for the app (PrismaClient) */
  DATABASE_URL: required('DATABASE_URL'),
  /** Redis for meal response cache */
  REDIS_URL: required('REDIS_URL'),
  SWAGGER_ENDPOINT: swaggerPath(),
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
};
