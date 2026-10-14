import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-[252px]'
        }`}
      >
        <TopNavbar onOpenMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Clean Enterprise Footer */}
        <footer className="py-4 px-6 border-t border-[#E6EAF0] bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Banking Intelligence Platform</span>
            <span>·</span>
            <span>Advanced Time-Series Analytics & Temporal Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Synthetic Demo Data (Academic Capstone)</span>
            <span>·</span>
            <span>v2.4.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
