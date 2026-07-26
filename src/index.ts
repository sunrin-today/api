import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { helmet } from 'elysia-helmet';
import { env } from './env';
import { AppError } from './errors';
import { logRequest, logger } from './logger';
import { mealsRoutes } from './modules/meals';
import { connectRedis } from './redis';

function apiResponse({
  status,
  success,
  data = null,
  message,
}: {
  status: number;
  success: boolean;
  data?: unknown;
  message?: string;
}) {
  return {
    status,
    success,
    data,
    ...(message !== undefined ? { message } : {}),
    responseAt: new Date().toISOString(),
  };
}

const app = new Elysia()
  .use(
    helmet({
      // Swagger UI needs inline scripts/styles
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
        },
      },
    }),
  )
  .use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    }),
  )
  .use(
    openapi({
      path: env.SWAGGER_ENDPOINT,
      provider: 'swagger-ui',
      documentation: {
        info: {
          title: '선린투데이 API',
          description: '선린인터넷고등학교 급식 서비스 API',
          version: '0.0.1',
          contact: {
            name: 'Jeewon Kwon',
            url: 'https://github.com/jwkwon0817',
            email: 'jeewon.kwon.0817@gmail.com',
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
        servers: [
          { url: 'http://localhost:8000', description: 'Local Development' },
          { url: 'https://api.sunrin.kr', description: 'Production' },
        ],
        tags: [{ name: 'meal', description: 'Meal endpoints' }],
      },
    }),
  )
  .derive({ as: 'global' }, () => ({
    requestStartedAt: performance.now(),
  }))
  .onError(({ error, set, code, request, path, requestStartedAt }) => {
    const status =
      error instanceof AppError
        ? error.status
        : code === 'VALIDATION'
          ? 400
          : code === 'NOT_FOUND'
            ? 404
            : typeof error === 'object' &&
                error &&
                'status' in error &&
                typeof error.status === 'number'
              ? error.status
              : 500;

    const message =
      error instanceof AppError
        ? error.message
        : code === 'VALIDATION'
          ? error.message
          : code === 'NOT_FOUND'
            ? 'Not Found'
            : error instanceof Error
              ? error.message
              : 'Internal Server Error';

    set.status = status;

    logRequest({
      method: request.method,
      path,
      status,
      ms: Math.round(performance.now() - (requestStartedAt ?? performance.now())),
      message,
      err: status >= 500 ? error : undefined,
    });

    return apiResponse({
      status,
      success: false,
      message:
        status >= 500 && env.isProduction ? 'Internal Server Error' : message,
    });
  })
  .onAfterHandle(({ responseValue, set, path }) => {
    if (
      path === env.SWAGGER_ENDPOINT ||
      path.startsWith(`${env.SWAGGER_ENDPOINT}/`)
    ) {
      return responseValue;
    }

    if (
      responseValue &&
      typeof responseValue === 'object' &&
      'success' in responseValue &&
      'status' in responseValue
    ) {
      return responseValue;
    }

    return apiResponse({
      status: typeof set.status === 'number' ? set.status : 200,
      success: true,
      data: responseValue,
    });
  })
  .onAfterResponse(({ request, path, set, requestStartedAt }) => {
    if (
      path === env.SWAGGER_ENDPOINT ||
      path.startsWith(`${env.SWAGGER_ENDPOINT}/`)
    ) {
      return;
    }

    const status = typeof set.status === 'number' ? set.status : 200;
    // Errors are already logged in onError
    if (status >= 400) return;

    logRequest({
      method: request.method,
      path,
      status,
      ms: Math.round(
        performance.now() - (requestStartedAt ?? performance.now()),
      ),
    });
  })
  .use(mealsRoutes);

try {
  await connectRedis();
} catch (err) {
  logger.error({ err }, 'redis connect failed — continuing without cache');
}

const appServer = app.listen({
  port: env.PORT,
  hostname: '0.0.0.0',
});

logger.info(
  {
    host: appServer.server?.hostname,
    port: appServer.server?.port,
  },
  'Sunrin Today API started',
);

export type App = typeof app;
