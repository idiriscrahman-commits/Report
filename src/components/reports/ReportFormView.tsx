/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  Eye,
  Edit3,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Tag,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Report, Category, ReportType, ReportPriority, ReportVisibility } from '../../types/index.ts';

interface ReportFormViewProps {
  reportId?: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ReportFormView: React.FC<ReportFormViewProps> = ({
  reportId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const isEditing = Boolean(reportId);

  const [loading, setLoading] = useState(isEditing);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [currentVersion, setCurrentVersion] = useState<number>(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('Business');
  const [reportingDate, setReportingDate] = useState(new Date().toISOString().substring(0, 10));
  const [reportingPeriod, setReportingPeriod] = useState('');
  const [department, setDepartment] = useState(user?.profile?.department || 'Operations');
  const [projectName, setProjectName] = useState('');

  // Structured Content
  const [summary, setSummary] = useState('');
  const [background, setBackground] = useState('');
  const [objectives, setObjectives] = useState('');
  const [description, setDescription] = useState('');
  const [activities, setActivities] = useState('');
  const [findings, setFindings] = useState('');
  const [results, setResults] = useState('');
  const [challenges, setChallenges] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [notes, setNotes] = useState('');

  // Metadata
  const [priority, setPriority] = useState<ReportPriority>('Medium');
  const [visibility, setVisibility] = useState<ReportVisibility>('Internal');
  const [tagsInput, setTagsInput] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [referenceIdPreview, setReferenceIdPreview] = useState('REP-2026-AUTO');

  // Custom Category Creation Modal
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (!isEditing && cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    });
  }, [isEditing, categoryId]);

  useEffect(() => {
    if (reportId) {
      setLoading(true);
      api
        .getReport(reportId)
        .then((r) => {
          setTitle(r.title);
          setCategoryId(r.categoryId);
          setReportType(r.reportType);
          setReportingDate(r.reportingDate);
          setReportingPeriod(r.reportingPeriod || '');
          setDepartment(r.department);
          setProjectName(r.projectName || '');
          setSummary(r.summary);
          setBackground(r.background || '');
          setObjectives(r.objectives || '');
          setDescription(r.description);
          setActivities(r.activities || '');
          setFindings(r.findings || '');
          setResults(r.results || '');
          setChallenges(r.challenges || '');
          setRecommendations(r.recommendations || '');
          setConclusion(r.conclusion || '');
          setNotes(r.notes || '');
          setPriority(r.priority);
          setVisibility(r.visibility);
          setTagsInput(r.tags ? r.tags.join(', ') : '');
          setReferenceIdPreview(r.referenceId);
          setCurrentVersion(r.version);
        })
        .catch((err) => {
          setError((err as Error).message);
        })
        .finally(() => setLoading(false));
    }
  }, [reportId]);

