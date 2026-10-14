import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Wallet,
  Calculator,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { KpiCard } from '../components/cards/KpiCard';
import { GlobalFilterBar } from '../components/filters/GlobalFilterBar';
import { ActivityLineChart } from '../components/charts/ActivityLineChart';
import { DepositWithdrawalChart } from '../components/charts/DepositWithdrawalChart';
import { PaymentMethodDonutChart } from '../components/charts/PaymentMethodDonutChart';
import { TransactionStatusBarChart } from '../components/charts/TransactionStatusBarChart';
import { TransactionTable } from '../components/tables/TransactionTable';
import { formatCurrency, formatNumber } from '../utils/dataProcessing';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const {
    filteredTransactions,
    dailyAggregates,
    kpis,
    settings,
    refreshActiveData,
    isRefreshing,
  } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
            Banking Intelligence
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor transaction trends, understand financial activity, and explore time-based patterns.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#3563E9] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Report
          </button>

          <button
            onClick={refreshActiveData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E6EAF0] rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#3563E9]' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Total Transactions */}
        <KpiCard
          label="Total Transactions"
          value={formatNumber(kpis.totalCount, settings.numberSystem)}
          subtitle="Processed volume"
          icon={Activity}
          iconColor="text-[#3563E9]"
          iconBg="bg-blue-50"
          changePct={kpis.prevPeriodComparisons.countChangePct}
          isNeutralGood={true}
        />

        {/* Card 2: Total Transaction Value */}
        <KpiCard
          label="Total Transaction Value"
          value={formatCurrency(kpis.totalAmount, settings.currency, settings.numberSystem)}
          subtitle="Gross turnover"
          icon={Wallet}
          iconColor="text-[#18A999]"
          iconBg="bg-teal-50"
          changePct={kpis.prevPeriodComparisons.amountChangePct}
          isNeutralGood={true}
        />

        {/* Card 3: Average Transaction Value */}
        <KpiCard
          label="Average Ticket Size"
          value={formatCurrency(kpis.avgAmount, settings.currency, settings.numberSystem)}
          subtitle="Mean per transaction"
          icon={Calculator}
          iconColor="text-[#14213D]"
          iconBg="bg-slate-100"
          changePct={kpis.prevPeriodComparisons.avgChangePct}
          isNeutralGood={true}
        />

        {/* Card 4: Successful Transactions */}
        <KpiCard
          label="Successful Rate"
          value={`${kpis.successRate}%`}
          subtitle="Settlement fidelity"
          icon={CheckCircle2}
          iconColor="text-[#169B62]"
          iconBg="bg-emerald-50"
          changePct={kpis.prevPeriodComparisons.successRateChangePct}
        />

        {/* Card 5: Failed Transactions */}
        <KpiCard
          label="Failed Transactions"
          value={formatNumber(kpis.failedCount, settings.numberSystem)}
          subtitle={`${kpis.failedRate}% failure rate`}
          icon={AlertCircle}
          iconColor="text-[#D64545]"
          iconBg="bg-rose-50"
          isNegativeGood={true}
        />

        {/* Card 6: Flagged Anomalies */}
        <KpiCard
          label="Flagged Outliers"
          value={formatNumber(kpis.flaggedAnomaliesCount, settings.numberSystem)}
          subtitle="Statistical spikes/drops"
          icon={ShieldAlert}
          iconColor="text-[#D99000]"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Main Charts: 2-Column Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityLineChart data={dailyAggregates} />
        <DepositWithdrawalChart data={dailyAggregates} />
      </div>

      {/* Secondary Charts: 2-Column Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentMethodDonutChart transactions={filteredTransactions} />
        <TransactionStatusBarChart transactions={filteredTransactions} />
      </div>

      {/* Recent Transactions Table */}
      <TransactionTable transactions={filteredTransactions} />
    </div>
  );
};
