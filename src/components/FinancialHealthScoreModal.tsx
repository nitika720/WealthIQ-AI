import React from 'react';
import { FinancialHealthScore } from '../types/index.ts';
import { X, Award, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

interface HealthScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthScore: FinancialHealthScore;
}

export const FinancialHealthScoreModal: React.FC<HealthScoreModalProps> = ({
  isOpen,
  onClose,
  healthScore,
}) => {
  if (!isOpen) return null;

  const factors = [
    {
      name: 'Personal Savings Rate',
      weight: '25 Pts',
      data: healthScore.factors.savingsRate,
      target: 'Benchmark: >= 20% of net monthly income',
    },
    {
      name: 'Budget Discipline & Adherence',
      weight: '25 Pts',
      data: healthScore.factors.budgetDiscipline,
      target: 'Benchmark: 100% within allocated category limits',
    },
    {
      name: 'Expense-to-Income Ratio',
      weight: '25 Pts',
      data: healthScore.factors.expenseToIncomeRatio,
      target: 'Benchmark: Total outflow <= 60% of inflows',
    },
    {
      name: 'Cash Flow & Liquid Reserve Buffer',
      weight: '25 Pts',
      data: healthScore.factors.netCashflowStability,
      target: 'Benchmark: Consistently positive net cash flow + active emergency reserve',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">
              WealthIQ Financial Health Index — Transparent Formula
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Summary Score Banner */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                Composite Health Assessment
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                  {healthScore.score}
                </span>
                <span className="text-sm text-slate-500 font-mono">/ 100</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/80 text-indigo-300 ml-2">
                  Grade {healthScore.grade} · {healthScore.status}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 flex items-center justify-center font-mono font-bold text-xl text-indigo-400">
              {healthScore.grade}
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Factor Weighting & Empirical Evaluation (4 x 25 Pts = 100 Pts)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {factors.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{f.name}</span>
                    <span className="font-mono font-bold text-cyan-400 tabular-nums">
                      {f.data.score} / {f.data.max}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Recorded Metric:</span>
                    <span className="font-mono text-slate-200 font-medium">{f.data.value}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    {f.data.assessment}
                  </p>

                  <div className="pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500">
                    {f.target}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
            <h4 className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Prescriptive Optimization Directives:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {healthScore.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-lg flex items-start gap-2 text-[11px] text-amber-300/90 leading-relaxed">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Academic & Budgeting Model Disclaimer:</span>
              The WealthIQ Financial Health Score is an automated heuristic scoring model based purely on your recorded cash flow velocity, budget compliance, and liquid reserve tracking. It is designed for personal planning and education and is not an official credit bureau score or regulated financial advice.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
