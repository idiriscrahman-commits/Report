/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema } from 'mongoose';

// User Schema
const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'STAFF', 'VIEWER'], default: 'STAFF' },
    status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
    profile: {
      department: { type: String, default: 'General' },
      title: { type: String, default: 'Staff Member' },
      phone: { type: String, default: '' },
      bio: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
    },
  },
  { timestamps: true }
);
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });

// Category Schema
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#3b82f6' },
    active: { type: Boolean, default: true },
    createdBy: { type: String, default: 'SYSTEM' },
  },
  { timestamps: true }
);
CategorySchema.index({ name: 1 });
CategorySchema.index({ active: 1 });

// Report Schema
const ReportSchema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    reportType: {
      type: String,
      enum: [
        'Business',
        'Daily Activity',
        'Project',
        'Technical',
        'Incident',
        'Research',
        'Academic',
        'Personal Work',
        'Custom',
      ],
      default: 'Business',
    },
    reportingDate: { type: String, required: true },
    reportingPeriod: { type: String, default: '' },
    department: { type: String, required: true, trim: true },
    projectName: { type: String, default: '' },

    // Structured Content
    summary: { type: String, required: true },
    background: { type: String, default: '' },
    objectives: { type: String, default: '' },
    description: { type: String, required: true },
    activities: { type: String, default: '' },
    findings: { type: String, default: '' },
    results: { type: String, default: '' },
    challenges: { type: String, default: '' },
    recommendations: { type: String, default: '' },
    conclusion: { type: String, default: '' },
    notes: { type: String, default: '' },

    // Metadata & Classification
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Archived'],
      default: 'Draft',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    tags: [{ type: String, trim: true }],
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      department: { type: String, default: '' },
    },
    ownerId: { type: String, required: true },
    visibility: {
      type: String,
      enum: ['Public', 'Internal', 'Confidential'],
      default: 'Internal',
    },
    attachments: [
      {
        id: String,
        name: String,
        size: Number,
        type: String,
        uploadedAt: String,
      },
    ],
    version: { type: Number, default: 1 },
    revisionHistory: [
      {
        version: Number,
        editedBy: String,
        editedByName: String,
        editedAt: String,
        changesSummary: String,
        status: String,
      },
    ],
    reviewNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

ReportSchema.index({ referenceId: 1 }, { unique: true });
ReportSchema.index({ status: 1 });
ReportSchema.index({ categoryId: 1 });
ReportSchema.index({ reportingDate: -1 });
ReportSchema.index({ 'author.id': 1 });
ReportSchema.index({ title: 'text', summary: 'text', description: 'text' });

// Notification Schema
const NotificationSchema = new Schema(
  {
    recipientId: { type: String, required: true },
    type: {
      type: String,
      enum: ['STATUS_CHANGE', 'APPROVAL', 'REJECTION', 'SUBMISSION', 'SYSTEM'],
      default: 'SYSTEM',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    reportId: { type: String, default: '' },
    reportTitle: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
NotificationSchema.index({ recipientId: 1, read: 1 });

// AuditLog Schema
const AuditLogSchema = new Schema(
  {
    actor: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['REPORT', 'USER', 'CATEGORY', 'SETTING', 'AUTH'],
      required: true,
    },
    targetId: { type: String, required: true },
    targetName: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ 'actor.id': 1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });

// ApplicationSettings Schema
const SettingSchema = new Schema(
  {
    appName: { type: String, default: 'System Report Management System' },
    organizationName: { type: String, default: 'Enterprise Solutions Inc.' },
    reportPrefix: { type: String, default: 'REP' },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    allowPublicRegistration: { type: Boolean, default: false },
    defaultVisibility: { type: String, default: 'Internal' },
    retentionDays: { type: Number, default: 365 },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export const ReportModel = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const SettingModel = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
