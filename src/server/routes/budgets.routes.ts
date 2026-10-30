import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';
import { TransactionCategory } from '../db/models.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/budgets
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { month } = req.query;
    const selectedMonth = (month as string) || new Date().toISOString().substring(0, 7);

    const budgets = dbStore.getBudgets(userId);
    const monthTx = dbStore.getTransactions(userId, {
      startDate: `${selectedMonth}-01`,
      endDate: `${selectedMonth}-31`,
      type: 'expense',
    });

    // Calculate actual spending per category
    const categorySpent: Record<string, number> = {};
    for (const tx of monthTx) {
      categorySpent[tx.category] = (categorySpent[tx.category] || 0) + tx.amount;
    }

    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;
    let warningAlertsCount = 0;
    let exceededCount = 0;

    const budgetCards = budgets.map(b => {
      const spent = Math.round((categorySpent[b.category] || 0) * 100) / 100;
      const remaining = Math.round((b.amount - spent) * 100) / 100;
      const utilization = b.amount > 0 ? (spent / b.amount) : 0;
      const utilizationPct = Math.round(utilization * 100);

      let status: 'HEALTHY' | 'WARNING' | 'EXCEEDED' = 'HEALTHY';
      if (spent > b.amount) {
        status = 'EXCEEDED';
        exceededCount++;
      } else if (utilization >= b.warningThreshold) {
        status = 'WARNING';
        warningAlertsCount++;
      }

      totalBudgeted += b.amount;
      totalSpentInBudgets += spent;

      return {
        ...b,
        spent,
        remaining,
        utilization,
        utilizationPct,
        status,
        warningThresholdPct: Math.round(b.warningThreshold * 100),
      };
    });

    res.json({
      success: true,
      data: {
        budgets: budgetCards,
        period: selectedMonth,
        summary: {
          totalBudgeted: Math.round(totalBudgeted * 100) / 100,
          totalSpent: Math.round(totalSpentInBudgets * 100) / 100,
          totalRemaining: Math.round((totalBudgeted - totalSpentInBudgets) * 100) / 100,
          overallUtilizationPct: totalBudgeted > 0 ? Math.round((totalSpentInBudgets / totalBudgeted) * 100) : 0,
          warningAlertsCount,
          exceededCount,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/budgets
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { category, amount, warningThreshold = 0.80 } = req.body;

    if (!category || !amount) {
      res.status(400).json({ success: false, error: 'Category and budget limit amount are required.' });
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
      return;
    }

    const created = dbStore.createBudget(userId, {
      category: category as TransactionCategory,
      amount: num,
      warningThreshold: parseFloat(warningThreshold) || 0.80,
    });

    dbStore.recordAuditEvent(userId, 'BUDGET_CREATED', `Set budget for ${category} at ${num}`);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/budgets/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { amount, warningThreshold } = req.body;

    const updates: any = {};
    if (amount !== undefined) {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) {
        res.status(400).json({ success: false, error: 'Amount must be positive' });
        return;
      }
      updates.amount = num;
    }
    if (warningThreshold !== undefined) {
      updates.warningThreshold = parseFloat(warningThreshold) || 0.80;
    }

    const updated = dbStore.updateBudget(userId, req.params.id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Budget not found or unauthorized' });
      return;
    }

    dbStore.recordAuditEvent(userId, 'BUDGET_UPDATED', `Updated budget ${req.params.id}`);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/budgets/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = dbStore.deleteBudget(userId, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Budget not found or unauthorized' });
      return;
    }

    dbStore.recordAuditEvent(userId, 'BUDGET_DELETED', `Deleted budget ${req.params.id}`);
    res.json({ success: true, message: 'Budget limit successfully deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
