import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.ts';
import { dbStore } from '../db/store.ts';
import { TransactionCategory, TransactionType } from '../db/models.ts';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/transactions
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      startDate,
      endDate,
      type,
      category,
      search,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
    } = req.query;

    const allFiltered = dbStore.getTransactions(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as any,
      category: category as string,
      search: search as string,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const totalCount = allFiltered.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = allFiltered.slice(startIndex, startIndex + limitNum);

    // Compute period totals
    const totalIncome = allFiltered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = allFiltered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        transactions: paginatedItems,
        pagination: {
          totalCount,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
        },
        summary: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpense: Math.round(totalExpense * 100) / 100,
          netCashflow: Math.round((totalIncome - totalExpense) * 100) / 100,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/transactions
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, amount, category, date, description, merchant, paymentMethod, tags } = req.body;

    if (!type || !amount || !category || !date || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required transaction fields: type, amount, category, date, and description.',
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, error: 'Transaction amount must be a positive number.' });
      return;
    }

    const user = dbStore.findUserById(userId);
    const newTx = dbStore.createTransaction(userId, {
      type: type as TransactionType,
      amount: numericAmount,
      currency: user?.currency || 'INR',
      category: category as TransactionCategory,
      date: date.substring(0, 10),
      description: description.trim(),
      merchant: merchant ? merchant.trim() : undefined,
      paymentMethod: paymentMethod || 'Other',
      tags: Array.isArray(tags) ? tags : [],
    });

    dbStore.recordAuditEvent(userId, 'TRANSACTION_CREATED', `Created ${type} of ${newTx.amount} in ${category}`);

    res.status(201).json({ success: true, data: newTx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/transactions/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const txId = req.params.id;
    const existing = dbStore.getTransactionById(userId, txId);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
      return;
    }

    const updates = { ...req.body };
    if (updates.amount !== undefined) {
      const num = parseFloat(updates.amount);
      if (isNaN(num) || num <= 0) {
        res.status(400).json({ success: false, error: 'Amount must be a positive number' });
        return;
      }
      updates.amount = num;
    }

    const updated = dbStore.updateTransaction(userId, txId, updates);
    dbStore.recordAuditEvent(userId, 'TRANSACTION_UPDATED', `Updated transaction ${txId}`);

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/transactions/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const txId = req.params.id;
    const deleted = dbStore.deleteTransaction(userId, txId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
      return;
    }

    dbStore.recordAuditEvent(userId, 'TRANSACTION_DELETED', `Deleted transaction ${txId}`);
    res.json({ success: true, message: 'Transaction successfully removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/transactions/import-csv
router.post('/import-csv', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { csvContent } = req.body;

    if (!csvContent || typeof csvContent !== 'string') {
      res.status(400).json({ success: false, error: 'CSV text content is required' });
      return;
    }

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      res.status(400).json({ success: false, error: 'CSV file must contain a header row and at least one data row' });
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    // Required headers check
    const reqHeaders = ['date', 'type', 'category', 'amount', 'description'];
    for (const rh of reqHeaders) {
      if (!headers.includes(rh)) {
        res.status(400).json({
          success: false,
          error: `Missing required column header: '${rh}'. Found: ${headers.join(', ')}`,
        });
        return;
      }
    }

    const dateIdx = headers.indexOf('date');
    const typeIdx = headers.indexOf('type');
    const catIdx = headers.indexOf('category');
    const amtIdx = headers.indexOf('amount');
    const descIdx = headers.indexOf('description');
    const merchIdx = headers.indexOf('merchant');
    const payIdx = headers.indexOf('paymentmethod');

    const user = dbStore.findUserById(userId);
    const existingTx = dbStore.getTransactions(userId);
    const toInsert: any[] = [];
    const errors: string[] = [];
    let duplicatesSkipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const rawCols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (rawCols.length < reqHeaders.length) continue;

      const date = rawCols[dateIdx];
      const type = rawCols[typeIdx]?.toLowerCase();
      const category = rawCols[catIdx];
      const amount = parseFloat(rawCols[amtIdx]);
      const description = rawCols[descIdx];
      const merchant = merchIdx !== -1 ? rawCols[merchIdx] : undefined;
      const paymentMethod = payIdx !== -1 ? (rawCols[payIdx] as any) : 'Other';

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`Row ${i}: Invalid date format (expected YYYY-MM-DD): "${date}"`);
        continue;
      }
      if (type !== 'income' && type !== 'expense') {
        errors.push(`Row ${i}: Invalid type "${type}" (must be 'income' or 'expense')`);
        continue;
      }
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${i}: Invalid amount "${rawCols[amtIdx]}"`);
        continue;
      }

      // Duplicate check: matching date, amount, type, and description
      const isDuplicate = existingTx.some(
        t => t.date === date && t.amount === amount && t.type === type && t.description.toLowerCase() === description?.toLowerCase()
      );

      if (isDuplicate) {
        duplicatesSkipped++;
        continue;
      }

      toInsert.push({
        type: type as TransactionType,
        amount,
        currency: user?.currency || 'INR',
        category: category as TransactionCategory,
        date,
        description: description || 'Imported Transaction',
        merchant,
        paymentMethod,
        tags: ['CSV-Imported'],
      });
    }

    const created = dbStore.bulkCreateTransactions(userId, toInsert);
    dbStore.recordAuditEvent(userId, 'CSV_IMPORT', `Imported ${created.length} records. Skipped ${duplicatesSkipped} duplicates.`);

    res.json({
      success: true,
      data: {
        importedCount: created.length,
        duplicatesSkipped,
        errors,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/transactions/export-csv
router.get('/export-csv', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const list = dbStore.getTransactions(userId);

    const header = ['id', 'date', 'type', 'category', 'amount', 'currency', 'description', 'merchant', 'paymentMethod'].join(',');
    const rows = list.map(t =>
      [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.type}"`,
        `"${t.category}"`,
        t.amount.toFixed(2),
        `"${t.currency}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${(t.merchant || '').replace(/"/g, '""')}"`,
        `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      ].join(',')
    );

    const csvOutput = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="WealthIQ_Transactions_${new Date().toISOString().substring(0, 10)}.csv"`);
    res.send(csvOutput);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
