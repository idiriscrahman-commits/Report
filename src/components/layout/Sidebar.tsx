/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  unreadCount,
}) => {
  const { user, logout } = useAuth();

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
    <aside
      className={`h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="text-sm font-bold text-white tracking-tight">SRMS Portal</h1>
              <p className="text-[11px] text-slate-400 truncate">Enterprise Reporting</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition hidden md:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Badge / Role Display */}
      {user && !collapsed && (
        <div className="px-4 py-3 mx-3 my-2 rounded-lg bg-slate-800/60 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/40">
              {user.name.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-white truncate">{user.name}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="font-medium text-sky-400 uppercase tracking-wide">{user.role}</span>
                <span>&bull;</span>
                <span className="truncate">{user.profile.department}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems
          .filter((item) => item.permitted)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400" />
                )}
              </button>
            );
          })}
      </nav>

      {/* PWA Install Area */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800">
          <PWAInstallButton variant="sidebar" />
        </div>
      )}

      {/* Footer / Logout */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={logout}
          title="Sign Out"
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
