import React, { useMemo } from 'react';
import { Filter, RotateCcw, Calendar, Search } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { PAYMENT_MODES, TRANSACTION_TYPES } from '../../data/generateDemoData';

interface GlobalFilterBarProps {
  showSearch?: boolean;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ showSearch = true }) => {
  const {
    filters,
    updateFilter,
    resetFilters,
    allTransactions,
    datasetDateRange,
  } = useDashboard();

  // Extract unique branches present in the current dataset
  const availableBranches = useMemo(() => {
    const branches = new Set<string>();
    for (const t of allTransactions) {
      if (t.branch) branches.add(t.branch);
    }
    return Array.from(branches).sort();
  }, [allTransactions]);

  // Format date range display
  const dateRangeDisplay = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return 'Full Range';
    const s = new Date(filters.startDate + 'T00:00:00Z');
    const e = new Date(filters.endDate + 'T00:00:00Z');
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`;
  }, [filters.startDate, filters.endDate]);

  // Calculate active filters count
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.transactionType !== 'All') count++;
    if (filters.paymentMode !== 'All') count++;
    if (filters.transactionStatus !== 'All') count++;
    if (filters.branch !== 'All') count++;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
    if (
      (filters.startDate && filters.startDate !== datasetDateRange.start) ||
      (filters.endDate && filters.endDate !== datasetDateRange.end)
    ) {
      count++;
    }
    return count;
  }, [filters, datasetDateRange]);

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl p-3.5 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            <Filter className="w-4 h-4 text-[#3563E9]" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#182230]">Global Dataset Filter</span>
            <span className="text-xs text-slate-500 ml-2">
              Viewing: <strong className="text-slate-700">{dateRangeDisplay}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          {activeCount > 0 && (
            <span className="text-xs font-semibold text-[#3563E9] bg-blue-50 px-2 py-0.5 rounded-md">
              {activeCount} active {activeCount === 1 ? 'filter' : 'filters'}
            </span>
          )}
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-3">
        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.startDate}
              min={datasetDateRange.start}
              max={filters.endDate || datasetDateRange.end}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              className="w-full text-xs font-mono px-2.5 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || datasetDateRange.start}
              max={datasetDateRange.end}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              className="w-full text-xs font-mono px-2.5 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Transaction Type
          </label>
          <select
            value={filters.transactionType}
            onChange={(e) => updateFilter('transactionType', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800"
          >
            <option value="All">All Types</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Payment Method
          </label>
          <select
            value={filters.paymentMode}
            onChange={(e) => updateFilter('paymentMode', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800"
          >
            <option value="All">All Methods</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Status
          </label>
          <select
            value={filters.transactionStatus}
            onChange={(e) => updateFilter('transactionStatus', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800"
          >
            <option value="All">All Statuses</option>
            <option value="Successful">Successful</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Branch
          </label>
          <select
            value={filters.branch}
            onChange={(e) => updateFilter('branch', e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800 truncate"
          >
            <option value="All">All Branches</option>
            {availableBranches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Search Query Bar */}
      {showSearch && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Branch name, or Keyword..."
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter('searchQuery', '')}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};
