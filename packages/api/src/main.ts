import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CustomSerializerInterceptor } from './common/interceptors/custom-serializer.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = new Logger('bootstrap');

  const isProduction = configService.get('NODE_ENV') === 'production';

  const config = new DocumentBuilder()
    .setTitle('선린투데이 API')
    .setDescription('선린인터넷고등학교 급식 서비스 API')
    .setVersion('0.0.1')
    .setContact(
      'Jeewon Kwon',
      'https://github.com/jwkwon0817',
      'jeewon.kwon.0817@gmail.com',
    )
    .addServer('http://localhost:8000', 'Local Development')
    .addServer('https://api.sunrin.kr', 'Production')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  app.useGlobalFilters(new GlobalExceptionFilter());
  // app.useGlobalInterceptors(new PrismaSerializerInterceptor());
  // app.useGlobalInterceptors(
  //   new ClassSerializerInterceptor(app.get(Reflector), {
  //     excludeExtraneousValues: true,
  //     exposeUnsetFields: false,
  //   }),
  // );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(
    new CustomSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const theme = new SwaggerTheme();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const swaggerEndpoint = configService.get('SWAGGER_ENDPOINT');
  SwaggerModule.setup(swaggerEndpoint, app, documentFactory, {
    customSiteTitle: '선린투데이 API',
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
  });

  await app.listen(
    isProduction ? Number(configService.get('PORT') || 3000) : 8000,
    '0.0.0.0',
  );

  logger.log(`Server running on ${await app.getUrl()}`);
}
bootstrap();
