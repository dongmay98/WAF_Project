import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const authApi = {
  // Google OAuth 로그인 시작
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // 사용자 프로필 조회
  getProfile: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // 토큰 검증
  verifyToken: async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Invalid token');
    }
  },
};
