import assert from 'assert';
import { dbStore } from '../src/server/db/store.ts';
import { calculateFinancialHealthScore } from '../src/server/services/health_score.service.ts';
import { generateExpenseForecast } from '../src/server/services/ml_forecast.service.ts';
import { generateDeterministicAdvice } from '../src/server/services/ai_copilot.service.ts';

export async function runAllTests() {
  console.log('🧪 Starting WealthIQ Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // --- Test Suite 1: Financial Arithmetic & Decimal Safety ---
  test('Financial Math: Transactions retain 2 decimal precision without floating point drift', () => {
    const testUserId = `test_usr_${Date.now()}`;
    const tx = dbStore.createTransaction(testUserId, {
      type: 'expense',
      amount: 19.999, // Should round to 20.00 or 19.99
      currency: 'INR',
      category: 'Groceries',
      date: '2026-10-29',
      description: 'Precision test',
    });
    assert.strictEqual(tx.amount, 20);
    assert.strictEqual(typeof tx.amount, 'number');
    dbStore.deleteTransaction(testUserId, tx.id);
  });

  // --- Test Suite 2: Strict Multi-User Data Isolation ---
  test('Data Isolation: User B cannot retrieve User A transactions or budgets', () => {
    const userA = 'isolated_user_A';
    const userB = 'isolated_user_B';

    const txA = dbStore.createTransaction(userA, {
      type: 'income',
      amount: 50000,
      currency: 'INR',
      category: 'Salary',
      date: '2026-10-29',
      description: 'Private Salary of User A',
    });

    const bResults = dbStore.getTransactions(userB);
    const leaked = bResults.some(t => t.id === txA.id || t.description.includes('User A'));
    assert.strictEqual(leaked, false, 'User B must never observe User A records');

    const singleLookup = dbStore.getTransactionById(userB, txA.id);
    assert.strictEqual(singleLookup, undefined, 'Direct IDOR lookup by unauthorized user must yield undefined');

    // Cleanup
    dbStore.deleteTransaction(userA, txA.id);
  });

  // --- Test Suite 3: Financial Health Score Explainability ---
  test('Health Score: Calculates explainable factors totaling 0-100 without hallucinations', () => {
    const mockTx: any[] = [
      { type: 'income', amount: 100000, date: '2026-10-01', category: 'Salary' },
      { type: 'expense', amount: 40000, date: '2026-10-05', category: 'Housing & Rent' },
      { type: 'expense', amount: 10000, date: '2026-10-10', category: 'Groceries' },
    ];
    const mockBudgets: any[] = [
      { category: 'Housing & Rent', amount: 45000, warningThreshold: 0.8 },
      { category: 'Groceries', amount: 12000, warningThreshold: 0.8 },
    ];
    const mockGoals: any[] = [
      { name: 'Emergency Fund', targetAmount: 200000, currentAmount: 160000 },
    ];

    const result = calculateFinancialHealthScore(mockTx, mockBudgets, mockGoals, '2026-10');
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(result.grade.length >= 1);
    assert.ok(result.factors.savingsRate.score <= 25);
    assert.ok(result.factors.budgetDiscipline.score <= 25);
    assert.ok(result.factors.expenseToIncomeRatio.score <= 25);
    assert.ok(result.factors.netCashflowStability.score <= 25);
    assert.ok(result.recommendations.length > 0);
  });

  // --- Test Suite 4: ML Forecasting Pipeline & Evaluation ---
  test('ML Forecaster: Computes linear trend + EMA baseline with non-zero interval bounds', () => {
    const mockTx: any[] = [
      { type: 'expense', amount: 50000, date: '2026-08-10', category: 'Housing & Rent' },
      { type: 'expense', amount: 55000, date: '2026-09-10', category: 'Housing & Rent' },
      { type: 'expense', amount: 60000, date: '2026-10-10', category: 'Housing & Rent' },
    ];
    const mockBudgets: any[] = [
      { category: 'Housing & Rent', amount: 58000, warningThreshold: 0.85 },
    ];

    const forecast = generateExpenseForecast(mockTx, mockBudgets);
    assert.ok(forecast.predictedTotalExpense > 50000);
    assert.ok(forecast.confidenceLower < forecast.confidenceUpper);
    assert.ok(forecast.historicalMae >= 0);
    assert.ok(forecast.limitationsNotice.length > 0);
    assert.strictEqual(forecast.riskSummary.highestRiskCategory, 'Housing & Rent');
  });

  // --- Test Suite 5: AI Copilot Deterministic Fallback & Tool Calling ---
  test('AI Copilot: Generates deterministic budgeting response with tool metadata', () => {
    const testUser = 'usr_demo_wealthiq_99';
    const res = generateDeterministicAdvice(testUser, 'Where did I spend the most this month?');
    assert.ok(res.answer.length > 20);
    assert.ok(res.toolInvocations && res.toolInvocations.length > 0);
  });

  test('AI Copilot: Proposes state-changing budget requiring explicit confirmation', () => {
    const testUser = 'usr_demo_wealthiq_99';
    const res = generateDeterministicAdvice(testUser, 'Help me create a budget for Dining & Entertainment');
    assert.ok(res.proposedAction !== undefined);
    assert.strictEqual(res.proposedAction?.status, 'PENDING_CONFIRMATION');
  });

  console.log(`\n📊 Test Run Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}
