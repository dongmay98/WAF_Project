import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WafLogsController } from './waf-logs.controller';
import { WafLogsService } from './waf-logs.service';
import { WafLog, WafLogSchema } from '../schemas/waf-log.schema';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { RealDataService } from './real-data.service';
import { TrafficGeneratorService } from './traffic-generator.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WafLog.name, schema: WafLogSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [WafLogsController],
  providers: [WafLogsService, RealDataService, TrafficGeneratorService],
  exports: [WafLogsService],
})
export class WafLogsModule {}

