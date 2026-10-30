import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Transaction, TransactionCategory, TransactionType } from '../types/index.ts';
import {
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { TransactionModal } from '../components/TransactionModal.tsx';
import { CsvImportModal } from '../components/CsvImportModal.tsx';

const CATEGORIES: string[] = [
  'ALL',
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

export const TransactionsPage: React.FC = () => {
  const { currencySymbol } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netCashflow: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 25,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (type !== 'ALL') params.type = type;
      if (category !== 'ALL') params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const res = await api.getTransactions(params);
      if (res.success && res.data) {
        setTransactions(res.data.transactions);
        setTotalCount(res.data.pagination.totalCount);
        setTotalPages(res.data.pagination.totalPages);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, sortBy, sortOrder, type, category]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setType('ALL');
    setCategory('ALL');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleSaveTransaction = async (data: any) => {
    if (selectedTx) {
      await api.updateTransaction(selectedTx.id, data);
    } else {
      await api.createTransaction(data);
    }
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction record?')) {
      try {
        setDeletingId(id);
        await api.deleteTransaction(id);
        fetchTransactions();
      } catch (err: any) {
        alert(err.message || 'Failed to delete transaction');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleExportCsv = () => {
    window.location.href = api.getExportCsvUrl();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Financial Transactions Ledger</h1>
          <p className="text-xs text-slate-400">
            Immutable decimal-accurate audit ledger with multi-parameter filtering and CSV sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedTx(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
        <form onSubmit={handleApplyFilter} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description, merchant, or notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs text-white bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={type}
              onChange={e => {
                setType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs text-white bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>

            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs text-white bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 border rounded-lg transition-colors cursor-pointer shrink-0 ${
                showAdvancedFilters
                  ? 'bg-indigo-950 border-indigo-700 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Advanced Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs text-white bg-slate-950 border border-slate-800 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs text-white bg-slate-950 border border-slate-800 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Min Amount ({currencySymbol})</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs text-white bg-slate-950 border border-slate-800 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Max Amount ({currencySymbol})</label>
              <input
                type="number"
                placeholder="100000"
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs text-white bg-slate-950 border border-slate-800 rounded-md font-mono"
              />
            </div>

            <div className="sm:col-span-4 flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={fetchTransactions}
                className="px-3.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors cursor-pointer"
              >
                Apply Criteria
              </button>
            </div>
          </div>
        )}

        {/* Ledger Inflow/Outflow Filter Summary */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div>
            Showing <span className="font-mono text-white font-semibold">{totalCount}</span> records matching criteria
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Inflows: <strong className="text-emerald-400">+{currencySymbol}{summary.totalIncome.toLocaleString()}</strong></span>
            <span>Outflows: <strong className="text-rose-400">-{currencySymbol}{summary.totalExpense.toLocaleString()}</strong></span>
            <span>Net: <strong className={summary.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{currencySymbol}{summary.netCashflow.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
                <th
                  onClick={() => {
                    if (sortBy === 'date') {
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    } else {
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4">Description & Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Instrument</th>
                <th
                  onClick={() => {
                    if (sortBy === 'amount') {
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    } else {
                      setSortBy('amount');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Querying authenticated transaction ledger...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{tx.description}</div>
                      {tx.merchant && (
                        <div className="text-[11px] text-slate-500">{tx.merchant}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-300">{tx.category}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {tx.paymentMethod || 'Other'}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap tabular-nums ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                    <p>No transaction records found matching your filter criteria.</p>
                    <button
                      onClick={() => {
                        setSelectedTx(null);
                        setModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Your First Transaction</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <span className="font-mono text-white font-semibold">{currentPage}</span> of{' '}
            <span className="font-mono text-white font-semibold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-40 text-slate-300 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTx(null);
        }}
        onSave={handleSaveTransaction}
        initialData={selectedTx}
      />

      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
};
