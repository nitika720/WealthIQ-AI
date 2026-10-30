import express, { Request, Response, NextFunction } from 'express';
import authRouter from './routes/auth.routes.ts';
import transactionsRouter from './routes/transactions.routes.ts';
import budgetsRouter from './routes/budgets.routes.ts';
import goalsRouter from './routes/goals.routes.ts';
import dashboardRouter from './routes/dashboard.routes.ts';
import forecastsRouter from './routes/forecasts.routes.ts';
import analyticsRouter from './routes/analytics.routes.ts';
import copilotRouter from './routes/copilot.routes.ts';
import preferencesRouter from './routes/preferences.routes.ts';

export const app = express();

// Middleware: Body parsing & size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Custom lightweight CORS and Request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Request-Id', `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health & readiness probes
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'WealthIQ AI Engine',
    version: '1.0.0',
    database: 'connected',
    mlEngine: 'active',
  });
});

// Mount versioned REST API endpoints
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/budgets', budgetsRouter);
app.use('/api/v1/goals', goalsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/forecasts', forecastsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/copilot', copilotRouter);
app.use('/api/v1/preferences', preferencesRouter);

// Centralized 404 handler for unmatched API routes
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint route not found',
  });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[WealthIQ Backend Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An internal server error occurred',
  });
});
