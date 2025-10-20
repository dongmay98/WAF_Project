import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Security,
  Block,
  Timeline,
  BusinessCenter,
  DataUsage,
} from '@mui/icons-material';
import type { WafDashboardStats } from '../types/waf.types';
import { useAuthStore } from '../stores/authStore';

interface WafStatsCardsProps {
  stats: WafDashboardStats | null;
  isLoading: boolean;
}

const WafStatsCards: React.FC<WafStatsCardsProps> = ({ stats, isLoading }) => {
  const { user } = useAuthStore();
  
  if (isLoading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          // @ts-ignore
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" height={100}>
                  <CircularProgress />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!stats) {
    return null;
  }

  const totalRequests = stats.totalRequests || 0;
  const blockedRequests = stats.blockedRequests || 0;
  
  const blockRate = totalRequests > 0 
    ? ((blockedRequests / totalRequests) * 100).toFixed(1)
    : '0';

  // 사용량 계산 (이번 달 기준)
  const monthlyUsage = user?.tenant?.subscription?.limits?.logs_per_month || 0;
  const usageRate = monthlyUsage > 0 
    ? Math.min(((totalRequests / monthlyUsage) * 100), 100).toFixed(1)
    : '0';

  const statCards = [
    {
      title: '총 요청',
      value: totalRequests.toLocaleString(),
      icon: <Timeline color="primary" />,
      color: 'primary.main',
    },
    {
      title: '차단된 요청',
      value: blockedRequests.toLocaleString(),
      icon: <Block color="error" />,
      color: 'error.main',
    },
    {
      title: '차단률',
      value: `${blockRate}%`,
      icon: <Security color="warning" />,
      color: 'warning.main',
    },
    // 테넌트별 사용량
    ...(user?.tenant ? [{
      title: '월 사용량',
      value: `${usageRate}%`,
      icon: <DataUsage color="info" />,
      color: parseFloat(usageRate) > 80 ? 'error.main' : 'info.main',
    }] : []),
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((card, index) => (
        // @ts-ignore
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {card.title}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ color: card.color }}>
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* 테넌트 구독 정보 */}
      {user?.tenant && (
        // @ts-ignore
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessCenter />
                구독 정보
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  회사: {user.tenant?.name || '조직'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  플랜: {user.tenant?.subscription?.plan?.toUpperCase() || 'FREE'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  월 요청 한도: {(user.tenant?.subscription?.limits?.logs_per_month || 0).toLocaleString()}개
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  엔드포인트: {user.tenant?.subscription?.limits?.endpoints || 1}개
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  커스텀 룰: {user.tenant?.subscription?.limits?.custom_rules || 0}개
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* 상위 차단된 IP들 */}
      {/* @ts-ignore */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              상위 차단된 IP
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {stats.topBlockedIps.slice(0, 5).map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.ip} (${item.count})`}
                  variant="outlined"
                  color="error"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* 상위 차단 룰들 */}
      {/* @ts-ignore */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              상위 차단 룰
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {stats.topBlockedRules.slice(0, 5).map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.ruleId} (${item.count})`}
                  variant="outlined"
                  color="warning"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default WafStatsCards;

