import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  Server,
  Database,
  ArrowLeft,
  CheckCircle2,
  Terminal,
} from "lucide-react";

export const metadata = {
  title: "Privacy Protocol // Harmonic Middleware",
  description:
    "Harmonic's zero-persistence privacy architecture, accessibility telemetry, and data isolation protocols.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans instrument-grid-bg selection:bg-purple-900 selection:text-purple-100">
      {/* Top Console Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Console</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-200">
                HARMONIC // PRIVACY PROTOCOL
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded bg-zinc-900">
            SPEC: ZERO_PERSISTENCE • WCAG_AAA
          </span>
        </div>
      </header>

      {/* Main Content Rack */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Harmoniq Architecture Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-zinc-100 mb-3 tracking-tight">
            Zero-Persistence Privacy Specification
          </h1>
          <p className="text-sm text-zinc-400 font-mono leading-relaxed">
            Effective Date: October 2026 • Instrument Revision: v0.2-INST
          </p>
          <div className="mt-4 p-3 rounded bg-zinc-950/80 border border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-start gap-2.5">
            <Terminal className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              Mandate: Harmonic operates strictly as an in-flight semantic accessibility
              middleware. Live audio buffers and microphone streams are processed transiently in
              ephemeral memory and are never written to disk or pooled for model retraining.
            </span>
          </div>
        </div>

        {/* Section 1: Audio Processing */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">1. Ephemeral In-Flight Audio Processing</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            When you activate the microphone instrument or stream simulated meeting segments, audio
            chunks are encoded directly in-browser using standard Web Audio API structures. Harmonic
            transforms segments into structured accessibility objects (Hindi translations, ADHD
            takeaways, action matrices) via serverless inference handlers.
          </p>
          <ul className="space-y-2 text-xs font-mono text-zinc-400">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Raw audio files are never stored, logged, or serialized to persistent disks.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ephemeral RAM tokens are instantly reclaimed upon socket/stream termination.</span>
            </li>
          </ul>
        </section>

        {/* Section 2: Multi-Tenant Data Isolation */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">2. Multi-Tenant Workspace & Channel Isolation</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Harmonic models all transcripts, action items, and executive recaps strictly within
            tenant boundaries (PostgreSQL via Prisma ORM). A session belongs exclusively to its
            assigned <code className="text-purple-300">workspaceId</code> and <code className="text-cyan-300">channelId</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-zinc-400">
            <div className="p-3 rounded bg-zinc-950/70 border border-zinc-800">
              <span className="text-zinc-200 font-semibold block mb-1">Access Control</span>
              Workspace memberships enforce role-based authorization (ADMIN, MEMBER, GUEST) on all
              session endpoints.
            </div>
            <div className="p-3 rounded bg-zinc-950/70 border border-zinc-800">
              <span className="text-zinc-200 font-semibold block mb-1">Session Pruning</span>
              Users and Workspace Admins retain full autonomy to clear, overwrite, or delete session
              turns at any moment.
            </div>
          </div>
        </section>

        {/* Section 3: Telemetry & Cookies */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">3. Cookie & Client Telemetry Governance</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Harmonic deploys zero third-party cross-site trackers or ad pixels. Client storage is
            reserved strictly for:
          </p>
          <ul className="space-y-1.5 text-xs font-mono text-zinc-400">
            <li>• <strong className="text-zinc-200">Necessary Session Cookies:</strong> NextAuth stateless JWT tokens for authenticated workspace operators.</li>
            <li>• <strong className="text-zinc-200">Local Preferences:</strong> Audio frequency levels, Bionic reading switches, and Cookie Consent state in browser <code className="text-purple-300">localStorage</code>.</li>
            <li>• <strong className="text-zinc-200">Optional Analytics:</strong> Anonymized runtime latency telemetry, strictly enabled only when user provides explicit consent.</li>
          </ul>
        </section>

        {/* Section 4: Security & Keys */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">4. Key Management & Server-Side Security</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            All API secret keys (such as Google Gemini inference tokens and Auth JWT secrets) are
            maintained strictly within server environment variables (<code className="text-purple-300">GEMINI_API_KEY</code>, <code className="text-purple-300">AUTH_SECRET</code>).
            When a user supplies an ephemeral custom key via the Instrument Configuration dialog, it is
            transmitted via TLS 1.3 in headers and cached only in transient component memory.
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            <span>Harmonic Accessibility Instrument • </span>
            <Link href="/terms" className="text-purple-400 hover:underline">
              Terms of Service
            </Link>
          </div>
          <Link
            href="/"
            className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors"
          >
            ← Return to Workstation
          </Link>
        </div>
      </main>
    </div>
  );
}
