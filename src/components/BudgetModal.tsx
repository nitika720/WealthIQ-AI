import React, { useState, useEffect } from 'react';
import { Budget, TransactionCategory } from '../types/index.ts';
import { X, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: Budget | null;
}

const BUDGET_CATEGORIES: TransactionCategory[] = [
  'Housing & Rent',
  'Groceries',
  'Dining & Entertainment',
  'Transportation',
  'Utilities & Bills',
  'Healthcare & Medical',
  'Shopping & Personal',
  'Education',
  'Travel',
  'Miscellaneous',
];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { currencySymbol } = useAuth();
  const [category, setCategory] = useState<TransactionCategory>('Groceries');
  const [amount, setAmount] = useState<string>('');
  const [warningThreshold, setWarningThreshold] = useState<number>(0.80);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setAmount(initialData.amount.toString());
      setWarningThreshold(initialData.warningThreshold || 0.80);
    } else {
      setCategory('Groceries');
      setAmount('');
      setWarningThreshold(0.80);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please provide a positive budget limit amount.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        category,
        amount: parsed,
        warningThreshold,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to establish budget limit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">
            {initialData ? 'Adjust Monthly Budget' : 'Establish Monthly Category Budget'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Category</label>
            <select
              disabled={!!initialData}
              value={category}
              onChange={e => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
            >
              {BUDGET_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Monthly Spending Cap ({currencySymbol})</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="1"
                required
                placeholder="20000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Warning threshold slider */}
          <div className="space-y-2 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Alert Warning Threshold
              </span>
              <span className="font-mono text-amber-400 font-semibold">
                {Math.round(warningThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={warningThreshold}
              onChange={e => setWarningThreshold(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              WealthIQ will trigger in-app warnings when spending reaches{' '}
              {currencySymbol}
              {amount ? (parseFloat(amount) * warningThreshold).toLocaleString() : '0'}.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Cap' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
