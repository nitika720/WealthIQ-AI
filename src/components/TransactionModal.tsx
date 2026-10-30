import React, { useState, useEffect } from 'react';
import { Transaction, TransactionCategory, TransactionType } from '../types/index.ts';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: Transaction | null;
}

const CATEGORIES: TransactionCategory[] = [
  'Housing & Rent',
  'Groceries',
  'Dining & Entertainment',
  'Transportation',
  'Utilities & Bills',
  'Healthcare & Medical',
  'Shopping & Personal',
  'Education',
  'Travel',
  'Salary',
  'Freelance',
  'Investments',
  'Other Income',
  'Miscellaneous',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { currencySymbol } = useAuth();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('Groceries');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDate(initialData.date);
      setDescription(initialData.description);
      setMerchant(initialData.merchant || '');
      setPaymentMethod(initialData.paymentMethod || 'UPI');
    } else {
      setType('expense');
      setAmount('');
      setCategory('Groceries');
      setDate(new Date().toISOString().substring(0, 10));
      setDescription('');
      setMerchant('');
      setPaymentMethod('UPI');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please specify a positive numerical amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description or merchant reference.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        type,
        amount: parsedAmount,
        category,
        date,
        description: description.trim(),
        merchant: merchant.trim() || undefined,
        paymentMethod,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">
            {initialData ? 'Edit Transaction Record' : 'Record New Transaction'}
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

          {/* Type Segmented Control */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Income (Inflow)
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Amount ({currencySymbol})</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TransactionCategory)}
                className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Payment Instrument</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Description & Merchant */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Description / Memo</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly cloud subscription or organic groceries"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Merchant / Counterparty (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Amazon, Nature's Basket, Netflix"
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full px-3 py-2 text-xs text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
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
              {submitting ? 'Saving...' : initialData ? 'Update Record' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
