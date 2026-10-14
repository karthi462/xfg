import {
  TransactionRecord,
  FilterState,
  AggregatedDay,
  HeatmapCell,
  AnomalyResult,
  ForecastPoint,
  ForecastEvaluation,
  DatasetQualityReport,
  ValidationIssue,
  PaymentMode,
  TransactionType,
  TransactionStatus,
  AccountType,
} from '../types';

/**
 * Currency and Number Formatting
 */
export function formatCurrency(
  val: number | null | undefined,
  currency: string = 'INR',
  numberSystem: 'indian' | 'western' = 'indian'
): string {
  if (val === null || val === undefined || isNaN(val)) return '—';

  const symbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const sym = symbolMap[currency] || '₹';

  if (numberSystem === 'indian' && currency === 'INR') {
    // Format in Indian numbering system (e.g. 12,45,000)
    const isNegative = val < 0;
    const absVal = Math.round(Math.abs(val));
    const valStr = absVal.toString();

    let result = '';
    if (valStr.length <= 3) {
      result = valStr;
    } else {
      const lastThree = valStr.substring(valStr.length - 3);
      const otherNumbers = valStr.substring(0, valStr.length - 3);
      const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      result = withCommas + ',' + lastThree;
    }

    return `${isNegative ? '-' : ''}${sym}${result}`;
  } else {
    // Western standard locale
    return `${sym}${Math.round(val).toLocaleString('en-US')}`;
  }
}

export function formatNumber(val: number | null | undefined, numberSystem: 'indian' | 'western' = 'indian'): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  if (numberSystem === 'indian') {
    const isNegative = val < 0;
    const absVal = Math.round(Math.abs(val));
    const valStr = absVal.toString();
    if (valStr.length <= 3) return (isNegative ? '-' : '') + valStr;
    const lastThree = valStr.substring(valStr.length - 3);
    const otherNumbers = valStr.substring(0, valStr.length - 3);
    const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (isNegative ? '-' : '') + withCommas + ',' + lastThree;
  }
  return Math.round(val).toLocaleString('en-US');
}

/**
 * Filter transactions based on active filter criteria
 */
