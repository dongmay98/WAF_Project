import React, { useEffect, useState } from 'react';
import { Card, CardContent, Box, Typography, Button, Select, MenuItem } from '@mui/material';
import { wafLogsApi } from '../lib/api';

interface RawItem { raw: string; parsed?: any }

const RawAuditLogViewer: React.FC = () => {
  const [lines, setLines] = useState<RawItem[]>([]);
  const [limit, setLimit] = useState<number>(200);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await wafLogsApi.getRawAudit(limit);
      setLines(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [limit]);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h6">원본 감사 로그</Typography>
          <Select size="small" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {[50, 100, 200, 500, 1000, 2000].map((n) => (
              <MenuItem key={n} value={n}>{n} lines</MenuItem>
            ))}
          </Select>
          <Button variant="outlined" onClick={load} disabled={loading}>새로고침</Button>
        </Box>
        <Box component="pre" sx={{ bgcolor: '#0b1020', color: '#d6e2ff', p: 2, borderRadius: 1, maxHeight: 500, overflow: 'auto' }}>
          {lines.map((l, i) => (
            <Typography key={i} component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {l.raw}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RawAuditLogViewer;


