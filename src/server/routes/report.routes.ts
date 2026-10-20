/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { dataStore } from '../storage/dataStore.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { generateReferenceId } from '../../utils/referenceId.ts';
import { generateSafeCsv } from '../../utils/csvSanitizer.ts';
import {
  canCreateReport,
  canViewReport,
  canEditReport,
  canSubmitReport,
  canReviewReport,
  canArchiveReport,
  canDeleteReport,
  canExportReports,
} from '../../utils/rbac.ts';
import { ReportSchema, ReviewReportSchema } from '../validators/schemas.ts';
import type { Report, ReportStatus, ReportPriority } from '../../types/index.ts';

export const reportRouter = Router();

// GET /api/reports/export/csv (Must precede /:id)
reportRouter.get('/export/csv', requireAuth, async (req, res) => {
  try {
    if (!canExportReports(req.user!)) {
      return res.status(403).json({ error: 'Permission denied to export reports.' });
    }

    const { status, category, priority, department, search } = req.query;
    const { reports } = await dataStore.getReports(
      {
        status: status as ReportStatus,
        category: category as string,
        priority: priority as ReportPriority,
        department: department as string,
        search: search as string,
        limit: 1000,
        page: 1,
      },
      req.user!.role,
      req.user!.id
    );

    const safeRecords = reports.map((r) => ({
      referenceId: r.referenceId,
      title: r.title,
      category: r.categoryName,
      reportType: r.reportType,
      reportingDate: r.reportingDate,
      department: r.department,
      status: r.status,
      priority: r.priority,
      author: r.author.name,
      summary: r.summary,
      createdAt: r.createdAt.substring(0, 10),
    }));

    const columns = [
      { key: 'referenceId' as const, label: 'Reference ID' },
      { key: 'title' as const, label: 'Title' },
      { key: 'category' as const, label: 'Category' },
      { key: 'reportType' as const, label: 'Report Type' },
      { key: 'reportingDate' as const, label: 'Reporting Date' },
      { key: 'department' as const, label: 'Department' },
      { key: 'status' as const, label: 'Status' },
      { key: 'priority' as const, label: 'Priority' },
      { key: 'author' as const, label: 'Author' },
      { key: 'summary' as const, label: 'Summary' },
      { key: 'createdAt' as const, label: 'Created' },
    ];

    const csvContent = generateSafeCsv(safeRecords, columns);

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORTS_CSV_EXPORT',
      targetType: 'REPORT',
      targetId: 'bulk_csv',
      targetName: `CSV Export (${reports.length} records)`,
      ip: req.ip,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="srms-reports-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/reports
reportRouter.get('/', requireAuth, async (req, res) => {
  try {
    const {
      search,
      status,
      category,
      priority,
      department,
      authorId,
      dateFrom,
      dateTo,
      sort,
      order,
      page,
      limit,
    } = req.query;

    const result = await dataStore.getReports(
      {
        search: search as string,
        status: status as ReportStatus,
        category: category as string,
        priority: priority as ReportPriority,
        department: department as string,
        authorId: authorId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        sort: sort as any,
        order: order as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      },
      req.user!.role,
      req.user!.id
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/reports
reportRouter.post('/', requireAuth, async (req, res) => {
  try {
    if (!canCreateReport(req.user!)) {
      return res.status(403).json({ error: 'You do not have permission to create reports.' });
    }

    const parsed = ReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const category = await dataStore.findCategoryById(parsed.data.categoryId);
    const categoryName = category ? category.name : parsed.data.categoryName || 'General';

    const settings = await dataStore.getSettings();
    const nextSeq = await dataStore.getNextSequence();
    const referenceId = generateReferenceId(settings.reportPrefix || 'REP', new Date().getFullYear(), nextSeq);

    const initialStatus = parsed.data.status === 'Submitted' ? 'Submitted' : 'Draft';

    const newReport = await dataStore.createReport({
      referenceId,
      title: parsed.data.title,
      categoryId: parsed.data.categoryId,
      categoryName,
      reportType: parsed.data.reportType,
      reportingDate: parsed.data.reportingDate,
      reportingPeriod: parsed.data.reportingPeriod || '',
      department: parsed.data.department,
      projectName: parsed.data.projectName || '',
      summary: parsed.data.summary,
      background: parsed.data.background || '',
      objectives: parsed.data.objectives || '',
      description: parsed.data.description,
      activities: parsed.data.activities || '',
      findings: parsed.data.findings || '',
      results: parsed.data.results || '',
      challenges: parsed.data.challenges || '',
      recommendations: parsed.data.recommendations || '',
      conclusion: parsed.data.conclusion || '',
      notes: parsed.data.notes || '',
      status: initialStatus,
      priority: parsed.data.priority,
      tags: parsed.data.tags,
      visibility: parsed.data.visibility,
      author: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        department: req.user!.department,
      },
      ownerId: req.user!.id,
      attachments: [],
      revisionHistory: [
        {
          version: 1,
          editedBy: req.user!.id,
          editedByName: req.user!.name,
          editedAt: new Date().toISOString(),
          changesSummary: initialStatus === 'Submitted' ? 'Report created and submitted for review.' : 'Initial draft created.',
          status: initialStatus,
        },
      ],
      reviewNotes: '',
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: initialStatus === 'Submitted' ? 'REPORT_SUBMITTED' : 'REPORT_CREATED',
      targetType: 'REPORT',
      targetId: newReport.id,
      targetName: newReport.title,
      metadata: { referenceId, status: initialStatus },
      ip: req.ip,
    });

    res.status(201).json(newReport);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/reports/:id
reportRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    if (!canViewReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
      visibility: report.visibility,
    })) {
      return res.status(403).json({ error: 'Access denied to this report.' });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/reports/:id (With Optimistic Concurrency Control)
reportRouter.patch('/:id', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    if (!canEditReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
    })) {
      return res.status(403).json({ error: 'You do not have permission to edit this report in its current state.' });
    }

    const parsed = ReportSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    // Optimistic Concurrency Check
    if (parsed.data.expectedVersion !== undefined && parsed.data.expectedVersion !== report.version) {
      return res.status(409).json({
        error: `Conflict detected: This report was modified by someone else (version ${report.version} vs expected ${parsed.data.expectedVersion}). Please refresh before saving.`,
        currentVersion: report.version,
      });
    }

    let categoryName = report.categoryName;
    if (parsed.data.categoryId && parsed.data.categoryId !== report.categoryId) {
      const cat = await dataStore.findCategoryById(parsed.data.categoryId);
      if (cat) categoryName = cat.name;
    }

    const newRevision = {
      version: report.version + 1,
      editedBy: req.user!.id,
      editedByName: req.user!.name,
      editedAt: new Date().toISOString(),
      changesSummary: parsed.data.changeSummary || 'Content updated',
      status: (parsed.data.status as ReportStatus) || report.status,
    };

    const updated = await dataStore.updateReport(report.id, {
      ...parsed.data,
      categoryName,
      revisionHistory: [newRevision, ...report.revisionHistory],
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_UPDATED',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      metadata: { version: updated?.version, changes: parsed.data.changeSummary },
      ip: req.ip,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/reports/:id/submit
reportRouter.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (!canSubmitReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
    })) {
      return res.status(403).json({ error: 'Cannot submit report in current state.' });
    }

    const updated = await dataStore.updateReport(report.id, {
      status: 'Submitted',
      revisionHistory: [
        {
          version: report.version + 1,
          editedBy: req.user!.id,
          editedByName: req.user!.name,
          editedAt: new Date().toISOString(),
          changesSummary: 'Report submitted for review.',
          status: 'Submitted',
        },
        ...report.revisionHistory,
      ],
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_SUBMITTED',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      ip: req.ip,
    });

    // Notify admins
    const users = await dataStore.getAllUsers();
    for (const u of users.filter((u) => u.role === 'ADMIN')) {
      await dataStore.createNotification({
        recipientId: u.id,
        type: 'SUBMISSION',
        title: `Report Submitted: ${report.referenceId}`,
        message: `${req.user!.name} submitted "${report.title}" for review.`,
        reportId: report.id,
        reportTitle: report.title,
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/reports/:id/approve
reportRouter.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (!canReviewReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
    })) {
      return res.status(403).json({ error: 'Permission denied: Only administrators can approve submitted reports.' });
    }

    const parsed = ReviewReportSchema.safeParse(req.body);
    const reviewNotes = parsed.success ? parsed.data.reviewNotes : '';

    const updated = await dataStore.updateReport(report.id, {
      status: 'Approved',
      reviewNotes: reviewNotes || 'Approved by system administrator.',
      revisionHistory: [
        {
          version: report.version + 1,
          editedBy: req.user!.id,
          editedByName: req.user!.name,
          editedAt: new Date().toISOString(),
          changesSummary: `Report approved: ${reviewNotes || 'Approved'}`,
          status: 'Approved',
        },
        ...report.revisionHistory,
      ],
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_APPROVED',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      metadata: { reviewNotes },
      ip: req.ip,
    });

    // Notify report author
    await dataStore.createNotification({
      recipientId: report.author.id,
      type: 'APPROVAL',
      title: `Report Approved: ${report.referenceId}`,
      message: `${req.user!.name} approved "${report.title}".`,
      reportId: report.id,
      reportTitle: report.title,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/reports/:id/reject
reportRouter.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (!canReviewReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
    })) {
      return res.status(403).json({ error: 'Permission denied: Only administrators can review or reject reports.' });
    }

    const parsed = ReviewReportSchema.safeParse(req.body);
    const reviewNotes = parsed.success && parsed.data.reviewNotes ? parsed.data.reviewNotes : 'Requires revisions before resubmission.';

    const updated = await dataStore.updateReport(report.id, {
      status: 'Rejected',
      reviewNotes,
      revisionHistory: [
        {
          version: report.version + 1,
          editedBy: req.user!.id,
          editedByName: req.user!.name,
          editedAt: new Date().toISOString(),
          changesSummary: `Report rejected with comments: ${reviewNotes}`,
          status: 'Rejected',
        },
        ...report.revisionHistory,
      ],
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_REJECTED',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      metadata: { reviewNotes },
      ip: req.ip,
    });

    // Notify author
    await dataStore.createNotification({
      recipientId: report.author.id,
      type: 'REJECTION',
      title: `Report Rejected: ${report.referenceId}`,
      message: `Revisions requested for "${report.title}": ${reviewNotes}`,
      reportId: report.id,
      reportTitle: report.title,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/reports/:id/archive
reportRouter.post('/:id/archive', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (!canArchiveReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
    })) {
      return res.status(403).json({ error: 'Permission denied to archive this report.' });
    }

    const updated = await dataStore.updateReport(report.id, {
      status: 'Archived',
      revisionHistory: [
        {
          version: report.version + 1,
          editedBy: req.user!.id,
          editedByName: req.user!.name,
          editedAt: new Date().toISOString(),
          changesSummary: 'Archived by authorized user.',
          status: 'Archived',
        },
        ...report.revisionHistory,
      ],
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_ARCHIVED',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      ip: req.ip,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/reports/:id/restore
reportRouter.post('/:id/restore', requireAuth, async (req, res) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can restore archived reports.' });
    }

    const report = await dataStore.findReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const updated = await dataStore.updateReport(report.id, {
      status: 'Draft',
      revisionHistory: [
        {
          version: report.version + 1,
          editedBy: req.user!.id,
          editedByName: req.user!.name,
          editedAt: new Date().toISOString(),
          changesSummary: 'Restored from archive to Draft state.',
          status: 'Draft',
        },
        ...report.revisionHistory,
      ],
    });

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_RESTORED',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      ip: req.ip,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/reports/:id
reportRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (!canDeleteReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
    })) {
      return res.status(403).json({ error: 'Permission denied to delete this report.' });
    }

    await dataStore.deleteReport(report.id);

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_DELETED',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      metadata: { referenceId: report.referenceId },
      ip: req.ip,
    });

    res.json({ message: 'Report permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/reports/:id/export/pdf (Generates clean, printable HTML ready for native browser print-to-PDF)
reportRouter.get('/:id/export/pdf', requireAuth, async (req, res) => {
  try {
    const report = await dataStore.findReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (!canViewReport(req.user!, {
      id: report.id,
      authorId: report.author.id,
      ownerId: report.ownerId,
      status: report.status,
      visibility: report.visibility,
    })) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const settings = await dataStore.getSettings();

    // Render standalone printable HTML with print stylesheet
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.referenceId} - ${report.title}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 24px; font-size: 14px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .ref-badge { font-family: monospace; font-size: 13px; font-weight: 700; background: #e2e8f0; padding: 4px 10px; border-radius: 4px; display: inline-block; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-item label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
    .meta-item span { font-weight: 600; color: #0f172a; font-size: 13px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section-title { font-size: 16px; font-weight: 700; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px; }
    .content { white-space: pre-wrap; color: #334155; }
    .footer { margin-top: 40px; pt-4; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-weight: 600; color: #1e40af;">Official Document Export &mdash; Ready for Print or PDF Save</span>
    <button onclick="window.print()" style="padding: 8px 16px; background: #1e3a8a; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; margin-bottom: 4px;">
        ${settings.organizationName || 'System Report Management System'}
      </div>
      <h1 class="title">${report.title}</h1>
      <div class="ref-badge">${report.referenceId}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 700; font-size: 13px; color: #0f172a;">Status: ${report.status}</div>
      <div style="font-size: 12px; color: #64748b;">Priority: ${report.priority}</div>
      <div style="font-size: 12px; color: #64748b;">Version: v${report.version}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><label>Category</label><span>${report.categoryName}</span></div>
    <div class="meta-item"><label>Report Type</label><span>${report.reportType}</span></div>
    <div class="meta-item"><label>Department</label><span>${report.department}</span></div>
    <div class="meta-item"><label>Reporting Date</label><span>${report.reportingDate}</span></div>
    <div class="meta-item"><label>Author</label><span>${report.author.name}</span></div>
    <div class="meta-item"><label>Period</label><span>${report.reportingPeriod || 'N/A'}</span></div>
    <div class="meta-item"><label>Visibility</label><span>${report.visibility}</span></div>
    <div class="meta-item"><label>Project</label><span>${report.projectName || 'General'}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="content">${report.summary}</div>
  </div>

  ${report.background ? `<div class="section"><div class="section-title">Background & Introduction</div><div class="content">${report.background}</div></div>` : ''}
  ${report.objectives ? `<div class="section"><div class="section-title">Objectives</div><div class="content">${report.objectives}</div></div>` : ''}

  <div class="section">
    <div class="section-title">Main Description</div>
    <div class="content">${report.description}</div>
  </div>

  ${report.activities ? `<div class="section"><div class="section-title">Activities Performed</div><div class="content">${report.activities}</div></div>` : ''}
  ${report.findings ? `<div class="section"><div class="section-title">Findings & Observations</div><div class="content">${report.findings}</div></div>` : ''}
  ${report.results ? `<div class="section"><div class="section-title">Results & Outcomes</div><div class="content">${report.results}</div></div>` : ''}
  ${report.challenges ? `<div class="section"><div class="section-title">Challenges & Risks</div><div class="content">${report.challenges}</div></div>` : ''}
  ${report.recommendations ? `<div class="section"><div class="section-title">Recommendations</div><div class="content">${report.recommendations}</div></div>` : ''}
  ${report.conclusion ? `<div class="section"><div class="section-title">Conclusion</div><div class="content">${report.conclusion}</div></div>` : ''}
  ${report.notes ? `<div class="section"><div class="section-title">Additional Notes</div><div class="content">${report.notes}</div></div>` : ''}
  ${report.reviewNotes ? `<div class="section" style="background:#f1f5f9; padding: 12px; border-radius: 6px;"><div class="section-title" style="margin-bottom:6px;">Review Commentary</div><div class="content">${report.reviewNotes}</div></div>` : ''}

  <div class="footer">
    <div>Generated by ${settings.appName} on ${new Date().toISOString().substring(0, 10)} UTC</div>
    <div>Document Ref: ${report.referenceId} &bull; Page 1 of 1</div>
  </div>
</body>
</html>`;

    await dataStore.createAuditLog({
      actor: { id: req.user!.id, name: req.user!.name, email: req.user!.email, role: req.user!.role },
      action: 'REPORT_PDF_EXPORT',
      targetType: 'REPORT',
      targetId: report.id,
      targetName: report.title,
      ip: req.ip,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
