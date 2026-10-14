import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  TransactionRecord,
  FilterState,
  AggregatedDay,
  AppSettings,
  DatasetQualityReport,
} from '../types';
import { generateSyntheticTransactions } from '../data/generateDemoData';
import {
  filterTransactions,
  aggregateByDay,
  detectAnomalies,
} from '../utils/dataProcessing';

interface DashboardContextType {
  // Raw and Filtered Data
  allTransactions: TransactionRecord[];
  filteredTransactions: TransactionRecord[];
  dailyAggregates: AggregatedDay[];

  // Dataset Info
  datasetName: string;
  isDemoDataset: boolean;
  datasetDateRange: { start: string; end: string };
  lastReport: DatasetQualityReport | null;

  // Filters & State
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: (key: keyof FilterState, val: string) => void;
  resetFilters: () => void;
  setDatePreset: (preset: '30d' | '90d' | '180d' | 'all') => void;

  // KPIs
  kpis: {
    totalCount: number;
    totalAmount: number;
    avgAmount: number;
    successRate: number;
    failedCount: number;
    failedRate: number;
    flaggedAnomaliesCount: number;
    prevPeriodComparisons: {
      countChangePct: number | null;
      amountChangePct: number | null;
      avgChangePct: number | null;
      successRateChangePct: number | null;
    };
  };

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Actions
  regenerateDemoData: () => void;
  loadCustomDataset: (name: string, records: TransactionRecord[], report: DatasetQualityReport) => void;
  restoreDemoData: () => void;
  isRefreshing: boolean;
  refreshActiveData: () => void;
}

