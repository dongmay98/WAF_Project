import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from './tenant.controller';
import { TenantConfigController } from './tenant-config.controller';
import { TenantService } from './tenant.service';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TenantController, TenantConfigController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
