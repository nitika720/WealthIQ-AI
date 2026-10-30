import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';
import { CurrencyCode } from '../db/models.ts';

const router = Router();
router.use(authMiddleware);

// PUT /api/v1/preferences/currency
router.put('/currency', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currency } = req.body;

    const valid = ['INR', 'USD', 'EUR', 'GBP'];
    if (!valid.includes(currency)) {
      res.status(400).json({ success: false, error: 'Invalid currency code. Must be INR, USD, EUR, or GBP.' });
      return;
    }

    const updated = dbStore.updateUser(userId, { currency: currency as CurrencyCode });
    dbStore.recordAuditEvent(userId, 'PREFERENCES_UPDATED', `Changed base currency to ${currency}`);

    res.json({
      success: true,
      data: {
        currency: updated?.currency,
      },
      message: 'Base currency updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/preferences/audit-logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const logs = dbStore.getAuditEvents(userId, 100);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/preferences/export-all (Complete GDPR / personal data portability export)
router.get('/export-all', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = dbStore.findUserById(userId);
    const transactions = dbStore.getTransactions(userId);
    const budgets = dbStore.getBudgets(userId);
    const goals = dbStore.getGoals(userId);
    const auditEvents = dbStore.getAuditEvents(userId);

    const fullDump = {
      userProfile: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        currency: user?.currency,
        createdAt: user?.createdAt,
      },
      transactions,
      budgets,
      savingsGoals: goals,
      auditEvents,
      exportedAt: new Date().toISOString(),
      platform: 'WealthIQ AI Engine v1.0.0',
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="WealthIQ_UserExport_${userId}_${Date.now()}.json"`);
    res.send(JSON.stringify(fullDump, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/preferences/reset-demo-data
router.post('/reset-demo-data', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = dbStore.findUserById(userId);

    // Only allow for demo account or if explicitly requested to reload demo templates
    if (user?.email === 'demo@wealthiq.ai') {
      dbStore.seedInitialData(true);
      res.json({ success: true, message: 'Demo dataset restored to initial seed state.' });
      return;
    }

    res.status(403).json({ success: false, error: 'Reset only allowed for demo account.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
