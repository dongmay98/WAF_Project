import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { existsSync } from 'fs';
import { Tail } from 'tail';
import { WafLog, WafLogDocument } from '../schemas/waf-log.schema';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import { TenantResolverService } from './tenant-resolver.service';

interface ModsecAuditEntry {
  transaction?: {
    time?: string;
    time_stamp?: string;
    unix_timestamp?: number;
    remote_address?: string;
    client_ip?: string;
    request?: {
      method?: string;
      uri?: string;
      headers?: Record<string, string>;
      body?: string;
    };
    response?: {
      status?: number;
      http_code?: number;
      headers?: Record<string, string>;
      body?: string;
    };
  };
  messages?: Array<{
    message?: string;
    details?: {
      severity?: number;
      ruleId?: string | number;
      tags?: string[];
    };
  }>;
}

@Injectable()
export class AuditIngestService implements OnModuleInit {
  private readonly logger = new Logger(AuditIngestService.name);
  private readonly auditLogPath: string = process.env.AUDIT_LOG_FILE || '/var/log/modsecurity/audit.log';
  private tailInstance?: Tail;
  private retryTimer?: NodeJS.Timeout;
  private uncategorizedTenantId: Types.ObjectId | null = null;

  constructor(
    @InjectModel(WafLog.name) private readonly wafLogModel: Model<WafLogDocument>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    private readonly tenantResolver: TenantResolverService,
  ) {}

  async onModuleInit() {
    await this.ensureSystemTenants();
    this.beginWithRetry();
  }

  private async ensureSystemTenants() {
    // 1. "미분류" 테넌트 확인 및 생성
    let uncategorizedTenant = await this.tenantModel.findOne({ slug: 'uncategorized-logs' });
    if (!uncategorizedTenant) {
      this.logger.log('Creating "Uncategorized Logs" tenant...');
      uncategorizedTenant = await this.tenantModel.create({
        name: 'Uncategorized Logs',
        slug: 'uncategorized-logs',
        description: 'Tenant for logs from unidentified sources.',
        status: 'system', // 시스템 테넌트임을 명시
        subscription: { plan: 'free' },
      });
    }
    this.uncategorizedTenantId = uncategorizedTenant._id as Types.ObjectId;
    this.logger.log(`Uncategorized tenant ID: ${this.uncategorizedTenantId}`);
    
    // 2. 데모용 기본 테넌트 확인 (기존 로직 유지)
    let demoTenant = await this.tenantModel.findOne({ slug: 'demo-tenant' });
    if (!demoTenant) {
      this.logger.log('Creating default demo tenant...');
      demoTenant = await this.tenantModel.create({
        name: 'Demo Company',
        slug: 'demo-tenant',
        description: 'Default tenant for demo purposes',
        subscription: {
          plan: 'pro',
          limits: { requests_per_month: 1000000, custom_rules: 50, users: 10 },
        },
      });
    }
  }

