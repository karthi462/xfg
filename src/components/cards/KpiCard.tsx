import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  changePct?: number | null;
  changeLabel?: string;
  isNeutralGood?: boolean; // if true, higher isn't necessarily good or bad
  isNegativeGood?: boolean; // e.g. for failed transactions, lower is good
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-[#3563E9]',
  iconBg = 'bg-blue-50',
  changePct,
  changeLabel = 'vs prev period',
  isNeutralGood = false,
  isNegativeGood = false,
}) => {
  let changeColor = 'text-slate-500';
  let ChangeIcon = Minus;

  if (changePct !== null && changePct !== undefined) {
    if (changePct > 0) {
      ChangeIcon = TrendingUp;
      if (isNeutralGood) {
        changeColor = 'text-slate-600';
      } else if (isNegativeGood) {
        changeColor = 'text-[#D64545]'; // Higher failed transactions is bad
      } else {
        changeColor = 'text-[#169B62]'; // Higher successful transactions is good
      }
    } else if (changePct < 0) {
      ChangeIcon = TrendingDown;
      if (isNeutralGood) {
        changeColor = 'text-slate-600';
      } else if (isNegativeGood) {
        changeColor = 'text-[#169B62]'; // Lower failed transactions is good
      } else {
        changeColor = 'text-[#D64545]'; // Lower volume / success is bad
      }
    }
  }

  return (
    <div className="bg-white border border-[#E6EAF0] rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all duration-150">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-[#697586] tracking-tight">{label}</span>
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl sm:text-3xl font-bold text-[#182230] font-mono tabular-nums tracking-tight">
          {value}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
        <span className="text-slate-500 truncate">{subtitle}</span>

        {changePct !== null && changePct !== undefined && (
          <div className={`flex items-center gap-1 font-semibold text-[11px] shrink-0 ${changeColor}`}>
            <ChangeIcon className="w-3 h-3" />
            <span className="tabular-nums">
              {changePct > 0 ? `+${changePct}%` : `${changePct}%`}
            </span>
            <span className="text-slate-400 font-normal hidden sm:inline">
              {changeLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
