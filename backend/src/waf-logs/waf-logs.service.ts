import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WafLog, WafLogDocument } from '../schemas/waf-log.schema';
import { GetWafLogsDto, WafStatsDto } from '../../../shared/dto/waf.dto';

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

