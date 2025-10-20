import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface TrafficGenerationResult {
  success: boolean;
  totalRequests: number;
  normalRequests: number;
  maliciousRequests: number;
  details: Array<{
    type: 'normal' | 'malicious';
    url: string;
    method: string;
    status: number;
    blocked?: boolean;
  }>;
}

@Injectable()
export class TrafficGeneratorService {
  private readonly logger = new Logger(TrafficGeneratorService.name);
  private readonly targetHost = process.env.WAF_TARGET || 'http://crs-nginx:8080';

  /**
   * 실제 WAF 트래픽을 생성하여 ModSecurity 로그를 발생시킵니다
   */
  async generateRealWafTraffic(count: number = 20): Promise<TrafficGenerationResult> {
    const results: TrafficGenerationResult['details'] = [];
    const normalCount = Math.floor(count * 0.7); // 70% 정상 트래픽
    const maliciousCount = count - normalCount; // 30% 악성 트래픽

    this.logger.log(`Generating ${count} requests (${normalCount} normal, ${maliciousCount} malicious)`);

    try {
      // 정상 트래픽 생성
      for (let i = 0; i < normalCount; i++) {
        const result = await this.generateNormalRequest();
        results.push(result);
        await this.sleep(100); // 100ms 대기
      }

      // 악성 트래픽 생성 (실제로 차단될 수 있음)
      for (let i = 0; i < maliciousCount; i++) {
        const result = await this.generateMaliciousRequest();
        results.push(result);
        await this.sleep(200); // 200ms 대기
      }

      return {
        success: true,
        totalRequests: count,
        normalRequests: normalCount,
        maliciousRequests: maliciousCount,
        details: results,
      };

    } catch (error) {
      this.logger.error(`Traffic generation failed: ${error.message}`);
      return {
        success: false,
        totalRequests: 0,
        normalRequests: 0,
        maliciousRequests: 0,
        details: results,
      };
    }
  }

  /**
   * 정상적인 웹 요청 생성
   */
  private async generateNormalRequest(): Promise<TrafficGenerationResult['details'][0]> {
    const paths = [
      '/',
      '/index.html',
      '/about',
      '/contact',
      '/products',
      '/services',
      '/api/health',
      '/assets/style.css',
      '/assets/script.js',
      '/images/logo.png',
    ];

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    ];

    const path = paths[Math.floor(Math.random() * paths.length)];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const url = `${this.targetHost}${path}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 5000,
        validateStatus: () => true, // 모든 응답 코드를 성공으로 처리
      });

      return {
        type: 'normal',
        url,
        method: 'GET',
        status: response.status,
        blocked: response.status === 403 || response.status === 406,
      };

    } catch (error) {
      return {
        type: 'normal',
        url,
        method: 'GET',
        status: 0,
        blocked: true,
      };
    }
  }

  /**
   * 악성 요청 생성 (실제로 WAF에서 차단될 수 있음)
   */
  private async generateMaliciousRequest(): Promise<TrafficGenerationResult['details'][0]> {
    const attacks = [
      // SQL Injection
      { path: '/?id=1\' OR \'1\'=\'1', type: 'SQL Injection' },
      { path: '/search?q=admin\'--', type: 'SQL Injection' },
      { path: '/login?username=1\' UNION SELECT password FROM users--', type: 'SQL Injection' },
      
      // XSS
      { path: '/?search=<script>alert(\'xss\')</script>', type: 'XSS' },
      { path: '/comment?text=<img src=x onerror=alert(1)>', type: 'XSS' },
      { path: '/?name=<svg onload=alert(\'XSS\')>', type: 'XSS' },
      
      // Command Injection
      { path: '/?cmd=ls -la; cat /etc/passwd', type: 'Command Injection' },
      { path: '/ping?host=127.0.0.1; rm -rf /', type: 'Command Injection' },
      
      // Directory Traversal
      { path: '/file?name=../../../etc/passwd', type: 'Directory Traversal' },
      { path: '/download?file=....//....//etc/shadow', type: 'Directory Traversal' },
    ];

    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    const url = `${this.targetHost}${attack.path}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'AttackBot/1.0 (Malicious Scanner)',
          'Accept': '*/*',
        },
        timeout: 5000,
        validateStatus: () => true, // 모든 응답 코드를 성공으로 처리
      });

      return {
        type: 'malicious',
        url,
        method: 'GET',
        status: response.status,
        blocked: response.status === 403 || response.status === 406,
      };

    } catch (error) {
      return {
        type: 'malicious',
        url,
        method: 'GET',
        status: 0,
        blocked: true,
      };
    }
  }

  /**
   * 지정된 시간만큼 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 특정 테넌트를 위한 트래픽 생성 (향후 구현)
   */
  async generateTrafficForTenant(tenantId: string, count: number): Promise<TrafficGenerationResult> {
    // 향후 구현: 특정 테넌트를 위한 트래픽 생성
    // 현재는 일반 트래픽 생성으로 대체
    return this.generateRealWafTraffic(count);
  }
}
