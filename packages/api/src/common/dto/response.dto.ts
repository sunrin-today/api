import { HttpStatus } from '@nestjs/common';

export class APIResponseDto {
  public status: HttpStatus = HttpStatus.OK;

  public message: string = 'OK';

  public data: any = null;

  public responseAt: Date = new Date();
}