  const handleCreateCustomCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const newCat = await api.createCategory({
        name: newCatName.trim(),
        description: 'Custom category created via report editor',
        color: '#2563eb',
        active: true,
      });
      setCategories((prev) => [...prev, newCat]);
      setCategoryId(newCat.id);
      setNewCatName('');
      setShowNewCatInput(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSave = async (submitForReview: boolean) => {
    setError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setError('Report title is required.');
      return;
    }
    if (!summary.trim()) {
      setError('Executive summary is required.');
      return;
    }
    if (!description.trim()) {
      setError('Main description is required.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: any = {
      title,
      categoryId,
      reportType,
      reportingDate,
      reportingPeriod,
      department,
      projectName,
      summary,
      background,
      objectives,
      description,
      activities,
      findings,
      results,
      challenges,
      recommendations,
      conclusion,
      notes,
      priority,
      visibility,
      tags,
      status: submitForReview ? 'Submitted' : 'Draft',
      expectedVersion: isEditing ? currentVersion : undefined,
      changeSummary: isEditing ? changeSummary || 'General update' : undefined,
    };

    try {
      setSubmitting(true);
      if (isEditing && reportId) {
        const updated = await api.updateReport(reportId, payload);
        setSuccessMsg(submitForReview ? 'Report submitted for review!' : 'Draft updated successfully.');
        setTimeout(() => onNavigate('report-detail', updated.id), 800);
      } else {
        const created = await api.createReport(payload);
        setSuccessMsg(submitForReview ? 'Report created and submitted!' : 'Draft saved successfully.');
        setTimeout(() => onNavigate('report-detail', created.id), 800);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading report editor...</div>;
  }

  const selectedCat = categories.find((c) => c.id === categoryId);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(isEditing && reportId ? 'report-detail' : 'reports', reportId)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            title="Return"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {referenceIdPreview}
              </span>
              {isEditing && (
                <span className="text-[11px] font-semibold text-slate-400">
                  Version v{currentVersion}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {isEditing ? `Edit Report: ${title || 'Untitled'}` : 'Create New Report'}
            </h1>
          </div>
        </div>

        {/* Tab switcher & action buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            disabled={submitting}
            onClick={() => handleSave(false)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            disabled={submitting}
            onClick={() => handleSave(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Review</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'preview' ? (
        /* Live Rendered Document Preview */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold mb-1">
              <span>{selectedCat?.name || 'Category'}</span>
              <span>&bull;</span>
              <span>{reportType}</span>
              <span>&bull;</span>
              <span>{reportingDate}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{title || 'Untitled Report'}</h2>
            <div className="text-xs text-slate-500 mt-1">
              Department: {department} {projectName && `&bull; Project: ${projectName}`}
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Executive Summary</h4>
              <p className="whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{summary || 'No summary entered.'}</p>
            </div>

            {background && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Background & Introduction</h4>
                <p className="whitespace-pre-wrap">{background}</p>
              </div>
            )}

            {objectives && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Objectives</h4>
                <p className="whitespace-pre-wrap">{objectives}</p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Main Description</h4>
              <p className="whitespace-pre-wrap">{description || 'No description entered.'}</p>
            </div>

            {activities && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Activities Performed</h4>
                <p className="whitespace-pre-wrap">{activities}</p>
              </div>
            )}

            {findings && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Findings & Observations</h4>
                <p className="whitespace-pre-wrap">{findings}</p>
              </div>
            )}

            {results && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Results & Outcomes</h4>
                <p className="whitespace-pre-wrap">{results}</p>
              </div>
            )}

            {challenges && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Challenges & Risks</h4>
                <p className="whitespace-pre-wrap">{challenges}</p>
              </div>
            )}

            {recommendations && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Recommendations</h4>
                <p className="whitespace-pre-wrap">{recommendations}</p>
              </div>
            )}

            {conclusion && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1 text-blue-900">Conclusion</h4>
                <p className="whitespace-pre-wrap">{conclusion}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Structured Form Sections */
        <div className="space-y-6">
          {/* Section 1: Identification & Metadata */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Report Identification & Metadata</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Report Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Security Posture Audit & Multi-Cloud Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Category *</label>
                  {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Custom</span>
                    </button>
                  )}
                </div>
                {showNewCatInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-blue-400 rounded-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomCategory}
                      className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                >
                  <option value="Business">Business Report</option>
                  <option value="Daily Activity">Daily Activity Report</option>
                  <option value="Project">Project Report</option>
                  <option value="Technical">Technical Report</option>
                  <option value="Incident">Incident Report</option>
                  <option value="Research">Research & Development</option>
                  <option value="Academic">School / Academic Report</option>
                  <option value="Personal Work">Personal Work Report</option>
                  <option value="Custom">Custom General Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reporting Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={reportingDate}
                  onChange={(e) => setReportingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Period</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 2026, 2026-W42, October 2026"
                  value={reportingPeriod}
                  onChange={(e) => setReportingPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Team <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform Infrastructure"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Project Apollo"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Executive Summary & Core Content */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Report Content Sections</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="High-level executive overview summarizing key takeaways and business impact..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Background / Introduction</label>
                <textarea
                  rows={3}
                  placeholder="Context and origin of this work..."
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objectives</label>
                <textarea
                  rows={3}
                  placeholder="Target goals, KPIs, or expected results..."
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Main Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Detailed narrative, methodologies, and core information..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activities Performed</label>
                <textarea
                  rows={3}
                  placeholder="Specific actions, tasks completed, or procedures run..."
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Findings & Observations</label>
                <textarea
                  rows={3}
                  placeholder="Data discovered, anomalies detected, or metrics measured..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Results & Outcomes</label>
                <textarea
                  rows={3}
                  placeholder="Final deliverables, completed milestones, or impact..."
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Challenges & Risks</label>
                <textarea
                  rows={3}
                  placeholder="Blockers encountered, security risks, or resource bottlenecks..."
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recommendations</label>
                <textarea
                  rows={3}
                  placeholder="Actionable next steps or policy revisions..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Conclusion</label>
                <textarea
                  rows={3}
                  placeholder="Final closing remarks and certification..."
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
              <textarea
                rows={2}
                placeholder="Supplementary references, meeting logs, or appendix details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Classification & Security */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Classification & Access Controls</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ReportPriority)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Visibility Level</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as ReportVisibility)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                >
                  <option value="Internal">Internal (Organization Staff & Auditors)</option>
                  <option value="Public">Public (All Authenticated Users)</option>
                  <option value="Confidential">Confidential (Admin & Author Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Security, Audit, Cloud"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {isEditing && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Revision Summary Note
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of edits made in this version..."
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
