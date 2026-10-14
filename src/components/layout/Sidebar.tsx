import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  CreditCard,
  ShieldAlert,
  LineChart,
  Building2,
  Database,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/trends', label: 'Transaction Trends', icon: TrendingUp },
  { path: '/time-analysis', label: 'Time Analysis', icon: Clock },
  { path: '/payments', label: 'Payment Analytics', icon: CreditCard },
  { path: '/anomalies', label: 'Anomaly Detection', icon: ShieldAlert },
  { path: '/forecasting', label: 'Forecasting', icon: LineChart },
  { path: '/branches', label: 'Branch Analytics', icon: Building2 },
  { path: '/dataset', label: 'Dataset Explorer', icon: Database },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#14213D] text-slate-200 transition-all duration-200 ease-in-out border-r border-slate-800/60 shadow-xl lg:shadow-none ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-[252px]'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3563E9] to-[#18A999] flex items-center justify-center text-white shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white tracking-tight truncate">
                  Banking Intelligence
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  Advanced Analytics Platform
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#3563E9] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-[#1D3557]/80 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle button on desktop */}
        <div className="hidden lg:flex items-center justify-end px-3 py-2 border-t border-slate-800/60">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Workspace Profile Card */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0f192e] shrink-0">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-slate-700/80 text-slate-300 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">
                  Data Analyst
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  Analytics Workspace
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
