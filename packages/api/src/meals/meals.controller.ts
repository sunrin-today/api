import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { format } from 'date-fns';
import { Serialize } from '~/common/interceptors/serialize.interceptor';
import { DateCreateDto, DateDto } from './dto/meal.dto';
import { MealsService } from './meals.service';

@Controller('meal')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Get('/list')
  @ApiOperation({ summary: 'Get all meals' })
  @ApiResponse({
    status: 200,
    description: 'Returns meal for the specified date',
  })
  @Serialize(DateDto)
  async getMeals(): Promise<DateDto[]> {
    return await this.mealsService.getMeals();
  }

  @Get('/')
  @ApiOperation({ summary: 'Get meal by date' })
  @ApiQuery({
    name: 'date',
    type: String,
    required: true,
    description: 'Date of the meal',
    example: '2024-06-05',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns meal for the specified date',
    type: DateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date format',
  })
  @ApiResponse({
    status: 404,
    description: 'No meals found for the date',
  })
  @Serialize(DateDto)
  async getMealByDate(@Query('date') date: string): Promise<DateDto> {
    return await this.mealsService.getMealByDate(date);
  }

  @Get('/today')
  @ApiOperation({ summary: 'Get meal for today' })
  @ApiResponse({
    status: 200,
    description: 'Returns meal for today',
    type: DateDto,
  })
  @Serialize(DateDto)
  async getMealForToday(): Promise<DateDto> {
    const today = new Date();
    return await this.mealsService.getMealByDate(format(today, 'yyyy-MM-dd'));
  }

  @Get('/tomorrow')
  @ApiOperation({ summary: 'Get meal for tomorrow' })
  @ApiResponse({
    status: 200,
    description: 'Returns meal for tomorrow',
    type: DateDto,
  })
  @Serialize(DateDto)
  async getMealForTomorrow(): Promise<DateDto> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return await this.mealsService.getMealByDate(
      format(tomorrow, 'yyyy-MM-dd'),
    );
  }

  @Get('/yesterday')
  @ApiOperation({ summary: 'Get meal for yesterday' })
  @ApiResponse({
    status: 200,
    description: 'Returns meal for yesterday',
    type: DateDto,
  })
  @Serialize(DateDto)
  async getMealForYesterday(): Promise<DateDto> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return await this.mealsService.getMealByDate(
      format(yesterday, 'yyyy-MM-dd'),
    );
  }

  @Get('/week')
  @ApiOperation({ summary: 'Get meal for the week' })
  @ApiResponse({
    status: 200,
    description: 'Returns meal for the week (Monday to Friday)',
    type: [DateDto],
  })
  @Serialize(DateDto)
  async getMealForWeek(): Promise<DateDto[]> {
    return await this.mealsService.getMealsForWeek();
  }

  @Get('/month')
  @ApiOperation({ summary: 'Get meal for the month' })
  @ApiResponse({
    status: 200,
    description: 'Returns meal for the month',
    type: [DateDto],
  })
  @Serialize(DateDto)
  async getMealForMonth(): Promise<DateDto[]> {
    return await this.mealsService.getMealsForMonth();
  }

  @Get('/period')
  @ApiOperation({ summary: 'Get meals for a specific period' })
  @ApiResponse({
    status: 200,
    description: 'Returns meals for the specified period',
    type: [DateDto],
  })
  @ApiQuery({
    name: 'dateFrom',
    required: true,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: true,
    type: String,
    description: 'End date (YYYY-MM-DD)',
  })
  @Serialize(DateDto)
  async getMealForPeriod(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<DateDto[]> {
    return await this.mealsService.getMealsForPeriod(dateFrom, dateTo);
  }

  @Get('/limit')
  @ApiOperation({ summary: 'Get limited number of meals from start date' })
  @ApiResponse({
    status: 200,
    description: 'Returns limited number of meals',
    type: [DateDto],
  })
  @ApiQuery({
    name: 'dateFrom',
    required: true,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'limit',
    required: true,
    type: Number,
    description: 'Number of meals to return',
  })
  @Serialize(DateDto)
  async getMealsWithLimit(
    @Query('dateFrom') dateFrom: string,
    @Query('limit') limit: number,
  ): Promise<DateDto[]> {
    return await this.mealsService.getMealsWithLimit(dateFrom, limit);
  }

  @Get('/rest')
  @ApiOperation({ summary: 'Get rest days for current month' })
  @ApiResponse({
    status: 200,
    description: 'Returns rest days for current month',
    type: [DateDto],
  })
  @Serialize(DateDto)
  async getCurrentMonthRestDays(): Promise<DateDto[]> {
    return await this.mealsService.getCurrentMonthRestDays();
  }

  @Get('/rest/next')
  @ApiOperation({ summary: 'Get rest days for next month' })
  @ApiResponse({
    status: 200,
    description: 'Returns rest days for next month',
    type: [DateDto],
  })
  @Serialize(DateDto)
  async getNextMonthRestDays(): Promise<DateDto[]> {
    return await this.mealsService.getNextMonthRestDays();
  }

  @Get('/rest/previous')
  @ApiOperation({ summary: 'Get rest days for previous month' })
  @ApiResponse({
    status: 200,
    description: 'Returns rest days for previous month',
    type: [DateDto],
  })
  @Serialize(DateDto)
  async getPreviousMonthRestDays(): Promise<DateDto[]> {
    return await this.mealsService.getPreviousMonthRestDays();
  }

  @Post('/')
  @ApiOperation({ summary: 'Create meal' })
  @ApiResponse({
    status: 201,
    description: 'Meal created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid secret key',
  })
  @ApiHeader({
    name: 'KEY',
    required: true,
    description: 'Secret key for the API',
  })
  async createMeal(
    @Body() data: DateCreateDto,
    @Headers('KEY') key: string,
  ): Promise<boolean> {
    return await this.mealsService.createMeal(data, key);
  }

  @Put('/')
  @ApiOperation({ summary: 'Update meal' })
  @ApiResponse({
    status: 200,
    description: 'Meal updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid secret key',
  })
  @ApiHeader({
    name: 'KEY',
    required: true,
    description: 'Secret key for the API',
  })
  async updateMeal(@Body() data: DateCreateDto, @Headers('KEY') key: string) {
    return await this.mealsService.updateMeal(data, key);
  }

  @Delete('/')
  @ApiOperation({ summary: 'Delete meal' })
  @ApiResponse({
    status: 200,
    description: 'Meal deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid secret key',
  })
  @ApiHeader({
    name: 'KEY',
    required: true,
    description: 'Secret key for the API',
  })
  async deleteMeal(@Query('date') date: string, @Headers('KEY') key) {
    return await this.mealsService.deleteMeal(date, key);
  }
}
