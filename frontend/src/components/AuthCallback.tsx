import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types/auth.types';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  role: string;
  tenant: any;
  iat: number;
  exp: number;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      try {
        const payload = jwtDecode<JwtPayload>(token);
        const user: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.email,
          picture: payload.picture || '',
          role: payload.role || 'user',
          tenant: payload.tenant,
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
