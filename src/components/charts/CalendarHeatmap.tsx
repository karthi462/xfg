import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AggregatedDay } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/dataProcessing';
import { useDashboard } from '../../context/DashboardContext';

interface CalendarHeatmapProps {
  data: AggregatedDay[];
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ data }) => {
  const { settings } = useDashboard();
  const [metric, setMetric] = useState<'count' | 'amount'>('count');

  // Map daily data by date string YYYY-MM-DD
  const dayLookup = useMemo(() => {
    const map = new Map<string, AggregatedDay>();
    for (const d of data) {
      map.set(d.date, d);
    }
    return map;
  }, [data]);

  // Available months and years
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const d of data) {
      months.add(d.date.substring(0, 7)); // YYYY-MM
    }
    return Array.from(months).sort();
  }, [data]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths[availableMonths.length - 1] || '2026-10';
  });

  // Calculate calendar days in selectedMonth
  const calendarDays = useMemo(() => {
    if (!selectedMonth) return [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const daysInMonth = lastDay.getUTCDate();

    // First day of week: 0 = Mon, 6 = Sun
    const startDayOfWeek = (firstDay.getUTCDay() + 6) % 7;

    const days = [];
    // Padding before 1st of month
    for (let p = 0; p < startDayOfWeek; p++) {
      days.push({ dayNum: null, dateStr: '', dayData: null });
    }

    // Actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        dateStr,
        dayData: dayLookup.get(dateStr) || null,
      });
    }

    return days;
  }, [selectedMonth, dayLookup]);

  // Max value for color scaling in this month
  const maxMonthVal = useMemo(() => {
    let max = 0;
    for (const item of calendarDays) {
      if (item.dayData) {
        const val = metric === 'count' ? item.dayData.count : item.dayData.totalAmount;
        if (val > max) max = val;
      }
    }
    return max || 1;
  }, [calendarDays, metric]);

  const getColor = (dayData: AggregatedDay | null) => {
    if (!dayData) return '#F8FAFC'; // No data / zero
    const val = metric === 'count' ? dayData.count : dayData.totalAmount;
    if (val === 0) return '#F1F5F9';

    const ratio = Math.min(1, val / maxMonthVal);
    if (ratio < 0.25) return '#C7D2FE'; // Indigo 200
    if (ratio < 0.50) return '#818CF8'; // Indigo 400
    if (ratio < 0.75) return '#4F46E5'; // Indigo 600
    return '#312E81'; // Indigo 900
  };

  // Navigating months
  const curMonthIndex = availableMonths.indexOf(selectedMonth);
  const handlePrevMonth = () => {
    if (curMonthIndex > 0) setSelectedMonth(availableMonths[curMonthIndex - 1]);
  };
  const handleNextMonth = () => {
    if (curMonthIndex < availableMonths.length - 1) setSelectedMonth(availableMonths[curMonthIndex + 1]);
  };

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#182230]">Calendar Activity Heatmap</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily banking activity plotted in a monthly calendar matrix.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Metric switcher */}
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

          {/* Month selector navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={handlePrevMonth}
              disabled={curMonthIndex <= 0}
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-40"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-slate-800 px-2 min-w-[110px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={curMonthIndex >= availableMonths.length - 1}
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-40"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="w-full">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-xs font-semibold text-slate-400">
          {dayHeaders.map((dh) => (
            <div key={dh} className="py-1">
              {dh}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((item, idx) => {
            if (!item.dayNum) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-16 rounded-lg bg-slate-50/50 border border-transparent"
                />
              );
            }

            const dayData = item.dayData;
            const hasData = !!dayData && dayData.count > 0;
            const bg = getColor(dayData);
            const isDark =
              hasData &&
              (metric === 'count' ? dayData.count : dayData.totalAmount) / maxMonthVal >= 0.5;

            return (
              <div
                key={item.dateStr}
                style={{ backgroundColor: bg }}
                className={`h-16 p-1.5 rounded-lg border border-slate-100 flex flex-col justify-between transition-transform duration-75 hover:scale-105 hover:shadow-md cursor-pointer group ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}
                title={
                  hasData
                    ? `${item.dateStr}: ${formatNumber(dayData.count, settings.numberSystem)} transactions (${formatCurrency(dayData.totalAmount, settings.currency, settings.numberSystem)})`
                    : `${item.dateStr}: 0 transactions recorded`
                }
              >
                <div className="flex justify-between items-center text-[11px] font-mono font-medium">
                  <span>{item.dayNum}</span>
                  {hasData && (
                    <span className={`text-[10px] ${isDark ? 'text-slate-200' : 'text-slate-500'}`}>
                      {formatNumber(dayData.count, settings.numberSystem)}
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-mono truncate text-right">
                  {hasData ? (
                    <span className={isDark ? 'text-indigo-200' : 'text-slate-600'}>
                      {formatCurrency(dayData.totalAmount, settings.currency, settings.numberSystem)}
                    </span>
                  ) : (
                    <span className="text-slate-300">0</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Activity Level:</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3 rounded-xs bg-[#F8FAFC] border border-slate-200" title="Zero activity" />
            <span className="w-3.5 h-3 rounded-xs bg-[#C7D2FE]" title="Low" />
            <span className="w-3.5 h-3 rounded-xs bg-[#818CF8]" title="Moderate" />
            <span className="w-3.5 h-3 rounded-xs bg-[#4F46E5]" title="High" />
            <span className="w-3.5 h-3 rounded-xs bg-[#312E81]" title="Peak" />
          </div>
        </div>
        <span className="text-[11px] text-slate-400">
          Showing active daily logs for {monthLabel}
        </span>
      </div>
    </div>
  );
};
