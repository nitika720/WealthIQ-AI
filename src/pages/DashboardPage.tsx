import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/client.ts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PieChart as PieIcon,
  Award,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { FinancialHealthScoreModal } from '../components/FinancialHealthScoreModal.tsx';
import { TransactionModal } from '../components/TransactionModal.tsx';
import { FinancialHealthScore, Transaction } from '../types/index.ts';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#64748B'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, currencySymbol } = useAuth();
  const [data, setData] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardCharts(),
      ]);

      if (sumRes.success) {
        setData(sumRes.data);
      }
      if (chartRes.success) {
        setTrends(chartRes.data.trends || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleSaveTransaction = async (txData: any) => {
    await api.createTransaction(txData);
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-900 rounded-xl border border-slate-800" />
          <div className="h-72 bg-slate-900 rounded-xl border border-slate-800" />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const healthScore = data?.healthScore as FinancialHealthScore;
  const forecast = data?.forecastPreview;
  const categoryBreakdown = data?.categoryBreakdown || [];
  const recentTransactions = (data?.recentTransactions || []) as Transaction[];
  const goalsSummary = data?.goalsSummary || [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Breadcrumb & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Financial Health & Predictive Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-account ledger for <span className="text-slate-200 font-medium">{user?.name}</span> ({data?.period || 'Current Cycle'})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
          <button
            onClick={() => setTxModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Period Total Income</span>
            <div className="w-7 h-7 rounded-md bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {currencySymbol}{kpis.totalIncome?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span>Active recorded inflows</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Period Total Outflow</span>
            <div className="w-7 h-7 rounded-md bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {currencySymbol}{kpis.totalExpenses?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400">
            Across {categoryBreakdown.length} active categories
          </div>
        </div>

        {/* Net Cash Flow Card */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Cash Flow & Savings</span>
            <div className="w-7 h-7 rounded-md bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${
            kpis.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {currencySymbol}{kpis.netCashFlow?.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Savings Rate: <span className="font-semibold text-white">{kpis.savingsRate || 0}%</span> (Target: 20%)
          </div>
        </div>

        {/* Budget Utilization Card */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Budget Utilization</span>
            <div className="w-7 h-7 rounded-md bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <PieIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${
            kpis.budgetUtilizationPct > 100
              ? 'text-rose-400'
              : kpis.budgetUtilizationPct >= 80
              ? 'text-amber-400'
              : 'text-cyan-400'
          }`}>
            {kpis.budgetUtilizationPct || 0}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {currencySymbol}{kpis.totalBudgetSpent?.toLocaleString() || 0} of {currencySymbol}{kpis.totalBudgetLimit?.toLocaleString() || 0} limit
          </div>
        </div>
      </div>

      {/* Financial Health Score & ML Forecast Headline Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Financial Health Index</h3>
            </div>
            <button
              onClick={() => setHealthModalOpen(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
            >
              Formula Details
            </button>
          </div>

          {healthScore ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    {healthScore.score}
                  </span>
                  <span className="text-xs text-slate-500 font-mono"> / 100</span>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-800/70 text-xs font-semibold text-indigo-300 font-mono">
                  Grade {healthScore.grade} · {healthScore.status}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${healthScore.score}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 leading-snug">
                {healthScore.recommendations[0] || 'Overall financial metrics are balanced.'}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Awaiting transaction records...</div>
          )}
        </div>

        {/* Machine Learning Forecast Preview */}
        <div className="lg:col-span-2 p-5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Predictive Expense Forecast (Next Month)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('forecasts')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Risk Model</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {forecast ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-1">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-0.5">Projected Outflow</span>
                <span className="text-xl font-bold text-white font-mono tabular-nums">
                  {currencySymbol}{forecast.predictedExpense?.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Lag-regression estimate
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-0.5">95% Confidence Bounds</span>
                <span className="text-xs font-mono font-semibold text-cyan-300 block tabular-nums">
                  {currencySymbol}{forecast.confidenceLower?.toLocaleString()} – {currencySymbol}{forecast.confidenceUpper?.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Residual variance
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-0.5">Validation Accuracy</span>
                <span className="text-xs font-mono font-semibold text-emerald-400 block tabular-nums">
                  MAE: ±{currencySymbol}{forecast.mae?.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Time-split verified
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Calculating forecast vectors...</div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Model: {forecast?.model || 'Adaptive Time-Series Forecaster'}</span>
            <span className="text-slate-500">Estimates based on historical expenditure velocities</span>
          </div>
        </div>
      </div>

      {/* Charts Section: Cashflow Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trends Chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Monthly Cash Flow Trajectory (Last 6 Months)</h3>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Expense Distribution</h3>

          {categoryBreakdown.length > 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown.slice(0, 5)}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.slice(0, 5).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="w-full space-y-1 text-xs">
                {categoryBreakdown.slice(0, 3).map((cat: any, i: number) => (
                  <div key={cat.category} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{cat.category}</span>
                    </span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {currencySymbol}{cat.amount?.toLocaleString()} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No expenses recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Savings Goals & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Goals Widget */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Active Savings Goals</h3>
            </div>
            <button
              onClick={() => onNavigate('goals')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {goalsSummary.length > 0 ? (
              goalsSummary.map((goal: any) => (
                <div key={goal.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-[180px]">{goal.name}</span>
                    <span className="font-mono text-emerald-400 font-semibold tabular-nums">{goal.progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, goal.progressPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{currencySymbol}{goal.currentAmount?.toLocaleString()}</span>
                    <span>Target: {currencySymbol}{goal.targetAmount?.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No active goals created yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Ledger */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Ledger Transactions</h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-mono text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="py-2.5 text-white font-medium max-w-[200px] truncate">
                        {tx.description}
                        {tx.merchant && (
                          <span className="block text-[10px] text-slate-500 font-normal truncate">
                            {tx.merchant}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-400 whitespace-nowrap">{tx.category}</td>
                      <td className={`py-2.5 text-right font-mono font-semibold whitespace-nowrap tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No recent transaction entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {healthScore && (
        <FinancialHealthScoreModal
          isOpen={healthModalOpen}
          onClose={() => setHealthModalOpen(false)}
          healthScore={healthScore}
        />
      )}

      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};
