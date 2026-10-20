import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canCreateReport,
  canViewReport,
  canEditReport,
  canSubmitReport,
  canReviewReport,
  canDeleteReport,
  canManageUsers,
  type AuthUser,
  type ReportOwnership,
} from './rbac.ts';

const adminUser: AuthUser = { id: 'u1', name: 'Admin', email: 'admin@srms.org', role: 'ADMIN' };
const staffUser1: AuthUser = { id: 'u2', name: 'Staff Sarah', email: 'sarah@srms.org', role: 'STAFF' };
const staffUser2: AuthUser = { id: 'u3', name: 'Staff John', email: 'john@srms.org', role: 'STAFF' };
const viewerUser: AuthUser = { id: 'u4', name: 'Viewer Alex', email: 'alex@srms.org', role: 'VIEWER' };
const disabledAdmin: AuthUser = { id: 'u5', name: 'Disabled', email: 'bad@srms.org', role: 'ADMIN', status: 'DISABLED' };

test('canCreateReport allows Admin and Staff, denies Viewer and disabled users', () => {
  assert.equal(canCreateReport(adminUser), true);
  assert.equal(canCreateReport(staffUser1), true);
  assert.equal(canCreateReport(viewerUser), false);
  assert.equal(canCreateReport(disabledAdmin), false);
  assert.equal(canCreateReport(null), false);
});

test('canViewReport enforces draft and confidentiality privacy', () => {
  const staffDraft: ReportOwnership = { id: 'r1', authorId: 'u2', status: 'Draft', visibility: 'Internal' };
  const confidentialApproved: ReportOwnership = { id: 'r2', authorId: 'u2', status: 'Approved', visibility: 'Confidential' };
  const publicApproved: ReportOwnership = { id: 'r3', authorId: 'u2', status: 'Approved', visibility: 'Public' };

  // Owner and Admin can view draft
  assert.equal(canViewReport(staffUser1, staffDraft), true);
  assert.equal(canViewReport(adminUser, staffDraft), true);
  // Another staff or viewer cannot view draft
  assert.equal(canViewReport(staffUser2, staffDraft), false);
  assert.equal(canViewReport(viewerUser, staffDraft), false);

  // Confidential: only owner and admin can view
  assert.equal(canViewReport(staffUser1, confidentialApproved), true);
  assert.equal(canViewReport(adminUser, confidentialApproved), true);
  assert.equal(canViewReport(staffUser2, confidentialApproved), false);
  assert.equal(canViewReport(viewerUser, confidentialApproved), false);

  // Public approved can be viewed by all active users
  assert.equal(canViewReport(viewerUser, publicApproved), true);
  assert.equal(canViewReport(staffUser2, publicApproved), true);
});

test('canEditReport strictly restricts editing based on status and ownership', () => {
  const staffDraft: ReportOwnership = { id: 'r1', authorId: 'u2', status: 'Draft' };
  const staffApproved: ReportOwnership = { id: 'r2', authorId: 'u2', status: 'Approved' };

  // Owner can edit Draft
  assert.equal(canEditReport(staffUser1, staffDraft), true);
  // Non-owner staff cannot edit
  assert.equal(canEditReport(staffUser2, staffDraft), false);
  // Viewer cannot edit
  assert.equal(canEditReport(viewerUser, staffDraft), false);
  // Staff cannot edit their own report once approved
  assert.equal(canEditReport(staffUser1, staffApproved), false);
  // Admin can edit approved
  assert.equal(canEditReport(adminUser, staffApproved), true);
});

test('canReviewReport is restricted to Admin on submitted/under-review states', () => {
  const submittedReport: ReportOwnership = { id: 'r1', authorId: 'u2', status: 'Submitted' };
  assert.equal(canReviewReport(adminUser, submittedReport), true);
  assert.equal(canReviewReport(staffUser1, submittedReport), false);
  assert.equal(canReviewReport(viewerUser, submittedReport), false);
});

test('canDeleteReport protects against unauthorized deletions', () => {
  const staffDraft: ReportOwnership = { id: 'r1', authorId: 'u2', status: 'Draft' };
  const staffSubmitted: ReportOwnership = { id: 'r2', authorId: 'u2', status: 'Submitted' };

  assert.equal(canDeleteReport(adminUser, staffDraft), true);
  assert.equal(canDeleteReport(adminUser, staffSubmitted), true);
  assert.equal(canDeleteReport(staffUser1, staffDraft), true);
  assert.equal(canDeleteReport(staffUser1, staffSubmitted), false); // Cannot delete submitted
  assert.equal(canDeleteReport(staffUser2, staffDraft), false);
});

test('canManageUsers is strictly ADMIN', () => {
  assert.equal(canManageUsers(adminUser), true);
  assert.equal(canManageUsers(staffUser1), false);
  assert.equal(canManageUsers(viewerUser), false);
});
