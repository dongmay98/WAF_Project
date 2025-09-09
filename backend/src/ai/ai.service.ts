import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

interface GenerateRuleParams {
  description: string; // 사용자가 원하는 차단/허용 의도 설명
  appContext?: string; // 엔드포인트, 파라미터 맥락
  ruleType?: 'block' | 'allow' | 'exclude' | 'tune';
}

@Injectable()
export class AiService {
  private readonly client?: Groq;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.client = new Groq({ apiKey });
    }
  }

  async generateModsecRule(params: GenerateRuleParams): Promise<{ rule: string; explanation: string }>{
    if (!this.client) {
      throw new UnauthorizedException('GROQ_API_KEY 미설정. 환경변수 설정 필요.');
    }

    const model = this.config.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';

    const systemPrompt = [
      'You are a senior ModSecurity and OWASP CRS rule engineer.',
      'Return only safe ModSecurity rule(s) and a concise explanation.',
      'Follow best practices: anomaly-scoring where applicable, correct phases, tags, ids, and msg.',
      'Avoid overblocking, propose targeted exclusions when asked.',
      'Never include secrets or credentials.',
    ].join(' ');

    const userPrompt = [
      `Goal: ${params.ruleType || 'tune'} rule for: ${params.description}`,
      params.appContext ? `Context: ${params.appContext}` : '',
      'Output JSON with fields: rule (string), explanation (string).',
      'ModSecurity syntax only; one or multiple SecRule lines as needed.',
    ].filter(Boolean).join('\n');

    const completion = await this.client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { rule: content, explanation: 'Model returned non-JSON; verify syntax.' };
    }

    const rule = String(parsed.rule || '').trim();
    const explanation = String(parsed.explanation || '').trim();

    return { rule, explanation };
  }
}


