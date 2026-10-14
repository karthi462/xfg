import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { aggregateByInterval, formatCurrency, formatNumber } from '../utils/dataProcessing';

export const TransactionTrends: React.FC = () => {
  const { dailyAggregates, settings } = useDashboard();

  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [metric, setMetric] = useState<'count' | 'totalAmount' | 'avgAmount'>('count');
  const [show7MA, setShow7MA] = useState(true);
  const [show30MA, setShow30MA] = useState(true);

  // Grouped data based on chosen interval
  const aggregatedData = useMemo(() => {
    return aggregateByInterval(dailyAggregates, interval);
  }, [dailyAggregates, interval]);

  // Cumulative series calculation
  const cumulativeData = useMemo(() => {
    let runningSum = 0;
    return dailyAggregates.map((d) => {
      runningSum += d.totalAmount;
      return {
        date: d.date,
        displayDate: d.displayDate,
        dailyAmount: d.totalAmount,
        cumulativeAmount: runningSum,
      };
    });
  }, [dailyAggregates]);

  // Growth rate calculation on aggregated series
  const growthData = useMemo(() => {
    return aggregatedData.map((curr, idx, arr) => {
      if (idx === 0) return { ...curr, growthRate: 0 };
      const prev = arr[idx - 1];
      const prevVal = metric === 'count' ? prev.count : prev.totalAmount;
      const currVal = metric === 'count' ? curr.count : curr.totalAmount;
      const growthRate = prevVal > 0 ? Math.round(((currVal - prevVal) / prevVal) * 1000) / 10 : 0;
      return {
        ...curr,
        growthRate,
      };
    });
  }, [aggregatedData, metric]);

  const CustomMainTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#14213D] text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[190px]">
          <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-2">
            {d.label || d.displayDate || d.date}
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span>Observed:</span>
              <span className="font-bold text-white">
                {metric === 'count'
                  ? formatNumber(d.count, settings.numberSystem)
                  : formatCurrency(d.totalAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
            {d.movingAvgCount7 !== undefined && interval === 'daily' && (
              <div className="flex justify-between items-center text-teal-300">
                <span>7-Day MA:</span>
                <span>
                  {metric === 'count'
                    ? d.movingAvgCount7
                    : formatCurrency(d.movingAvgAmount7, settings.currency, settings.numberSystem)}
                </span>
              </div>
            )}
            {d.movingAvgCount30 !== undefined && interval === 'daily' && (
              <div className="flex justify-between items-center text-amber-300">
                <span>30-Day MA:</span>
                <span>
                  {metric === 'count'
                    ? d.movingAvgCount30
                    : formatCurrency(d.movingAvgAmount30, settings.currency, settings.numberSystem)}
                </span>
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
          Transaction Trends
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore how transaction amounts and volumes evolve over time across aggregation boundaries.
        </p>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* Main Time Series Chart */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#182230]">Aggregated Time-Series Progression</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuously monitored trajectory with optional 7-day and 30-day rolling trendlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Interval Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setInterval('daily')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  interval === 'daily' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setInterval('weekly')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  interval === 'weekly' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setInterval('monthly')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  interval === 'monthly' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setMetric('count')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'count' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setMetric('totalAmount')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'totalAmount' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Total Amount
              </button>
              <button
                onClick={() => setMetric('avgAmount')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metric === 'avgAmount' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Avg Amount
              </button>
            </div>

            {/* MA toggles (active when daily) */}
            {interval === 'daily' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShow7MA(!show7MA)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    show7MA
                      ? 'bg-teal-50 border-teal-200 text-[#18A999]'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  7D MA
                </button>
                <button
                  onClick={() => setShow30MA(!show30MA)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    show30MA
                      ? 'bg-amber-50 border-amber-200 text-[#D99000]'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  30D MA
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chart View */}
        <div className="w-full h-[340px]">
          {aggregatedData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No data points available for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={aggregatedData}
                margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval={Math.ceil(aggregatedData.length / 10)}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    metric === 'count'
                      ? formatNumber(val, settings.numberSystem)
                      : formatCurrency(val, settings.currency, settings.numberSystem)
                  }
                />
                <Tooltip content={<CustomMainTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                <Line
                  name={
                    metric === 'count'
                      ? `${interval} Count`
                      : metric === 'totalAmount'
                      ? `${interval} Total Amount`
                      : `${interval} Avg Ticket`
                  }
                  type="monotone"
                  dataKey={metric}
                  stroke="#3563E9"
                  strokeWidth={2}
                  dot={interval !== 'daily'}
                  activeDot={{ r: 5 }}
                />
                {interval === 'daily' && show7MA && (
                  <Line
                    name="7-Day Moving Avg"
                    type="monotone"
                    dataKey={metric === 'count' ? 'movingAvgCount7' : 'movingAvgAmount7'}
                    stroke="#18A999"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
                {interval === 'daily' && show30MA && (
                  <Line
                    name="30-Day Moving Avg"
                    type="monotone"
                    dataKey={metric === 'count' ? 'movingAvgCount30' : 'movingAvgAmount30'}
                    stroke="#D99000"
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Supporting Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supporting Chart 1: Cumulative Transaction Value */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-base font-bold text-[#182230]">Cumulative Transaction Value</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregate cumulative gross amount processed over the selected duration.
            </p>
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3563E9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3563E9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  interval={Math.ceil(cumulativeData.length / 8)}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => formatCurrency(val, settings.currency, settings.numberSystem)}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatCurrency(Number(val), settings.currency, settings.numberSystem),
                    'Cumulative Total',
                  ]}
                  contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  name="Cumulative Amount"
                  type="monotone"
                  dataKey="cumulativeAmount"
                  stroke="#3563E9"
                  strokeWidth={2}
                  fill="url(#cumulGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supporting Chart 2: Period Growth Rate */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-base font-bold text-[#182230]">Period Growth Rate (% Change)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Period-over-period percentage expansion or contraction in {metric === 'count' ? 'volume' : 'value'}.
            </p>
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  interval={Math.ceil(growthData.length / 8)}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Growth Rate']}
                  contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar
                  dataKey="growthRate"
                  fill="#18A999"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
