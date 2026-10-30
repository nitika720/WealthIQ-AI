import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { CurrencyCode, AuditEvent } from '../types/index.ts';
import {
  Settings,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  User as UserIcon,
  RotateCcw
} from 'lucide-react';

interface ProfilePageProps {
  onAccountDeleted: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onAccountDeleted }) => {
  const { user, updateCurrency, deleteAccount, currencySymbol } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>(user?.currency || 'INR');
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [currencySaved, setCurrencySaved] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.currency) setCurrency(user.currency);
  }, [user]);

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.getAuditLogs();
      if (res.success && res.data) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleCurrencyChange = async (newCurr: CurrencyCode) => {
    setCurrency(newCurr);
    await updateCurrency(newCurr);
    setCurrencySaved(true);
    setTimeout(() => setCurrencySaved(false), 3000);
  };

  const handleExportAll = () => {
    window.location.href = '/api/v1/preferences/export-all';
  };

  const handleResetDemo = async () => {
    if (window.confirm('Restore initial seed dataset for demo account?')) {
      try {
        setResettingDemo(true);
        const res = await api.resetDemoData();
        setResetMessage(res.message);
        setTimeout(() => setResetMessage(null), 3000);
        loadAuditLogs();
      } catch (err: any) {
        alert(err.message || 'Reset failed');
      } finally {
        setResettingDemo(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('WARNING: This permanently erases your account, transactions, budgets, and models. Type "DELETE" to confirm:');
    if (confirmation === 'DELETE') {
      await deleteAccount();
      onAccountDeleted();
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          User Profile, Preferences & Security Architecture
        </h1>
        <p className="text-xs text-slate-400">
          Manage currency localization, access audit trails, and GDPR data portability.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-white">Authenticated Profile</h3>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <img
              src="/src/assets/images/avatar_fintech_executive_1793265192137.jpg"
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <UserIcon className="w-6 h-6 text-slate-400" />
          </div>

          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-white">{user?.name}</h4>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              User Identity ID: <span className="text-slate-400">{user?.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Base Accounting Currency</h3>
            <p className="text-xs text-slate-400">
              Select your authoritative currency for transaction inputs and dashboard aggregates.
            </p>
          </div>
          {currencySaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map(c => (
            <button
              key={c}
              onClick={() => handleCurrencyChange(c)}
              className={`p-3 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer text-left ${
                currency === c
                  ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="text-base font-bold mb-1">
                {c === 'INR' ? '₹' : c === 'EUR' ? '€' : c === 'GBP' ? '£' : '$'}
              </div>
              <span className="font-sans font-medium text-[11px] text-slate-300 block">
                {c === 'INR' ? 'Indian Rupee' : c === 'USD' ? 'US Dollar' : c === 'EUR' ? 'Euro' : 'British Pound'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Demo Reset Card (If Demo User) */}
      {user?.email === 'demo@wealthiq.ai' && (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                Demo Workspace Reset
              </h3>
              <p className="text-xs text-slate-400">
                Restore pre-seeded multi-month demo transactions, budgets, goals, and chat history.
              </p>
            </div>
            <button
              onClick={handleResetDemo}
              disabled={resettingDemo}
              className="px-3.5 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-md transition-colors cursor-pointer"
            >
              {resettingDemo ? 'Restoring...' : 'Restore Seed Data'}
            </button>
          </div>
          {resetMessage && (
            <p className="text-xs text-emerald-400">{resetMessage}</p>
          )}
        </div>
      )}

      {/* Data Portability (GDPR Export) */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Personal Data Portability (Full Export)</h3>
            <p className="text-xs text-slate-400">
              Download your full financial ledger, budget rules, savings goals, and audit log as structured JSON.
            </p>
          </div>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Data (JSON)</span>
          </button>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Security & Audit Trail Log
            </h3>
            <p className="text-xs text-slate-400">
              Tamper-evident system activity log recording logins, transactions, and copilot agent actions.
            </p>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/60 text-xs">
          {loadingLogs ? (
            <div className="p-4 text-center text-slate-500">Loading audit events...</div>
          ) : auditLogs.length > 0 ? (
            auditLogs.map(log => (
              <div key={log.id} className="p-3 flex items-start justify-between gap-4 hover:bg-slate-800/40">
                <div className="space-y-0.5">
                  <div className="font-mono font-semibold text-white text-[11px] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {log.action}
                  </div>
                  <div className="text-slate-400 text-[11px]">{log.details}</div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-500">No audit events recorded yet.</div>
          )}
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-rose-300">Danger Zone — Permanent Account Erasure</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Permanently delete your user profile and cascade delete all associated financial transactions, budgets, goals, and forecast models. This action is irreversible.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/80 hover:bg-rose-900/80 border border-rose-800/80 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Permanently Delete My Workspace</span>
        </button>
      </div>
    </div>
  );
};
