import React, { useState } from 'react';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility,
  Block,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useWafLogsStore } from '../stores/wafLogsStore';
import type { WafLogEntry } from '../types/waf.types';

const WafLogsTable: React.FC = () => {
  const {
    logs,
    isLoading,
    pagination,
    filters,
    selectedLog,
    setSelectedLog,
    setPagination,
    setFilters,
  } = useWafLogsStore();

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterValues, setFilterValues] = useState(filters);

  // 컬럼 정의
  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: '시간',
      width: 180,
      renderCell: (params) => 
        format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss', { locale: ko }),
    },
    {
      field: 'clientIp',
      headerName: 'IP 주소',
      width: 150,
    },
    {
      field: 'requestMethod',
      headerName: 'Method',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small"
          color={params.value === 'GET' ? 'primary' : 'secondary'}
        />
      ),
    },
    {
      field: 'requestUri',
      headerName: 'URI',
      width: 300,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          fontFamily: 'monospace'
        }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'responseCode',
      headerName: '응답 코드',
      width: 120,
      renderCell: (params) => {
        const code = params.value;
        let color: 'success' | 'error' | 'warning' | 'default' = 'default';
        if (code >= 200 && code < 300) color = 'success';
        else if (code >= 400 && code < 500) color = 'warning';
        else if (code >= 500) color = 'error';
        
        return <Chip label={code} size="small" color={color} />;
      },
    },
    {
      field: 'isBlocked',
      headerName: '차단 여부',
      width: 120,
      renderCell: (params) => (
        params.value ? (
          <Chip 
            icon={<Block />} 
            label="차단됨" 
            color="error" 
            size="small" 
          />
        ) : (
          <Chip 
            icon={<CheckCircle />} 
            label="허용됨" 
            color="success" 
            size="small" 
          />
        )
      ),
    },
    {
      field: 'ruleId',
      headerName: '룰 ID',
      width: 120,
      renderCell: (params) => 
        params.value ? (
          <Chip label={params.value} size="small" color="warning" />
        ) : null,
    },
    {
      field: 'severity',
      headerName: '심각도',
      width: 100,
      renderCell: (params) => {
        if (!params.value) return null;
        const severity = params.value;
        let color: 'success' | 'warning' | 'error' = 'success';
        if (severity >= 4) color = 'error';
        else if (severity >= 2) color = 'warning';
        
        return <Chip label={severity} size="small" color={color} />;
      },
    },
    {
      field: 'attackType',
      headerName: '공격 유형',
      width: 150,
      renderCell: (params) => 
        params.value ? (
          <Chip label={params.value} size="small" color="error" />
        ) : null,
    },
    {
      field: 'actions',
      headerName: '작업',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleViewDetail(params.row)}
        >
          <Visibility />
        </IconButton>
      ),
    },
  ];

  // 페이지네이션 핸들러
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPagination({
      ...pagination,
      page: model.page + 1, // MUI DataGrid는 0부터 시작
      limit: model.pageSize,
    });
  };

  // 상세 보기 핸들러
  const handleViewDetail = (log: WafLogEntry) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  // 필터 적용 핸들러
  const handleApplyFilters = () => {
    setFilters(filterValues);
  };

  // 필터 초기화 핸들러
  const handleClearFilters = () => {
    const emptyFilters = {};
    setFilterValues(emptyFilters);
    setFilters(emptyFilters);
  };

  return (
    <Box>
      {/* 필터 UI */}
      <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          필터
        </Typography>
        {/* @ts-ignore */}
        <Grid container spacing={2} alignItems="center">
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="IP 주소"
              value={filterValues.clientIp || ''}
              onChange={(e) => setFilterValues({ ...filterValues, clientIp: e.target.value })}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="룰 ID"
              value={filterValues.ruleId || ''}
              onChange={(e) => setFilterValues({ ...filterValues, ruleId: e.target.value })}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>심각도</InputLabel>
              <Select
                value={filterValues.severity || ''}
                label="심각도"
                onChange={(e) => setFilterValues({ ...filterValues, severity: e.target.value as number })}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value={1}>1 (낮음)</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3 (중간)</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5 (높음)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1}>
              <Button variant="contained" size="small" onClick={handleApplyFilters}>
                적용
              </Button>
              <Button variant="outlined" size="small" onClick={handleClearFilters}>
                초기화
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 데이터 그리드 */}
      <DataGrid
        rows={logs}
        columns={columns}
        getRowId={(row) => row._id}
        loading={isLoading}
        paginationMode="server"
        paginationModel={{
          page: pagination.page - 1, // MUI DataGrid는 0부터 시작
          pageSize: pagination.limit,
        }}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={[10, 25, 50, 100]}
        rowCount={pagination.total}
        disableRowSelectionOnClick
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          height: 600,
          '& .MuiDataGrid-cell': {
            fontSize: '0.875rem',
          },
        }}
      />

      {/* 상세 보기 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          WAF 로그 상세 정보
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              {/* @ts-ignore */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">시간</Typography>
                <Typography variant="body2">
                  {format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                </Typography>
              </Grid>
              {/* @ts-ignore */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">IP 주소</Typography>
                <Typography variant="body2">{selectedLog.clientIp}</Typography>
              </Grid>
              {/* @ts-ignore */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">요청 방법</Typography>
                <Typography variant="body2">{selectedLog.requestMethod}</Typography>
              </Grid>
              {/* @ts-ignore */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">응답 코드</Typography>
                <Typography variant="body2">{selectedLog.responseCode}</Typography>
              </Grid>
              {/* @ts-ignore */}
              <Grid item xs={12}>
                <Typography variant="subtitle2">요청 URI</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedLog.requestUri}
                </Typography>
              </Grid>
              {/* @ts-ignore */}
              {selectedLog.ruleId && (
                // @ts-ignore
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">룰 ID</Typography>
                  <Typography variant="body2">{selectedLog.ruleId}</Typography>
                </Grid>
              )}
              {/* @ts-ignore */}
              {selectedLog.severity && (
                // @ts-ignore
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">심각도</Typography>
                  <Typography variant="body2">{selectedLog.severity}</Typography>
                </Grid>
              )}
              {/* @ts-ignore */}
              {selectedLog.attackType && (
                // @ts-ignore
                <Grid item xs={12}>
                  <Typography variant="subtitle2">공격 유형</Typography>
                  <Typography variant="body2">{selectedLog.attackType}</Typography>
                </Grid>
              )}
              {/* @ts-ignore */}
              {selectedLog.message && (
                // @ts-ignore
                <Grid item xs={12}>
                  <Typography variant="subtitle2">메시지</Typography>
                  <Typography variant="body2">{selectedLog.message}</Typography>
                </Grid>
              )}
              {/* @ts-ignore */}
              <Grid item xs={12}>
                <Typography variant="subtitle2">전체 로그</Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace',
                    backgroundColor: '#f5f5f5',
                    p: 1,
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {selectedLog.fullLog}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WafLogsTable;

