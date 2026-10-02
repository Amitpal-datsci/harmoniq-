import type { NextRequest } from "next/server";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface TranscriptTurnInput {
  speaker: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface SummaryActionItem {
  task: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  due: string;
}

export interface MeetingSummary {
  generatedAt: string;
  executiveOverview: string;
  keyDecisions: string[];
  actionItems: SummaryActionItem[];
  speakerParticipation: Record<string, number>; // speaker → turn count
}

// ── Local fallback ────────────────────────────────────────────────────────────

function detectPriority(text: string): "High" | "Medium" | "Low" {
  if (/(urgent|asap|critical|must|blocker|immediately)/i.test(text)) return "High";
  if (/(please|should|need to|verify|check|review)/i.test(text)) return "Medium";
  return "Low";
}

function localSummarize(turns: TranscriptTurnInput[]): MeetingSummary {
  const fullText = turns.map((t) => `${t.speaker}: ${t.text}`).join("\n");
  const sentences = fullText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  // Executive overview — join first 3 meaningful sentences
  const overview =
    sentences.slice(0, 3).join(". ").trim() ||
    "Meeting transcript processed. No clear executive summary could be extracted automatically.";

  // Key decisions — sentences containing decision-like language
  const decisionKeywords =
    /(decided|agreed|confirmed|approved|scheduled|rescheduled|postponed|go.no.go|resolved|committed)/i;
  const keyDecisions = sentences
    .filter((s) => decisionKeywords.test(s))
    .slice(0, 5)
    .map((s) => s.replace(/^[^:]+:\s*/, "").trim());

  // Action items — sentences containing action verbs
  const actionVerbs =
    /(run|push|verify|check|deploy|send|review|schedule|update|fix|test|prepare|ensure|validate|isolate|confirm|flag)/i;
  const actionItems: SummaryActionItem[] = sentences
    .filter((s) => actionVerbs.test(s))
    .slice(0, 6)
    .map((s) => {
      const speakerMatch = s.match(/^([A-Z][a-z]+):/);
      const assignee = speakerMatch ? speakerMatch[1] : "Team";
      const task = s.replace(/^[^:]+:\s*/, "").trim();
      const dueMatch = s.match(
        /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i
      );
      return {
        task,
        assignee,
        priority: detectPriority(s),
        due: dueMatch ? dueMatch[0] : "TBD",
      };
    });

  // Speaker participation counts
  const speakerParticipation: Record<string, number> = {};
  for (const turn of turns) {
    speakerParticipation[turn.speaker] =
      (speakerParticipation[turn.speaker] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    executiveOverview: overview + ".",
    keyDecisions:
      keyDecisions.length > 0
        ? keyDecisions
        : ["No explicit decisions detected. Review transcript for context."],
    actionItems,
    speakerParticipation,
  };
}

// ── Gemini call ───────────────────────────────────────────────────────────────

async function geminiSummarize(
  turns: TranscriptTurnInput[],
  apiKey: string
): Promise<MeetingSummary> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const transcriptBlock = turns
    .map((t) => `[${t.timestamp}] ${t.speaker} (${t.role}): ${t.text}`)
    .join("\n");

  const prompt = `You are "Harmonic Summarizer", a precision meeting intelligence engine.

Analyze the following multi-speaker meeting transcript and return ONLY valid JSON (no markdown fences, no extra text) matching this exact schema:

{
  "executiveOverview": "<2-3 sentence high-density executive summary of the entire meeting. Focus on purpose, outcomes, and critical blockers.>",
  "keyDecisions": [
    "<each confirmed decision, agreement, or scheduling action — one per entry. Max 6 entries.>"
  ],
  "actionItems": [
    {
      "task": "<clear, unambiguous action statement>",
      "assignee": "<name of person responsible, or 'Team'>",
      "priority": "High" | "Medium" | "Low",
      "due": "<deadline from transcript, or 'TBD'>"
    }
  ],
  "speakerParticipation": {
    "<speaker name>": <number of turns they spoke>
  }
}

Rules:
- executiveOverview: must capture the meeting's primary goal, key outcome, and any critical risk or blocker. Be assertive and data-dense. No generic filler.
- keyDecisions: extract only confirmed or agreed items, not open questions. Max 6.
- actionItems: every concrete to-do with a named owner. Infer priority from urgency language. Omit array if none found.
- speakerParticipation: count turns per speaker from the transcript.
- Return the current timestamp in "generatedAt" as an ISO 8601 string.

TRANSCRIPT:
${transcriptBlock}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as Omit<MeetingSummary, "generatedAt">;

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  let turns: TranscriptTurnInput[] = [];

  try {
    const body = await request.json();
    if (!Array.isArray(body.turns) || body.turns.length === 0) {
      return Response.json(
        { error: "turns[] is required and must be non-empty." },
        { status: 400 }
      );
    }
    turns = body.turns as TranscriptTurnInput[];
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const apiKey =
    request.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const summary = await geminiSummarize(turns, apiKey);
      return Response.json({ summary });
    } catch (err) {
      console.warn("[Harmonic/summarize] Gemini call failed, using fallback:", err);
    }
  }

  // Local deterministic fallback
  const summary = localSummarize(turns);
  return Response.json({ summary });
}
