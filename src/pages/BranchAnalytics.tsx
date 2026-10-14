import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Building2, ArrowUpDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { formatCurrency, formatNumber } from '../utils/dataProcessing';

type SortKey = 'count' | 'totalAmount' | 'avgAmount' | 'successRate';

export const BranchAnalytics: React.FC = () => {
  const { filteredTransactions, settings } = useDashboard();

  // All distinct branches in current dataset
  const allBranches = useMemo(() => {
    const s = new Set<string>();
    for (const t of filteredTransactions) {
      if (t.branch) s.add(t.branch);
    }
    return Array.from(s).sort();
  }, [filteredTransactions]);

  // Selected branches multi-filter (default: all)
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('totalAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleBranch = (b: string) => {
    if (selectedBranches.includes(b)) {
      setSelectedBranches(selectedBranches.filter(item => item !== b));
    } else {
      setSelectedBranches([...selectedBranches, b]);
    }
  };

  // Filter transactions by selected branches
  const branchFilteredTxns = useMemo(() => {
    if (selectedBranches.length === 0) return filteredTransactions;
    return filteredTransactions.filter(t => selectedBranches.includes(t.branch));
  }, [filteredTransactions, selectedBranches]);

  // Aggregate stats by branch
  const branchStats = useMemo(() => {
    const map = new Map<string, {
      branch: string;
      count: number;
      totalAmount: number;
      successful: number;
      failed: number;
      pending: number;
    }>();

    for (const t of branchFilteredTxns) {
      let b = map.get(t.branch);
      if (!b) {
        b = {
          branch: t.branch,
          count: 0,
          totalAmount: 0,
          successful: 0,
          failed: 0,
          pending: 0,
        };
        map.set(t.branch, b);
      }
      b.count++;
      b.totalAmount += t.amount;
      if (t.transaction_status === 'Successful') b.successful++;
      else if (t.transaction_status === 'Failed') b.failed++;
      else if (t.transaction_status === 'Pending') b.pending++;
    }

    const list = Array.from(map.values()).map(b => ({
      ...b,
      avgAmount: b.count > 0 ? Math.round(b.totalAmount / b.count) : 0,
      successRate: b.count > 0 ? Math.round((b.successful / b.count) * 1000) / 10 : 0,
      failureRate: b.count > 0 ? Math.round((b.failed / b.count) * 1000) / 10 : 0,
    }));

    return list.sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDirection === 'asc' ? diff : -diff;
    });
  }, [branchFilteredTxns, sortKey, sortDirection]);

  // Monthly branch progression
  const monthlyBranchData = useMemo(() => {
    const monthMap = new Map<string, Record<string, number>>();

    for (const t of branchFilteredTxns) {
      const mKey = t.date.substring(0, 7);
      let entry = monthMap.get(mKey);
      if (!entry) {
        entry = {};
        monthMap.set(mKey, entry);
      }
      entry[t.branch] = (entry[t.branch] || 0) + t.amount;
    }

    const sortedMonths = Array.from(monthMap.keys()).sort();
    return sortedMonths.map(mKey => {
      const [year, month] = mKey.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return {
        month: label,
        ...monthMap.get(mKey),
      };
    });
  }, [branchFilteredTxns]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const BRANCH_COLORS = ['#3563E9', '#18A999', '#14213D', '#D99000', '#8B5CF6', '#169B62', '#EC4899', '#0EA5E9'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
          Branch Performance
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Compare transaction velocity, settlement ticket sizes, and execution reliability across regional branches.
        </p>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* Multi-Branch Selector Filter Chips */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900">Filter By Specific Branches</span>
          {selectedBranches.length > 0 && (
            <button
              onClick={() => setSelectedBranches([])}
              className="text-xs text-[#3563E9] font-medium hover:underline"
            >
              Reset to All Branches ({allBranches.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allBranches.map((b) => {
            const isSelected = selectedBranches.includes(b);
            return (
              <button
                key={b}
                onClick={() => toggleBranch(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#14213D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Charts: Total Volume vs Gross Amount */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Transaction Count Bar */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#182230]">Branch Transaction Volume</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Total transaction counts processed by individual regional branches.
            </p>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchStats}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="branch"
                  type="category"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any) => [formatNumber(Number(val), settings.numberSystem), 'Transactions']}
                  contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3563E9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Total Amount Bar */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#182230]">Branch Gross Turnover</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregate monetary volume cleared through each branch.
            </p>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchStats}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
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
                  dataKey="branch"
                  type="category"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), settings.currency, settings.numberSystem), 'Gross Turnover']}
                  contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="totalAmount" fill="#18A999" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Branch Trajectory Line Chart */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#182230]">Monthly Branch Turnover Trends</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal expansion and comparative regional velocity over consecutive months.
          </p>
        </div>

        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyBranchData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val, settings.currency, settings.numberSystem)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#14213D', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val), settings.currency, settings.numberSystem),
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
              {(selectedBranches.length > 0 ? selectedBranches : allBranches).map((bName, idx) => (
                <Line
                  key={bName}
                  type="monotone"
                  dataKey={bName}
                  stroke={BRANCH_COLORS[idx % BRANCH_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Ranking Table */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#182230]">Branch Performance Ranking</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sortable matrix of volume, turnover, average transaction size, and settlement fidelity.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Branch Location</th>
                <th
                  onClick={() => handleSort('count')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Transaction Count</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalAmount')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgAmount')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Average Ticket</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('successRate')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Success Rate</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {branchStats.map((b) => (
                <tr key={b.branch} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#3563E9]" />
                    <span>{b.branch}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {formatNumber(b.count, settings.numberSystem)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(b.totalAmount, settings.currency, settings.numberSystem)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#18A999] font-semibold">
                    {formatCurrency(b.avgAmount, settings.currency, settings.numberSystem)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#169B62]">
                      <CheckCircle2 className="w-3 h-3" />
                      {b.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
