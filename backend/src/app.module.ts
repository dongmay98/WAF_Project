import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WafLogsModule } from './waf-logs/waf-logs.module';
import { AuditIngestModule } from './audit-ingest/audit-ingest.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://admin:password@mongo:27017/waf-dashboard?authSource=admin'
    ),
    // Core feature modules first
    WafLogsModule,
    AuditIngestModule,
    
    // Other modules
    AuthModule,
    TenantModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
