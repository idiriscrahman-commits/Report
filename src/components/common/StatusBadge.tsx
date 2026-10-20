/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ReportStatus, ReportPriority } from '../../types/index.ts';

export const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const styles: Record<ReportStatus, { dot: string; text: string; bg: string; border: string }> = {
    Draft: {
      dot: 'bg-slate-400',
      text: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
    Submitted: {
      dot: 'bg-sky-500 animate-pulse',
      text: 'text-sky-800',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
    },
    'Under Review': {
      dot: 'bg-amber-500',
      text: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    Approved: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-800',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    Rejected: {
      dot: 'bg-rose-500',
      text: 'text-rose-800',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
    Archived: {
      dot: 'bg-slate-500',
      text: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
  };

  const current = styles[status] || styles.Draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: ReportPriority }> = ({ priority }) => {
  const styles: Record<ReportPriority, { text: string; bg: string; border: string }> = {
    Low: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
    Medium: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    High: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
    Urgent: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  };

  const current = styles[priority] || styles.Medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${current.bg} ${current.text} ${current.border}`}
    >
      {priority}
    </span>
  );
};
