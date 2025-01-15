import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/common/prisma/prisma.service';

@Injectable()
export class MealRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getMeals() {
    return this.prismaService.meal.findMany();
  }
}
