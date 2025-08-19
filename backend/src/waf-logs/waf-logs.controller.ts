import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WafLogsService } from './waf-logs.service';
import type { GetWafLogsDto, WafStatsDto } from '../../../shared/dto/waf.dto';

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
}

