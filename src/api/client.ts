/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  User,
  Report,
  Category,
  NotificationItem,
  AuditLogItem,
  ApplicationSettings,
  DashboardStats,
  ReportsFilterQuery,
} from '../types/index.ts';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('srms_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('srms_token', token);
      } else {
        localStorage.removeItem('srms_token');
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'same-origin',
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred during network request.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  // Auth
  async getMe(): Promise<{ user: User | null; needsSetup: boolean }> {
    return this.request<{ user: User | null; needsSetup: boolean }>('/api/auth/me');
  }

  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(res.token);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async setupAdmin(data: any): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(data: any): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Reports
  async getReports(params: ReportsFilterQuery = {}): Promise<{ reports: Report[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString();
    return this.request<{ reports: Report[]; total: number; page: number; totalPages: number }>(`/api/reports${qs ? `?${qs}` : ''}`);
  }

  async getReport(id: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}`);
  }

  async createReport(data: any): Promise<Report> {
    return this.request<Report>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReport(id: string, data: any): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReport(id: string): Promise<void> {
    await this.request(`/api/reports/${id}`, { method: 'DELETE' });
  }

  async submitReport(id: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}/submit`, { method: 'POST' });
  }

  async approveReport(id: string, reviewNotes?: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  }

  async rejectReport(id: string, reviewNotes: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
    });
  }

  async archiveReport(id: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}/archive`, { method: 'POST' });
  }

  async restoreReport(id: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}/restore`, { method: 'POST' });
  }

  getCsvExportUrl(filters: ReportsFilterQuery = {}): string {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString();
    return `/api/reports/export/csv${qs ? `?${qs}` : ''}`;
  }

  getPdfExportUrl(id: string): string {
    return `/api/reports/${id}/export/pdf`;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/dashboard/stats');
  }

  async getDashboardActivity(): Promise<{
    recentAuditLogs: AuditLogItem[];
    recentNotifications: NotificationItem[];
    recentReports: Report[];
  }> {
    return this.request<{
      recentAuditLogs: AuditLogItem[];
      recentNotifications: NotificationItem[];
      recentReports: Report[];
    }>('/api/dashboard/activity');
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    return this.request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return this.request<Category>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/api/categories/${id}`, { method: 'DELETE' });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  async createUser(data: any): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/api/users/${id}`, { method: 'DELETE' });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/api/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/api/notifications/mark-all-read', { method: 'POST' });
  }

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLogItem[]> {
    return this.request<AuditLogItem[]>(`/api/audit-logs?limit=${limit}`);
  }

  // Settings
  async getSettings(): Promise<ApplicationSettings> {
    return this.request<ApplicationSettings>('/api/settings');
  }

  async updateSettings(data: Partial<ApplicationSettings>): Promise<ApplicationSettings> {
    return this.request<ApplicationSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Health
  async checkHealth(): Promise<{ status: string; uptime: number }> {
    return this.request<{ status: string; uptime: number }>('/api/health');
  }
}

export const api = new ApiClient();
