// WAF 로그 엔트리 타입
export interface WafLogEntry {
  _id: string;
  timestamp: string;
  clientIp: string;
  requestMethod: string;
  requestUri: string;
  responseCode: number;
  ruleId?: string;
  message?: string;
  severity?: number;
  tags: string[];
  fullLog: string;
  userAgent?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  attackType?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// 대시보드 통계 타입
export interface WafDashboardStats {
  totalRequests: number;
  blockedRequests: number;
  topBlockedIps: { ip: string; count: number }[];
  topBlockedRules: { ruleId: string; count: number }[];
  attackTypeDistribution: { type: string; count: number }[];
}

// API 요청/응답 타입
export interface GetWafLogsDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  clientIp?: string;
  ruleId?: string;
  severity?: number;
}

export interface WafStatsDto {
  startDate?: string;
  endDate?: string;
}

export interface WafLogsResponse {
  logs: WafLogEntry[];
  pagination: {
    page: string;
    limit: string;
    total: number;
    pages: number;
  };
}
