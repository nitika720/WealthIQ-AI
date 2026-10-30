import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Transaction,
  Budget,
  SavingsGoal,
  ChatMessage,
  AuditEvent,
  TransactionCategory
} from './models.ts';

interface DatabaseSchema {
  users: User[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  chatMessages: ChatMessage[];
  auditEvents: AuditEvent[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'wealthiq_db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    transactions: [],
    budgets: [],
    goals: [],
    chatMessages: [],
    auditEvents: [],
  };

  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.isLoaded = true;
      } else {
        this.seedInitialData();
        this.persist();
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('[DatabaseStore] Failed to load data, re-initializing:', err);
      this.seedInitialData();
      this.persist();
      this.isLoaded = true;
    }
  }

  private persist() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DatabaseStore] Error persisting database to disk:', err);
    }
  }

  public seedInitialData(force = false) {
    if (this.data.users.length > 0 && !force) return;

    const demoUserId = 'usr_demo_wealthiq_99';
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('DemoPass123!', salt);

    const demoUser: User = {
      id: demoUserId,
      name: 'Dr. Kartik Mehta',
      email: 'demo@wealthiq.ai',
      passwordHash: demoPasswordHash,
      currency: 'INR',
      createdAt: '2026-08-01T08:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
    };

    // Budgets for demo user
    const demoBudgets: Budget[] = [
      {
        id: 'bdg_1',
        userId: demoUserId,
        category: 'Housing & Rent',
        period: 'monthly',
        amount: 32000,
        warningThreshold: 0.85,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'bdg_2',
        userId: demoUserId,
        category: 'Groceries',
        period: 'monthly',
        amount: 18000,
        warningThreshold: 0.80,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'bdg_3',
        userId: demoUserId,
        category: 'Dining & Entertainment',
        period: 'monthly',
        amount: 12000,
        warningThreshold: 0.75,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'bdg_4',
        userId: demoUserId,
        category: 'Transportation',
        period: 'monthly',
        amount: 7000,
        warningThreshold: 0.80,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'bdg_5',
        userId: demoUserId,
        category: 'Utilities & Bills',
        period: 'monthly',
        amount: 6500,
        warningThreshold: 0.90,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'bdg_6',
        userId: demoUserId,
        category: 'Shopping & Personal',
        period: 'monthly',
        amount: 10000,
        warningThreshold: 0.80,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
    ];

    // Savings goals
    const demoGoals: SavingsGoal[] = [
      {
        id: 'goal_1',
        userId: demoUserId,
        name: 'Emergency Reserve Fund (6 Months)',
        targetAmount: 300000,
        currentAmount: 215000,
        targetDate: '2027-03-31',
        category: 'Safety Net',
        notes: 'Targeting 6 months of baseline living expenses in liquid fixed deposit.',
        isCompleted: false,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-10-20T12:00:00.000Z',
      },
      {
        id: 'goal_2',
        userId: demoUserId,
        name: 'EV Downpayment (Tata Curvv.ev)',
        targetAmount: 500000,
        currentAmount: 320000,
        targetDate: '2027-08-15',
        category: 'Automobile',
        notes: 'Monthly SIP into index mutual funds.',
        isCompleted: false,
        createdAt: '2026-08-05T09:00:00.000Z',
        updatedAt: '2026-10-22T14:00:00.000Z',
      },
      {
        id: 'goal_3',
        userId: demoUserId,
        name: 'International Tech Conference (Tokyo)',
        targetAmount: 150000,
        currentAmount: 110000,
        targetDate: '2026-12-10',
        category: 'Professional Development',
        notes: 'Flight, hotel and conference registration.',
        isCompleted: false,
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-10-26T16:00:00.000Z',
      },
    ];

    // 3 Months of Transactions (August, September, October 2026)
    const txSeed: Array<Omit<Transaction, 'id' | 'userId' | 'currency' | 'createdAt' | 'updatedAt'>> = [
      // August 2026 Income
      { type: 'income', amount: 145000, category: 'Salary', date: '2026-08-01', description: 'Tech Systems Monthly Salary', merchant: 'Infosys FinTech', paymentMethod: 'Net Banking' },
      { type: 'income', amount: 35000, category: 'Freelance', date: '2026-08-14', description: 'System Architecture Consulting', merchant: 'Global Client', paymentMethod: 'Net Banking' },
      { type: 'income', amount: 8400, category: 'Investments', date: '2026-08-20', description: 'Quarterly Mutual Fund Dividend', merchant: 'HDFC Securities', paymentMethod: 'Net Banking' },
      // August 2026 Expenses
      { type: 'expense', amount: 30000, category: 'Housing & Rent', date: '2026-08-02', description: 'Apartment Monthly Rent', merchant: 'Brigade Horizon', paymentMethod: 'Net Banking' },
      { type: 'expense', amount: 4850, category: 'Groceries', date: '2026-08-04', description: 'Weekly Organic Grocery Supply', merchant: 'Nature Basket', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3200, category: 'Dining & Entertainment', date: '2026-08-07', description: 'Team Dinner', merchant: 'Toscano Italian Bistro', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 5400, category: 'Groceries', date: '2026-08-11', description: 'Pantry Bulk Restock', merchant: 'DMart Superstore', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3100, category: 'Transportation', date: '2026-08-12', description: 'Monthly Metro & Commute Pass', merchant: 'BMRCL Metro', paymentMethod: 'UPI' },
      { type: 'expense', amount: 4200, category: 'Utilities & Bills', date: '2026-08-15', description: 'Electricity & High-speed Fiber', merchant: 'BESCOM & ACT Fibernet', paymentMethod: 'Net Banking' },
      { type: 'expense', amount: 3800, category: 'Shopping & Personal', date: '2026-08-18', description: 'Ergonomic Desk Accessories', merchant: 'Amazon India', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 4100, category: 'Groceries', date: '2026-08-22', description: 'Fresh Farm Produce', merchant: 'Blinkit Express', paymentMethod: 'UPI' },
      { type: 'expense', amount: 2600, category: 'Dining & Entertainment', date: '2026-08-25', description: 'Weekend Brunch with Friends', merchant: 'Blue Tokai Coffee', paymentMethod: 'UPI' },
      { type: 'expense', amount: 2200, category: 'Transportation', date: '2026-08-28', description: 'Airport Cab Transfer', merchant: 'Uber India', paymentMethod: 'UPI' },

      // September 2026 Income
      { type: 'income', amount: 145000, category: 'Salary', date: '2026-09-01', description: 'Tech Systems Monthly Salary', merchant: 'Infosys FinTech', paymentMethod: 'Net Banking' },
      { type: 'income', amount: 42000, category: 'Freelance', date: '2026-09-15', description: 'Machine Learning Algorithm Audit', merchant: 'Apex AI Labs', paymentMethod: 'Net Banking' },
      // September 2026 Expenses
      { type: 'expense', amount: 30000, category: 'Housing & Rent', date: '2026-09-02', description: 'Apartment Monthly Rent', merchant: 'Brigade Horizon', paymentMethod: 'Net Banking' },
      { type: 'expense', amount: 5100, category: 'Groceries', date: '2026-09-03', description: 'Monthly Essentials', merchant: 'DMart Superstore', paymentMethod: 'UPI' },
      { type: 'expense', amount: 4600, category: 'Dining & Entertainment', date: '2026-09-08', description: 'Anniversary Celebration Dinner', merchant: 'The Smoke Co.', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 4300, category: 'Groceries', date: '2026-09-12', description: 'Weekly Organic Grocery Supply', merchant: 'Nature Basket', paymentMethod: 'UPI' },
      { type: 'expense', amount: 4900, category: 'Utilities & Bills', date: '2026-09-15', description: 'Electricity & Water Utilities', merchant: 'BESCOM', paymentMethod: 'Net Banking' },
      { type: 'expense', amount: 3500, category: 'Transportation', date: '2026-09-17', description: 'Fuel & Highway Tolls', merchant: 'Indian Oil Corp', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 5200, category: 'Shopping & Personal', date: '2026-09-20', description: 'Professional Wardrobe Upgrades', merchant: 'Marks & Spencer', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 3900, category: 'Groceries', date: '2026-09-24', description: 'Artisanal Bakery & Produce', merchant: 'Nature Basket', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3100, category: 'Dining & Entertainment', date: '2026-09-27', description: 'Movie & Gourmet Snacks', merchant: 'PVR Director\'s Cut', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 2500, category: 'Healthcare & Medical', date: '2026-09-28', description: 'Routine Annual Bloodwork & Vitamins', merchant: 'Apollo Pharmacy', paymentMethod: 'UPI' },

      // October 2026 (Current Active Month) Income
      { type: 'income', amount: 152000, category: 'Salary', date: '2026-10-01', description: 'Tech Systems Monthly Salary (Post-appraisal)', merchant: 'Infosys FinTech', paymentMethod: 'Net Banking' },
      { type: 'income', amount: 38000, category: 'Freelance', date: '2026-10-18', description: 'Fintech Protocol Security Review', merchant: 'Zerodha Partner Lab', paymentMethod: 'Net Banking' },
      { type: 'income', amount: 11200, category: 'Investments', date: '2026-10-24', description: 'Government Sovereign Bond Coupon', merchant: 'RBI Retail Direct', paymentMethod: 'Net Banking' },
      // October 2026 Expenses
      { type: 'expense', amount: 30000, category: 'Housing & Rent', date: '2026-10-02', description: 'Apartment Monthly Rent', merchant: 'Brigade Horizon', paymentMethod: 'Net Banking' },
      { type: 'expense', amount: 4900, category: 'Groceries', date: '2026-10-03', description: 'Bi-weekly Household Grocery Run', merchant: 'DMart Superstore', paymentMethod: 'UPI' },
      { type: 'expense', amount: 3800, category: 'Dining & Entertainment', date: '2026-10-06', description: 'Weekend Sushi Lounge', merchant: 'Harima Japanese', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 2800, category: 'Transportation', date: '2026-10-09', description: 'Commute Metro Card Recharge', merchant: 'BMRCL Metro', paymentMethod: 'UPI' },
      { type: 'expense', amount: 4500, category: 'Utilities & Bills', date: '2026-10-12', description: 'Broadband, Mobile & Gas Pipeline', merchant: 'Airtel & GAIL', paymentMethod: 'UPI' },
      { type: 'expense', amount: 5600, category: 'Groceries', date: '2026-10-16', description: 'Gourmet Organic Ingredients & Pantry', merchant: 'Nature Basket', paymentMethod: 'UPI' },
      { type: 'expense', amount: 4200, category: 'Dining & Entertainment', date: '2026-10-19', description: 'Family Celebration Dinner', merchant: 'Farzi Cafe', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 4500, category: 'Shopping & Personal', date: '2026-10-21', description: 'Noise-Cancelling Headphones Case', merchant: 'Amazon India', paymentMethod: 'Credit Card' },
      { type: 'expense', amount: 3900, category: 'Groceries', date: '2026-10-24', description: 'Weekly Fresh Greens & Dairy', merchant: 'BigBasket Instant', paymentMethod: 'UPI' },
      { type: 'expense', amount: 2800, category: 'Dining & Entertainment', date: '2026-10-27', description: 'Microbrewery Social', merchant: 'Toit Brewpub', paymentMethod: 'UPI' },
      { type: 'expense', amount: 2400, category: 'Transportation', date: '2026-10-28', description: 'City Travel & Rideshare', merchant: 'Ola Cabs', paymentMethod: 'UPI' },
    ];

    let txCounter = 1;
    const demoTransactions: Transaction[] = txSeed.map(t => ({
      ...t,
      id: `tx_${txCounter++}`,
      userId: demoUserId,
      currency: 'INR',
      amount: Math.round(t.amount * 100) / 100,
      createdAt: `${t.date}T10:00:00.000Z`,
      updatedAt: `${t.date}T10:00:00.000Z`,
    }));

    // Demo chat conversation
    const demoChat: ChatMessage[] = [
      {
        id: 'msg_1',
        userId: demoUserId,
        role: 'user',
        content: 'How much did I spend on dining out this month, and how does it compare to my limit?',
        createdAt: '2026-10-28T14:10:00.000Z',
      },
      {
        id: 'msg_2',
        userId: demoUserId,
        role: 'assistant',
        content: 'For October 2026, you have spent **₹10,800** on **Dining & Entertainment** across 3 transactions (Sushi Lounge, Farzi Cafe, and Toit Brewpub). Your monthly budget limit is **₹12,000**, meaning you have utilized **90.0%** of your threshold. You have **₹1,200** remaining with 3 days left in the billing cycle.',
        toolInvocations: [
          {
            name: 'get_category_spending',
            params: { category: 'Dining & Entertainment', month: '2026-10' },
            result: { totalSpent: 10800, budgetLimit: 12000, remaining: 1200, utilization: 0.90 }
          }
        ],
        createdAt: '2026-10-28T14:10:02.000Z',
      }
    ];

    const demoAudit: AuditEvent[] = [
      {
        id: 'aud_1',
        userId: demoUserId,
        action: 'USER_LOGIN',
        details: 'Successful session authenticated from 127.0.0.1 via JWT',
        timestamp: '2026-10-29T02:00:00.000Z',
      },
      {
        id: 'aud_2',
        userId: demoUserId,
        action: 'ML_FORECAST_GENERATED',
        details: 'Calculated next month forecast: ₹74,520 with 88.4% historical MAE confidence',
        timestamp: '2026-10-29T02:01:00.000Z',
      }
    ];

    this.data.users = [demoUser];
    this.data.budgets = demoBudgets;
    this.data.goals = demoGoals;
    this.data.transactions = demoTransactions;
    this.data.chatMessages = demoChat;
    this.data.auditEvents = demoAudit;
  }

  // --- User Operations ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    // Cascade delete user data
    this.data.transactions = this.data.transactions.filter(t => t.userId !== id);
    this.data.budgets = this.data.budgets.filter(b => b.userId !== id);
    this.data.goals = this.data.goals.filter(g => g.userId !== id);
    this.data.chatMessages = this.data.chatMessages.filter(c => c.userId !== id);
    this.data.auditEvents = this.data.auditEvents.filter(a => a.userId !== id);
    this.persist();
    return true;
  }

  // --- Transaction Operations ---
  public getTransactions(
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      type?: 'income' | 'expense';
      category?: string;
      search?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: 'date' | 'amount';
      sortOrder?: 'asc' | 'desc';
    }
  ): Transaction[] {
    let list = this.data.transactions.filter(t => t.userId === userId);

    if (!filters) {
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (filters.startDate) {
      list = list.filter(t => t.date >= filters.startDate!);
    }
    if (filters.endDate) {
      list = list.filter(t => t.date <= filters.endDate!);
    }
    if (filters.type) {
      list = list.filter(t => t.type === filters.type);
    }
    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(t => t.category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        t =>
          t.description.toLowerCase().includes(q) ||
          (t.merchant && t.merchant.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
      );
    }
    if (filters.minAmount !== undefined) {
      list = list.filter(t => t.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      list = list.filter(t => t.amount <= filters.maxAmount!);
    }

    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    if (filters.sortBy === 'amount') {
      list.sort((a, b) => (a.amount - b.amount) * sortOrder);
    } else {
      list.sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * sortOrder);
    }

    return list;
  }

  public getTransactionById(userId: string, id: string): Transaction | undefined {
    return this.data.transactions.find(t => t.id === id && t.userId === userId);
  }

  public createTransaction(userId: string, item: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Transaction {
    const newTx: Transaction = {
      ...item,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      amount: Math.round(Number(item.amount) * 100) / 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.transactions.unshift(newTx);
    this.persist();
    return newTx;
  }

  public updateTransaction(userId: string, id: string, updates: Partial<Transaction>): Transaction | undefined {
    const idx = this.data.transactions.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return undefined;
    const current = this.data.transactions[idx];
    const updated: Transaction = {
      ...current,
      ...updates,
      amount: updates.amount !== undefined ? Math.round(Number(updates.amount) * 100) / 100 : current.amount,
      updatedAt: new Date().toISOString(),
    };
    this.data.transactions[idx] = updated;
    this.persist();
    return updated;
  }

  public deleteTransaction(userId: string, id: string): boolean {
    const idx = this.data.transactions.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return false;
    this.data.transactions.splice(idx, 1);
    this.persist();
    return true;
  }

  public bulkCreateTransactions(userId: string, items: Array<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Transaction[] {
    const created: Transaction[] = [];
    for (const item of items) {
      const newTx: Transaction = {
        ...item,
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        amount: Math.round(Number(item.amount) * 100) / 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.transactions.unshift(newTx);
      created.push(newTx);
    }
    this.persist();
    return created;
  }

  // --- Budgets ---
  public getBudgets(userId: string): Budget[] {
    return this.data.budgets.filter(b => b.userId === userId);
  }

  public createBudget(userId: string, item: { category: TransactionCategory; amount: number; warningThreshold?: number }): Budget {
    // Avoid duplicate active budgets for identical user & category
    const existingIdx = this.data.budgets.findIndex(b => b.userId === userId && b.category === item.category);
    if (existingIdx !== -1) {
      this.data.budgets[existingIdx].amount = Math.round(Number(item.amount) * 100) / 100;
      if (item.warningThreshold) {
        this.data.budgets[existingIdx].warningThreshold = item.warningThreshold;
      }
      this.data.budgets[existingIdx].updatedAt = new Date().toISOString();
      this.persist();
      return this.data.budgets[existingIdx];
    }

    const newBudget: Budget = {
      id: `bdg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      category: item.category,
      period: 'monthly',
      amount: Math.round(Number(item.amount) * 100) / 100,
      warningThreshold: item.warningThreshold ?? 0.80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.budgets.push(newBudget);
    this.persist();
    return newBudget;
  }

  public updateBudget(userId: string, id: string, updates: Partial<Budget>): Budget | undefined {
    const idx = this.data.budgets.findIndex(b => b.id === id && b.userId === userId);
    if (idx === -1) return undefined;
    const current = this.data.budgets[idx];
    const updated: Budget = {
      ...current,
      ...updates,
      amount: updates.amount !== undefined ? Math.round(Number(updates.amount) * 100) / 100 : current.amount,
      updatedAt: new Date().toISOString(),
    };
    this.data.budgets[idx] = updated;
    this.persist();
    return updated;
  }

  public deleteBudget(userId: string, id: string): boolean {
    const idx = this.data.budgets.findIndex(b => b.id === id && b.userId === userId);
    if (idx === -1) return false;
    this.data.budgets.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Savings Goals ---
  public getGoals(userId: string): SavingsGoal[] {
    return this.data.goals.filter(g => g.userId === userId);
  }

  public createGoal(userId: string, item: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): SavingsGoal {
    const newGoal: SavingsGoal = {
      ...item,
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      targetAmount: Math.round(Number(item.targetAmount) * 100) / 100,
      currentAmount: Math.round(Number(item.currentAmount || 0) * 100) / 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.goals.push(newGoal);
    this.persist();
    return newGoal;
  }

  public updateGoal(userId: string, id: string, updates: Partial<SavingsGoal>): SavingsGoal | undefined {
    const idx = this.data.goals.findIndex(g => g.id === id && g.userId === userId);
    if (idx === -1) return undefined;
    const current = this.data.goals[idx];
    const updated: SavingsGoal = {
      ...current,
      ...updates,
      targetAmount: updates.targetAmount !== undefined ? Math.round(Number(updates.targetAmount) * 100) / 100 : current.targetAmount,
      currentAmount: updates.currentAmount !== undefined ? Math.round(Number(updates.currentAmount) * 100) / 100 : current.currentAmount,
      updatedAt: new Date().toISOString(),
    };
    this.data.goals[idx] = updated;
    this.persist();
    return updated;
  }

  public deleteGoal(userId: string, id: string): boolean {
    const idx = this.data.goals.findIndex(g => g.id === id && g.userId === userId);
    if (idx === -1) return false;
    this.data.goals.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Chat & Assistant ---
  public getChatMessages(userId: string): ChatMessage[] {
    return this.data.chatMessages.filter(m => m.userId === userId);
  }

  public addChatMessage(userId: string, msg: Omit<ChatMessage, 'id' | 'userId' | 'createdAt'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.data.chatMessages.push(newMsg);
    this.persist();
    return newMsg;
  }

  public updateProposedActionStatus(userId: string, actionId: string, status: 'APPROVED' | 'REJECTED' | 'EXECUTED'): ChatMessage | undefined {
    for (const msg of this.data.chatMessages) {
      if (msg.userId === userId && msg.proposedAction && msg.proposedAction.id === actionId) {
        msg.proposedAction.status = status;
        this.persist();
        return msg;
      }
    }
    return undefined;
  }

  public clearChat(userId: string): void {
    this.data.chatMessages = this.data.chatMessages.filter(m => m.userId !== userId);
    this.persist();
  }

  // --- Audit Logs ---
  public recordAuditEvent(userId: string, action: string, details: string): AuditEvent {
    const ev: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditEvents.unshift(ev);
    if (this.data.auditEvents.length > 500) {
      this.data.auditEvents.pop();
    }
    this.persist();
    return ev;
  }

  public getAuditEvents(userId: string, limit = 50): AuditEvent[] {
    return this.data.auditEvents.filter(a => a.userId === userId).slice(0, limit);
  }
}

export const dbStore = new DatabaseStore();
