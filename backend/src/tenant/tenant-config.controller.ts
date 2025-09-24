import { Controller, Get, Put, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Tenant Configuration')
@Controller('api/tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantConfigController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('config')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: 'WAF 설정 조회' })
  @ApiResponse({ status: 200, description: 'WAF 설정이 성공적으로 조회되었습니다.' })
  async getWafConfig(@Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    
    if (!tenantId) {
      throw new ForbiddenException('테넌트 정보가 없습니다.');
    }
    
    return this.tenantService.getWafConfig(tenantId);
  }

  @Put('config')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: 'WAF 설정 업데이트' })
  @ApiResponse({ status: 200, description: 'WAF 설정이 성공적으로 업데이트되었습니다.' })
  async updateWafConfig(
    @Req() req: Request,
    @Body() configData: {
      paranoia_level?: number;
      blocking_mode?: boolean;
      custom_rules?: string[];
    }
  ) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    
    if (!tenantId) {
      throw new ForbiddenException('테넌트 정보가 없습니다.');
    }
    
    return this.tenantService.updateWafConfig(tenantId, configData);
  }

  @Get('subscription')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '구독 정보 조회' })
  @ApiResponse({ status: 200, description: '구독 정보가 성공적으로 조회되었습니다.' })
  async getSubscription(@Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    
    if (!tenantId) {
      throw new ForbiddenException('테넌트 정보가 없습니다.');
    }
    
    return this.tenantService.getSubscriptionInfo(tenantId);
  }

  @Get('usage')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '사용량 정보 조회' })
  @ApiResponse({ status: 200, description: '사용량 정보가 성공적으로 조회되었습니다.' })
  async getUsage(@Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    
    if (!tenantId) {
      throw new ForbiddenException('테넌트 정보가 없습니다.');
    }
    
    return this.tenantService.getUsageInfo(tenantId);
  }
}
