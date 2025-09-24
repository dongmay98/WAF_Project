import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
// Fallback: use standard Grid API
import { Grid } from '@mui/material';
import {
  Security,
  BugReport,
  Code,
  FolderOpen,
  PlayArrow,
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  Traffic,
} from '@mui/icons-material';
import { wafLogsApi } from '../lib/api';
import toast from 'react-hot-toast';

interface TestResult {
  attackType: string;
  target: string;
  totalTests: number;
  blockedCount: number;
  results: Array<{
    payload: string;
    status: number | string;
    blocked: boolean;
    logId?: string;
    error?: string;
  }>;
}

interface AllAttacksResult {
  target: string;
  rounds: number;
  totalTests: number;
  totalBlocked: number;
  blockingRate: string;
  results: Array<{
    round: number;
    sqlInjection: TestResult;
    xss: TestResult;
    commandInjection: TestResult;
    directoryTraversal: TestResult;
  }>;
}

interface TrafficResult {
  total_requests: number;
  successful_requests: number;
  blocked_requests: number;
  error_requests: number;
  details: Array<{
    path: string;
    method: string;
    status: number;
    blocked: boolean;
    error?: string;
  }>;
}

interface WafTrafficResult {
  success: boolean;
  message: string;
  details: {
    success: boolean;
    totalRequests: number;
    normalRequests: number;
    maliciousRequests: number;
    details: Array<{
      type: 'normal' | 'malicious';
      url: string;
      method: string;
      status: number;
      blocked?: boolean;
    }>;
  };
}

interface SecurityTestPanelProps {
  onTestComplete?: () => void;
}

