import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/goals
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const goals = dbStore.getGoals(userId);

    const now = new Date();
    const enriched = goals.map(g => {
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const progressPct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;

      // Calculate months until targetDate
      const target = new Date(g.targetDate);
      const diffMonths = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
      const requiredMonthlyContribution = Math.round(remainingAmount / diffMonths);

      return {
        ...g,
        remainingAmount,
        progressPct,
        monthsRemaining: diffMonths,
        requiredMonthlyContribution,
      };
    });

    res.json({
      success: true,
      data: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/goals
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, targetAmount, currentAmount = 0, targetDate, category, notes } = req.body;

    if (!name || !targetAmount || !targetDate) {
      res.status(400).json({ success: false, error: 'Name, target amount, and target date are required.' });
      return;
    }

    const tAmt = parseFloat(targetAmount);
    const cAmt = parseFloat(currentAmount) || 0;

    if (isNaN(tAmt) || tAmt <= 0) {
      res.status(400).json({ success: false, error: 'Target amount must be a positive number.' });
      return;
    }

    const goal = dbStore.createGoal(userId, {
      name: name.trim(),
      targetAmount: tAmt,
      currentAmount: cAmt,
      targetDate: targetDate.substring(0, 10),
      category: category ? category.trim() : 'Savings',
      notes: notes ? notes.trim() : undefined,
      isCompleted: cAmt >= tAmt,
    });

    dbStore.recordAuditEvent(userId, 'GOAL_CREATED', `Created savings goal "${goal.name}" for ${goal.targetAmount}`);
    res.status(201).json({ success: true, data: goal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/goals/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const goalId = req.params.id;

    const updates: any = { ...req.body };
    if (updates.targetAmount !== undefined) {
      const num = parseFloat(updates.targetAmount);
      if (isNaN(num) || num <= 0) {
        res.status(400).json({ success: false, error: 'Target amount must be positive' });
        return;
      }
      updates.targetAmount = num;
    }
    if (updates.currentAmount !== undefined) {
      updates.currentAmount = parseFloat(updates.currentAmount) || 0;
    }

    const updated = dbStore.updateGoal(userId, goalId, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Goal not found or unauthorized' });
      return;
    }

    dbStore.recordAuditEvent(userId, 'GOAL_UPDATED', `Updated goal "${updated.name}"`);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/goals/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = dbStore.deleteGoal(userId, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Goal not found or unauthorized' });
      return;
    }

    dbStore.recordAuditEvent(userId, 'GOAL_DELETED', `Deleted goal ${req.params.id}`);
    res.json({ success: true, message: 'Savings goal successfully removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
