import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Avatar,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const { googleLogin } = useAuthStore();

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <GoogleIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            WAF Dashboard 로그인
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Google 계정으로 로그인하여 WAF 대시보드에 접근하세요.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={googleLogin}
            sx={{ mt: 3, mb: 2 }}
          >
            Google로 로그인
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
