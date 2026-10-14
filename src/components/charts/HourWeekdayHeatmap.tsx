import React, { useState, useMemo } from 'react';
import { TransactionRecord, HeatmapCell } from '../../types';
import { computeHourWeekdayHeatmap, formatCurrency, formatNumber } from '../../utils/dataProcessing';
import { useDashboard } from '../../context/DashboardContext';

interface HourWeekdayHeatmapProps {
  transactions: TransactionRecord[];
}

export const HourWeekdayHeatmap: React.FC<HourWeekdayHeatmapProps> = ({ transactions }) => {
  const { settings } = useDashboard();
  const [metric, setMetric] = useState<'count' | 'totalAmount' | 'avgAmount'>('count');
  const [hoveredCell, setHoveredCell] = useState<{
    cell: HeatmapCell;
    x: number;
    y: number;
  } | null>(null);

  // Compute 7 x 24 matrix
  const cells = useMemo(() => {
    return computeHourWeekdayHeatmap(transactions);
  }, [transactions]);

  // Find min and max for color scaling
  const { maxVal } = useMemo(() => {
    let max = 0;
    for (const c of cells) {
      const v = c[metric];
      if (v > max) max = v;
    }
    return { maxVal: max || 1 };
  }, [cells, metric]);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Color generator
  const getCellColor = (val: number) => {
    if (val === 0) return '#F8FAFC'; // Empty
    const ratio = Math.min(1, val / maxVal);
    // Smooth blue gradient: from light blue to deep navy
    if (ratio < 0.2) return '#DBEAFE'; // blue-100
    if (ratio < 0.4) return '#93C5FD'; // blue-300
    if (ratio < 0.6) return '#60A5FA'; // blue-400
    if (ratio < 0.8) return '#2563EB'; // blue-600
    return '#1E3A8A'; // blue-900
  };

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 sm:p-5 shadow-xs relative">
      {/* Title & Metric selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#182230]">Hour-of-Day × Weekday Heatmap</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal concentration matrix across 24 hourly intervals and 7 calendar days.
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setMetric('count')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              metric === 'count'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Count
          </button>
          <button
            onClick={() => setMetric('totalAmount')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              metric === 'totalAmount'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Total Amount
          </button>
          <button
            onClick={() => setMetric('avgAmount')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              metric === 'avgAmount'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Avg Amount
          </button>
        </div>
      </div>

      {/* Heatmap Matrix Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          {/* Hour headers */}
          <div className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 mb-1 text-[10px] text-slate-400 font-mono text-center">
            <div></div>
            {hours.map((h) => (
              <div key={h} className="truncate">
                {h % 3 === 0 ? `${String(h).padStart(2, '0')}:00` : ''}
              </div>
            ))}
          </div>

          {/* Days & Cells */}
          {dayNames.map((dayName, dIdx) => (
            <div
              key={dayName}
              className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 mb-1 items-center"
            >
              <span className="text-xs font-medium text-slate-600 truncate">{dayName}</span>
              {hours.map((h) => {
                const cellIndex = dIdx * 24 + h;
                const cell = cells[cellIndex];
                const val = cell ? cell[metric] : 0;
                const color = getCellColor(val);

                return (
                  <div
                    key={h}
                    style={{ backgroundColor: color }}
                    className="h-7 rounded-xs transition-transform duration-75 hover:scale-110 hover:ring-2 hover:ring-[#14213D] cursor-pointer"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        cell,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Scale Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Density Scale:</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Low</span>
            <div className="flex gap-0.5">
              <span className="w-4 h-3 rounded-xs bg-[#F8FAFC] border border-slate-200" />
              <span className="w-4 h-3 rounded-xs bg-[#DBEAFE]" />
              <span className="w-4 h-3 rounded-xs bg-[#93C5FD]" />
              <span className="w-4 h-3 rounded-xs bg-[#60A5FA]" />
              <span className="w-4 h-3 rounded-xs bg-[#2563EB]" />
              <span className="w-4 h-3 rounded-xs bg-[#1E3A8A]" />
            </div>
            <span className="text-[10px] text-slate-400">High</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Max peak cell:{' '}
          <strong className="text-slate-800">
            {metric === 'count'
              ? `${formatNumber(maxVal, settings.numberSystem)} txns`
              : formatCurrency(maxVal, settings.currency, settings.numberSystem)}
          </strong>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 bg-[#14213D] text-white p-2.5 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[170px]"
          style={{ left: `${hoveredCell.x}px`, top: `${hoveredCell.y}px` }}
        >
          <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
            {hoveredCell.cell.dayName} at {String(hoveredCell.cell.hour).padStart(2, '0')}:00
          </p>
          <div className="space-y-1 font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Count:</span>
              <span className="font-bold text-white">
                {formatNumber(hoveredCell.cell.count, settings.numberSystem)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="text-emerald-400">
                {formatCurrency(hoveredCell.cell.totalAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Average:</span>
              <span className="text-blue-300">
                {formatCurrency(hoveredCell.cell.avgAmount, settings.currency, settings.numberSystem)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
