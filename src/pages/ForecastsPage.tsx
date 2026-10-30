import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ForecastResult } from '../types/index.ts';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

export const ForecastsPage: React.FC = () => {
  const { currencySymbol } = useAuth();
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getForecasts();
      if (res.success && res.data) {
        setForecast(res.data.forecast);
        setTimeline(res.data.timeline || []);
      }
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setRetrainSuccess(null);
      const res = await api.recomputeForecast();
      if (res.success && res.data) {
        setForecast(res.data);
        setRetrainSuccess(res.message);
        setTimeout(() => setRetrainSuccess(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Model retrain failed');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Machine Learning Predictive Expense Forecaster
          </h1>
          <p className="text-xs text-slate-400">
            Lag-regression and seasonal exponential smoothing pipeline predicting future outflow with interval variance.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Re-training Models...' : 'Re-train ML Forecaster'}</span>
        </button>
      </div>

      {retrainSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{retrainSuccess}</span>
        </div>
      )}

      {/* KPI Forecast Overview Strip */}
      {forecast && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-xs text-slate-400">Predicted Next Month Outflow</span>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {currencySymbol}{forecast.predictedTotalExpense.toLocaleString()}
            </div>
            <span className="text-[11px] text-cyan-400 font-mono">
              Model: {forecast.model.split(' ')[0]}
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-xs text-slate-400">95% Confidence Interval</span>
            <div className="text-sm font-bold text-cyan-300 font-mono tabular-nums">
              {currencySymbol}{forecast.confidenceLower.toLocaleString()} – {currencySymbol}{forecast.confidenceUpper.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Residual variance ±{currencySymbol}{(forecast.confidenceUpper - forecast.predictedTotalExpense).toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-xs text-slate-400">Historical Error (MAE)</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              ±{currencySymbol}{forecast.historicalMae.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              vs Baseline: ±{currencySymbol}{forecast.baselineMae.toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <span className="text-xs text-slate-400">Model Performance Gain</span>
            <div className="text-2xl font-bold text-indigo-400 font-mono tabular-nums">
              +{forecast.accuracyImprovementPct}%
            </div>
            <span className="text-[11px] text-slate-500">
              Improvement over simple average
            </span>
          </div>
        </div>
      )}

      {/* Projection Timeline Chart */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Expenditure Velocity & Projection Timeline
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Historical Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> ML Forecast Point
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
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
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#94A3B8"
                strokeWidth={2}
                dot={{ r: 4, fill: '#94A3B8' }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#06B6D4"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 5, fill: '#06B6D4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown & Budget Overrun Risk Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Category-Wise Predictive Risk Matrix</h3>
          <span className="text-xs text-slate-400 font-mono">
            Evaluated against your active spending limits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 px-2">Category</th>
                <th className="pb-3 px-2 text-right">Predicted Next Month</th>
                <th className="pb-3 px-2 text-right">Current Monthly Average</th>
                <th className="pb-3 px-2 text-center">Trend Trajectory</th>
                <th className="pb-3 px-2 text-right">Budget Limit Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {forecast?.categoryBreakdown && forecast.categoryBreakdown.length > 0 ? (
                forecast.categoryBreakdown.map(cat => (
                  <tr key={cat.category} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2 font-sans font-medium text-white">{cat.category}</td>
                    <td className="py-3 px-2 text-right font-bold text-white tabular-nums">
                      {currencySymbol}{cat.predictedAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-400 tabular-nums">
                      {currencySymbol}{cat.currentAvg.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {cat.trend === 'increasing' ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Increasing
                        </span>
                      ) : cat.trend === 'decreasing' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Decreasing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                          <Minus className="w-3.5 h-3.5" /> Stable
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {cat.riskVsBudget === 'EXCEEDED' ? (
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded">
                          Will Breach Limit
                        </span>
                      ) : cat.riskVsBudget === 'WARNING' ? (
                        <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
                          Approaching Limit
                        </span>
                      ) : cat.riskVsBudget === 'SAFE' ? (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                          Safe & Within Cap
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          No Active Budget
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    Awaiting sufficient monthly category records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Limitations & Scientific Disclosure */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-white font-semibold block mb-0.5">Model Transparency & Evaluation Rigor:</span>
          {forecast?.limitationsNotice ||
            'Forecasting models utilize lag-order features, time-based splits to eliminate lookahead leakage, and residual standard error prediction intervals. Forecasts represent mathematical estimates and are not guaranteed predictions.'}
        </div>
      </div>
    </div>
  );
};
