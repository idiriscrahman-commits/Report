/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SetupAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().optional(),
  title: z.string().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'VIEWER']),
  department: z.string().default('General'),
  title: z.string().default('Staff Member'),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'STAFF', 'VIEWER']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  password: z.string().min(8).optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  description: z.string().default(''),
  color: z.string().optional(),
  active: z.boolean().default(true),
});

export const ReportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().optional(),
  reportType: z.enum([
    'Business',
    'Daily Activity',
    'Project',
    'Technical',
    'Incident',
    'Research',
    'Academic',
    'Personal Work',
    'Custom',
  ]),
  reportingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reportingPeriod: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  projectName: z.string().optional(),
  
  // Structured Content
  summary: z.string().min(10, 'Executive summary must be at least 10 characters'),
  background: z.string().optional(),
  objectives: z.string().optional(),
  description: z.string().min(10, 'Main description is required'),
  activities: z.string().optional(),
  findings: z.string().optional(),
  results: z.string().optional(),
  challenges: z.string().optional(),
  recommendations: z.string().optional(),
  conclusion: z.string().optional(),
  notes: z.string().optional(),

  // Classification & Metadata
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(['Public', 'Internal', 'Confidential']).default('Internal'),
  status: z.enum(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Archived']).optional(),
  expectedVersion: z.number().optional(), // Optimistic concurrency control
  changeSummary: z.string().optional(),
});

export const ReviewReportSchema = z.object({
  reviewNotes: z.string().optional(),
});

export const SettingsSchema = z.object({
  appName: z.string().min(2).optional(),
  organizationName: z.string().min(2).optional(),
  reportPrefix: z.string().min(2).max(10).optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  allowPublicRegistration: z.boolean().optional(),
  defaultVisibility: z.enum(['Public', 'Internal', 'Confidential']).optional(),
  retentionDays: z.number().min(30).max(3650).optional(),
});
