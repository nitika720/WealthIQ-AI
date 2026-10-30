import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  TrendingUp,
  Bot,
  PieChart,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Sliders,
  Database,
  BarChart2
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const { demoLogin, currencySymbol } = useAuth();
  const [simIncome, setSimIncome] = useState<number>(150000);
  const [simExpense, setSimExpense] = useState<number>(75000);

  const simSavings = Math.max(0, simIncome - simExpense);
  const simSavingsRate = simIncome > 0 ? Math.round((simSavings / simIncome) * 100) : 0;
  const simAnnualWealth = simSavings * 12;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-28 max-w-6xl mx-auto w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Autonomous Personal Finance Management & Predictive Budgeting Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans max-w-4xl mx-auto">
          Predictive Financial Intelligence for Modern Wealth Builders
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          WealthIQ combines machine learning time-series expense forecasting, explainable financial health scoring, and server-side Gemini AI copilot workflows to keep you perpetually ahead of your budgets.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => demoLogin()}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <span>Launch Live Interactive Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Create Free Account
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-16 text-left">
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">ML Forecasting Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lag-regression and exponential moving-average pipeline forecasting next-month total expenses with 95% confidence intervals and MAE error bounds.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Agentic AI Copilot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by server-side Gemini 3.8 Flash with tool calling, strict data isolation, and user confirmation before executing any state changes.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Adaptive Budget Caps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monthly category limits with real-time calculated utilization, early warning thresholds (80%), and historical adherence analysis.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Health Score Index</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent, explainable 100-point algorithm evaluating savings velocity, budget adherence, and liquid emergency reserves.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Savings & Cashflow Simulator */}
      <section className="px-6 py-16 bg-slate-950 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Interactive Cash Flow & Compounding Simulator</h2>
            <p className="text-xs text-slate-400">
              Simulate your savings rate trajectory and annualized capital surplus based on your monthly cash flow.
            </p>
          </div>

          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Monthly Net Inflow</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {currencySymbol}{simIncome.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="30000"
                  max="500000"
                  step="5000"
                  value={simIncome}
                  onChange={e => setSimIncome(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Expense Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Monthly Baseline Outflow</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {currencySymbol}{simExpense.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="400000"
                  step="5000"
                  value={simExpense}
                  onChange={e => setSimExpense(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Output Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-1">Monthly Net Surplus</span>
                <span className="font-mono text-xl font-extrabold text-white tabular-nums">
                  {currencySymbol}{simSavings.toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-1">Effective Savings Rate</span>
                <span className={`font-mono text-xl font-extrabold tabular-nums ${
                  simSavingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {simSavingsRate}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {simSavingsRate >= 20 ? 'Benchmark achieved' : 'Below 20% target'}
                </span>
              </div>
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-[11px] text-slate-400 block mb-1">Annual Investable Capital</span>
                <span className="font-mono text-xl font-extrabold text-cyan-400 tabular-nums">
                  {currencySymbol}{simAnnualWealth.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Architecture Footnote */}
      <footer className="mt-auto px-6 py-8 border-t border-slate-900 bg-[#0B0F19] text-center text-xs text-slate-500 space-y-2">
        <p>WealthIQ AI Engine · Production Full-Stack Fintech Platform</p>
        <p className="text-[11px] text-slate-600">
          TypeScript / React 19 / Express / Python scikit-learn ML Forecasting / Server-Side Gemini 3.8 Copilot
        </p>
      </footer>
    </div>
  );
};
