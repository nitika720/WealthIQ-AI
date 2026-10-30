import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/analytics/report
router.get('/report', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { timeframe = '6m' } = req.query; // '1m', '3m', '6m', '12m'

    const monthsCount = timeframe === '1m' ? 1 : timeframe === '3m' ? 3 : timeframe === '12m' ? 12 : 6;
    const transactions = dbStore.getTransactions(userId);
    const budgets = dbStore.getBudgets(userId);

    // Compute month boundaries
    const targetMonths: string[] = [];
    const now = new Date();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targetMonths.push(d.toISOString().substring(0, 7));
    }

    const filteredTx = transactions.filter(t => targetMonths.includes(t.date.substring(0, 7)));

    // Aggregate monthly breakdown
    const monthlySeries = targetMonths.map(m => {
      const mTx = filteredTx.filter(t => t.date.startsWith(m));
      const income = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = income - expenses;
      const savingsRate = income > 0 ? Math.round((Math.max(0, net) / income) * 100) : 0;

      return {
        month: m,
        income: Math.round(income),
        expenses: Math.round(expenses),
        netSavings: Math.round(net),
        savingsRate,
      };
    });

    // Category aggregation
    const categoryTotals: Record<string, number> = {};
    for (const tx of filteredTx.filter(t => t.type === 'expense')) {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    }

    const totalPeriodExpense = Object.values(categoryTotals).reduce((s, a) => s + a, 0);
    const categoryAnalysis = Object.entries(categoryTotals).map(([cat, amt]) => {
      const matchingBudget = budgets.find(b => b.category === cat);
      const expectedBudgetTotal = matchingBudget ? matchingBudget.amount * monthsCount : 0;
      const variance = expectedBudgetTotal > 0 ? amt - expectedBudgetTotal : 0;

      return {
        category: cat,
        totalSpent: Math.round(amt),
        monthlyAverage: Math.round(amt / monthsCount),
        percentage: totalPeriodExpense > 0 ? Math.round((amt / totalPeriodExpense) * 1000) / 10 : 0,
        budgetBenchmark: expectedBudgetTotal,
        variance,
        varianceStatus: variance > 0 ? 'OVER' : variance < 0 ? 'UNDER' : 'ON_TRACK',
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    const totalIncomeAll = monthlySeries.reduce((s, m) => s + m.income, 0);
    const totalExpensesAll = monthlySeries.reduce((s, m) => s + m.expenses, 0);
    const totalNetSavings = totalIncomeAll - totalExpensesAll;
    const overallSavingsRate = totalIncomeAll > 0 ? Math.round((Math.max(0, totalNetSavings) / totalIncomeAll) * 100) : 0;

    res.json({
      success: true,
      data: {
        timeframe,
        monthsEvaluated: monthsCount,
        summary: {
          totalIncome: totalIncomeAll,
          totalExpenses: totalExpensesAll,
          totalNetSavings,
          overallSavingsRate,
        },
        monthlySeries,
        categoryAnalysis,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/analytics/export
router.get('/export', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactions = dbStore.getTransactions(userId);

    const lines = [
      'WealthIQ Financial Intelligence Report',
      `Exported: ${new Date().toISOString()}`,
      `User ID: ${userId}`,
      '',
      'Date,Type,Category,Amount,Currency,Description,Merchant,PaymentMethod',
    ];

    for (const t of transactions) {
      lines.push(`${t.date},${t.type},"${t.category}",${t.amount},${t.currency},"${t.description}","${t.merchant || ''}","${t.paymentMethod || ''}"`);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="WealthIQ_Report_${Date.now()}.csv"`);
    res.send(lines.join('\n'));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
