import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

class GenerateRuleDto {
  description!: string;
  appContext?: string;
  ruleType?: 'block' | 'allow' | 'exclude' | 'tune';
}

@ApiTags('AI')
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('modsecurity/rule')
  @ApiOperation({ summary: 'Groq로 ModSecurity/CRS 커스텀 룰 생성' })
  @ApiResponse({ status: 200, description: '룰과 설명 반환' })
  async generateRule(@Body() body: GenerateRuleDto) {
    const { description, appContext, ruleType } = body;
    return this.aiService.generateModsecRule({ description, appContext, ruleType });
  }
}


