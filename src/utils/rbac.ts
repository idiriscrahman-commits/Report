/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'STAFF' | 'VIEWER';

export type ReportStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Archived';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'DISABLED';
  department?: string;
}

export interface ReportOwnership {
  id: string;
  authorId: string;
  ownerId?: string;
  status: ReportStatus;
  visibility?: 'Public' | 'Internal' | 'Confidential';
  department?: string;
}

/**
 * Checks if a user has permission to create a report.
 */
export function canCreateReport(user: AuthUser | null): boolean {
  if (!user || user.status === 'DISABLED') return false;
  return user.role === 'ADMIN' || user.role === 'STAFF';
}

/**
 * Checks if a user can view a given report.
 */
export function canViewReport(user: AuthUser | null, report: ReportOwnership): boolean {
  if (!user || user.status === 'DISABLED') return false;
  if (user.role === 'ADMIN') return true;

  // Author and owner can always view their own report
  if (report.authorId === user.id || report.ownerId === user.id) return true;

  // Confidential reports are visible only to Admins or the author/owner
  if (report.visibility === 'Confidential') {
    return false;
  }

  // Drafts are only visible to the author/owner or admin
  if (report.status === 'Draft') {
    return false;
  }

  // Archived reports are visible to Admins (handled above), or to Staff if they are author
  if (report.status === 'Archived') {
    return report.authorId === user.id;
  }

  // Internal and Public reports can be viewed by active Staff and Viewers
  return true;
}

/**
 * Checks if a user can edit a report.
 */
export function canEditReport(user: AuthUser | null, report: ReportOwnership): boolean {
  if (!user || user.status === 'DISABLED') return false;
  if (user.role === 'ADMIN') {
    // Admin can edit in any state except when strictly archived (must unarchive first)
    return report.status !== 'Archived';
  }

  if (user.role === 'STAFF') {
    // Staff can only edit their own reports
    const isOwner = report.authorId === user.id || report.ownerId === user.id;
    if (!isOwner) return false;

    // Staff can only edit when Draft, Rejected, or Submitted (before review begins)
    return report.status === 'Draft' || report.status === 'Rejected' || report.status === 'Submitted';
  }

  return false;
}

/**
 * Checks if a user can submit a report for review.
 */
export function canSubmitReport(user: AuthUser | null, report: ReportOwnership): boolean {
  if (!user || user.status === 'DISABLED') return false;
  const isOwner = report.authorId === user.id || report.ownerId === user.id;
  if (user.role === 'ADMIN' || (user.role === 'STAFF' && isOwner)) {
    return report.status === 'Draft' || report.status === 'Rejected';
  }
  return false;
}

/**
 * Checks if a user can review, approve, or reject a report.
 */
export function canReviewReport(user: AuthUser | null, report: ReportOwnership): boolean {
  if (!user || user.status === 'DISABLED') return false;
  if (user.role !== 'ADMIN') return false;
  return report.status === 'Submitted' || report.status === 'Under Review';
}

/**
 * Checks if a user can archive a report.
 */
export function canArchiveReport(user: AuthUser | null, report: ReportOwnership): boolean {
  if (!user || user.status === 'DISABLED') return false;
  if (user.role === 'ADMIN') return report.status !== 'Archived';
  if (user.role === 'STAFF' && (report.authorId === user.id || report.ownerId === user.id)) {
    return report.status === 'Approved' || report.status === 'Draft';
  }
  return false;
}

/**
 * Checks if a user can delete a report.
 */
export function canDeleteReport(user: AuthUser | null, report: ReportOwnership): boolean {
  if (!user || user.status === 'DISABLED') return false;
  if (user.role === 'ADMIN') return true;

  // Staff can only delete their own Draft reports
  if (user.role === 'STAFF' && (report.authorId === user.id || report.ownerId === user.id)) {
    return report.status === 'Draft';
  }

  return false;
}

/**
 * Checks if a user can manage users and roles.
 */
export function canManageUsers(user: AuthUser | null): boolean {
  return !!user && user.status !== 'DISABLED' && user.role === 'ADMIN';
}

/**
 * Checks if a user can manage categories.
 */
export function canManageCategories(user: AuthUser | null): boolean {
  return !!user && user.status !== 'DISABLED' && user.role === 'ADMIN';
}

/**
 * Checks if a user can export reports.
 */
export function canExportReports(user: AuthUser | null): boolean {
  return !!user && user.status !== 'DISABLED';
}
