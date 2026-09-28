import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

// ── Exported interfaces ────────────────────────────────────────

export interface JargonTerm {
  term: string;
  definition: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  due: string;
  completed?: boolean;
}

export interface HarmonizerResponse {
  transcript: string;
  hindiTranslation: string;
  actions: ActionItem[];
  simplifiedNotes: string[];
  jargon: JargonTerm[];
  summaryRecap: string;
}

// ── Local jargon dictionary ────────────────────────────────────

const JARGON_DICTIONARY: Record<string, string> = {
  api: "Application Programming Interface — a contract for software communication.",
  db: "Database — structured storage for persistent data.",
  esp32: "A low-cost Wi-Fi/Bluetooth microcontroller by Espressif.",
  indexing: "Creating data structures to speed up database queries.",
  "load test": "Simulating high traffic to validate system performance under stress.",
  ci: "Continuous Integration — automated build/test on every commit.",
  cd: "Continuous Deployment — automated release after passing CI.",
  "ci/cd": "Continuous Integration & Deployment pipeline.",
  crud: "Create, Read, Update, Delete — basic data operations.",
  orm: "Object-Relational Mapping — code-layer abstraction over SQL.",
  sdk: "Software Development Kit — bundled tools/libraries for a platform.",
  rest: "Representational State Transfer — an HTTP API design style.",
  graphql: "A query language for APIs allowing clients to request specific data.",
  jwt: "JSON Web Token — a compact, signed token for authentication.",
  oauth: "Open Authorization — a delegated access protocol.",
  webhook: "An HTTP callback triggered by an event in another system.",
  docker: "A containerization platform for portable deployments.",
  k8s: "Kubernetes — an orchestrator for containerized workloads.",
  redis: "An in-memory key-value store used for caching and pub/sub.",
  migration: "A versioned change to a database schema.",
  websocket: "A persistent, full-duplex communication channel over TCP.",
  deploy: "Release software to a production or staging environment.",
  backend: "The server-side layer handling business logic and data.",
  frontend: "The client-side layer users interact with directly.",
};

function detectJargonLocally(text: string): JargonTerm[] {
  const found: JargonTerm[] = [];
  const seen = new Set<string>();
  const lower = text.toLowerCase();

  for (const [term, definition] of Object.entries(JARGON_DICTIONARY)) {
    const escaped = term.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "i");
    if (pattern.test(lower) && !seen.has(term)) {
      seen.add(term);
      found.push({ term: term.toUpperCase(), definition });
    }
  }
  return found;
}

// ── Local fallback logic ───────────────────────────────────────

function detectPriority(text: string): "High" | "Medium" | "Low" {
  if (/(urgent|immediately|asap|critical|must|blocker)/i.test(text)) return "High";
  if (/(please|should|need to|verify|check)/i.test(text)) return "Medium";
  return "Low";
}

function extractActionsLocally(rawText: string, speaker: string): ActionItem[] {
  const actions: ActionItem[] = [];
  const sentences = rawText.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  for (const sentence of sentences) {
    const hasVerb =
      /(run|push|verify|check|deploy|send|review|schedule|move|update|fix|complete|test|prepare|ensure|validate)/i.test(
        sentence
      );
    if (!hasVerb) continue;

    const assigneeMatch =
      sentence.match(/\b([A-Z][a-z]+),?\s+(?:please\s+)?(?:run|push|verify|check|deploy|send|review|schedule|move|update|fix|complete|test|prepare|ensure|validate)/i) ||
      sentence.match(/(?:^|\s)([A-Z][a-z]+)\s+(?:to\s+)?(?:run|will|should|must|please)/i);

    const assignee = assigneeMatch ? assigneeMatch[1] : speaker || "Team";
    const priority = detectPriority(sentence);
    const dueMatch = sentence.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
    const due = dueMatch ? dueMatch[0] : "TBD";

    actions.push({
      id: `act_${randomUUID().slice(0, 8)}`,
      task: sentence.trim(),
      assignee,
      priority,
      due,
      completed: false,
    });
  }

  return actions.slice(0, 5);
}

function simplifyLocally(rawText: string): string[] {
  return rawText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .map((s) => `• ${s}`)
    .slice(0, 6);
}

function generateRecapLocally(rawText: string): string {
  const first = rawText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .find((s) => s.length > 15);
  return first
    ? `Key point: ${first}.`
    : "No clear recap could be extracted from this segment.";
}

