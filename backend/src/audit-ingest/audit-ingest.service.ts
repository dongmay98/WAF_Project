import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { existsSync } from 'fs';
import { Tail } from 'tail';
import { WafLog, WafLogDocument } from '../schemas/waf-log.schema';

interface ModsecAuditEntry {
  transaction?: {
    time?: string;
    unix_timestamp?: number;
    remote_address?: string;
    request?: {
      method?: string;
      uri?: string;
      headers?: Record<string, string>;
      body?: string;
    };
    response?: {
      status?: number;
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

  constructor(
    @InjectModel(WafLog.name) private readonly wafLogModel: Model<WafLogDocument>,
  ) {}

  async onModuleInit() {
    this.beginWithRetry();
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

    const matched = entry.messages?.[0];
    const details = matched?.details || {};

    const doc = new this.wafLogModel({
      timestamp: tx.unix_timestamp ? new Date(tx.unix_timestamp * 1000) : new Date(tx.time || Date.now()),
      clientIp: tx.remote_address || 'unknown',
      requestMethod: tx.request?.method || 'GET',
      requestUri: tx.request?.uri || '/',
      responseCode: tx.response?.status ?? 0,
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
    // Heuristic: if there are messages with severity and typical blocking rule IDs, assume blocked.
    // Better approach: inspect audit fields like "intervention" if available.
    const any = entry.messages?.some(m => !!m?.details?.ruleId);
    return !!any;
  }
}


