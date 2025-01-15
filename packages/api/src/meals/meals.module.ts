import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { MealsService } from './meals.service';
import { MealRepository } from './repository/meal.repository';

@Module({
  imports: [],
  controllers: [],
  providers: [MealRepository, MealsService, PrismaService],
  exports: [MealRepository, MealsService],
})
export class MealsModule {}
