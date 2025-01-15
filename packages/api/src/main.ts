import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);
  const logger = new Logger('bootstrap');

  const isProduction = configService.get('NODE_ENV') === 'production';

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(
    isProduction ? Number(configService.get('PORT') || 3000) : 8000,
    '0.0.0.0',
  );

  logger.log(`Server running on ${await app.getUrl()}`);
}
bootstrap();
