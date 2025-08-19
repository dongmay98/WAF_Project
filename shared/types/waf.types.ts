export interface WafLogEntry {
  id: string;
  timestamp: Date;
  clientIp: string;
  requestMethod: string;
  requestUri: string;
  responseCode: number;
  ruleId?: string;
  message?: string;
  severity?: number;
  tags?: string[];
  fullLog: string;
}

export interface WafRule {
  id: string;
  name: string;
  description: string;
  ruleContent: string; // ModSecurity rule syntax
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WafDashboardStats {
  totalRequests: number;
  blockedRequests: number;
  topBlockedIps: { ip: string; count: number }[];
  topBlockedRules: { ruleId: string; count: number }[];
  attackTypeDistribution: { type: string; count: number }[];
}