const defaultSettings: AppSettings = {
  currency: 'INR',
  numberSystem: 'indian',
  defaultDatePreset: 'all',
  defaultAggregation: 'daily',
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with synthetic demo data
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>(() => {
    return generateSyntheticTransactions(12000, 42);
  });

  const [datasetName, setDatasetName] = useState<string>('Demo Banking Dataset');
  const [isDemoDataset, setIsDemoDataset] = useState<boolean>(true);
  const [lastReport, setLastReport] = useState<DatasetQualityReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Settings with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('banking_dash_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('banking_dash_settings', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  // Determine full dataset date bounds
  const datasetDateRange = useMemo(() => {
    if (!allTransactions.length) return { start: '', end: '' };
    return {
      start: allTransactions[0].date,
      end: allTransactions[allTransactions.length - 1].date,
    };
  }, [allTransactions]);

  // Initial filters
  const [filters, setFilters] = useState<FilterState>(() => ({
    startDate: '',
    endDate: '',
    transactionType: 'All',
    paymentMode: 'All',
    transactionStatus: 'All',
    branch: 'All',
    searchQuery: '',
  }));

  // Synchronize initial filter date range when transactions load
  useEffect(() => {
    if (datasetDateRange.start && datasetDateRange.end) {
      setFilters(prev => ({
        ...prev,
        startDate: prev.startDate || datasetDateRange.start,
        endDate: prev.endDate || datasetDateRange.end,
      }));
    }
  }, [datasetDateRange]);

  const updateFilter = (key: keyof FilterState, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: datasetDateRange.start,
      endDate: datasetDateRange.end,
      transactionType: 'All',
      paymentMode: 'All',
      transactionStatus: 'All',
      branch: 'All',
      searchQuery: '',
    });
  };

  const setDatePreset = (preset: '30d' | '90d' | '180d' | 'all') => {
    if (!datasetDateRange.end) return;
    if (preset === 'all') {
      setFilters(prev => ({
        ...prev,
        startDate: datasetDateRange.start,
        endDate: datasetDateRange.end,
      }));
      return;
    }

    const days = preset === '30d' ? 30 : preset === '90d' ? 90 : 180;
    const end = new Date(datasetDateRange.end + 'T00:00:00Z');
    const start = new Date(end.getTime() - days * 86400000);
    const startStr = start.toISOString().split('T')[0];

    setFilters(prev => ({
      ...prev,
      startDate: startStr < datasetDateRange.start ? datasetDateRange.start : startStr,
      endDate: datasetDateRange.end,
    }));
  };

  // Memoized filtered transactions
  const filteredTransactions = useMemo(() => {
    return filterTransactions(allTransactions, filters);
  }, [allTransactions, filters]);

  // Daily aggregations
  const dailyAggregates = useMemo(() => {
    return aggregateByDay(filteredTransactions);
  }, [filteredTransactions]);

  // Calculate default anomalies on daily count
  const anomalyResults = useMemo(() => {
    return detectAnomalies(dailyAggregates, {
      method: 'mad',
      threshold: 2.5,
      metric: 'count',
    });
  }, [dailyAggregates]);

  // Calculate KPIs and period-over-period comparison
  const kpis = useMemo(() => {
    const totalCount = filteredTransactions.length;
    let totalAmount = 0;
    let successfulCount = 0;
    let failedCount = 0;

    for (const t of filteredTransactions) {
      totalAmount += t.amount;
      if (t.transaction_status === 'Successful') successfulCount++;
      else if (t.transaction_status === 'Failed') failedCount++;
    }

    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;
    const successRate = totalCount > 0 ? Math.round((successfulCount / totalCount) * 1000) / 10 : 0;
    const failedRate = totalCount > 0 ? Math.round((failedCount / totalCount) * 1000) / 10 : 0;
    const flaggedAnomaliesCount = anomalyResults.filter(a => a.isAnomaly).length;

    // Period over period: compare with previous window of same day duration
    let prevPeriodComparisons = {
      countChangePct: null as number | null,
      amountChangePct: null as number | null,
      avgChangePct: null as number | null,
      successRateChangePct: null as number | null,
    };

    if (filters.startDate && filters.endDate && totalCount > 0) {
      const curStart = new Date(filters.startDate + 'T00:00:00Z').getTime();
      const curEnd = new Date(filters.endDate + 'T00:00:00Z').getTime();
      const durationMs = curEnd - curStart;

      if (durationMs > 0) {
        const prevEndMs = curStart - 86400000;
        const prevStartMs = prevEndMs - durationMs;
        const prevStartStr = new Date(prevStartMs).toISOString().split('T')[0];
        const prevEndStr = new Date(prevEndMs).toISOString().split('T')[0];

        // Filter previous period
        const prevTxns = allTransactions.filter(t => {
          if (t.date < prevStartStr || t.date > prevEndStr) return false;
          if (filters.transactionType !== 'All' && t.transaction_type !== filters.transactionType) return false;
          if (filters.paymentMode !== 'All' && t.payment_mode !== filters.paymentMode) return false;
          if (filters.transactionStatus !== 'All' && t.transaction_status !== filters.transactionStatus) return false;
          if (filters.branch !== 'All' && t.branch !== filters.branch) return false;
          return true;
        });

        if (prevTxns.length >= 10) {
          const prevTotalCount = prevTxns.length;
          const prevTotalAmt = prevTxns.reduce((a, b) => a + b.amount, 0);
          const prevAvg = Math.round(prevTotalAmt / prevTotalCount);
          const prevSucc = prevTxns.filter(t => t.transaction_status === 'Successful').length;
          const prevSuccRate = (prevSucc / prevTotalCount) * 100;

          const countChange = Math.round(((totalCount - prevTotalCount) / prevTotalCount) * 1000) / 10;
          const amtChange = Math.round(((totalAmount - prevTotalAmt) / prevTotalAmt) * 1000) / 10;
          const avgChange = Math.round(((avgAmount - prevAvg) / prevAvg) * 1000) / 10;
          const succChange = Math.round((successRate - prevSuccRate) * 10) / 10;

          prevPeriodComparisons = {
            countChangePct: countChange,
            amountChangePct: amtChange,
            avgChangePct: avgChange,
            successRateChangePct: succChange,
          };
        }
      }
    }

    return {
      totalCount,
      totalAmount,
      avgAmount,
      successRate,
      failedCount,
      failedRate,
      flaggedAnomaliesCount,
      prevPeriodComparisons,
    };
  }, [filteredTransactions, anomalyResults, filters, allTransactions]);

  // Actions
  const regenerateDemoData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const fresh = generateSyntheticTransactions(12000, Date.now());
      setAllTransactions(fresh);
      setDatasetName('Demo Banking Dataset (Regenerated)');
      setIsDemoDataset(true);
      setLastReport(null);
      setIsRefreshing(false);
    }, 200);
  };

  const loadCustomDataset = (name: string, records: TransactionRecord[], report: DatasetQualityReport) => {
    setAllTransactions(records);
    setDatasetName(name);
    setIsDemoDataset(false);
    setLastReport(report);
  };

  const restoreDemoData = () => {
    const demo = generateSyntheticTransactions(12000, 42);
    setAllTransactions(demo);
    setDatasetName('Demo Banking Dataset');
    setIsDemoDataset(true);
    setLastReport(null);
  };

  const refreshActiveData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <DashboardContext.Provider
      value={{
        allTransactions,
        filteredTransactions,
        dailyAggregates,
        datasetName,
        isDemoDataset,
        datasetDateRange,
        lastReport,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        setDatePreset,
        kpis,
        settings,
        updateSettings,
        regenerateDemoData,
        loadCustomDataset,
        restoreDemoData,
        isRefreshing,
        refreshActiveData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
