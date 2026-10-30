import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';
import { calculateFinancialHealthScore } from '../services/health_score.service.ts';
import { generateExpenseForecast } from '../services/ml_forecast.service.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/dashboard/summary
router.get('/summary', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;
    const selectedMonth = (month as string) || new Date().toISOString().substring(0, 7);

    const transactions = dbStore.getTransactions(userId);
    const budgets = dbStore.getBudgets(userId);
    const goals = dbStore.getGoals(userId);

    const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth));
    const incomeTx = monthTx.filter(t => t.type === 'income');
    const expenseTx = monthTx.filter(t => t.type === 'expense');

    const totalIncome = Math.round(incomeTx.reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const totalExpenses = Math.round(expenseTx.reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const netCashFlow = Math.round((totalIncome - totalExpenses) * 100) / 100;
    const netSavings = Math.max(0, netCashFlow);
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 1000) / 10 : 0;

    // Budget utilization
    const categorySpent: Record<string, number> = {};
    for (const tx of expenseTx) {
      categorySpent[tx.category] = (categorySpent[tx.category] || 0) + tx.amount;
    }
    const totalBudgetLimit = budgets.reduce((s, b) => s + b.amount, 0);
    const totalBudgetSpent = budgets.reduce((s, b) => s + (categorySpent[b.category] || 0), 0);
    const budgetUtilizationPct = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

    // Financial Health Score
    const healthScore = calculateFinancialHealthScore(transactions, budgets, goals, selectedMonth);

    // Forecast
    const forecast = generateExpenseForecast(transactions, budgets);

    // Category breakdown
    const categoryBreakdown = Object.entries(categorySpent).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Recent 5 transactions
    const recentTransactions = transactions.slice(0, 5);

    // Active goals summary
    const goalsSummary = goals.slice(0, 3).map(g => ({
      id: g.id,
      name: g.name,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
      progressPct: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
      targetDate: g.targetDate,
    }));

    res.json({
      success: true,
      data: {
        period: selectedMonth,
        kpis: {
          totalIncome,
          totalExpenses,
          netCashFlow,
          netSavings,
          savingsRate,
          totalBudgetLimit,
          totalBudgetSpent,
          budgetUtilizationPct,
        },
        healthScore,
        forecastPreview: {
          predictedExpense: forecast.predictedTotalExpense,
          confidenceLower: forecast.confidenceLower,
          confidenceUpper: forecast.confidenceUpper,
          model: forecast.model,
          mae: forecast.historicalMae,
        },
        categoryBreakdown,
        recentTransactions,
        goalsSummary,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/dashboard/charts (6-month trends)
router.get('/charts', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactions = dbStore.getTransactions(userId);

    // Collect distinct months in the last 6 months
    const monthlyDataMap: Record<string, { month: string; income: number; expenses: number; savings: number; savingsRate: number }> = {};

    // Standard last 6 months list
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const mStr = targetDate.toISOString().substring(0, 7);
      monthlyDataMap[mStr] = {
        month: mStr,
        income: 0,
        expenses: 0,
        savings: 0,
        savingsRate: 0,
      };
    }

    for (const tx of transactions) {
      const mStr = tx.date.substring(0, 7);
      if (monthlyDataMap[mStr]) {
        if (tx.type === 'income') {
          monthlyDataMap[mStr].income += tx.amount;
        } else {
          monthlyDataMap[mStr].expenses += tx.amount;
        }
      }
    }

    const trends = Object.values(monthlyDataMap).map(row => {
      const net = Math.round((row.income - row.expenses) * 100) / 100;
      const rate = row.income > 0 ? Math.round((Math.max(0, net) / row.income) * 100) : 0;
      return {
        ...row,
        income: Math.round(row.income),
        expenses: Math.round(row.expenses),
        savings: net,
        savingsRate: rate,
      };
    });

    res.json({
      success: true,
      data: {
        trends,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
