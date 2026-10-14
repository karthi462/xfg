import React, { useState, useMemo } from 'react';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { TransactionRecord } from '../../types';
import { formatCurrency, exportToCSV } from '../../utils/dataProcessing';
import { useDashboard } from '../../context/DashboardContext';

interface TransactionTableProps {
  transactions: TransactionRecord[];
  title?: string;
  subtitle?: string;
}

type SortField = 'timestamp' | 'amount' | 'transaction_id' | 'branch';
type SortOrder = 'asc' | 'desc';

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  title = 'Recent Transactions',
  subtitle = 'Searchable and sortable transaction ledger derived from active filters.',
}) => {
  const { settings } = useDashboard();
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local search filter
  const filteredData = useMemo(() => {
    if (!tableSearch.trim()) return transactions;
    const q = tableSearch.toLowerCase();
    return transactions.filter(
      (t) =>
        t.transaction_id.toLowerCase().includes(q) ||
        t.branch.toLowerCase().includes(q) ||
        t.payment_mode.toLowerCase().includes(q) ||
        t.transaction_type.toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        t.transaction_status.toLowerCase().includes(q)
    );
  }, [transactions, tableSearch]);

  // Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = a.timestamp.localeCompare(b.timestamp);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'transaction_id') {
        comparison = a.transaction_id.localeCompare(b.transaction_id);
      } else if (sortField === 'branch') {
        comparison = a.branch.localeCompare(b.branch);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDownloadCSV = () => {
    const rowsToExport = filteredData.map(t => ({
      transaction_id: t.transaction_id,
      timestamp: t.timestamp,
      date: t.date,
      account_type: t.account_type,
      transaction_type: t.transaction_type,
      amount: t.amount,
      payment_mode: t.payment_mode,
      branch: t.branch,
      transaction_status: t.transaction_status,
    }));
    exportToCSV(`transactions_export_${Date.now()}.csv`, rowsToExport);
  };

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#182230]">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Table Search */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            title="Download currently filtered table data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('transaction_id')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Transaction ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('timestamp')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Date & Time (UTC)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Payment Method</th>
              <th
                onClick={() => handleSort('amount')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('branch')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Branch</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium text-slate-600">No transactions match the criteria</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((t) => {
                const dateObj = new Date(t.timestamp);
                const formattedTime = dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                }) + ' ' + dateObj.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'UTC',
                });

                // Status styling
                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-[#169B62]">
                    <CheckCircle2 className="w-3 h-3" />
                    Successful
                  </span>
                );
                if (t.transaction_status === 'Failed') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-[#D64545]">
                      <AlertCircle className="w-3 h-3" />
                      Failed
                    </span>
                  );
                } else if (t.transaction_status === 'Pending') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-[#D99000]">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  );
                }

                // High value indicator (> ₹1,00,000)
                const isHighValue = t.amount >= 100000;

                return (
                  <tr key={t.transaction_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 text-xs">
                      {t.transaction_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                      {formattedTime}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 font-medium">{t.transaction_type}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.payment_mode}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(t.amount, settings.currency, settings.numberSystem)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 truncate max-w-[160px]" title={t.branch}>
                      {t.branch}
                    </td>
                    <td className="py-3 px-4 text-center">{statusBadge}</td>
                    <td className="py-3 px-4 text-center">
                      {isHighValue ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700"
                          title="High-Value Transaction (≥ ₹1,00,000)"
                        >
                          <ShieldAlert className="w-2.5 h-2.5" />
                          High Value
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 sm:px-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 bg-slate-50 border border-[#E6EAF0] rounded-md text-slate-800 text-xs font-medium focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="ml-2 text-slate-400">
            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length.toLocaleString()} records
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md border border-[#E6EAF0] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono tabular-nums text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md border border-[#E6EAF0] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
