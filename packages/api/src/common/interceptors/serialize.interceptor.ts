import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function Serialize(dto: any) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}
  intercept(
    context: ExecutionContext,
    handler: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // request Handler가 클라이언트의 요청을 처리하기 전에 실행할 코드를 작성한다
    console.log('Im running before the handler');

    // response가 전송되기 전에 실행할 코드를 작성한다.
    return handler.handle().pipe(
      // data는 response data가 들어온다.
      map((data: any) => {
        return plainToInstance(this.dto, data, {
          // 불필요한 값 (response로 내보내지 않을 값)을 제거하는 excludeExtraneousValues
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
