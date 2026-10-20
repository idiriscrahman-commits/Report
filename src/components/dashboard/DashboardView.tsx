/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  Calendar,
  TrendingUp,
  Folder,
  Plus,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import type { DashboardStats, Report, AuditLogItem } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface DashboardViewProps {
  onNavigate: (view: string, reportId?: string) => void;
  onFilterCategory?: (category: string) => void;
  onFilterStatus?: (status: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onFilterCategory,
  onFilterStatus,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, activityData] = await Promise.all([
          api.getDashboardStats(),
          api.getDashboardActivity(),
        ]);
        setStats(statsData);
        setRecentReports(activityData.recentReports || []);
        setRecentLogs(activityData.recentAuditLogs || []);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Reports', value: stats.totalReports, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'This Month', value: stats.reportsThisMonth, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Under Review', value: stats.underReviewReports, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', status: 'Under Review' },
    { label: 'Approved', value: stats.approvedReports, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', status: 'Approved' },
    { label: 'Submitted', value: stats.submittedReports, icon: FileCheck, color: 'text-sky-600', bg: 'bg-sky-50', status: 'Submitted' },
    { label: 'Drafts', value: stats.draftReports, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', status: 'Draft' },
    { label: 'Rejected', value: stats.rejectedReports, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', status: 'Rejected' },
    { label: 'Archived', value: stats.archivedReports, icon: Archive, color: 'text-purple-600', bg: 'bg-purple-50', status: 'Archived' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            System Report Management
          </span>
          <h1 className="text-xl md:text-2xl font-bold mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Enterprise overview across all active organizational report streams and governance logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <button
              onClick={() => onNavigate('create-report')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('reports')}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Reports</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Real-time System Status</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {metricCards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                onClick={() => {
                  if (c.status && onFilterStatus) {
                    onFilterStatus(c.status);
                    onNavigate('reports');
                  } else if (c.label === 'Total Reports') {
                    onNavigate('reports');
                  }
                }}
                className={`p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 leading-tight">
                    {c.label}
                  </span>
                  <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                  </div>
                </div>
                <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {c.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics & Categorization Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Grouped by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-600" />
              <span>Reports by Category</span>
            </h3>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.reportsByCategory.map((cat) => {
              const percentage = stats.totalReports > 0 ? Math.round((cat.count / stats.totalReports) * 100) : 0;
              return (
                <div
                  key={cat.category}
                  onClick={() => {
                    if (onFilterCategory) {
                      onFilterCategory(cat.category);
                      onNavigate('reports');
                    }
                  }}
                  className="group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition truncate">
                      {cat.category}
                    </span>
                    <span className="font-bold text-slate-900 ml-2">
                      {cat.count} <span className="font-normal text-slate-400 text-[11px]">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percentage, 4)}%`,
                        backgroundColor: cat.color || '#2563eb',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reports Timeline / Trend Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Reporting Activity Over Time (6 Months)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Monthly volume</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {stats.reportsOverTime.map((item) => {
              const maxCount = Math.max(...stats.reportsOverTime.map((o) => o.count), 1);
              const heightPct = Math.max(Math.round((item.count / maxCount) * 100), 12);
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[11px] font-bold text-slate-600 opacity-80 group-hover:opacity-100 group-hover:text-blue-600">
                    {item.count}
                  </div>
                  <div
                    className="w-full max-w-[40px] bg-blue-100 group-hover:bg-blue-600 rounded-t-md transition-all duration-300"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Reports Table & Administrative Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Enterprise Reports</h3>
              <p className="text-xs text-slate-500">Live operational documents requiring review or recently finalized.</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent reports found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onNavigate('report-detail', report.id)}
                  className="py-3 px-2 rounded-lg hover:bg-slate-50/80 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {report.referenceId}
                      </span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="font-medium text-slate-600">{report.categoryName}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-500">{report.reportingDate}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate hover:text-blue-600 transition">
                      {report.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={report.priority} />
                    <StatusBadge status={report.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Activity Stream (1 column) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Audit Trail</span>
            </h3>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('audit-logs')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Full log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              recentLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-900">{log.actor.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 truncate">
                    <span className="font-medium text-blue-600">{log.action}</span>: {log.targetName}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
