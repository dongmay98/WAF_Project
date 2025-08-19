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
};

