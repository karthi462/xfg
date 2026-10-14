# Banking Transaction Intelligence Dashboard — Advanced Time-Series Analytics

An enterprise-grade, responsive banking analytics platform designed for financial intelligence teams and time-series visualization. Built for the academic curriculum in **Advanced Data Visualization**.

---

## 1. Project Overview

The **Banking Transaction Intelligence Dashboard** provides executive and operational monitoring of multi-channel banking transactions. It combines time-series decomposition, temporal heatmaps, statistical anomaly detection (Rolling MAD & IQR), and seasonal exponential smoothing forecasting (Holt-Winters) over 12,000+ transaction records.

The interface adheres to modern fintech SaaS design principles: razor-sharp typography (`Plus Jakarta Sans` and `JetBrains Mono`), an intentional 60-30-10 color system, zero decorative clutter, and responsive tabular figures.

---

## 2. Key Features

- **Executive Overview Dashboard**: 6 real-time KPI metrics with period-over-period comparison, daily activity charts with 7-day moving averages, deposit vs withdrawal liquidity flows, payment method donut breakdown, and transaction status bars.
- **Dedicated Time-Series Trends**: Aggregations across Daily, Weekly, and Monthly boundaries with toggleable 7-day and 30-day moving averages, cumulative gross turnover curves, and period growth rate analysis.
- **Temporal Intelligence (Heatmaps)**:
  - 24-Hour × 7-Day Weekday interactive matrix with density color scaling, metric toggling (Volume, Gross Turnover, Average Ticket), and hover tooltips.
  - Monthly Calendar Heatmap with month-by-month navigation and zero-activity differentiation.
  - Weekday velocity distribution and 3-stage Month-End cycle segmentation (Days 1–10, 11–20, 21–31).
- **Payment Rail Analytics**: Stacked area volume transitions over time, average settlement sizes, and gateway reliability percentages across UPI, ATM, Cards, Net Banking, and Bank Transfers.
- **Statistical Anomaly Detection**:
  - Robust Rolling Median and Median Absolute Deviation (MAD) with normal consistency scaling ($1.4826 \times \text{MAD}$).
  - Interquartile Range (IQR) method with configurable sensitivity multiplier ($k = 2.0\times, 2.5\times, 3.0\times$).
  - Dynamic tolerance corridor, flagged outlier scatter overlays, and exportable audit log.
- **Time-Series Forecasting & Backtest Validation**:
  - Chronological 80/20 train/test split.
  - Models: Triple Exponential Smoothing (Holt-Winters Additive Seasonality), Seasonal Naive Baseline (7-Day Lag), and Holt's Linear Trend.
  - Out-of-sample holdout evaluation metrics: MAE, RMSE, and MAPE.
  - Horizon projection (+7, +14, +30 days) with 80% and 95% confidence bands.
- **Branch Performance Intelligence**: Regional branch comparison, gross turnover bars, monthly trajectory comparisons, and multi-column sortable ranking table.
- **Dataset Explorer**: PapaParse CSV ingestion with column mapping wizard, automated quality audit (missing values, invalid timestamps, duplicates), preview ledger, and synthetic data regenerator.
- **Executive Reports & Multi-Format Exports**: Formatted analytical brief ready for print/PDF export (`window.print()`), and CSV downloads for filtered transactions, daily aggregations, and anomaly logs.
- **Client Preferences & Settings**: Currency switcher (₹ INR, $ USD, € EUR, £ GBP), number notation (Indian Lakhs/Crores vs Western Millions), and local storage persistence.

---

## 3. Technology Stack

- **Framework**: React 19, TypeScript
- **Bundler & Build**: Vite 8
- **Styling**: Tailwind CSS v4, Plus Jakarta Sans, JetBrains Mono
- **Data Visualization**: Recharts, SVG/HTML Grid Heatmaps
- **Iconography**: Lucide React
- **CSV Engine**: PapaParse
- **Routing**: React Router DOM (v7)

---

## 4. Dataset Schema

Each transaction record conforms to the following schema:

| Field | Type | Description |
| :--- | :--- | :--- |
| `transaction_id` | string | Unique alphanumeric identifier (e.g., `TXN-20260314-001245`) |
| `timestamp` | string (ISO 8601) | UTC timestamp of transaction settlement |
| `date` | string (YYYY-MM-DD) | Calendar date for temporal indexing |
| `account_type` | enum | `Savings`, `Current`, `Salary`, `NRI` |
| `transaction_type` | enum | `Payment`, `Withdrawal`, `Deposit`, `Transfer` |
| `amount` | number | Monetary value (strictly non-negative) |
| `payment_mode` | enum | `UPI`, `Debit Card`, `Credit Card`, `Net Banking`, `Bank Transfer`, `ATM` |
| `branch` | string | Regional banking branch location |
| `transaction_status` | enum | `Successful`, `Failed`, `Pending` |

---

## 5. Statistical Methodology

### A. Anomaly Detection
1. **Rolling Median & MAD (Default)**:
   - Rolling 14-day window extracts median $M_t$.
   - $\text{MAD}_t = \text{median}(|x_i - M_t|)$.
   - Expected corridor: $[M_t - k \cdot 1.4826 \cdot \text{MAD}_t,\; M_t + k \cdot 1.4826 \cdot \text{MAD}_t]$.
   - Handled zero MAD by falling back to mean absolute deviations to prevent false positives.
2. **Interquartile Range (IQR)**:
   - $Q_1 = 25\text{th percentile}$, $Q_3 = 75\text{th percentile}$, $\text{IQR} = Q_3 - Q_1$.
   - Outlier condition: $x < Q_1 - k \cdot \text{IQR}$ or $x > Q_3 + k \cdot \text{IQR}$.

### B. Time-Series Forecasting
1. **Holt-Winters Additive Seasonality**:
   - Captures weekly 7-day cyclicality with level ($\alpha = 0.25$), trend ($\beta = 0.08$), and seasonal components ($\gamma = 0.35$).
   - Backtested against the holdout test set to report real out-of-sample MAE, RMSE, and MAPE.
2. **Seasonal Naive**:
   - Baseline lag model: $\hat{y}_{t+h} = y_{t+h-7k}$.
3. **Prediction Intervals**:
   - $80\%$ band: $\hat{y} \pm 1.28 \cdot \text{RMSE} \cdot \sqrt{h}$.
   - $95\%$ band: $\hat{y} \pm 1.96 \cdot \text{RMSE} \cdot \sqrt{h}$.

---

## 6. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```

---

## 7. Academic Verification & Project Evaluation

- **Synthetic Demo Data**: Labeled clearly as synthetic data generated for educational and analytical purposes.
- **Accurate Calculations**: KPI cards, period-over-period comparisons, moving averages, and heatmaps are derived directly from the active dataset.
- **CSV Ingestion**: Upload custom transaction files in the **Dataset Explorer** tab and map headers dynamically.
