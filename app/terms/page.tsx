import React from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Scale,
  Users,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Terminal,
} from "lucide-react";

export const metadata = {
  title: "Terms of Service // Harmonic Middleware",
  description:
    "Harmonic's terms of service, accessibility instrument operational guidelines, and workspace usage protocols.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans instrument-grid-bg selection:bg-cyan-900 selection:text-cyan-100">
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
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-200">
                HARMONIC // TERMS OF SERVICE
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded bg-zinc-900">
            SPEC: ETHICAL_AI • WCAG_AAA
          </span>
        </div>
      </header>

      {/* Main Content Rack */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
            <Scale className="w-4 h-4" />
            <span>Harmoniq Usage Protocols</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-zinc-100 mb-3 tracking-tight">
            Terms of Service & Operational Mandates
          </h1>
          <p className="text-sm text-zinc-400 font-mono leading-relaxed">
            Effective Date: October 2026 • Instrument Revision: v0.2-INST
          </p>
          <div className="mt-4 p-3 rounded bg-zinc-950/80 border border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-start gap-2.5">
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              By accessing or engaging Harmonic (the &quot;Middleware&quot;, &quot;Workstation&quot;, or &quot;Instrument&quot;),
              you agree to these Terms of Service. Harmonic is engineered to assist cognitive accessibility,
              multilingual equity, and neurodivergent workplace participation.
            </span>
          </div>
        </div>

        {/* Section 1: Acceptable Use */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">1. Acceptable Use & Meeting Consent</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Harmonic captures real-time microphone streams to output live subtitles, Hindi translations,
            and action commitments. When deploying Harmonic in live group environments:
          </p>
          <ul className="space-y-2 text-xs font-mono text-zinc-400">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>You confirm that all participants have provided necessary consent for live audio transcription.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>You will not deploy Harmonic for covert surveillance, deceptive recording, or hostile monitoring.</span>
            </li>
          </ul>
        </section>

        {/* Section 2: Multi-Tenant Workspace Stewardship */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">2. Workspace Ownership & Tenant Stewardship</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Workspaces created on Harmonic are tenant-isolated environments. Workspace Owners (ADMINs)
            hold administrative authority to manage channel creation, invite team members, and purge
            session transcripts. You agree to safeguard credentials and maintain tenant boundaries.
          </p>
        </section>

        {/* Section 3: AI Output & Heuristic Disclaimers */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">3. AI Translation & Heuristic Summary Disclaimers</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Harmonic synthesizes transcripts, Hindi captions, and action matrix items through AI models
            (Gemini 1.5 Flash) and local heuristic fallback engines. While Harmonic strives for high
            semantic fidelity and WCAG AAA compliance, automated translations and summary recaps are
            provided &quot;as is&quot; without warranties of absolute grammatical perfection. Critical decisions
            should always be cross-referenced against verbatim audio.
          </p>
        </section>

        {/* Section 4: Limitation of Liability */}
        <section className="p-6 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <h2 className="font-semibold text-zinc-200">4. Service Continuity & Open Availability</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Harmonic is distributed as an inclusive assistive technology. To the maximum extent permitted
            by law, Harmonic shall not be held liable for indirect, incidental, or consequential damages
            arising from network dropouts, external AI API outages, or local hardware interruptions.
          </p>
        </section>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            <span>Harmonic Accessibility Instrument • </span>
            <Link href="/privacy" className="text-cyan-400 hover:underline">
              Privacy Policy
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
