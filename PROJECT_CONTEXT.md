# Harmonic — Project Context & Architectural Documentation

Harmonic is an **Adaptive Semantic Middleware** designed to make real-time meetings universally accessible for neurodiverse, multilingual, and non-speaking team members. It transforms fast-paced spoken discourse into personalized, multi-modal cognitive representations.

---

## 1. System Architecture

```
                                  ┌───────────────────────────────┐
                                  │   Meeting Audio / Speech      │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │   Browser Web Speech API / Ephemeral Audio Stream│
                        └─────────────────────────┬────────────────────────┘
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │  Harmonic Middleware Client (app/page.tsx)       │
                        │  - Diarization & Waveform Canvas                 │
                        │  - Bionic Reading Processor                      │
                        │  - Profile Views (Priya, Alex, Sam, Unified)     │
                        └─────────────────────────┬────────────────────────┘
                                                  │ POST /api/harmonize
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │  Next.js Edge/Node Route (app/api/harmonize)     │
                        │  - Dynamic API Key Resolution (Header / ENV)     │
                        └──────────┬────────────────────────────┬──────────┘
                                   │ (Key Available)            │ (Offline / No Key)
                                   ▼                            ▼
        ┌────────────────────────────────────┐    ┌──────────────────────────────────┐
        │  Google Gemini 1.5 Flash           │    │  Deterministic Fallback Engine   │
        │  - Structured JSON Output Schema   │    │  - Regex Action Extraction       │
        │  - Hinglish-aware Hindi Translation│    │  - Local Technical Glossary      │
        │  - Executive Single-Sentence Recap │    │  - Rule-based Cognitive Notes    │
        └──────────────────┬─────────────────┘    └────────────────┬─────────────────┘
                           │                                       │
                           └───────────────────┬───────────────────┘
                                               ▼
                        ┌──────────────────────────────────────────────────┐
                        │  HarmonizerResponse Payload                      │
                        │  - transcript (Cleaned verbatim)                 │
                        │  - hindiTranslation (Devanagari script)          │
                        │  - actions (Tasks, assignees, priorities, due)   │
                        │  - simplifiedNotes (ADHD-optimized bullets)      │
                        │  - jargon (Technical terms & definitions)        │
                        │  - summaryRecap (Single-sentence executive recap)│
                        └──────────────────────────────────────────────────┘
```

### 1.1 Frontend Architecture (`app/page.tsx`)
- **Framework**: Next.js (App Router), React 19, TypeScript.
- **Styling**: TailwindCSS v4 with centralized design tokens and CSS `@keyframes` in `app/globals.css`.
- **Core Views / Persona Grid**:
  - **Unified Grid (`all`)**: 4-pane layout containing Live Audio, ADHD Cognitive Layer, Hindi Multilingual Layer, and AAC Synthesizer.
  - **Priya (`priya`)**: High-contrast, sensory-friendly Devanagari Hindi captions + live technical glossary.
  - **Alex (`alex`)**: ADHD-optimized action items front-and-center, with priority badges and Bionic reading.
  - **Sam (`sam`)**: AAC Voice quick-phrases and custom speech synthesis panel with Web Speech integration.
- **Bionic Reading Engine (`BionicText`)**: Inline word splitter that calculates midpoint `Math.ceil(len / 2)` and applies bold weight to initial characters to reduce cognitive fatigue.
- **Catch Me Up Drawer (`CatchMeUpDrawer`)**: Slide-over glassmorphic modal aggregating single-sentence recaps into a chronological milestone timeline.

### 1.2 Backend Architecture (`app/api/harmonize/route.ts`)
- **Runtime**: Next.js Serverless Route Handler (`POST`).
- **AI Model**: `gemini-1.5-flash` via `@google/generative-ai`.
- **System Prompting Strategy**: Zero-shot strict JSON generation with strict validation against `HarmonizerResponse`.
- **Local Fallback Engine**: Pure JavaScript heuristic parser ensuring full application functionality even without network access or API credentials.

---

## 2. Data Models & Schemas

### 2.1 TypeScript Interfaces

