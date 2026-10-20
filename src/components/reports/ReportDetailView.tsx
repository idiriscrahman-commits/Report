/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  FileDown,
  Edit3,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Clock,
  History,
  Building2,
  Calendar,
  Tag,
  Shield,
  Layers,
  Send,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { downloadReportPdf } from '../../utils/pdfGenerator.ts';
import type { Report } from '../../types/index.ts';

interface ReportDetailViewProps {
  reportId: string;
  onNavigate: (view: string, reportId?: string) => void;
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({
  reportId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Review Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleDownloadPdf = () => {
    if (!report) return;
    try {
      setPdfGenerating(true);
      downloadReportPdf(report, 'Enterprise Solutions Inc.');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError('Failed to generate PDF document: ' + (err as Error).message);
    } finally {
      setTimeout(() => setPdfGenerating(false), 600);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReport(reportId);
      setReport(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleCopyId = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.approveReport(reportId, reviewNotes);
      setShowApproveModal(false);
      setReviewNotes('');
      await fetchReport();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      setError('Please provide feedback notes explaining the rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      await api.rejectReport(reportId, reviewNotes);
      setShowRejectModal(false);
      setReviewNotes('');
      await fetchReport();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      await api.submitReport(reportId);
      await fetchReport();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setActionLoading(true);
      await api.archiveReport(reportId);
      await fetchReport();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setActionLoading(true);
      await api.restoreReport(reportId);
      await fetchReport();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
        Loading report document...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Unable to load report</h3>
        <p className="text-xs text-slate-500">{error || 'Report not found or permission denied.'}</p>
        <button
          onClick={() => onNavigate('reports')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Back to Reports List
        </button>
      </div>
    );
  }

  const role = user?.role || 'VIEWER';
  const isOwner = report.author.id === user?.id || report.ownerId === user?.id;
  const canEdit = role === 'ADMIN' || (role === 'STAFF' && isOwner && (report.status === 'Draft' || report.status === 'Rejected'));
  const canSubmit = (role === 'ADMIN' || (role === 'STAFF' && isOwner)) && (report.status === 'Draft' || report.status === 'Rejected');
  const canReview = role === 'ADMIN' && (report.status === 'Submitted' || report.status === 'Under Review');
  const canArchive = (role === 'ADMIN' || (role === 'STAFF' && isOwner && report.status === 'Approved')) && report.status !== 'Archived';
  const canRestore = role === 'ADMIN' && report.status === 'Archived';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('reports')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Return to reports"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {report.referenceId}
              </span>
              <button
                onClick={handleCopyId}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
                title="Copy reference ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500">v{report.version}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{report.title}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              onClick={() => onNavigate('edit-report', report.id)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            title="Download Professional PDF Document"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{pdfGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {canSubmit && (
            <button
              disabled={actionLoading}
              onClick={handleSubmit}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
          )}

          {canArchive && (
            <button
              disabled={actionLoading}
              onClick={handleArchive}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          )}

          {canRestore && (
            <button
              disabled={actionLoading}
              onClick={handleRestore}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
          )}
        </div>
      </div>

      {/* Review Banner for Admins */}
      {canReview && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Review Action Required</span>
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              This report has been submitted and is awaiting administrative evaluation and approval.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject / Request Changes</span>
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Report</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Report Content Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Meta Bar */}
        <div className="bg-slate-50/70 border-b border-slate-200 p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Category</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{report.categoryName}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Report Type</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{report.reportType}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Status</span>
            <div className="mt-1">
              <StatusBadge status={report.status} />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Priority</span>
            <div className="mt-1">
              <PriorityBadge priority={report.priority} />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Reporting Date</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{report.reportingDate}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Department</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{report.department}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Author</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{report.author.name}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Period</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{report.reportingPeriod || 'N/A'}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Executive Summary */}
          <div>
            <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
              Executive Summary
            </h2>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs text-slate-800 leading-relaxed font-medium">
              {report.summary}
            </div>
          </div>

          {report.background && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Background & Introduction
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.background}</p>
            </div>
          )}

          {report.objectives && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Objectives
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.objectives}</p>
            </div>
          )}

          <div>
            <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
              Main Description & Procedures
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
          </div>

          {report.activities && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Activities Performed
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.activities}</p>
            </div>
          )}

          {report.findings && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Findings & Observations
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.findings}</p>
            </div>
          )}

          {report.results && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Results & Measurable Outcomes
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.results}</p>
            </div>
          )}

          {report.challenges && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Challenges & Risks
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.challenges}</p>
            </div>
          )}

          {report.recommendations && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Recommendations
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.recommendations}</p>
            </div>
          )}

          {report.conclusion && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Conclusion
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.conclusion}</p>
            </div>
          )}

          {report.notes && (
            <div>
              <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
                Additional Notes
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}

          {report.reviewNotes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Review Commentary & Feedback
              </h2>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{report.reviewNotes}</p>
            </div>
          )}

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-2">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {report.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Revision History Section */}
        {report.revisionHistory && report.revisionHistory.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 p-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>Audit Revision History</span>
            </h3>
            <div className="space-y-2">
              {report.revisionHistory.map((rev) => (
                <div
                  key={rev.version}
                  className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-slate-900">v{rev.version}</span>
                    <span className="text-slate-400 mx-2">&bull;</span>
                    <span className="font-medium text-slate-700">{rev.editedByName}</span>
                    <span className="text-slate-400 mx-2">&bull;</span>
                    <span className="text-slate-500">{rev.changesSummary}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{new Date(rev.editedAt).toLocaleString()}</span>
                    <StatusBadge status={rev.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <Modal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          title="Approve Report"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Confirm approval for report <strong className="text-slate-900">{report.referenceId}</strong>. You may optionally attach certification notes or commentary.
            </p>
            <textarea
              rows={3}
              placeholder="Optional approval notes..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Approving...' : 'Confirm Approval'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject Report & Request Revisions"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Provide actionable feedback for the report author explaining why this report requires revision before it can be certified.
            </p>
            <textarea
              rows={4}
              placeholder="Reason for revision request (required)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Submitting...' : 'Reject & Return to Author'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
