import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Direct (non-pooled) connection for migrate / introspect / studio
    url: env('DATABASE_DIRECT_URL'),
  },
});
