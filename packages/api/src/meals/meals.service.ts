import { Injectable } from '@nestjs/common';
import { MealRepository } from './repository/meal.repository';

@Injectable()
export class MealsService {
  constructor(private readonly mealRepository: MealRepository) {}
}
