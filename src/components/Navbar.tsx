import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Sparkles, User as UserIcon, LogOut, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { CurrencyCode } from '../types/index.ts';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, currencySymbol, updateCurrency, logout, demoLogin } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => setCurrentTab(user ? 'dashboard' : 'landing')}
        className="flex items-center gap-2.5 text-left cursor-pointer group whitespace-nowrap shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white font-sans">
          WealthIQ <span className="text-cyan-400 font-semibold">AI</span>
        </span>
      </button>

      {/* Zone 2: Single-line clean navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        {user ? (
          <>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'dashboard' ? 'text-white font-semibold' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('transactions')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'transactions' ? 'text-white font-semibold' : ''
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setCurrentTab('budgets')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'budgets' ? 'text-white font-semibold' : ''
              }`}
            >
              Budgets
            </button>
            <button
              onClick={() => setCurrentTab('forecasts')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'forecasts' ? 'text-white font-semibold' : ''
              }`}
            >
              ML Forecasts
            </button>
            <button
              onClick={() => setCurrentTab('copilot')}
              className={`hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'copilot' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI Copilot
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentTab('landing')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'landing' ? 'text-white font-semibold' : ''
              }`}
            >
              Platform Overview
            </button>
            <button
              onClick={() => setCurrentTab('landing')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Forecasting Engine
            </button>
            <button
              onClick={() => setCurrentTab('landing')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Autonomous Copilot
            </button>
          </>
        )}
      </nav>

      {/* Zone 3: 1 primary action / Profile control */}
      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <div className="flex items-center gap-2">
            {/* Currency selector toggle */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Change Base Currency"
              >
                <span>{currencySymbol}</span>
                <span className="text-slate-400 font-sans text-[11px]">{user.currency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 mt-1.5 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                  {currencies.map(curr => (
                    <button
                      key={curr}
                      onClick={() => {
                        updateCurrency(curr);
                        setCurrencyOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{curr}</span>
                      {user.currency === curr && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center shrink-0">
                  <img
                    src="/src/assets/images/avatar_fintech_executive_1793265192137.jpg"
                    alt={user.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <UserIcon className="w-3 h-3 text-slate-400" />
                </div>
                <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentTab('profile');
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Security & Preferences
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                      setCurrentTab('landing');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-800/60"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => demoLogin()}
              className="px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Instant Demo
            </button>
            <button
              onClick={() => setCurrentTab('login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
