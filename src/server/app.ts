/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth.middleware.ts';
import { authRouter } from './routes/auth.routes.ts';
import { reportRouter } from './routes/report.routes.ts';
import { categoryRouter } from './routes/category.routes.ts';
import { userRouter } from './routes/user.routes.ts';
import { dashboardRouter } from './routes/dashboard.routes.ts';
import { notificationRouter } from './routes/notification.routes.ts';
import { auditRouter } from './routes/audit.routes.ts';
import { settingsRouter } from './routes/settings.routes.ts';

export function createExpressApp() {
  const app = express();

  // Helmet with relaxed CSP for Vite development
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Attach auth context to every request
  app.use(authMiddleware);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'System Report Management System (SRMS) API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/users', userRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/settings', settingsRouter);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[SRMS Error Handler]:', err);
    res.status(err.status || 500).json({
      error: err.message || 'An unexpected internal server error occurred.',
    });
  });

  return app;
}
