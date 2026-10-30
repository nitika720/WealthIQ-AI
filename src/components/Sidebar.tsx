import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  TrendingUp,
  BarChart3,
  Bot,
  Settings,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  healthScore?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, healthScore }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets & Limits', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'forecasts', label: 'Predictive Forecast', icon: TrendingUp },
    { id: 'analytics', label: 'Reports & Variance', icon: BarChart3 },
    { id: 'copilot', label: 'AI Copilot', icon: Bot, isAi: true },
    { id: 'profile', label: 'Settings & Security', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-[calc(100vh-57px)] sticky top-[57px]">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Finance Engine
          </p>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? item.isAi
                          ? 'text-cyan-400'
                          : 'text-indigo-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.isAi && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 text-cyan-300">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Health Score Preview / Help Card */}
      <div className="p-4 border-t border-slate-800/60">
        {healthScore !== undefined && (
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">Health Index</span>
              <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                {healthScore}/100
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, healthScore)}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={() => setCurrentTab('copilot')}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 rounded-md transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Autonomous Copilot Help</span>
        </button>
      </div>
    </aside>
  );
};
