import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { TransactionsPage } from './pages/TransactionsPage.tsx';
import { BudgetsPage } from './pages/BudgetsPage.tsx';
import { ForecastsPage } from './pages/ForecastsPage.tsx';
import { GoalsPage } from './pages/GoalsPage.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { CopilotPage } from './pages/CopilotPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');

  // Sync tab with authentication state
  React.useEffect(() => {
    if (!loading) {
      if (user && (currentTab === 'landing' || currentTab === 'login' || currentTab === 'register' || currentTab === 'forgot-password')) {
        setCurrentTab('dashboard');
      } else if (!user && currentTab !== 'login' && currentTab !== 'register' && currentTab !== 'forgot-password') {
        setCurrentTab('landing');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Initializing WealthIQ Engine...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!user) {
      switch (currentTab) {
        case 'login':
          return (
            <LoginPage
              onRegisterClick={() => setCurrentTab('register')}
              onForgotPasswordClick={() => setCurrentTab('forgot-password')}
              onSuccess={() => setCurrentTab('dashboard')}
            />
          );
        case 'register':
          return (
            <RegisterPage
              onLoginClick={() => setCurrentTab('login')}
              onSuccess={() => setCurrentTab('dashboard')}
            />
          );
        case 'forgot-password':
          return (
            <ForgotPasswordPage onBackToLogin={() => setCurrentTab('login')} />
          );
        case 'landing':
        default:
          return (
            <LandingPage
              onGetStarted={() => setCurrentTab('register')}
              onLogin={() => setCurrentTab('login')}
            />
          );
      }
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'transactions':
        return <TransactionsPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'goals':
        return <GoalsPage />;
      case 'forecasts':
        return <ForecastsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'copilot':
        return <CopilotPage />;
      case 'profile':
        return <ProfilePage onAccountDeleted={() => setCurrentTab('landing')} />;
      default:
        return <NotFoundPage onReturn={() => setCurrentTab('dashboard')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {user ? (
        <div className="flex-1 flex w-full">
          <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
          <main className="flex-1 overflow-x-hidden min-w-0 bg-[#0B0F19]">
            {renderContent()}
          </main>
        </div>
      ) : (
        <main className="flex-1 overflow-x-hidden min-w-0 bg-[#0B0F19]">
          {renderContent()}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