  private beginWithRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }

    if (!existsSync(this.auditLogPath)) {
      this.logger.warn(`Audit log file not found at ${this.auditLogPath}. Waiting for mount...`);
      this.retryTimer = setTimeout(() => this.beginWithRetry(), 3000);
      return;
    }

    try {
      this.startTailInternal();
    } catch (error) {
      this.logger.error(`Failed to start audit ingest: ${error.message}`);
      this.retryTimer = setTimeout(() => this.beginWithRetry(), 3000);
    }
  }

  private startTailInternal() {
    const tail = new Tail(this.auditLogPath, { useWatchFile: true, fromBeginning: false, follow: true });
    this.tailInstance = tail;

    tail.on('line', async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      // ModSecurity Serial JSON format may produce one JSON object per line
      try {
        const entry = JSON.parse(trimmed) as ModsecAuditEntry;
        await this.persistEntry(entry);
      } catch (e) {
        // Not JSON; ignore or log at debug
        this.logger.debug(`Non-JSON audit line ignored`);
      }
    });

    tail.on('error', (err) => {
      this.logger.error(`Tail error: ${err}`);
      this.stopTail();
      // try to restart after short delay
      this.retryTimer = setTimeout(() => this.beginWithRetry(), 3000);
    });

    this.logger.log(`Tail started on ${this.auditLogPath}`);
  }

  private stopTail() {
    if (this.tailInstance) {
      try {
        // Tail library has no explicit close API in some versions; relying on GC.
        // We simply drop the reference and let retry recreate it.
      } catch {
        // ignore
      }
      this.tailInstance = undefined;
    }
  }

  private async persistEntry(entry: ModsecAuditEntry) {
    if (!entry?.transaction) return;
    const tx = entry.transaction;

    // Skip healthcheck requests to reduce noise
    if (tx.request?.uri === '/healthz') return;

    const matched = entry.messages?.[0];
    const details = matched?.details || {};
    
    // 스마트 테넌트 할당: IP 기반으로 활성 테넌트 중에서 분산 할당
    const clientIp = tx.client_ip || tx.remote_address || 'unknown';
    const host = tx.request?.headers?.['Host'] || tx.request?.headers?.['host'];
    const headers = tx.request?.headers || {};
    const tenantIdHeader = headers['X-Tenant-ID'] || headers['x-tenant-id'] as string;
    
    let assignedTenantId = await this.tenantResolver.resolveTenantForRequest(clientIp, host, tenantIdHeader);
    
    // 테넌트를 결정하지 못하면 "미분류" 테넌트에 할당
    if (!assignedTenantId) {
      assignedTenantId = this.uncategorizedTenantId || null;
    }

    const doc = new this.wafLogModel({
      tenant: assignedTenantId,
      timestamp: tx.unix_timestamp ? new Date(tx.unix_timestamp * 1000) : new Date(tx.time_stamp || tx.time || Date.now()),
      clientIp: clientIp,
      requestMethod: tx.request?.method || 'GET',
      requestUri: tx.request?.uri || '/',
      responseCode: (tx.response?.http_code || tx.response?.status) ?? 0,
      ruleId: details.ruleId ? String(details.ruleId) : undefined,
      message: matched?.message,
      severity: typeof details.severity === 'number' ? details.severity : undefined,
      tags: Array.isArray(details.tags) ? details.tags : [],
      fullLog: JSON.stringify(entry),
      userAgent: tx.request?.headers?.['User-Agent'] || tx.request?.headers?.['user-agent'],
      requestHeaders: tx.request?.headers,
      responseHeaders: tx.response?.headers,
      requestBody: tx.request?.body,
      attackType: this.inferAttackTypeFromRule(details.ruleId),
      isBlocked: this.isBlockedFromMessages(entry),
    });

    await doc.save();
    
    // 로그 생성 시 해당 테넌트의 사용량 추적
    if (assignedTenantId) {
      try {
        // 요청 카운트 증가 (비동기로 처리하여 성능 영향 최소화)
        setImmediate(async () => {
          const tenant = await this.tenantModel.findById(assignedTenantId);
          if (tenant) {
            const now = new Date();
            const lastReset = new Date(tenant.usage.last_reset);
            
            // 월이 바뀌었으면 사용량 리셋
            if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
              tenant.usage.requests_this_month = 0;
              tenant.usage.last_reset = now;
            }
            
            tenant.usage.requests_this_month += 1;
            await tenant.save();
          }
        });
      } catch (error) {
        this.logger.warn(`Failed to update tenant usage: ${error.message}`);
      }
    }
  }

  private inferAttackTypeFromRule(ruleId: unknown): string | undefined {
    const id = Number(ruleId);
    if (!id) return undefined;
    if (id >= 942100 && id < 943000) return 'SQL Injection';
    if (id >= 941100 && id < 942000) return 'XSS';
    if (id >= 932100 && id < 933000) return 'Command Injection';
    if (id >= 930100 && id < 931000) return 'Directory Traversal';
    return undefined;
  }

  private isBlockedFromMessages(entry: ModsecAuditEntry): boolean {
    // 1. 응답 코드가 403이면 확실히 차단된 것입니다.
    if (entry.transaction?.response?.http_code === 403) {
      return true;
    }

    // 2. 메시지가 없으면 차단되지 않았습니다.
    if (!entry.messages || entry.messages.length === 0) {
      return false;
    }

    // 3. CRS의 Anomaly Score 임계값 초과 메시지가 있는지 확인합니다.
    return entry.messages.some(
      (m) => m.message?.includes('Inbound Anomaly Score Exceeded'),
    );
  }
}


