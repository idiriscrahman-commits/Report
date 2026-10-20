/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';
import type { NotificationItem, UserRole } from '../../types/index.ts';

interface HeaderProps {
  onOpenMobileNav: () => void;
  onNavigate: (view: string, reportId?: string) => void;
  onSearch: (query: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileNav,
  onNavigate,
  onSearch,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
}) => {
  const { user, quickLoginAs } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
    onNavigate('reports');
  };

  const role = user?.role || 'VIEWER';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Left side: Hamburger for mobile + Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by ID, title, keyword or tag..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </form>
      </div>

      {/* Right side: Role Switcher Demo Bar, Quick Create, Notifications, PWA */}
      <div className="flex items-center gap-2.5">
        {/* Quick Role Switcher for verification and testing */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" />
            Switch:
          </span>
          {(['ADMIN', 'STAFF', 'VIEWER'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => quickLoginAs(r)}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                user?.role === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* PWA Install Button */}
        <div className="hidden sm:block">
          <PWAInstallButton variant="header" />
        </div>

        {/* Quick Create Report button (Admin / Staff) */}
        {(role === 'ADMIN' || role === 'STAFF') && (
          <button
            onClick={() => onNavigate('create-report')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Report</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-800">
                  Notifications ({unreadNotifs.length})
                </span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        if (n.reportId) {
                          onNavigate('report-detail', n.reportId);
                          setShowNotifMenu(false);
                        }
                      }}
                      className={`p-3 cursor-pointer text-left transition hover:bg-slate-50 ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'APPROVAL' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : n.type === 'REJECTION' ? (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 leading-tight">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
