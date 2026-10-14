import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { LineChart as LineChartIcon, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { computeForecast, formatCurrency, formatNumber } from '../utils/dataProcessing';

export const Forecasting: React.FC = () => {
  const { dailyAggregates, settings } = useDashboard();

  const [model, setModel] = useState<'holt-winters' | 'seasonal-naive' | 'holt-linear'>('holt-winters');
  const [horizon, setHorizon] = useState<number>(14);
  const [metric, setMetric] = useState<'count' | 'amount'>('count');

  // Compute forecast and backtest evaluation
  const { points, evaluation } = useMemo(() => {
    return computeForecast(dailyAggregates, {
      model,
      horizon,
      metric,
    });
  }, [dailyAggregates, model, horizon, metric]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#14213D] text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[200px]">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700">
            <span className="font-semibold text-slate-200">{d.date}</span>
            <span className="text-[10px] font-medium text-slate-400">
              {d.isHistorical ? 'Historical Record' : 'Model Estimate'}
            </span>
          </div>
          <div className="space-y-1 font-mono text-slate-300">
            {d.actual !== undefined && (
              <div className="flex justify-between">
                <span>Actual:</span>
                <span className="font-bold text-white">
                  {metric === 'count'
                    ? formatNumber(d.actual, settings.numberSystem)
                    : formatCurrency(d.actual, settings.currency, settings.numberSystem)}
                </span>
              </div>
            )}
            {d.forecast !== undefined && (
              <>
                <div className="flex justify-between text-[#3563E9]">
                  <span className="font-semibold">Projected:</span>
                  <span className="font-bold">
                    {metric === 'count'
                      ? formatNumber(d.forecast, settings.numberSystem)
                      : formatCurrency(d.forecast, settings.currency, settings.numberSystem)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                  <span>80% Interval:</span>
                  <span>
                    {metric === 'count'
                      ? `${d.lowerBound80} – ${d.upperBound80}`
                      : `${formatCurrency(d.lowerBound80, settings.currency, settings.numberSystem)} – ${formatCurrency(d.upperBound80, settings.currency, settings.numberSystem)}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>95% Interval:</span>
                  <span>
                    {metric === 'count'
                      ? `${d.lowerBound95} – ${d.upperBound95}`
                      : `${formatCurrency(d.lowerBound95, settings.currency, settings.numberSystem)} – ${formatCurrency(d.upperBound95, settings.currency, settings.numberSystem)}`}
                  </span>
                </div>
              </>
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
          Transaction Forecasting
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore prospective volume and liquidity trajectory using seasonal exponential smoothing models.
        </p>
      </div>

      {/* Model Disclaimer */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3 text-xs text-[#1D3557]">
        <Info className="w-4 h-4 text-[#3563E9] shrink-0" />
        <span>
          <strong>Projections Disclaimer:</strong> Forecasted numbers are statistical estimates generated from historical periodicity, not financial commitments.
        </span>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* Controls Bar */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Model Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Time-Series Model
            </label>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setModel('holt-winters')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  model === 'holt-winters'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Triple Exp (Holt-Winters)
              </button>
              <button
                onClick={() => setModel('seasonal-naive')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  model === 'seasonal-naive'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Seasonal Naive
              </button>
              <button
                onClick={() => setModel('holt-linear')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  model === 'holt-linear'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Holt Linear
              </button>
            </div>
          </div>

          {/* Metric Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Metric
            </label>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setMetric('count')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'count'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Txn Volume
              </button>
              <button
                onClick={() => setMetric('amount')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'amount'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Txn Amount
              </button>
            </div>
          </div>

          {/* Forecast Horizon */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Horizon Window
            </label>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              {[7, 14, 30].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    horizon === h
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  +{h} Days
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Model Backtest Evaluation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Holdout MAE (Mean Abs Error)</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {metric === 'count'
              ? formatNumber(evaluation.mae, settings.numberSystem)
              : formatCurrency(evaluation.mae, settings.currency, settings.numberSystem)}
          </div>
          <span className="text-[11px] text-slate-400">Tested on {evaluation.testCount} out-of-sample days</span>
        </div>

        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Holdout RMSE (Root Mean Sq Error)</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {metric === 'count'
              ? formatNumber(evaluation.rmse, settings.numberSystem)
              : formatCurrency(evaluation.rmse, settings.currency, settings.numberSystem)}
          </div>
          <span className="text-[11px] text-slate-400">Penalizes large outlier errors</span>
        </div>

        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Holdout MAPE (Pct Error)</span>
          <div className="text-2xl font-bold text-[#169B62] font-mono mt-1">
            {evaluation.mape}%
          </div>
          <span className="text-[11px] text-slate-400">Relative accuracy on validation split</span>
        </div>

        <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Train / Test Split Ratio</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {evaluation.trainCount} / {evaluation.testCount}
          </div>
          <span className="text-[11px] text-slate-400">Chronological validation split</span>
        </div>
      </div>

      {/* Main Forecast Chart with Confidence Bands */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#182230]">Historical Trajectory & Horizon Projection</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fitted history along with +{horizon} days forecast and 80% / 95% confidence intervals.
            </p>
          </div>
        </div>

        <div className="w-full h-[360px]">
          {points.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Insufficient history for time-series projection.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecast95Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3563E9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3563E9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  interval={Math.ceil(points.length / 10)}
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

                {/* 95% Confidence Upper Band */}
                <Area
                  name="95% Confidence Interval"
                  dataKey="upperBound95"
                  stroke="none"
                  fill="url(#forecast95Grad)"
                />
                {/* 80% Confidence Upper Band */}
                <Area
                  name="80% Confidence Interval"
                  dataKey="upperBound80"
                  stroke="none"
                  fill="#3563E9"
                  fillOpacity={0.1}
                />
                {/* Historical Line */}
                <Line
                  name="Historical Actuals"
                  type="monotone"
                  dataKey="actual"
                  stroke="#14213D"
                  strokeWidth={2}
                  dot={false}
                />
                {/* Forecast Line */}
                <Line
                  name="Model Forecast"
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3563E9"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#3563E9' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
