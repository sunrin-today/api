import { Elysia, t } from 'elysia';
import { env } from '../../env';
import { AppError } from '../../errors';
import { mealCreateBodySchema } from './schema';
import * as mealsService from './service';

function requireKey(key?: string | null) {
  if (!key || key !== env.KEY) {
    throw new AppError(401, 'Invalid secret key');
  }
}

export const mealsRoutes = new Elysia({ prefix: '/meal' })
  .get(
    '/',
    async ({ query }) => mealsService.getMealByDate(query.date),
    {
      query: t.Object({
        date: t.String(),
      }),
      detail: {
        summary: 'Get meal by date',
        tags: ['meal'],
      },
    },
  )
  .get('/today', () => mealsService.getMealForToday(), {
    detail: {
      summary: 'Get meal for today',
      tags: ['meal'],
    },
  })
  .get('/tomorrow', () => mealsService.getMealForTomorrow(), {
    detail: {
      summary: 'Get meal for tomorrow',
      tags: ['meal'],
    },
  })
  .get('/yesterday', () => mealsService.getMealForYesterday(), {
    detail: {
      summary: 'Get meal for yesterday',
      tags: ['meal'],
    },
  })
  .get('/week', () => mealsService.getMealsForWeek(), {
    detail: {
      summary: 'Get meal for the week',
      tags: ['meal'],
    },
  })
  .get('/month', () => mealsService.getMealsForMonth(), {
    detail: {
      summary: 'Get meal for the month',
      tags: ['meal'],
    },
  })
  .get(
    '/period',
    async ({ query }) =>
      mealsService.getMealsForPeriod(query.date_from, query.date_to),
    {
      query: t.Object({
        date_from: t.String(),
        date_to: t.String(),
      }),
      detail: {
        summary: 'Get meals for a specific period',
        tags: ['meal'],
      },
    },
  )
  .get(
    '/limit',
    async ({ query }) =>
      mealsService.getMealsWithLimit(query.date_from, query.limit),
    {
      query: t.Object({
        date_from: t.String(),
        limit: t.Number({ minimum: 1 }),
      }),
      detail: {
        summary: 'Get limited number of meals from start date',
        tags: ['meal'],
      },
    },
  )
  .get('/rest', () => mealsService.getCurrentMonthRestDays(), {
    detail: {
      summary: 'Get rest days for current month',
      tags: ['meal'],
    },
  })
  .get('/rest/next', () => mealsService.getNextMonthRestDays(), {
    detail: {
      summary: 'Get rest days for next month',
      tags: ['meal'],
    },
  })
  .get('/rest/previous', () => mealsService.getPreviousMonthRestDays(), {
    detail: {
      summary: 'Get rest days for previous month',
      tags: ['meal'],
    },
  })
  .post(
    '/',
    async ({ body, request, set }) => {
      requireKey(request.headers.get('key'));
      set.status = 201;
      return mealsService.createMeal(body);
    },
    {
      body: mealCreateBodySchema,
      detail: {
        summary: 'Create meal',
        tags: ['meal'],
      },
    },
  )
  .put(
    '/',
    async ({ body, request }) => {
      requireKey(request.headers.get('key'));
      return mealsService.updateMeal(body);
    },
    {
      body: mealCreateBodySchema,
      detail: {
        summary: 'Update meal',
        tags: ['meal'],
      },
    },
  )
  .delete(
    '/',
    async ({ query, request }) => {
      requireKey(request.headers.get('key'));
      return mealsService.deleteMeal(query.date);
    },
    {
      query: t.Object({
        date: t.String(),
      }),
      detail: {
        summary: 'Delete meal',
        tags: ['meal'],
      },
    },
  );
