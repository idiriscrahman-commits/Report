/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { dataStore } from '../storage/dataStore.ts';
import type { UserRole } from '../../types/index.ts';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  department: string;
  title: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Simple in-memory session token mapping: token -> { userId, expiresAt }
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export function createSession(userId: string): string {
  const token = `srms_sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  // 7 days expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessions.set(token, { userId, expiresAt });
  return token;
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.['srms_session'];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) sessions.delete(token);
      return next();
    }

    const user = await dataStore.findUserById(session.userId);
    if (!user || user.status === 'DISABLED') {
      return next();
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.profile.department,
      title: user.profile.title,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to access this resource.',
    });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. This operation requires one of the following roles: ${roles.join(', ')}.`,
      });
    }
    next();
  };
}
