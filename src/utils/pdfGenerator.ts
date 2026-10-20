/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report } from '../types/index.ts';

/**
 * Generates a clean, safe filename for report PDF downloads.
 */
export function getPdfFilename(report: { referenceId: string; title: string; reportingDate?: string }): string {
  const safeRef = (report.referenceId || 'REPORT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeTitle = (report.title || 'Report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
  const dateStr = report.reportingDate ? report.reportingDate.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${safeRef}_${safeTitle}_${dateStr}.pdf`;
}

/**
 * Builds and downloads a professional, multi-page vector PDF for an SRMS report.
 */
export function generateReportPdf(report: Report, organizationName: string = 'Enterprise Solutions Inc.'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const navyDark = [15, 23, 42]; // #0f172a
  const navyBlue = [30, 58, 138]; // #1e3a8a
  const accentBlue = [37, 99, 235]; // #2563eb
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b

  let y = margin;

  // 1. TOP HEADER BANNER
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative accent line
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Organization Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(organizationName.toUpperCase(), margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('SYSTEM REPORT MANAGEMENT SYSTEM (SRMS)', margin, 16);
  doc.text(`Generated: ${new Date().toISOString().substring(0, 10)} UTC`, margin, 21);

  // Status & Priority on Top Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(report.referenceId, pageWidth - margin, 11, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  doc.text(`STATUS: ${report.status.toUpperCase()}  |  PRIORITY: ${report.priority.toUpperCase()}`, pageWidth - margin, 17, { align: 'right' });
  doc.text(`VERSION: v${report.version}`, pageWidth - margin, 22, { align: 'right' });

  y = 36;

  // 2. REPORT TITLE
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(report.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6.5 + 4;

  // 3. METADATA SUMMARY TABLE
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [71, 85, 105],
      fontStyle: 'bold',
      fontSize: 8,
    },
    body: [
      [
        { content: 'Category:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        report.categoryName,
        { content: 'Reporting Date:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        report.reportingDate,
      ],
      [
        { content: 'Report Type:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        report.reportType,
        { content: 'Reporting Period:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        report.reportingPeriod || 'N/A',
      ],
      [
        { content: 'Department:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        report.department,
        { content: 'Author / Submitter:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        `${report.author.name} (${report.author.department || report.department})`,
      ],
      [
        { content: 'Visibility:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        report.visibility,
        { content: 'Project Reference:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
        report.projectName || 'General Operations',
      ],
    ],
    margin: { left: margin, right: margin },
  });

  const lastTable = (doc as any).lastAutoTable;
  y = lastTable ? lastTable.finalY + 8 : y + 30;

  // Helper function to render a section with automatic page breaks
  function renderSection(title: string, text: string | undefined, isHighlight: boolean = false) {
    if (!text || !text.trim()) return;

    // Check if we need a new page for header + first few lines
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin + 8;
    }

    // Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    doc.text(title.toUpperCase(), margin, y);
    y += 2;

    // Decorative underline
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;

    // Content body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    const lines = doc.splitTextToSize(text.trim(), isHighlight ? contentWidth - 8 : contentWidth);

    if (isHighlight) {
      const boxHeight = lines.length * 4.6 + 6;
      if (y + boxHeight > pageHeight - 20) {
        doc.addPage();
        y = margin + 8;
      }
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y - 2, contentWidth, boxHeight, 2, 2, 'F');
      doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.rect(margin, y - 2, 1.5, boxHeight, 'F');
      doc.text(lines, margin + 4, y + 2.5);
      y += boxHeight + 6;
    } else {
      for (const line of lines) {
        if (y > pageHeight - 18) {
          doc.addPage();
          y = margin + 8;
        }
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 5;
    }
  }

  // Render Core Content Sections
  renderSection('Executive Summary', report.summary, true);
  renderSection('Background & Introduction', report.background);
  renderSection('Objectives', report.objectives);
  renderSection('Main Description & Procedures', report.description);
  renderSection('Activities Performed', report.activities);
  renderSection('Findings & Observations', report.findings);
  renderSection('Results & Measurable Outcomes', report.results);
  renderSection('Challenges & Risks', report.challenges);
  renderSection('Recommendations', report.recommendations);
  renderSection('Conclusion & Certification', report.conclusion);
  renderSection('Additional Notes', report.notes);

  if (report.reviewNotes && report.reviewNotes.trim()) {
    renderSection('Administrative Review Notes', report.reviewNotes, true);
  }

  // Tags Section
  if (report.tags && report.tags.length > 0) {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin + 8;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('CLASSIFICATION TAGS: ' + report.tags.map((t) => `#${t}`).join('   '), margin, y);
    y += 8;
  }

  // Revision History Table
  if (report.revisionHistory && report.revisionHistory.length > 0) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    doc.text('AUDIT REVISION HISTORY', margin, y);
    y += 2;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + contentWidth, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: 'bold',
      },
      head: [['Version', 'Editor', 'Timestamp', 'Status', 'Summary of Changes']],
      body: report.revisionHistory.map((rev) => [
        `v${rev.version}`,
        rev.editedByName || 'Authorized Personnel',
        new Date(rev.editedAt).toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        rev.status,
        rev.changesSummary || '—',
      ]),
      margin: { left: margin, right: margin },
    });
  }

  // 4. FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

    doc.text(
      `Confidential & Proprietary  •  ${organizationName}  •  Reference: ${report.referenceId}`,
      margin,
      pageHeight - 7
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Generates and triggers browser download of the PDF document.
 */
export function downloadReportPdf(report: Report, organizationName?: string): void {
  const doc = generateReportPdf(report, organizationName);
  const filename = getPdfFilename(report);
  doc.save(filename);
}