```typescript
// Technical glossary entry
export interface JargonTerm {
  term: string;        // e.g., "API", "CI/CD", "INDEXING"
  definition: string;  // Plain-language, 1-sentence definition
}

// Action item / task representation
export interface ActionItem {
  id: string;                                // Unique identifier (act_xxxx or uid)
  task: string;                              // Concrete task description
  assignee: string;                          // Extracted name or "Team"
  priority: "High" | "Medium" | "Low";      // Inferred urgency
  due: string;                               // Extracted deadline or "TBD"
  completed?: boolean;                       // Backend state
  done?: boolean;                            // Frontend interactive toggle state
}

// Live transcript segment
export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  role: string;
}

// API contract between client and /api/harmonize
export interface HarmonizerResponse {
  transcript: string;
  hindiTranslation: string;
  actions: ActionItem[];
  simplifiedNotes: string[];
  jargon: JargonTerm[];
  summaryRecap: string;
}
```

### 2.2 Client-Side In-Memory State Model

| State Key | Type | Default | Purpose |
|---|---|---|---|
| `transcript` | `TranscriptLine[]` | `[]` | Sequential record of spoken sentences |
| `actions` | `ActionItem[]` | `[]` | Parsed to-dos with toggleable status |
| `hindiLines` | `string[]` | `[]` | Devanagari captions with speaker attribution |
| `notes` | `string[]` | `[]` | Simplified takeaway bullets |
| `jargon` | `JargonTerm[]` | `[]` | Deduplicated technical vocabulary |
| `recaps` | `string[]` | `[]` | Accumulated executive summary timeline |
| `bionicMode` | `boolean` | `false` | Bionic reading toggle state |
| `showCatchUp` | `boolean` | `false` | Executive drawer open/close state |
| `activeTab` | `string` | `"all"` | Active accessibility persona tab |
| `isListening` | `boolean` | `false` | Web Speech microphone active flag |
| `isSimulating` | `boolean` | `false` | 30s offline simulation running flag |
| `apiKey` | `string` | `""` | User-provided session Gemini API key |

---

## 3. API Specification

### `POST /api/harmonize`

Processes raw spoken text, cleans fillers, generates translations, extracts action items, identifies technical jargon, and provides summaries.

#### Headers
| Header | Required | Description |
|---|---|---|
| `Content-Type` | Yes | `application/json` |
| `x-gemini-key` | Optional | Custom user-supplied Gemini API key overriding `process.env.GEMINI_API_KEY` |

#### Request Body
```json
{
  "rawText": "Rahul, please run the load tests and verify database indexing before Monday.",
  "speaker": "Ananya"
}
```

#### Response Body (`200 OK`)
```json
{
  "transcript": "Rahul, please run the load tests and verify database indexing before Monday.",
  "hindiTranslation": "राहुल, कृपया सोमवार से पहले लोड परीक्षण चलाएं और डेटाबेस इंडेक्सिंग सत्यापित करें।",
  "actions": [
    {
      "id": "act_8f21bc9e",
      "task": "Run load tests and verify database indexing",
      "assignee": "Rahul",
      "priority": "High",
      "due": "Monday",
      "completed": false
    }
  ],
  "simplifiedNotes": [
    "Run load tests prior to Monday",
    "Verify database indexes before deploy"
  ],
  "jargon": [
    {
      "term": "LOAD TEST",
      "definition": "Simulating high traffic to validate system performance under stress."
    },
    {
      "term": "INDEXING",
      "definition": "Creating data structures to speed up database queries."
    }
  ],
  "summaryRecap": "Rahul was tasked with running load tests and validating database indexes ahead of Monday's release."
}
```

---

## 4. Key Architectural Decisions & Rationale (ADRs)

1. **Zero Data Persistence & Privacy-First Session Model**:
   - *Decision*: Harmonic does not persist meeting audio or text transcripts to a database; API keys and notes live strictly in volatile memory.
   - *Rationale*: Meeting data often contains sensitive corporate IP, client information, and PII. Ephemeral processing complies with strict enterprise data boundaries.

2. **Deterministic Offline Simulation Engine**:
   - *Decision*: Built a high-fidelity 30-second simulation mode with pre-baked multi-speaker turns, jargon definitions, and recaps.
   - *Rationale*: Allows instant demonstration, end-to-end testing, and evaluation in zero-connectivity or air-gapped demo environments.

