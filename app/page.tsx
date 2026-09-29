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
  ChevronDown,
  Send,
  KeyRound,
  Wifi,
  WifiOff,
  Accessibility,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
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
//  Simulation data (deterministic, no network required)
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
      "Team alignment required before the deadline",
    ],
    jargon: [
      { term: "API", definition: "Application Programming Interface — a contract for software communication." },
      { term: "BACKEND", definition: "The server-side layer handling business logic and data." },
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
      { term: "LOAD TEST", definition: "Simulating high traffic to validate system performance under stress." },
      { term: "INDEXING", definition: "Creating data structures to speed up database queries." },
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
      "Sam has validated all migration steps",
    ],
    jargon: [
      { term: "MIGRATION", definition: "A versioned change to a database schema." },
      { term: "DB", definition: "Database — structured storage for persistent data." },
    ],
    recap: "Sam confirmed that all database migration scripts have been validated and are ready.",
  },
];

// ────────────────────────────────────────────────────────────
//  Utilities
// ────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function now() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-500/20 text-red-300 border border-red-500/40",
  Medium: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
  Low: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
};

const SPEAKER_COLORS: Record<string, string> = {
  Ananya: "text-violet-400",
  Rahul: "text-sky-400",
  Sam: "text-emerald-400",
  "Sam (AAC)": "text-emerald-400",
  Priya: "text-pink-400",
  Alex: "text-amber-400",
  You: "text-cyan-400",
};

function speakerColor(name: string): string {
  return SPEAKER_COLORS[name] ?? "text-slate-300";
}

function BionicText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((segment, i) => {
        if (/^\s+$/.test(segment)) return <span key={i}>{segment}</span>;
        const mid = Math.ceil(segment.length / 2);
        return (
          <span key={i}>
            <b className="font-semibold text-white">{segment.slice(0, mid)}</b>
            <span className="font-normal">{segment.slice(mid)}</span>
          </span>
        );
      })}
    </>
  );
}

// ────────────────────────────────────────────────────────────
//  Sub-components
// ────────────────────────────────────────────────────────────

function AudioWaveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="flex items-center gap-[3px] h-10">
      {bars.map((i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            active ? "bg-violet-500" : "bg-slate-600"
          }`}
          style={{
            width: 3,
            height: active
              ? `${10 + Math.sin(Date.now() / 200 + i * 0.7) * 20 + Math.random() * 12}px`
              : "6px",
            transition: active ? "height 0.12s ease" : "height 0.4s ease",
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

function LiveWaveformCanvas({ active }: { active: boolean }) {
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
    const bars = 36;
    const barW = Math.floor(W / bars) - 2;

    function draw() {
      if (!ctx) return;
      frameRef.current++;
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < bars; i++) {
        const t = frameRef.current / 8 + i * 0.4;
        const amp = active
          ? 0.3 + 0.7 * Math.abs(Math.sin(t) * Math.cos(t * 0.7 + i * 0.3))
          : 0.07 + 0.03 * Math.sin(t);
        const h = amp * H;
        const x = i * (barW + 2);
        const y = (H - h) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        if (active) {
          grad.addColorStop(0, "rgba(139,92,246,0.9)");
          grad.addColorStop(0.5, "rgba(99,102,241,1)");
          grad.addColorStop(1, "rgba(139,92,246,0.9)");
        } else {
          grad.addColorStop(0, "rgba(71,85,105,0.5)");
          grad.addColorStop(1, "rgba(51,65,85,0.5)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={56}
      className="w-full h-14 rounded-lg"
    />
  );
}

// ────────────────────────────────────────────────────────────
//  Settings Modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-[#0f1629] border border-slate-700/60 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Harmonic Settings</h2>
          </div>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1629] transition-all"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Gemini API Key
            </label>
            <input
              id="gemini-api-key-input"
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/70 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1629] transition-colors"
            />
            <p className="mt-2 text-xs text-slate-500">
              Optional — without a key, Harmonic uses local extraction as fallback.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Accessibility className="w-4 h-4 text-violet-400 shrink-0" />
            <p className="text-xs text-violet-300">
              Keys are stored only in browser session memory and never persisted.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            id="settings-cancel-btn"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-600/60 text-slate-300 hover:bg-slate-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1629] transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            id="settings-save-btn"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1629] text-white font-medium transition-all text-sm shadow-lg shadow-violet-600/30"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Catch Me Up Drawer
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-[#0f1629] border border-slate-700/60 rounded-2xl w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-pink-500" />

        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Catch Me Up</h2>
              <p className="text-xs text-slate-500">Executive timeline & key takeaways</p>
            </div>
          </div>
          <button
            id="catchup-close-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1629] transition-all"
            aria-label="Close Catch Me Up drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-6">
          {/* Executive Recaps Timeline */}
          {recaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
                Executive Recap Timeline
              </p>
              <div className="space-y-3">
                {recaps.map((recap, i) => (
                  <div key={i} className="flex gap-3 items-start animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex flex-col items-center mt-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-violet-500/20" />
                      {i < recaps.length - 1 && (
                        <div className="w-px flex-1 bg-slate-700/60 mt-1 min-h-[24px]" />
                      )}
                    </div>
                    <div className="flex-1 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                      <p className="text-sm text-slate-200 leading-relaxed">{recap}</p>
                      <span className="text-xs text-slate-500 mt-1.5 block">Segment {i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simplified Notes */}
          {notes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                Key Takeaways
              </p>
              <ul className="space-y-2">
                {notes.slice(-8).map((note, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-200 animate-fade-in-up"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 rotate-[-90deg]" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recaps.length === 0 && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
              <Sparkles className="w-8 h-8 opacity-30" />
              <p>No meeting data yet. Start a session to build the timeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Card wrapper
// ────────────────────────────────────────────────────────────

function Card({
  title,
  icon: Icon,
  iconColor,
  children,
  badge,
  id,
  className = "",
  glow = false,
  glowColor = "violet",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  id?: string;
  className?: string;
  glow?: boolean;
  glowColor?: "violet" | "red" | "amber";
}) {
  const glowStyles = {
    red: "border-red-500/50 shadow-[0_0_28px_rgba(239,68,68,0.22)] ring-1 ring-red-500/40",
    amber: "border-amber-500/50 shadow-[0_0_28px_rgba(245,158,11,0.22)] ring-1 ring-amber-500/40",
    violet: "border-violet-500/50 shadow-[0_0_28px_rgba(139,92,246,0.22)] ring-1 ring-violet-500/40",
  };

  return (
    <div
      id={id}
      className={`bg-[#0d1526]/85 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden shadow-xl transition-all duration-300 border ${
        glow ? glowStyles[glowColor] : "border-slate-700/40 hover:border-slate-600/60"
      } ${className}`}
    >
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-700/40">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-slate-200 tracking-wide truncate">
          {title}
        </span>
        {badge && <div className="ml-auto shrink-0">{badge}</div>}
      </div>
      <div className="flex-1 overflow-hidden p-4 sm:p-5">{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Tab profiles
// ────────────────────────────────────────────────────────────

const TABS = [
  { id: "all", label: "All Views (Unified Grid)", emoji: "⊞" },
  { id: "priya", label: "Priya", sub: "Sensory / High-Contrast Hindi Captions", emoji: "♿" },
  { id: "alex", label: "Alex", sub: "ADHD / Action Cards", emoji: "🧠" },
  { id: "sam", label: "Sam", sub: "Non-Speaking / AAC Voice", emoji: "🗣️" },
];

// ────────────────────────────────────────────────────────────
//  Main Dashboard
// ────────────────────────────────────────────────────────────

export default function HarmonicDashboard() {
  // State
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

  // Refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const simTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Network detection
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

  // ── API Call ──────────────────────────────────────────────
  const processText = useCallback(
    async (rawText: string, speaker: string, role: string) => {
      // Add to transcript immediately
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
      } catch {
        // Graceful: just keep the transcript line
      } finally {
        setIsProcessing(false);
      }
    },
    [apiKey]
  );

  // ── Speech Recognition ────────────────────────────────────
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
      alert("Web Speech Recognition is not supported in this browser. Try Chrome.");
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
        processText(finalText, "You", "Live Mic");
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

  // ── Simulation ────────────────────────────────────────────
  const runSimulation = useCallback(() => {
    if (isSimulating) return;

    // Clear previous state
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
        // Add transcript line
        const line: TranscriptLine = {
          id: uid(),
          speaker: evt.speaker,
          role: evt.role,
          text: evt.text,
          timestamp: now(),
        };
        setTranscript((prev) => [...prev, line]);

        // Add hindi translation
        setHindiLines((prev) => [...prev, `[${evt.speaker}]: ${evt.hindi}`]);

        // Add actions
        if (evt.actions.length) {
          setActions((prev) => [
            ...prev,
            ...evt.actions.map((a) => ({ ...a, id: uid(), done: false })),
          ]);
        }

        // Add notes
        if (evt.notes.length) {
          setNotes((prev) => [...prev, ...evt.notes]);
        }

        // Add jargon
        if (evt.jargon?.length) {
          setJargon((prev) => {
            const existing = new Set(prev.map((j) => j.term));
            const fresh = evt.jargon.filter((j) => !existing.has(j.term));
            return [...prev, ...fresh];
          });
        }

        // Add recaps
        if (evt.recap) {
          setRecaps((prev) => [...prev, evt.recap]);
        }

        completedCount++;
        if (completedCount === total) {
          setTimeout(() => {
            setIsSimulating(false);
            setWaveActive(false);
          }, 2000);
        }
      }, evt.delayMs);

      simTimersRef.current.push(t);
    });
  }, [isSimulating]);

  // Cleanup simulation timers
  useEffect(() => {
    return () => {
      simTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // ── AAC Speak ─────────────────────────────────────────────
  const speakAAC = useCallback(
    (phrase: string) => {
      if (typeof window === "undefined" || !phrase.trim()) return;

      const utterance = new window.SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);

      // Append to transcript
      const line: TranscriptLine = {
        id: uid(),
        speaker: "Sam (AAC)",
        role: "Non-Speaking AAC",
        text: phrase,
        timestamp: now(),
      };
      setTranscript((prev) => [...prev, line]);

      // Also push a Hindi note
      setHindiLines((prev) => [...prev, `[Sam (AAC)]: ${phrase} (एएसी संदेश)`]);
    },
    []
  );

  const handleAacSubmit = useCallback(() => {
    if (!aacInput.trim()) return;
    speakAAC(aacInput.trim());
    setAacInput("");
  }, [aacInput, speakAAC]);

  // ── Toggle action done ────────────────────────────────────
  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  };

  // ────────────────────────────────────────────────────────────
  //  Card renders
  // ────────────────────────────────────────────────────────────

  const cardTranscript = (
    <Card
      id="card-live-audio"
      title="Live Audio & Diarization"
      icon={Radio}
      iconColor="bg-violet-500/20 text-violet-400"
      glow={waveActive || isListening || isSimulating}
      glowColor={isListening ? "red" : isSimulating ? "amber" : "violet"}
      badge={
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-colors ${
            isListening
              ? "bg-red-500/20 text-red-300 border border-red-500/40"
              : isSimulating
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : waveActive
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
              : "bg-slate-700/60 text-slate-400 border border-slate-600/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isListening
                ? "bg-red-400 animate-ping"
                : isSimulating
                ? "bg-amber-400 animate-pulse"
                : waveActive
                ? "bg-violet-400 animate-pulse"
                : "bg-slate-500"
            }`}
          />
          {isListening ? "MIC REC" : isSimulating ? "SIMULATION" : waveActive ? "LIVE" : "IDLE"}
        </span>
      }
    >
      <div className="mb-4">
        <LiveWaveformCanvas active={waveActive} />
      </div>
      <div className="space-y-2.5 h-56 sm:h-64 md:h-72 overflow-y-auto pr-1.5 custom-scrollbar">
        {transcript.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2">
            <Mic className="w-8 h-8 opacity-30" />
            <p>Start the mic or run a simulation to see live transcripts</p>
          </div>
        )}
        {transcript.map((line) => (
          <div
            key={line.id}
            className="flex gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-all group animate-fade-in-up"
          >
            <div className="shrink-0 mt-0.5">
              <div className="w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center border border-slate-600/40">
                <User className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-semibold ${speakerColor(line.speaker)}`}>
                  {line.speaker}
                </span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-400">{line.role}</span>
                <span className="ml-auto text-xs text-slate-500">{line.timestamp}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {bionicMode ? <BionicText text={line.text} /> : line.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </div>
      {isProcessing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-violet-400 animate-pulse">
          <div className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          Processing with Harmonic AI…
        </div>
      )}
    </Card>
  );

  const cardActions = (
    <Card
      id="card-action-items"
      title="Cognitive Layer / ADHD Focus"
      icon={Brain}
      iconColor="bg-amber-500/20 text-amber-400"
      badge={
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
          {actions.filter((a) => !a.done).length} open
        </span>
      }
    >
      <div className="space-y-2.5 h-64 sm:h-72 md:h-80 overflow-y-auto pr-1.5 custom-scrollbar">
        {actions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2">
            <CheckCircle2 className="w-8 h-8 opacity-30" />
            <p>Action items will appear here</p>
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
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none animate-fade-in-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1526] hover:-translate-y-0.5 ${
              action.done
                ? "bg-slate-800/20 border-slate-700/20 opacity-50 hover:opacity-75"
                : "bg-slate-800/50 border-slate-700/40 hover:border-slate-600/60 hover:shadow-lg shadow-black/20"
            }`}
            onClick={() => toggleAction(action.id)}
            id={`action-item-${action.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {action.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug mb-2 ${
                    action.done ? "line-through text-slate-500" : "text-slate-200 font-medium"
                  }`}
                >
                  {bionicMode && !action.done ? <BionicText text={action.task} /> : action.task}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {action.assignee}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[action.priority]}`}
                  >
                    {action.priority}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {action.due}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const cardHindi = (
    <Card
      id="card-hindi-translation"
      title="Sensory / Multilingual Layer"
      icon={Languages}
      iconColor="bg-pink-500/20 text-pink-400"
      badge={
        <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
          हिन्दी
        </span>
      }
    >
      <div className="h-64 sm:h-72 md:h-80 overflow-y-auto pr-1.5 custom-scrollbar space-y-3">
        {hindiLines.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2">
            <Languages className="w-8 h-8 opacity-30" />
            <p>Hindi captions will appear here in real-time</p>
          </div>
        )}
        {hindiLines.map((line, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-[#1a0f2e]/60 border border-pink-500/20 hover:border-pink-500/40 transition-all animate-fade-in-up"
          >
            <p className="text-base leading-loose text-pink-100 font-medium"
               style={{ fontFamily: "'Noto Sans Devanagari', 'Mangal', serif", fontSize: "1.05rem" }}>
              {line}
            </p>
          </div>
        ))}

        {/* Dynamic Technical Glossary */}
        {jargon.length > 0 && (
          <div className="mt-4 pt-4 border-t border-pink-500/20 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-pink-400/70" />
              <p className="text-xs font-semibold text-pink-400/70 uppercase tracking-widest">
                Detected Technical Glossary
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {jargon.map((j, i) => (
                <span
                  key={i}
                  className="jargon-pill relative cursor-help px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-xs font-medium text-pink-300 hover:bg-pink-500/25 hover:border-pink-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d1526] transition-all animate-pop-in"
                  tabIndex={0}
                >
                  {j.term}
                  <span className="jargon-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 rounded-xl bg-[#0d1526] border border-slate-600/60 shadow-2xl text-xs text-slate-300 leading-relaxed font-normal pointer-events-none z-30">
                    <span className="font-semibold text-pink-300 block mb-1">{j.term}</span>
                    {j.definition}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#0d1526] border-r border-b border-slate-600/60 -mt-1" />
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  const AAC_QUICK_PHRASES = [
    "Understood, on it",
    "Need 5 mins",
    "I agree",
    "Raising a blocker",
  ];

  const cardAAC = (
    <Card
      id="card-aac-voice"
      title="AAC Voice Synthesizer"
      icon={Volume2}
      iconColor="bg-emerald-500/20 text-emerald-400"
      badge={
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
          Sam
        </span>
      }
    >
      <div className="space-y-4 h-64 sm:h-72 md:h-80 flex flex-col">
        <div className="grid grid-cols-2 gap-2">
          {AAC_QUICK_PHRASES.map((phrase) => (
            <button
              key={phrase}
              id={`aac-phrase-${phrase.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => speakAAC(phrase)}
              className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1526] text-emerald-300 text-sm font-medium transition-all text-left leading-tight active:scale-95"
            >
              {phrase}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-2">
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
            placeholder="Type a custom message…"
            className="flex-1 w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1526] transition-colors"
            rows={3}
          />
          <button
            id="aac-speak-btn"
            onClick={handleAacSubmit}
            disabled={!aacInput.trim()}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1526] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Volume2 className="w-4 h-4" />
            Speak into Meeting
          </button>
        </div>
      </div>
    </Card>
  );

  // ────────────────────────────────────────────────────────────
  //  Layout by active tab
  // ────────────────────────────────────────────────────────────

  function renderGrid() {
    if (activeTab === "all") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cardTranscript}
          {cardActions}
          {cardHindi}
          {cardAAC}
        </div>
      );
    }
    if (activeTab === "priya") {
      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-[#1a0f2e]/80 border border-pink-500/30 text-pink-200 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-pink-400 shrink-0" />
            Priya's profile — Sensory/High-Contrast mode. Large Devanagari captions displayed.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {cardHindi}
            {cardTranscript}
          </div>
        </div>
      );
    }
    if (activeTab === "alex") {
      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-center gap-3">
            <Brain className="w-5 h-5 text-amber-400 shrink-0" />
            Alex's profile — ADHD Focus mode. Action items front and centre.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {cardActions}
            {cardTranscript}
          </div>
        </div>
      );
    }
    if (activeTab === "sam") {
      return (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
            Sam's profile — Non-Speaking/AAC Voice mode. Quick-reply panel is primary.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {cardAAC}
            {cardTranscript}
          </div>
        </div>
      );
    }
    return null;
  }

  // ────────────────────────────────────────────────────────────
  //  Render
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

      <div className="min-h-screen bg-[#060d1f] text-white font-sans">
        {/* ── Background decorative gradients ── */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink-600/5 rounded-full blur-3xl" />
        </div>

        {/* ── Header ── */}
        <header className="relative z-10 border-b border-slate-700/40 bg-[#060d1f]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 mr-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
                <Accessibility className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight leading-none">
                  Harmonic
                </h1>
                <p className="text-xs text-slate-400 leading-none mt-1">
                  Adaptive Semantic Middleware
                </p>
              </div>
            </div>

            {/* Live pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
              <span className={`w-2 h-2 rounded-full ${isListening ? "bg-red-400 animate-ping" : "bg-red-500 animate-pulse"}`} />
              <span className="text-xs text-red-300 font-medium hidden xs:inline sm:inline">
                Sprint Planning Call (Live — Ephemeral)
              </span>
              <span className="text-xs text-red-300 font-medium xs:hidden sm:hidden">
                Live
              </span>
            </div>

            {/* Network indicator */}
            <div className="hidden md:flex items-center gap-2">
              {networkOk ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs text-slate-400">
                {networkOk ? "Online" : "Offline fallback"}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mic button */}
              <button
                id="mic-toggle-btn"
                onClick={toggleMic}
                disabled={isSimulating}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060d1f] ${
                  isListening
                    ? "bg-red-500/20 border border-red-500/60 text-red-300 pulse-glow-red"
                    : "bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50 shadow-lg shadow-violet-600/25"
                } disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
                aria-label={isListening ? "Stop microphone" : "Start microphone"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                <span>{isListening ? "Stop Mic" : "Start Mic"}</span>
              </button>

              {/* Simulation button */}
              <button
                id="simulation-btn"
                onClick={runSimulation}
                disabled={isSimulating || isListening}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-medium text-sm transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060d1f] ${
                  isSimulating
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 pulse-glow-amber"
                    : "bg-slate-800/80 border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:text-white"
                } disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
                aria-label="Run 30 second simulation"
              >
                <Zap className={`w-4 h-4 ${isSimulating ? "animate-pulse" : ""}`} />
                <span className="hidden sm:inline">{isSimulating ? "Simulating…" : "Run 30s Simulation"}</span>
                <span className="sm:hidden">{isSimulating ? "Simulating…" : "Simulate"}</span>
              </button>

              {/* Catch Me Up */}
              <button
                id="catch-me-up-btn"
                onClick={() => setShowCatchUp(true)}
                disabled={recaps.length === 0 && notes.length === 0}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-medium text-sm transition-all border bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060d1f] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                aria-label="Open Catch Me Up drawer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Catch Me Up</span>
              </button>

              {/* Bionic Reading */}
              <button
                id="bionic-reading-btn"
                onClick={() => setBionicMode((v) => !v)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-medium text-sm transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060d1f] active:scale-95 ${
                  bionicMode
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "bg-slate-800/80 border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:text-white"
                }`}
                aria-label="Toggle bionic reading mode"
              >
                {bionicMode ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">{bionicMode ? "Bionic On" : "Bionic"}</span>
              </button>

              {/* Settings */}
              <button
                id="settings-btn"
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl border border-slate-600/50 text-slate-400 hover:text-white hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060d1f] transition-all active:scale-95"
                aria-label="Open settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-0 flex gap-1 overflow-x-auto tab-scroll">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#060d1f] rounded-t-lg ${
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-300 bg-violet-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {tab.sub && (
                  <span className="text-xs text-slate-500 hidden md:inline">
                    · {tab.sub}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Simplified notes banner */}
          {notes.length > 0 && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3.5 animate-fade-in-up shadow-lg shadow-indigo-950/20">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <ChevronDown className="w-4 h-4 text-indigo-400 rotate-[-90deg]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-indigo-400 mb-2 uppercase tracking-widest">
                  Simplified Notes
                </p>
                <ul className="space-y-1.5">
                  {notes.slice(-6).map((note, i) => (
                    <li key={i} className="text-sm text-indigo-200 leading-relaxed">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Cards */}
          {renderGrid()}
        </main>

        {/* ── Footer ── */}
        <footer className="relative z-10 border-t border-slate-700/30 mt-8 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <span>Harmonic v0.1 · Real-time Adaptive Accessibility Middleware</span>
            <span>Built with Next.js {/* 16 */} · Powered by Gemini 1.5 Flash</span>
          </div>
        </footer>
      </div>
    </>
  );
}
