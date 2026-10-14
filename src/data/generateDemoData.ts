import { TransactionRecord, TransactionType, PaymentMode, TransactionStatus, AccountType } from '../types';

// Simple seedable pseudo-random generator (LCG)
function createRng(seed: number = 42) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const BRANCHES = [
  'Mumbai Nariman Point',
  'Delhi Connaught Place',
  'Bengaluru Koramangala',
  'Hyderabad Hitec City',
  'Chennai T Nagar',
  'Kolkata Park Street',
  'Pune Shivajinagar',
  'Ahmedabad SG Highway',
];

export const PAYMENT_MODES: PaymentMode[] = [
  'UPI',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Bank Transfer',
  'ATM',
];

export const TRANSACTION_TYPES: TransactionType[] = [
  'Payment',
  'Withdrawal',
  'Deposit',
  'Transfer',
];

export const ACCOUNT_TYPES: AccountType[] = [
  'Savings',
  'Current',
  'Salary',
  'NRI',
];

export function generateSyntheticTransactions(count: number = 12000, seed: number = Date.now()): TransactionRecord[] {
  const rng = createRng(seed);
  const records: TransactionRecord[] = [];

  // 365 days leading up to 2026-10-14
  const endDate = new Date('2026-10-14T23:59:59Z');
  const endMs = endDate.getTime();
  const startMs = endMs - 365 * 24 * 60 * 60 * 1000;

  // Weightings for payment modes
  const paymentModeWeights = [
    { mode: 'UPI' as PaymentMode, weight: 0.44 },
    { mode: 'Debit Card' as PaymentMode, weight: 0.20 },
    { mode: 'Credit Card' as PaymentMode, weight: 0.16 },
    { mode: 'Net Banking' as PaymentMode, weight: 0.10 },
    { mode: 'Bank Transfer' as PaymentMode, weight: 0.06 },
    { mode: 'ATM' as PaymentMode, weight: 0.04 },
  ];

  // Weightings for transaction types
  const typeWeights = [
    { type: 'Payment' as TransactionType, weight: 0.42 },
    { type: 'Withdrawal' as TransactionType, weight: 0.26 },
    { type: 'Deposit' as TransactionType, weight: 0.22 },
    { type: 'Transfer' as TransactionType, weight: 0.10 },
  ];

  // Pick weighted item
  const pickWeighted = <T>(items: { weight: number; [k: string]: any }[], key: string): T => {
    const r = rng();
    let accumulated = 0;
    for (const item of items) {
      accumulated += item.weight;
      if (r <= accumulated) return item[key] as T;
    }
    return items[items.length - 1][key] as T;
  };

  // Branch weights
  const branchWeights = BRANCHES.map((b, idx) => ({
    branch: b,
    weight: [0.22, 0.18, 0.16, 0.14, 0.10, 0.08, 0.07, 0.05][idx] || 0.1,
  }));

  // Hourly density weights (0 to 23 hours)
  const hourlyProbability = [
    0.008, 0.004, 0.002, 0.002, 0.004, 0.008, // 00 - 05
    0.020, 0.035, 0.055, 0.075, 0.085, 0.090, // 06 - 11
    0.090, 0.075, 0.065, 0.060, 0.070, 0.080, // 12 - 17
    0.085, 0.080, 0.050, 0.030, 0.015, 0.010, // 18 - 23
  ];

  for (let i = 0; i < count; i++) {
    // Pick a day across the 365 days
    // Day distribution has a slight monthly growth trend
    const dayProgress = rng();
    const dayMs = startMs + dayProgress * (endMs - startMs);
    const dateObj = new Date(dayMs);

    // Pick hour based on hourly weights
    const hourRoll = rng();
    let cumulativeHour = 0;
    let selectedHour = 12;
    for (let h = 0; h < 24; h++) {
      cumulativeHour += hourlyProbability[h];
      if (hourRoll <= cumulativeHour) {
        selectedHour = h;
        break;
      }
    }

    const minute = Math.floor(rng() * 60);
    const second = Math.floor(rng() * 60);

    dateObj.setUTCHours(selectedHour, minute, second, 0);

    const isoString = dateObj.toISOString();
    const dateStr = isoString.split('T')[0];

    // Pick payment mode & type
    let paymentMode = pickWeighted<PaymentMode>(paymentModeWeights, 'mode');
    let txnType = pickWeighted<TransactionType>(typeWeights, 'type');

    // Natural consistency: ATM is always Withdrawal
    if (paymentMode === 'ATM') {
      txnType = 'Withdrawal';
    }

    // Branch
    const branch = pickWeighted<string>(branchWeights, 'branch');

    // Account type
    const accRoll = rng();
    const accountType: AccountType =
      accRoll < 0.55 ? 'Savings' : accRoll < 0.80 ? 'Current' : accRoll < 0.95 ? 'Salary' : 'NRI';

    // Amount generation: realistic log-normal distribution based on payment mode & type
    let baseAmount: number;
    const amountRoll = rng();

    if (paymentMode === 'UPI') {
      // Small to medium transactions: ₹50 - ₹15,000
      baseAmount = Math.round(Math.exp(4.5 + amountRoll * 3.8));
      if (baseAmount < 50) baseAmount = 75;
      if (baseAmount > 25000) baseAmount = 25000;
    } else if (paymentMode === 'ATM') {
      // Multiples of 500: ₹500 - ₹20,000
      const atmRolls = [500, 1000, 2000, 2500, 3000, 5000, 10000, 15000, 20000];
      baseAmount = atmRolls[Math.floor(rng() * atmRolls.length)];
    } else if (paymentMode === 'Bank Transfer' || txnType === 'Transfer') {
      // Large ticket: ₹15,000 - ₹2,50,000
      baseAmount = Math.round(Math.exp(8.5 + amountRoll * 3.5));
      if (baseAmount < 5000) baseAmount = 12500;
      if (baseAmount > 350000) baseAmount = 350000;
    } else if (txnType === 'Deposit') {
      // Salary or business deposit: ₹10,000 - ₹1,80,000
      baseAmount = Math.round(Math.exp(7.8 + amountRoll * 3.2));
      if (baseAmount < 2000) baseAmount = 5000;
      if (baseAmount > 200000) baseAmount = 200000;
    } else {
      // Card / Net Banking: ₹300 - ₹65,000
      baseAmount = Math.round(Math.exp(5.8 + amountRoll * 4.2));
      if (baseAmount < 200) baseAmount = 450;
      if (baseAmount > 85000) baseAmount = 85000;
    }

    // Status: 94% successful, 4.5% failed, 1.5% pending
    const statusRoll = rng();
    const transaction_status: TransactionStatus =
      statusRoll < 0.94 ? 'Successful' : statusRoll < 0.985 ? 'Failed' : 'Pending';

    const idNum = String(i + 1).padStart(6, '0');
    const transaction_id = `TXN-${dateStr.replace(/-/g, '')}-${idNum}`;

    records.push({
      transaction_id,
      timestamp: isoString,
      date: dateStr,
      account_type: accountType,
      transaction_type: txnType,
      amount: baseAmount,
      payment_mode: paymentMode,
      branch,
      transaction_status,
    });
  }

  // Sort chronologically
  records.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return records;
}
