/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { dataStore } from '../storage/dataStore.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';

export const dashboardRouter = Router();

// GET /api/dashboard/stats
dashboardRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await dataStore.getDashboardStats(req.user!.role, req.user!.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/dashboard/activity
dashboardRouter.get('/activity', requireAuth, async (req, res) => {
  try {
    const auditLogs = await dataStore.getAuditLogs(12);
    const notifications = await dataStore.getNotifications(req.user!.id);
    const recentReports = await dataStore.getReports({ limit: 5, page: 1, sort: 'createdAt', order: 'desc' }, req.user!.role, req.user!.id);

    res.json({
      recentAuditLogs: req.user!.role === 'ADMIN' ? auditLogs : [],
      recentNotifications: notifications.slice(0, 5),
      recentReports: recentReports.reports,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
