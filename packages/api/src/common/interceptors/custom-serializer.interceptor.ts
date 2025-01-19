import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { Observable, map } from 'rxjs';

export const ReturnType = (returnType: any) =>
  SetMetadata('returnType', returnType);

@Injectable()
export class CustomSerializerInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const returnType = this.reflector.get('returnType', handler);

    console.log('Handler:', handler.name); // 핸들러 이름
    console.log('ReturnType:', returnType); // 리턴 타입
    console.log(
      'Has returnType metadata:',
      this.reflector.get('returnType', handler) !== undefined,
    );

    return next.handle().pipe(
      map((data) => {
        if (!returnType) {
          return data;
        }

        const transformed = plainToInstance(returnType, data, {
          excludeExtraneousValues: true,
          exposeUnsetFields: false,
        });
        return transformed;
      }),
    );
  }
}
