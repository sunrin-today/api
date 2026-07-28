import { format } from 'date-fns';
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
  cacheSetMiss,
  invalidateMealCache,
  ttlForDateKey,
  ttlForDateMiss,
} from '../../cache';
import { AppError } from '../../errors';
import * as mealRepository from './repository';
import type { MealBulkCreateBody, MealCreateBody } from './schema';

export function parseDateOrThrow(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AppError(400, 'Invalid date format. Please use YYYY-MM-DD');
  }

  const [year, month, day] = date.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const dateObject = new Date(Date.UTC(year, month - 1, day));

  // Reject overflow dates like 2026-02-29 (not a leap year → JS becomes 2026-03-01)
  if (
    Number.isNaN(dateObject.getTime()) ||
    dateObject.getUTCFullYear() !== year ||
    dateObject.getUTCMonth() !== month - 1 ||
    dateObject.getUTCDate() !== day
  ) {
    throw new AppError(400, 'Invalid date format. Please use YYYY-MM-DD');
  }

  return dateObject;
}

function daySpanInclusive(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

export async function getMealByDate(date: string) {
  const cacheKey = ['date', date];
  const cached = await cacheGet<
    ReturnType<typeof mealRepository.serializeDateMeal>
  >(cacheKey);

  if (cached.status === 'hit') {
    return cached.value;
  }
  if (cached.status === 'miss') {
    throw new AppError(404, `No meals found for the date ${date}`);
  }

  try {
    const data = await mealRepository.getMealsByDate(parseDateOrThrow(date));
    // Fire-and-forget set so response isn't blocked on a second Upstash RTT
    void cacheSet(cacheKey, data, ttlForDateKey(date));
    return data;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      void cacheSetMiss(cacheKey, ttlForDateMiss(date));
    }
    throw error;
  }
}

export async function getMealForToday() {
  return getMealByDate(format(new Date(), 'yyyy-MM-dd'));
}

export async function getMealForTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getMealByDate(format(tomorrow, 'yyyy-MM-dd'));
}

export async function getMealForYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getMealByDate(format(yesterday, 'yyyy-MM-dd'));
}

export async function getMealsForWeek() {
  const cacheKey = ['week', format(new Date(), 'yyyy-MM-dd')];
  const cached = await cacheGet<Awaited<ReturnType<typeof mealRepository.getMealsForWeek>>>(
    cacheKey,
  );
  if (cached.status === 'hit') return cached.value;

  try {
    const data = await mealRepository.getMealsForWeek();
    void cacheSet(cacheKey, data, CACHE_TTL.aggregate);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch week meals');
  }
}

export async function getMealsForMonth() {
  const now = new Date();
  const cacheKey = ['month', `${now.getFullYear()}-${now.getMonth() + 1}`];
  const cached = await cacheGet<Awaited<ReturnType<typeof mealRepository.getMealsForMonth>>>(
    cacheKey,
  );
  if (cached.status === 'hit') return cached.value;

  try {
    const data = await mealRepository.getMealsForMonth();
    void cacheSet(cacheKey, data, CACHE_TTL.aggregate);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch month meals');
  }
}

export async function getMealsForPeriod(dateFrom: string, dateTo: string) {
  try {
    const fromDate = parseDateOrThrow(dateFrom);
    const toDate = parseDateOrThrow(dateTo);

    if (fromDate > toDate) {
      throw new AppError(400, 'Start date must be before end date');
    }

    // Avoid caching arbitrary huge ranges
    const span = daySpanInclusive(fromDate, toDate);
    if (span > 31) {
      return await mealRepository.getMealsForPeriod(fromDate, toDate);
    }

    const cacheKey = ['period', dateFrom, dateTo];
    const cached = await cacheGet<
      Awaited<ReturnType<typeof mealRepository.getMealsForPeriod>>
    >(cacheKey);
    if (cached.status === 'hit') return cached.value;

    const data = await mealRepository.getMealsForPeriod(fromDate, toDate);
    void cacheSet(cacheKey, data, CACHE_TTL.aggregate);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch period meals');
  }
}

export async function getMealsWithLimit(dateFrom: string, limit: number) {
  try {
    const fromDate = parseDateOrThrow(dateFrom);

    if (limit <= 0) {
      throw new AppError(400, 'Limit must be greater than 0');
    }

    if (limit > 31) {
      return await mealRepository.getMealsWithLimit(fromDate, limit);
    }

    const cacheKey = ['limit', dateFrom, String(limit)];
    const cached = await cacheGet<
      Awaited<ReturnType<typeof mealRepository.getMealsWithLimit>>
    >(cacheKey);
    if (cached.status === 'hit') return cached.value;

    const data = await mealRepository.getMealsWithLimit(fromDate, limit);
    void cacheSet(cacheKey, data, CACHE_TTL.aggregate);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch meals with limit');
  }
}

async function getRestDaysCached(year: number, month: number) {
  const cacheKey = ['rest', String(year), String(month)];
  const cached = await cacheGet<
    Awaited<ReturnType<typeof mealRepository.getRestDaysForMonth>>
  >(cacheKey);
  if (cached.status === 'hit') return cached.value;

  const data = await mealRepository.getRestDaysForMonth(year, month);
  void cacheSet(cacheKey, data, CACHE_TTL.rest);
  return data;
}

export async function getCurrentMonthRestDays() {
  const now = new Date();
  try {
    return await getRestDaysCached(now.getFullYear(), now.getMonth());
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch current month rest days');
  }
}

export async function getNextMonthRestDays() {
  const now = new Date();
  const nextMonth = now.getMonth() + 1;
  const year = now.getFullYear() + (nextMonth === 12 ? 1 : 0);

  try {
    return await getRestDaysCached(year, nextMonth % 12);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch next month rest days');
  }
}

export async function getPreviousMonthRestDays() {
  const now = new Date();
  const prevMonth = now.getMonth() - 1;
  const year = now.getFullYear() + (prevMonth === -1 ? -1 : 0);

  try {
    return await getRestDaysCached(year, prevMonth < 0 ? 11 : prevMonth);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch previous month rest days');
  }
}

export async function createMeal(data: MealCreateBody) {
  const dateObject = parseDateOrThrow(data.date);
  const result = await mealRepository.createMeal(data, dateObject);
  await invalidateMealCache();
  return result;
}

export async function createMealsBulk(data: MealBulkCreateBody) {
  const dates = data.items.map((item) => item.date);
  if (new Set(dates).size !== dates.length) {
    throw new AppError(400, 'Duplicate dates in bulk create request');
  }

  const items = data.items.map((item) => ({
    ...item,
    dateObject: parseDateOrThrow(item.date),
  }));

  const result = await mealRepository.createMealsBulk(items);
  await invalidateMealCache();
  return result;
}

export async function updateMeal(data: MealCreateBody) {
  const result = await mealRepository.updateMeal(data);
  await invalidateMealCache();
  return result;
}

export async function deleteMeal(date: string) {
  const result = await mealRepository.deleteMeal(date);
  await invalidateMealCache();
  return result;
}
