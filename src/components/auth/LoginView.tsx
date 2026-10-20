/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../api/client.ts';
import { Modal } from '../common/Modal.tsx';
import type { UserRole } from '../../types/index.ts';

export const LoginView: React.FC = () => {
  const { login, quickLoginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your corporate email address and password.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotMsg(data.message);
    } catch {
      setForgotMsg('Password reset instructions recorded.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Report Management System</h1>
          <p className="text-xs text-slate-400">Enterprise Reporting & Compliance Platform</p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your verified organization credentials below.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="name@srms.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center mb-3">
              One-Click Evaluation Personas
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs('ADMIN')}
                className="p-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-center transition"
              >
                <div className="text-[11px] font-bold text-purple-900">Dr. Reed</div>
                <div className="text-[10px] text-purple-700 font-semibold">ADMIN</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('STAFF')}
                className="p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-center transition"
              >
                <div className="text-[11px] font-bold text-blue-900">Sarah Chen</div>
                <div className="text-[10px] text-blue-700 font-semibold">STAFF</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('VIEWER')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-center transition"
              >
                <div className="text-[11px] font-bold text-slate-900">Alex Mercer</div>
                <div className="text-[10px] text-slate-700 font-semibold">VIEWER</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Role-Based Access Control &bull; TLS / HTTPS Encrypted</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <Modal
          isOpen={forgotModal}
          onClose={() => setForgotModal(false)}
          title="Account Recovery"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter your corporate email address to initiate a password reset. For security compliance, password resets are logged to the audit trail.
            </p>
            {forgotMsg ? (
              <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded-lg border border-blue-200">
                {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="name@srms.org"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Send Recovery Link
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
