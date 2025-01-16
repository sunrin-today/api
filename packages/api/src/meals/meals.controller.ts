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
