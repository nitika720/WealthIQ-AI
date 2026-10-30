import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC<{ onReturn: () => void }> = ({ onReturn }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">404 — Ledger Node Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested route or financial resource does not exist in your authorized tenant space.
        </p>
        <button
          onClick={onReturn}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
