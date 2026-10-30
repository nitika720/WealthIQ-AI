const BASE_URL = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('wealthiq_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('wealthiq_token', token);
    } else {
      localStorage.removeItem('wealthiq_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('wealthiq_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token on unauthorized
      this.setToken(null);
    }

    const data = await response.json().catch(() => ({ success: false, error: 'Malformed server response' }));

    if (!response.ok || data.success === false) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  // --- Auth ---
  public register(payload: { name: string; email: string; password: string; currency?: string }) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public login(payload: { email: string; password: string }) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public demoLogin() {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/demo', {
      method: 'POST',
    });
  }

  public getMe() {
    return this.request<{ success: boolean; data: any }>('/auth/me');
  }

  public forgotPassword(email: string) {
    return this.request<{ success: boolean; message: string; devVerificationToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public resetPassword(payload: { token: string; newPassword: string }) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public deleteAccount() {
    return this.request<{ success: boolean; message: string }>('/auth/account', {
      method: 'DELETE',
    });
  }

  // --- Transactions ---
  public getTransactions(params?: Record<string, string | number>) {
    const q = params
      ? '?' +
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')
      : '';
    return this.request<{ success: boolean; data: any }>(`/transactions${q}`);
  }

  public createTransaction(payload: any) {
    return this.request<{ success: boolean; data: any }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public updateTransaction(id: string, payload: any) {
    return this.request<{ success: boolean; data: any }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public deleteTransaction(id: string) {
    return this.request<{ success: boolean; message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  public importCsv(csvContent: string) {
    return this.request<{ success: boolean; data: any }>('/transactions/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });
  }

  public getExportCsvUrl(): string {
    const token = this.getToken();
    return `/api/v1/transactions/export-csv${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }

  // --- Budgets ---
  public getBudgets(month?: string) {
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.request<{ success: boolean; data: any }>(`/budgets${q}`);
  }

  public createBudget(payload: { category: string; amount: number; warningThreshold?: number }) {
    return this.request<{ success: boolean; data: any }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public updateBudget(id: string, payload: any) {
    return this.request<{ success: boolean; data: any }>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public deleteBudget(id: string) {
    return this.request<{ success: boolean; message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Goals ---
  public getGoals() {
    return this.request<{ success: boolean; data: any[] }>('/goals');
  }

  public createGoal(payload: any) {
    return this.request<{ success: boolean; data: any }>('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public updateGoal(id: string, payload: any) {
    return this.request<{ success: boolean; data: any }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public deleteGoal(id: string) {
    return this.request<{ success: boolean; message: string }>(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Dashboard & Analytics ---
  public getDashboardSummary(month?: string) {
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.request<{ success: boolean; data: any }>(`/dashboard/summary${q}`);
  }

  public getDashboardCharts() {
    return this.request<{ success: boolean; data: any }>('/dashboard/charts');
  }

  public getAnalyticsReport(timeframe = '6m') {
    return this.request<{ success: boolean; data: any }>(`/analytics/report?timeframe=${timeframe}`);
  }

  // --- Forecasts ---
  public getForecasts() {
    return this.request<{ success: boolean; data: any }>('/forecasts');
  }

  public recomputeForecast() {
    return this.request<{ success: boolean; data: any; message: string }>('/forecasts/recompute', {
      method: 'POST',
    });
  }

  // --- Copilot ---
  public getChatHistory() {
    return this.request<{ success: boolean; data: any[] }>('/copilot/history');
  }

  public sendChatMessage(message: string) {
    return this.request<{ success: boolean; data: any }>('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  public confirmProposedAction(actionId: string) {
    return this.request<{ success: boolean; data: any }>('/copilot/action/confirm', {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    });
  }

  public rejectProposedAction(actionId: string) {
    return this.request<{ success: boolean; message: string }>('/copilot/action/reject', {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    });
  }

  public clearChatHistory() {
    return this.request<{ success: boolean; message: string }>('/copilot/history', {
      method: 'DELETE',
    });
  }

  // --- Preferences & Audit ---
  public updateCurrency(currency: string) {
    return this.request<{ success: boolean; data: any }>('/preferences/currency', {
      method: 'PUT',
      body: JSON.stringify({ currency }),
    });
  }

  public getAuditLogs() {
    return this.request<{ success: boolean; data: any[] }>('/preferences/audit-logs');
  }

  public resetDemoData() {
    return this.request<{ success: boolean; message: string }>('/preferences/reset-demo-data', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
