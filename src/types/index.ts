export type TransactionType = 'Deposit' | 'Withdrawal' | 'Transfer' | 'Payment';
export type PaymentMode = 'UPI' | 'ATM' | 'Debit Card' | 'Credit Card' | 'Bank Transfer' | 'Net Banking';
export type TransactionStatus = 'Successful' | 'Failed' | 'Pending';
export type AccountType = 'Savings' | 'Current' | 'Salary' | 'NRI';

export interface TransactionRecord {
  transaction_id: string;
  timestamp: string; // ISO 8601
  date: string; // YYYY-MM-DD for fast grouping
  account_type: AccountType;
  transaction_type: TransactionType;
  amount: number;
  payment_mode: PaymentMode;
  branch: string;
  transaction_status: TransactionStatus;
  is_anomaly?: boolean;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  transactionType: string; // 'All' | TransactionType
  paymentMode: string; // 'All' | PaymentMode
  transactionStatus: string; // 'All' | TransactionStatus
  branch: string; // 'All' | branch name
  searchQuery?: string;
}

export interface AggregatedDay {
  date: string;
  displayDate: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  depositsAmount: number;
  withdrawalsAmount: number;
  transfersAmount: number;
  paymentsAmount: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  movingAvgCount7?: number;
  movingAvgAmount7?: number;
  movingAvgCount30?: number;
  movingAvgAmount30?: number;
}

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  dayName: string;
  hour: number; // 0 - 23
  count: number;
  totalAmount: number;
  avgAmount: number;
}

export interface AnomalyResult {
  date: string;
  observed: number;
  baseline: number;
  lowerBound: number;
  upperBound: number;
  deviation: number;
  isAnomaly: boolean;
  type: 'spike' | 'drop' | 'normal';
  method: string;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  fitted?: number;
  forecast?: number;
  lowerBound80?: number;
  upperBound80?: number;
  lowerBound95?: number;
  upperBound95?: number;
  isHistorical: boolean;
}

export interface ForecastEvaluation {
  mae: number;
  rmse: number;
  mape: number;
  trainCount: number;
  testCount: number;
  horizon: number;
  modelName: string;
}

export interface ValidationIssue {
  row: number;
  field: string;
  value: string;
  issue: string;
}

export interface DatasetQualityReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingValuesCount: number;
  duplicateIdsCount: number;
  invalidTimestampsCount: number;
  invalidAmountsCount: number;
  dateRange: { start: string; end: string } | null;
  issues: ValidationIssue[];
}

export interface AppSettings {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  numberSystem: 'indian' | 'western';
  defaultDatePreset: '30d' | '90d' | '180d' | 'all';
  defaultAggregation: 'daily' | 'weekly' | 'monthly';
}
