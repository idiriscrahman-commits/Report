/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { MobileNav } from './components/layout/MobileNav.tsx';
import { OfflineBanner } from './components/common/OfflineBanner.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { ReportListView } from './components/reports/ReportListView.tsx';
import { ReportFormView } from './components/reports/ReportFormView.tsx';
import { ReportDetailView } from './components/reports/ReportDetailView.tsx';
import { CategoryManagerView } from './components/categories/CategoryManagerView.tsx';
import { UserManagerView } from './components/users/UserManagerView.tsx';
import { AuditLogView } from './components/audit/AuditLogView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { ProfileView } from './components/profile/ProfileView.tsx';
import { NotificationListView } from './components/notifications/NotificationListView.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { FirstAdminSetupView } from './components/auth/FirstAdminSetupView.tsx';
import { api } from './api/client.ts';
import type { NotificationItem } from './types/index.ts';

function MainApp() {
  const { user, loading, needsSetup } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeReportId, setActiveReportId] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Ignore network errors in background polling
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (view: string, reportId?: string) => {
    setCurrentView(view);
    setActiveReportId(reportId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading SRMS Platform...</p>
      </div>
    );
  }

  if (needsSetup) {
    return <FirstAdminSetupView />;
  }

  if (!user) {
    return <LoginView />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <OfflineBanner />

      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen">
        <Sidebar
          currentView={currentView}
          onSelectView={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          unreadCount={unreadCount}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        currentView={currentView}
        onSelectView={handleNavigate}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onNavigate={handleNavigate}
          onSearch={(query) => {
            setGlobalSearch(query);
            setCurrentView('reports');
          }}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllRead}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onFilterCategory={(cat) => {
                setFilterCategory(cat);
                setFilterStatus('All');
              }}
              onFilterStatus={(st) => {
                setFilterStatus(st);
                setFilterCategory('');
              }}
            />
          )}

          {currentView === 'reports' && (
            <ReportListView
              onNavigate={handleNavigate}
              initialCategory={filterCategory}
              initialStatus={filterStatus}
              initialSearch={globalSearch}
            />
          )}

          {currentView === 'create-report' && (
            <ReportFormView onNavigate={handleNavigate} />
          )}

          {currentView === 'edit-report' && activeReportId && (
            <ReportFormView
              reportId={activeReportId}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'report-detail' && activeReportId && (
            <ReportDetailView
              reportId={activeReportId}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'categories' && <CategoryManagerView />}
          {currentView === 'users' && <UserManagerView />}
          {currentView === 'audit-logs' && <AuditLogView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'notifications' && (
            <NotificationListView
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllRead}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
