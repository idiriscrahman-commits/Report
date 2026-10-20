/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { NotificationItem } from '../../types/index.ts';

interface NotificationListViewProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (view: string, reportId?: string) => void;
}

export const NotificationListView: React.FC<NotificationListViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>System Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status updates on report submissions, peer reviews, approvals, and system alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p>You have no notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onMarkRead(n.id);
                if (n.reportId) {
                  onNavigate('report-detail', n.reportId);
                }
              }}
              className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition hover:bg-slate-50 ${
                !n.read ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'APPROVAL' ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : n.type === 'REJECTION' ? (
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    {n.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString()} &bull; {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                {n.reportId && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                    <span>View associated report</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>

              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
