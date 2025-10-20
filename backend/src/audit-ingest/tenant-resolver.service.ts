import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger(TenantResolverService.name);
  private tenantCache = new Map<string, Types.ObjectId>();

  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  /**
   * IP 또는 도메인을 기반으로 테넌트를 결정합니다.
   * X-Tenant-ID 헤더가 있으면 최우선으로 사용합니다.
   */
  async resolveTenantForRequest(clientIp: string, host?: string, tenantIdHeader?: string): Promise<Types.ObjectId | null> {
    try {
      // 1. 헤더에 Tenant ID가 있으면 최우선으로 사용
      if (tenantIdHeader) {
        try {
          const tenant = await this.tenantModel.findById(tenantIdHeader).select('_id').lean();
          if (tenant) {
            this.logger.debug(`Tenant resolved from X-Tenant-ID header: ${tenant._id}`);
            return tenant._id as Types.ObjectId;
          }
        } catch (e) {
          this.logger.warn(`Invalid X-Tenant-ID header received: ${tenantIdHeader}`);
        }
      }

      // 2. 헤더가 없는 경우, 특정 시스템 IP(e.g., 로드 밸런서)에 대한 고정 매핑 확인 (선택적 확장)
      // 예: if (clientIp === '10.0.0.1') return this.getSystemTenantId();

      // 3. 위 조건에 해당하지 않으면 테넌트를 결정할 수 없음 -> null 반환
      this.logger.debug(`Could not resolve tenant for IP ${clientIp} without X-Tenant-ID header.`);
      return null;

    } catch (error) {
      this.logger.error(`Failed to resolve tenant for ${clientIp}: ${error.message}`);
      return null;
    }
  }

  /**
   * 특정 테넌트에 요청을 강제 할당 (테스트용)
   */
  async assignToSpecificTenant(tenantId: string): Promise<Types.ObjectId | null> {
    try {
      const tenant = await this.tenantModel.findById(tenantId);
      if (!tenant) {
        this.logger.warn(`Tenant ${tenantId} not found`);
        return null;
      }
      return tenant._id as Types.ObjectId;
    } catch (error) {
      this.logger.error(`Failed to assign to tenant ${tenantId}: ${error.message}`);
      return null;
    }
  }

  /**
   * 데모용 기본 테넌트 반환
   */
  async getDefaultTenant(): Promise<Types.ObjectId | null> {
    try {
      const demoTenant = await this.tenantModel.findOne({ 
        slug: 'demo-tenant' 
      });
      return demoTenant?._id as Types.ObjectId || null;
    } catch (error) {
      this.logger.error(`Failed to get default tenant: ${error.message}`);
      return null;
    }
  }

  /**
   * 단순한 문자열 해시 함수
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash);
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.tenantCache.clear();
  }
}
