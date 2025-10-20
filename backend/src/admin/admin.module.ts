import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminMonitoringController } from './admin-monitoring.controller';
import { AdminService } from './admin.service';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { WafLogsModule } from '../waf-logs/waf-logs.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-key'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    WafLogsModule,
  ],
  controllers: [AdminController, AdminMonitoringController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
