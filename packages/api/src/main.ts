import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = new Logger('bootstrap');

  const isProduction = configService.get('NODE_ENV') === 'production';

  const config = new DocumentBuilder().setTitle('선린투데이 API').build();

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const swaggerEndpoint = configService.get('SWAGGER_ENDPOINT');
  SwaggerModule.setup(swaggerEndpoint, app, documentFactory);

  await app.listen(
    isProduction ? Number(configService.get('PORT') || 3000) : 8000,
    '0.0.0.0',
  );

  logger.log(`Server running on ${await app.getUrl()}`);
}
bootstrap();
