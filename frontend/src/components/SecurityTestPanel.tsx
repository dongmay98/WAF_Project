import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
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

export const SecurityTestPanel: React.FC = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult | AllAttacksResult>>({});
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
    } catch (error) {
      toast.error('전체 공격 테스트 실패');
      console.error(error);
    } finally {
      setTestLoading('all', false);
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
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">총 테스트</Typography>
            <Typography variant="h4">{result.totalTests}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">차단된 공격</Typography>
            <Typography variant="h4" color="success.main">{result.totalBlocked}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body2" color="text.secondary">차단율</Typography>
            <Typography variant="h4" color="primary.main">{result.blockingRate}</Typography>
          </Grid>
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

        {/* 전체 테스트 */}
        <Grid item xs={12}>
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

