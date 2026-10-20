/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.ts';
import type { User, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsSetup: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLoginAs: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      setUser(res.user);
      setNeedsSetup(res.needsSetup);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
  };

  const quickLoginAs = async (role: UserRole) => {
    let email = 'admin@srms.org';
    let password = 'AdminPass123!';
    if (role === 'STAFF') {
      email = 'sarah.engineer@srms.org';
      password = 'StaffPass123!';
    } else if (role === 'VIEWER') {
      email = 'alex.auditor@srms.org';
      password = 'ViewerPass123!';
    }
    const res = await api.login({ email, password });
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsSetup,
        login,
        quickLoginAs,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
