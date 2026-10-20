/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { dataStore } from '../storage/dataStore.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';

export const notificationRouter = Router();

// GET /api/notifications
notificationRouter.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await dataStore.getNotifications(req.user!.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/notifications/:id/read
notificationRouter.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const success = await dataStore.markNotificationRead(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/notifications/mark-all-read
notificationRouter.post('/mark-all-read', requireAuth, async (req, res) => {
  try {
    await dataStore.markAllNotificationsRead(req.user!.id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
