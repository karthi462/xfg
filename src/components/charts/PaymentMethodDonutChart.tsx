import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { TransactionRecord } from '../../types';
import { formatNumber } from '../../utils/dataProcessing';
import { useDashboard } from '../../context/DashboardContext';

interface PaymentMethodDonutChartProps {
  transactions: TransactionRecord[];
}

const COLORS = [
  '#3563E9', // Primary Blue
  '#18A999', // Accent Teal
  '#14213D', // Primary Navy
  '#D99000', // Amber
  '#8B5CF6', // Purple
  '#169B62', // Green
  '#EC4899', // Pink
];

export const PaymentMethodDonutChart: React.FC<PaymentMethodDonutChartProps> = ({ transactions }) => {
  const { settings } = useDashboard();

  // Aggregate count by payment method
  const data = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of transactions) {
      counts[t.payment_mode] = (counts[t.payment_mode] || 0) + 1;
    }

    const total = transactions.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        value: count,
        percentage: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalCount = transactions.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#14213D] text-white p-2.5 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[150px]">
          <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
            {item.name}
          </p>
          <div className="flex justify-between items-center text-slate-300 font-mono">
            <span>Volume:</span>
            <span className="font-semibold text-white">{formatNumber(item.value, settings.numberSystem)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 font-mono">
            <span>Share:</span>
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
        <h3 className="text-base font-bold text-[#182230]">Payment Methods</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Channel distribution across total volume.
        </p>
      </div>

      <div className="relative w-full h-[220px] flex items-center justify-center">
        {totalCount === 0 ? (
          <div className="text-slate-400 text-xs">No records</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Total in center of donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg sm:text-xl font-bold text-slate-900 font-mono tabular-nums leading-none">
                {formatNumber(totalCount, settings.numberSystem)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                Total Txns
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-3 border-t border-slate-100 text-xs">
        {data.slice(0, 6).map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate pr-1">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-slate-700 truncate font-medium">{item.name}</span>
            </div>
            <span className="text-slate-500 font-mono tabular-nums text-[11px] shrink-0">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
