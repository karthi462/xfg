import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
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
import { PAYMENT_MODES } from '../data/generateDemoData';
import { formatCurrency, formatNumber } from '../utils/dataProcessing';

const MODE_COLORS: Record<string, string> = {
  UPI: '#3563E9',
  'Debit Card': '#18A999',
  'Credit Card': '#14213D',
  'Net Banking': '#D99000',
  'Bank Transfer': '#8B5CF6',
  ATM: '#EC4899',
};

export const PaymentAnalytics: React.FC = () => {
  const { filteredTransactions, settings } = useDashboard();
  const [metric, setMetric] = useState<'count' | 'totalAmount' | 'avgAmount'>('count');

  // Stats grouped by payment mode
  const modeStats = useMemo(() => {
    const map = new Map<string, {
      mode: string;
      count: number;
      totalAmount: number;
      successful: number;
      failed: number;
      pending: number;
    }>();

    for (const m of PAYMENT_MODES) {
      map.set(m, {
        mode: m,
        count: 0,
        totalAmount: 0,
        successful: 0,
        failed: 0,
        pending: 0,
      });
    }

    for (const t of filteredTransactions) {
      let entry = map.get(t.payment_mode);
      if (!entry) {
        entry = {
          mode: t.payment_mode,
          count: 0,
          totalAmount: 0,
          successful: 0,
          failed: 0,
          pending: 0,
        };
        map.set(t.payment_mode, entry);
      }
      entry.count++;
      entry.totalAmount += t.amount;
      if (t.transaction_status === 'Successful') entry.successful++;
      else if (t.transaction_status === 'Failed') entry.failed++;
      else if (t.transaction_status === 'Pending') entry.pending++;
    }

    return Array.from(map.values())
      .filter(item => item.count > 0)
      .map(item => ({
        ...item,
        avgAmount: item.count > 0 ? Math.round(item.totalAmount / item.count) : 0,
        successRate: item.count > 0 ? Math.round((item.successful / item.count) * 1000) / 10 : 0,
        failureRate: item.count > 0 ? Math.round((item.failed / item.count) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b[metric] - a[metric]);
  }, [filteredTransactions, metric]);

  // Monthly breakdown by payment method for stacked area chart
  const monthlyModeTrend = useMemo(() => {
    const monthBuckets = new Map<string, Record<string, number>>();

    for (const t of filteredTransactions) {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      let b = monthBuckets.get(monthKey);
      if (!b) {
        b = {
          UPI: 0,
          'Debit Card': 0,
          'Credit Card': 0,
          'Net Banking': 0,
          'Bank Transfer': 0,
          ATM: 0,
        };
        monthBuckets.set(monthKey, b);
      }
      b[t.payment_mode] = (b[t.payment_mode] || 0) + (metric === 'count' ? 1 : t.amount);
    }

    const sortedMonths = Array.from(monthBuckets.keys()).sort();

    return sortedMonths.map((mKey) => {
      const [year, month] = mKey.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return {
        month: label,
        ...monthBuckets.get(mKey)!,
      };
    });
  }, [filteredTransactions, metric]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
          Payment Analytics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Channel utilization, clearing fidelity, and average settlement ticket size across payment rails.
        </p>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* Stacked Area Chart: Payment Rails Over Time */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#182230]">Payment Rails Volume Over Time</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly composition showing channel adoption and seasonal shifts.
            </p>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setMetric('count')}
              className={`px-3 py-1 rounded-md transition-colors ${
                metric === 'count' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Txn Count
            </button>
            <button
              onClick={() => setMetric('totalAmount')}
              className={`px-3 py-1 rounded-md transition-colors ${
                metric === 'totalAmount' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Total Amount
            </button>
          </div>
        </div>

        <div className="w-full h-[320px]">
          {monthlyModeTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No records match the active criteria.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyModeTrend} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
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
                <Tooltip
                  contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [
                    metric === 'count'
                      ? formatNumber(Number(val), settings.numberSystem)
                      : formatCurrency(Number(val), settings.currency, settings.numberSystem),
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                {PAYMENT_MODES.map((mode) => (
                  <Area
                    key={mode}
                    type="monotone"
                    dataKey={mode}
                    stackId="1"
                    stroke={MODE_COLORS[mode] || '#3563E9'}
                    fill={MODE_COLORS[mode] || '#3563E9'}
                    fillOpacity={0.65}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2-Column Row: Bar Comparison & Channel Fidelity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Amount Comparison Bar Chart */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#182230]">Average Settlement Size by Method</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of average monetary value processed per transaction channel.
            </p>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modeStats}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => formatCurrency(val, settings.currency, settings.numberSystem)}
                />
                <YAxis
                  dataKey="mode"
                  type="category"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(val: any) => [
                    formatCurrency(Number(val), settings.currency, settings.numberSystem),
                    'Average Ticket',
                  ]}
                  contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avgAmount" fill="#18A999" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Matrix Table */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3">
            <h3 className="text-base font-bold text-[#182230]">Channel Reliability & Volumes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Settlement success rate and failure rate by payment gateway type.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Success</th>
                  <th className="py-2.5 px-3 text-right">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {modeStats.map((item) => (
                  <tr key={item.mode} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: MODE_COLORS[item.mode] || '#3563E9' }}
                      />
                      <span>{item.mode}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatNumber(item.count, settings.numberSystem)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-semibold">
                      {formatCurrency(item.totalAmount, settings.currency, settings.numberSystem)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#169B62] font-semibold">
                      {item.successRate}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#D64545]">
                      {item.failureRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
