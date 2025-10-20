import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { BillingService } from '../billing/billing.service';

interface AdminChargeDto {
  tenantId: string;
  amount: number;
  description?: string;
}

@ApiTags('Admin Billing')
@Controller('admin/billing')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('overview')
  @ApiOperation({ summary: '전체 빌링 현황 조회' })
  @ApiResponse({ status: 200, description: '빌링 현황이 성공적으로 조회되었습니다.' })
  async getBillingOverview() {
    const allBilling = await this.billingService.getAllBilling();
    
    const overview = {
      total_tenants: allBilling.length,
      total_balance: allBilling.reduce((sum, b) => sum + b.balance, 0),
      total_charged: allBilling.reduce((sum, b) => sum + b.totalCharged, 0),
      total_used: allBilling.reduce((sum, b) => sum + b.totalUsed, 0),
      active_tenants: allBilling.filter(b => b.status === 'active').length,
      suspended_tenants: allBilling.filter(b => b.status === 'suspended').length,
    };

    return {
      overview,
      tenants: allBilling,
    };
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: '특정 테넌트 빌링 정보 조회' })
  @ApiResponse({ status: 200, description: '테넌트 빌링 정보가 성공적으로 조회되었습니다.' })
  async getTenantBilling(@Param('tenantId') tenantId: string) {
    const billing = await this.billingService.getBillingInfo(tenantId);
    const transactions = await this.billingService.getTransactions(tenantId, 1, 50);
    
    return {
      billing,
      recent_transactions: transactions.transactions,
    };
  }

  @Post('charge')
  @ApiOperation({ summary: '테넌트에게 크레딧 지급' })
  @ApiResponse({ status: 201, description: '크레딧이 성공적으로 지급되었습니다.' })
  async chargeCredit(@Body() chargeDto: AdminChargeDto) {
    return this.billingService.adminCharge(
      chargeDto.tenantId,
      chargeDto.amount,
      chargeDto.description
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: '전체 거래 내역 조회' })
  @ApiResponse({ status: 200, description: '거래 내역이 성공적으로 조회되었습니다.' })
  async getAllTransactions() {
    // 관리자용 전체 트랜잭션 조회 로직 구현
    // 간단한 버전으로 구현
    return { message: 'All transactions endpoint - to be implemented' };
  }
}
