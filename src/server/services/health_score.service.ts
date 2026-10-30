import { Transaction, Budget, SavingsGoal, FinancialHealthScore } from '../db/models.ts';

export function calculateFinancialHealthScore(
  transactions: Transaction[],
  budgets: Budget[],
  goals: SavingsGoal[],
  selectedMonth?: string // YYYY-MM
): FinancialHealthScore {
  const currentMonth = selectedMonth || new Date().toISOString().substring(0, 7);

  // Filter current month transactions
  const monthTx = transactions.filter(t => t.date.startsWith(currentMonth));

  const totalIncome = monthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // If no transactions in current month, look at overall history or return insufficient data baseline
  if (totalIncome === 0 && totalExpenses === 0) {
    return {
      score: 60,
      grade: 'B',
      status: 'Moderate',
      factors: {
        savingsRate: { score: 15, max: 25, value: '0%', assessment: 'No transaction data recorded for this period yet.' },
        budgetDiscipline: { score: 15, max: 25, value: 'N/A', assessment: 'Add monthly budgets to track spending discipline.' },
        expenseToIncomeRatio: { score: 15, max: 25, value: '0%', assessment: 'Balanced baseline pending expense activity.' },
        netCashflowStability: { score: 15, max: 25, value: '0', assessment: 'Pending cashflow ledger records.' },
      },
      recommendations: [
        'Log your monthly income and recurring expenses to unlock your personalized WealthIQ Health Score.',
        'Establish category-specific budgets to avoid discretionary creep.',
      ],
    };
  }

  // 1. Savings Rate Factor (Max 25)
  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  let savingsScore = 5;
  let savingsAssessment = 'Critical: Negative cash flow or zero savings rate detected.';

  if (savingsRate >= 30) {
    savingsScore = 25;
    savingsAssessment = 'Outstanding: Saving 30%+ of monthly income, well above the 50/30/20 guideline.';
  } else if (savingsRate >= 20) {
    savingsScore = 22;
    savingsAssessment = 'Excellent: Hitting the gold-standard 20% minimum personal savings rate.';
  } else if (savingsRate >= 12) {
    savingsScore = 17;
    savingsAssessment = 'Moderate: Building positive savings, but can be optimized toward 20%.';
  } else if (savingsRate >= 5) {
    savingsScore = 10;
    savingsAssessment = 'Low: Tight margins; vulnerable to unexpected financial emergencies.';
  }

  // 2. Budget Discipline Factor (Max 25)
  let budgetScore = 15;
  let budgetAssessment = 'No budgets defined. Create budgets to measure adherence.';
  let budgetValStr = 'No budgets';

  if (budgets.length > 0) {
    let withinBudgetCount = 0;
    for (const b of budgets) {
      const spent = monthTx
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent <= b.amount) {
        withinBudgetCount++;
      }
    }
    const adherenceRate = (withinBudgetCount / budgets.length) * 100;
    budgetValStr = `${Math.round(adherenceRate)}% within limit (${withinBudgetCount}/${budgets.length})`;

    if (adherenceRate === 100) {
      budgetScore = 25;
      budgetAssessment = 'Flawless: 100% of tracked category expenses stayed within allocated thresholds.';
    } else if (adherenceRate >= 75) {
      budgetScore = 19;
      budgetAssessment = 'Good: Minor overruns in isolated categories; overall limits respected.';
    } else if (adherenceRate >= 50) {
      budgetScore = 12;
      budgetAssessment = 'Caution: Multiple categories exceeded spending caps this month.';
    } else {
      budgetScore = 6;
      budgetAssessment = 'Deficit: Significant overspending across majority of budgeted categories.';
    }
  }

  // 3. Expense-to-Income Ratio (Max 25)
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
  let expenseScore = 4;
  let expenseAssessment = 'Outflow matches or exceeds total inflows.';

  if (expenseRatio <= 50) {
    expenseScore = 25;
    expenseAssessment = 'Superior: Living well below means with only 50% or less of inflows committed.';
  } else if (expenseRatio <= 65) {
    expenseScore = 22;
    expenseAssessment = 'Healthy: Expenses consume 50-65% of earnings, leaving strong investment capital.';
  } else if (expenseRatio <= 80) {
    expenseScore = 16;
    expenseAssessment = 'Adequate: 65-80% expense load; modest room for aggressive debt payoff or wealth compounding.';
  } else if (expenseRatio <= 95) {
    expenseScore = 9;
    expenseAssessment = 'Strained: 80-95% outflow leaves minimal shock absorption.';
  }

  // 4. Net Cash Flow & Reserves Stability (Max 25)
  let stabilityScore = 12;
  let stabilityAssessment = 'Positive cashflow retained.';
  const netCashFlow = totalIncome - totalExpenses;

  const emergencyGoal = goals.find(g => g.name.toLowerCase().includes('emergency') || g.category?.toLowerCase().includes('safety'));
  const emergencyPct = emergencyGoal && emergencyGoal.targetAmount > 0 
    ? (emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100 
    : 0;

  if (netCashFlow > 0 && emergencyPct >= 70) {
    stabilityScore = 25;
    stabilityAssessment = 'Fortified: Healthy liquid buffer and robust ongoing surplus.';
  } else if (netCashFlow > 0 && emergencyPct >= 30) {
    stabilityScore = 20;
    stabilityAssessment = 'Solid: Consistently positive net cash flow with growing emergency reserve.';
  } else if (netCashFlow > 0) {
    stabilityScore = 16;
    stabilityAssessment = 'Positive monthly surplus; consider accelerating your emergency reserve goal.';
  } else if (netCashFlow === 0) {
    stabilityScore = 10;
    stabilityAssessment = 'Break-even cash flow; zero cushion against unforeseen delays.';
  } else {
    stabilityScore = 4;
    stabilityAssessment = 'Negative net cash flow; relying on savings or credit to meet obligations.';
  }

  const totalScore = Math.min(100, Math.max(0, savingsScore + budgetScore + expenseScore + stabilityScore));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  let status: 'Excellent' | 'Good' | 'Moderate' | 'Needs Attention' | 'Critical' = 'Moderate';

  if (totalScore >= 90) {
    grade = 'A+';
    status = 'Excellent';
  } else if (totalScore >= 80) {
    grade = 'A';
    status = 'Good';
  } else if (totalScore >= 65) {
    grade = 'B';
    status = 'Moderate';
  } else if (totalScore >= 50) {
    grade = 'C';
    status = 'Needs Attention';
  } else {
    grade = 'D';
    status = 'Critical';
  }

  const recommendations: string[] = [];
  if (savingsRate < 20) {
    recommendations.push(`Boost savings by ${Math.round(20 - savingsRate)}% to achieve the benchmark 20% personal wealth accumulation target.`);
  }
  if (budgets.length === 0) {
    recommendations.push('Set up spending limits on high-frequency categories like Dining & Entertainment and Shopping.');
  }
  if (expenseRatio > 70) {
    recommendations.push('Audit recurring subscription bills and discretionary dining to bring expense-to-income ratio under 65%.');
  }
  if (!emergencyGoal || emergencyPct < 50) {
    recommendations.push('Prioritize an Emergency Reserve fund covering at least 3-6 months of essential living costs.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Your financial fundamentals are excellent. Consider maximizing tax-advantaged retirement and compounding index investments.');
  }

  return {
    score: totalScore,
    grade,
    status,
    factors: {
      savingsRate: { score: savingsScore, max: 25, value: `${savingsRate.toFixed(1)}%`, assessment: savingsAssessment },
      budgetDiscipline: { score: budgetScore, max: 25, value: budgetValStr, assessment: budgetAssessment },
      expenseToIncomeRatio: { score: expenseScore, max: 25, value: `${expenseRatio.toFixed(1)}%`, assessment: expenseAssessment },
      netCashflowStability: { score: stabilityScore, max: 25, value: `${netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString()}`, assessment: stabilityAssessment },
    },
    recommendations,
  };
}
