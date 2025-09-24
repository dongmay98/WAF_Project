import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface TrafficRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface TrafficResult {
  path: string;
  method: string;
  status: number;
  blocked: boolean;
  error?: string;
}

export interface TrafficSummary {
  total_requests: number;
  successful_requests: number;
  blocked_requests: number;
  error_requests: number;
  details: TrafficResult[];
}

@Injectable()
export class RealDataService {
  private readonly wafUrl = 'http://crs-nginx:8080';

  // 실제 WAF에 대한 다양한 요청 생성
  async generateRealTraffic(count: number = 50): Promise<TrafficSummary> {
    const results: TrafficResult[] = [];
    
    // 정상 트래픽 시뮬레이션
    const normalRequests: TrafficRequest[] = [
      { path: '/', method: 'GET' },
      { path: '/api/health', method: 'GET' },
      { path: '/dashboard', method: 'GET' },
      { path: '/login', method: 'GET' },
      { path: '/api/users', method: 'GET' },
      { path: '/api/products', method: 'GET' },
      { path: '/static/css/main.css', method: 'GET' },
      { path: '/static/js/app.js', method: 'GET' },
    ];

    // 악성 트래픽 시뮬레이션 (실제로 차단될 것들)
    const maliciousRequests: TrafficRequest[] = [
      { path: '/api/search?q=1\' OR 1=1--', method: 'GET' },
      { path: '/api/users?id=<script>alert(1)</script>', method: 'GET' },
      { path: '/api/file?path=../../../etc/passwd', method: 'GET' },
      { path: '/admin.php', method: 'GET' },
      { path: '/wp-admin/', method: 'GET' },
      { path: '/.env', method: 'GET' },
      { path: '/api/cmd?exec=ls -la', method: 'GET' },
    ];

    // 요청 실행
    for (let i = 0; i < count; i++) {
      try {
        // 70% 정상 트래픽, 30% 악성 트래픽
        const requests = Math.random() < 0.7 ? normalRequests : maliciousRequests;
        const request = requests[Math.floor(Math.random() * requests.length)];
        
        const response = await axios({
          method: request.method,
          url: `${this.wafUrl}${request.path}`,
          timeout: 5000,
          validateStatus: () => true, // 모든 상태 코드 허용
        });

        results.push({
          path: request.path,
          method: request.method,
          status: response.status,
          blocked: response.status === 403,
        });

        // 요청 간 간격 (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        results.push({
          path: 'unknown',
          method: 'unknown',
          status: 0,
          blocked: true,
          error: error?.message || 'Unknown error',
        });
      }
    }

    return {
      total_requests: results.length,
      successful_requests: results.filter(r => r.status < 400).length,
      blocked_requests: results.filter(r => r.blocked).length,
      error_requests: results.filter(r => r.status === 0).length,
      details: results,
    };
  }

  // 지속적인 트래픽 생성 (백그라운드)
  async startContinuousTraffic(interval: number = 30000): Promise<void> {
    setInterval(async () => {
      try {
        await this.generateRealTraffic(10);
        console.log('Generated 10 real traffic requests');
      } catch (error: any) {
        console.error('Failed to generate real traffic:', error?.message || error);
      }
    }, interval);
  }
}
