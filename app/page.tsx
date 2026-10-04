"use client";

// ────────────────────────────────────────────────────────────
//  Browser SpeechRecognition type shim (not in lib.dom by default)
// ────────────────────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}
type WindowWithSpeech = typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Mic,
  MicOff,
  Zap,
  Settings,
  X,
  CheckCircle2,
  Circle,
  Volume2,
  Languages,
  Brain,
  Radio,
  User,
  Clock,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Wifi,
  WifiOff,
  Terminal,
  Cpu,
  Layers,
  Check,
  Database,
  Users,
  ChevronDown,
  FileText,
  Loader2,
  ListChecks,
  Lightbulb,
  BarChart2,
  Mic2,
  Plus,
  Trash2,
  LogIn,
  LogOut,
  ShieldCheck,
  Building,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { AuthModal } from "@/components/AuthModal";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import { DEFAULT_WORKSPACES, WorkspaceItem, ChannelItem } from "@/lib/workspace";

// ────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  due: string;
  done: boolean;
}

interface JargonTerm {
  term: string;
  definition: string;
}

interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  role: string;
}

interface HarmonizeData {
  transcript: string;
  hindiTranslation: string;
  actions: (Omit<ActionItem, "id" | "done"> & { id?: string; completed?: boolean })[];
  simplifiedNotes: string[];
  jargon?: JargonTerm[];
  summaryRecap?: string;
}

interface SummaryActionItem {
  task: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  due: string;
}

interface MeetingSummary {
  generatedAt: string;
  executiveOverview: string;
  keyDecisions: string[];
  actionItems: SummaryActionItem[];
  speakerParticipation: Record<string, number>;
}

interface TalkTimeStat {
  name: string;
  role: string;
  turns: number;
  words: number;
  pct: number;           // 0–100 share of total words
  hex: string;           // canvas/inline colour
  accentClass: string;   // Tailwind bg class for progress bar fill
  tagClass: string;      // Tailwind text+bg+border classes for badge
}

// ────────────────────────────────────────────────────────────
//  Speaker Roster
// ────────────────────────────────────────────────────────────

export interface SpeakerProfile {
  name: string;
  role: string;
  colorKey: string; // maps to SPEAKER_STYLES
}

export const SPEAKER_ROSTER: SpeakerProfile[] = [
  { name: "Ananya",    role: "Product Lead",     colorKey: "Ananya" },
  { name: "Rahul",     role: "Backend Engineer",  colorKey: "Rahul" },
  { name: "Sam",       role: "Non-Speaking AAC",  colorKey: "Sam" },
  { name: "Priya",     role: "QA / Accessibility",colorKey: "Priya" },
  { name: "You",       role: "Live Input",        colorKey: "You" },
];

// ────────────────────────────────────────────────────────────
//  Deterministic Simulation Dataset (6 turns, 4 speakers)
// ────────────────────────────────────────────────────────────

const SIMULATION_EVENTS = [
  {
    delayMs: 800,
    speaker: "Ananya",
    role: "Product Lead",
    text: "Team, we need to push the backend API release to Monday at 10 AM. Engineering needs the weekend to stabilise.",
    hindi: "टीम, हमें बैकेंड एपीआई रिलीज़ को सोमवार सुबह 10 बजे तक धकेलना होगा।",
    actions: [
      { task: "Reschedule backend API deployment", assignee: "Rahul", priority: "High" as const, due: "Mon 10:00 AM" },
    ],
    notes: ["Backend API release rescheduled to Monday 10 AM", "Weekend buffer approved by Product Lead"],
    jargon: [
      { term: "API", definition: "Application Programming Interface — standard communication contract between services." },
      { term: "BACKEND", definition: "Server-side architecture handling database queries & business logic." },
    ],
    recap: "Ananya rescheduled the backend API release to Monday 10:00 AM citing stabilisation needs.",
  },
  {
    delayMs: 4000,
    speaker: "Rahul",
    role: "Backend Engineer",
    text: "Got it. I can have load tests done by Sunday 6 PM. I'll flag Priya to verify accessibility coverage.",
    hindi: "ठीक है। मैं रविवार शाम 6 बजे तक लोड परीक्षण पूरा कर सकता हूँ।",
    actions: [
      { task: "Execute load tests & verify DB indexes", assignee: "Rahul", priority: "High" as const, due: "Sun 6:00 PM" },
      { task: "Coordinate accessibility coverage check", assignee: "Priya", priority: "Medium" as const, due: "Sun 8:00 PM" },
    ],
    notes: ["Rahul owns load testing by Sunday 6 PM", "Priya to verify accessibility before deploy"],
    jargon: [
      { term: "LOAD TEST", definition: "Simulating high concurrent traffic to validate system performance under stress." },
      { term: "INDEXING", definition: "Data structures optimizing lookup efficiency on relational tables." },
    ],
    recap: "Rahul committed to completing load tests by Sunday 6 PM and flagged Priya for accessibility coverage.",
  },
  {
    delayMs: 8000,
    speaker: "Sam",
    role: "Non-Speaking AAC",
    text: "Understood. The database migration scripts are ready and validated in staging.",
    hindi: "समझ गया। डेटाबेस माइग्रेशन स्क्रिप्ट स्टेजिंग में तैयार और सत्यापित हैं।",
    actions: [],
    notes: ["DB migration scripts confirmed ready in staging", "Sam validated all migration steps"],
    jargon: [
      { term: "MIGRATION", definition: "Version-controlled DDL script transforming database schema structure." },
      { term: "STAGING", definition: "Pre-production environment mirroring production configuration for final validation." },
    ],
    recap: "Sam confirmed all database migration scripts are ready and validated in the staging environment.",
  },
  {
    delayMs: 12500,
    speaker: "Priya",
    role: "QA / Accessibility",
    text: "I'll run screen-reader and keyboard-nav tests on Sunday. Do we have the WCAG 2.2 checklist updated?",
    hindi: "मैं रविवार को स्क्रीन-रीडर और कीबोर्ड-नेव परीक्षण करूंगी।",
    actions: [
      { task: "Update WCAG 2.2 checklist before Sunday tests", assignee: "Priya", priority: "Medium" as const, due: "Sat 5:00 PM" },
    ],
    notes: ["Screen-reader & keyboard-nav tests scheduled for Sunday", "WCAG 2.2 checklist must be updated first"],
    jargon: [
      { term: "WCAG", definition: "Web Content Accessibility Guidelines — international accessibility standard." },
      { term: "SCREEN READER", definition: "Assistive technology converting on-screen text to synthesized speech." },
    ],
    recap: "Priya will run accessibility tests Sunday and requested an updated WCAG 2.2 checklist by Saturday.",
  },
  {
    delayMs: 17000,
    speaker: "Rahul",
    role: "Backend Engineer",
    text: "WCAG checklist is in Notion. Priya, I'll ping you the link. Also — Ananya, CI/CD pipeline is green except for one flaky integration test I'm isolating now.",
    hindi: "WCAG चेकलिस्ट Notion में है। एनान्या, CI/CD पाइपलाइन हरी है, एक अस्थिर टेस्ट छोड़कर।",
    actions: [
      { task: "Isolate and fix flaky integration test", assignee: "Rahul", priority: "High" as const, due: "Sat 11:00 PM" },
    ],
    notes: ["CI/CD pipeline is green except one flaky integration test", "Rahul isolating the flaky test now"],
    jargon: [
      { term: "CI/CD", definition: "Continuous Integration / Continuous Deployment — automated build and release pipeline." },
      { term: "FLAKY TEST", definition: "A non-deterministic test that produces inconsistent pass/fail results." },
    ],
    recap: "Rahul reported CI/CD is green except one flaky integration test he is actively isolating.",
  },
  {
    delayMs: 22000,
    speaker: "Ananya",
    role: "Product Lead",
    text: "Great. Let's do a final go/no-go call Monday at 9 AM. Everyone confirm availability.",
    hindi: "बढ़िया। सोमवार सुबह 9 बजे फाइनल गो/नो-गो कॉल करते हैं। सब उपलब्धता की पुष्टि करें।",
    actions: [
      { task: "Confirm go/no-go call attendance for Monday 9 AM", assignee: "Team", priority: "Medium" as const, due: "Sun 9:00 PM" },
    ],
    notes: ["Final go/no-go call scheduled Monday 9 AM", "All team members must confirm availability"],
    jargon: [
      { term: "GO/NO-GO", definition: "Decision checkpoint determining whether a release should proceed or be halted." },
    ],
    recap: "Ananya scheduled a final go/no-go call for Monday 9 AM and asked all team members to confirm availability.",
  },
];

// ────────────────────────────────────────────────────────────
//  Design System Tokens & Utilities
// ────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function now() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const PRIORITY_TAGS: Record<string, string> = {
  High: "border-red-800/80 bg-red-950/50 text-red-300",
  Medium: "border-amber-800/80 bg-amber-950/50 text-amber-300",
  Low: "border-emerald-800/80 bg-emerald-950/50 text-emerald-300",
};

