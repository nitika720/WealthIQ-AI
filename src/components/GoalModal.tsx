import React, { useState, useEffect } from 'react';
import { SavingsGoal } from '../types/index.ts';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: SavingsGoal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { currencySymbol } = useAuth();
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [category, setCategory] = useState<string>('Emergency Reserve');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTargetAmount(initialData.targetAmount.toString());
      setCurrentAmount(initialData.currentAmount.toString());
      setTargetDate(initialData.targetDate);
      setCategory(initialData.category || 'Emergency Reserve');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      // Default 6 months in future
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      setTargetDate(future.toISOString().substring(0, 10));
      setCategory('Emergency Reserve');
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tAmt = parseFloat(targetAmount);
    const cAmt = parseFloat(currentAmount) || 0;

    if (!name.trim()) {
      setError('Please provide a goal title.');
      return;
    }
    if (isNaN(tAmt) || tAmt <= 0) {
      setError('Target amount must be a positive number.');
      return;
    }
    if (!targetDate) {
      setError('Target date is required.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        name: name.trim(),
        targetAmount: tAmt,
        currentAmount: cAmt,
        targetDate,
        category,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save savings goal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">
            {initialData ? 'Update Savings Target' : 'Create New Savings Goal'}
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
            <label className="text-xs font-medium text-slate-300">Goal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 6-Month Emergency Fund or Home Downpayment"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Amount ({currencySymbol})</label>
              <input
                type="number"
                step="1"
                required
                placeholder="250000"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Current Accumulated</label>
              <input
                type="number"
                step="1"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Category Tag</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Emergency Reserve">Emergency Reserve</option>
                <option value="Automobile">Automobile</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Travel & Vacation">Travel & Vacation</option>
                <option value="Retirement">Retirement</option>
                <option value="General Savings">General Savings</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Strategy / Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Monthly SIP into debt mutual fund"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
            />
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
              {submitting ? 'Saving...' : initialData ? 'Update Goal' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
