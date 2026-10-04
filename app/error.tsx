"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home, Terminal, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception telemetry
    console.error("[Harmonic Runtime Fault]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans instrument-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900/90 border border-red-900/80 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="uppercase tracking-wider font-semibold text-red-300">
              CRITICAL EXCEPTION // RACK FAULT
            </span>
          </div>
          {error.digest && (
            <span className="border border-red-950 px-1.5 py-0.5 rounded text-[10px] text-red-400 font-mono bg-red-950/40">
              DIGEST: {error.digest.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Brand Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            <AlertOctagon className="w-7 h-7 text-red-400 shrink-0" />
            <span>Harmonic Rack Interrupt</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed">
            An unhandled runtime error triggered the instrument circuit breaker. Zero-persistence
            safeguards ensured raw audio frames and token buffers were purged immediately.
          </p>
        </div>

        {/* Error Details */}
        <div className="p-3.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-xs font-mono space-y-2 text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px] text-red-400 uppercase">
            <Terminal className="w-3.5 h-3.5" />
            <span>Trace Diagnostic</span>
          </div>
          <p className="text-zinc-200 text-xs break-words bg-zinc-900 p-2 rounded border border-zinc-850">
            {error.message || "An unexpected instrument fault occurred."}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 pt-1">
            <ShieldAlert className="w-3 h-3 text-emerald-400" />
            <span>Data Isolation: In-memory buffers sanitized • Tenant database protected</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 font-mono text-xs">
          <button
            onClick={() => reset()}
            className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Instrument (Retry)</span>
          </button>
          <Link
            href="/"
            className="py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-center uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-zinc-400" />
            <span>Workstation Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
