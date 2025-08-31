import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditIngestService } from './audit-ingest.service';
import { WafLog, WafLogSchema } from '../schemas/waf-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WafLog.name, schema: WafLogSchema }]),
  ],
  providers: [AuditIngestService],
})
export class AuditIngestModule {}