const HINDI_COMMON: Record<string, string> = {
  team: "टीम",
  backend: "बैकेंड",
  api: "एपीआई",
  deploy: "डिप्लॉय",
  release: "रिलीज़",
  monday: "सोमवार",
  testing: "परीक्षण",
  database: "डेटाबेस",
  migration: "माइग्रेशन",
  meeting: "बैठक",
  update: "अपडेट",
  please: "कृपया",
  the: "यह",
  and: "और",
  to: "को",
  is: "है",
  are: "हैं",
  we: "हम",
  need: "जरूरत",
  run: "चलाएं",
  push: "पुश",
  load: "लोड",
};

function translateToHindiFallback(text: string): string {
  const words = text.split(/\s+/);
  const translated = words.map((w) => {
    const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
    return HINDI_COMMON[clean] ?? w;
  });
  return translated.join(" ") + " (स्थानीय अनुवाद)";
}

// ── Gemini helper ──────────────────────────────────────────────

async function callGemini(
  rawText: string,
  speaker: string,
  apiKey: string
): Promise<HarmonizerResponse> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are "Harmonic", an accessibility-first meeting middleware. Given spoken text from a meeting, extract structured data.

Speaker: ${speaker}
Raw text: "${rawText}"

Return ONLY valid JSON (no markdown fences, no extra text) matching this exact schema:

{
  "transcript": "<the original text, cleaned of filler words but otherwise verbatim>",
  "hindiTranslation": "<natural, fluent Hindi translation in Devanagari script. Preserve Hinglish terms (e.g. 'deploy', 'API') transliterated into Devanagari where appropriate. Do NOT produce a word-by-word substitution.>",
  "actions": [
    {
      "id": "<unique short ID, e.g. act_a1b2c3>",
      "task": "<clear, concise action item>",
      "assignee": "<person's name or 'Team'>",
      "priority": "High" | "Medium" | "Low",
      "due": "<deadline extracted from text, or 'TBD'>",
      "completed": false
    }
  ],
  "simplifiedNotes": ["<1-2 bullet takeaways, ultra-concise, optimized for ADHD/cognitive focus>"],
  "jargon": [
    { "term": "<technical term, acronym, or tech-stack item detected>", "definition": "<concise 1-sentence definition>" }
  ],
  "summaryRecap": "<exactly 1 sentence — a high-density executive recap of the entire segment>"
}

Rules:
- transcript: preserve meaning, remove only filler words (um, uh, like).
- hindiTranslation: must be fluent Devanagari Hindi, NOT a word-by-word dictionary swap. Transliterate tech terms (API → एपीआई, deploy → डिप्लॉय).
- actions: extract every concrete to-do; generate a unique ID for each; infer priority from urgency language; omit array if none found.
- simplifiedNotes: 1–2 short, plain-language bullet summaries (no bullet prefix characters). Designed for quick scanning.
- jargon: detect technical terms, acronyms, framework names, and tech-stack items. Provide a concise definition for each. Return empty array if none.
- summaryRecap: a single sentence capturing the core outcome or decision.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as HarmonizerResponse;

  // Ensure every action has an ID (guard against Gemini omitting them)
  for (const action of parsed.actions) {
    if (!action.id) {
      action.id = `act_${randomUUID().slice(0, 8)}`;
    }
  }

  return parsed;
}

// ── Route handler ──────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  let rawText = "";
  let speaker = "Unknown";

  try {
    const body = await request.json();
    rawText = (body.rawText ?? "").toString().trim();
    speaker = (body.speaker ?? "Unknown").toString().trim();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!rawText) {
    return Response.json({ error: "rawText is required" }, { status: 400 });
  }

  const apiKey =
    request.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const data = await callGemini(rawText, speaker, apiKey);
      return Response.json(data);
    } catch (err) {
      console.warn("[Harmonic] Gemini call failed, using local fallback:", err);
    }
  }

  const fallback: HarmonizerResponse = {
    transcript: rawText,
    hindiTranslation: translateToHindiFallback(rawText),
    actions: extractActionsLocally(rawText, speaker),
    simplifiedNotes: simplifyLocally(rawText),
    jargon: detectJargonLocally(rawText),
    summaryRecap: generateRecapLocally(rawText),
  };

  return Response.json(fallback);
}
