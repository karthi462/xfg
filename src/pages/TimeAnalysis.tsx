import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { HourWeekdayHeatmap } from '../components/charts/HourWeekdayHeatmap';
import { CalendarHeatmap } from '../components/charts/CalendarHeatmap';
import { formatCurrency, formatNumber } from '../utils/dataProcessing';

export const TimeAnalysis: React.FC = () => {
  const { filteredTransactions, dailyAggregates, settings } = useDashboard();
  const [weekdayMetric, setWeekdayMetric] = useState<'count' | 'totalAmount' | 'avgAmount'>('count');

  // Weekday distribution aggregation
  const weekdayData = useMemo(() => {
    const days = [
      { name: 'Monday', dayIndex: 0, count: 0, totalAmount: 0 },
      { name: 'Tuesday', dayIndex: 1, count: 0, totalAmount: 0 },
      { name: 'Wednesday', dayIndex: 2, count: 0, totalAmount: 0 },
      { name: 'Thursday', dayIndex: 3, count: 0, totalAmount: 0 },
      { name: 'Friday', dayIndex: 4, count: 0, totalAmount: 0 },
      { name: 'Saturday', dayIndex: 5, count: 0, totalAmount: 0 },
      { name: 'Sunday', dayIndex: 6, count: 0, totalAmount: 0 },
    ];

    for (const t of filteredTransactions) {
      const d = new Date(t.timestamp);
      const utcDay = d.getUTCDay();
      const mappedIdx = (utcDay + 6) % 7; // 0 = Mon, 6 = Sun
      days[mappedIdx].count++;
      days[mappedIdx].totalAmount += t.amount;
    }

    return days.map(d => ({
      ...d,
      avgAmount: d.count > 0 ? Math.round(d.totalAmount / d.count) : 0,
    }));
  }, [filteredTransactions]);

  // Month-End Analysis: Beginning (1-10), Middle (11-20), End (21-31)
  const monthSegmentData = useMemo(() => {
    let begCount = 0;
    let begAmt = 0;
    let midCount = 0;
    let midAmt = 0;
    let endCount = 0;
    let endAmt = 0;

    for (const t of filteredTransactions) {
      const d = new Date(t.timestamp);
      const dayOfMonth = d.getUTCDate();

      if (dayOfMonth <= 10) {
        begCount++;
        begAmt += t.amount;
      } else if (dayOfMonth <= 20) {
        midCount++;
        midAmt += t.amount;
      } else {
        endCount++;
        endAmt += t.amount;
      }
    }

    return [
      {
        segment: 'Month Beginning (Days 1–10)',
        count: begCount,
        totalAmount: begAmt,
        avgAmount: begCount > 0 ? Math.round(begAmt / begCount) : 0,
        description: 'Rent, bill settlements & scheduled debits',
      },
      {
        segment: 'Month Mid-Period (Days 11–20)',
        count: midCount,
        totalAmount: midAmt,
        avgAmount: midCount > 0 ? Math.round(midAmt / midCount) : 0,
        description: 'Discretionary commerce & merchant payouts',
      },
      {
        segment: 'Month Close (Days 21–31)',
        count: endCount,
        totalAmount: endAmt,
        avgAmount: endCount > 0 ? Math.round(endAmt / endCount) : 0,
        description: 'Payroll disbursement & corporate invoice clearing',
      },
    ];
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
          Temporal Intelligence
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Discover recurring behavioral cycles across hourly windows, weekly patterns, and month-end cycles.
        </p>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* Heatmap 1: Hour of Day x Weekday */}
      <HourWeekdayHeatmap transactions={filteredTransactions} />

      {/* Heatmap 2: Calendar Heatmap */}
      <CalendarHeatmap data={dailyAggregates} />

      {/* 2-Column Row: Weekday Analysis & Month-End Segment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday Distribution Chart */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#182230]">Weekday Velocity Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparative workload between weekdays and weekends.
              </p>
            </div>

            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setWeekdayMetric('count')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  weekdayMetric === 'count'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setWeekdayMetric('totalAmount')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  weekdayMetric === 'totalAmount'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Total Value
              </button>
              <button
                onClick={() => setWeekdayMetric('avgAmount')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  weekdayMetric === 'avgAmount'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Avg Size
              </button>
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) =>
                    weekdayMetric === 'count'
                      ? formatNumber(val, settings.numberSystem)
                      : formatCurrency(val, settings.currency, settings.numberSystem)
                  }
                />
                <Tooltip
                  formatter={(val: any) => [
                    weekdayMetric === 'count'
                      ? formatNumber(Number(val), settings.numberSystem)
                      : formatCurrency(Number(val), settings.currency, settings.numberSystem),
                    weekdayMetric === 'count' ? 'Transactions' : 'Amount',
                  ]}
                  contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey={weekdayMetric} fill="#3563E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month-End Liquidity Segments */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#182230]">Month-Cycle Period Analysis</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical breakdown across Beginning (1–10), Mid (11–20), and Close (21–31).
            </p>
          </div>

          <div className="space-y-3.5 my-auto">
            {monthSegmentData.map((seg) => {
              const totalTurnover = monthSegmentData.reduce((acc, c) => acc + c.totalAmount, 0) || 1;
              const sharePct = Math.round((seg.totalAmount / totalTurnover) * 1000) / 10;

              return (
                <div key={seg.segment} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-1">
                    <span>{seg.segment}</span>
                    <span className="font-mono text-[#3563E9]">{sharePct}% of turnover</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{seg.description}</p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Volume</span>
                      <span className="font-semibold text-slate-800">
                        {formatNumber(seg.count, settings.numberSystem)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Total Value</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(seg.totalAmount, settings.currency, settings.numberSystem)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Avg Ticket</span>
                      <span className="font-semibold text-[#18A999]">
                        {formatCurrency(seg.avgAmount, settings.currency, settings.numberSystem)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
