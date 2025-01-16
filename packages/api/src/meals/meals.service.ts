import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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

  async getMealsForWeek(): Promise<DateDto[]> {
    try {
      return await this.mealRepository.getMealsForWeek();
    } catch {
      throw new InternalServerErrorException('Failed to fetch week meals');
    }
  }

  async getMealsForMonth(): Promise<DateDto[]> {
    try {
      return await this.mealRepository.getMealsForMonth();
    } catch {
      throw new InternalServerErrorException('Failed to fetch month meals');
    }
  }

  async getMealsForPeriod(
    dateFrom: string,
    dateTo: string,
  ): Promise<DateDto[]> {
    try {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      if (fromDate > toDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      return await this.mealRepository.getMealsForPeriod(fromDate, toDate);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch period meals');
    }
  }

  async getMealsWithLimit(dateFrom: string, limit: number): Promise<DateDto[]> {
    try {
      const fromDate = new Date(dateFrom);

      if (limit <= 0) {
        throw new BadRequestException('Limit must be greater than 0');
      }

      return await this.mealRepository.getMealsWithLimit(fromDate, limit);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch meals with limit',
      );
    }
  }

  async getCurrentMonthRestDays(): Promise<DateDto[]> {
    const now = new Date();
    try {
      return await this.mealRepository.getRestDaysForMonth(
        now.getFullYear(),
        now.getMonth(),
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch current month rest days',
      );
    }
  }

  async getNextMonthRestDays(): Promise<DateDto[]> {
    const now = new Date();
    const nextMonth = now.getMonth() + 1;
    const year = now.getFullYear() + (nextMonth === 12 ? 1 : 0);
    try {
      return await this.mealRepository.getRestDaysForMonth(
        year,
        nextMonth % 12,
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch next month rest days',
      );
    }
  }

  async getPreviousMonthRestDays(): Promise<DateDto[]> {
    const now = new Date();
    const prevMonth = now.getMonth() - 1;
    const year = now.getFullYear() + (prevMonth === -1 ? -1 : 0);
    try {
      return await this.mealRepository.getRestDaysForMonth(
        year,
        prevMonth < 0 ? 11 : prevMonth,
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch previous month rest days',
      );
    }
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

  async deleteMeal(date: string, key: string): Promise<boolean> {
    const secretKey = this.configService.get('KEY');

    if (key !== secretKey) {
      throw new UnauthorizedException('Invalid secret key');
    }

    return await this.mealRepository.deleteMeal(date);
  }
}
