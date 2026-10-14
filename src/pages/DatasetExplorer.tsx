import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  Database,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { validateAndParseTransactions, exportToCSV, formatNumber } from '../utils/dataProcessing';
import { DatasetQualityReport } from '../types';

export const DatasetExplorer: React.FC = () => {
  const {
    datasetName,
    isDemoDataset,
    allTransactions,
    lastReport,
    loadCustomDataset,
    regenerateDemoData,
    restoreDemoData,
    settings,
  } = useDashboard();

  const [isDragging, setIsDragging] = useState(false);
  const [parsingProgress, setParsingProgress] = useState<string | null>(null);
  const [rawUploadedData, setRawUploadedData] = useState<{
    fileName: string;
    headers: string[];
    rows: any[];
  } | null>(null);

  // Column mapping states
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    transaction_id: 'transaction_id',
    timestamp: 'timestamp',
    amount: 'amount',
    transaction_type: 'transaction_type',
    payment_mode: 'payment_mode',
    transaction_status: 'transaction_status',
    branch: 'branch',
    account_type: 'account_type',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File parsing handler
  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }

    setParsingProgress('Parsing CSV records...');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsingProgress(null);
        if (results.data && results.data.length > 0) {
          const headers = results.meta.fields || [];

          // Auto-detect matching headers
          const autoMap: Record<string, string> = {};
          const standardFields = [
            'transaction_id',
            'timestamp',
            'amount',
            'transaction_type',
            'payment_mode',
            'transaction_status',
            'branch',
            'account_type',
          ];

          standardFields.forEach((field) => {
            const match = headers.find(
              (h) =>
                h.toLowerCase() === field.toLowerCase() ||
                h.toLowerCase().replace(/[^a-z0-9]/g, '') === field.replace(/[^a-z0-9]/g, '')
            );
            if (match) autoMap[field] = match;
          });

          // Secondary heuristics
          if (!autoMap.timestamp) {
            const dateMatch = headers.find((h) => h.toLowerCase().includes('date') || h.toLowerCase().includes('time'));
            if (dateMatch) autoMap.timestamp = dateMatch;
          }
          if (!autoMap.amount) {
            const amtMatch = headers.find((h) => h.toLowerCase().includes('amount') || h.toLowerCase().includes('val'));
            if (amtMatch) autoMap.amount = amtMatch;
          }

          setColumnMapping((prev) => ({ ...prev, ...autoMap }));
          setRawUploadedData({
            fileName: file.name,
            headers,
            rows: results.data,
          });
        }
      },
      error: (err) => {
        setParsingProgress(null);
        alert(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleApplyImport = () => {
    if (!rawUploadedData) return;

    const { records, report } = validateAndParseTransactions(
      rawUploadedData.rows,
      columnMapping
    );

    if (records.length === 0) {
      alert('Validation failed: No valid records could be extracted with the selected column mapping.');
      return;
    }

    loadCustomDataset(rawUploadedData.fileName, records, report);
    setRawUploadedData(null);
  };

  const handleDownloadIssues = () => {
    if (!lastReport || !lastReport.issues.length) return;
    exportToCSV(`validation_issues_${Date.now()}.csv`, lastReport.issues);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight">
          Dataset Explorer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Import, inspect, validate, and analyze custom banking transaction datasets or generate fresh synthetic data.
        </p>
      </div>

      {/* Assumptions & Integrity Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-[#E6EAF0] text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#3563E9] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">Dataset Processing & Time Zone Invariants:</p>
          <p>
            Timestamps are parsed strictly in UTC to preserve temporal coherence across regional branches. Numeric amounts must be non-negative values. Missing optional fields (branch, category) default to standard placeholders rather than dropping rows.
          </p>
        </div>
      </div>

      {/* Upload Zone & Quick Generators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div className="lg:col-span-2 bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#182230]">Ingest Custom Banking CSV</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or drop an enterprise transaction CSV for validation and analytics ingestion.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#3563E9] bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              accept=".csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3563E9] flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {parsingProgress ? parsingProgress : 'Click to browse or drag & drop CSV'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports standard banking transaction schemas up to 50,000 records.
            </p>
          </div>
        </div>

        {/* Demo Dataset Controls */}
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#3563E9]" />
              <h3 className="text-base font-bold text-[#182230]">Synthetic Generator</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Regenerate 12,000 synthetic transaction records with realistic seasonality, hourly distributions, and regional branches.
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 mb-4 text-xs font-mono">
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Active Dataset:</span>
                <strong className="text-slate-900">{datasetName}</strong>
              </div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Loaded Records:</span>
                <strong className="text-slate-900">{formatNumber(allTransactions.length, settings.numberSystem)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Type:</span>
                <span className="text-[#3563E9] font-sans font-semibold">
                  {isDemoDataset ? 'Synthetic Demo Data' : 'Custom Upload'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={regenerateDemoData}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-[#3563E9] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate New Demo Dataset
            </button>

            {!isDemoDataset && (
              <button
                onClick={restoreDemoData}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Default Demo Dataset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Column Mapping Modal / Wizard (if CSV uploaded) */}
      {rawUploadedData && (
        <div className="bg-white border-2 border-[#3563E9] rounded-xl p-5 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#182230]">
                Column Mapping: {rawUploadedData.fileName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Map columns from your CSV to standard banking transaction fields ({rawUploadedData.rows.length.toLocaleString()} rows detected).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRawUploadedData(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyImport}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#3563E9] hover:bg-blue-600 rounded-lg shadow-xs"
              >
                <span>Validate & Ingest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'transaction_id', label: 'Transaction ID', req: false },
              { key: 'timestamp', label: 'Timestamp / Date', req: true },
              { key: 'amount', label: 'Transaction Amount', req: true },
              { key: 'transaction_type', label: 'Transaction Type', req: false },
              { key: 'payment_mode', label: 'Payment Mode', req: false },
              { key: 'transaction_status', label: 'Status', req: false },
              { key: 'branch', label: 'Branch Name', req: false },
              { key: 'account_type', label: 'Account Type', req: false },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {f.label} {f.req && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={columnMapping[f.key] || ''}
                  onChange={(e) =>
                    setColumnMapping((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E6EAF0] rounded-lg focus:outline-none focus:border-[#3563E9] focus:bg-white text-slate-800"
                >
                  <option value="">-- None / Default --</option>
                  {rawUploadedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Quality Report */}
      {lastReport && (
        <div className="bg-white border border-[#E6EAF0] rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#182230]">Ingestion Quality Audit</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary of data validation, missing values, duplicates, and unparseable records.
              </p>
            </div>

            {lastReport.issues.length > 0 && (
              <button
                onClick={handleDownloadIssues}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                Download Issue Log CSV
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Total Rows</span>
              <span className="text-lg font-bold font-mono text-slate-800">
                {formatNumber(lastReport.totalRows, settings.numberSystem)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] text-[#169B62] block font-medium">Valid Ingested</span>
              <span className="text-lg font-bold font-mono text-[#169B62]">
                {formatNumber(lastReport.validRows, settings.numberSystem)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-100">
              <span className="text-[11px] text-[#D64545] block font-medium">Invalid Dropped</span>
              <span className="text-lg font-bold font-mono text-[#D64545]">
                {formatNumber(lastReport.invalidRows, settings.numberSystem)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Duplicate IDs</span>
              <span className="text-lg font-bold font-mono text-slate-800">
                {formatNumber(lastReport.duplicateIdsCount, settings.numberSystem)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Invalid Timestamps</span>
              <span className="text-lg font-bold font-mono text-slate-800">
                {formatNumber(lastReport.invalidTimestampsCount, settings.numberSystem)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Invalid Amounts</span>
              <span className="text-lg font-bold font-mono text-slate-800">
                {formatNumber(lastReport.invalidAmountsCount, settings.numberSystem)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview Table */}
      <div className="bg-white border border-[#E6EAF0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#182230]">Active Dataset Records Preview</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              First 50 verified transaction records currently loaded in memory.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Timestamp (ISO)</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {allTransactions.slice(0, 50).map((t) => (
                <tr key={t.transaction_id} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-slate-900 font-medium">{t.transaction_id}</td>
                  <td className="py-2 px-3 text-slate-500">{t.timestamp}</td>
                  <td className="py-2 px-3 font-sans">{t.transaction_type}</td>
                  <td className="py-2 px-3 font-sans">{t.payment_mode}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {t.amount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-sans">{t.branch}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                        t.transaction_status === 'Successful'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.transaction_status === 'Failed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.transaction_status}
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
