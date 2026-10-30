import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Budget } from '../types/index.ts';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { BudgetModal } from '../components/BudgetModal.tsx';

export const BudgetsPage: React.FC = () => {
  const { currencySymbol } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.getBudgets(selectedMonth);
      if (res.success && res.data) {
        setBudgets(res.data.budgets);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const handleSaveBudget = async (data: any) => {
    if (selectedBudget) {
      await api.updateBudget(selectedBudget.id, data);
    } else {
      await api.createBudget(data);
    }
    fetchBudgets();
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Delete this budget limit?')) {
      await api.deleteBudget(id);
      fetchBudgets();
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Category Spending Limits & Budgets</h1>
          <p className="text-xs text-slate-400">
            Automated spending caps calculated from actual ledger disbursements with proactive threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none cursor-pointer text-xs"
            />
          </div>

          <button
            onClick={() => {
              setSelectedBudget(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set New Budget</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Total Monthly Allocated</span>
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {currencySymbol}{summary.totalBudgeted?.toLocaleString() || '0'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Cumulative limits</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Spent in Budgeted Categories</span>
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {currencySymbol}{summary.totalSpent?.toLocaleString() || '0'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Actual outflows</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Available Remaining Cap</span>
          <div className={`text-xl font-bold font-mono tabular-nums ${
            summary.totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {currencySymbol}{summary.totalRemaining?.toLocaleString() || '0'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Buffer before overspend</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Overall Utilization</span>
          <div className={`text-xl font-bold font-mono tabular-nums ${
            summary.overallUtilizationPct > 100
              ? 'text-rose-400'
              : summary.overallUtilizationPct >= 80
              ? 'text-amber-400'
              : 'text-cyan-400'
          }`}>
            {summary.overallUtilizationPct || 0}%
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {summary.exceededCount || 0} breached, {summary.warningAlertsCount || 0} in warning
          </span>
        </div>
      </div>

      {/* Threshold Alert Callout if breached or in warning */}
      {(summary.exceededCount > 0 || summary.warningAlertsCount > 0) && (
        <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-amber-300 block">
              Budget Adherence Alerts Active for {selectedMonth}
            </span>
            <p className="text-slate-300 leading-relaxed">
              {summary.exceededCount > 0 && (
                <span><strong>{summary.exceededCount}</strong> categories have exceeded their monthly spending ceiling. </span>
              )}
              {summary.warningAlertsCount > 0 && (
                <span><strong>{summary.warningAlertsCount}</strong> categories are approaching or past their 80% warning threshold.</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map(b => {
          const spent = b.spent || 0;
          const limit = b.amount;
          const remaining = b.remaining || 0;
          const pct = b.utilizationPct || 0;
          const isExceeded = b.status === 'EXCEEDED';
          const isWarning = b.status === 'WARNING';

          return (
            <div
              key={b.id}
              className={`p-5 bg-slate-900/80 border rounded-xl space-y-4 transition-all ${
                isExceeded
                  ? 'border-rose-800/80 shadow-md shadow-rose-950/20'
                  : isWarning
                  ? 'border-amber-800/80 shadow-md shadow-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{b.category}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">Monthly Cycle</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedBudget(b);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Budget"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Percent */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold font-mono tabular-nums ${
                    isExceeded ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-300'
                  }`}>
                    {pct}% utilized
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Threshold: {b.warningThresholdPct}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-400'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Numbers Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Disbursed</span>
                  <span className="font-semibold text-white tabular-nums">
                    {currencySymbol}{spent.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Spending Cap</span>
                  <span className="font-semibold text-slate-300 tabular-nums">
                    {currencySymbol}{limit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Badge Tag */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {remaining >= 0 ? 'Remaining Cushion:' : 'Overrun Deficit:'}
                </span>
                <span className={`font-mono font-bold tabular-nums ${
                  remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {remaining >= 0 ? '' : '-'}{currencySymbol}{Math.abs(remaining).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && !loading && (
          <div className="col-span-3 p-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
            <PieChart className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No active category budgets established yet.</p>
            <button
              onClick={() => {
                setSelectedBudget(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Monthly Budget</span>
            </button>
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBudget(null);
        }}
        onSave={handleSaveBudget}
        initialData={selectedBudget}
      />
    </div>
  );
};
