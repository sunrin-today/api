import { format } from 'date-fns';
import { prisma } from '../../db';
import { AppError } from '../../errors';
import type { MealCreateBody } from './schema';

type DateWithMeals = {
  date: Date;
  existence: boolean;
  rest: boolean;
  meals: Array<{
    id: number;
    meal: string;
    code: string | null;
  }>;
};

export function serializeDateMeal(entry: DateWithMeals) {
  return {
    date: format(entry.date, 'yyyy-MM-dd'),
    existence: entry.existence,
    rest: entry.rest,
    meals: entry.meals.map(({ meal, code }) => ({ meal, code })),
  };
}

export async function getMealsByDate(date: Date) {
  const foundDate = await prisma.date.findUnique({
    where: { date },
    include: { meals: true },
  });

  const formattedDate = format(date, 'yyyy-MM-dd');

  if (!foundDate) {
    throw new AppError(404, `No meals found for the date ${formattedDate}`);
  }

  return serializeDateMeal(foundDate);
}

export async function getMealsForWeek() {
  const now = new Date();
  const currentDay = now.getDay();

  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const weekMeals = await prisma.date.findMany({
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

  return weekMeals.map(serializeDateMeal);
}

export async function getMealsForMonth() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthMeals = await prisma.date.findMany({
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

  return monthMeals.map(serializeDateMeal);
}

export async function getMealsForPeriod(dateFrom: Date, dateTo: Date) {
  const periodMeals = await prisma.date.findMany({
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

  return periodMeals.map(serializeDateMeal);
}

export async function getMealsWithLimit(dateFrom: Date, limit: number) {
  const meals = await prisma.date.findMany({
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

  return meals.map(serializeDateMeal);
}

export async function getRestDaysForMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const restDays = await prisma.date.findMany({
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

  return restDays.map(serializeDateMeal);
}

export async function createMeal(data: MealCreateBody) {
  const date = new Date(data.date);

  return await prisma.$transaction(
    async (tx) => {
      const foundDate = await tx.date.findUnique({
        where: { date },
      });

      if (foundDate) {
        throw new AppError(400, 'Meal already exists for the date');
      }

      const created = await tx.date.create({
        select: { id: true },
        data: {
          date,
          existence: data.existence,
          rest: data.rest,
        },
      });

      await tx.meal.createMany({
        data: data.meals.map((meal: MealCreateBody['meals'][number]) => ({
          meal: meal.meal,
          code: meal.code,
          dateId: created.id,
        })),
      });

      return true;
    },
    {
      maxWait: 5000,
      timeout: 10000,
    },
  );
}

export async function updateMeal(data: MealCreateBody) {
  const date = new Date(data.date);

  return await prisma.$transaction(
    async (tx) => {
      const foundDate = await tx.date.findUnique({
        where: { date },
      });

      if (!foundDate) {
        throw new AppError(400, 'No meal found for the date');
      }

      await tx.date.update({
        where: { id: foundDate.id },
        data: {
          existence: data.existence,
          rest: data.rest,
        },
      });

      await tx.meal.deleteMany({
        where: {
          dateId: foundDate.id,
        },
      });

      await tx.meal.createMany({
        data: data.meals.map((meal: MealCreateBody['meals'][number]) => ({
          meal: meal.meal,
          code: meal.code,
          dateId: foundDate.id,
        })),
      });

      return true;
    },
    {
      maxWait: 5000,
      timeout: 10000,
    },
  );
}

export async function deleteMeal(date: string) {
  const dateObject = new Date(date);

  if (Number.isNaN(dateObject.getTime())) {
    throw new AppError(400, 'Invalid date format. Please use YYYY-MM-DD');
  }

  return await prisma.$transaction(
    async (tx) => {
      const foundDate = await tx.date.findUnique({
        where: {
          date: dateObject,
        },
      });

      if (!foundDate) {
        throw new AppError(400, 'No meal found for the date');
      }

      await tx.meal.deleteMany({
        where: {
          dateId: foundDate.id,
        },
      });

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
