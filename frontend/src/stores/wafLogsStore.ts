import { create } from 'zustand';
import type { WafLogEntry, WafDashboardStats } from '../types/waf.types';

interface WafLogsState {
  // Data
  logs: WafLogEntry[];
  stats: WafDashboardStats | null;
  selectedLog: WafLogEntry | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  
  // Filters
  filters: {
    startDate?: string;
    endDate?: string;
    clientIp?: string;
    ruleId?: string;
    severity?: number;
  };
  
  // Actions
  setLogs: (logs: WafLogEntry[]) => void;
  setStats: (stats: WafDashboardStats) => void;
  setSelectedLog: (log: WafLogEntry | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingStats: (loading: boolean) => void;
  setPagination: (pagination: any) => void;
  setFilters: (filters: any) => void;
  clearFilters: () => void;
}

export const useWafLogsStore = create<WafLogsState>((set) => ({
  // Initial state
  logs: [],
  stats: null,
  selectedLog: null,
  isLoading: false,
  isLoadingStats: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {},
  
  // Actions
  setLogs: (logs) => set({ logs }),
  setStats: (stats) => set({ stats }),
  setSelectedLog: (selectedLog) => set({ selectedLog }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoadingStats: (isLoadingStats) => set({ isLoadingStats }),
  setPagination: (pagination) => set({ pagination }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  clearFilters: () => set({ filters: {} }),
}));

