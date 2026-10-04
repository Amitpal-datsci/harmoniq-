import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Radio, Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans instrument-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-700 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Hardware Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="uppercase tracking-wider font-semibold text-zinc-300">
              FAULT: FREQUENCY NOT FOUND
            </span>
          </div>
          <span className="border border-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 bg-zinc-950">
            HTTP_404
          </span>
        </div>

        {/* Brand Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-3xl font-bold text-zinc-100 tracking-tight">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
            <span>404 // DESYNC</span>
          </div>
          <p className="text-sm text-zinc-300 font-mono leading-relaxed">
            The requested workspace route, channel frequency, or session node does not exist or
            has been purged in accordance with zero-persistence telemetry.
          </p>
        </div>

        {/* Telemetry Scope Box */}
        <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 font-mono text-xs space-y-1.5 text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 uppercase">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Diagnostic Scope</span>
          </div>
          <div className="text-zinc-300 text-[11px]">
            Target Address: <span className="text-amber-300">UNKNOWN_CHANNEL_OR_ROUTE</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            System status: Core middleware operational • Audio buffer safe
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 font-mono text-xs">
          <Link
            href="/"
            className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-purple-950/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Console</span>
          </Link>
          <Link
            href="/workspace/harmonic-core"
            className="py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-center uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Harmonic Core</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
