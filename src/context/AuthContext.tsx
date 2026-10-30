import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CurrencyCode } from '../types/index.ts';
import { api } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currencySymbol: string;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateCurrency: (currency: CurrencyCode) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrencySymbol = (code?: CurrencyCode): string => {
    switch (code) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD':
      default:
        return '$';
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const register = async (name: string, email: string, password: string, currency = 'INR') => {
    const res = await api.register({ name, email, password, currency });
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const updateCurrency = async (newCurrency: CurrencyCode) => {
    await api.updateCurrency(newCurrency);
    if (user) {
      setUser({ ...user, currency: newCurrency });
    }
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        currencySymbol: getCurrencySymbol(user?.currency),
        login,
        register,
        demoLogin,
        logout,
        updateCurrency,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
