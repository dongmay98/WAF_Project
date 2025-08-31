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
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// WAF Logs API
export const wafLogsApi = {
  getLogs: (params: GetWafLogsDto) => 
    api.get('/api/waf-logs', { params }),
  
  getLogById: (id: string) => 
    api.get(`/api/waf-logs/${id}`),
  
  getStats: (params: WafStatsDto) => 
    api.get('/api/waf-logs/stats', { params }),
  
  seedDummyData: () => 
    api.post('/api/waf-logs/seed'),

  // 보안 테스트 API
  testSqlInjection: (target?: string) => 
    api.post('/api/waf-logs/test/sql-injection', { target }),
  
  testXss: (target?: string) => 
    api.post('/api/waf-logs/test/xss', { target }),
  
  testCommandInjection: (target?: string) => 
    api.post('/api/waf-logs/test/command-injection', { target }),
  
  testDirectoryTraversal: (target?: string) => 
    api.post('/api/waf-logs/test/directory-traversal', { target }),
  
  testAllAttacks: (target?: string, count?: number) => 
    api.post('/api/waf-logs/test/all-attacks', { target, count }),

  // 원본 감사 로그 조회
  getRawAudit: (limit = 200) =>
    api.get('/api/waf-logs/raw', { params: { limit } }),
};

