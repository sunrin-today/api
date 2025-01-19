import { ApiProperty } from '@nestjs/swagger';
import { Date as DateModel, Meal } from '@sunrintoday/api-database/client';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { format } from 'date-fns';

export class MealDto implements Meal {
  @ApiProperty({
    description: 'Meal ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Meal name',
    example: '백미밥',
  })
  @Expose()
  meal: string;

  @ApiProperty({
    description: 'Allergy code',
    example: '1.2.5.6',
    nullable: true,
  })
  @Expose()
  code: string | null;

  @Exclude()
  dateId: number;
}

export class DateDto implements DateModel {
  @ApiProperty({
    description: 'Date of meals',
    example: '2024-06-05',
  })
  @Transform(({ value }) => format(value, 'yyyy-MM-dd'))
  @Expose()
  date: Date;

  @ApiProperty({
    description: 'List of meals for the date',
    type: [MealDto],
  })
  @Type(() => MealDto)
  @Expose()
  meals: MealDto[];

  @ApiProperty({
    description: 'Meal existence',
    example: true,
  })
  @Expose()
  existence: boolean;

  @ApiProperty({
    description: 'Rest day',
    example: false,
  })
  @Expose()
  rest: boolean;
}

export class MealCreateDto {
  @ApiProperty({
    description: 'Meal name',
    example: '백미밥',
  })
  @IsString()
  @IsNotEmpty()
  meal: string;

  @ApiProperty({
    description: 'Allergy code',
    example: '1.2.5.6',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  code: string | null;
}

export class DateCreateDto {
  @ApiProperty({
    description: 'Date of meals',
    example: '2025-03-02',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: 'List of meals for the date',
    type: [MealCreateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealCreateDto)
  meals: MealCreateDto[];

  @ApiProperty({
    description: 'Meal existence',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  existence: boolean;

  @ApiProperty({
    description: 'Rest day',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  rest: boolean;
}
