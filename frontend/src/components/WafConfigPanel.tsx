import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Slider,
  Chip,
  Button,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Security, Save, Info } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface WafConfig {
  paranoia_level: number;
  blocking_mode: boolean;
  custom_rules: string[];
  updated_at?: string;
}

interface SubscriptionInfo {
  plan: string;
  limits: {
    requests_per_month: number;
    logs_per_month: number;
    custom_rules: number;
  };
}

export const WafConfigPanel: React.FC = () => {
  const { user } = useAuthStore();
  const [wafConfig, setWafConfig] = useState<WafConfig>({
    paranoia_level: 1,
    blocking_mode: true,
    custom_rules: [],
  });
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newRule, setNewRule] = useState('');

  const paranoiaLevels = [
    { value: 1, label: '낮음 (기본)', description: '기본적인 공격만 차단' },
    { value: 2, label: '보통', description: '일반적인 웹 공격 차단' },
    { value: 3, label: '높음', description: '고급 공격 패턴까지 차단' },
    { value: 4, label: '최고', description: '모든 의심스러운 요청 차단 (오탐 가능)' },
  ];

  useEffect(() => {
    fetchWafConfig();
    fetchSubscriptionInfo();
  }, []);

  const fetchWafConfig = async () => {
    try {
      const response = await api.get('/api/tenant/config');
      setWafConfig(response.data.waf_config);
    } catch (error) {
      console.error('WAF 설정 조회 실패:', error);
      toast.error('WAF 설정을 불러오는데 실패했습니다.');
    }
  };

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await api.get('/api/tenant/subscription');
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('구독 정보 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await api.put('/api/tenant/config', wafConfig);
      toast.success('WAF 설정이 성공적으로 저장되었습니다.');
      fetchWafConfig(); // 최신 정보 다시 로드
    } catch (error: any) {
      console.error('WAF 설정 저장 실패:', error);
      const message = error.response?.data?.message || 'WAF 설정 저장에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomRule = () => {
    if (!newRule.trim()) return;
    
    if (subscription && wafConfig.custom_rules.length >= subscription.limits.custom_rules) {
      toast.error(`커스텀 룰은 최대 ${subscription.limits.custom_rules}개까지 허용됩니다.`);
      return;
    }

    setWafConfig(prev => ({
      ...prev,
      custom_rules: [...prev.custom_rules, newRule.trim()],
    }));
    setNewRule('');
  };

  const handleRemoveCustomRule = (index: number) => {
    setWafConfig(prev => ({
      ...prev,
      custom_rules: prev.custom_rules.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>WAF 설정을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security />
        WAF 보안 설정
      </Typography>
      
      <Grid container spacing={3}>
        {/* 기본 설정 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              기본 보안 설정
            </Typography>
            
            <FormGroup sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={wafConfig.blocking_mode}
                    onChange={(e) => setWafConfig(prev => ({
                      ...prev,
                      blocking_mode: e.target.checked
                    }))}
                  />
                }
                label="차단 모드 활성화"
              />
              <Typography variant="caption" color="text.secondary">
                비활성화시 모니터링만 수행하고 실제 차단은 하지 않습니다.
              </Typography>
            </FormGroup>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <FormLabel>보안 수준 (Paranoia Level)</FormLabel>
              <Box sx={{ px: 2, py: 1 }}>
                <Slider
                  value={wafConfig.paranoia_level}
                  onChange={(_, value) => setWafConfig(prev => ({
                    ...prev,
                    paranoia_level: value as number
                  }))}
                  min={1}
                  max={4}
                  step={1}
                  marks={paranoiaLevels.map(level => ({
                    value: level.value,
                    label: level.value.toString()
                  }))}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  현재 수준: {paranoiaLevels[wafConfig.paranoia_level - 1]?.label}<br/>
                  {paranoiaLevels[wafConfig.paranoia_level - 1]?.description}
                </Typography>
              </Alert>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveConfig}
              disabled={isSaving}
              fullWidth
            >
              {isSaving ? '저장 중...' : '설정 저장'}
            </Button>
          </Paper>
        </Grid>

        {/* 커스텀 룰 설정 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              커스텀 보안 룰
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption">
                구독 플랜: {subscription?.plan?.toUpperCase()}<br/>
                허용된 커스텀 룰: {wafConfig.custom_rules.length}/{subscription?.limits.custom_rules}
              </Typography>
            </Alert>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="새 보안 룰 추가"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="예: ^/admin/ (관리자 경로 차단)"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomRule()}
                helperText="정규 표현식 형태로 차단할 패턴을 입력하세요"
              />
              <Button 
                variant="outlined" 
                onClick={handleAddCustomRule}
                sx={{ mt: 1 }}
                disabled={!newRule.trim() || (subscription && wafConfig.custom_rules.length >= subscription.limits.custom_rules)}
              >
                룰 추가
              </Button>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              활성 커스텀 룰:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: '40px' }}>
              {wafConfig.custom_rules.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  설정된 커스텀 룰이 없습니다.
                </Typography>
              ) : (
                wafConfig.custom_rules.map((rule, index) => (
                  <Chip
                    key={index}
                    label={rule}
                    onDelete={() => handleRemoveCustomRule(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* 구독 정보 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                구독 정보 및 한도
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">현재 플랜</Typography>
                  <Chip label={subscription?.plan?.toUpperCase() || 'FREE'} color="primary" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">월간 요청 한도</Typography>
                  <Typography variant="body1">
                    {subscription?.limits.requests_per_month?.toLocaleString() || '1,000'} 건
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2">커스텀 룰 한도</Typography>
                  <Typography variant="body1">
                    {subscription?.limits.custom_rules || 5} 개
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
