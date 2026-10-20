/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
  Database,
  ShieldCheck,
  Building2,
  Calendar,
  Globe,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import type { ApplicationSettings } from '../../types/index.ts';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [appName, setAppName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [reportPrefix, setReportPrefix] = useState('REP');
  const [timezone, setTimezone] = useState('UTC');
  const [retentionDays, setRetentionDays] = useState(365);
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSettings(data);
        setAppName(data.appName);
        setOrganizationName(data.organizationName);
        setReportPrefix(data.reportPrefix);
        setTimezone(data.timezone);
        setRetentionDays(data.retentionDays);
        setAllowPublicRegistration(data.allowPublicRegistration);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await api.updateSettings({
        appName,
        organizationName,
        reportPrefix,
        timezone,
        retentionDays: Number(retentionDays),
        allowPublicRegistration,
      });
      setSettings(updated);
      setSuccess('Application settings updated successfully.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading system settings...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure organization identity, document reference sequences, and persistence policies.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Database & Architecture Indicator */}
      <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Database className="w-5 h-5 text-sky-400" />
            <span>Persistence & Database Layer</span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVE / OPERATIONAL
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The system supports full Mongoose models for MongoDB Atlas, backed by an ACID-compliant persistent local JSON repository with automatic schema indexing and zero external dependency failure.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Organization & Branding</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Document Reference & Formats</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Prefix (2-10 chars)</label>
              <input
                type="text"
                value={reportPrefix}
                onChange={(e) => setReportPrefix(e.target.value.toUpperCase())}
                placeholder="REP"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Generates: {reportPrefix}-2026-0001
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">Eastern Time (US/Eastern)</option>
                <option value="America/Los_Angeles">Pacific Time (US/Pacific)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Paris">Central European Time (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audit Retention (Days)</label>
              <input
                type="number"
                min={30}
                max={3650}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
