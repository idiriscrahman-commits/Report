/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { dataStore } from '../storage/dataStore.ts';
import { requireAuth, requireRole } from '../middleware/auth.middleware.ts';
import { SettingsSchema } from '../validators/schemas.ts';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await dataStore.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/settings (ADMIN only)
settingsRouter.patch('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const parsed = SettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const updated = await dataStore.updateSettings(parsed.data);

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'SETTINGS_UPDATED',
      targetType: 'SETTING',
      targetId: 'app_settings',
      targetName: 'Application Settings',
      metadata: { changes: parsed.data },
      ip: req.ip,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
