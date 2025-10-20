import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditIngestService } from './audit-ingest.service';
import { TenantResolverService } from './tenant-resolver.service';
import { WafLog, WafLogSchema } from '../schemas/waf-log.schema';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WafLog.name, schema: WafLogSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  providers: [AuditIngestService, TenantResolverService],
  exports: [AuditIngestService, TenantResolverService],
})
export class AuditIngestModule {}


