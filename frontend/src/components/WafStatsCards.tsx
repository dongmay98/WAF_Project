import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Security,
  Block,
  Timeline,
  Warning,
} from '@mui/icons-material';
import { WafDashboardStats } from '../../shared/types/waf.types';

interface WafStatsCardsProps {
  stats: WafDashboardStats | null;
  isLoading: boolean;
}

const WafStatsCards: React.FC<WafStatsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
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

  const blockRate = stats.totalRequests > 0 
    ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
    : '0';

  const statCards = [
    {
      title: '총 요청',
      value: stats.totalRequests.toLocaleString(),
      icon: <Timeline color="primary" />,
      color: 'primary.main',
    },
    {
      title: '차단된 요청',
      value: stats.blockedRequests.toLocaleString(),
      icon: <Block color="error" />,
      color: 'error.main',
    },
    {
      title: '차단률',
      value: `${blockRate}%`,
      icon: <Security color="warning" />,
      color: 'warning.main',
    },
    {
      title: '공격 유형',
      value: stats.attackTypeDistribution.length.toString(),
      icon: <Warning color="info" />,
      color: 'info.main',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((card, index) => (
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

      {/* 상위 차단된 IP들 */}
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
