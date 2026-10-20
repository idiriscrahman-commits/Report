/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  LayoutDashboard,
  FileText,
  FilePlus2,
  FolderTree,
  Bell,
  ShieldAlert,
  Users,
  Settings,
  UserCheck,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
  unreadCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  unreadCount,
}) => {
  const { user, logout } = useAuth();
  if (!isOpen) return null;

  const role = user?.role || 'VIEWER';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permitted: true },
    { id: 'reports', label: 'All Reports', icon: FileText, permitted: true },
    { id: 'create-report', label: 'Create Report', icon: FilePlus2, permitted: role === 'ADMIN' || role === 'STAFF' },
    { id: 'categories', label: 'Categories', icon: FolderTree, permitted: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, permitted: true, badge: unreadCount },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert, permitted: role === 'ADMIN' },
    { id: 'users', label: 'User Management', icon: Users, permitted: role === 'ADMIN' },
    { id: 'settings', label: 'Settings', icon: Settings, permitted: role === 'ADMIN' },
    { id: 'profile', label: 'Profile', icon: UserCheck, permitted: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/70 backdrop-blur-xs">
      <div className="w-72 bg-slate-900 h-full flex flex-col p-4 shadow-2xl border-r border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">SRMS Mobile</div>
              <div className="text-[10px] text-slate-400">Enterprise Reports</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="my-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <div className="text-xs font-bold text-white">{user.name}</div>
            <div className="text-[11px] text-sky-400 font-semibold uppercase">{user.role} &bull; {user.profile.department}</div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto space-y-1 py-2">
          {navItems
            .filter((item) => item.permitted)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-blue-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        <div className="pt-3 border-t border-slate-800 space-y-2">
          <PWAInstallButton variant="sidebar" />
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
