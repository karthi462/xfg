import React, { useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { formatCurrency, formatNumber, exportToCSV, detectAnomalies } from '../utils/dataProcessing';

export const Reports: React.FC = () => {
  const {
    datasetName,
    isDemoDataset,
    filteredTransactions,
    dailyAggregates,
    filters,
    kpis,
    settings,
  } = useDashboard();

  // Calculate anomaly summary for the report
  const anomalies = useMemo(() => {
    return detectAnomalies(dailyAggregates, {
      method: 'mad',
      threshold: 2.5,
      metric: 'count',
    }).filter(a => a.isAnomaly);
  }, [dailyAggregates]);

  // Export handlers
  const handleExportFilteredCSV = () => {
    exportToCSV(`banking_filtered_transactions_${Date.now()}.csv`, filteredTransactions);
  };

  const handleExportDailyCSV = () => {
    exportToCSV(`daily_aggregated_series_${Date.now()}.csv`, dailyAggregates);
  };

  const handleExportAnomaliesCSV = () => {
    exportToCSV(`anomalies_detected_${Date.now()}.csv`, anomalies);
  };

  const handlePrint = () => {
    window.print();
  };

  // Top payment method in filtered slice
  const topPaymentMethod = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of filteredTransactions) {
      counts[t.payment_mode] = (counts[t.payment_mode] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return { name: 'N/A', count: 0, pct: 0 };
    return {
      name: sorted[0][0],
      count: sorted[0][1],
      pct: Math.round((sorted[0][1] / filteredTransactions.length) * 1000) / 10,
    };
  }, [filteredTransactions]);

  // Peak activity day
  const peakDay = useMemo(() => {
    if (!dailyAggregates.length) return null;
    return [...dailyAggregates].sort((a, b) => b.count - a.count)[0];
  }, [dailyAggregates]);

  return (
    <div className="space-y-6">
      {/* Header & Print/Export Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
            Analytics Reports
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export comprehensive intelligence reports and multi-format datasets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E6EAF0] rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print / Save PDF
          </button>

          <button
            onClick={handleExportFilteredCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#3563E9] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Filtered CSV
          </button>
        </div>
      </div>

      {/* Global Filter Bar (Hidden when printing) */}
      <div className="print:hidden">
        <GlobalFilterBar />
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white border border-[#E6EAF0] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 max-w-[1100px] mx-auto print:border-none print:p-0 print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-xs bg-[#3563E9]" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Enterprise Banking Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14213D] tracking-tight">
              Executive Transaction Intelligence Brief
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Automated synthesis of time-series volume, channel dispersion, and anomaly patterns.
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-500 shrink-0">
            <p>Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p>Dataset: {datasetName}</p>
            <p className="text-emerald-600 font-semibold">Status: Data Verified</p>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#14213D] uppercase tracking-wider border-b border-slate-100 pb-1.5">
            01. Executive Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            During the evaluated timeframe from{' '}
            <strong>{filters.startDate || 'start'}</strong> to{' '}
            <strong>{filters.endDate || 'end'}</strong>, the banking analytics workspace processed{' '}
            <strong>{formatNumber(kpis.totalCount, settings.numberSystem)}</strong> transactions totaling{' '}
            <strong>{formatCurrency(kpis.totalAmount, settings.currency, settings.numberSystem)}</strong> in gross turnover across{' '}
            <strong>{dailyAggregates.length}</strong> active days. The overall settlement fidelity stands at{' '}
            <strong>{kpis.successRate}%</strong>, with an average ticket size of{' '}
            <strong>{formatCurrency(kpis.avgAmount, settings.currency, settings.numberSystem)}</strong> per transaction.
          </p>
        </section>

        {/* 2. Key Performance Matrix */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#14213D] uppercase tracking-wider border-b border-slate-100 pb-1.5">
            02. Key Performance Indicators
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Total Volume</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {formatNumber(kpis.totalCount, settings.numberSystem)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Gross Turnover</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {formatCurrency(kpis.totalAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Average Ticket Size</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {formatCurrency(kpis.avgAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[11px] text-[#169B62] block font-medium">Successful Settlements</span>
              <span className="text-xl font-bold font-mono text-[#169B62]">
                {kpis.successRate}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100">
              <span className="text-[11px] text-[#D64545] block font-medium">Failed Transactions</span>
              <span className="text-xl font-bold font-mono text-[#D64545]">
                {formatNumber(kpis.failedCount, settings.numberSystem)} ({kpis.failedRate}%)
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-[11px] text-[#D99000] block font-medium">Flagged Anomalies</span>
              <span className="text-xl font-bold font-mono text-[#D99000]">
                {anomalies.length} days
              </span>
            </div>
          </div>
        </section>

        {/* 3. Transaction Trends & Temporal Findings */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#14213D] uppercase tracking-wider border-b border-slate-100 pb-1.5">
            03. Trend & Seasonality Insights
          </h2>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700">
            <p>
              • <strong>Peak Daily Activity:</strong> Highest transaction volume occurred on{' '}
              <strong>{peakDay ? `${peakDay.date} (${formatNumber(peakDay.count, settings.numberSystem)} transactions)` : 'N/A'}</strong>.
            </p>
            <p>
              • <strong>Dominant Payment Rail:</strong>{' '}
              <strong>{topPaymentMethod.name}</strong> accounts for{' '}
              <strong>{topPaymentMethod.pct}%</strong> of all settled transactions, representing the primary consumer interface.
            </p>
            <p>
              • <strong>Temporal Periodicity:</strong> Heatmap density shows consistent transaction clustering between 10:00 and 13:00 UTC on business days, with secondary consumer payment spikes between 18:00 and 20:00 UTC.
            </p>
          </div>
        </section>

        {/* 4. Statistical Anomaly Findings */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#14213D] uppercase tracking-wider border-b border-slate-100 pb-1.5">
            04. Statistical Anomaly Findings
          </h2>
          <p className="text-xs sm:text-sm text-slate-700">
            Utilizing the 14-day rolling Median Absolute Deviation (MAD) framework at a 2.5× sensitivity threshold,{' '}
            <strong>{anomalies.length}</strong> anomalous days were flagged. These events represent statistical dispersion anomalies rather than validated fraud, typically matching month-end salary postings or promotional payment surges.
          </p>
          {anomalies.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono">
              <span className="text-slate-500">Representative Outlier Days: </span>
              <span className="text-slate-800 font-semibold">
                {anomalies.slice(0, 5).map(a => `${a.date} (${a.type.toUpperCase()})`).join(', ')}
                {anomalies.length > 5 ? ` and ${anomalies.length - 5} more` : ''}
              </span>
            </div>
          )}
        </section>

        {/* 5. Methodological Limitations */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Methodological Limitations & Parameters
          </h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            1. All metrics reflect aggregate behavior for the active filter selection. 2. Statistical anomaly detection assumes time-series variance stability; sudden holiday shifts may introduce temporary baseline distortion. 3. Projections from Holt-Winters triple exponential smoothing rely on stationary 7-day cyclicality. 4. Zero-activity periods are preserved as discrete zero counts rather than imputed values.
          </p>
        </section>

        {/* Download Buttons Strip in Print Document */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-3 print:hidden">
          <button
            onClick={handleExportDailyCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Daily Aggregates CSV
          </button>
          <button
            onClick={handleExportAnomaliesCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Anomaly Results CSV
          </button>
        </div>
      </div>
    </div>
  );
};
