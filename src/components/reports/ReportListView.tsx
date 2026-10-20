/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit3,
  Archive,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  FileText,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Report, Category, ReportStatus, ReportPriority } from '../../types/index.ts';

interface ReportListViewProps {
  onNavigate: (view: string, reportId?: string) => void;
  initialCategory?: string;
  initialStatus?: string;
  initialSearch?: string;
}

export const ReportListView: React.FC<ReportListViewProps> = ({
  onNavigate,
  initialCategory = '',
  initialStatus = 'All',
  initialSearch = '',
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReports, setTotalReports] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<string>(initialStatus);
  const [category, setCategory] = useState<string>(initialCategory);
  const [priority, setPriority] = useState<string>('All');
  const [department, setDepartment] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sort, setSort] = useState<'reportingDate' | 'createdAt' | 'updatedAt' | 'title' | 'referenceId'>('reportingDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Report | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setActionError(null);
      const res = await api.getReports({
        search,
        status: status as any,
        category: category || undefined,
        priority: priority as any,
        department: department || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sort,
        order,
        page,
        limit,
      });
      setReports(res.reports);
      setTotalReports(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, status, category, priority, department, dateFrom, dateTo, sort, order, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('All');
    setCategory('');
    setPriority('All');
    setDepartment('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsActionLoading(true);
      await api.deleteReport(deleteTarget.id);
      setDeleteTarget(null);
      await fetchReports();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      setIsActionLoading(true);
      await api.archiveReport(archiveTarget.id);
      setArchiveTarget(null);
      await fetchReports();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const role = user?.role || 'VIEWER';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">All Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {totalReports} total {totalReports === 1 ? 'record' : 'records'} matching current permissions and filters.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={api.getCsvExportUrl({
              search,
              status: status as any,
              category,
              priority: priority as any,
              department,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </a>
          {(role === 'ADMIN' || role === 'STAFF') && (
            <button
              onClick={() => onNavigate('create-report')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID (e.g. REP-2026-0001), title, author, summary or tag..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Status:</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Category selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Category:</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 max-w-[160px] truncate"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle advanced filters */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
              showAdvancedFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {(search || status !== 'All' || category || priority !== 'All' || department || dateFrom || dateTo) && (
            <button
              onClick={handleClearFilters}
              className="px-2.5 py-2 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-lg">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Infrastructure"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(1);
                }}
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reports Table / Card Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No reports found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No reports match your selected filters or permission visibility. Try clearing search filters or create a new report.
            </p>
            {(search || status !== 'All' || category) && (
              <button
                onClick={handleClearFilters}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Ref ID</th>
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4">Department / Author</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                      onClick={() => onNavigate('report-detail', report.id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {report.referenceId}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {report.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                          <span>{report.categoryName}</span>
                          <span>&bull;</span>
                          <span className="text-slate-400">{report.reportType}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{report.author.name}</div>
                        <div className="text-[11px] text-slate-500">{report.department}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {report.reportingDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={report.priority} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={report.status} />
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onNavigate('report-detail', report.id)}
                            title="View Report"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(role === 'ADMIN' || (role === 'STAFF' && (report.author.id === user?.id || report.ownerId === user?.id) && (report.status === 'Draft' || report.status === 'Rejected'))) && (
                            <button
                              onClick={() => onNavigate('edit-report', report.id)}
                              title="Edit Report"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {(role === 'ADMIN' || (role === 'STAFF' && (report.author.id === user?.id || report.ownerId === user?.id) && report.status === 'Approved')) && report.status !== 'Archived' && (
                            <button
                              onClick={() => setArchiveTarget(report)}
                              title="Archive Report"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          {(role === 'ADMIN' || (role === 'STAFF' && (report.author.id === user?.id || report.ownerId === user?.id) && report.status === 'Draft')) && (
                            <button
                              onClick={() => setDeleteTarget(report)}
                              title="Delete Report"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Avoids table overflow on narrow screens) */}
            <div className="md:hidden divide-y divide-slate-100">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onNavigate('report-detail', report.id)}
                  className="p-4 space-y-2 hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700">
                      {report.referenceId}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {report.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{report.categoryName}</span>
                    <span>&bull;</span>
                    <span>{report.reportingDate}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-600">{report.author.name}</span>
                    <PriorityBadge priority={report.priority} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Page {page} of {totalPages}</span>
                <span>&bull;</span>
                <label>Per page:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="py-1 px-2 text-xs bg-white border border-slate-200 rounded"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Confirm Report Deletion"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete report{' '}
              <strong className="text-slate-900">{deleteTarget.referenceId}</strong> (
              {deleteTarget.title})? This action cannot be undone and will be logged to the audit trail.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isActionLoading}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isActionLoading ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <Modal
          isOpen={!!archiveTarget}
          onClose={() => setArchiveTarget(null)}
          title="Archive Report"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Move report <strong className="text-slate-900">{archiveTarget.referenceId}</strong> to the system archive?
              Archived reports are hidden from default views but remain preserved for regulatory audit compliance.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setArchiveTarget(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isActionLoading}
                onClick={handleArchiveConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isActionLoading ? 'Archiving...' : 'Confirm Archive'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
