import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ShieldAlert, AlertTriangle, Info, Download, Filter, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { detectAnomalies, formatCurrency, formatNumber, exportToCSV } from '../utils/dataProcessing';
import { AnomalyResult } from '../types';

export const AnomalyAnalysis: React.FC = () => {
  const { dailyAggregates, settings } = useDashboard();

  const [method, setMethod] = useState<'mad' | 'iqr'>('mad');
  const [threshold, setThreshold] = useState<number>(2.5);
  const [metric, setMetric] = useState<'count' | 'amount'>('count');
  const [searchFilter, setSearchFilter] = useState('');

  // Run statistical anomaly detection
  const anomalyResults = useMemo(() => {
    return detectAnomalies(dailyAggregates, {
      method,
      threshold,
      metric,
    });
  }, [dailyAggregates, method, threshold, metric]);

  // Chart data blending
  const chartData = useMemo(() => {
    return anomalyResults.map((r) => {
      const d = new Date(r.date + 'T00:00:00Z');
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return {
        ...r,
        displayDate,
        anomalyValue: r.isAnomaly ? r.observed : null,
      };
    });
  }, [anomalyResults]);

  // Flagged list
  const flaggedList = useMemo(() => {
    return anomalyResults.filter((r) => r.isAnomaly);
  }, [anomalyResults]);

  // Summary stats
  const totalDays = anomalyResults.length || 1;
  const anomalyRate = Math.round((flaggedList.length / totalDays) * 1000) / 10;
  const spikesCount = flaggedList.filter((f) => f.type === 'spike').length;
  const dropsCount = flaggedList.filter((f) => f.type === 'drop').length;

  // Max deviations
  const maxDeviation = flaggedList.length
    ? Math.max(...flaggedList.map((f) => Math.abs(f.deviation)))
    : 0;

  // Export anomalies
  const handleExportAnomalies = () => {
    const rows = flaggedList.map((f) => ({
      date: f.date,
      metric,
      observed_value: f.observed,
      baseline_value: f.baseline,
      lower_threshold: f.lowerBound,
      upper_threshold: f.upperBound,
      deviation_score: f.deviation,
      anomaly_type: f.type,
      method: f.method,
    }));
    exportToCSV(`anomalies_${method}_${Date.now()}.csv`, rows);
  };

  // Filtered table rows
  const tableRows = useMemo(() => {
    if (!searchFilter.trim()) return flaggedList;
    const q = searchFilter.toLowerCase();
    return flaggedList.filter(
      (r) =>
        r.date.includes(q) ||
        r.type.includes(q) ||
        r.deviation.toString().includes(q) ||
        r.observed.toString().includes(q)
    );
  }, [flaggedList, searchFilter]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as AnomalyResult & { displayDate: string };
      return (
        <div className="bg-[#14213D] text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[210px]">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
            <span className="font-semibold text-slate-200">{d.date}</span>
            {d.isAnomaly ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                {d.type.toUpperCase()} OUTLIER
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400">NOMINAL</span>
            )}
          </div>
          <div className="space-y-1 font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Observed:</span>
              <span className="font-bold text-white">
                {metric === 'count'
                  ? formatNumber(d.observed, settings.numberSystem)
                  : formatCurrency(d.observed, settings.currency, settings.numberSystem)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Baseline:</span>
              <span>
                {metric === 'count'
                  ? formatNumber(d.baseline, settings.numberSystem)
                  : formatCurrency(d.baseline, settings.currency, settings.numberSystem)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Expected Range:</span>
              <span>
                {metric === 'count'
                  ? `${d.lowerBound} – ${d.upperBound}`
                  : `${formatCurrency(d.lowerBound, settings.currency, settings.numberSystem)} – ${formatCurrency(d.upperBound, settings.currency, settings.numberSystem)}`}
              </span>
            </div>
            {d.isAnomaly && (
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-300 font-semibold">
                <span>Deviation Z/Score:</span>
                <span>{d.deviation}σ</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
          Anomaly Analysis
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Identify unusual patterns in aggregate banking transaction activity via robust statistical dispersion models.
        </p>
      </div>

      {/* Mandatory Statistical Disclaimer */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3 text-xs text-[#1D3557]">
        <Info className="w-4 h-4 text-[#3563E9] shrink-0" />
        <span>
          <strong>Analytical Notice:</strong> Statistical anomalies are unusual aggregate observations, not confirmed fraudulent transactions.
        </span>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* Controls Bar */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Method selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Detection Model
            </label>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setMethod('mad')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  method === 'mad'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rolling MAD (Robust)
              </button>
              <button
                onClick={() => setMethod('iqr')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  method === 'iqr'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Interquartile (IQR)
              </button>
            </div>
          </div>

          {/* Metric Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Target Metric
            </label>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setMetric('count')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  metric === 'count'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Volume
              </button>
              <button
                onClick={() => setMetric('amount')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  metric === 'amount'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Amount
              </button>
            </div>
          </div>

          {/* Threshold Sensitivity */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Sensitivity Threshold (k)
            </label>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              {[2.0, 2.5, 3.0].map((k) => (
                <button
                  key={k}
                  onClick={() => setThreshold(k)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    threshold === k
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {k}×
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleExportAnomalies}
          disabled={flaggedList.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors self-start md:self-end disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          Export Flagged CSV
        </button>
      </div>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Flagged Days</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {flaggedList.length}{' '}
            <span className="text-xs font-normal text-slate-500">of {totalDays} days</span>
          </div>
        </div>

        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Anomaly Incident Rate</span>
          <div className="text-2xl font-bold text-[#D99000] font-mono mt-1">
            {anomalyRate}%
          </div>
        </div>

        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Spike vs Drop Count</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            <span className="text-rose-600">+{spikesCount}</span> /{' '}
            <span className="text-blue-600">-{dropsCount}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Max Deviation Score</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {maxDeviation > 0 ? `${maxDeviation}σ` : '—'}
          </div>
        </div>
      </div>

      {/* Chart: Time Series with Confidence Envelope and Highlighted Anomalies */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#182230]">Statistical Boundary & Outlier Detection</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Actual trajectory plotted alongside dynamic {threshold}× {method.toUpperCase()} boundary corridor.
          </p>
        </div>

        <div className="w-full h-[340px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No data points available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  interval={Math.ceil(chartData.length / 10)}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) =>
                    metric === 'count'
                      ? formatNumber(val, settings.numberSystem)
                      : formatCurrency(val, settings.currency, settings.numberSystem)
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />

                {/* Upper envelope */}
                <Line
                  name="Upper Bound Threshold"
                  type="monotone"
                  dataKey="upperBound"
                  stroke="#CBD5E1"
                  strokeDasharray="3 3"
                  dot={false}
                  strokeWidth={1.5}
                />
                {/* Lower envelope */}
                <Line
                  name="Lower Bound Threshold"
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="#CBD5E1"
                  strokeDasharray="3 3"
                  dot={false}
                  strokeWidth={1.5}
                />
                {/* Baseline */}
                <Line
                  name="Baseline Median"
                  type="monotone"
                  dataKey="baseline"
                  stroke="#18A999"
                  strokeDasharray="2 2"
                  dot={false}
                  strokeWidth={1.5}
                />
                {/* Actual Line */}
                <Line
                  name="Observed Value"
                  type="monotone"
                  dataKey="observed"
                  stroke="#3563E9"
                  strokeWidth={2}
                  dot={false}
                />
                {/* Highlight Outlier Dots */}
                <Scatter
                  name="Flagged Anomalies"
                  dataKey="anomalyValue"
                  fill="#D64545"
                  shape="circle"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Flagged Anomalies Log Table */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#182230]">Flagged Outlier Observations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual dates with deviation exceeding the statistical boundary.
            </p>
          </div>

          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Observed Value</th>
                <th className="py-3 px-4 text-right">Baseline Median</th>
                <th className="py-3 px-4 text-right">Allowed Corridor</th>
                <th className="py-3 px-4 text-right">Deviation Score</th>
                <th className="py-3 px-4">Detection Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-[#169B62]" />
                      <p className="text-sm font-medium text-slate-700">No anomalies detected</p>
                      <p className="text-xs text-slate-400">All data points fall within nominal dispersion bounds.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">
                      {row.date}
                    </td>
                    <td className="py-3 px-4">
                      {row.type === 'spike' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-[#D64545]">
                          High Spike
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#3563E9]">
                          Low Drop
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {metric === 'count'
                        ? formatNumber(row.observed, settings.numberSystem)
                        : formatCurrency(row.observed, settings.currency, settings.numberSystem)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {metric === 'count'
                        ? formatNumber(row.baseline, settings.numberSystem)
                        : formatCurrency(row.baseline, settings.currency, settings.numberSystem)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {metric === 'count'
                        ? `${row.lowerBound} – ${row.upperBound}`
                        : `${formatCurrency(row.lowerBound, settings.currency, settings.numberSystem)} – ${formatCurrency(row.upperBound, settings.currency, settings.numberSystem)}`}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#D99000]">
                      {row.deviation > 0 ? `+${row.deviation}σ` : `${row.deviation}σ`}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">
                      {row.method}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
