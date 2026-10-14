import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider } from './context/DashboardContext';
import { AppLayout } from './components/layout/AppLayout';
import { Overview } from './pages/Overview';
import { TransactionTrends } from './pages/TransactionTrends';
import { TimeAnalysis } from './pages/TimeAnalysis';
import { PaymentAnalytics } from './pages/PaymentAnalytics';
import { AnomalyAnalysis } from './pages/AnomalyAnalysis';
import { Forecasting } from './pages/Forecasting';
import { BranchAnalytics } from './pages/BranchAnalytics';
import { DatasetExplorer } from './pages/DatasetExplorer';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Navigate to="/" replace />} />
            <Route path="trends" element={<TransactionTrends />} />
            <Route path="time-analysis" element={<TimeAnalysis />} />
            <Route path="payments" element={<PaymentAnalytics />} />
            <Route path="anomalies" element={<AnomalyAnalysis />} />
            <Route path="forecasting" element={<Forecasting />} />
            <Route path="branches" element={<BranchAnalytics />} />
            <Route path="dataset" element={<DatasetExplorer />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}

export default App;