const SPEAKER_STYLES: Record<string, {
  tag: string;       // badge classes (bg, text, border)
  border: string;    // card left accent border
  accent: string;    // left accent bar color
  active: string;    // active speaker ring
}> = {
  Ananya:      { tag: "text-purple-300 bg-purple-950/40 border-purple-800/70", border: "border-l-purple-600/70",  accent: "bg-purple-600", active: "ring-purple-600/50" },
  Rahul:       { tag: "text-cyan-300   bg-cyan-950/40   border-cyan-800/70",   border: "border-l-cyan-500/70",    accent: "bg-cyan-500",   active: "ring-cyan-500/50" },
  Sam:         { tag: "text-emerald-300 bg-emerald-950/40 border-emerald-800/70", border: "border-l-emerald-500/70", accent: "bg-emerald-500", active: "ring-emerald-500/50" },
  "Sam (AAC)": { tag: "text-emerald-300 bg-emerald-950/40 border-emerald-800/70", border: "border-l-emerald-500/70", accent: "bg-emerald-500", active: "ring-emerald-500/50" },
  Priya:       { tag: "text-rose-300   bg-rose-950/40   border-rose-800/70",   border: "border-l-rose-500/70",     accent: "bg-rose-500",   active: "ring-rose-500/50" },
  Alex:        { tag: "text-amber-300  bg-amber-950/40  border-amber-800/70",  border: "border-l-amber-500/70",    accent: "bg-amber-500",  active: "ring-amber-500/50" },
  You:         { tag: "text-sky-300    bg-sky-950/40    border-sky-800/70",    border: "border-l-sky-500/70",      accent: "bg-sky-500",    active: "ring-sky-500/50" },
};

const DEFAULT_SPEAKER_STYLE = {
  tag: "text-zinc-300 bg-zinc-800/60 border-zinc-700",
  border: "border-l-zinc-600/50",
  accent: "bg-zinc-600",
  active: "ring-zinc-600/40",
};

// Hex colours for canvas rendering — must stay in sync with SPEAKER_STYLES
export const SPEAKER_HEX: Record<string, string> = {
  Ananya:      "#a78bfa", // purple-400
  Rahul:       "#22d3ee", // cyan-400
  Sam:         "#34d399", // emerald-400
  "Sam (AAC)": "#34d399",
  Priya:       "#fb7185", // rose-400
  Alex:        "#fbbf24", // amber-400
  You:         "#38bdf8", // sky-400
};
const DEFAULT_HEX = "#71717a"; // zinc-500

function getSpeakerHex(name: string): string {
  return SPEAKER_HEX[name] ?? DEFAULT_HEX;
}

function getSpeakerStyle(name: string) {
  return SPEAKER_STYLES[name] ?? DEFAULT_SPEAKER_STYLE;
}

function BionicText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((segment, i) => {
        if (/^\s+$/.test(segment)) return <span key={i}>{segment}</span>;
        const mid = Math.ceil(segment.length / 2);
        return (
          <span key={i}>
            <b className="font-semibold text-zinc-100">{segment.slice(0, mid)}</b>
            <span className="font-normal text-zinc-300">{segment.slice(mid)}</span>
          </span>
        );
      })}
    </>
  );
}

// ────────────────────────────────────────────────────────────
//  Real-Time Audio Waveform Visualizer
//  — uses Web Audio AnalyserNode when mic is live
//  — deterministic sine-composite animation during simulation
//  — tints bars + oscilloscope to the active speaker's colour
// ────────────────────────────────────────────────────────────

