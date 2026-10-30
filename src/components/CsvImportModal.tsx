import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client.ts';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV = `date,type,category,amount,description,merchant,paymentMethod
2026-10-15,expense,Groceries,4250,Weekly supermarket groceries,Nature Basket,UPI
2026-10-18,expense,Dining & Entertainment,2100,Weekend coffee & snacks,Blue Tokai,Credit Card
2026-10-20,expense,Transportation,1800,Metro & Cab commute,Uber India,UPI
2026-10-22,income,Freelance,25000,Web application consulting,Client Corp,Net Banking`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; duplicatesSkipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError(null);
    setResult(null);

    if (!csvText.trim()) {
      setError('Please provide CSV content to import.');
      return;
    }

    try {
      setImporting(true);
      const res = await api.importCsv(csvText.trim());
      if (res.success && res.data) {
        setResult(res.data);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'CSV Import failed. Check syntax and columns.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Import Financial Records (CSV)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-md">
              {error}
            </div>
          )}

          {result ? (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Import Completed Successfully</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Records Added</span>
                  <span className="font-mono text-base font-bold text-white tabular-nums">
                    {result.importedCount}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Duplicates Filtered</span>
                  <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                    {result.duplicatesSkipped}
                  </span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Validation warnings in {result.errors.length} rows:
                  </span>
                  <div className="max-h-24 overflow-y-auto text-[11px] font-mono text-slate-400 bg-black/40 p-2 rounded">
                    {result.errors.map((e, idx) => (
                      <p key={idx}>{e}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
              >
                Close & View Ledger
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Upload a `.csv` file or paste standard delimited transaction rows below.
                </p>
                <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/50 rounded-md transition-colors cursor-pointer">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  CSV Data (Header required: <span className="font-mono text-[11px] text-slate-400">date,type,category,amount,description</span>)
                </label>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  className="w-full p-3 text-xs font-mono text-slate-200 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  placeholder="Paste CSV rows here..."
                />
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Security & Integrity Assurance:</p>
                <p>• Duplicate transactions matching date, amount, type, and description are automatically flagged and deduplicated.</p>
                <p>• Dates must strictly follow ISO <span className="font-mono">YYYY-MM-DD</span> format.</p>
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
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {importing ? 'Processing & Validating...' : 'Parse & Import Records'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
