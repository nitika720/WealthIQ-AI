import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { SavingsGoal } from '../types/index.ts';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';
import { GoalModal } from '../components/GoalModal.tsx';

export const GoalsPage: React.FC = () => {
  const { currencySymbol } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.getGoals();
      if (res.success && res.data) {
        setGoals(res.data);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSaveGoal = async (data: any) => {
    if (selectedGoal) {
      await api.updateGoal(selectedGoal.id, data);
    } else {
      await api.createGoal(data);
    }
    fetchGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Delete this savings goal?')) {
      await api.deleteGoal(id);
      fetchGoals();
    }
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalAccumulated = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Savings Goals & Liquid Reserves
          </h1>
          <p className="text-xs text-slate-400">
            Automated progress tracking with required monthly capital contribution algorithms.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedGoal(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Savings Goal</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Total Capital Accumulated</span>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {currencySymbol}{totalAccumulated.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400">
            Across {goals.length} target milestones
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Cumulative Target Requirement</span>
          <div className="text-2xl font-bold text-slate-300 font-mono tabular-nums">
            {currencySymbol}{totalTarget.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">
            Total future capital goals
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Aggregate Progress Ratio</span>
          <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            {overallProgress}%
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(goal => {
          const isDone = goal.currentAmount >= goal.targetAmount;
          return (
            <div
              key={goal.id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{goal.name}</h3>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Category: {goal.category || 'Savings'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-bold tabular-nums">
                    {goal.progressPct}% Funded
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    Target: {goal.targetDate}
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, goal.progressPct || 0)}%` }}
                  />
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Accumulated</span>
                  <span className="font-semibold text-white tabular-nums">
                    {currencySymbol}{goal.currentAmount.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Target Cap</span>
                  <span className="font-semibold text-slate-300 tabular-nums">
                    {currencySymbol}{goal.targetAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Monthly Contribution Recommendation */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Required Monthly SIP:</span>
                <span className="font-mono font-bold text-cyan-300 tabular-nums">
                  {isDone ? (
                    <span className="text-emerald-400">Target Achieved 🎉</span>
                  ) : (
                    `${currencySymbol}${(goal.requiredMonthlyContribution || 0).toLocaleString()} / mo (${goal.monthsRemaining || 1} mos)`
                  )}
                </span>
              </div>

              {goal.notes && (
                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/40">
                  "{goal.notes}"
                </p>
              )}
            </div>
          );
        })}

        {goals.length === 0 && !loading && (
          <div className="col-span-3 p-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
            <Target className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No active savings targets initialized.</p>
            <button
              onClick={() => {
                setSelectedGoal(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Establish Safety Net or Downpayment Goal</span>
            </button>
          </div>
        )}
      </div>

      <GoalModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedGoal(null);
        }}
        onSave={handleSaveGoal}
        initialData={selectedGoal}
      />
    </div>
  );
};
