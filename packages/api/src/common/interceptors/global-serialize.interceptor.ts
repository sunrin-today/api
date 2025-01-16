import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class GlobalSerializeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const returnType = Reflect.getMetadata('design:returntype', handler);

    console.log('Handler:', handler);
    console.log('Return Type:', returnType);

    if (returnType?.name === 'Promise') {
      const type = Reflect.getMetadata('design:paramtypes', returnType)[0];
      console.log('Promise Generic Type:', type);

      if (Array.isArray(type)) {
        console.log('Array Element Type:', type[0]);
      }
    }

    // 현재 설정된 모든 메타데이터 키 확인
    const metadataKeys = Reflect.getMetadataKeys(handler);
    console.log('All Metadata Keys:', metadataKeys);

    // 함수 선언 문자열도 확인
    console.log('Handler toString:', handler.toString());

    return next.handle();
  }
}
