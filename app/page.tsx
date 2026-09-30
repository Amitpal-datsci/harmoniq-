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

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";

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

// ────────────────────────────────────────────────────────────
//  Deterministic Simulation Dataset
// ────────────────────────────────────────────────────────────

const SIMULATION_EVENTS = [
  {
    delayMs: 1000,
    speaker: "Ananya",
    role: "Product Lead",
    text: "Team, we need to push the backend API release to Monday at 10 AM.",
    hindi: "टीम, हमें बैकेंड एपीआई रिलीज़ को सोमवार सुबह 10 बजे तक धकेलना होगा।",
    actions: [
      {
        task: "Reschedule backend API deployment",
        assignee: "Rahul",
        priority: "High" as const,
        due: "Mon 10:00 AM",
      },
    ],
    notes: [
      "Backend API release rescheduled to Monday 10 AM",
      "Team alignment required before the deployment window",
    ],
    jargon: [
      { term: "API", definition: "Application Programming Interface — standard communication contract." },
      { term: "BACKEND", definition: "Server-side architecture handling database queries & business logic." },
    ],
    recap: "The backend API deployment was rescheduled to Monday 10:00 AM to give the team sufficient runway.",
  },
  {
    delayMs: 5000,
    speaker: "Ananya",
    role: "Product Lead",
    text: "Rahul, please run the full load tests and verify database indexing before the deploy.",
    hindi: "राहुल, कृपया डिप्लॉय से पहले पूरे लोड परीक्षण चलाएं और डेटाबेस इंडेक्सिंग सत्यापित करें।",
    actions: [
      {
        task: "Execute load tests & verify DB indexes",
        assignee: "Rahul",
        priority: "High" as const,
        due: "Sun 6:00 PM",
      },
    ],
    notes: [
      "Load tests must pass before Monday deployment",
      "Database indexing verification is mandatory",
    ],
    jargon: [
      { term: "LOAD TEST", definition: "Simulating high concurrent traffic to evaluate performance bottlenecks." },
      { term: "INDEXING", definition: "Data structures optimizing lookup efficiency on relational tables." },
    ],
    recap: "Rahul was assigned to run load tests and verify DB indexing by Sunday 6 PM before release.",
  },
  {
    delayMs: 9500,
    speaker: "Sam",
    role: "Non-Speaking AAC",
    text: "Understood. The database migration scripts are ready and validated.",
    hindi: "समझ गया। डेटाबेस माइग्रेशन स्क्रिप्ट तैयार और सत्यापित हैं।",
    actions: [],
    notes: [
      "DB migration scripts confirmed ready",
      "Sam has validated all migration steps in staging",
    ],
    jargon: [
      { term: "MIGRATION", definition: "Version-controlled DDL script transforming schema structure." },
      { term: "DB", definition: "Database persistence layer storing structured application state." },
    ],
    recap: "Sam confirmed that all database migration scripts have been validated and are ready.",
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

const SPEAKER_STYLES: Record<string, { tag: string; border: string }> = {
  Ananya: { tag: "text-purple-300 bg-purple-950/40 border-purple-800/70", border: "border-purple-900/40" },
  Rahul: { tag: "text-cyan-300 bg-cyan-950/40 border-cyan-800/70", border: "border-cyan-900/40" },
  Sam: { tag: "text-emerald-300 bg-emerald-950/40 border-emerald-800/70", border: "border-emerald-900/40" },
  "Sam (AAC)": { tag: "text-emerald-300 bg-emerald-950/40 border-emerald-800/70", border: "border-emerald-900/40" },
  Priya: { tag: "text-rose-300 bg-rose-950/40 border-rose-800/70", border: "border-rose-900/40" },
  Alex: { tag: "text-amber-300 bg-amber-950/40 border-amber-800/70", border: "border-amber-900/40" },
  You: { tag: "text-sky-300 bg-sky-950/40 border-sky-800/70", border: "border-sky-900/40" },
};

function getSpeakerStyle(name: string) {
  return SPEAKER_STYLES[name] ?? { tag: "text-zinc-300 bg-zinc-800/60 border-zinc-700", border: "border-zinc-800" };
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
//  Tactile Instrument VU Meter
// ────────────────────────────────────────────────────────────

function HardwareVuMeter({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const bars = 32;
    const barW = Math.floor(W / bars) - 2;

    function draw() {
      if (!ctx) return;
      frameRef.current++;
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // Draw subtle grid lines
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.25);
      ctx.lineTo(W, H * 0.25);
      ctx.moveTo(0, H * 0.5);
      ctx.lineTo(W, H * 0.5);
      ctx.moveTo(0, H * 0.75);
      ctx.lineTo(W, H * 0.75);
      ctx.stroke();

      for (let i = 0; i < bars; i++) {
        const t = frameRef.current / 8 + i * 0.35;
        const amp = active
          ? 0.25 + 0.75 * Math.abs(Math.sin(t) * Math.cos(t * 0.8 + i * 0.25))
          : 0.08 + 0.04 * Math.sin(t);
        const h = amp * H;
        const x = i * (barW + 2);
        const y = H - h;

        // Distinct discrete segmented meter: Emerald -> Amber -> Red peak
        const ratio = amp;
        if (ratio > 0.85) {
          ctx.fillStyle = "#ef4444"; // Red (Peak/Clip)
        } else if (ratio > 0.6) {
          ctx.fillStyle = "#f59e0b"; // Amber (Warning)
        } else {
          ctx.fillStyle = active ? "#10b981" : "#3f3f46"; // Emerald (Normal signal)
        }

        ctx.fillRect(x, y, barW, h);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-2 rounded">
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1 px-1">
        <span>AUDIO SPECTRUM // 48kHz</span>
        <span className={active ? "text-emerald-400 font-bold" : "text-zinc-600"}>
          {active ? "SIGNAL: -3.2 dB" : "SIGNAL: NOISE_FLOOR"}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={380}
        height={46}
        className="w-full h-11 block rounded-none"
      />
      <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-1 px-1">
        <span>-48dB</span>
        <span>-24dB</span>
        <span>-12dB</span>
        <span>-6dB</span>
        <span className="text-red-500/80">0dB [CLIP]</span>
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

export default function HarmonicDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [isListening, setIsListening] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const simTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
            title: "Sprint Planning Call",
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
    [currentSessionId, transcript, actions, notes, recaps, jargon]
  );

  // Rehydrate latest session on mount
  useEffect(() => {
    async function loadLatestSession() {
      try {
        const res = await fetch("/api/sessions");
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
  }, []);

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
          body: JSON.stringify({ rawText, speaker }),
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
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const finalText = Array.from(event.results)
        .filter((r: SpeechRecognitionResult) => r.isFinal)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(" ")
        .trim();
      if (finalText) {
        processText(finalText, "You", "Hardware Input");
      }
    };

    rec.onerror = () => {
      setIsListening(false);
      setWaveActive(false);
    };

    rec.onend = () => {
      setIsListening(false);
      setWaveActive(false);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [isListening, processText]);

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
        <HardwareVuMeter active={waveActive || isListening || isSimulating} />

        {/* Diarized Transcript Feed */}
        <div className="space-y-2 h-64 sm:h-72 lg:h-80 overflow-y-auto pr-1 custom-scrollbar">
          {transcript.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs font-mono gap-1.5 border border-dashed border-zinc-800 rounded p-6">
              <Mic className="w-5 h-5 text-zinc-600" />
              <span>AWAITING AUDIO FRAMES. TOGGLE MIC OR RUN SIMULATION.</span>
            </div>
          )}

          {transcript.map((line) => {
            const style = getSpeakerStyle(line.speaker);
            return (
              <div
                key={line.id}
                className={`p-2.5 rounded bg-zinc-950/70 border ${style.border} transition-colors animate-fade-in-up`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5 pb-1 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border ${style.tag}`}
                    >
                      {line.speaker}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      // {line.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                    [{line.timestamp}]
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                  {bionicMode ? <BionicText text={line.text} /> : line.text}
                </p>
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

  const cardActions = (
    <InstrumentPanel
      id="panel-action-items"
      title="Action Matrix // ADHD Focus"
      icon={Brain}
      badge={
        <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
          {actions.filter((a) => !a.done).length} PENDING
        </span>
      }
    >
      <div className="space-y-2 h-64 sm:h-72 overflow-y-auto pr-1 custom-scrollbar">
        {actions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs font-mono gap-1.5 border border-dashed border-zinc-800 rounded p-6">
            <CheckCircle2 className="w-5 h-5 text-zinc-600" />
            <span>ACTION REGISTER EMPTY. TASKS AUTO-EXTRACT FROM SPEECH.</span>
          </div>
        )}

        {actions.map((action) => (
          <div
            key={action.id}
            tabIndex={0}
            role="button"
            aria-pressed={action.done}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleAction(action.id);
              }
            }}
            onClick={() => toggleAction(action.id)}
            id={`action-item-${action.id}`}
            className={`p-2.5 rounded border transition-colors cursor-pointer select-none text-xs font-mono animate-fade-in-up ${
              action.done
                ? "bg-zinc-950/40 border-zinc-800 text-zinc-500 line-through"
                : "bg-zinc-950 border-zinc-700/80 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <button
                type="button"
                className={`w-4 h-4 rounded-none border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                  action.done
                    ? "bg-emerald-950 border-emerald-700 text-emerald-400"
                    : "border-zinc-600 bg-zinc-900 text-transparent"
                }`}
                aria-label="Toggle action completion"
              >
                {action.done && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-sans text-xs text-zinc-200 mb-1.5 leading-snug">
                  {bionicMode && !action.done ? <BionicText text={action.task} /> : action.task}
                </p>

                <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                  <span className="px-1.5 py-0.2 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                    @{action.assignee}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded border ${PRIORITY_TAGS[action.priority]}`}
                  >
                    [{action.priority.toUpperCase()}]
                  </span>
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {action.due}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
            {cardActions}
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
            </div>

            {/* Hardware Status Indicators */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-zinc-400">
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

              {/* PostgreSQL Session Persistence Status Indicator */}
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
    </>
  );
}
