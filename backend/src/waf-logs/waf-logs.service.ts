import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WafLog, WafLogDocument } from '../schemas/waf-log.schema';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
// import { GetWafLogsDto, WafStatsDto } from '../../../shared/dto/waf.dto';

interface GetWafLogsDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  clientIp?: string;
  ruleId?: string;
  severity?: number;
  tenantId?: string;
}

interface WafStatsDto {
  startDate?: string;
  endDate?: string;
}
import axios from 'axios';
import http from 'http';
import https from 'https';
import { promises as fsp } from 'fs';

@Injectable()
export class WafLogsService {
  constructor(
    @InjectModel(WafLog.name) private wafLogModel: Model<WafLogDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  private httpClient?: ReturnType<typeof axios.create>;

  async findAll(query: GetWafLogsDto, isAdmin = false, tenantId?: string) {
    console.log(`[DEBUG] WafLogsService - findAll - Received tenantId: ${tenantId}`);
    const { page = 1, limit = 10, startDate, endDate, clientIp, ruleId, severity } = query;
    
    // 필터 조건 생성
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    if (clientIp) filter.clientIp = { $regex: clientIp, $options: 'i' };
    if (ruleId) filter.ruleId = ruleId;
    if (severity !== undefined) filter.severity = severity;

    // 테넌트별 데이터 격리: 관리자가 아닌 경우 해당 테넌트 데이터만 조회
    if (!isAdmin && tenantId) {
      filter.tenant = new Types.ObjectId(tenantId);
    }
    console.log('[DEBUG] WafLogsService - findAll - Final MongoDB filter:', JSON.stringify(filter, null, 2));

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 데이터 조회
    const logs = await this.wafLogModel
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.wafLogModel.countDocuments(filter);
    
    console.log(`[DEBUG] WafLogsService - findAll - Query result: Found ${logs.length} logs, Total: ${total}`);
    console.log(`[DEBUG] WafLogsService - findAll - First log sample:`, logs[0] ? JSON.stringify({
      _id: logs[0]._id,
      tenant: logs[0].tenant,
      isBlocked: logs[0].isBlocked,
      attackType: logs[0].attackType
    }, null, 2) : 'No logs found');

    const result = {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
    
    console.log(`[DEBUG] WafLogsService - findAll - Final result structure:`, JSON.stringify({
      logsCount: result.logs.length,
      pagination: result.pagination,
      firstLogId: result.logs[0]?._id
    }, null, 2));
    
    return result;
  }

  async findById(id: string) {
    return this.wafLogModel.findById(id).exec();
  }

  async getStats(query: WafStatsDto, isAdmin = false, tenantId?: string) {
    const { startDate, endDate } = query;
    
    // 기본 필터 (최근 24시간)
    const filter: any = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    } else {
      // 기본값: 최근 24시간
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      filter.timestamp = { $gte: oneDayAgo };
    }

    // 테넌트별 데이터 격리: 관리자가 아닌 경우 해당 테넌트 데이터만 조회
    if (!isAdmin && tenantId) {
      filter.tenant = new Types.ObjectId(tenantId);
    }

    const [
      totalRequests,
      blockedRequests,
      topBlockedIps,
      topBlockedRules,
      attackTypeDistribution,
    ] = await Promise.all([
      // 총 요청 수
      this.wafLogModel.countDocuments(filter),
      
      // 차단된 요청 수
      this.wafLogModel.countDocuments({ ...filter, isBlocked: true }),
      
      // 상위 차단된 IP들
      this.wafLogModel.aggregate([
        { $match: { ...filter, isBlocked: true } },
        { $group: { _id: '$clientIp', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { ip: '$_id', count: 1, _id: 0 } },
      ]),
      
      // 상위 차단 룰들
      this.wafLogModel.aggregate([
        { $match: { ...filter, isBlocked: true, ruleId: { $exists: true } } },
        { $group: { _id: '$ruleId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { ruleId: '$_id', count: 1, _id: 0 } },
      ]),
      
      // 공격 유형별 분포
      this.wafLogModel.aggregate([
        { $match: { ...filter, attackType: { $exists: true } } },
        { $group: { _id: '$attackType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { type: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    return {
      totalRequests,
      blockedRequests,
      topBlockedIps,
      topBlockedRules,
      attackTypeDistribution,
    };
  }

  // 더미 데이터 생성 (개발/테스트용)
  async seedDummyData() {
    const existingCount = await this.wafLogModel.countDocuments();
    if (existingCount > 0) {
      return { message: 'Dummy data already exists' };
    }

    const dummyLogs = await this.generateDummyLogs(100);
    await this.wafLogModel.insertMany(dummyLogs);
    
    return { message: `Created ${dummyLogs.length} dummy WAF logs` };
  }

  // 보안 테스트 메서드들
  async simulateSqlInjectionAttack(target = 'http://localhost:8080', tenantId?: string) {
    const resolvedTarget = this.resolveTargetForDocker(target);
    const client = this.createHttpClient(tenantId);
    const sqlPayloads = [
      "1' OR '1'='1",
      "1' UNION SELECT 1,2,3--",
      "admin'--",
      "1'; DROP TABLE users--",
      "' OR 1=1#"
    ];

    const results: Array<{
      payload: string;
      status: number | string;
      blocked: boolean;
      logId?: string;
      error?: string;
    }> = [];
    for (const payload of sqlPayloads) {
      try {
        const response = await client.get(`${resolvedTarget}/?id=${encodeURIComponent(payload)}`);

        const logEntry = await this.createTestLogEntry({
          method: 'GET',
          uri: `/?id=${payload}`,
          responseCode: response.status,
          attackType: 'SQL Injection',
          payload,
          isBlocked: response.status === 403,
          tenantId,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
        // Persist error as a log entry for visibility
        await this.createTestLogEntry({
          method: 'GET',
          uri: `/?id=${payload}`,
          responseCode: 0,
          attackType: 'SQL Injection',
          payload,
          isBlocked: true,
          tenantId,
        });

        results.push({
          payload,
          status: 'ERROR',
          blocked: true,
          error: error.message,
        });
      }
    }

    return {
      attackType: 'SQL Injection',
      target,
      totalTests: sqlPayloads.length,
      blockedCount: results.filter(r => r.blocked).length,
      results,
    };
  }

  async simulateXssAttack(target = 'http://localhost:8080', tenantId?: string) {
    const resolvedTarget = this.resolveTargetForDocker(target);
    const client = this.createHttpClient(tenantId);
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "';alert('XSS');//"
    ];

    const results: Array<{
      payload: string;
      status: number | string;
      blocked: boolean;
      logId?: string;
      error?: string;
    }> = [];
    for (const payload of xssPayloads) {
      try {
        const response = await client.get(`${resolvedTarget}/search?q=${encodeURIComponent(payload)}`);

        const logEntry = await this.createTestLogEntry({
          method: 'GET',
          uri: `/search?q=${payload}`,
          responseCode: response.status,
          attackType: 'XSS',
          payload,
          isBlocked: response.status === 403,
          tenantId,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
        await this.createTestLogEntry({
          method: 'GET',
          uri: `/search?q=${payload}`,
          responseCode: 0,
          attackType: 'XSS',
          payload,
          isBlocked: true,
          tenantId,
        });

        results.push({
          payload,
          status: 'ERROR',
          blocked: true,
          error: error.message,
        });
      }
    }

    return {
      attackType: 'XSS',
      target,
      totalTests: xssPayloads.length,
      blockedCount: results.filter(r => r.blocked).length,
      results,
    };
  }

  async simulateCommandInjectionAttack(target = 'http://localhost:8080', tenantId?: string) {
    const resolvedTarget = this.resolveTargetForDocker(target);
    const client = this.createHttpClient(tenantId);
    const cmdPayloads = [
      "; ls -la",
      "| cat /etc/passwd",
      "&& whoami",
      "; ping 127.0.0.1",
      "`id`"
    ];

    const results: Array<{
      payload: string;
      status: number | string;
      blocked: boolean;
      logId?: string;
      error?: string;
    }> = [];
    for (const payload of cmdPayloads) {
      try {
        const response = await client.post(`${resolvedTarget}/exec`, { command: payload });

        const logEntry = await this.createTestLogEntry({
          method: 'POST',
          uri: '/exec',
          responseCode: response.status,
          attackType: 'Command Injection',
          payload,
          isBlocked: response.status === 403,
          tenantId,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
        await this.createTestLogEntry({
          method: 'POST',
          uri: '/exec',
          responseCode: 0,
          attackType: 'Command Injection',
          payload,
          isBlocked: true,
          tenantId,
        });

        results.push({
          payload,
          status: 'ERROR',
          blocked: true,
          error: error.message,
        });
      }
    }

    return {
      attackType: 'Command Injection',
      target,
      totalTests: cmdPayloads.length,
      blockedCount: results.filter(r => r.blocked).length,
      results,
    };
  }

  async simulateFileUploadAttack(target = 'http://localhost:8080', tenantId?: string) {
    const resolvedTarget = this.resolveTargetForDocker(target);
    const client = this.createHttpClient(tenantId);
    
    // 악성 파일 업로드 시뮬레이션 (실제 파일 대신 파일명과 Content-Type 헤더로 테스트)
    const maliciousFiles = [
      { filename: 'shell.php', contentType: 'application/x-php', content: '<?php system($_GET["cmd"]); ?>' },
      { filename: 'backdoor.jsp', contentType: 'application/x-jsp', content: '<%@ page import="java.io.*" %>' },
      { filename: 'webshell.asp', contentType: 'application/x-asp', content: '<%eval request("cmd")%>' },
      { filename: 'exploit.php5', contentType: 'application/x-php', content: '<?php phpinfo(); ?>' },
      { filename: 'malware.phtml', contentType: 'text/html', content: '<?php exec($_POST["cmd"]); ?>' }
    ];

    const results: Array<{
      filename: string;
      status: number | string;
      blocked: boolean;
      logId?: string;
      error?: string;
    }> = [];

    for (const file of maliciousFiles) {
      try {
        // FormData 시뮬레이션
        const formData = new FormData();
        const blob = new Blob([file.content], { type: file.contentType });
        formData.append('file', blob, file.filename);

        const response = await client.post(`${resolvedTarget}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const logEntry = await this.createTestLogEntry({
          method: 'POST',
          uri: `/upload (${file.filename})`,
          responseCode: response.status,
          attackType: 'Malicious File Upload',
          payload: `${file.filename} (${file.contentType})`,
          isBlocked: response.status === 403 || response.status === 406,
          tenantId,
        });

        results.push({
          filename: file.filename,
          status: response.status,
          blocked: response.status === 403 || response.status === 406,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
        await this.createTestLogEntry({
          method: 'POST',
          uri: `/upload (${file.filename})`,
          responseCode: 0,
          attackType: 'Malicious File Upload',
          payload: `${file.filename} (${file.contentType})`,
          isBlocked: true,
          tenantId,
        });

        results.push({
          filename: file.filename,
          status: 'ERROR',
          blocked: true,
          error: error.message,
        });
      }
    }

    return {
      attackType: 'Malicious File Upload',
      target,
      totalTests: maliciousFiles.length,
      blockedCount: results.filter(r => r.blocked).length,
      results,
    };
  }

  async simulateDirectoryTraversalAttack(target = 'http://localhost:8080', tenantId?: string) {
    const resolvedTarget = this.resolveTargetForDocker(target);
    const client = this.createHttpClient(tenantId);
    const traversalPayloads = [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "....//....//....//etc/passwd",
      "/var/log/apache/access.log"
    ];

    const results: Array<{
      payload: string;
      status: number | string;
      blocked: boolean;
      logId?: string;
      error?: string;
    }> = [];
    for (const payload of traversalPayloads) {
      try {
        const response = await client.get(`${resolvedTarget}/file?path=${encodeURIComponent(payload)}`);

        const logEntry = await this.createTestLogEntry({
          method: 'GET',
          uri: `/file?path=${payload}`,
          responseCode: response.status,
          attackType: 'Directory Traversal',
          payload,
          isBlocked: response.status === 403,
          tenantId,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
        await this.createTestLogEntry({
          method: 'GET',
          uri: `/file?path=${payload}`,
          responseCode: 0,
          attackType: 'Directory Traversal',
          payload,
          isBlocked: true,
          tenantId,
        });

        results.push({
          payload,
          status: 'ERROR',
          blocked: true,
          error: error.message,
        });
      }
    }

    return {
      attackType: 'Directory Traversal',
      target,
      totalTests: traversalPayloads.length,
      blockedCount: results.filter(r => r.blocked).length,
      results,
    };
  }

  async simulateAllAttacks(target = 'http://localhost:8080', count = 1, tenantId?: string) {
    const resolvedTarget = this.resolveTargetForDocker(target);
    const results: Array<{
      round: number;
      sqlInjection: any;
      xss: any;
      commandInjection: any;
      directoryTraversal: any;
      fileUpload: any;
    }> = [];
    
    for (let i = 0; i < count; i++) {
      // 순차 실행로 전환하여 타임아웃/병목 가능성 완화
      const sqlResults = await this.simulateSqlInjectionAttack(resolvedTarget, tenantId);
      const xssResults = await this.simulateXssAttack(resolvedTarget, tenantId);
      const cmdResults = await this.simulateCommandInjectionAttack(resolvedTarget, tenantId);
      const traversalResults = await this.simulateDirectoryTraversalAttack(resolvedTarget, tenantId);
      const fileUploadResults = await this.simulateFileUploadAttack(resolvedTarget, tenantId);

      results.push({
        round: i + 1,
        sqlInjection: sqlResults,
        xss: xssResults,
        commandInjection: cmdResults,
        directoryTraversal: traversalResults,
        fileUpload: fileUploadResults,
      });

      // 테스트 간격 (1초)
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalTests = results.reduce((acc, round) => 
      acc + round.sqlInjection.totalTests + round.xss.totalTests + 
      round.commandInjection.totalTests + round.directoryTraversal.totalTests + round.fileUpload.totalTests, 0
    );

    const totalBlocked = results.reduce((acc, round) => 
      acc + round.sqlInjection.blockedCount + round.xss.blockedCount + 
      round.commandInjection.blockedCount + round.directoryTraversal.blockedCount + round.fileUpload.blockedCount, 0
    );

    return {
      target,
      rounds: count,
      totalTests,
      totalBlocked,
      blockingRate: `${((totalBlocked / totalTests) * 100).toFixed(1)}%`,
      results,
    };
  }

  private resolveTargetForDocker(input: string): string {
    try {
      const url = new URL(input);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        url.hostname = 'crs-nginx';
      }
      return url.toString().replace(/\/$/, '');
    } catch {
      return input;
    }
  }

  private createHttpClient(tenantId?: string) {
    const agentOptions = { keepAlive: true, maxSockets: 8 } as const;
    
    const headers: Record<string, string> = {
      'Connection': 'keep-alive',
    };
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    const instance = axios.create({
      timeout: 15000,
      validateStatus: () => true,
      headers,
    });
    // @ts-ignore keep-alive agents
    instance.defaults.httpAgent = new http.Agent(agentOptions);
    // @ts-ignore keep-alive agents
    instance.defaults.httpsAgent = new https.Agent(agentOptions);
    return instance;
  }

  // 원본 감사 로그 파일에서 최근 라인 반환
  async getRawAuditLog(limit = 200): Promise<Array<{ raw: string; parsed?: any }>> {
    const path = process.env.AUDIT_LOG_FILE || '/var/log/modsecurity/audit.log';
    try {
      const content = await fsp.readFile(path, 'utf8');
      const lines = content
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);
      const tail = lines.slice(-Math.max(1, Math.min(limit, 2000)));
      return tail.map((raw) => {
        try {
          return { raw, parsed: JSON.parse(raw) };
        } catch {
          return { raw };
        }
      });
    } catch (e) {
      return [];
    }
  }

  private async createTestLogEntry(testData: {
    method: string;
    uri: string;
    responseCode: number;
    attackType: string;
    payload: string;
    isBlocked: boolean;
    tenantId?: string;
  }) {
    // 테넌트 ID가 제공되면 해당 테넌트 사용, 그렇지 않으면 기본 테넌트 사용 (하위 호환성)
    let tenant;
    if (testData.tenantId) {
      tenant = await this.tenantModel.findById(testData.tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${testData.tenantId}`);
      }
    } else {
      // 기본 테넌트를 찾거나 생성 (하위 호환성)
      tenant = await this.tenantModel.findOne({ slug: 'default-test' });
      if (!tenant) {
        tenant = await this.tenantModel.create({
          name: 'Default Test Tenant',
          slug: 'default-test',
          subscription: {
            plan: 'free',
            limits: {
              requests_per_month: 10000,
              logs_per_month: 100000,
              custom_rules: 10,
            },
            status: 'active',
            created_at: new Date(),
          },
          waf_config: {
            paranoia_level: 1,
            blocking_mode: true,
            custom_rules: [],
          },
          usage: {
            requests_this_month: 0,
            last_reset: new Date(),
          },
        });
      }
    }

    const logEntry = new this.wafLogModel({
      tenant: tenant._id,
      timestamp: new Date(),
      clientIp: '127.0.0.1', // 테스트 클라이언트 IP
      requestMethod: testData.method,
      requestUri: testData.uri,
      responseCode: testData.responseCode,
      ruleId: testData.isBlocked ? this.getRuleIdForAttackType(testData.attackType) : undefined,
      message: testData.isBlocked ? `${testData.attackType} attack blocked` : undefined,
      severity: testData.isBlocked ? this.getSeverityForAttackType(testData.attackType) : undefined,
      tags: testData.isBlocked ? ['ATTACK', 'TEST', testData.attackType.toUpperCase().replace(' ', '_')] : ['TEST', 'NORMAL'],
      fullLog: `[TEST] ${testData.method} ${testData.uri} - ${testData.responseCode} - Payload: ${testData.payload}`,
      userAgent: 'WAF-Security-Tester/1.0',
      attackType: testData.attackType,
      isBlocked: testData.isBlocked,
      requestBody: testData.method === 'POST' ? JSON.stringify({ payload: testData.payload }) : undefined,
    });

    return await logEntry.save();
  }

  private getRuleIdForAttackType(attackType: string): string {
    const ruleMap = {
      'SQL Injection': '942100',
      'XSS': '941110',
      'Command Injection': '932160',
      'Directory Traversal': '930100',
      'Malicious File Upload': '920470',
    };
    return ruleMap[attackType] || '900000';
  }

  private getSeverityForAttackType(attackType: string): number {
    const severityMap = {
      'SQL Injection': 5,
      'XSS': 4,
      'Command Injection': 5,
      'Directory Traversal': 3,
      'Malicious File Upload': 4,
    };
    return severityMap[attackType] || 3;
  }

  private async generateDummyLogs(count: number): Promise<Partial<WafLog>[]> {
    // 기본 테넌트를 찾거나 생성
    let defaultTenant = await this.tenantModel.findOne({ slug: 'default-test' });
    if (!defaultTenant) {
      defaultTenant = await this.tenantModel.create({
        name: 'Default Test Tenant',
        slug: 'default-test',
        subscription: {
          plan: 'free',
          limits: {
            requests_per_month: 10000,
            logs_per_month: 100000,
            custom_rules: 10,
          },
          status: 'active',
          created_at: new Date(),
        },
        waf_config: {
          paranoia_level: 1,
          blocking_mode: true,
          custom_rules: [],
        },
        usage: {
          requests_this_month: 0,
          last_reset: new Date(),
        },
      });
    }

    const logs: Partial<WafLog>[] = [];
    const ips = ['192.168.1.100', '10.0.0.50', '172.16.0.30', '203.0.113.10', '198.51.100.20'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const uris = ['/api/users', '/login', '/admin', '/api/data', '/upload', '/search?q=<script>', '/api/sql?id=1\' OR 1=1'];
    const rules = ['932100', '932110', '941100', '941110', '942100', '920100'];
    const attackTypes = ['SQL Injection', 'XSS', 'Directory Traversal', 'Command Injection', 'CSRF'];
    const severities = [1, 2, 3, 4, 5];

    for (let i = 0; i < count; i++) {
      const isBlocked = Math.random() < 0.3; // 30% 차단율
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 1440)); // 최근 24시간 내

      logs.push({
        tenant: defaultTenant._id as any,
        timestamp,
        clientIp: ips[Math.floor(Math.random() * ips.length)],
        requestMethod: methods[Math.floor(Math.random() * methods.length)],
        requestUri: uris[Math.floor(Math.random() * uris.length)],
        responseCode: isBlocked ? 403 : [200, 404, 500][Math.floor(Math.random() * 3)],
        ruleId: isBlocked ? rules[Math.floor(Math.random() * rules.length)] : undefined,
        message: isBlocked ? 'Request blocked by WAF rule' : undefined,
        severity: isBlocked ? severities[Math.floor(Math.random() * severities.length)] : undefined,
        tags: isBlocked ? ['ATTACK', 'SUSPICIOUS'] : ['NORMAL'],
        fullLog: `[${timestamp.toISOString()}] ${ips[Math.floor(Math.random() * ips.length)]} - ${methods[Math.floor(Math.random() * methods.length)]} ${uris[Math.floor(Math.random() * uris.length)]} - ${isBlocked ? 403 : 200}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        attackType: isBlocked ? attackTypes[Math.floor(Math.random() * attackTypes.length)] : undefined,
        isBlocked,
      });
    }

    return logs;
  }
}

