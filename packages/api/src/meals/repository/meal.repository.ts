import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { PrismaService } from '~/common/prisma/prisma.service';
import { DateCreateDto, DateDto } from '../dto/meal.dto';

@Injectable()
export class MealRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getMeals(): Promise<DateDto[]> {
    const dates = await this.prismaService.date.findMany({
      include: {
        meals: true,
      },
    });

    return dates.map((date) => ({
      date: date.date,
      meals: date.meals,
      existence: date.existence,
      rest: date.rest,
    }));
  }

  async getMealById(id: number) {
    return await this.prismaService.meal.findUnique({ where: { id } });
  }

  async getMealsByDate(date: Date): Promise<DateDto> {
    const foundDate = await this.prismaService.date.findUnique({
      where: { date },
      include: { meals: true },
    });

    const formattedDate = format(date, 'yyyy-MM-dd');

    if (!foundDate) {
      throw new NotFoundException(
        `No meals found for the date ${formattedDate}`,
      );
    }

    const { date: dateString, ...rest } = foundDate;

    return {
      date: dateString,
      meals: foundDate.meals,
      existence: rest.existence,
      rest: rest.rest,
    };
  }

  async createMeal(data: DateCreateDto): Promise<boolean> {
    return await this.prismaService.$transaction(
      async (tx) => {
        const foundDate = await tx.date.findUnique({
          where: { date: data.date },
        });

        if (foundDate) {
          throw new BadRequestException('Meal already exists for the date');
        }

        const date = await tx.date.create({
          select: { id: true },
          data: {
            date: data.date,
            existence: data.existence,
            rest: data.rest,
          },
        });

        // Meal들을 한번에 생성
        await tx.meal.createMany({
          data: data.meals.map((meal) => ({
            meal: meal.meal,
            code: meal.code,
            dateId: date.id,
          })),
        });

        return true;
      },
      {
        maxWait: 5000, // 5초
        timeout: 10000, // 10초
      },
    );
  }

  async updateMeal(data: DateCreateDto): Promise<boolean> {
    return await this.prismaService.$transaction(
      async (tx) => {
        const foundDate = await tx.date.findUnique({
          where: { date: data.date },
        });

        if (!foundDate) {
          throw new BadRequestException('No meal found for the date');
        }

        // date 테이블의 existence와 rest 업데이트
        await tx.date.update({
          where: { id: foundDate.id },
          data: {
            existence: data.existence,
            rest: data.rest,
          },
        });

        // 기존 meals 삭제
        await tx.meal.deleteMany({
          where: {
            dateId: foundDate.id,
          },
        });

        // 새로운 meals 생성
        await tx.meal.createMany({
          data: data.meals.map((meal) => ({
            meal: meal.meal,
            code: meal.code,
            dateId: foundDate.id,
          })),
        });

        return true;
      },
      {
        maxWait: 5000, // 5초
        timeout: 10000, // 10초
      },
    );
  }
}
