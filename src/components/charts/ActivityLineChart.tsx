import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AggregatedDay } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/dataProcessing';
import { useDashboard } from '../../context/DashboardContext';

interface ActivityLineChartProps {
  data: AggregatedDay[];
}

export const ActivityLineChart: React.FC<ActivityLineChartProps> = ({ data }) => {
  const { settings } = useDashboard();
  const [metric, setMetric] = useState<'count' | 'amount'>('count');
  const [showMovingAvg, setShowMovingAvg] = useState(true);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as AggregatedDay;
      return (
        <div className="bg-[#14213D] text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[190px]">
          <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-2">
            {d.date} ({d.displayDate})
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3563E9]" />
                Daily Count:
              </span>
              <span className="font-semibold text-white">{formatNumber(d.count, settings.numberSystem)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#18A999]" />
                7-Day Avg Count:
              </span>
              <span className="text-white">{d.movingAvgCount7 ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
              <span>Total Volume:</span>
              <span className="font-semibold text-emerald-400">
                {formatCurrency(d.totalAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#182230]">Transaction Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily transaction volume and smoothed 7-day trend line.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Metric Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setMetric('count')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                metric === 'count'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Txn Count
            </button>
            <button
              onClick={() => setMetric('amount')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                metric === 'amount'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Txn Amount
            </button>
          </div>

          {/* Toggle MA */}
          <button
            onClick={() => setShowMovingAvg(!showMovingAvg)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              showMovingAvg
                ? 'bg-teal-50 border-teal-200 text-[#18A999]'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle 7-day moving average"
          >
            7-Day MA
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[280px] sm:h-[320px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No transaction records available for this date range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="displayDate"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={Math.ceil(data.length / 8)}
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
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Line
                name={metric === 'count' ? 'Daily Transactions' : 'Daily Amount'}
                type="monotone"
                dataKey={metric === 'count' ? 'count' : 'totalAmount'}
                stroke="#3563E9"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#3563E9' }}
              />
              {showMovingAvg && (
                <Line
                  name={metric === 'count' ? '7-Day Moving Avg (Count)' : '7-Day Moving Avg (Amount)'}
                  type="monotone"
                  dataKey={metric === 'count' ? 'movingAvgCount7' : 'movingAvgAmount7'}
                  stroke="#18A999"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
