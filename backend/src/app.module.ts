import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WafLogsModule } from './waf-logs/waf-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27018/waf-dashboard?authSource=admin'
    ),
    WafLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
