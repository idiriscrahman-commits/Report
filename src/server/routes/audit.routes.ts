/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { dataStore } from '../storage/dataStore.ts';
import { requireAuth, requireRole } from '../middleware/auth.middleware.ts';

export const auditRouter = Router();

// GET /api/audit-logs (ADMIN only)
auditRouter.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const logs = await dataStore.getAuditLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
