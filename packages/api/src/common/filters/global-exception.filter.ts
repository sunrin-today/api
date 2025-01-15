import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { APIResponseDto } from '../dto/response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly configService = new ConfigService();

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Internal Server Error';

    const apiResponse = new APIResponseDto();
    apiResponse.status = status;
    apiResponse.message = message;

    response.status(status).send(apiResponse);

    this.logger.error(exception);

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    if (!isProduction) {
      console.error(exception);
    }
  }
}
