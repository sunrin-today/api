import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateCreateDto, DateDto } from './dto/meal.dto';
import { MealRepository } from './repository/meal.repository';

@Injectable()
export class MealsService {
  constructor(
    private readonly mealRepository: MealRepository,
    private readonly configService: ConfigService,
  ) {}

  async getMeals() {
    return await this.mealRepository.getMeals();
  }

  async getMealById(id: number) {
    return await this.mealRepository.getMealById(id);
  }

  async getMealByDate(date: string): Promise<DateDto> {
    const dateObject = new Date(date);

    if (isNaN(dateObject.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Please use YYYY-MM-DD',
      );
    }

    const meals = await this.mealRepository.getMealsByDate(dateObject);

    return meals;
  }

  async createMeal(data: DateCreateDto, key: string): Promise<boolean> {
    const secretKey = this.configService.get('KEY');

    if (key !== secretKey) {
      throw new UnauthorizedException('Invalid secret key');
    }

    return await this.mealRepository.createMeal(data);
  }

  async updateMeal(data: DateCreateDto, key: string): Promise<boolean> {
    const secretKey = this.configService.get('KEY');

    if (key !== secretKey) {
      throw new UnauthorizedException('Invalid secret key');
    }

    return await this.mealRepository.updateMeal(data);
  }
}
