import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WafLogsController } from './waf-logs.controller';
import { WafLogsService } from './waf-logs.service';
import { WafLog, WafLogSchema } from '../schemas/waf-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WafLog.name, schema: WafLogSchema }]),
  ],
  controllers: [WafLogsController],
  providers: [WafLogsService],
  exports: [WafLogsService],
})
export class WafLogsModule {}

