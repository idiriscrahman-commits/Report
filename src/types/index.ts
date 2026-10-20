/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'STAFF' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface UserProfile {
  department: string;
  title: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export type ReportType =
  | 'Business'
  | 'Daily Activity'
  | 'Project'
  | 'Technical'
  | 'Incident'
  | 'Research'
  | 'Academic'
  | 'Personal Work'
  | 'Custom';

export type ReportStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Archived';

export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ReportVisibility = 'Public' | 'Internal' | 'Confidential';

export interface ReportAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface ReportRevision {
  version: number;
  editedBy: string;
  editedByName: string;
  editedAt: string;
  changesSummary: string;
  status: ReportStatus;
}

export interface Report {
  id: string;
  referenceId: string;
  title: string;
  categoryId: string;
  categoryName: string;
  reportType: ReportType;
  reportingDate: string;
  reportingPeriod?: string;
  department: string;
  projectName?: string;
  
  // Structured report content sections
  summary: string;
  background?: string;
  objectives?: string;
  description: string;
  activities?: string;
  findings?: string;
  results?: string;
  challenges?: string;
  recommendations?: string;
  conclusion?: string;
  notes?: string;

  // Metadata & Classification
  status: ReportStatus;
  priority: ReportPriority;
  tags: string[];
  author: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  ownerId: string;
  visibility: ReportVisibility;
  attachments: ReportAttachment[];
  version: number;
  revisionHistory: ReportRevision[];
  reviewNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color?: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: 'STATUS_CHANGE' | 'APPROVAL' | 'REJECTION' | 'SUBMISSION' | 'SYSTEM';
  title: string;
  message: string;
  reportId?: string;
  reportTitle?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  action: string;
  targetType: 'REPORT' | 'USER' | 'CATEGORY' | 'SETTING' | 'AUTH';
  targetId: string;
  targetName: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ApplicationSettings {
  appName: string;
  organizationName: string;
  reportPrefix: string;
  timezone: string;
  dateFormat: string;
  allowPublicRegistration: boolean;
  defaultVisibility: ReportVisibility;
  retentionDays: number;
  updatedAt: string;
}

export interface DashboardStats {
  totalReports: number;
  draftReports: number;
  submittedReports: number;
  underReviewReports: number;
  approvedReports: number;
  rejectedReports: number;
  archivedReports: number;
  reportsThisMonth: number;
  reportsByCategory: { category: string; count: number; color?: string }[];
  reportsByStatus: { status: ReportStatus; count: number }[];
  reportsByPriority: { priority: ReportPriority; count: number }[];
  reportsOverTime: { month: string; count: number }[];
}

export interface ReportsFilterQuery {
  search?: string;
  status?: ReportStatus | 'All';
  category?: string;
  priority?: ReportPriority | 'All';
  department?: string;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'reportingDate' | 'createdAt' | 'updatedAt' | 'title' | 'referenceId';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
