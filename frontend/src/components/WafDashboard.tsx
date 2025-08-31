import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { Grid } from '@mui/material';
import { Dashboard, BugReport } from '@mui/icons-material';
import { useWafLogsStore } from '../stores/wafLogsStore';
import { wafLogsApi } from '../lib/api';
import WafLogsTable from './WafLogsTable';
import WafStatsCards from './WafStatsCards';
import { SecurityTestPanel } from './SecurityTestPanel';
import RawAuditLogViewer from './RawAuditLogViewer';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const WafDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  const {
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

  // 탭 변경 핸들러
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          🛡️ WAF 보안 대시보드
        </Typography>
        {tabValue === 0 && (
          <Button
            variant="outlined"
            onClick={handleSeedData}
            disabled={isLoading}
          >
            더미 데이터 생성
          </Button>
        )}
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            icon={<Dashboard />} 
            label="대시보드" 
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab 
            icon={<BugReport />} 
            label="보안 테스트" 
            id="tab-1"
            aria-controls="tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* 대시보드 탭 */}
      <TabPanel value={tabValue} index={0}>
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
          <Grid item xs={12}>
            <RawAuditLogViewer />
          </Grid>
        </Grid>
      </TabPanel>

      {/* 보안 테스트 탭 */}
      <TabPanel value={tabValue} index={1}>
        <SecurityTestPanel onTestComplete={() => {
          fetchLogs();
          fetchStats();
        }} />
      </TabPanel>
    </Container>
  );
};

export default WafDashboard;

