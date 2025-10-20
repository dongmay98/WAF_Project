import axios from 'axios';
import type { GetWafLogsDto, WafStatsDto } from '../types/waf.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {

  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const token = parsed.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to parse auth token:', error);
    }
  }
  return config;
});

// WAF Logs API
export const wafLogsApi = {
  getLogs: (params: GetWafLogsDto) => 
    api.get('/custom/security-logs', { params }),
  
  getLogById: (id: string) => 
    api.get(`/custom/security-logs/${id}`),
  
  getStats: (params: WafStatsDto) => 
    api.get('/custom/security-logs/stats', { params }),
  
  seedDummyData: () => 
    api.post('/custom/security-logs/seed'),

  // 보안 테스트 API
  testSqlInjection: (target?: string) => 
    api.post('/custom/security-logs/test/sql-injection', { target }),
  
  testXss: (target?: string) => 
    api.post('/custom/security-logs/test/xss', { target }),
  
  testCommandInjection: (target?: string) => 
    api.post('/custom/security-logs/test/command-injection', { target }),
  
  testDirectoryTraversal: (target?: string) => 
    api.post('/custom/security-logs/test/directory-traversal', { target }),
  
  testFileUpload: (target?: string) => 
    api.post('/custom/security-logs/test/file-upload', { target }),
  
  testAllAttacks: (target?: string, count?: number) => 
    api.post('/custom/security-logs/test/all-attacks', { target, count }),

  // 실제 트래픽 생성
  generateRealTraffic: (count?: number) => 
    api.post('/custom/security-logs/generate-real-traffic', { count }),
  
  // 실제 WAF 트래픽 생성 (ModSecurity 로그 생성)
  generateWafTraffic: (count?: number) => 
    api.post('/custom/security-logs/generate-waf-traffic', { count }),

  // 원본 감사 로그 조회
  getRawAudit: (limit = 200) =>
    api.get('/custom/security-logs/raw', { params: { limit } }),
};

