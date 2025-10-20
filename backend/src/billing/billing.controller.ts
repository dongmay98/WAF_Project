import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface ChargeDto {
  amount: number;
  method?: string;
}

@ApiTags('Billing')
@Controller('api/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '빌링 정보 조회' })
  @ApiResponse({ status: 200, description: '빌링 정보가 성공적으로 조회되었습니다.' })
  async getBilling(@Req() req: any) {
    const tenantId = req.user.tenant?._id;
    if (!tenantId) {
      throw new Error('Tenant not found');
    }
    return this.billingService.getBillingInfo(tenantId);
  }

  @Post('charge')
  @Roles('admin')
  @ApiOperation({ summary: '충전 (관리자 전용)' })
  @ApiResponse({ status: 201, description: '충전이 성공적으로 완료되었습니다.' })
  async charge(@Req() req: any, @Body() chargeDto: ChargeDto) {
    const tenantId = req.user.tenant?._id;
    if (!tenantId) {
      throw new Error('Tenant not found');
    }
    return this.billingService.charge(tenantId, chargeDto.amount, chargeDto.method);
  }

  @Get('transactions')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '거래 내역 조회' })
  @ApiResponse({ status: 200, description: '거래 내역이 성공적으로 조회되었습니다.' })
  async getTransactions(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    const tenantId = req.user.tenant?._id;
    if (!tenantId) {
      throw new Error('Tenant not found');
    }
    return this.billingService.getTransactions(
      tenantId,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
  }
}
