import React, { useState } from 'react';
import { api } from '../api/client.ts';
import { KeyRound, ArrowLeft, CheckCircle2, Copy } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      if (res.devVerificationToken) {
        setDevToken(res.devVerificationToken);
        setToken(res.devVerificationToken);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({ token, newPassword });
      setMessage(res.message);
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 mx-auto">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {step === 'request' ? 'Password Recovery' : 'Set New Password'}
          </h2>
          <p className="text-xs text-slate-400">
            {step === 'request'
              ? 'Enter your registered email address to receive an expiring reset token.'
              : 'Enter the verification token and choose your new password.'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {devToken && (
          <div className="p-3 bg-slate-900 border border-cyan-800/60 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between text-cyan-300 font-semibold">
              <span>Local Dev Verification Token:</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(devToken);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-300 bg-black/40 p-1.5 rounded truncate">
              {devToken}
            </p>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Registered Email Address</label>
              <input
                type="email"
                required
                placeholder="demo@wealthiq.ai"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {loading ? 'Dispatched...' : 'Generate Reset Token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Reset Token</label>
              <input
                type="text"
                required
                placeholder="rst_..."
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">New Password (Min 8 Characters)</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
