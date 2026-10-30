import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';
import { generateExpenseForecast } from '../services/ml_forecast.service.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/forecasts
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactions = dbStore.getTransactions(userId);
    const budgets = dbStore.getBudgets(userId);

    const forecast = generateExpenseForecast(transactions, budgets);

    // Compute historical monthly data for the chart: past actual expenses + next month forecast
    const monthlyExpenses: Record<string, number> = {};
    for (const tx of transactions.filter(t => t.type === 'expense')) {
      const mStr = tx.date.substring(0, 7);
      monthlyExpenses[mStr] = (monthlyExpenses[mStr] || 0) + tx.amount;
    }

    interface TimelinePoint {
      period: string;
      actual: number | null;
      forecast: number | null;
      lowerBound: number | null;
      upperBound: number | null;
    }

    const sortedMonths = Object.keys(monthlyExpenses).sort();
    const timelineData: TimelinePoint[] = sortedMonths.map(m => ({
      period: m,
      actual: Math.round(monthlyExpenses[m]),
      forecast: null,
      lowerBound: null,
      upperBound: null,
    }));

    // Add forecast point
    timelineData.push({
      period: '2026-11 (Forecast)',
      actual: null,
      forecast: forecast.predictedTotalExpense,
      lowerBound: forecast.confidenceLower,
      upperBound: forecast.confidenceUpper,
    });

    res.json({
      success: true,
      data: {
        forecast,
        timeline: timelineData,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/forecasts/recompute
router.post('/recompute', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactions = dbStore.getTransactions(userId);
    const budgets = dbStore.getBudgets(userId);

    const forecast = generateExpenseForecast(transactions, budgets);
    dbStore.recordAuditEvent(userId, 'FORECAST_RECOMPUTED', `ML engine recalculated projection: ${forecast.predictedTotalExpense}`);

    res.json({
      success: true,
      data: forecast,
      message: 'Forecasting model successfully re-trained on latest transaction vectors.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
