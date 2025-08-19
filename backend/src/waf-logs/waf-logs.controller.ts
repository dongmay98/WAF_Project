import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WafLogsService } from './waf-logs.service';
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
@Controller('api/waf-logs')
export class WafLogsController {
  constructor(private readonly wafLogsService: WafLogsService) {}

  @Get()
  @ApiOperation({ summary: 'WAF 로그 목록 조회' })
  @ApiResponse({ status: 200, description: 'WAF 로그 목록이 성공적으로 조회되었습니다.' })
  async findAll(@Query() query: GetWafLogsDto) {
    return this.wafLogsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'WAF 통계 조회' })
  @ApiResponse({ status: 200, description: 'WAF 통계가 성공적으로 조회되었습니다.' })
  async getStats(@Query() query: WafStatsDto) {
    return this.wafLogsService.getStats(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'WAF 로그 상세 조회' })
  @ApiResponse({ status: 200, description: 'WAF 로그 상세가 성공적으로 조회되었습니다.' })
  async findOne(@Param('id') id: string) {
    return this.wafLogsService.findById(id);
  }

  @Post('seed')
  @ApiOperation({ summary: '더미 데이터 생성 (개발용)' })
  @ApiResponse({ status: 200, description: '더미 데이터가 성공적으로 생성되었습니다.' })
  async seedDummyData() {
    return this.wafLogsService.seedDummyData();
  }

  @Post('test/sql-injection')
  @ApiOperation({ summary: 'SQL Injection 공격 테스트' })
  @ApiResponse({ status: 200, description: 'SQL Injection 테스트가 완료되었습니다.' })
  async testSqlInjection(@Body() body: { target?: string }) {
    return this.wafLogsService.simulateSqlInjectionAttack(body.target);
  }

  @Post('test/xss')
  @ApiOperation({ summary: 'XSS 공격 테스트' })
  @ApiResponse({ status: 200, description: 'XSS 테스트가 완료되었습니다.' })
  async testXss(@Body() body: { target?: string }) {
    return this.wafLogsService.simulateXssAttack(body.target);
  }

  @Post('test/command-injection')
  @ApiOperation({ summary: 'Command Injection 공격 테스트' })
  @ApiResponse({ status: 200, description: 'Command Injection 테스트가 완료되었습니다.' })
  async testCommandInjection(@Body() body: { target?: string }) {
    return this.wafLogsService.simulateCommandInjectionAttack(body.target);
  }

  @Post('test/directory-traversal')
  @ApiOperation({ summary: 'Directory Traversal 공격 테스트' })
  @ApiResponse({ status: 200, description: 'Directory Traversal 테스트가 완료되었습니다.' })
  async testDirectoryTraversal(@Body() body: { target?: string }) {
    return this.wafLogsService.simulateDirectoryTraversalAttack(body.target);
  }

  @Post('test/all-attacks')
  @ApiOperation({ summary: '모든 공격 패턴 테스트' })
  @ApiResponse({ status: 200, description: '전체 공격 테스트가 완료되었습니다.' })
  async testAllAttacks(@Body() body: { target?: string; count?: number }) {
    return this.wafLogsService.simulateAllAttacks(body.target, body.count);
  }
}

