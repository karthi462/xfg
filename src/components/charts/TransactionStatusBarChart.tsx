import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { TransactionRecord } from '../../types';
import { formatNumber } from '../../utils/dataProcessing';
import { useDashboard } from '../../context/DashboardContext';

interface TransactionStatusBarChartProps {
  transactions: TransactionRecord[];
}

export const TransactionStatusBarChart: React.FC<TransactionStatusBarChartProps> = ({ transactions }) => {
  const { settings } = useDashboard();

  const data = React.useMemo(() => {
    let successful = 0;
    let failed = 0;
    let pending = 0;

    for (const t of transactions) {
      if (t.transaction_status === 'Successful') successful++;
      else if (t.transaction_status === 'Failed') failed++;
      else if (t.transaction_status === 'Pending') pending++;
    }

    const total = transactions.length || 1;

    return [
      {
        status: 'Successful',
        count: successful,
        percentage: Math.round((successful / total) * 1000) / 10,
        color: '#169B62',
      },
      {
        status: 'Pending',
        count: pending,
        percentage: Math.round((pending / total) * 1000) / 10,
        color: '#D99000',
      },
      {
        status: 'Failed',
        count: failed,
        percentage: Math.round((failed / total) * 1000) / 10,
        color: '#D64545',
      },
    ];
  }, [transactions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#14213D] text-white p-2.5 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[150px]">
          <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
            {item.status} Status
          </p>
          <div className="flex justify-between items-center text-slate-300 font-mono">
            <span>Count:</span>
            <span className="font-semibold text-white">{formatNumber(item.count, settings.numberSystem)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 font-mono">
            <span>Rate:</span>
            <span className="font-semibold text-teal-400">{item.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-base font-bold text-[#182230]">Transaction Status</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Execution success vs exception rates.
        </p>
      </div>

      <div className="w-full h-[220px]">
        {transactions.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No records
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="status"
                type="category"
                axisLine={false}
                tickLine={false}
                stroke="#64748B"
                fontSize={12}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Numerical breakdown with percentage bar */}
      <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
        {data.map((item) => (
          <div key={item.status} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-700 font-medium">{item.status}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-500 tabular-nums">
                {formatNumber(item.count, settings.numberSystem)} txns
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums min-w-[42px] text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
