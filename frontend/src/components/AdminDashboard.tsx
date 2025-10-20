import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  AdminPanelSettings,
  Logout,
  People,
  Business,
  Security,
  Memory,
  Speed,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/adminApi';
import toast from 'react-hot-toast';

interface AdminDashboardData {
  systemStats: {
    totalUsers: number;
    totalTenants: number;
    activeUsers: number;
    systemUptime: number;
  };
  wafStats: any;
  tenantUsage: any[];
}

interface SystemHealth {
  uptime: number;
  memory: {
    used: string;
    total: string;
    external: string;
  };
  cpu: {
    user: number;
    system: number;
  };
  nodeVersion: string;
  platform: string;
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, health, usersData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getSystemHealth(),
        adminApi.getAllUsers(1, 10),
      ]);

      setDashboardData(dashboard);
      setSystemHealth(health);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('대시보드 데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const handleCreateAdmin = async () => {
    try {
      await adminApi.createDefaultAdmin();
      toast.success('기본 관리자 계정이 생성되었습니다');
    } catch (error) {
      toast.error('계정 생성 실패');
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* 관리자 Header */}
      <AppBar position="static" color="secondary">
        <Toolbar>
          <AdminPanelSettings sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WAF 관리자 대시보드
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {adminUser.username}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* 액션 버튼 */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AdminPanelSettings />}
            onClick={handleCreateAdmin}
          >
            기본 관리자 계정 생성
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
          >
            새로고침
          </Button>
        </Box>

        {/* 시스템 통계 카드 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      총 사용자
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData?.systemStats.totalUsers || 0}
                    </Typography>
                  </Box>
                  <People color="primary" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      총 테넌트
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData?.systemStats.totalTenants || 0}
                    </Typography>
                  </Box>
                  <Business color="secondary" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      활성 사용자
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData?.systemStats.activeUsers || 0}
                    </Typography>
                  </Box>
                  <Security color="success" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      시스템 업타임
                    </Typography>
                    <Typography variant="h6">
                      {systemHealth ? Math.floor(systemHealth.uptime / 3600)+'h' : '0h'}
                    </Typography>
                  </Box>
                  <Speed color="info" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* WAF 통계 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                WAF 통계
              </Typography>
              <Box>
                <Typography variant="body2">
                  총 요청: {dashboardData?.wafStats?.totalRequests || 0}
                </Typography>
                <Typography variant="body2">
                  차단된 요청: {dashboardData?.wafStats?.blockedRequests || 0}
                </Typography>
                <Typography variant="body2">
                  차단률: {
                    dashboardData?.wafStats?.totalRequests > 0
                      ? ((dashboardData.wafStats.blockedRequests / dashboardData.wafStats.totalRequests) * 100).toFixed(1)
                      : 0
                  }%
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* 시스템 상태 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Memory />
                시스템 상태
              </Typography>
              {systemHealth && (
                <Box>
                  <Typography variant="body2">
                    메모리 사용량: {systemHealth.memory.used} / {systemHealth.memory.total}
                  </Typography>
                  <Typography variant="body2">
                    Node.js: {systemHealth.nodeVersion}
                  </Typography>
                  <Typography variant="body2">
                    플랫폼: {systemHealth.platform}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* 최근 사용자 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                최근 사용자 ({users.length})
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>이름</TableCell>
                      <TableCell>이메일</TableCell>
                      <TableCell>역할</TableCell>
                      <TableCell>테넌트</TableCell>
                      <TableCell>마지막 로그인</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={user.role === 'admin' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{user.tenant?.name || '없음'}</TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : '없음'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default AdminDashboard;
