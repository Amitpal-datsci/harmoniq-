"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cookie,
  Check,
  Settings2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "harmonic_cookie_consent_v1";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so page renders smoothly first
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // In private browsing or storage disabled, do not block UI
    }
  }, []);

  const savePreferences = (analytics: boolean) => {
    try {
      const prefs: CookiePreferences = {
        necessary: true,
        analytics,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and Privacy Consent Preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fade-in-up"
    >
      <div className="bg-zinc-900/95 border border-zinc-700 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md text-zinc-100 font-sans">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-950/80 border border-purple-600/60 flex items-center justify-center text-purple-300 shrink-0">
              <Cookie className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-100">
              Telemetry & Consent Protocols
            </h2>
          </div>
          <button
            onClick={() => savePreferences(false)}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
            title="Dismiss with Necessary Only"
            aria-label="Dismiss cookie notice with necessary cookies only"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-300 leading-relaxed mb-3">
          Harmonic operates under a strict{" "}
          <strong className="text-purple-300">Zero-Persistence Mandate</strong>. We use local
          storage for authenticated session state, audio visualizer settings, and optional
          latency telemetry. No advertising or cross-site tracking cookies are ever deployed.
        </p>

        {/* Detailed Options Accordion */}
        {showDetails && (
          <div className="p-3 mb-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2.5 text-xs font-mono">
            {/* Necessary */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-zinc-200 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Strictly Necessary</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Authentication tokens & accessibility preferences.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 border border-emerald-800/80 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                Always Active
              </span>
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
              <div>
                <div className="text-zinc-200 font-semibold">Anonymized Telemetry</div>
                <p className="text-[10px] text-zinc-400">
                  Measures Web Audio buffer latency and Gemini response latency.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="sr-only peer"
                  aria-label="Enable anonymized performance telemetry"
                />
                <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Privacy & Terms Links */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 mb-3.5">
          <Link href="/privacy" className="hover:text-purple-300 underline underline-offset-2">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-cyan-300 underline underline-offset-2">
            Terms of Service
          </Link>
          <span className="ml-auto">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Settings2 className="w-3 h-3" />
              <span>{showDetails ? "Hide Details" : "Preferences"}</span>
              {showDetails ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            id="cookie-necessary-only-btn"
            onClick={() => savePreferences(false)}
            className="flex-1 py-1.5 px-2 rounded-lg border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-center uppercase tracking-wider text-[11px] transition-colors cursor-pointer"
          >
            Necessary Only
          </button>
          <button
            id="cookie-accept-all-btn"
            onClick={() => savePreferences(true)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-center uppercase tracking-wider text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-purple-950/40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept All</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
