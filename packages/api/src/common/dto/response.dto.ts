import { HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, ApiResponse } from '@nestjs/swagger';

@ApiExtraModels()
@ApiResponse({
  status: 200,
  description: 'API 응답의 기본 형식',
})
export class APIResponseDto {
  @ApiProperty({
    description: 'HTTP 상태 코드',
    example: HttpStatus.OK,
    enum: HttpStatus,
    default: HttpStatus.OK,
  })
  public status: HttpStatus = HttpStatus.OK;

  @ApiProperty({
    description: '응답 메시지',
    example: 'OK',
    default: 'OK',
  })
  public message: string = 'OK';

  @ApiProperty({
    description: '응답 데이터',
    example: null,
    default: null,
    nullable: true,
  })
  public data: any = null;

  @ApiProperty({
    description: '응답 시간',
    example: new Date().toISOString(),
    type: Date,
  })
  public responseAt: Date = new Date();
}
