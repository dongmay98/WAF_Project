import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 관리자 전용 API 클라이언트
const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 관리자 토큰 자동 포함
adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 토큰 만료 시 로그아웃 처리
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // 관리자 인증
  async login(username: string, password: string) {
    const response = await adminApiClient.post('/admin/login', {
      username,
      password,
    });
    return response.data;
  },

  async createDefaultAdmin() {
    const response = await adminApiClient.post('/admin/create-default');
    return response.data;
  },

  // 관리자 모니터링
  async getDashboard() {
    const response = await adminApiClient.get('/admin/monitoring/dashboard');
    return response.data;
  },

  async getAllUsers(page = 1, limit = 20) {
    const response = await adminApiClient.get('/admin/monitoring/users', {
      params: { page, limit },
    });
    return response.data;
  },

  async getAllTenants() {
    const response = await adminApiClient.get('/admin/monitoring/tenants');
    return response.data;
  },

  async getAllWafLogs(params?: any) {
    const response = await adminApiClient.get('/admin/monitoring/waf-logs', {
      params,
    });
    return response.data;
  },

  async getSystemHealth() {
    const response = await adminApiClient.get('/admin/monitoring/system-health');
    return response.data;
  },
};

export default adminApi;
