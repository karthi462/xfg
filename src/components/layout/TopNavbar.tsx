import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  RefreshCw,
  Database,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Executive Analytics & KPI Monitoring' },
  '/trends': { title: 'Transaction Trends', subtitle: 'Time-Series & Moving Average Analysis' },
  '/time-analysis': { title: 'Temporal Intelligence', subtitle: 'Hourly & Day-of-Week Behavioral Heatmaps' },
  '/payments': { title: 'Payment Analytics', subtitle: 'Volume & Channel Performance Breakdown' },
  '/anomalies': { title: 'Anomaly Detection', subtitle: 'Statistical Outliers via Rolling MAD & IQR' },
  '/forecasting': { title: 'Forecasting', subtitle: 'Exponential Smoothing & Seasonal Projection' },
  '/branches': { title: 'Branch Analytics', subtitle: 'Comparative Regional & Branch Performance' },
  '/dataset': { title: 'Dataset Explorer', subtitle: 'CSV Ingestion, Column Mapping & Quality Validation' },
  '/reports': { title: 'Reports & Exports', subtitle: 'Executive Summary & Multi-Format Data Downloads' },
  '/settings': { title: 'Settings', subtitle: 'System Preferences & Display Configurations' },
};

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const {
    datasetName,
    isDemoDataset,
    dailyAggregates,
    filteredTransactions,
    setDatePreset,
    isRefreshing,
    refreshActiveData,
    kpis,
  } = useDashboard();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageInfo = pageTitles[location.pathname] || {
    title: 'Banking Intelligence',
    subtitle: 'Advanced Analytics Platform',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-[#E6EAF0] shadow-xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Banking Intelligence</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-800 font-medium">{pageInfo.title}</span>
          </div>
          <h1 className="text-sm md:text-base font-bold text-[#182230] tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Date Presets */}
        <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
          <button
            onClick={() => setDatePreset('30d')}
            className="px-2.5 py-1 rounded-md hover:text-slate-900 hover:bg-white/60 transition-colors"
          >
            30D
          </button>
          <button
            onClick={() => setDatePreset('90d')}
            className="px-2.5 py-1 rounded-md hover:text-slate-900 hover:bg-white/60 transition-colors"
          >
            90D
          </button>
          <button
            onClick={() => setDatePreset('180d')}
            className="px-2.5 py-1 rounded-md hover:text-slate-900 hover:bg-white/60 transition-colors"
          >
            180D
          </button>
          <button
            onClick={() => setDatePreset('all')}
            className="px-2.5 py-1 rounded-md hover:text-slate-900 hover:bg-white/60 transition-colors"
          >
            All
          </button>
        </div>

        {/* Dataset Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F6F8FC] border border-[#E6EAF0] rounded-lg">
          <Database className="w-3.5 h-3.5 text-[#3563E9]" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium text-[#182230] max-w-[130px] truncate" title={datasetName}>
              {datasetName}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#169B62] bg-[#169B62]/10 px-1.5 py-0.5 rounded">
            Data Ready
          </span>
        </div>

        {/* Refresh Data Button */}
        <button
          onClick={refreshActiveData}
          disabled={isRefreshing}
          className="p-2 text-slate-600 hover:text-[#3563E9] hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          title="Recalculate & Refresh Active Views"
          aria-label="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#3563E9]' : ''}`} />
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="System & Intelligence Alerts"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3563E9]" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E6EAF0] rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Intelligence Notifications</span>
                <span className="text-[10px] text-slate-400">Live Analytics Feed</span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-[#169B62] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Dataset Active</p>
                    <p className="text-slate-500 text-[11px]">
                      {filteredTransactions.length.toLocaleString()} records processed across{' '}
                      {dailyAggregates.length} days.
                    </p>
                  </div>
                </div>

                {kpis.flaggedAnomaliesCount > 0 ? (
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                    <AlertTriangle className="w-4 h-4 text-[#D99000] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Statistical Alert</p>
                      <p className="text-slate-500 text-[11px]">
                        {kpis.flaggedAnomaliesCount} unusual transaction spikes detected in current filter window.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Normal Variance</p>
                      <p className="text-slate-500 text-[11px]">All daily volumes remain within 2.5× MAD threshold.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#14213D] text-white font-medium text-xs flex items-center justify-center shadow-xs">
            DA
          </div>
        </div>
      </div>
    </header>
  );
};
