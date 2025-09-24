import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Billing, BillingDocument } from '../schemas/billing.schema';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<BillingDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  // 테넌트의 빌링 계정 생성 또는 조회
  async getOrCreateBilling(tenantId: string): Promise<BillingDocument> {
    let billing = await this.billingModel.findOne({ tenant: tenantId });
    
    if (!billing) {
      billing = await this.billingModel.create({
        tenant: tenantId,
        balance: 0,
        totalCharged: 0,
        totalUsed: 0,
      });
    }
    
    return billing;
  }

  // 충전
  async charge(tenantId: string, amount: number, method: string = 'admin'): Promise<Transaction> {
    const billing = await this.getOrCreateBilling(tenantId);
    
    // 트랜잭션 생성
    const transaction = await this.transactionModel.create({
      tenant: tenantId,
      type: 'charge',
      amount,
      description: `${amount.toLocaleString()}원 충전`,
      charge_method: method,
      status: 'completed',
      processed_at: new Date(),
    });

    // 잔액 업데이트
    billing.balance += amount;
    billing.totalCharged += amount;
    await billing.save();

    return transaction;
  }

  // 사용량 차감
  async deductUsage(tenantId: string, logCount: number, requestCount: number): Promise<boolean> {
    const billing = await this.getOrCreateBilling(tenantId);
    
    const logCost = logCount * billing.pricing.per_log;
    const requestCost = requestCount * billing.pricing.per_request;
    const totalCost = logCost + requestCost;

    // 잔액 부족 시 false 반환
    if (billing.balance < totalCost) {
      return false;
    }

    // 사용량 트랜잭션 생성
    await this.transactionModel.create({
      tenant: tenantId,
      type: 'usage',
      amount: totalCost,
      description: `로그 ${logCount}개, 요청 ${requestCount}개 사용`,
      usage_type: 'log',
      usage_count: logCount + requestCount,
      status: 'completed',
      processed_at: new Date(),
    });

    // 잔액 및 사용량 업데이트
    billing.balance -= totalCost;
    billing.totalUsed += totalCost;
    billing.monthly_usage.logs_count += logCount;
    billing.monthly_usage.requests_count += requestCount;
    billing.monthly_usage.amount += totalCost;
    
    await billing.save();
    return true;
  }

  // 빌링 정보 조회
  async getBillingInfo(tenantId: string) {
    const billing = await this.getOrCreateBilling(tenantId);
    const tenant = await this.tenantModel.findById(tenantId);
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // 이번 달 사용률 계산
    const monthlyLimit = tenant.subscription.limits.logs_per_month;
    const usageRate = monthlyLimit > 0 
      ? Math.min((billing.monthly_usage.logs_count / monthlyLimit) * 100, 100)
      : 0;

    return {
      balance: billing.balance,
      totalCharged: billing.totalCharged,
      totalUsed: billing.totalUsed,
      monthly_usage: billing.monthly_usage,
      pricing: billing.pricing,
      status: billing.status,
      usage_rate: usageRate,
      monthly_limit: monthlyLimit,
    };
  }

  // 트랜잭션 내역 조회
  async getTransactions(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const transactions = await this.transactionModel
      .find({ tenant: tenantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.transactionModel.countDocuments({ tenant: tenantId });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 관리자용: 모든 빌링 정보 조회
  async getAllBilling() {
    return this.billingModel
      .find()
      .populate('tenant', 'name slug subscription.plan')
      .sort({ createdAt: -1 });
  }

  // 관리자용: 테넌트에게 크레딧 지급
  async adminCharge(tenantId: string, amount: number, description?: string) {
    return this.charge(tenantId, amount, 'admin');
  }
}
