import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onRegisterClick,
  onForgotPasswordClick,
  onSuccess,
}) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo session failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to WealthIQ</h2>
          <p className="text-xs text-slate-400">
            Access your autonomous personal finance dashboard and predictive models.
          </p>
        </div>

        {/* Quick Demo Access Banner */}
        <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Academic Review Demo Account
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Evaluate with 3+ months of pre-seeded multi-category expenses, budgets, savings goals, and ML forecasts.
          </p>
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Launch Quick Demo Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0F172A] px-3 text-[11px] text-slate-500 uppercase tracking-wider absolute">
            or sign in with password
          </span>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              required
              placeholder="demo@wealthiq.ai"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={onForgotPasswordClick}
                className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm text-white bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          <span>New to WealthIQ? </span>
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-cyan-400 font-semibold hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};
