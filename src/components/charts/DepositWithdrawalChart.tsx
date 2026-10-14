import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AggregatedDay } from '../../types';
import { formatCurrency } from '../../utils/dataProcessing';
import { useDashboard } from '../../context/DashboardContext';

interface DepositWithdrawalChartProps {
  data: AggregatedDay[];
}

export const DepositWithdrawalChart: React.FC<DepositWithdrawalChartProps> = ({ data }) => {
  const { settings } = useDashboard();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as AggregatedDay;
      const netFlow = d.depositsAmount - d.withdrawalsAmount;
      return (
        <div className="bg-[#14213D] text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[210px]">
          <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-2">
            {d.date} ({d.displayDate})
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#169B62]" />
                Deposits:
              </span>
              <span className="font-semibold text-emerald-400">
                {formatCurrency(d.depositsAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D64545]" />
                Withdrawals:
              </span>
              <span className="font-semibold text-rose-400">
                {formatCurrency(d.withdrawalsAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
              <span>Net Liquidity:</span>
              <span className={`font-semibold ${netFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {netFlow >= 0 ? '+' : ''}
                {formatCurrency(netFlow, settings.currency, settings.numberSystem)}
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#182230]">Deposits vs Withdrawals</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal liquidity inflow and outflow volume comparison.
          </p>
        </div>
      </div>

      <div className="w-full h-[280px] sm:h-[320px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No transaction records available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#169B62" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#169B62" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="withdrawGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D64545" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D64545" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(val) => formatCurrency(val, settings.currency, settings.numberSystem)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Area
                name="Deposits"
                type="monotone"
                dataKey="depositsAmount"
                stroke="#169B62"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#depositGrad)"
              />
              <Area
                name="Withdrawals"
                type="monotone"
                dataKey="withdrawalsAmount"
                stroke="#D64545"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#withdrawGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
