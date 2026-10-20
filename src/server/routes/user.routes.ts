/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dataStore } from '../storage/dataStore.ts';
import { requireAuth, requireRole } from '../middleware/auth.middleware.ts';
import { CreateUserSchema, UpdateUserSchema } from '../validators/schemas.ts';

export const userRouter = Router();

// GET /api/users (ADMIN only)
userRouter.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await dataStore.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/users (ADMIN only creates user)
userRouter.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { name, email, password, role, department, title, phone, bio } = parsed.data;

    const existing = await dataStore.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await dataStore.createUser({
      name,
      email,
      passwordHash,
      role,
      status: 'ACTIVE',
      profile: {
        department: department || 'General',
        title: title || 'Staff Member',
        phone: phone || '',
        bio: bio || '',
      },
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'USER_CREATED',
      targetType: 'USER',
      targetId: newUser.id,
      targetName: newUser.name,
      metadata: { role: newUser.role, email: newUser.email },
      ip: req.ip,
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/users/:id
userRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await dataStore.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/users/:id (ADMIN only)
userRouter.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const user = await dataStore.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Protect against self-deactivation or self-demotion of the last active admin
    if (user.id === req.user!.id) {
      if (parsed.data.status === 'DISABLED') {
        return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
      }
      if (parsed.data.role && parsed.data.role !== 'ADMIN') {
        return res.status(400).json({ error: 'You cannot revoke your own administrative role.' });
      }
    }

    const updates: any = {};
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.role) updates.role = parsed.data.role;
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.password) {
      updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    }

    if (parsed.data.department || parsed.data.title || parsed.data.phone || parsed.data.bio) {
      updates.profile = {
        ...user.profile,
        department: parsed.data.department ?? user.profile.department,
        title: parsed.data.title ?? user.profile.title,
        phone: parsed.data.phone ?? user.profile.phone,
        bio: parsed.data.bio ?? user.profile.bio,
      };
    }

    const updated = await dataStore.updateUser(user.id, updates);

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'USER_UPDATED',
      targetType: 'USER',
      targetId: user.id,
      targetName: user.name,
      metadata: { changes: parsed.data },
      ip: req.ip,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/users/:id (ADMIN only)
userRouter.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const user = await dataStore.findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await dataStore.deleteUser(req.params.id);

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'USER_DELETED',
      targetType: 'USER',
      targetId: user.id,
      targetName: user.name,
      ip: req.ip,
    });

    res.json({ message: 'User removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
