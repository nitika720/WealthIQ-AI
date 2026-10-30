import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { currencySymbol } = useAuth();
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | '12m'>('6m');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsReport(timeframe);
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const handleDownloadReport = () => {
    window.location.href = '/api/v1/analytics/export';
  };

  const summary = report?.summary || {};
  const monthlySeries = report?.monthlySeries || [];
  const categoryAnalysis = report?.categoryAnalysis || [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Timeframe Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Financial Intelligence & Variance Reports
          </h1>
          <p className="text-xs text-slate-400">
            Multi-timeframe performance evaluation, budget variance tracking, and cashflow reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Timeframe Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {(['1m', '3m', '6m', '12m'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Period Total Inflows</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            +{currencySymbol}{summary.totalIncome?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Past {report?.monthsEvaluated || 6} months</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Period Total Outflow</span>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            -{currencySymbol}{summary.totalExpenses?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Disbursed expenditures</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Net Surplus / Savings</span>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {currencySymbol}{summary.totalNetSavings?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-emerald-400">Retained capital surplus</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Cumulative Savings Rate</span>
          <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            {summary.overallSavingsRate || 0}%
          </div>
          <span className="text-[11px] text-slate-500">Benchmark target: 20%</span>
        </div>
      </div>

      {/* Multi-Month Income vs Expense Bar Chart */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Monthly Inflow vs Outflow Variance</h3>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-400" /> Outflow
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Spending & Budget Variance Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Category Spending Variance & Benchmark Adherence</h3>
          <span className="text-xs text-slate-400 font-mono">
            Variance = Actual Spend − Budget Benchmark Target
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 px-2">Category</th>
                <th className="pb-3 px-2 text-right">Period Total Spend</th>
                <th className="pb-3 px-2 text-right">Monthly Run-rate</th>
                <th className="pb-3 px-2 text-right">Share of Outflow</th>
                <th className="pb-3 px-2 text-right">Budget Benchmark</th>
                <th className="pb-3 px-2 text-right">Variance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {categoryAnalysis.length > 0 ? (
                categoryAnalysis.map((cat: any) => (
                  <tr key={cat.category} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2 font-sans font-medium text-white">{cat.category}</td>
                    <td className="py-3 px-2 text-right font-bold text-white tabular-nums">
                      {currencySymbol}{cat.totalSpent?.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-400 tabular-nums">
                      {currencySymbol}{cat.monthlyAverage?.toLocaleString()} / mo
                    </td>
                    <td className="py-3 px-2 text-right text-slate-300 tabular-nums">
                      {cat.percentage}%
                    </td>
                    <td className="py-3 px-2 text-right text-slate-400 tabular-nums">
                      {cat.budgetBenchmark > 0 ? `${currencySymbol}${cat.budgetBenchmark.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {cat.varianceStatus === 'OVER' ? (
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded">
                          +{currencySymbol}{cat.variance.toLocaleString()} Over
                        </span>
                      ) : cat.varianceStatus === 'UNDER' ? (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                          {currencySymbol}{Math.abs(cat.variance).toLocaleString()} Under Cap
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          No Benchmark
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    Awaiting transactions for the selected timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
