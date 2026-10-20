/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Clock,
  User,
  Shield,
  FileText,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import type { AuditLogItem } from '../../types/index.ts';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(200);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.actor.name.toLowerCase().includes(s) ||
      log.actor.email.toLowerCase().includes(s) ||
      log.targetName.toLowerCase().includes(s) ||
      log.targetType.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            <span>Security & Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident governance record tracking report revisions, approvals, access attempts, and administrative events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, actor, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredLogs.length} events logged
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No matching audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider text-[11px] font-sans">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">{log.actor.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.actor.role} &bull; {log.actor.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <span className="text-slate-800 font-semibold">{log.targetName || log.targetId}</span>
                      <span className="text-slate-400 text-[10px] ml-1 font-mono">({log.targetType})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate font-mono">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Log Inspector */}
      {selectedLog && (
        <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 font-sans">
            <span className="font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Event Details: {selectedLog.id}</span>
            </span>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <pre className="overflow-x-auto p-3 bg-black/40 rounded-lg text-[11px] text-sky-300">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
