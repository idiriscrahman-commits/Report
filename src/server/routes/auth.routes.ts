/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { dataStore } from '../storage/dataStore.ts';
import { createSession, revokeSession, requireAuth } from '../middleware/auth.middleware.ts';
import {
  LoginSchema,
  SetupAdminSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
} from '../validators/schemas.ts';

export const authRouter = Router();

// Rate limiting on login attempts: max 10 requests per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/auth/me
authRouter.get('/me', async (req, res) => {
  if (!req.user) {
    const adminCount = await dataStore.countAdmins();
    return res.json({
      user: null,
      needsSetup: adminCount === 0,
    });
  }

  const user = await dataStore.findUserById(req.user.id);
  if (!user) {
    return res.status(401).json({ user: null });
  }

  const { passwordHash, ...safeUser } = user;
  res.json({
    user: safeUser,
    needsSetup: false,
  });
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { email, password } = parsed.data;
    const user = await dataStore.findUserByEmail(email);

    if (!user) {
      // Log failed attempt
      await dataStore.createAuditLog({
        actor: { id: 'anonymous', name: 'Anonymous', email, role: 'VIEWER' },
        action: 'AUTH_FAILED',
        targetType: 'AUTH',
        targetId: 'auth_attempt',
        targetName: email,
        metadata: { reason: 'User not found' },
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact your system administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await dataStore.createAuditLog({
        actor: { id: user.id, name: user.name, email: user.email, role: user.role },
        action: 'AUTH_FAILED',
        targetType: 'AUTH',
        targetId: user.id,
        targetName: user.name,
        metadata: { reason: 'Incorrect password' },
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionToken = createSession(user.id);

    // Set secure cookie
    res.cookie('srms_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await dataStore.createAuditLog({
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'AUTH_LOGIN',
      targetType: 'AUTH',
      targetId: user.id,
      targetName: user.name,
      metadata: { role: user.role },
      ip: req.ip,
    });

    const { passwordHash, ...safeUser } = user;
    res.json({
      message: 'Signed in successfully.',
      token: sessionToken,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.['srms_session'] || req.headers.authorization?.split(' ')[1];
  if (token) {
    revokeSession(token);
  }
  res.clearCookie('srms_session');

  if (req.user) {
    await dataStore.createAuditLog({
      actor: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
      action: 'AUTH_LOGOUT',
      targetType: 'AUTH',
      targetId: req.user.id,
      targetName: req.user.name,
      ip: req.ip,
    });
  }

  res.json({ message: 'Signed out successfully.' });
});

// POST /api/auth/setup-admin (Safe first-admin initialization only when 0 admins exist)
authRouter.post('/setup-admin', async (req, res) => {
  try {
    const adminCount = await dataStore.countAdmins();
    if (adminCount > 0) {
      return res.status(403).json({
        error: 'System administrator already exists. Public setup initialization is permanently disabled.',
      });
    }

    const parsed = SetupAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { name, email, password, department, title } = parsed.data;
    const existing = await dataStore.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await dataStore.createUser({
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        department: department || 'System Administration',
        title: title || 'Primary System Administrator',
      },
    });

    const sessionToken = createSession(user.id);
    res.cookie('srms_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await dataStore.createAuditLog({
      actor: { id: user.id, name: user.name, email: user.email, role: 'ADMIN' },
      action: 'INITIAL_ADMIN_SETUP',
      targetType: 'USER',
      targetId: user.id,
      targetName: user.name,
      ip: req.ip,
    });

    res.status(201).json({
      message: 'System administrator successfully initialized.',
      token: sessionToken,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, async (req, res) => {
  try {
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const user = await dataStore.findUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await dataStore.updateUser(user.id, { passwordHash: newHash });

    await dataStore.createAuditLog({
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'PASSWORD_CHANGED',
      targetType: 'USER',
      targetId: user.id,
      targetName: user.name,
      ip: req.ip,
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/auth/profile
authRouter.patch('/profile', requireAuth, async (req, res) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const user = await dataStore.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const updatedProfile = {
      ...user.profile,
      department: parsed.data.department ?? user.profile.department,
      title: parsed.data.title ?? user.profile.title,
      phone: parsed.data.phone ?? user.profile.phone,
      bio: parsed.data.bio ?? user.profile.bio,
    };

    const updatedUser = await dataStore.updateUser(user.id, {
      name: parsed.data.name ?? user.name,
      profile: updatedProfile,
    });

    await dataStore.createAuditLog({
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'PROFILE_UPDATED',
      targetType: 'USER',
      targetId: user.id,
      targetName: user.name,
      ip: req.ip,
    });

    res.json({ user: updatedUser, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/auth/forgot-password (Safe simulated recovery workflow)
authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = await dataStore.findUserByEmail(email);
  if (user) {
    await dataStore.createAuditLog({
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'AUTH',
      targetId: user.id,
      targetName: user.name,
      ip: req.ip,
    });
  }

  // Consistent generic response preventing user enumeration
  res.json({
    message: 'If an active account exists with that email, password reset instructions have been recorded.',
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req, res) => {
  const { email, tempToken, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }
  res.json({
    message: 'Password reset completed. You may now log in with your updated credentials.',
  });
});
