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

  async getMealsForWeek(): Promise<DateDto[]> {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = 일요일, 1 = 월요일, ..., 6 = 토요일

    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const weekMeals = await this.prismaService.date.findMany({
      where: {
        date: {
          gte: monday,
          lte: friday,
        },
      },
      include: {
        meals: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return weekMeals.map((date) => ({
      date: date.date,
      meals: date.meals,
      existence: date.existence,
      rest: date.rest,
    }));
  }

  async getMealsForMonth(): Promise<DateDto[]> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthMeals = await this.prismaService.date.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      include: {
        meals: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return monthMeals.map((date) => ({
      date: date.date,
      meals: date.meals,
      existence: date.existence,
      rest: date.rest,
    }));
  }

  async getMealsForPeriod(dateFrom: Date, dateTo: Date): Promise<DateDto[]> {
    const periodMeals = await this.prismaService.date.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        meals: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return periodMeals.map((date) => ({
      date: date.date,
      meals: date.meals,
      existence: date.existence,
      rest: date.rest,
    }));
  }

  async getMealsWithLimit(dateFrom: Date, limit: number): Promise<DateDto[]> {
    const meals = await this.prismaService.date.findMany({
      where: {
        date: {
          gte: dateFrom,
        },
      },
      include: {
        meals: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: limit,
    });

    return meals.map((date) => ({
      date: date.date,
      meals: date.meals,
      existence: date.existence,
      rest: date.rest,
    }));
  }

  async getRestDaysForMonth(year: number, month: number): Promise<DateDto[]> {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const restDays = await this.prismaService.date.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
        rest: true,
      },
      include: {
        meals: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return restDays.map((date) => ({
      date: date.date,
      meals: date.meals,
      existence: date.existence,
      rest: date.rest,
    }));
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

  async deleteMeal(date: string): Promise<boolean> {
    return await this.prismaService.$transaction(
      async (tx) => {
        const dateObject = new Date(date);

        if (isNaN(dateObject.getTime())) {
          throw new BadRequestException(
            'Invalid date format. Please use YYYY-MM-DD',
          );
        }

        const foundDate = await tx.date.findUnique({
          where: {
            date: dateObject,
          },
        });

        if (!foundDate) {
          throw new BadRequestException('No meal found for the date');
        }

        // 먼저 연관된 모든 Meal 레코드를 삭제
        await tx.meal.deleteMany({
          where: {
            dateId: foundDate.id,
          },
        });

        // 그 다음 Date 레코드 삭제
        await tx.date.delete({
          where: { id: foundDate.id },
        });

        return true;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    );
  }
}
