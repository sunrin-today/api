import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APIResponseDto } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) => {
        const apiResponse = new APIResponseDto();

        apiResponse.status = response.statusCode || HttpStatus.OK;
        apiResponse.data = data;

        response.status(HttpStatus.OK).send(apiResponse);
      }),
    );
  }
}
