import { t } from 'elysia';

export const mealItemSchema = t.Object({
  id: t.Number(),
  meal: t.String(),
  code: t.Nullable(t.String()),
});

export const dateMealSchema = t.Object({
  date: t.String(),
  meals: t.Array(mealItemSchema),
  existence: t.Boolean(),
  rest: t.Boolean(),
});

export const mealCreateBodySchema = t.Object({
  date: t.String(),
  meals: t.Array(
    t.Object({
      meal: t.String(),
      code: t.Nullable(t.String()),
    }),
  ),
  existence: t.Boolean(),
  rest: t.Boolean(),
});

export type MealCreateBody = {
  date: string;
  meals: Array<{
    meal: string;
    code: string | null;
  }>;
  existence: boolean;
  rest: boolean;
};