3. **Pure CSS Hover/Focus Glossary Tooltip Architecture**:
   - *Decision*: Implemented `.jargon-pill` and `.jargon-tooltip` with CSS visibility, opacity, and transform transitions without third-party popover libraries.
   - *Rationale*: Guarantees zero runtime performance overhead, eliminates bundle bloat, and provides instant responsiveness even under continuous DOM updates.

4. **Dynamic API Key Header Passthrough (`x-gemini-key`)**:
   - *Decision*: Route handler checks `request.headers.get("x-gemini-key")` before falling back to `process.env.GEMINI_API_KEY`.
   - *Rationale*: Enables users to test their own Gemini quotas without modifying server configuration or committing secrets.

5. **Universal Keyboard Accessibility (WCAG AAA Standards)**:
   - *Decision*: Added explicit `:focus-visible` ring outlines, keyboard event listeners (`Enter` / `Space` toggling on action items), and screen-reader `aria-label` attributes.
   - *Rationale*: Essential for an accessibility-first product intended for motor-impaired and keyboard-only users.

---

## 5. Bugs Encountered & Resolutions

| Issue | Root Cause | Resolution |
|---|---|---|
| **TypeScript `SpeechRecognition` Missing** | Web Speech API types are not part of default TypeScript `lib.dom.d.ts`. | Created a clean type shim interface (`SpeechRecognitionInstance`, `SpeechRecognitionEvent`) in `app/page.tsx`. |
| **User Key Ignored in Backend** | Route only checked `process.env.GEMINI_API_KEY`. | Added header check `request.headers.get("x-gemini-key") \|\| process.env.GEMINI_API_KEY`. |
| **Jargon Term Duplication** | Multiple sentences containing the same technical term caused duplicate pills. | Implemented `Set`-based term deduplication during state accumulation. |
| **Action Checkbox Key Mismatch** | Local simulation IDs collided with Gemini-generated IDs. | Normalized all IDs using `act_[uuid]` or client `uid()`, mapping backend `completed` to frontend `done`. |
| **Scrollbar Jumpiness on Mobile** | Fixed pixel heights forced parent viewport expansion. | Converted card heights to responsive clamp utilities (`h-56 sm:h-64 md:h-72`) with momentum scrolling (`-webkit-overflow-scrolling: touch`). |

---

## 6. Module 3: Future Architectural Roadmap

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MODULE 3 ROADMAP                                         │
├─────────────────────────┬───────────────────────────────┬────────────────────────────────┤
│ Phase 3.1: Voice Stream │ Phase 3.2: Cross-Meeting RAG  │ Phase 3.3: Integrations & Hub  │
├─────────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ • WebRTC Live Streaming │ • Vector Embeddings (Chroma)  │ • Jira / Linear Sync Webhooks  │
│ • Speaker Diarization   │ • Long-term Decision Memory   │ • Slack / Teams Daily Digest   │
│ • ESP32 Hardware Bridge │ • Multilingual Auto-Detect    │ • Notion Meeting Notes Export  │
│ • Sub-200ms Latency     │ • Sentiment & Pace Monitoring │ • Offline Edge WASM Model      │
└─────────────────────────┴───────────────────────────────┴────────────────────────────────┘
```

### Planned Features:
1. **Real-time WebRTC Audio Pipeline & Biometric Diarization**:
   - Stream live PCM audio over WebSockets/WebRTC instead of client-side browser speech chunking.
   - Integrate deep acoustic embeddings to automatically distinguish overlapping speakers with high confidence.
2. **Persistent Vector Memory & Cross-Meeting Context (RAG)**:
   - Optional local vector database (`pgvector` / `ChromaDB`) to index past decisions, unresolved blockers, and recurring jargon across multiple meetings.
3. **Multi-Language Expansion**:
   - Extend Devanagari Hindi capabilities to support Tamil, Telugu, Kannada, Bengali, Marathi, Spanish, and Japanese with automatic language detection.
4. **Hardware Middleware Integration (ESP32 / Wearables)**:
   - Firmware integration allowing dedicated table microphones (ESP32-S3 + I2S microphone array) to stream directly into the Harmonic processing pipeline.
5. **Ecosystem Integrations & Automated Workflow Triggers**:
   - One-click export of verified Action Items directly into Jira, Linear, GitHub Issues, and Notion databases.
