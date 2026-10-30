export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface User {
  id: string;
  name: string;
  email: string;
  currency: CurrencyCode;
  createdAt?: string;
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
  amount: number;
  currency: CurrencyCode;
  category: TransactionCategory;
  subcategory?: string;
  date: string; // YYYY-MM-DD
  description: string;
  merchant?: string;
  paymentMethod?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  period: 'monthly';
  amount: number;
  spent?: number;
  remaining?: number;
  utilization?: number;
  utilizationPct?: number;
  warningThreshold: number;
  warningThresholdPct?: number;
  status?: 'HEALTHY' | 'WARNING' | 'EXCEEDED';
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category?: string;
  notes?: string;
  isCompleted: boolean;
  remainingAmount?: number;
  progressPct?: number;
  monthsRemaining?: number;
  requiredMonthlyContribution?: number;
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

export interface FinancialHealthScore {
  score: number;
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

export interface ForecastResult {
  period: string;
  predictedTotalExpense: number;
  confidenceLower: number;
  confidenceUpper: number;
  model: string;
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

export interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}
