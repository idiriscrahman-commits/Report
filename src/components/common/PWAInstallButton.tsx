/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ variant?: 'sidebar' | 'header' | 'compact' }> = ({
  variant = 'sidebar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          onClick={install}
          aria-label="Install SRMS Progressive Web App"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-left">
        <div className="flex items-center gap-2 mb-1.5">
          <Smartphone className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-100">Install Mobile & Desktop PWA</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">
          Fast offline access, system dock launcher, and native window mode.
        </p>
        <button
          onClick={install}
          className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Install to Device
        </button>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'header' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install on iOS</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="w-full text-left p-2.5 text-xs text-sky-300 hover:text-sky-200 hover:bg-slate-800 rounded-md transition flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install on iPhone/iPad</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add SRMS to Home Screen
              </h3>
              <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Tap the <strong>Share</strong> icon in the Safari navigation bar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Confirm by tapping <strong>Add</strong> in the top-right corner.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