function HardwareVuMeter({
  active,
  analyserNode,
  speakerColor,
}: {
  active: boolean;
  analyserNode: AnalyserNode | null;
  speakerColor: string;
}) {
  const barsCanvasRef  = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef  = useRef<HTMLCanvasElement>(null);
  const animRef        = useRef<number>(0);
  const frameRef       = useRef(0);

  useEffect(() => {
    const barsCanvas = barsCanvasRef.current;
    const waveCanvas = waveCanvasRef.current;
    if (!barsCanvas || !waveCanvas) return;
    const bCtx = barsCanvas.getContext("2d");
    const wCtx = waveCanvas.getContext("2d");
    if (!bCtx || !wCtx) return;

    const W    = barsCanvas.width;   // shared logical width
    const BH   = barsCanvas.height;  // bar canvas height
    const WH   = waveCanvas.height;  // wave canvas height
    const bars = 48;
    const barW = Math.floor(W / bars) - 1;

    // Frequency buffer for AnalyserNode
    const freqData = analyserNode
      ? new Uint8Array(analyserNode.frequencyBinCount)
      : null;
    const timeData = analyserNode
      ? new Uint8Array(analyserNode.frequencyBinCount)
      : null;

    // Parse speaker colour to r,g,b for alpha compositing
    let cr = 99, cg = 102, cb = 241; // indigo fallback
    const m = speakerColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (m) { cr = parseInt(m[1], 16); cg = parseInt(m[2], 16); cb = parseInt(m[3], 16); }

    function draw() {
      frameRef.current++;
      const f = frameRef.current;

      // ── Bar graph (frequency spectrum) ──────────────────────
      if (bCtx) {
        bCtx.fillStyle = "#09090b";
        bCtx.fillRect(0, 0, W, BH);

        // Grid lines
        bCtx.strokeStyle = "rgba(39,39,42,0.8)";
        bCtx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach((p) => {
          bCtx.beginPath();
          bCtx.moveTo(0, BH * p);
          bCtx.lineTo(W, BH * p);
          bCtx.stroke();
        });

        for (let i = 0; i < bars; i++) {
          let amp: number;
          if (freqData && analyserNode) {
            analyserNode.getByteFrequencyData(freqData);
            // Map bar index to a relevant portion of the freq bins
            const binIndex = Math.floor((i / bars) * (freqData.length * 0.7));
            amp = freqData[binIndex] / 255;
          } else {
            const t = f / 7 + i * 0.32;
            amp = active
              ? 0.18 + 0.82 * Math.abs(Math.sin(t) * Math.cos(t * 0.75 + i * 0.28))
              : 0.05 + 0.04 * Math.sin(t * 0.5);
          }

          const h = amp * BH;
          const x = i * (barW + 1);
          const y = BH - h;

          // Colour zones: speaker accent → amber warning → red clip
          if (amp > 0.88) {
            bCtx.fillStyle = "#ef4444";
          } else if (amp > 0.65) {
            bCtx.fillStyle = `rgba(251,191,36,${0.7 + amp * 0.3})`;
          } else if (active) {
            bCtx.fillStyle = `rgba(${cr},${cg},${cb},${0.55 + amp * 0.45})`;
          } else {
            bCtx.fillStyle = "#3f3f46";
          }
          bCtx.fillRect(x, y, barW, h);

          // Peak cap highlight
          if (active && amp > 0.08) {
            bCtx.fillStyle = `rgba(${cr},${cg},${cb},0.9)`;
            bCtx.fillRect(x, y, barW, 1);
          }
        }
      }

      // ── Oscilloscope (time-domain waveform) ─────────────────
      if (wCtx) {
        wCtx.clearRect(0, 0, W, WH);

        wCtx.lineWidth   = 1.5;
        wCtx.strokeStyle = active
          ? `rgba(${cr},${cg},${cb},0.9)`
          : "rgba(63,63,70,0.6)";
        wCtx.shadowColor = active
          ? `rgba(${cr},${cg},${cb},0.4)`
          : "transparent";
        wCtx.shadowBlur  = active ? 6 : 0;

        wCtx.beginPath();
        const sliceW = W / bars;

        for (let i = 0; i <= bars; i++) {
          let v: number;
          if (timeData && analyserNode) {
            analyserNode.getByteTimeDomainData(timeData);
            const binIdx = Math.floor((i / bars) * timeData.length);
            v = (timeData[binIdx] - 128) / 128; // -1..+1
          } else {
            const t = f / 9 + i * 0.22;
            v = active
              ? 0.55 * Math.sin(t) * Math.cos(t * 0.65 + i * 0.18) +
                0.15 * Math.sin(t * 2.3 + i * 0.4)
              : 0.04 * Math.sin(t * 0.6);
          }

          const x = i * sliceW;
          const y = WH / 2 - v * (WH / 2 - 2);
          i === 0 ? wCtx.moveTo(x, y) : wCtx.lineTo(x, y);
        }
        wCtx.stroke();
        wCtx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, analyserNode, speakerColor]); // eslint-disable-line react-hooks/exhaustive-deps

  const dbLabel = active ? "-3.2 dB" : "NOISE_FLOOR";

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-2 rounded space-y-1">
      {/* Oscilloscope strip */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
        <span className="text-zinc-600">WAVEFORM // TIME DOMAIN</span>
        <span className={active ? "font-bold" : "text-zinc-600"}
              style={{ color: active ? speakerColor : undefined }}>
          {active ? "● LIVE" : "○ IDLE"}
        </span>
      </div>
      <canvas
        ref={waveCanvasRef}
        width={380}
        height={28}
        className="w-full block"
        style={{ height: "28px" }}
      />

      {/* Frequency bar spectrum */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1 pt-0.5">
        <span>SPECTRUM // FREQ DOMAIN</span>
        <span className={active ? "font-bold" : "text-zinc-600"}
              style={{ color: active ? speakerColor : undefined }}>
          SIGNAL: {dbLabel}
        </span>
      </div>
      <canvas
        ref={barsCanvasRef}
        width={380}
        height={44}
        className="w-full block"
        style={{ height: "44px" }}
      />
      <div className="flex justify-between text-[9px] font-mono text-zinc-700 px-1">
        <span>-48dB</span>
        <span>-24dB</span>
        <span>-12dB</span>
        <span>-6dB</span>
        <span className="text-red-600/70">0dB</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Workstation Chassis Panel (Card)
// ────────────────────────────────────────────────────────────

function InstrumentPanel({
  title,
  icon: Icon,
  children,
  badge,
  id,
  className = "",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  badge?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900/90 text-xs font-mono uppercase tracking-wider text-zinc-300">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-200">{title}</span>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="flex-1 overflow-hidden p-3.5 sm:p-4">{children}</div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
//  Settings Modal (Workstation Console)
// ────────────────────────────────────────────────────────────

function SettingsModal({
  open,
  onClose,
  apiKey,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
}) {
  const [draft, setDraft] = useState(apiKey);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 sm:p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300">
            <Cpu className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-zinc-100">Instrument Configuration</h2>
          </div>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 focus-visible:outline-none transition-colors"
            aria-label="Close configuration"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
              Gemini API Secret Key
            </label>
            <input
              id="gemini-api-key-input"
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <p className="mt-1.5 text-[11px] font-mono text-zinc-500">
              Heuristic fallback engine activates automatically if omitted or offline.
            </p>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
            <Terminal className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Zero-persistence mandate: Keys and audio tokens are held strictly in ephemeral RAM.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 mt-6 pt-3 border-t border-zinc-800">
          <button
            id="settings-cancel-btn"
            onClick={onClose}
            className="flex-1 py-2 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-xs font-mono uppercase tracking-wider instrument-btn"
          >
            Cancel
          </button>
          <button
            id="settings-save-btn"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex-1 py-2 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-mono font-semibold text-xs uppercase tracking-wider instrument-btn transition-colors"
          >
            Apply Key
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Catch Me Up Executive Drawer (Instrument Sheet)
// ────────────────────────────────────────────────────────────

function CatchMeUpDrawer({
  open,
  onClose,
  recaps,
  notes,
}: {
  open: boolean;
  onClose: () => void;
  recaps: string[];
  notes: string[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-200 font-semibold">
              Telemetry Summary // Executive Timeline
            </h2>
          </div>
          <button
            id="catchup-close-btn"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close executive drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-5">
          {/* Executive Recaps */}
          {recaps.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span>[TIMELINE_LOGS]</span>
                <span className="text-zinc-600">({recaps.length} segments recorded)</span>
              </div>
              <div className="space-y-2">
                {recaps.map((recap, i) => (
                  <div
                    key={i}
                    className="p-3 border border-zinc-800 bg-zinc-950/70 rounded text-xs animate-fade-in-up"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>SEGMENT_{String(i + 1).padStart(2, "0")}</span>
                      <span>RECORDED</span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed font-sans">{recap}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {notes.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2.5">
                [SYNTHESIZED_TAKEAWAYS]
              </div>
              <ul className="space-y-1.5 font-mono text-xs">
                {notes.slice(-8).map((note, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800 text-zinc-300 flex items-start gap-2"
                  >
                    <span className="text-amber-400 shrink-0 font-mono">›</span>
                    <span className="font-sans text-xs text-zinc-200">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recaps.length === 0 && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-44 text-zinc-500 text-xs font-mono gap-2">
              <Terminal className="w-6 h-6 opacity-40" />
              <p>NO TELEMETRY ACCUMULATED. ENGAGE AUDIO STREAM TO POPULATE.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Profiles / Workstation Modes
// ────────────────────────────────────────────────────────────

const TABS = [
  { id: "all", label: "Master Grid", code: "GRID" },
  { id: "priya", label: "Priya", code: "SENSORY_CAPTIONS" },
  { id: "alex", label: "Alex", code: "ADHD_ACTIONS" },
  { id: "sam", label: "Sam", code: "AAC_SYNTHESIZER" },
];

// ────────────────────────────────────────────────────────────
//  Main Workstation Dashboard
// ────────────────────────────────────────────────────────────

export default function HarmonicDashboard({
  initialWorkspaceSlug,
  initialChannelId,
}: {
  initialWorkspaceSlug?: string;
  initialChannelId?: string;
} = {}) {
  // Multi-tenant Workspace & Channel State
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(DEFAULT_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem>(() => {
    if (initialWorkspaceSlug) {
      const found = DEFAULT_WORKSPACES.find((w) => w.slug === initialWorkspaceSlug);
      if (found) return found;
    }
    return DEFAULT_WORKSPACES[0];
  });
  const [activeChannel, setActiveChannel] = useState<ChannelItem>(() => {
    const ws = initialWorkspaceSlug
      ? DEFAULT_WORKSPACES.find((w) => w.slug === initialWorkspaceSlug) || DEFAULT_WORKSPACES[0]
      : DEFAULT_WORKSPACES[0];
    if (initialChannelId) {
      const chan = ws.channels?.find(
        (c) => c.id === initialChannelId || c.name === initialChannelId
      );
      if (chan) return chan;
    }
    return ws.channels?.[0] || DEFAULT_WORKSPACES[0].channels[0];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [isListening, setIsListening] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data: session, status: authStatus } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [hindiLines, setHindiLines] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [aacInput, setAacInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkOk, setNetworkOk] = useState(true);
  const [waveActive, setWaveActive] = useState(false);
  const [jargon, setJargon] = useState<JargonTerm[]>([]);
  const [recaps, setRecaps] = useState<string[]>([]);
  const [bionicMode, setBionicMode] = useState(false);
  const [showCatchUp, setShowCatchUp] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<"IDLE" | "SYNCING" | "SYNCED" | "OFFLINE">("IDLE");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  // Active speaker for mic attribution
  const [activeSpeaker, setActiveSpeaker] = useState<SpeakerProfile>(SPEAKER_ROSTER[4]); // default: "You"
  const [speakerMenuOpen, setSpeakerMenuOpen] = useState(false);
  // Meeting Summary
  const [meetingSummary, setMeetingSummary] = useState<MeetingSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Action Matrix: manual add form + filter tab
  const [actionFilter, setActionFilter] = useState<"all" | "pending" | "done">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualTask, setManualTask] = useState("");
  const [manualAssignee, setManualAssignee] = useState("Team");
  const [manualPriority, setManualPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [manualDue, setManualDue] = useState("");

  // ── Live Talk-Time Analytics (derived, not stored state) ──
  const talkTimeStats = useMemo<TalkTimeStat[]>(() => {
    if (transcript.length === 0) return [];

    // Aggregate word count and turn count per speaker
    const agg: Record<string, { turns: number; words: number; role: string }> = {};
    for (const line of transcript) {
      const key = line.speaker;
      if (!agg[key]) agg[key] = { turns: 0, words: 0, role: line.role };
      agg[key].turns += 1;
      agg[key].words += line.text.trim().split(/\s+/).filter(Boolean).length;
    }

    const totalWords = Object.values(agg).reduce((s, v) => s + v.words, 0);

    return Object.entries(agg)
      .sort(([, a], [, b]) => b.words - a.words) // descending by word count
      .map(([name, data]) => {
        const style = getSpeakerStyle(name);
        return {
          name,
          role: data.role,
          turns: data.turns,
          words: data.words,
          pct: totalWords > 0 ? Math.round((data.words / totalWords) * 100) : 0,
          hex: getSpeakerHex(name),
          accentClass: style.accent,
          tagClass: style.tag,
        };
      });
  }, [transcript]);

  const recognitionRef    = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptEndRef  = useRef<HTMLDivElement>(null);
  const simTimersRef      = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mediaStreamRef    = useRef<MediaStream | null>(null);
  const audioCtxRef       = useRef<AudioContext | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Fetch accessible workspaces on mount & rehydrate active scope
  useEffect(() => {
    let isMounted = true;
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.workspaces && data.workspaces.length > 0) {
          setWorkspaces(data.workspaces);
          if (initialWorkspaceSlug) {
            const foundWs = data.workspaces.find(
              (w: WorkspaceItem) => w.slug === initialWorkspaceSlug
            );
            if (foundWs) {
              setActiveWorkspace(foundWs);
              const foundChan = initialChannelId
                ? foundWs.channels?.find(
                    (c: ChannelItem) => c.id === initialChannelId || c.name === initialChannelId
                  ) || foundWs.channels?.[0]
                : foundWs.channels?.[0];
              if (foundChan) setActiveChannel(foundChan);
            }
          }
        }
      })
      .catch((err) => console.warn("[Workspaces] DB offline fallback active:", err));

    return () => {
      isMounted = false;
    };
  }, [initialWorkspaceSlug, initialChannelId]);

  // Sync state to PostgreSQL via /api/sessions
  const syncSessionToDb = useCallback(
    async (override?: {
      turns?: TranscriptLine[];
      actions?: ActionItem[];
      notes?: string[];
      recaps?: string[];
      jargon?: JargonTerm[];
    }) => {
      const turnsPayload = override?.turns ?? transcript;
      const actionsPayload = override?.actions ?? actions;
      const notesPayload = override?.notes ?? notes;
      const recapsPayload = override?.recaps ?? recaps;
      const jargonPayload = override?.jargon ?? jargon;

      if (turnsPayload.length === 0 && actionsPayload.length === 0) return;

      setDbStatus("SYNCING");
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionId,
            workspaceId: activeWorkspace.id,
            channelId: activeChannel.id,
            title: `${activeWorkspace.name} - #${activeChannel.name} Session`,
            turns: turnsPayload,
            actions: actionsPayload,
            notes: notesPayload,
            recaps: recapsPayload,
            jargon: jargonPayload,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.session?.id) {
            setCurrentSessionId(data.session.id);
          }
          setDbStatus("SYNCED");
          setLastSyncTime(now());
        } else {
          setDbStatus("OFFLINE");
        }
      } catch {
        setDbStatus("OFFLINE");
      }
    },
    [currentSessionId, transcript, actions, notes, recaps, jargon, activeWorkspace.id, activeWorkspace.name, activeChannel.id, activeChannel.name]
  );

  // Rehydrate latest session for active workspace & channel
  useEffect(() => {
    async function loadLatestSession() {
      try {
        const queryParams = new URLSearchParams();
        if (activeWorkspace.id) queryParams.set("workspaceId", activeWorkspace.id);
        if (activeChannel.id) queryParams.set("channelId", activeChannel.id);
        const url = `/api/sessions?${queryParams.toString()}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.sessions && data.sessions.length > 0) {
          const latest = data.sessions[0];
          setCurrentSessionId(latest.id);
          if (latest.turns && latest.turns.length > 0) {
            setTranscript(
              latest.turns.map((t: { id: string; speaker: string; role: string; text: string; timestamp: string }) => ({
                id: t.id,
                speaker: t.speaker,
                role: t.role,
                text: t.text,
                timestamp: t.timestamp,
              }))
            );
          }
          if (latest.actions && latest.actions.length > 0) {
            setActions(
              latest.actions.map((a: { id: string; task: string; assignee: string; priority: "High" | "Medium" | "Low"; due: string; completed: boolean }) => ({
                id: a.id,
                task: a.task,
                assignee: a.assignee,
                priority: a.priority,
                due: a.due,
                done: a.completed,
              }))
            );
          }
          if (latest.simplifiedNotes?.length) {
            setNotes(latest.simplifiedNotes);
          }
          if (latest.summaryRecaps?.length) {
            setRecaps(latest.summaryRecaps);
          }
          if (latest.glossary?.length) {
            setJargon(
              latest.glossary.map((g: { term: string; definition: string }) => ({
                term: g.term,
                definition: g.definition,
              }))
            );
          }
          setDbStatus("SYNCED");
          setLastSyncTime(now());
        }
      } catch {
        setDbStatus("OFFLINE");
      }
    }
    loadLatestSession();
  }, [activeWorkspace.id, activeChannel.id]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setNetworkOk(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // ── Dispatch Text to API ──────────────────────────────────
  const processText = useCallback(
    async (rawText: string, speaker: string, role: string) => {
      const line: TranscriptLine = {
        id: uid(),
        speaker,
        role,
        text: rawText,
        timestamp: now(),
      };
      setTranscript((prev) => [...prev, line]);
      setIsProcessing(true);

      try {
        const res = await fetch("/api/harmonize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-gemini-key": apiKey } : {}),
          },
          body: JSON.stringify({
            rawText,
            speaker,
            workspaceId: activeWorkspace.id,
            channelId: activeChannel.id,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: HarmonizeData = await res.json();

        if (data.hindiTranslation) {
          setHindiLines((prev) => [
            ...prev,
            `[${speaker}]: ${data.hindiTranslation}`,
          ]);
        }

        if (data.actions?.length) {
          setActions((prev) => [
            ...prev,
            ...data.actions.map((a) => ({
              ...a,
              id: a.id || uid(),
              done: a.completed ?? false,
            })),
          ]);
        }

        if (data.simplifiedNotes?.length) {
          setNotes((prev) => [...prev, ...data.simplifiedNotes]);
        }

        if (data.jargon?.length) {
          setJargon((prev) => {
            const existing = new Set(prev.map((j) => j.term));
            const fresh = data.jargon!.filter((j) => !existing.has(j.term));
            return [...prev, ...fresh];
          });
        }

        if (data.summaryRecap) {
          setRecaps((prev) => [...prev, data.summaryRecap!]);
        }

        // Trigger persistence sync
        setTimeout(() => {
          syncSessionToDb();
        }, 100);
      } catch {
        // Ephemeral resilience: keep local transcript intact
      } finally {
        setIsProcessing(false);
      }
    },
    [apiKey, syncSessionToDb]
  );

  // ── Microphone Controller ─────────────────────────────────
  const toggleMic = useCallback(() => {
    if (typeof window === "undefined") return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setWaveActive(false);
      return;
    }

    const w = window as WindowWithSpeech;
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Web Speech Recognition API unavailable in this browser engine.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-IN";

    rec.onstart = () => {
      setIsListening(true);
      setWaveActive(true);
      // Boot Web Audio analyser for real frequency data
      if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((stream) => {
            mediaStreamRef.current = stream;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            const source  = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyserRef.current = analyser;
            setAnalyserNode(analyser);
          })
          .catch(() => { /* Permission denied — visualiser runs in synth mode */ });
      }
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const finalText = Array.from(event.results)
        .filter((r: SpeechRecognitionResult) => r.isFinal)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(" ")
        .trim();
      if (finalText) {
        processText(finalText, activeSpeaker.name, activeSpeaker.role);
      }
    };

    const teardownAudio = () => {
      setIsListening(false);
      setWaveActive(false);
      // Release Web Audio resources
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current  = null;
      setAnalyserNode(null);
    };

    rec.onerror = teardownAudio;
    rec.onend   = teardownAudio;

    recognitionRef.current = rec;
    rec.start();
  }, [isListening, processText, activeSpeaker]);

  // ── Deterministic Simulation Runner ───────────────────────
  const runSimulation = useCallback(() => {
    if (isSimulating) return;

    setTranscript([]);
    setActions([]);
    setHindiLines([]);
    setNotes([]);
    setJargon([]);
    setRecaps([]);
    setIsSimulating(true);
    setWaveActive(true);

    let completedCount = 0;
    const total = SIMULATION_EVENTS.length;

    SIMULATION_EVENTS.forEach((evt) => {
      const t = setTimeout(async () => {
        const line: TranscriptLine = {
          id: uid(),
          speaker: evt.speaker,
          role: evt.role,
          text: evt.text,
          timestamp: now(),
        };
        setTranscript((prev) => [...prev, line]);
        setHindiLines((prev) => [...prev, `[${evt.speaker}]: ${evt.hindi}`]);

        if (evt.actions.length) {
          setActions((prev) => [
            ...prev,
            ...evt.actions.map((a) => ({ ...a, id: uid(), done: false })),
          ]);
        }

        if (evt.notes.length) {
          setNotes((prev) => [...prev, ...evt.notes]);
        }

        if (evt.jargon?.length) {
          setJargon((prev) => {
            const existing = new Set(prev.map((j) => j.term));
            const fresh = evt.jargon.filter((j) => !existing.has(j.term));
            return [...prev, ...fresh];
          });
        }

        if (evt.recap) {
          setRecaps((prev) => [...prev, evt.recap]);
        }

        completedCount++;
        if (completedCount === total) {
          setTimeout(() => {
            setIsSimulating(false);
            setWaveActive(false);
          }, 1800);
        }
      }, evt.delayMs);

      simTimersRef.current.push(t);
    });
  }, [isSimulating]);

  useEffect(() => {
    return () => {
      simTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // ── AAC Synthesizer ───────────────────────────────────────
  const speakAAC = useCallback(
    (phrase: string) => {
      if (typeof window === "undefined" || !phrase.trim()) return;

      const utterance = new window.SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);

      const line: TranscriptLine = {
        id: uid(),
        speaker: "Sam (AAC)",
        role: "Synthesized Output",
        text: phrase,
        timestamp: now(),
      };
      setTranscript((prev) => [...prev, line]);
      setHindiLines((prev) => [...prev, `[Sam (AAC)]: ${phrase} (एएसी ध्वनि)`]);
    },
    []
  );

  const handleAacSubmit = useCallback(() => {
    if (!aacInput.trim()) return;
    speakAAC(aacInput.trim());
    setAacInput("");
  }, [aacInput, speakAAC]);

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  };

  const deleteAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const addManualTask = useCallback(() => {
    if (!manualTask.trim()) return;
    setActions((prev) => [
      {
        id: uid(),
        task: manualTask.trim(),
        assignee: manualAssignee,
        priority: manualPriority,
        due: manualDue.trim() || "TBD",
        done: false,
      },
      ...prev,
    ]);
    setManualTask("");
    setManualDue("");
    setShowAddForm(false);
  }, [manualTask, manualAssignee, manualPriority, manualDue]);

  // ── Meeting Summarizer ────────────────────────────────────────
  const generateSummary = useCallback(async () => {
    if (transcript.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-key": apiKey } : {}),
        },
        body: JSON.stringify({
          turns: transcript.map((t) => ({
            speaker: t.speaker,
            role: t.role,
            text: t.text,
            timestamp: t.timestamp,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setMeetingSummary(data.summary as MeetingSummary);
      }
    } catch {
      // Network failure — surface nothing; user can retry
    } finally {
      setIsSummarizing(false);
    }
  }, [transcript, isSummarizing, apiKey]);

  // ────────────────────────────────────────────────────────────
  //  Component: Primary Live Audio & Diarized Transcript Panel
  // ────────────────────────────────────────────────────────────

  const cardTranscript = (
    <InstrumentPanel
      id="panel-live-stream"
      title="Live Stream // Diarization"
      icon={Radio}
      badge={
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span
            className={`w-2 h-2 rounded-none inline-block ${
              isListening
                ? "bg-red-500 animate-pulse"
                : isSimulating
                ? "bg-amber-500 animate-pulse"
                : waveActive
                ? "bg-emerald-500"
                : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-300">
            {isListening
              ? "REC_ACTIVE"
              : isSimulating
              ? "SIM_RUNNING"
              : waveActive
              ? "STREAM_LIVE"
              : "STANDBY"}
          </span>
        </div>
      }
    >
      <div className="space-y-3">
        <HardwareVuMeter
          active={waveActive || isListening || isSimulating}
          analyserNode={analyserNode}
          speakerColor={getSpeakerHex(activeSpeaker.name)}
        />

        {/* Diarized Transcript Feed */}
        <div className="space-y-1.5 h-64 sm:h-72 lg:h-80 overflow-y-auto pr-1 custom-scrollbar">
          {transcript.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs font-mono gap-1.5 border border-dashed border-zinc-800 rounded p-6">
              <Users className="w-5 h-5 text-zinc-600" />
              <span>AWAITING AUDIO FRAMES. TOGGLE MIC OR RUN SIMULATION.</span>
            </div>
          )}

          {transcript.map((line) => {
            const style = getSpeakerStyle(line.speaker);
            const isActive = line.speaker === activeSpeaker.name;
            return (
              <div
                key={line.id}
                className={`flex gap-0 rounded overflow-hidden border border-zinc-800/60 bg-zinc-950/80 transition-all animate-fade-in-up ${
                  isActive ? `ring-1 ${style.active}` : ""
                }`}
              >
                {/* Left accent bar */}
                <div className={`w-1 shrink-0 ${style.accent} opacity-80`} />
                <div className="flex-1 p-2.5">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5 pb-1 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${style.tag}`}>
                        {line.speaker}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {line.role}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono text-zinc-600 border border-zinc-800 px-1 rounded bg-zinc-900">
                          ACTIVE_MIC
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                      [{line.timestamp}]
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                    {bionicMode ? <BionicText text={line.text} /> : line.text}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={transcriptEndRef} />
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 border-t border-zinc-800 pt-2">
            <span className="inline-block w-2 h-2 bg-amber-400 animate-ping" />
            <span>HARMONIC ENGINE PROCESSING CHUNK...</span>
          </div>
        )}
      </div>
    </InstrumentPanel>
  );

  // ────────────────────────────────────────────────────────────
  //  Component: AAC Voice Synthesizer
  // ────────────────────────────────────────────────────────────

  const AAC_QUICK_PHRASES = [
    "Understood, on it",
    "Need 5 mins",
    "I agree",
    "Raising a blocker",
  ];

  const cardAAC = (
    <InstrumentPanel
      id="panel-aac-synthesizer"
      title="AAC Voice Output // Sam"
      icon={Volume2}
      badge={
        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-1.5 py-0.5 rounded">
          AAC_SYNTH
        </span>
      }
    >
      <div className="space-y-3">
        {/* Quick Phrase Matrix */}
        <div className="grid grid-cols-2 gap-2">
          {AAC_QUICK_PHRASES.map((phrase) => (
            <button
              key={phrase}
              id={`aac-phrase-${phrase.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => speakAAC(phrase)}
              className="p-2 rounded border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-200 text-xs font-mono text-left transition-colors instrument-btn flex items-center justify-between"
            >
              <span className="truncate">{phrase}</span>
              <Volume2 className="w-3 h-3 text-zinc-400 shrink-0 ml-1" />
            </button>
          ))}
        </div>

        {/* Custom Phrase Input */}
        <div className="flex flex-col gap-2">
          <textarea
            id="aac-custom-input"
            value={aacInput}
            onChange={(e) => setAacInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAacSubmit();
              }
            }}
            placeholder="Type synthesised phrase for meeting broadcast..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-400 transition-colors"
            rows={2}
          />
          <button
            id="aac-speak-btn"
            onClick={handleAacSubmit}
            disabled={!aacInput.trim()}
            className="w-full py-2 rounded bg-zinc-200 hover:bg-white text-zinc-950 font-mono text-xs font-semibold uppercase tracking-wider instrument-btn flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Transmit Voice Phrase
          </button>
        </div>
      </div>
    </InstrumentPanel>
  );

  // ────────────────────────────────────────────────────────────
  //  Component: Cognitive Layer / Action Matrix
  // ────────────────────────────────────────────────────────────

  const QUICK_ADD_TEMPLATES = [
    { task: "Share meeting notes with team",   assignee: "You",    priority: "Medium" as const, due: "TBD" },
    { task: "Follow up on blockers before EOD", assignee: "You",    priority: "High"   as const, due: "Today" },
    { task: "Review and approve open PRs",       assignee: "Rahul",  priority: "Medium" as const, due: "TBD" },
  ];

  const filteredActions = actions.filter((a) => {
    if (actionFilter === "pending") return !a.done;
    if (actionFilter === "done")    return a.done;
    return true;
  });

  const pendingCount = actions.filter((a) => !a.done).length;
  const doneCount    = actions.filter((a) =>  a.done).length;

  const cardActions = (
    <InstrumentPanel
      id="panel-action-items"
      title="Action Matrix // Follow-Up Tasks"
      icon={Brain}
      badge={
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
            {pendingCount} PENDING
          </span>
          {doneCount > 0 && (
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/80 px-1.5 py-0.5 rounded">
              {doneCount} DONE
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-2.5">

        {/* ── Filter tabs ── */}
        <div className="flex gap-1 text-[10px] font-mono" role="tablist">
          {(["all", "pending", "done"] as const).map((tab) => (
            <button
              key={tab}
              id={`action-filter-${tab}`}
              role="tab"
              aria-selected={actionFilter === tab}
              onClick={() => setActionFilter(tab)}
              className={`flex-1 py-1 rounded border uppercase tracking-wider transition-colors ${
                actionFilter === tab
                  ? "bg-zinc-800 border-zinc-600 text-zinc-100"
                  : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              {tab === "all" ? `All (${actions.length})` : tab === "pending" ? `Pending (${pendingCount})` : `Done (${doneCount})`}
            </button>
          ))}
        </div>

        {/* ── Task list ── */}
        <div className="space-y-1.5 h-56 sm:h-64 overflow-y-auto pr-1 custom-scrollbar">
          {filteredActions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs font-mono gap-1.5 border border-dashed border-zinc-800 rounded p-6">
              <CheckCircle2 className="w-5 h-5 text-zinc-600" />
              <span>
                {actionFilter === "done" ? "NO COMPLETED TASKS YET." : actionFilter === "pending" ? "ALL TASKS RESOLVED!" : "ACTION REGISTER EMPTY. TASKS AUTO-EXTRACT FROM SPEECH."}
              </span>
            </div>
          )}

          {filteredActions.map((action) => {
            // Colour assignee badge by matching speaker roster
            const assigneeStyle = getSpeakerStyle(action.assignee);
            const assigneeHex   = getSpeakerHex(action.assignee);
            return (
              <div
                key={action.id}
                id={`action-item-${action.id}`}
                className={`flex gap-0 rounded overflow-hidden border animate-fade-in-up transition-all ${
                  action.done
                    ? "border-zinc-800/50 bg-zinc-950/40 opacity-60"
                    : "border-zinc-700/70 bg-zinc-950 hover:border-zinc-500"
                }`}
              >
                {/* Assignee colour accent bar */}
                <div
                  className={`w-1 shrink-0 ${assigneeStyle.accent} opacity-70`}
                />

                <div className="flex-1 p-2.5 min-w-0">
                  {/* Task text + checkbox */}
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAction(action.id)}
                      className={`w-4 h-4 rounded-none border mt-0.5 shrink-0 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                        action.done
                          ? "bg-emerald-950 border-emerald-700 text-emerald-400"
                          : "border-zinc-600 bg-zinc-900 text-transparent hover:border-zinc-400"
                      }`}
                      aria-label={action.done ? "Mark as pending" : "Mark as done"}
                      aria-pressed={action.done}
                    >
                      {action.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <p className={`flex-1 font-sans text-xs leading-snug ${
                      action.done ? "line-through text-zinc-500" : "text-zinc-200"
                    }`}>
                      {bionicMode && !action.done ? <BionicText text={action.task} /> : action.task}
                    </p>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteAction(action.id); }}
                      className="shrink-0 p-0.5 text-zinc-600 hover:text-red-400 transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                      aria-label="Delete action item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Metadata chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px] font-mono">
                    {/* Assignee badge — speaker-coloured */}
                    <span
                      className={`px-1.5 py-0.5 rounded border font-bold uppercase ${
                        SPEAKER_STYLES[action.assignee]
                          ? assigneeStyle.tag
                          : "border-zinc-700 bg-zinc-800 text-zinc-300"
                      }`}
                      style={SPEAKER_STYLES[action.assignee] ? undefined : { color: assigneeHex }}
                    >
                      @{action.assignee}
                    </span>

                    {/* Priority */}
                    <span className={`px-1.5 py-0.5 rounded border ${PRIORITY_TAGS[action.priority]}`}>
                      [{action.priority.toUpperCase()}]
                    </span>

                    {/* Due */}
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {action.due}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Quick-add templates ── */}
        {!showAddForm && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Quick Add</div>
            <div className="space-y-1">
              {QUICK_ADD_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  id={`quick-add-tpl-${i}`}
                  onClick={() => {
                    setActions((prev) => [{
                      id: uid(),
                      task: tpl.task,
                      assignee: tpl.assignee,
                      priority: tpl.priority,
                      due: tpl.due,
                      done: false,
                    }, ...prev]);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900 hover:border-zinc-700 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2 instrument-btn"
                >
                  <Plus className="w-3 h-3 text-zinc-600 shrink-0" />
                  <span className="truncate">{tpl.task}</span>
                  <span className={`ml-auto shrink-0 px-1 py-0.5 rounded border text-[9px] ${
                    getSpeakerStyle(tpl.assignee).tag
                  }`}>{tpl.assignee}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Manual add form ── */}
        {showAddForm ? (
          <div className="border border-zinc-700 rounded bg-zinc-950/80 p-3 space-y-2 animate-fade-in-up">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>New Action Item</span>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
                aria-label="Close add form"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              id="manual-task-input"
              value={manualTask}
              onChange={(e) => setManualTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addManualTask(); } }}
              placeholder="Describe the action item..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-sans text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition-colors"
              rows={2}
              autoFocus
            />

            <div className="grid grid-cols-3 gap-1.5">
              {/* Assignee */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">ASSIGNEE</label>
                <select
                  id="manual-assignee-select"
                  value={manualAssignee}
                  onChange={(e) => setManualAssignee(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  {SPEAKER_ROSTER.map((sp) => (
                    <option key={sp.name} value={sp.name}>{sp.name}</option>
                  ))}
                  <option value="Team">Team</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">PRIORITY</label>
                <select
                  id="manual-priority-select"
                  value={manualPriority}
                  onChange={(e) => setManualPriority(e.target.value as "High" | "Medium" | "Low")}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Due */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">DUE</label>
                <input
                  id="manual-due-input"
                  type="text"
                  value={manualDue}
                  onChange={(e) => setManualDue(e.target.value)}
                  placeholder="e.g. Mon 5PM"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="manual-task-submit-btn"
              onClick={addManualTask}
              disabled={!manualTask.trim()}
              className="w-full py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold uppercase tracking-wider instrument-btn transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
          </div>
        ) : (
          <button
            id="open-add-task-form-btn"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-dashed border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase tracking-wider instrument-btn transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Task
          </button>
        )}
      </div>
    </InstrumentPanel>
  );

  // ────────────────────────────────────────────────────────────
  //  Component: Multilingual Layer & Monospace Lexicon Table
  // ────────────────────────────────────────────────────────────

  const cardHindi = (
    <InstrumentPanel
      id="panel-multilingual"
      title="Multilingual Layer // Hindi Captions"
      icon={Languages}
      badge={
        <span className="font-mono text-[10px] text-pink-400 bg-pink-950/50 border border-pink-800 px-1.5 py-0.5 rounded">
          DEVANAGARI
        </span>
      }
    >
      <div className="space-y-3 h-64 sm:h-72 overflow-y-auto pr-1 custom-scrollbar">
        {hindiLines.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-xs font-mono gap-1.5 border border-dashed border-zinc-800 rounded p-4">
            <Languages className="w-5 h-5 text-zinc-600" />
            <span>REAL-TIME DEVANAGARI STREAM WILL DISPLAY HERE</span>
          </div>
        )}

        {hindiLines.map((line, i) => (
          <div
            key={i}
            className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-200 animate-fade-in-up"
          >
            <p
              className="text-xs sm:text-sm leading-relaxed"
              style={{ fontFamily: "'Noto Sans Devanagari', -apple-system, sans-serif" }}
            >
              {line}
            </p>
          </div>
        ))}

        {/* Monospace Lexicon Table */}
        {jargon.length > 0 && (
          <div className="mt-3 border border-zinc-800 bg-zinc-950 rounded">
            <div className="px-3 py-1.5 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                <span>Monospace Lexicon Table</span>
              </div>
              <span className="text-zinc-500">[{jargon.length} TERMS]</span>
            </div>
            <div className="divide-y divide-zinc-800 text-xs font-mono">
              {jargon.map((j, i) => (
                <div
                  key={i}
                  className="px-3 py-2 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3"
                >
                  <span className="text-zinc-200 font-bold bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700 text-[11px] w-fit shrink-0">
                    {j.term}
                  </span>
                  <span className="text-zinc-400 font-sans text-xs leading-relaxed">
                    {j.definition}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </InstrumentPanel>
  );

  // ────────────────────────────────────────────────────────────
  //  Component: Speaker Talk-Time & Participation Analytics
  // ────────────────────────────────────────────────────────────

  const cardAnalytics = (
    <InstrumentPanel
      id="panel-analytics"
      title="Talk-Time Analytics // Participation"
      icon={BarChart2}
      badge={
        <span className="font-mono text-[10px] text-sky-400 bg-sky-950/50 border border-sky-800 px-1.5 py-0.5 rounded">
          {talkTimeStats.length > 0 ? `${talkTimeStats.length} SPEAKERS` : "IDLE"}
        </span>
      }
    >
      {talkTimeStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 text-zinc-600 text-xs font-mono gap-1.5 border border-dashed border-zinc-800 rounded p-4">
          <Mic2 className="w-5 h-5 text-zinc-700" />
          <span>RUN SIMULATION OR CAPTURE AUDIO TO POPULATE ANALYTICS</span>
        </div>
      ) : (
        <div className="space-y-3">

          {/* ── Stacked dominance bar ── */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
              <span>WORD SHARE // DOMINANCE MAP</span>
              <span className="text-zinc-600">
                {talkTimeStats.reduce((s, t) => s + t.words, 0)} WORDS TOTAL
              </span>
            </div>
            <div className="flex h-3 rounded overflow-hidden border border-zinc-800 bg-zinc-900">
              {talkTimeStats.map((stat) => (
                <div
                  key={stat.name}
                  className={`${stat.accentClass} transition-all duration-700 ease-out`}
                  style={{ width: `${stat.pct}%`, opacity: 0.85 }}
                  title={`${stat.name}: ${stat.pct}%`}
                />
              ))}
            </div>
            {/* Legend row */}
            <div className="flex flex-wrap gap-2 mt-1.5">
              {talkTimeStats.map((stat) => (
                <div key={stat.name} className="flex items-center gap-1 text-[10px] font-mono">
                  <span
                    className={`w-2 h-2 rounded-none ${stat.accentClass}`}
                    style={{ opacity: 0.85 }}
                  />
                  <span className="text-zinc-400">{stat.name}</span>
                  <span className="text-zinc-600">{stat.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Per-speaker rows ── */}
          <div className="space-y-2">
            {talkTimeStats.map((stat, idx) => {
              const isTop = idx === 0;
              return (
                <div
                  key={stat.name}
                  className={`rounded border bg-zinc-950/80 overflow-hidden transition-all animate-fade-in-up ${
                    isTop ? "border-zinc-600/70" : "border-zinc-800/60"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${stat.tagClass}`}>
                        {stat.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{stat.role}</span>
                      {isTop && (
                        <span className="text-[9px] font-mono text-zinc-600 border border-zinc-800 px-1 rounded bg-zinc-900">
                          LEAD
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[11px] font-mono font-bold tabular-nums"
                      style={{ color: stat.hex }}
                    >
                      {stat.pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="px-2.5 pt-2 pb-0.5">
                    <div className="h-1.5 bg-zinc-900 rounded-none overflow-hidden">
                      <div
                        className={`h-full ${stat.accentClass} transition-all duration-700 ease-out`}
                        style={{ width: `${stat.pct}%`, opacity: 0.8 }}
                      />
                    </div>
                  </div>

                  {/* Telemetry row */}
                  <div className="flex items-center gap-3 px-2.5 py-1.5 text-[10px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Mic2 className="w-3 h-3 text-zinc-600" />
                      <span>
                        <span className="text-zinc-300 tabular-nums">{stat.turns}</span>
                        {" "}TURN{stat.turns !== 1 ? "S" : ""}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-zinc-800" />
                    <div className="flex items-center gap-1">
                      <span>
                        <span className="text-zinc-300 tabular-nums">{stat.words}</span>
                        {" "}WORDS
                      </span>
                    </div>
                    <div className="w-px h-3 bg-zinc-800" />
                    <div className="flex items-center gap-1">
                      <span>
                        ~<span className="text-zinc-300 tabular-nums">
                          {stat.turns > 0 ? Math.round(stat.words / stat.turns) : 0}
                        </span>
                        {" "}W/TURN
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Session metadata ── */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600 pt-1 border-t border-zinc-800">
            <span>TURNS: <span className="text-zinc-400 tabular-nums">{transcript.length}</span></span>
            <span>SPEAKERS: <span className="text-zinc-400 tabular-nums">{talkTimeStats.length}</span></span>
            <span>LIVE UPDATE: <span className="text-emerald-500">ON</span></span>
          </div>
        </div>
      )}
    </InstrumentPanel>
  );

  // ────────────────────────────────────────────────────────────
  //  Component: Meeting Summarizer Panel
  // ────────────────────────────────────────────────────────────

  const PRIORITY_SUMMARY_TAGS: Record<string, string> = {
    High:   "text-red-300    bg-red-950/50    border-red-800/80",
    Medium: "text-amber-300  bg-amber-950/50  border-amber-800/80",
    Low:    "text-emerald-300 bg-emerald-950/50 border-emerald-800/80",
  };

  const cardSummary = (
    <InstrumentPanel
      id="panel-meeting-summary"
      title="Meeting Summary // Intelligence"
      icon={FileText}
      badge={
        meetingSummary ? (
          <span className="font-mono text-[10px] text-violet-400 bg-violet-950/50 border border-violet-800 px-1.5 py-0.5 rounded">
            GENERATED
          </span>
        ) : (
          <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
            ON-DEMAND
          </span>
        )
      }
    >
      <div className="space-y-3">
        {/* Trigger button */}
        <button
          id="generate-summary-btn"
          onClick={generateSummary}
          disabled={isSummarizing || transcript.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 rounded border border-violet-700/70 bg-violet-950/30 hover:bg-violet-900/40 text-violet-300 font-mono text-xs uppercase tracking-wider instrument-btn transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Generate meeting summary"
        >
          {isSummarizing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>SYNTHESISING INTELLIGENCE...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Meeting Summary</span>
            </>
          )}
        </button>

        {/* Empty / no transcript yet */}
        {!isSummarizing && !meetingSummary && transcript.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-xs font-mono gap-1.5 border border-dashed border-zinc-800 rounded p-4">
            <FileText className="w-5 h-5 text-zinc-700" />
            <span>RUN SIMULATION OR CAPTURE AUDIO TO ENABLE SUMMARY</span>
          </div>
        )}

        {/* Shimmer loading skeleton */}
        {isSummarizing && (
          <div className="space-y-2 animate-pulse">
            {["w-full", "w-5/6", "w-4/6"].map((w, i) => (
              <div key={i} className={`h-3 ${w} bg-zinc-800 rounded`} />
            ))}
            <div className="h-px bg-zinc-800 my-2" />
            {["w-3/4", "w-5/6", "w-2/3"].map((w, i) => (
              <div key={i} className={`h-3 ${w} bg-zinc-800 rounded`} />
            ))}
          </div>
        )}

        {/* Rendered summary */}
        {!isSummarizing && meetingSummary && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar animate-fade-in-up">

            {/* Timestamp */}
            <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Generated: {new Date(meetingSummary.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</span>
              {Object.keys(meetingSummary.speakerParticipation).length > 0 && (
                <>
                  <span className="text-zinc-700">|</span>
                  <Users className="w-3 h-3" />
                  <span>
                    {Object.entries(meetingSummary.speakerParticipation)
                      .map(([spk, n]) => `${spk}:${n}`)
                      .join(" · ")}
                  </span>
                </>
              )}
            </div>

            {/* § 1 Executive Overview */}
            <div className="border border-zinc-800 rounded bg-zinc-950/70">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-violet-400">
                <Lightbulb className="w-3 h-3" />
                <span>§1 Executive Overview</span>
              </div>
              <p className="px-3 py-2.5 text-xs text-zinc-200 font-sans leading-relaxed">
                {meetingSummary.executiveOverview}
              </p>
            </div>

            {/* § 2 Key Decisions */}
            {meetingSummary.keyDecisions.length > 0 && (
              <div className="border border-zinc-800 rounded bg-zinc-950/70">
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>§2 Key Decisions</span>
                  <span className="text-zinc-600 ml-auto">[{meetingSummary.keyDecisions.length}]</span>
                </div>
                <ul className="divide-y divide-zinc-800/60">
                  {meetingSummary.keyDecisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 px-3 py-2 text-xs text-zinc-200 font-sans">
                      <ChevronRight className="w-3 h-3 text-cyan-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* § 3 Action Items */}
            {meetingSummary.actionItems.length > 0 && (
              <div className="border border-zinc-800 rounded bg-zinc-950/70">
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  <ListChecks className="w-3 h-3" />
                  <span>§3 Action Items</span>
                  <span className="text-zinc-600 ml-auto">[{meetingSummary.actionItems.length}]</span>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {meetingSummary.actionItems.map((item, i) => (
                    <div key={i} className="px-3 py-2 text-xs font-mono">
                      <p className="text-zinc-200 font-sans text-xs leading-snug mb-1.5">{item.task}</p>
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                          @{item.assignee}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${PRIORITY_SUMMARY_TAGS[item.priority] ?? "text-zinc-400 border-zinc-700"}`}>
                          [{item.priority.toUpperCase()}]
                        </span>
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{item.due}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate */}
            <button
              id="regenerate-summary-btn"
              onClick={generateSummary}
              disabled={isSummarizing}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[11px] uppercase tracking-wider instrument-btn transition-colors disabled:opacity-40"
            >
              <Loader2 className="w-3 h-3" />
              Regenerate
            </button>
          </div>
        )}
      </div>
    </InstrumentPanel>
  );

  // ────────────────────────────────────────────────────────────
  //  Layout Orchestration
  // ────────────────────────────────────────────────────────────

  function renderWorkstationLayout() {
    if (activeTab === "all") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Primary Focus: 60% Screen Weight */}
          <div className="lg:col-span-7 space-y-4">
            {cardTranscript}
            {cardAAC}
          </div>
          {/* Secondary Focus: 40% Screen Weight */}
          <div className="lg:col-span-5 space-y-4">
            {cardAnalytics}
            {cardActions}
            {cardSummary}
            {cardHindi}
          </div>
        </div>
      );
    }

    if (activeTab === "priya") {
      return (
        <div className="space-y-4">
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-pink-400 shrink-0" />
            <span>WORKSTATION PROFILE: PRIYA // SENSORY CAPTIONS PRIORITY</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">{cardHindi}</div>
            <div className="lg:col-span-5">{cardTranscript}</div>
          </div>
        </div>
      );
    }

    if (activeTab === "alex") {
      return (
        <div className="space-y-4">
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-400 shrink-0" />
            <span>WORKSTATION PROFILE: ALEX // ADHD ACTION ITEM PRIORITY</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">{cardActions}</div>
            <div className="lg:col-span-5">{cardTranscript}</div>
          </div>
        </div>
      );
    }

    if (activeTab === "sam") {
      return (
        <div className="space-y-4">
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>WORKSTATION PROFILE: SAM // AAC VOCAL SYNTHESIZER PRIORITY</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">{cardAAC}</div>
            <div className="lg:col-span-5">{cardTranscript}</div>
          </div>
        </div>
      );
    }

    return null;
  }

  // ────────────────────────────────────────────────────────────
  //  Root Render
  // ────────────────────────────────────────────────────────────

  return (
    <>
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        onSave={setApiKey}
      />

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        session={session}
      />

      <CatchMeUpDrawer
        open={showCatchUp}
        onClose={() => setShowCatchUp(false)}
        recaps={recaps}
        notes={notes}
      />

      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans instrument-grid-bg">
        {/* Workstation Console Header */}
        <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Instrument Brand */}
            {/* Instrument Brand & Scope Pill */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center font-mono text-xs font-bold text-zinc-200">
                H•Q
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-100">
                    HARMONIC
                  </h1>
                  <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1 rounded bg-zinc-900">
                    v0.2-INST
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500">
                  TACTILE ACCESSIBILITY MIDDLEWARE
                </p>
              </div>

              {/* Multi-Tenant Scope Pill with Sidebar Toggle */}
              <button
                id="toggle-sidebar-header-btn"
                onClick={() => setIsSidebarOpen((v) => !v)}
                className="flex items-center gap-1.5 border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/60 px-2 py-1 rounded text-xs font-mono instrument-btn transition-colors cursor-pointer ml-1"
                title="Toggle Workspace & Channel Sidebar"
                aria-label="Toggle Workspace Sidebar"
              >
                <Building className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-purple-200">{activeWorkspace.name}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-cyan-300 font-semibold">#{activeChannel.name}</span>
              </button>
            </div>

            {/* Hardware Status Indicators */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-zinc-400 flex-wrap">
              <div className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2 py-1 rounded">
                <span
                  className={`w-1.5 h-1.5 rounded-none ${
                    isListening ? "bg-red-500 animate-ping" : "bg-emerald-500"
                  }`}
                />
                <span>STATUS: {isListening ? "RECORDING" : "STANDBY"}</span>
              </div>

              <div className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2 py-1 rounded">
                {networkOk ? (
                  <Wifi className="w-3 h-3 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-amber-400" />
                )}
                <span>NET: {networkOk ? "ONLINE" : "OFFLINE_FALLBACK"}</span>
              </div>

              {/* PostgreSQL Session Sync Status */}
              <button
                id="db-sync-status-btn"
                onClick={() => syncSessionToDb()}
                className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2 py-1 rounded instrument-btn cursor-pointer transition-colors"
                title={lastSyncTime ? `Last synced: ${lastSyncTime}. Click to sync now.` : "Click to sync session to PostgreSQL"}
              >
                <Database className={`w-3 h-3 ${dbStatus === "SYNCED" ? "text-cyan-400" : dbStatus === "SYNCING" ? "text-amber-400 animate-spin" : "text-zinc-500"}`} />
                <span className={dbStatus === "SYNCED" ? "text-emerald-400" : dbStatus === "SYNCING" ? "text-amber-400" : "text-zinc-400"}>
                  DB: {dbStatus}
                </span>
                {currentSessionId && (
                  <span className="text-[9px] text-zinc-500">[{currentSessionId.slice(-4)}]</span>
                )}
              </button>

              {/* Active Speaker Switcher */}
              <div className="relative">
                <button
                  id="speaker-switcher-btn"
                  onClick={() => setSpeakerMenuOpen((v) => !v)}
                  className={`flex items-center gap-1.5 border px-2 py-1 rounded instrument-btn cursor-pointer transition-colors ${
                    getSpeakerStyle(activeSpeaker.name).tag
                  } border-zinc-700 hover:bg-zinc-800`}
                  aria-label="Switch active speaker"
                  aria-expanded={speakerMenuOpen}
                >
                  <Users className="w-3 h-3" />
                  <span className="font-bold uppercase tracking-wider">{activeSpeaker.name}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${speakerMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {speakerMenuOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 z-40 bg-zinc-900 border border-zinc-700 rounded shadow-2xl min-w-[180px] py-1 animate-fade-in-up"
                    role="listbox"
                    aria-label="Speaker selection"
                  >
                    {SPEAKER_ROSTER.map((sp) => {
                      const s = getSpeakerStyle(sp.name);
                      const isSelected = sp.name === activeSpeaker.name;
                      return (
                        <button
                          key={sp.name}
                          id={`speaker-opt-${sp.name.toLowerCase()}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setActiveSpeaker(sp);
                            setSpeakerMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs font-mono hover:bg-zinc-800 transition-colors ${
                            isSelected ? "bg-zinc-800/80" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-none ${s.accent}`} />
                            <span className={s.tag.split(" ")[0]}>{sp.name.toUpperCase()}</span>
                          </div>
                          <span className="text-zinc-500 text-[10px]">{sp.role}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tactile Hardware Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mic Toggle Switch */}
              <button
                id="mic-toggle-btn"
                onClick={toggleMic}
                disabled={isSimulating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider instrument-btn ${
                  isListening
                    ? "bg-red-950 border border-red-700 text-red-200 font-bold"
                    : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-label={isListening ? "Halt microphone" : "Engage microphone"}
              >
                {isListening ? (
                  <MicOff className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-zinc-300" />
                )}
                <span>{isListening ? "HALT MIC" : "ENGAGE MIC"}</span>
              </button>

              {/* Simulation Dispatcher */}
              <button
                id="simulation-btn"
                onClick={runSimulation}
                disabled={isSimulating || isListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider instrument-btn ${
                  isSimulating
                    ? "bg-amber-950 border border-amber-700 text-amber-200 font-bold"
                    : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-label="Dispatch 30 second simulation test"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSimulating ? "RUNNING..." : "DISPATCH SIM"}</span>
              </button>

              {/* Catch Me Up */}
              <button
                id="catch-me-up-btn"
                onClick={() => setShowCatchUp(true)}
                disabled={recaps.length === 0 && notes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono uppercase tracking-wider instrument-btn disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Open catch me up telemetry drawer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">CATCH UP</span>
                {recaps.length > 0 && (
                  <span className="text-[10px] text-zinc-400">[{recaps.length}]</span>
                )}
              </button>

              {/* Bionic Reading Switch */}
              <button
                id="bionic-reading-btn"
                onClick={() => setBionicMode((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider instrument-btn ${
                  bionicMode
                    ? "bg-cyan-950 border-cyan-700 text-cyan-200 font-bold"
                    : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300"
                }`}
                aria-label="Toggle bionic reading mode"
              >
                {bionicMode ? (
                  <EyeOff className="w-3.5 h-3.5 text-cyan-300" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>BIONIC: {bionicMode ? "ON" : "OFF"}</span>
              </button>

              {/* Settings */}
              <button
                id="settings-btn"
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 instrument-btn"
                aria-label="Open instrument settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Dynamic User & Auth Status */}
              {authStatus === "loading" ? (
                <div className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2 py-1 rounded text-xs font-mono text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                  <span className="text-[10px]">AUTH...</span>
                </div>
              ) : session?.user ? (
                <div className="flex items-center gap-1.5">
                  <button
                    id="user-profile-btn"
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1.5 border border-purple-800/70 bg-purple-950/40 hover:bg-purple-900/50 px-2 py-1 rounded text-xs font-mono instrument-btn transition-colors cursor-pointer"
                    title={`Signed in as ${session.user.email}. Click to view details.`}
                    aria-label="View user profile"
                  >
                    <div className="w-4 h-4 rounded-full bg-purple-900 border border-purple-400 flex items-center justify-center text-[9px] font-bold text-purple-200">
                      {session.user.name ? session.user.name.slice(0, 1).toUpperCase() : "U"}
                    </div>
                    <span className="text-purple-200 font-medium max-w-[90px] sm:max-w-[120px] truncate">
                      {session.user.name || session.user.email?.split("@")[0]}
                    </span>
                    <span className="text-[9px] font-mono text-purple-400/90 border border-purple-800/60 px-1 rounded bg-purple-950/60 hidden md:inline">
                      {session.user.email?.startsWith("admin") ? "ADMIN" : "MEMBER"}
                    </span>
                  </button>

                  <button
                    id="header-signout-btn"
                    onClick={() => signOut({ redirect: false })}
                    className="p-1.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-300 instrument-btn transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="header-signin-btn"
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 border border-purple-800/80 bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider instrument-btn transition-colors cursor-pointer"
                  title="Sign In with Email / Password or Seed Admin"
                  aria-label="Sign In"
                >
                  <LogIn className="w-3.5 h-3.5 text-purple-400" />
                  <span>SIGN IN</span>
                </button>
              )}
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto tab-scroll border-t border-zinc-800/80">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-zinc-200 text-zinc-100 bg-zinc-900 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                }`}
              >
                [{tab.code}] {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Workstation Main Rack with Workspace Navigation Sidebar */}
        <div className="flex min-h-[calc(100vh-85px)]">
          <WorkspaceSidebar
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            activeChannel={activeChannel}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((v) => !v)}
            onSelectWorkspace={(ws) => {
              setActiveWorkspace(ws);
              if (ws.channels && ws.channels.length > 0) {
                setActiveChannel(ws.channels[0]);
              }
            }}
            onSelectChannel={(ch) => setActiveChannel(ch)}
            onCreateChannel={(ch) => {
              setActiveWorkspace((prev) => ({
                ...prev,
                channels: [...(prev.channels || []), ch],
              }));
              setActiveChannel(ch);
            }}
            onCreateWorkspace={(ws) => {
              setWorkspaces((prev) => [...prev, ws]);
              setActiveWorkspace(ws);
              if (ws.channels && ws.channels.length > 0) {
                setActiveChannel(ws.channels[0]);
              }
            }}
          />

          <div className="flex-1 min-w-0">
            {/* Workstation Main Rack */}
            <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
              {/* Executive Simplified Notes Banner */}
              {notes.length > 0 && (
                <div className="mb-4 p-3 rounded bg-zinc-900/90 border border-zinc-800 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Executive Simplified Notes // Takeaway Feed</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-zinc-300">
                    {notes.slice(-4).map((note, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-zinc-950/80 border border-zinc-800 flex items-start gap-2"
                      >
                        <span className="text-zinc-500 font-mono text-[10px] mt-0.5">
                          0{i + 1}
                        </span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Workstation Layout */}
              {renderWorkstationLayout()}
            </main>

            {/* Workstation Footer Chassis */}
            <footer className="border-t border-zinc-800 mt-8 py-4 bg-zinc-950">
              <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-500">
                <span>HARMONIC WORKSTATION // TACTILE ACCESSIBILITY INSTRUMENT</span>
                <span>SPEC: ZERO_PERSISTENCE • GEMINI_1.5_FLASH • WCAG_AAA</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