export function filterTransactions(
  transactions: TransactionRecord[],
  filter: FilterState
): TransactionRecord[] {
  const { startDate, endDate, transactionType, paymentMode, transactionStatus, branch, searchQuery } = filter;

  return transactions.filter((t) => {
    // Date bounds (inclusive)
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;

    // Categorical matches
    if (transactionType && transactionType !== 'All' && t.transaction_type !== transactionType) return false;
    if (paymentMode && paymentMode !== 'All' && t.payment_mode !== paymentMode) return false;
    if (transactionStatus && transactionStatus !== 'All' && t.transaction_status !== transactionStatus) return false;
    if (branch && branch !== 'All' && t.branch !== branch) return false;

    // Search query matches transaction ID, branch, or mode
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        t.transaction_id.toLowerCase().includes(q) ||
        t.branch.toLowerCase().includes(q) ||
        t.payment_mode.toLowerCase().includes(q) ||
        t.transaction_type.toLowerCase().includes(q) ||
        t.amount.toString().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Aggregate transactions by day with 7-day and 30-day moving averages
 */
export function aggregateByDay(transactions: TransactionRecord[]): AggregatedDay[] {
  if (!transactions.length) return [];

  const dayMap = new Map<string, {
    count: number;
    totalAmount: number;
    depositsAmount: number;
    withdrawalsAmount: number;
    transfersAmount: number;
    paymentsAmount: number;
    successfulCount: number;
    failedCount: number;
    pendingCount: number;
  }>();

  for (const t of transactions) {
    let day = dayMap.get(t.date);
    if (!day) {
      day = {
        count: 0,
        totalAmount: 0,
        depositsAmount: 0,
        withdrawalsAmount: 0,
        transfersAmount: 0,
        paymentsAmount: 0,
        successfulCount: 0,
        failedCount: 0,
        pendingCount: 0,
      };
      dayMap.set(t.date, day);
    }

    day.count += 1;
    day.totalAmount += t.amount;

    if (t.transaction_type === 'Deposit') day.depositsAmount += t.amount;
    else if (t.transaction_type === 'Withdrawal') day.withdrawalsAmount += t.amount;
    else if (t.transaction_type === 'Transfer') day.transfersAmount += t.amount;
    else if (t.transaction_type === 'Payment') day.paymentsAmount += t.amount;

    if (t.transaction_status === 'Successful') day.successfulCount += 1;
    else if (t.transaction_status === 'Failed') day.failedCount += 1;
    else if (t.transaction_status === 'Pending') day.pendingCount += 1;
  }

  // Sort by date ascending
  const sortedDates = Array.from(dayMap.keys()).sort();

  const days: AggregatedDay[] = sortedDates.map((dateStr) => {
    const data = dayMap.get(dateStr)!;
    // Format display date: "14 Oct"
    const d = new Date(dateStr + 'T00:00:00Z');
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

    return {
      date: dateStr,
      displayDate,
      count: data.count,
      totalAmount: data.totalAmount,
      avgAmount: data.count > 0 ? Math.round(data.totalAmount / data.count) : 0,
      depositsAmount: data.depositsAmount,
      withdrawalsAmount: data.withdrawalsAmount,
      transfersAmount: data.transfersAmount,
      paymentsAmount: data.paymentsAmount,
      successfulCount: data.successfulCount,
      failedCount: data.failedCount,
      pendingCount: data.pendingCount,
    };
  });

  // Calculate 7-day and 30-day moving averages
  for (let i = 0; i < days.length; i++) {
    // 7-day window [i - 6, i]
    const window7Start = Math.max(0, i - 6);
    const window7 = days.slice(window7Start, i + 1);
    const sumCount7 = window7.reduce((acc, curr) => acc + curr.count, 0);
    const sumAmt7 = window7.reduce((acc, curr) => acc + curr.totalAmount, 0);
    days[i].movingAvgCount7 = Math.round((sumCount7 / window7.length) * 10) / 10;
    days[i].movingAvgAmount7 = Math.round(sumAmt7 / window7.length);

    // 30-day window [i - 29, i]
    if (days.length >= 30) {
      const window30Start = Math.max(0, i - 29);
      const window30 = days.slice(window30Start, i + 1);
      const sumCount30 = window30.reduce((acc, curr) => acc + curr.count, 0);
      const sumAmt30 = window30.reduce((acc, curr) => acc + curr.totalAmount, 0);
      days[i].movingAvgCount30 = Math.round((sumCount30 / window30.length) * 10) / 10;
      days[i].movingAvgAmount30 = Math.round(sumAmt30 / window30.length);
    }
  }

  return days;
}

export interface IntervalDataPoint {
  label: string;
  date: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
  depositsAmount: number;
  withdrawalsAmount: number;
  movingAvgCount7?: number;
  movingAvgAmount7?: number;
  movingAvgCount30?: number;
  movingAvgAmount30?: number;
}

/**
 * Aggregate daily data into Weekly or Monthly intervals
 */
export function aggregateByInterval(
  daily: AggregatedDay[],
  interval: 'daily' | 'weekly' | 'monthly'
): IntervalDataPoint[] {
  if (interval === 'daily') {
    return daily.map(d => ({
      label: d.displayDate,
      date: d.date,
      count: d.count,
      totalAmount: d.totalAmount,
      avgAmount: d.avgAmount,
      depositsAmount: d.depositsAmount,
      withdrawalsAmount: d.withdrawalsAmount,
      movingAvgCount7: d.movingAvgCount7,
      movingAvgAmount7: d.movingAvgAmount7,
      movingAvgCount30: d.movingAvgCount30,
      movingAvgAmount30: d.movingAvgAmount30,
    }));
  }

  const buckets = new Map<string, {
    date: string;
    count: number;
    totalAmount: number;
    depositsAmount: number;
    withdrawalsAmount: number;
  }>();

  for (const day of daily) {
    let key: string;
    if (interval === 'monthly') {
      key = day.date.substring(0, 7); // YYYY-MM
    } else {
      // Weekly: Group into Monday-based weeks
      const d = new Date(day.date + 'T00:00:00Z');
      const dayOfWeek = d.getUTCDay();
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(d.getTime() - diffToMonday * 86400000);
      key = monday.toISOString().split('T')[0];
    }

    let b = buckets.get(key);
    if (!b) {
      b = {
        date: key,
        count: 0,
        totalAmount: 0,
        depositsAmount: 0,
        withdrawalsAmount: 0,
      };
      buckets.set(key, b);
    }
    b.count += day.count;
    b.totalAmount += day.totalAmount;
    b.depositsAmount += day.depositsAmount;
    b.withdrawalsAmount += day.withdrawalsAmount;
  }

  const sortedKeys = Array.from(buckets.keys()).sort();

  return sortedKeys.map(key => {
    const b = buckets.get(key)!;
    let label = key;
    if (interval === 'monthly') {
      const [year, month] = key.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
      const d = new Date(key + 'T00:00:00Z');
      label = `Wk ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
    }

    return {
      label,
      date: key,
      count: b.count,
      totalAmount: b.totalAmount,
      avgAmount: b.count > 0 ? Math.round(b.totalAmount / b.count) : 0,
      depositsAmount: b.depositsAmount,
      withdrawalsAmount: b.withdrawalsAmount,
    };
  });
}

/**
 * 24 Hours x 7 Weekdays Heatmap Matrix
 */
export function computeHourWeekdayHeatmap(transactions: TransactionRecord[]): HeatmapCell[] {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const grid: HeatmapCell[] = [];

  // Initialize 7 x 24 cells
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid.push({
        dayOfWeek: d,
        dayName: dayNames[d],
        hour: h,
        count: 0,
        totalAmount: 0,
        avgAmount: 0,
      });
    }
  }

  // Populate cells
  for (const t of transactions) {
    const dateObj = new Date(t.timestamp);
    // getUTCDay: 0 is Sun, 1 is Mon, ... 6 is Sat.
    // Map to 0 = Mon, 6 = Sun
    const utcDay = dateObj.getUTCDay();
    const dayIndex = (utcDay + 6) % 7;
    const hour = dateObj.getUTCHours();

    const cellIndex = dayIndex * 24 + hour;
    if (grid[cellIndex]) {
      grid[cellIndex].count += 1;
      grid[cellIndex].totalAmount += t.amount;
    }
  }

  // Calculate averages
  for (const cell of grid) {
    cell.avgAmount = cell.count > 0 ? Math.round(cell.totalAmount / cell.count) : 0;
  }

  return grid;
}

/**
 * Statistical Anomaly Detection (MAD or IQR)
 */
export function detectAnomalies(
  dailyData: AggregatedDay[],
  options: {
    method: 'mad' | 'iqr';
    threshold: number; // e.g. 2.5 or 3.0
    metric: 'count' | 'amount';
  }
): AnomalyResult[] {
  if (dailyData.length < 5) {
    return dailyData.map(d => ({
      date: d.date,
      observed: options.metric === 'count' ? d.count : d.totalAmount,
      baseline: options.metric === 'count' ? d.count : d.totalAmount,
      lowerBound: 0,
      upperBound: (options.metric === 'count' ? d.count : d.totalAmount) * 2,
      deviation: 0,
      isAnomaly: false,
      type: 'normal',
      method: options.method.toUpperCase(),
    }));
  }

  const values = dailyData.map(d => (options.metric === 'count' ? d.count : d.totalAmount));

  if (options.method === 'mad') {
    // Rolling 14-day Median and MAD for time-series adaptability
    const windowSize = 14;
    return dailyData.map((d, idx) => {
      const val = values[idx];
      const start = Math.max(0, idx - Math.floor(windowSize / 2));
      const end = Math.min(values.length, idx + Math.ceil(windowSize / 2));
      const windowVals = [...values.slice(start, end)].sort((a, b) => a - b);

      // Median
      const mid = Math.floor(windowVals.length / 2);
      const median =
        windowVals.length % 2 === 0
          ? (windowVals[mid - 1] + windowVals[mid]) / 2
          : windowVals[mid];

      // Absolute deviations from median
      const absDevs = windowVals.map(v => Math.abs(v - median)).sort((a, b) => a - b);
      const madMid = Math.floor(absDevs.length / 2);
      let mad = absDevs.length % 2 === 0
        ? (absDevs[madMid - 1] + absDevs[madMid]) / 2
        : absDevs[madMid];

      // Normal distribution consistency factor: 1.4826
      if (mad === 0) {
        // Fallback to mean absolute deviation or min 1
        const meanDev = absDevs.reduce((a, b) => a + b, 0) / absDevs.length;
        mad = meanDev > 0 ? meanDev : Math.max(1, median * 0.1);
      }

      const spread = options.threshold * 1.4826 * mad;
      const lowerBound = Math.max(0, Math.round(median - spread));
      const upperBound = Math.round(median + spread);
      const deviation = mad > 0 ? Math.round(((val - median) / (1.4826 * mad)) * 100) / 100 : 0;

      const isAnomaly = val > upperBound || val < lowerBound;
      const type: 'spike' | 'drop' | 'normal' =
        val > upperBound ? 'spike' : val < lowerBound ? 'drop' : 'normal';

      return {
        date: d.date,
        observed: val,
        baseline: Math.round(median),
        lowerBound,
        upperBound,
        deviation,
        isAnomaly,
        type,
        method: 'Rolling Median & MAD',
      };
    });
  } else {
    // Interquartile Range (IQR) method
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = Math.max(0, Math.round(q1 - options.threshold * iqr));
    const upper = Math.round(q3 + options.threshold * iqr);
    const median = sorted[Math.floor(sorted.length * 0.5)];

    return dailyData.map((d, idx) => {
      const val = values[idx];
      const isAnomaly = val > upper || val < lower;
      const type: 'spike' | 'drop' | 'normal' =
        val > upper ? 'spike' : val < lower ? 'drop' : 'normal';
      const deviation = iqr > 0 ? Math.round(((val - median) / iqr) * 100) / 100 : 0;

      return {
        date: d.date,
        observed: val,
        baseline: median,
        lowerBound: lower,
        upperBound: upper,
        deviation,
        isAnomaly,
        type,
        method: 'Interquartile Range (IQR)',
      };
    });
  }
}

/**
 * Time-Series Forecasting: Seasonal Holt-Winters & Evaluation
 */
export function computeForecast(
  dailyData: AggregatedDay[],
  options: {
    model: 'holt-winters' | 'seasonal-naive' | 'holt-linear';
    horizon: number; // 7, 14, 30 days
    metric: 'count' | 'amount';
  }
): { points: ForecastPoint[]; evaluation: ForecastEvaluation } {
  const { model, horizon, metric } = options;
  const values = dailyData.map(d => (metric === 'count' ? d.count : d.totalAmount));
  const n = values.length;

  if (n < 21) {
    // Not enough data for robust forecasting
    const points: ForecastPoint[] = dailyData.map(d => ({
      date: d.date,
      actual: metric === 'count' ? d.count : d.totalAmount,
      isHistorical: true,
    }));
    return {
      points,
      evaluation: {
        mae: 0,
        rmse: 0,
        mape: 0,
        trainCount: n,
        testCount: 0,
        horizon,
        modelName: 'Insufficient Data',
      },
    };
  }

  // 80% Train, 20% Test chronological split for validation
  const testSize = Math.max(7, Math.min(horizon, Math.floor(n * 0.2)));
  const trainSize = n - testSize;
  const trainVals = values.slice(0, trainSize);
  const testVals = values.slice(trainSize);

  // Weekly seasonality period = 7
  const seasonPeriod = 7;

  // Predict on holdout test set to measure genuine out-of-sample accuracy
  const testPredictions: number[] = [];

  if (model === 'seasonal-naive') {
    // Seasonal naive: y_hat[t] = y[t - 7]
    for (let t = 0; t < testSize; t++) {
      const refIdx = trainSize + t - seasonPeriod;
      testPredictions.push(refIdx >= 0 ? values[refIdx] : trainVals[trainVals.length - 1]);
    }
  } else if (model === 'holt-linear') {
    // Double Exponential Smoothing (Holt's Linear)
    const alpha = 0.3;
    const beta = 0.1;
    let level = trainVals[0];
    let trend = trainVals[1] - trainVals[0];

    for (let i = 1; i < trainSize; i++) {
      const prevLevel = level;
      level = alpha * trainVals[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    for (let h = 1; h <= testSize; h++) {
      testPredictions.push(Math.max(0, Math.round(level + h * trend)));
    }
  } else {
    // Holt-Winters Additive Seasonality
    const alpha = 0.25;
    const beta = 0.08;
    const gamma = 0.35;

    // Initialize level, trend, seasonal factors
    let level = trainVals.slice(0, seasonPeriod).reduce((a, b) => a + b, 0) / seasonPeriod;
    let trend =
      (trainVals.slice(seasonPeriod, seasonPeriod * 2).reduce((a, b) => a + b, 0) -
        trainVals.slice(0, seasonPeriod).reduce((a, b) => a + b, 0)) /
      (seasonPeriod * seasonPeriod);

    const seasonal = new Array(seasonPeriod).fill(0);
    for (let i = 0; i < seasonPeriod; i++) {
      seasonal[i] = trainVals[i] - level;
    }

    for (let i = 0; i < trainSize; i++) {
      const sIdx = i % seasonPeriod;
      const prevLevel = level;
      level = alpha * (trainVals[i] - seasonal[sIdx]) + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      seasonal[sIdx] = gamma * (trainVals[i] - level) + (1 - gamma) * seasonal[sIdx];
    }

    for (let h = 1; h <= testSize; h++) {
      const sIdx = (trainSize + h - 1) % seasonPeriod;
      testPredictions.push(Math.max(0, Math.round(level + h * trend + seasonal[sIdx])));
    }
  }

  // Calculate Evaluation Metrics on Test Set
  let sumAbsError = 0;
  let sumSqError = 0;
  let sumPctError = 0;
  let validMapeCount = 0;

  for (let i = 0; i < testSize; i++) {
    const actual = testVals[i];
    const pred = testPredictions[i];
    const err = actual - pred;
    sumAbsError += Math.abs(err);
    sumSqError += err * err;
    if (actual > 0) {
      sumPctError += Math.abs(err / actual);
      validMapeCount++;
    }
  }

  const mae = Math.round(sumAbsError / testSize);
  const rmse = Math.round(Math.sqrt(sumSqError / testSize));
  const mape = validMapeCount > 0 ? Math.round((sumPctError / validMapeCount) * 1000) / 10 : 0;

  // Now fit model on FULL dataset (train + test) to produce genuine future forecast
  const futureForecast: { forecast: number; lower80: number; upper80: number; lower95: number; upper95: number }[] = [];

  if (model === 'seasonal-naive') {
    for (let h = 1; h <= horizon; h++) {
      const refIdx = n - seasonPeriod + ((h - 1) % seasonPeriod);
      const val = values[refIdx];
      const margin80 = Math.round(1.28 * rmse);
      const margin95 = Math.round(1.96 * rmse);
      futureForecast.push({
        forecast: Math.max(0, val),
        lower80: Math.max(0, val - margin80),
        upper80: val + margin80,
        lower95: Math.max(0, val - margin95),
        upper95: val + margin95,
      });
    }
  } else if (model === 'holt-linear') {
    const alpha = 0.3;
    const beta = 0.1;
    let level = values[0];
    let trend = values[1] - values[0];

    for (let i = 1; i < n; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    for (let h = 1; h <= horizon; h++) {
      const pred = Math.max(0, Math.round(level + h * trend));
      const margin80 = Math.round(1.28 * rmse * Math.sqrt(h));
      const margin95 = Math.round(1.96 * rmse * Math.sqrt(h));
      futureForecast.push({
        forecast: pred,
        lower80: Math.max(0, pred - margin80),
        upper80: pred + margin80,
        lower95: Math.max(0, pred - margin95),
        upper95: pred + margin95,
      });
    }
  } else {
    // Holt-Winters on full dataset
    const alpha = 0.25;
    const beta = 0.08;
    const gamma = 0.35;

    let level = values.slice(0, seasonPeriod).reduce((a, b) => a + b, 0) / seasonPeriod;
    let trend =
      (values.slice(seasonPeriod, seasonPeriod * 2).reduce((a, b) => a + b, 0) -
        values.slice(0, seasonPeriod).reduce((a, b) => a + b, 0)) /
      (seasonPeriod * seasonPeriod);

    const seasonal = new Array(seasonPeriod).fill(0);
    for (let i = 0; i < seasonPeriod; i++) {
      seasonal[i] = values[i] - level;
    }

    for (let i = 0; i < n; i++) {
      const sIdx = i % seasonPeriod;
      const prevLevel = level;
      level = alpha * (values[i] - seasonal[sIdx]) + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      seasonal[sIdx] = gamma * (values[i] - level) + (1 - gamma) * seasonal[sIdx];
    }

    for (let h = 1; h <= horizon; h++) {
      const sIdx = (n + h - 1) % seasonPeriod;
      const pred = Math.max(0, Math.round(level + h * trend + seasonal[sIdx]));
      const margin80 = Math.round(1.28 * rmse * Math.sqrt(1 + (h - 1) * 0.05));
      const margin95 = Math.round(1.96 * rmse * Math.sqrt(1 + (h - 1) * 0.05));

      futureForecast.push({
        forecast: pred,
        lower80: Math.max(0, pred - margin80),
        upper80: pred + margin80,
        lower95: Math.max(0, pred - margin95),
        upper95: pred + margin95,
      });
    }
  }

  // Generate date points (historical + future horizon)
  const lastDate = new Date(dailyData[dailyData.length - 1].date + 'T00:00:00Z');

  // Include recent historical data (up to last 60 days for clear chart view)
  const displayHistoricalWindow = Math.min(60, dailyData.length);
  const histSlice = dailyData.slice(dailyData.length - displayHistoricalWindow);

  const points: ForecastPoint[] = histSlice.map(d => ({
    date: d.date,
    actual: metric === 'count' ? d.count : d.totalAmount,
    isHistorical: true,
  }));

  // Append future days
  for (let h = 1; h <= horizon; h++) {
    const futureDate = new Date(lastDate.getTime() + h * 86400000);
    const dateStr = futureDate.toISOString().split('T')[0];
    const ff = futureForecast[h - 1];

    points.push({
      date: dateStr,
      forecast: ff.forecast,
      lowerBound80: ff.lower80,
      upperBound80: ff.upper80,
      lowerBound95: ff.lower95,
      upperBound95: ff.upper95,
      isHistorical: false,
    });
  }

  const modelLabels: Record<string, string> = {
    'holt-winters': 'Triple Exp. Smoothing (Holt-Winters Additive)',
    'seasonal-naive': 'Seasonal Naive Baseline (7-Day Lag)',
    'holt-linear': "Holt's Linear Trend (Double Exponential)",
  };

  return {
    points,
    evaluation: {
      mae,
      rmse,
      mape,
      trainCount: trainSize,
      testCount: testSize,
      horizon,
      modelName: modelLabels[model] || model,
    },
  };
}

/**
 * Validate and Parse CSV Dataset
 */
export function validateAndParseTransactions(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>
): { records: TransactionRecord[]; report: DatasetQualityReport } {
  const records: TransactionRecord[] = [];
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  let missingValuesCount = 0;
  let duplicateIdsCount = 0;
  let invalidTimestampsCount = 0;
  let invalidAmountsCount = 0;

  let minDate = '';
  let maxDate = '';

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;

    // Extract mapped fields
    const rawId = row[columnMapping.transaction_id || 'transaction_id'] ?? `TXN-GEN-${rowNum}`;
    const rawTimestamp = row[columnMapping.timestamp || 'timestamp'] ?? row[columnMapping.date || 'date'];
    const rawAmount = row[columnMapping.amount || 'amount'];
    const rawType = row[columnMapping.transaction_type || 'transaction_type'];
    const rawMode = row[columnMapping.payment_mode || 'payment_mode'];
    const rawBranch = row[columnMapping.branch || 'branch'];
    const rawStatus = row[columnMapping.transaction_status || 'transaction_status'];
    const rawAccount = row[columnMapping.account_type || 'account_type'];

    let isRowValid = true;

    // 1. Amount validation
    let amount = 0;
    if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
      missingValuesCount++;
      invalidAmountsCount++;
      issues.push({ row: rowNum, field: 'amount', value: String(rawAmount), issue: 'Missing amount value' });
      isRowValid = false;
    } else {
      const cleanAmt = String(rawAmount).replace(/[^0-9.-]+/g, '');
      const parsedAmt = parseFloat(cleanAmt);
      if (isNaN(parsedAmt) || parsedAmt < 0) {
        invalidAmountsCount++;
        issues.push({ row: rowNum, field: 'amount', value: String(rawAmount), issue: 'Invalid or negative amount' });
        isRowValid = false;
      } else {
        amount = parsedAmt;
      }
    }

    // 2. Timestamp validation
    let timestamp = '';
    let dateStr = '';
    if (!rawTimestamp) {
      missingValuesCount++;
      invalidTimestampsCount++;
      issues.push({ row: rowNum, field: 'timestamp', value: '', issue: 'Missing timestamp' });
      isRowValid = false;
    } else {
      const parsedDate = new Date(rawTimestamp);
      if (isNaN(parsedDate.getTime())) {
        invalidTimestampsCount++;
        issues.push({ row: rowNum, field: 'timestamp', value: String(rawTimestamp), issue: 'Unparseable timestamp format' });
        isRowValid = false;
      } else {
        timestamp = parsedDate.toISOString();
        dateStr = timestamp.split('T')[0];

        if (!minDate || dateStr < minDate) minDate = dateStr;
        if (!maxDate || dateStr > maxDate) maxDate = dateStr;
      }
    }

    // 3. ID and duplicates check
    const txnId = String(rawId).trim();
    if (seenIds.has(txnId)) {
      duplicateIdsCount++;
      issues.push({ row: rowNum, field: 'transaction_id', value: txnId, issue: 'Duplicate transaction ID' });
      // We still include it with a suffix to preserve total rows if otherwise valid
    } else {
      seenIds.add(txnId);
    }

    if (isRowValid) {
      // Normalize categorical values
      const typeStr = String(rawType || 'Payment').trim();
      const validTypes: TransactionType[] = ['Payment', 'Withdrawal', 'Deposit', 'Transfer'];
      const transaction_type: TransactionType = validTypes.includes(typeStr as TransactionType)
        ? (typeStr as TransactionType)
        : 'Payment';

      const modeStr = String(rawMode || 'UPI').trim();
      const validModes: PaymentMode[] = ['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Bank Transfer', 'ATM'];
      const payment_mode: PaymentMode = validModes.includes(modeStr as PaymentMode)
        ? (modeStr as PaymentMode)
        : 'UPI';

      const statusStr = String(rawStatus || 'Successful').trim();
      const validStatuses: TransactionStatus[] = ['Successful', 'Failed', 'Pending'];
      const transaction_status: TransactionStatus = validStatuses.includes(statusStr as TransactionStatus)
        ? (statusStr as TransactionStatus)
        : 'Successful';

      const accStr = String(rawAccount || 'Savings').trim();
      const validAccounts: AccountType[] = ['Savings', 'Current', 'Salary', 'NRI'];
      const account_type: AccountType = validAccounts.includes(accStr as AccountType)
        ? (accStr as AccountType)
        : 'Savings';

      const branch = String(rawBranch || 'Main Branch').trim();

      records.push({
        transaction_id: txnId,
        timestamp,
        date: dateStr,
        account_type,
        transaction_type,
        amount,
        payment_mode,
        branch,
        transaction_status,
      });
    }
  });

  const totalRows = rawRows.length;
  const validRows = records.length;
  const invalidRows = totalRows - validRows;

  const report: DatasetQualityReport = {
    totalRows,
    validRows,
    invalidRows,
    missingValuesCount,
    duplicateIdsCount,
    invalidTimestampsCount,
    invalidAmountsCount,
    dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
    issues: issues.slice(0, 100), // Cap at 100 preview issues
  };

  return { records, report };
}

/**
 * CSV Exporter utility
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(h => {
          let cell = row[h] === null || row[h] === undefined ? '' : String(row[h]);
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
