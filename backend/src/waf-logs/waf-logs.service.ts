import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WafLog, WafLogDocument } from '../schemas/waf-log.schema';
// import { GetWafLogsDto, WafStatsDto } from '../../../shared/dto/waf.dto';

interface GetWafLogsDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  clientIp?: string;
  ruleId?: string;
  severity?: number;
}

interface WafStatsDto {
  startDate?: string;
  endDate?: string;
}
import axios from 'axios';

@Injectable()
export class WafLogsService {
  constructor(
    @InjectModel(WafLog.name) private wafLogModel: Model<WafLogDocument>,
  ) {}

  async findAll(query: GetWafLogsDto) {
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

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return this.wafLogModel.findById(id).exec();
  }

  async getStats(query: WafStatsDto) {
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

    const dummyLogs = this.generateDummyLogs(100);
    await this.wafLogModel.insertMany(dummyLogs);
    
    return { message: `Created ${dummyLogs.length} dummy WAF logs` };
  }

  // 보안 테스트 메서드들
  async simulateSqlInjectionAttack(target = 'http://crs-nginx:8080') {
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
        const response = await axios.get(`${target}/?id=${encodeURIComponent(payload)}`, {
          timeout: 5000,
          validateStatus: () => true, // 모든 HTTP 상태 코드 허용
        });

        const logEntry = await this.createTestLogEntry({
          method: 'GET',
          uri: `/?id=${payload}`,
          responseCode: response.status,
          attackType: 'SQL Injection',
          payload,
          isBlocked: response.status === 403,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
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

  async simulateXssAttack(target = 'http://crs-nginx:8080') {
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
        const response = await axios.get(`${target}/search?q=${encodeURIComponent(payload)}`, {
          timeout: 5000,
          validateStatus: () => true,
        });

        const logEntry = await this.createTestLogEntry({
          method: 'GET',
          uri: `/search?q=${payload}`,
          responseCode: response.status,
          attackType: 'XSS',
          payload,
          isBlocked: response.status === 403,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
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

  async simulateCommandInjectionAttack(target = 'http://crs-nginx:8080') {
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
        const response = await axios.post(`${target}/exec`, 
          { command: payload }, 
          {
            timeout: 5000,
            validateStatus: () => true,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const logEntry = await this.createTestLogEntry({
          method: 'POST',
          uri: '/exec',
          responseCode: response.status,
          attackType: 'Command Injection',
          payload,
          isBlocked: response.status === 403,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
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

  async simulateDirectoryTraversalAttack(target = 'http://crs-nginx:8080') {
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
        const response = await axios.get(`${target}/file?path=${encodeURIComponent(payload)}`, {
          timeout: 5000,
          validateStatus: () => true,
        });

        const logEntry = await this.createTestLogEntry({
          method: 'GET',
          uri: `/file?path=${payload}`,
          responseCode: response.status,
          attackType: 'Directory Traversal',
          payload,
          isBlocked: response.status === 403,
        });

        results.push({
          payload,
          status: response.status,
          blocked: response.status === 403,
          logId: logEntry._id?.toString(),
        });

      } catch (error) {
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

  async simulateAllAttacks(target = 'http://crs-nginx:8080', count = 1) {
    const results: Array<{
      round: number;
      sqlInjection: any;
      xss: any;
      commandInjection: any;
      directoryTraversal: any;
    }> = [];
    
    for (let i = 0; i < count; i++) {
      const [sqlResults, xssResults, cmdResults, traversalResults] = await Promise.all([
        this.simulateSqlInjectionAttack(target),
        this.simulateXssAttack(target),
        this.simulateCommandInjectionAttack(target),
        this.simulateDirectoryTraversalAttack(target),
      ]);

      results.push({
        round: i + 1,
        sqlInjection: sqlResults,
        xss: xssResults,
        commandInjection: cmdResults,
        directoryTraversal: traversalResults,
      });

      // 테스트 간격 (1초)
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalTests = results.reduce((acc, round) => 
      acc + round.sqlInjection.totalTests + round.xss.totalTests + 
      round.commandInjection.totalTests + round.directoryTraversal.totalTests, 0
    );

    const totalBlocked = results.reduce((acc, round) => 
      acc + round.sqlInjection.blockedCount + round.xss.blockedCount + 
      round.commandInjection.blockedCount + round.directoryTraversal.blockedCount, 0
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

  private async createTestLogEntry(testData: {
    method: string;
    uri: string;
    responseCode: number;
    attackType: string;
    payload: string;
    isBlocked: boolean;
  }) {
    const logEntry = new this.wafLogModel({
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
    };
    return ruleMap[attackType] || '900000';
  }

  private getSeverityForAttackType(attackType: string): number {
    const severityMap = {
      'SQL Injection': 5,
      'XSS': 4,
      'Command Injection': 5,
      'Directory Traversal': 3,
    };
    return severityMap[attackType] || 3;
  }

  private generateDummyLogs(count: number): Partial<WafLog>[] {
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

