import { Controller, Get, Param, Query, Post, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { WafLogsService } from './waf-logs.service';
import { RealDataService, TrafficSummary } from './real-data.service';
import { TrafficGeneratorService, TrafficGenerationResult } from './traffic-generator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
// import type { GetWafLogsDto, WafStatsDto } from '../../../shared/dto/waf.dto';

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

@ApiTags('WAF Logs')
@Controller('custom/security-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WafLogsController {
  private readonly logger = new Logger(WafLogsController.name);

  constructor(
    private readonly wafLogsService: WafLogsService,
    private readonly realDataService: RealDataService,
    private readonly trafficGenerator: TrafficGeneratorService,
  ) {}

  @Get()
  @Roles('admin', 'analyst', 'viewer') // 모든 역할 접근 가능
  @ApiOperation({ summary: 'WAF 로그 목록 조회' })
  @ApiResponse({ status: 200, description: 'WAF 로그 목록이 성공적으로 조회되었습니다.' })
  async findAll(@Query() query: GetWafLogsDto, @Req() req: Request) {
    const user = (req as any).user;
    console.log('[DEBUG] WafLogsController - findAll - req.user:', JSON.stringify(user, null, 2));

    const isAdmin = user.role === 'admin';
    const tenantId = user.tenant?._id;
    console.log(`[DEBUG] WafLogsController - findAll - Resolved tenantId: ${tenantId}`);

    return this.wafLogsService.findAll(query, isAdmin, tenantId);
  }

  @Get('stats')
  @Roles('admin', 'analyst', 'viewer') // 모든 역할 접근 가능
  @ApiOperation({ summary: 'WAF 통계 조회' })
  @ApiResponse({ status: 200, description: 'WAF 통계가 성공적으로 조회되었습니다.' })
  async getStats(@Query() query: WafStatsDto, @Req() req: Request) {
    const user = (req as any).user;
    const isAdmin = user.role === 'admin';
    const tenantId = user.tenant?._id;
    console.log('hello')
    return this.wafLogsService.getStats(query, isAdmin, tenantId);
  }

  @Get('raw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst') // viewer는 접근 불가
  @ApiOperation({ summary: '원본 감사 로그 최근 N라인 조회' })
  @ApiResponse({ status: 200, description: '원본 감사 로그가 성공적으로 조회되었습니다.' })
  async getRawAudit(@Query('limit') limit?: string) {
    const n = Math.max(1, Math.min(parseInt(limit || '200', 10) || 200, 2000));
    console.log('hello')
    return this.wafLogsService.getRawAuditLog(n);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: 'WAF 로그 상세 조회' })
  @ApiResponse({ status: 200, description: 'WAF 로그 상세가 성공적으로 조회되었습니다.' })
  async findOne(@Param('id') id: string) {
    return this.wafLogsService.findById(id);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '더미 데이터 생성 (개발용)' })
  @ApiResponse({ status: 200, description: '더미 데이터가 성공적으로 생성되었습니다.' })
  async seedDummyData() {
    return this.wafLogsService.seedDummyData();
  }

  @Post('test/sql-injection')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: 'SQL Injection 공격 테스트' })
  @ApiResponse({ status: 200, description: 'SQL Injection 테스트가 완료되었습니다.' })
  async testSqlInjection(@Body() body: { target?: string }, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    this.logger.debug(`[WAF-TEST] Controller received request. User from JWT: ${JSON.stringify(user)}`);
    this.logger.debug(`[WAF-TEST] Extracted tenantId for service: ${tenantId}`);
    return this.wafLogsService.simulateSqlInjectionAttack(body.target, tenantId);
  }

  @Post('test/xss')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: 'XSS 공격 테스트' })
  @ApiResponse({ status: 200, description: 'XSS 테스트가 완료되었습니다.' })
  async testXss(@Body() body: { target?: string }, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    this.logger.debug(`[WAF-TEST] Controller received request. User from JWT: ${JSON.stringify(user)}`);
    this.logger.debug(`[WAF-TEST] Extracted tenantId for service: ${tenantId}`);
    return this.wafLogsService.simulateXssAttack(body.target, tenantId);
  }

  @Post('test/command-injection')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: 'Command Injection 공격 테스트' })
  @ApiResponse({ status: 200, description: 'Command Injection 테스트가 완료되었습니다.' })
  async testCommandInjection(@Body() body: { target?: string }, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    this.logger.debug(`[WAF-TEST] Controller received request. User from JWT: ${JSON.stringify(user)}`);
    this.logger.debug(`[WAF-TEST] Extracted tenantId for service: ${tenantId}`);
    return this.wafLogsService.simulateCommandInjectionAttack(body.target, tenantId);
  }

  @Post('test/directory-traversal')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: 'Directory Traversal 공격 테스트' })
  @ApiResponse({ status: 200, description: 'Directory Traversal 테스트가 완료되었습니다.' })
  async testDirectoryTraversal(@Body() body: { target?: string }, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    this.logger.debug(`[WAF-TEST] Controller received request. User from JWT: ${JSON.stringify(user)}`);
    this.logger.debug(`[WAF-TEST] Extracted tenantId for service: ${tenantId}`);
    return this.wafLogsService.simulateDirectoryTraversalAttack(body.target, tenantId);
  }

  @Post('test/all-attacks')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '모든 공격 패턴 테스트' })
  @ApiResponse({ status: 200, description: '전체 공격 테스트가 완료되었습니다.' })
  async testAllAttacks(@Body() body: { target?: string; count?: number }, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenant?._id;
    this.logger.debug(`[WAF-TEST] Controller received request. User from JWT: ${JSON.stringify(user)}`);
    this.logger.debug(`[WAF-TEST] Extracted tenantId for service: ${tenantId}`);
    return this.wafLogsService.simulateAllAttacks(body.target, body.count, tenantId);
  }

  @Post('generate-real-traffic')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '실제 WAF 트래픽 생성' })
  @ApiResponse({ status: 200, description: '실제 트래픽이 성공적으로 생성되었습니다.' })
  async generateRealTraffic(@Body() body: { count?: number }): Promise<TrafficSummary> {
    const count = body.count || 50;
    return this.realDataService.generateRealTraffic(count);
  }

  @Post('generate-waf-traffic')
  @Roles('admin', 'analyst', 'viewer')
  @ApiOperation({ summary: '실제 WAF에 트래픽 전송 (ModSecurity 로그 생성)' })
  @ApiResponse({ status: 200, description: '실제 WAF 트래픽이 성공적으로 생성되었습니다.' })
  async generateWafTraffic(@Body() body: { count?: number }) {
    const count = body.count || 20;
    const result = await this.trafficGenerator.generateRealWafTraffic(count);

    return {
      success: result.success,
      message: result.success
        ? `${result.totalRequests}개의 요청을 WAF에 전송했습니다. (정상: ${result.normalRequests}, 악성: ${result.maliciousRequests})`
        : '트래픽 생성 중 오류가 발생했습니다.',
      details: result,
    };
  }

}

