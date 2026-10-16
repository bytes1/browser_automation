<div align="center">

# 🎭 Browsevibe · Autonomous Cultural & Browser Workflow Studio

### *Giving Qloo’s Taste AI™ Eyes and Hands on the Live Web*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Qloo Taste AI](https://img.shields.io/badge/Qloo-Taste_AI™_Graph-f43f5e?style=for-the-badge)](https://qloo.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Stagehand v4](https://img.shields.io/badge/Browserbase-Stagehand_v4-8b5cf6?style=for-the-badge)](https://browserbase.com/)
[![Trigger.dev v4](https://img.shields.io/badge/Trigger.dev-Durable_Runtime-10b981?style=for-the-badge)](https://trigger.dev/)
[![Liveblocks](https://img.shields.io/badge/Liveblocks-Multiplayer_Canvas-6366f1?style=for-the-badge)](https://liveblocks.io/)
[![Neon Postgres](https://img.shields.io/badge/Neon-Serverless_Postgres-00e599?style=for-the-badge)](https://neon.tech/)

<p align="center">
  <strong>Built for the <a href="https://qloo.devpost.com/">Qloo LLM & Agentic Hackathon</a></strong><br/>
  <em>A visual, multiplayer AI workflow builder that bridges deterministic cultural taste intelligence with self-healing cloud browser automation.</em>
</p>

</div>

---

## 💡 The Problem & Our Breakthrough

Today’s AI and recommendation systems suffer from **three critical blind spots**:

1. **LLMs Hallucinate Cultural Taste:** Ask a standard LLM for venue or brand recommendations based on *"Radiohead and Haruki Murakami"*, and it falls back to generic tourist clichés without grounded cultural affinity data.
2. **Recommendation APIs Are "Web-Blind":** Qloo’s Taste AI™ knows *which* boutique hotel, vinyl bar, or indie brand matches an audience—but it cannot open a live browser to scrape a prospect’s storefront, verify tonight's reservation availability, or extract current pricing tiers.
3. **The "Last-Mile Action Gap":** Even when users get a great recommendation or market insight, they still have to manually browse websites, synthesize briefs, and send outreach emails every single week.

### ⚡ Enter **Browsevibe**
**Browsevibe** unites **Qloo’s Cultural Taste Graph** (`/search` & `/v2/insights`), **Browserbase + Stagehand v4** self-healing cloud browsers, **Google Gemini** structured synthesis, **Liveblocks** real-time multiplayer collaboration, and **Trigger.dev** durable execution into a single visual node studio.

Better yet, Browsevibe works **bi-directionally**:
- **Taste ➔ Web Action:** Resolve taste seeds in Qloo ➔ Discover cross-domain venues/brands ➔ Dispatch a stealth cloud browser to verify live details ➔ Synthesize & email a VIP brief.
- **Web ➔ Taste Auto-Discovery:** Scrape any live webpage (e.g., a festival lineup, a brand lookbook, or a Wikipedia page) ➔ Automatically resolve extracted entities into Qloo Taste Seeds ➔ Generate cross-domain brand affinities, audience demographics, and executive pitch decks.

---

## 🏗️ End-to-End Architecture

```mermaid
flowchart TB
    subgraph Studio["🎨 Multiplayer Visual Studio (Next.js 16 + React Flow + Liveblocks)"]
        Canvas["Interactive Node Canvas\n(Real-time Cursors, Presence & Auto-Save)"]
        AIBuilder["🤖 AI Agent Builder\n(Live Sync / Draft Diffs / 1-Click Undo / Smart Chips)"]
        Verifier["🔎 Live Qloo Seed Verifier\n(In-Inspector Entity & UUID Preview)"]
        Console["📊 Realtime Execution Console\n(Taste Radar, Cohort Bars & Executive Briefs)"]
    end

    subgraph Runtime["⚙️ Durable Orchestration (Trigger.dev + Neatlogs Telemetry)"]
        Runner["Topological DAG Runner\n(run-workflow task + Cron Scheduler)"]
        Pipe["Dynamic Token Interpolation Engine\n{{ step.entityIds }} · {{ step.topPickName }} · {{ step.data }}"]
    end

    subgraph CulturalAI["🧠 Qloo Taste AI™ + Gemini Synthesis"]
        QSearch["GET /search\nMulti-Seed & Web-Extracted Entity Resolution"]
        QInsights["GET /v2/insights\nCross-Domain Affinity + Explainability + Vibe/Dislike Signals"]
        QCompare["Taste Overlap Engine\nProfile A × Profile B Bridge & Compatibility %"]
        QDemo["Audience Persona Engine\nAge Cohort & Gender Skew Breakdown"]
        Gemini["Gemini 2.5 Structured Synthesizer\nExecutive Briefs, VIP Itineraries & Sponsorship Pitches"]
    end

    subgraph Browser["🌐 Cloud Stealth Browser Fleet (Browserbase + Stagehand v4)"]
        Stagehand["Self-Healing Vision & DOM Agent\n(open-url · act · extract · observe)"]
    end

    subgraph Delivery["📬 Multi-Channel Delivery"]
        Email["Resend & Gmail Transactional Delivery"]
    end

    AIBuilder <-->|Natural Language Graph Edits| Canvas
    Verifier <-->|POST /api/qloo/resolve| QSearch
    Canvas -->|Trigger Run / Cron Schedule| Runner
    Runner --> Pipe
    Pipe <--> QSearch
    Pipe <--> QInsights
    Pipe <--> QCompare
    Pipe <--> QDemo
    Pipe <--> Stagehand
    Pipe <--> Gemini
    Pipe --> Email
    Runner -.->|Realtime Metadata Stream| Console
```

---

## ✨ Standout Features

### 1. 🧠 Deep Qloo Taste AI™ Integration (5 Specialized Cultural Nodes)
- **All 10 Official Qloo Entity Domains Supported:**
  `urn:entity:artist` · `urn:entity:place` · `urn:entity:movie` · `urn:entity:tv_show` · `urn:entity:book` · `urn:entity:brand` · `urn:entity:podcast` · `urn:entity:video_game` · `urn:entity:destination` · `urn:entity:person`
- **Web-to-Taste Auto-Parsing (`qloo-search`):** Accepts both manual comma-separated favorites *and* raw JSON/text scraped directly from an upstream Stagehand `extract` node (`{{ extractNode.data }}`).
- **Explainability, Mood Signals & Negative Filtering (`qloo-recommend` & `qloo-local`):** Queries `/v2/insights` with `feature.explainability=true`, optional **Mood/Vibe signals** (`vibeTags`), and **Exclude/Dislike seeds** (`signal.interests.entities.negative`).
- **Cross-Profile Taste Overlap (`qloo-compare`):** Computes a **Cultural Compatibility % Score** between two different taste profiles (*Person A vs. Person B* or *Brand A vs. Sponsor B*) and surfaces shared "bridge" recommendations.
- **Audience Persona & Demographics (`qloo-demographics`):** Analyzes age cohort distributions (`24_and_younger`, `25_to_29`, `30_to_34`, `35_to_44`, `45_to_54`) and gender skew for any artist, film, or brand.
- **In-Editor Live Qloo Seed Lookup:** Click **"Verify in Qloo"** inside the node inspector to preview resolved Qloo Entity Names, Categories, and UUIDs *before* running the workflow.

---

### 2. 🤖 Conversational AI Agent Builder (With Live Sync & Diff Inspector)
Build and refine entire workflows by chatting in plain English inside the **AI** sidebar tab:
- **Live Sync Mode vs. Draft Mode:** Toggle **Live Sync On** to watch the AI mutate your canvas in real time, or keep **Draft Mode** to inspect proposed changes before applying.
- **Visual Step Diffs & Parameter Inspector:** Every AI draft highlights **`NEW`** and **`EDITED`** steps with expandable key-value inspectors so you can verify URLs, prompts, and `{{ step_N.output }}` bindings.
- **In-Place Node Editing (No Duplicates):** Selecting any node on the canvas displays a **"Target in prompt"** bar in the AI builder and updates existing node IDs and positions in place.
- **1-Click Undo Snapshot:** Revert the canvas to its pre-AI state with a single click (`Undo last AI apply`).
- **Quick AI Action Chips & Smart Follow-Ups:** One-click buttons to *Explain workflow*, *Optimize prompts*, *Add email digest*, or *Switch to schedule*, plus contextual follow-up chips generated after every turn.

---

### 3. 🌐 Self-Healing Cloud Browser Automation (Browserbase + Stagehand v4)
- **Zero Brittle CSS Selectors:** Powered by `@browserbasehq/stagehand` v4 and Gemini 2.5 Flash. Write natural instructions like *"Click the sign-in button"* or *"Extract the top 3 film titles and directors"*.
- **4 Composable Browser Nodes:** `Open URL` (`open-url`), `Act` (`act`), `Extract` (`extract`), and `Observe` (`observe`).
- **Lazy Cloud Provisioning:** Browserbase sessions spin up on-demand only when a workflow step requires browser interaction and automatically clean up on completion.

---

### 4. 📝 AI Cultural & Web Synthesizer Node (`ai-synthesize`)
- Combines deterministic Qloo taste outputs (`{{ qloo.summary }}`, `{{ qloo.topPickReason }}`) with live browser-scraped context (`{{ extract.data }}`).
- Generates structured deliverables in 4 tailored formats:
  - **Executive Cultural Brief** (`brief`)
  - **VIP Concierge Itinerary** (`itinerary`)
  - **Brand Sponsorship Pitch** (`pitch`)
  - **Personalized Outreach Email** (`outreach`)

---

### 5. 📊 Realtime Run Console & Taste Visualizer
- **Live Step Telemetry:** Powered by `@trigger.dev/react-hooks`, watch each node transition from `Pending` ➔ `Running` ➔ `Done` with millisecond timing and Neatlogs observability traces.
- **Interactive `QlooTasteCard` Visualizer:**
  - ⭐ **Top Cultural Match Spotlight** with affinity % badge, explainability rationale, and 1-click copyable browser search query.
  - 💞 **Taste Overlap Compatibility Banner** for `qloo-compare` steps.
  - 👥 **Audience Persona Cohort Bars** for `qloo-demographics` steps.
  - 📈 **Animated Affinity Progress Bars** & domain badges for matched entities, plus instant toggle to **Raw JSON**.
- **Executive Brief Viewer (`SynthesisResultCard`):** Renders structured headlines, bulleted takeaways, full narrative reports, and recommended next actions.

---

### 6. 👥 Multiplayer Collaboration & Flexible Scheduling
- **Real-Time Multiplayer Canvas:** Powered by `@liveblocks/react-flow`—see teammates' live cursors, presence avatars, and graph edits instantaneously.
- **Cron & One-Time Scheduling:** Switch any workflow trigger to **Schedule Trigger** (`once`, `daily`, `weekdays`, `weekly`, `monthly`, or custom 5-field `cron` with timezone support).

---

## 🚀 1-Click Qloo Hackathon Templates

Open the **Toolbar** tab in the right sidebar to load any of the 4 pre-built blueprints onto the canvas:

| Template | Node Pipeline | What It Demonstrates |
| :--- | :--- | :--- |
| 🌐 **Web-to-Taste Auto-Discovery** *(Flagship)* | `Start` ➔ `Open URL (Wikipedia)` ➔ `Stagehand Extract (Creators & Works)` ➔ `Qloo Taste Seeds (Auto-Resolve)` ➔ `Qloo Brand Match` ➔ `AI Sponsorship Pitch Synthesizer` | **Reverse Web-to-Taste Loop:** Autonomous browser scrapes live web entities, resolves them in Qloo, finds aligned brands, and writes a sponsorship pitch. |
| 🍸 **Autonomous Cultural Concierge** | `Start` ➔ `Qloo Taste Seeds` ➔ `Qloo Local Discovery (Tokyo)` ➔ `Open URL (Live Web Verification)` ➔ `Send VIP Email` | **Taste-to-Action Loop:** Multi-domain seeds (*Radiohead, Haruki Murakami*) ➔ hyper-local Tokyo venues ➔ live browser verification ➔ email delivery. |
| 🏷️ **Cross-Domain Taste Scout** | `Start` ➔ `Cinema Aesthetic Seeds` ➔ `Qloo Lifestyle Brand Recommendations` ➔ `Send Brand Affinity Report` | **Cross-Domain Correlation:** Maps film aesthetics (*Wes Anderson, Studio Ghibli*) to fashion & lifestyle brand affinities. |
| 📍 **Local Places Explorer** | `Start` ➔ `Artist Taste Seed` ➔ `Qloo Local Discovery (New York)` | **Rapid Local Curation:** Turns musical taste into explainable dining and nightlife picks. |

---

## 🧩 Complete Node Catalog (12 Nodes)

| Category | Node Label | Registry Key | Key Inputs | Outputs Available for Downstream `{{ }}` Piping |
| :--- | :--- | :--- | :--- | :--- |
| **Trigger** | **Start** | `start` | *None (Manual run)* | — |
| **Trigger** | **Schedule Trigger** | `schedule` | `frequency`, `time`, `weekday`, `monthday`, `dateTime`, `cron`, `timezone` | — |
| **Qloo AI** | **Qloo Taste Seeds** | `qloo-search` | `query` *(names or `{{ extract.data }}`)*, `entityType` | `entityIds`, `primaryEntityId`, `primaryName`, `names`, `entities`, `summary` |
| **Qloo AI** | **Qloo Recommendations** | `qloo-recommend` | `entityIds`, `targetType`, `city`, `vibeTags`, `negativeSeeds`, `limit` | `topPickName`, `topPickReason`, `searchQuery`, `summary`, `names`, `entityIds`, `entities` |
| **Qloo AI** | **Qloo Local Discovery** | `qloo-local` | `entityIds`, `city`, `vibeTags`, `limit` | `topPickName`, `topPickReason`, `searchQuery`, `summary`, `names`, `entityIds`, `entities` |
| **Qloo AI** | **Qloo Taste Overlap** | `qloo-compare` | `firstSeeds` *(Profile A)*, `secondSeeds` *(Profile B)*, `targetType`, `city` | `compatibilityScore`, `topPickName`, `topPickReason`, `entities`, `searchQuery`, `summary` |
| **Qloo AI** | **Qloo Audience Persona** | `qloo-demographics` | `entityIds` *(Brands, artists, or seed IDs)* | `topAgeGroup`, `topGender`, `personaSummary`, `summary` |
| **AI Synthesis** | **AI Cultural Synthesizer** | `ai-synthesize` | `format` *(brief / itinerary / pitch / outreach)*, `instruction`, `contextData` | `headline`, `content`, `actionRecommendation`, `summary` |
| **Browser** | **Open URL** | `open-url` | `url` | `url`, `title` |
| **Browser** | **Act** | `act` | `instruction` *(Natural language browser action)* | `success`, `message`, `url` |
| **Browser** | **Extract** | `extract` | `instruction` *(Natural language data extraction)* | `data` |
| **Browser** | **Observe** | `observe` | `instruction` *(Find interactive elements on page)* | `matches` |
| **Delivery** | **Send Email** | `send-email` | `provider` *(Resend / Gmail)*, `to`, `subject`, `body` | `id` |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend & Routing** | **Next.js 16.3** (App Router, React 19.3) | Server Components, Server Actions, API Routes, and 3D Three.js (`@react-three/fiber`) landing experience |
| **Cultural Intelligence** | **Qloo Taste AI™ API** | `/search` & `/v2/insights` across 10 cultural domains, explainability, demographics, and overlap |
| **LLM & Synthesis** | **Google Gemini API** | `gemini-3.5-flash-lite` (AI Workflow Builder) & `gemini-2.5-flash` (Stagehand Agent + Cultural Synthesizer) |
| **Browser Automation** | **Browserbase + Stagehand v4** | Cloud stealth browsers with vision + DOM natural language `act`, `extract`, and `observe` |
| **Visual Node Editor** | **React Flow (`@xyflow/react`)** | Interactive DAG canvas, custom step nodes, upstream token chips, and smoothstep edges |
| **Multiplayer Sync** | **Liveblocks (`@liveblocks/react-flow`)** | Real-time CRDT graph storage, live cursors, and team presence avatars |
| **Durable Execution** | **Trigger.dev v4 (`@trigger.dev/sdk`)** | Background task execution, cron schedules, and realtime metadata streaming |
| **Database & Auth** | **Neon Serverless Postgres + Drizzle ORM + Clerk** | Multi-organization auth, workflow persistence, and schedule tracking |
| **Email & Telemetry** | **Resend + Nodemailer + Neatlogs** | Transactional email dispatch and structured agent observability |

---

## ⚙️ Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd browser_automation
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root with the following keys:

```env
# Database (Neon Serverless Postgres)
DATABASE_URL="postgresql://user:password@ep-example.region.aws.neon.tech/neondb?sslmode=require"

# Qloo Taste AI™ API
QLOO_API_KEY="your_qloo_hackathon_api_key"
QLOO_BASE_URL="https://hackathon.api.qloo.com"

# Google Gemini API (Powers AI Workflow Builder, Cultural Synthesizer & Stagehand)
GEMINI_API_KEY="AIzaSy..."

# Browserbase & Stagehand (Cloud Stealth Browsers)
BROWSERBASE_API_KEY="bb_live_..."
BROWSERBASE_PROJECT_ID="your_project_id"

# Trigger.dev v4 (Background Workflow Execution & Realtime Streams)
TRIGGER_SECRET_KEY="tr_dev_..."

# Liveblocks (Multiplayer Canvas & Presence)
LIVEBLOCKS_SECRET_KEY="sk_dev_..."
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY="pk_dev_..."

# Clerk (Authentication & Organizations)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Email Delivery (Resend / Optional Gmail SMTP)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Browsevibe <onboarding@resend.dev>"

# Optional Observability
NEATLOGS_API_KEY="nl_..."
```

> **Important:** Make sure `QLOO_API_KEY`, `GEMINI_API_KEY`, `BROWSERBASE_API_KEY`, and `RESEND_API_KEY` are also added to your **Trigger.dev project environment variables** so background worker tasks can access them.

### 3. Push the Database Schema
```bash
npm run db:push
```

### 4. Start the Next.js App & Trigger.dev Worker
Run both processes in separate terminals:

```bash
# Terminal 1: Start Next.js development server
npm run dev
```

```bash
# Terminal 2: Start Trigger.dev local worker
npx trigger.dev@latest dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the 3D landing page, launch the studio, and run your first autonomous cultural workflow!

---

## 📂 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── qloo/resolve/route.ts         # Live in-inspector Qloo entity resolver
│   │   └── workflows/ai-builder/route.ts # Conversational AI workflow generator & editor
│   ├── workflows/[id]/                   # Multiplayer workflow studio route
│   ├── globals.css                       # Design system & landing page styles
│   └── page.tsx                          # Interactive 3D landing page
├── components/
│   ├── landing/                          # Three.js (@react-three/fiber) hero & closing scenes
│   └── ui/                               # shadcn/ui primitives
├── features/workflows/
│   ├── components/
│   │   ├── ai-workflow-builder.tsx       # AI Agent Builder (Live Sync, Diffs, Undo, Chips)
│   │   ├── canvas.tsx                    # React Flow + Liveblocks multiplayer canvas
│   │   ├── right-sidebar.tsx             # Toolbar, Templates, Node Inspector & Qloo Verifier
│   │   ├── step-node.tsx                 # Custom canvas step node component
│   │   └── workflow-console.tsx          # Realtime Run Console, QlooTasteCard & Brief Viewer
│   ├── lib/
│   │   ├── interpolate.ts                # {{ nodeId.outputPath }} runtime token resolver
│   │   ├── schedule.ts                   # Cron pattern builder
│   │   ├── templates.ts                  # Pre-wired Qloo hackathon workflow blueprints
│   │   └── validate-graph.ts             # Pre-flight DAG & cycle validator
│   ├── nodes/
│   │   ├── node-registry.ts              # Declarative manifest for all 12 workflow nodes
│   │   ├── node-executors.ts             # Runtime bindings for each action node
│   │   ├── qloo.ts                       # Qloo API client (Search, Insights, Overlap, Persona)
│   │   ├── ai-synthesize.ts              # Gemini structured cultural & web brief synthesizer
│   │   ├── open-url.ts / act.ts / ...    # Stagehand v4 browser automation actions
│   │   └── send-email.ts                 # Resend & Gmail delivery node
│   └── tasks/
│       └── run-workflow.ts               # Trigger.dev durable DAG runner & metadata streamer
└── lib/db/
    └── schema.ts                         # Drizzle ORM PostgreSQL schema
```

---

<div align="center">
  Built with ❤️ for the <strong>Qloo Hackathon</strong> · <strong>Browsevibe</strong> — <em>Browser work, in a better flow.</em>
</div>
