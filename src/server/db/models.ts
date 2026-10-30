export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  currency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
}

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Other Income'
  | 'Housing & Rent'
  | 'Groceries'
  | 'Dining & Entertainment'
  | 'Transportation'
  | 'Utilities & Bills'
  | 'Healthcare & Medical'
  | 'Shopping & Personal'
  | 'Education'
  | 'Travel'
  | 'Miscellaneous';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // Stored as double precision rounded to 2 decimals
  currency: CurrencyCode;
  category: TransactionCategory;
  subcategory?: string;
  date: string; // YYYY-MM-DD
  description: string;
  merchant?: string;
  paymentMethod?: 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash' | 'Other';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  period: 'monthly'; // Standard monthly budget cycle
  amount: number; // Limit
  warningThreshold: number; // e.g. 0.80 for 80%
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category?: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProposedAction {
  id: string;
  type: 'CREATE_BUDGET' | 'UPDATE_BUDGET' | 'CREATE_SAVINGS_GOAL';
  description: string;
  payload: any;
  status: 'PENDING_CONFIRMATION' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  proposedAction?: ProposedAction;
  toolInvocations?: Array<{
    name: string;
    params: any;
    result: any;
  }>;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ForecastResult {
  period: string; // e.g. "Next Month (November 2026)"
  predictedTotalExpense: number;
  confidenceLower: number;
  confidenceUpper: number;
  model: 'Linear Lag-Regression with Seasonality' | 'Exponential Moving Average Baseline';
  historicalMae: number;
  baselineMae: number;
  accuracyImprovementPct: number;
  categoryBreakdown: Array<{
    category: TransactionCategory;
    predictedAmount: number;
    currentAvg: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    riskVsBudget: 'SAFE' | 'WARNING' | 'EXCEEDED' | 'NO_BUDGET';
  }>;
  riskSummary: {
    overbudgetCount: number;
    totalBudgetGap: number;
    highestRiskCategory: string;
  };
  limitationsNotice: string;
}

export interface FinancialHealthScore {
  score: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  status: 'Excellent' | 'Good' | 'Moderate' | 'Needs Attention' | 'Critical';
  factors: {
    savingsRate: { score: number; max: 25; value: string; assessment: string };
    budgetDiscipline: { score: number; max: 25; value: string; assessment: string };
    expenseToIncomeRatio: { score: number; max: 25; value: string; assessment: string };
    netCashflowStability: { score: number; max: 25; value: string; assessment: string };
  };
  recommendations: string[];
}
