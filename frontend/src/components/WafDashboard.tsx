import React, { useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
} from '@mui/material';
import {
  Security,
  Block,
  Timeline,
  Warning,
} from '@mui/icons-material';
import { useWafLogsStore } from '../stores/wafLogsStore';
import { wafLogsApi } from '../lib/api';
import WafLogsTable from './WafLogsTable';
import WafStatsCards from './WafStatsCards';
import toast from 'react-hot-toast';

const WafDashboard: React.FC = () => {
  const {
    logs,
    stats,
    isLoading,
    isLoadingStats,
    filters,
    pagination,
    setLogs,
    setStats,
    setLoading,
    setLoadingStats,
    setPagination,
  } = useWafLogsStore();

  // WAF 로그 불러오기
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await wafLogsApi.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch WAF logs:', error);
      toast.error('WAF 로그 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // WAF 통계 불러오기
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await wafLogsApi.getStats(filters);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch WAF stats:', error);
      toast.error('WAF 통계 조회에 실패했습니다.');
    } finally {
      setLoadingStats(false);
    }
  };

  // 더미 데이터 생성
  const handleSeedData = async () => {
    try {
      await wafLogsApi.seedDummyData();
      toast.success('더미 데이터가 생성되었습니다.');
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error('Failed to seed dummy data:', error);
      toast.error('더미 데이터 생성에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [pagination.page, pagination.limit, filters]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          🛡️ WAF 로그 대시보드
        </Typography>
        <Button
          variant="outlined"
          onClick={handleSeedData}
          disabled={isLoading}
        >
          더미 데이터 생성
        </Button>
      </Box>

      {/* 통계 카드들 */}
      <WafStatsCards stats={stats} isLoading={isLoadingStats} />

      {/* WAF 로그 테이블 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              최근 WAF 로그
            </Typography>
            <WafLogsTable />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WafDashboard;
