import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MealsModule } from './meals/meals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MealsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
