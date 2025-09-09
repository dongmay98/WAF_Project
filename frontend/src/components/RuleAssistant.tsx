import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Stack, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { aiApi } from '../lib/api';
import toast from 'react-hot-toast';

type RuleType = 'block' | 'allow' | 'exclude' | 'tune';

const RuleAssistant: React.FC = () => {
  const [description, setDescription] = useState('특정 엔드포인트 /api/search 의 파라미터 q 에 대한 XSS 완화');
  const [appContext, setAppContext] = useState('URI: /api/search, Param: q, Method: GET');
  const [ruleType, setRuleType] = useState<RuleType>('tune');
  const [loading, setLoading] = useState(false);
  const [rule, setRule] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setRule('');
      setExplanation('');
      const res = await aiApi.generateRule({ description, appContext, ruleType });
      const data = res.data as { rule?: string; explanation?: string };
      setRule((data.rule || '').trim());
      setExplanation((data.explanation || '').trim());
      toast.success('룰이 생성되었습니다.');
    } catch (err: any) {
      console.error(err);
      toast.error('룰 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rule);
      toast.success('복사되었습니다.');
    } catch {
      toast.error('복사 실패');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([rule + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modsecurity-custom-rule.conf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Groq 기반 커스텀 룰 생성기
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="의도/요구사항 설명"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: /api/search 의 q 파라미터에서 XSS 탐지 과잉을 줄이고 합법적 검색어 허용"
          />
          <TextField
            label="앱 컨텍스트 (URI/Param/Method 등)"
            fullWidth
            value={appContext}
            onChange={(e) => setAppContext(e.target.value)}
            placeholder="예: URI: /api/search, Param: q, Method: GET"
          />
          <TextField
            select
            label="룰 타입"
            fullWidth
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as RuleType)}
          >
            <MenuItem value="tune">정밀 조정 (tune)</MenuItem>
            <MenuItem value="exclude">예외(문맥별) 추가 (exclude)</MenuItem>
            <MenuItem value="block">차단 룰 (block)</MenuItem>
            <MenuItem value="allow">허용 룰 (allow)</MenuItem>
          </TextField>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleGenerate} disabled={loading}>
              {loading ? '생성 중...' : '룰 생성'}
            </Button>
            <Button startIcon={<ContentCopyIcon />} onClick={handleCopy} disabled={!rule}>
              복사
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={handleDownload} disabled={!rule}>
              파일로 저장
            </Button>
          </Stack>
          <Alert severity="info">
            생성된 룰은 검토 후 `REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf` 또는 별도 튜닝 파일에 반영하세요.
          </Alert>
        </Stack>
      </Paper>

      {rule && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            제안된 ModSecurity 룰
          </Typography>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{rule}</pre>
        </Paper>
      )}

      {explanation && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            설명
          </Typography>
          <Typography variant="body2" color="text.secondary">{explanation}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default RuleAssistant;


