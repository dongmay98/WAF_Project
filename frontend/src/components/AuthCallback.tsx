import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuthStore } from '../stores/authStore';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // 토큰을 디코드하여 사용자 정보 추출 (JWT 토큰에서)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.email,
          picture: payload.picture || '',
          role: payload.role || 'user',
        };
        
        login(token, user);
        navigate('/dashboard');
      } catch (error) {
        console.error('Token parsing error:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        로그인 처리 중...
      </Typography>
    </Box>
  );
};

export default AuthCallback;
