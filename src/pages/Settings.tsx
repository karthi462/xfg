import React, { useState } from 'react';
import { Settings as SettingsIcon, RotateCcw, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const Settings: React.FC = () => {
  const { settings, updateSettings, restoreDemoData, isDemoDataset } = useDashboard();
  const [showResetModal, setShowResetModal] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (changes: Partial<typeof settings>) => {
    updateSettings(changes);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleConfirmReset = () => {
    restoreDemoData();
    setShowResetModal(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
          Settings & Configurations
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Customize currency presentation, numerical groupings, default temporal horizons, and data storage.
        </p>
      </div>

      {savedFeedback && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          Settings updated successfully and persisted to client workspace.
        </div>
      )}

      {/* Preferences Form */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-xs space-y-6">
        {/* Currency Unit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Currency Denomination</span>
            <span className="text-xs text-slate-500">
              Select the primary monetary symbol applied across all dashboard financial aggregates.
            </span>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            {[
              { code: 'INR', label: '₹ INR' },
              { code: 'USD', label: '$ USD' },
              { code: 'EUR', label: '€ EUR' },
              { code: 'GBP', label: '£ GBP' },
            ].map((c) => (
              <button
                key={c.code}
                onClick={() => handleSave({ currency: c.code as any })}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  settings.currency === c.code
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number Formatting System */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Numbering System</span>
            <span className="text-xs text-slate-500">
              Indian notation uses Lakhs & Crores (e.g. ₹12,45,000), while Western uses Millions (e.g. ₹1,245,000).
            </span>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => handleSave({ numberSystem: 'indian' })}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                settings.numberSystem === 'indian'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Indian (Lakhs/Crores)
            </button>
            <button
              onClick={() => handleSave({ numberSystem: 'western' })}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                settings.numberSystem === 'western'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Western (Millions)
            </button>
          </div>
        </div>

        {/* Default Aggregation Interval */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Default Temporal Aggregation</span>
            <span className="text-xs text-slate-500">
              Primary grouping interval applied when opening time-series visualizations.
            </span>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            {(['daily', 'weekly', 'monthly'] as const).map((inter) => (
              <button
                key={inter}
                onClick={() => handleSave({ defaultAggregation: inter })}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  settings.defaultAggregation === inter
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {inter}
              </button>
            ))}
          </div>
        </div>

        {/* Default Date Range Preset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Default Date Window</span>
            <span className="text-xs text-slate-500">
              Initial observation window loaded upon launching the platform.
            </span>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            {[
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: '180d', label: '180 Days' },
              { key: 'all', label: 'Full Year' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => handleSave({ defaultDatePreset: p.key as any })}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  settings.defaultDatePreset === p.key
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Reset Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <span className="text-sm font-bold text-rose-700 block">Dataset Reset & Restore</span>
            <span className="text-xs text-slate-500">
              Discard any custom uploaded CSV dataset and revert back to the verified baseline synthetic dataset.
            </span>
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Dataset
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 mb-3 text-amber-600">
              <div className="p-2 rounded-lg bg-amber-50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reset to Demo Dataset?</h3>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              This action will clear all current custom in-memory transaction records and reinitialize the workspace with the bundled 12,000 synthetic banking records. Are you sure you want to proceed?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                Yes, Reset Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
