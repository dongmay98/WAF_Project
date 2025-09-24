import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import { User, UserDocument } from '../schemas/user.schema';

interface CreateTenantDto {
  name: string;
  slug: string;
  description?: string;
  ownerEmail: string;
  ownerName: string;
  ownerGoogleId: string;
  ownerPicture?: string;
}

interface UpdateTenantDto {
  name?: string;
  description?: string;
  waf_config?: {
    paranoia_level?: number;
    anomaly_threshold?: number;
    protected_domains?: string[];
  };
  subscription?: {
    plan?: 'free' | 'pro';
  };
}

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createTenant(createTenantDto: CreateTenantDto): Promise<{ tenant: TenantDocument; user: UserDocument }> {
    // Check if slug is already taken
    const existingTenant = await this.tenantModel.findOne({ slug: createTenantDto.slug });
    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Create tenant
    const tenant = new this.tenantModel({
      name: createTenantDto.name,
      slug: createTenantDto.slug,
      description: createTenantDto.description,
    });
    await tenant.save();

    // Create owner user
    const user = new this.userModel({
      email: createTenantDto.ownerEmail,
      name: createTenantDto.ownerName,
      googleId: createTenantDto.ownerGoogleId,
      picture: createTenantDto.ownerPicture,
      role: 'admin',
      tenant: tenant._id,
    });
    await user.save();

    return { tenant, user };
  }

  async findById(id: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findOne({ slug });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async updateTenant(tenantId: string, updateDto: UpdateTenantDto): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findByIdAndUpdate(
      tenantId,
      { $set: updateDto },
      { new: true, runValidators: true }
    );
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async getTenantUsers(tenantId: string): Promise<UserDocument[]> {
    return this.userModel.find({ tenant: tenantId, isActive: true });
  }

  async trackRequest(tenantId: string): Promise<void> {
    const now = new Date();
    const tenant = await this.tenantModel.findById(tenantId);
    
    if (!tenant) return;

    // Reset monthly usage if new month
    const lastReset = new Date(tenant.usage.last_reset);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      tenant.usage.requests_this_month = 0;
      tenant.usage.last_reset = now;
    }

    // Increment request count
    tenant.usage.requests_this_month += 1;
    await tenant.save();
  }

  async checkUsageLimit(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) return false;

    return tenant.usage.requests_this_month < tenant.subscription.limits.requests_per_month;
  }

  async getUsageStats(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const usagePercentage = (tenant.usage.requests_this_month / tenant.subscription.limits.requests_per_month) * 100;

    return {
      current_usage: tenant.usage.requests_this_month,
      limit: tenant.subscription.limits.requests_per_month,
      usage_percentage: Math.min(usagePercentage, 100),
      plan: tenant.subscription.plan,
      remaining: Math.max(0, tenant.subscription.limits.requests_per_month - tenant.usage.requests_this_month),
    };
  }

  // WAF 설정 관련 메서드들
  async getWafConfig(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    
    return {
      waf_config: tenant.waf_config,
      tenant_name: tenant.name,
      subscription_plan: tenant.subscription.plan,
    };
  }

  async updateWafConfig(tenantId: string, configData: {
    paranoia_level?: number;
    blocking_mode?: boolean;
    custom_rules?: string[];
  }) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    // 구독 플랜에 따른 제한 확인
    if (configData.custom_rules && configData.custom_rules.length > tenant.subscription.limits.custom_rules) {
      throw new ConflictException(`커스텀 룰은 최대 ${tenant.subscription.limits.custom_rules}개까지 허용됩니다.`);
    }

    // WAF 설정 업데이트
    if (configData.paranoia_level !== undefined) {
      tenant.waf_config.paranoia_level = Math.max(1, Math.min(4, configData.paranoia_level));
    }
    if (configData.blocking_mode !== undefined) {
      tenant.waf_config.blocking_mode = configData.blocking_mode;
    }
    if (configData.custom_rules !== undefined) {
      tenant.waf_config.custom_rules = configData.custom_rules;
    }

    tenant.waf_config.updated_at = new Date();
    await tenant.save();

    return {
      success: true,
      waf_config: tenant.waf_config,
      message: 'WAF 설정이 성공적으로 업데이트되었습니다.',
    };
  }

  async getSubscriptionInfo(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    
    return {
      subscription: tenant.subscription,
      tenant_name: tenant.name,
      created_at: tenant.created_at,
    };
  }

  async getUsageInfo(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    
    const usagePercentage = (tenant.usage.requests_this_month / tenant.subscription.limits.requests_per_month) * 100;
    
    return {
      usage: tenant.usage,
      limits: tenant.subscription.limits,
      plan: tenant.subscription.plan,
      usage_percentage: Math.min(usagePercentage, 100),
      remaining_requests: Math.max(0, tenant.subscription.limits.requests_per_month - tenant.usage.requests_this_month),
      is_over_limit: tenant.usage.requests_this_month >= tenant.subscription.limits.requests_per_month,
    };
  }
}