export const SecurityTestPanel: React.FC<SecurityTestPanelProps> = ({ onTestComplete }) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult | AllAttacksResult | TrafficResult>>({});
  const [target, setTarget] = useState('http://localhost:8080');

  const setTestLoading = (testType: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [testType]: isLoading }));
  };

  const runSqlInjectionTest = async () => {
    setTestLoading('sql', true);
    try {
      const response = await wafLogsApi.testSqlInjection(target);
      setResults(prev => ({ ...prev, sql: response.data }));
      toast.success(`SQL Injection 테스트 완료: ${response.data.blockedCount}/${response.data.totalTests} 차단`);
      onTestComplete?.();
    } catch (error) {
      toast.error('SQL Injection 테스트 실패');
      console.error(error);
    } finally {
      setTestLoading('sql', false);
    }
  };

  const runXssTest = async () => {
    setTestLoading('xss', true);
    try {
      const response = await wafLogsApi.testXss(target);
      setResults(prev => ({ ...prev, xss: response.data }));
      toast.success(`XSS 테스트 완료: ${response.data.blockedCount}/${response.data.totalTests} 차단`);
      onTestComplete?.();
    } catch (error) {
      toast.error('XSS 테스트 실패');
      console.error(error);
    } finally {
      setTestLoading('xss', false);
    }
  };

  const runCommandInjectionTest = async () => {
    setTestLoading('cmd', true);
    try {
      const response = await wafLogsApi.testCommandInjection(target);
      setResults(prev => ({ ...prev, cmd: response.data }));
      toast.success(`Command Injection 테스트 완료: ${response.data.blockedCount}/${response.data.totalTests} 차단`);
      onTestComplete?.();
    } catch (error) {
      toast.error('Command Injection 테스트 실패');
      console.error(error);
    } finally {
      setTestLoading('cmd', false);
    }
  };

  const runDirectoryTraversalTest = async () => {
    setTestLoading('traversal', true);
    try {
      const response = await wafLogsApi.testDirectoryTraversal(target);
      setResults(prev => ({ ...prev, traversal: response.data }));
      toast.success(`Directory Traversal 테스트 완료: ${response.data.blockedCount}/${response.data.totalTests} 차단`);
      onTestComplete?.();
    } catch (error) {
      toast.error('Directory Traversal 테스트 실패');
      console.error(error);
    } finally {
      setTestLoading('traversal', false);
    }
  };

  const runAllAttacksTest = async () => {
    setTestLoading('all', true);
    try {
      const response = await wafLogsApi.testAllAttacks(target, 1);
      setResults(prev => ({ ...prev, all: response.data }));
      toast.success(`전체 공격 테스트 완료: 차단율 ${response.data.blockingRate}`);
      onTestComplete?.();
    } catch (error) {
      toast.error('전체 공격 테스트 실패');
      console.error(error);
    } finally {
      setTestLoading('all', false);
    }
  };

  const runRealTrafficTest = async () => {
    setTestLoading('realTraffic', true);
    try {
      const response = await wafLogsApi.generateRealTraffic(50);
      setResults(prev => ({ ...prev, realTraffic: response.data }));
      toast.success(`실제 트래픽 생성 완료: ${response.data.total_requests}개 요청, ${response.data.blocked_requests}개 차단`);
      onTestComplete?.();
    } catch (error) {
      toast.error('실제 트래픽 생성 실패');
      console.error(error);
    } finally {
      setTestLoading('realTraffic', false);
    }
  };

  const runWafTrafficTest = async () => {
    setTestLoading('wafTraffic', true);
    try {
      const response = await wafLogsApi.generateWafTraffic(20);
      setResults(prev => ({ ...prev, wafTraffic: response.data }));
      toast.success(response.data.message || 'WAF 트래픽이 성공적으로 생성되었습니다!');
      onTestComplete?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'WAF 트래픽 생성에 실패했습니다.');
      console.error(error);
    } finally {
      setTestLoading('wafTraffic', false);
    }
  };

  const renderTestResult = (result: TestResult) => (
    <Accordion key={result.attackType}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1">{result.attackType}</Typography>
          <Chip 
            label={`${result.blockedCount}/${result.totalTests} 차단`}
            color={result.blockedCount === result.totalTests ? 'success' : 'warning'}
            size="small"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {result.results.map((item, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={item.payload}
                secondary={`Status: ${item.status} | ${item.blocked ? '차단됨' : '허용됨'}`}
              />
              {item.blocked ? (
                <CheckCircle color="success" />
              ) : item.error ? (
                <Error color="error" />
              ) : (
                <Warning color="warning" />
              )}
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );

  const renderAllAttacksResult = (result: AllAttacksResult) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          전체 공격 테스트 결과
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">총 테스트</Typography>
            <Typography variant="h4">{result.totalTests}</Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">차단된 공격</Typography>
            <Typography variant="h4" color="success.main">{result.totalBlocked}</Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">차단율</Typography>
            <Typography variant="h4" color="primary.main">{result.blockingRate}</Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">라운드</Typography>
            <Typography variant="h4">{result.rounds}</Typography>
          </Grid>
        </Grid>
        
        {result.results.map((round, index) => (
          <Box key={index} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              라운드 {round.round}
            </Typography>
            {renderTestResult(round.sqlInjection)}
            {renderTestResult(round.xss)}
            {renderTestResult(round.commandInjection)}
            {renderTestResult(round.directoryTraversal)}
            {index < result.results.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  const renderTrafficResult = (result: TrafficResult) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          실제 트래픽 생성 결과
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">총 요청</Typography>
            <Typography variant="h4">{result.total_requests}</Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">성공 요청</Typography>
            <Typography variant="h4" color="success.main">{result.successful_requests}</Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">차단 요청</Typography>
            <Typography variant="h4" color="warning.main">{result.blocked_requests}</Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">에러 요청</Typography>
            <Typography variant="h4" color="error.main">{result.error_requests}</Typography>
          </Grid>
        </Grid>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">상세 요청 내역</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {result.details.slice(0, 20).map((item, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${item.method} ${item.path}`}
                    secondary={`Status: ${item.status} | ${item.blocked ? '차단됨' : '허용됨'}${item.error ? ` | 에러: ${item.error}` : ''}`}
                  />
                  {item.blocked ? (
                    <Warning color="warning" />
                  ) : item.status >= 400 ? (
                    <Error color="error" />
                  ) : (
                    <CheckCircle color="success" />
                  )}
                </ListItem>
              ))}
              {result.details.length > 20 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  ... 및 {result.details.length - 20}개 추가 요청
                </Typography>
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );

  const renderWafTrafficResult = (result: WafTrafficResult) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Traffic />
          실제 WAF 트래픽 생성 결과
        </Typography>
        
        <Alert severity={result.success ? "success" : "error"} sx={{ mb: 2 }}>
          {result.message}
        </Alert>

        {result.success && result.details && (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={3}>
                <Typography variant="h4" color="primary">{result.details.totalRequests}</Typography>
                <Typography variant="caption">총 요청</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4" color="success.main">{result.details.normalRequests}</Typography>
                <Typography variant="caption">정상 요청</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4" color="warning.main">{result.details.maliciousRequests}</Typography>
                <Typography variant="caption">악성 요청</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4" color="error.main">
                  {result.details.details.filter(d => d.blocked).length}
                </Typography>
                <Typography variant="caption">차단됨</Typography>
              </Grid>
            </Grid>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">요청 상세 내역 ({result.details.details.length}개)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {result.details.details.slice(0, 15).map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${item.method} ${item.url}`}
                        secondary={`${item.type.toUpperCase()} | Status: ${item.status} | ${item.blocked ? '차단됨' : '허용됨'}`}
                      />
                      <Chip
                        label={item.type}
                        color={item.type === 'malicious' ? 'warning' : 'success'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {item.blocked ? (
                        <Warning color="warning" />
                      ) : item.status >= 400 ? (
                        <Error color="error" />
                      ) : (
                        <CheckCircle color="success" />
                      )}
                    </ListItem>
                  ))}
                  {result.details.details.length > 15 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      ... 및 {result.details.details.length - 15}개 추가 요청
                    </Typography>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🔒 WAF 보안 테스트
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        실제 WAF에 다양한 공격 패턴을 테스트하여 보안 효과를 검증합니다. 
        테스트 결과는 대시보드 로그에 실시간으로 기록됩니다.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            테스트 설정
          </Typography>
          <TextField
            fullWidth
            label="대상 WAF URL"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="http://localhost:8080"
            sx={{ mb: 2 }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* 개별 테스트 버튼들 */}
        {/* @ts-ignore */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BugReport color="error" />
                <Typography variant="h6">SQL Injection 테스트</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                다양한 SQL Injection 공격 패턴을 테스트합니다.
              </Typography>
              <Button
                variant="contained"
                startIcon={loading.sql ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runSqlInjectionTest}
                disabled={loading.sql}
                fullWidth
              >
                {loading.sql ? '테스트 중...' : 'SQL Injection 테스트 실행'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* @ts-ignore */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Code color="warning" />
                <Typography variant="h6">XSS 테스트</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cross-Site Scripting 공격 패턴을 테스트합니다.
              </Typography>
              <Button
                variant="contained"
                startIcon={loading.xss ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runXssTest}
                disabled={loading.xss}
                fullWidth
              >
                {loading.xss ? '테스트 중...' : 'XSS 테스트 실행'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* @ts-ignore */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Security color="error" />
                <Typography variant="h6">Command Injection 테스트</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                시스템 명령어 주입 공격 패턴을 테스트합니다.
              </Typography>
              <Button
                variant="contained"
                startIcon={loading.cmd ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runCommandInjectionTest}
                disabled={loading.cmd}
                fullWidth
              >
                {loading.cmd ? '테스트 중...' : 'Command Injection 테스트 실행'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* @ts-ignore */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <FolderOpen color="info" />
                <Typography variant="h6">Directory Traversal 테스트</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                디렉토리 순회 공격 패턴을 테스트합니다.
              </Typography>
              <Button
                variant="contained"
                startIcon={loading.traversal ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runDirectoryTraversalTest}
                disabled={loading.traversal}
                fullWidth
              >
                {loading.traversal ? '테스트 중...' : 'Directory Traversal 테스트 실행'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 실제 트래픽 생성 */}
        {/* @ts-ignore */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Traffic />
                <Typography variant="h6">실제 트래픽 생성</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                실제 WAF에 정상/악성 트래픽을 생성하여 실시간 로그를 생성합니다.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={loading.realTraffic ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runRealTrafficTest}
                disabled={loading.realTraffic}
                fullWidth
              >
                {loading.realTraffic ? '트래픽 생성 중...' : '🌐 실제 트래픽 생성'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* WAF 트래픽 생성 */}
        {/* @ts-ignore */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Traffic />
                <Typography variant="h6">실제 WAF 로그 생성</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                실제 WAF에 트래픽을 전송하여 ModSecurity 로그를 생성합니다. (정상 + 악성 트래픽 혼합)
              </Typography>
              <Button
                variant="contained"
                color="inherit"
                startIcon={loading.wafTraffic ? <CircularProgress size={20} /> : <Traffic />}
                onClick={runWafTrafficTest}
                disabled={loading.wafTraffic}
                fullWidth
              >
                {loading.wafTraffic ? 'WAF 트래픽 생성 중...' : '🛡️ WAF 트래픽 생성'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 전체 테스트 */}
        {/* @ts-ignore */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Security />
                <Typography variant="h6">전체 보안 테스트</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                모든 공격 패턴을 한 번에 테스트하여 WAF의 전체적인 보안 효과를 검증합니다.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={loading.all ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runAllAttacksTest}
                disabled={loading.all}
                fullWidth
              >
                {loading.all ? '전체 테스트 실행 중...' : '🚨 전체 보안 테스트 실행'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 테스트 결과 */}
      {Object.keys(results).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            📊 테스트 결과
          </Typography>
          
          {Object.entries(results).map(([testType, result]) => (
            <Box key={testType} sx={{ mb: 3 }}>
              {testType === 'all' ? 
                renderAllAttacksResult(result as AllAttacksResult) :
                testType === 'realTraffic' ?
                renderTrafficResult(result as TrafficResult) :
                testType === 'wafTraffic' ?
                renderWafTrafficResult(result as WafTrafficResult) :
                <Card>
                  <CardContent>
                    {renderTestResult(result as TestResult)}
                  </CardContent>
                </Card>
              }
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

