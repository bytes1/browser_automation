<div align="center">

# 🌐 Browsevibe · AI Browser & Cultural Workflow Studio

### *Create visual workflows for browser automation and cultural research*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Stagehand v4](https://img.shields.io/badge/Browserbase-Stagehand_v4-8b5cf6?style=for-the-badge)](https://browserbase.com/)
[![Qloo Taste AI](https://img.shields.io/badge/Qloo-Taste_AI™_Graph-f43f5e?style=for-the-badge)](https://qloo.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Trigger.dev v4](https://img.shields.io/badge/Trigger.dev-Durable_Runtime-10b981?style=for-the-badge)](https://trigger.dev/)
[![Liveblocks](https://img.shields.io/badge/Liveblocks-Multiplayer_Canvas-6366f1?style=for-the-badge)](https://liveblocks.io/)

<p align="center">
  <em>A visual AI workflow studio for browser automation, cultural research, and collaborative execution.</em>
</p>

</div>

---

## 💡 The Problem & Our Breakthrough

Building multi-step browser automations and market/cultural research pipelines has always suffered from **four friction points**:

1. **Slow, Click-Heavy Node Wiring:** Traditional workflow builders force users to click through dozens of nested menus, type repetitive prompts into tiny inspector boxes, and manually wire `{{ step_1.output }}` tokens.
2. **Brittle Web Scrapers:** Legacy browser automation breaks the moment a website changes a CSS selector (`div > span:nth-child(4)`).
3. **LLMs Hallucinate Cultural & Audience Taste:** Standard LLMs guess generic clichés when asked for venue, brand, or audience recommendations instead of grounding answers in real affinity data.
4. **Web-Blind Recommendation Engines:** Cultural APIs know *which* boutique venue or brand matches an audience, but cannot open a live browser to verify availability, scrape a storefront, or send a synthesized brief.

### ⚡ Enter **Browsevibe**
**Browsevibe** combines visual workflow building, **Browserbase + Stagehand v4** cloud browsers, **Qloo’s Cultural Taste Graph** (`/search` & `/v2/insights`), **Google Gemini** synthesis, **Liveblocks** collaboration, and **Trigger.dev** execution:

- **🧩 Natural-Language Workflow Editing:** Describe a workflow or an edit in the canvas assistant and apply the generated steps to your workflow.
- **🧭 Taste ➔ Live Web Action:** Resolve cultural taste seeds ➔ discover cross-domain venues or brands ➔ dispatch a stealth cloud browser to verify live details (with **Live Browser Stream & Session Replay** inside the console) ➔ synthesize & email a VIP brief.
- **🌐 Live Web ➔ Taste Auto-Discovery:** Scrape any live webpage (e.g., a festival lineup, roster, or Wikipedia page) ➔ automatically resolve extracted entities into cultural taste seeds ➔ generate cross-domain brand affinities, audience demographics, and executive pitch decks.

---

## 🏗️ End-to-End Architecture

```mermaid
flowchart TB
    subgraph Input["🧩 Workflow Input"]
        VoiceBar["Natural-Language Workflow Editor"]
        VibeParser["Vibe Input Parser\n(Seeds, City, Vibe Tags & Exclusions)"]
        SpokenTokens["Connection Token Suggestions\n({{ nodeId.entityIds }})"]
    end

    subgraph Studio["🎨 Multiplayer Visual Studio (Next.js 16 + React Flow + Liveblocks)"]
        Canvas["Interactive Node Canvas\n(Real-time Cursors, Presence & Auto-Save)"]
        AIBuilder["🤖 AI Agent Builder\n(Live Sync / Draft Diffs / 1-Click Undo / Smart Chips)"]
        Verifier["🔎 Live Seed Verifier\n(In-Inspector Entity & UUID Preview)"]
        Console["📊 Realtime Execution Console\n(Live Cloud Browser View, Radial Taste Constellation & Briefs)"]
    end

    subgraph Runtime["⚙️ Durable Orchestration (Trigger.dev + Neatlogs Telemetry)"]
        Runner["Topological DAG Runner\n(run-workflow task + Cron Scheduler)"]
        Pipe["Dynamic Token Interpolation Engine\n{{ step.entityIds }} · {{ step.topPickName }} · {{ step.data }}"]
    end

    subgraph Engines["🌐 Cloud Stealth Browsers + 🧠 Cultural & Gemini AI"]
        Stagehand["Browserbase + Stagehand v4\n(open-url · act · extract · observe + Live Debugger Stream)"]
        Qloo["Qloo Taste AI™ Graph\n(/search · /v2/insights · Taste Overlap · Audience Persona)"]
        Gemini["Google Gemini Structured Synthesizer\n(Executive Briefs, VIP Itineraries & Sponsorship Pitches)"]
        Email["Resend & Gmail Transactional Delivery"]
    end

    VoiceBar -->|Workflow Edits| Canvas
    VibeParser -->|Fill Node Fields| Canvas
    SpokenTokens -->|Token Insertion| Canvas
    AIBuilder <-->|Natural Language Graph Edits| Canvas
    Verifier <-->|POST /api/qloo/resolve| Qloo
    Canvas -->|Trigger Run / Cron Schedule| Runner
    Runner --> Pipe
    Pipe <--> Stagehand
    Pipe <--> Qloo
    Pipe <--> Gemini
    Pipe --> Email
    Runner -.->|Realtime Metadata + Browser Session Stream| Console
```

---

## ✨ Standout Features

### 1. 🧩 Natural-Language Workflow Editing
- Describe a workflow or an edit in the canvas assistant. You can also use voice dictation with your preferred input tool.
- **One-Shot Vibe Input** on cultural nodes:
  - Enter one natural sentence instead of filling five separate inputs:
    > *"Find cozy vinyl bars in Tokyo for fans of Radiohead and Haruki Murakami, avoid tourist traps"*
  - Automatically parses and populates **Seeds** (`Radiohead, Haruki Murakami`), **Category** (`urn:entity:place`), **City** (`Tokyo`), **Vibe Tags** (`cozy, vinyl`), and **Exclude Seeds** (`tourist traps`).
- **Connection Tokens:** Insert upstream outputs such as entity IDs, top pick names, extracted data, or summaries into downstream node fields using `{{ <nodeId>.<outputPath> }}`.

---

### 2. 🌐 Self-Healing Cloud Browser Automation + Live Browser View (Browserbase + Stagehand v4)
- **Zero Brittle CSS Selectors:** Powered by `@browserbasehq/stagehand` v4. Write natural instructions like *"Click the sign-in button"* or *"Extract the top 3 film titles and directors"*.
- **4 Composable Browser Nodes:** `Open URL` (`open-url`), `Act` (`act`), `Extract` (`extract`), and `Observe` (`observe`).
- **Live Cloud Browser View & Session Replay inside the Run Console:**
  - Watch the remote Browserbase stealth browser navigate, click, and extract in a live interactive iframe right inside the Run Console ([workflow-console.tsx](file:///e:/frontend/codebase/browser_automation/features/workflows/components/workflow-console.tsx)), or click the pulsing **`LIVE VIEW`** badge on any running browser node on the canvas.

---

### 3. 🧠 Deep Cultural Taste AI Integration & Interactive Taste Constellation
- **All 10 Official Entity Domains Supported:**
  `urn:entity:artist` · `urn:entity:place` · `urn:entity:movie` · `urn:entity:tv_show` · `urn:entity:book` · `urn:entity:brand` · `urn:entity:podcast` · `urn:entity:video_game` · `urn:entity:destination` · `urn:entity:person`
- **Web-to-Taste Auto-Parsing (`qloo-search`):** Accepts both manual favorites *and* raw JSON/text scraped directly from an upstream Stagehand `extract` node (`{{ extractNode.data }}`).
- **Explainability, Mood Signals & Negative Filtering (`qloo-recommend` & `qloo-local`):** Queries `/v2/insights` with `feature.explainability=true`, optional **Mood/Vibe signals** (`vibeTags`), and **Exclude/Dislike seeds** (`signal.interests.entities.negative`).
- **Cross-Profile Taste Overlap (`qloo-compare`):** Computes a **Cultural Compatibility % Score** between two taste profiles (*Profile A × Profile B*) and surfaces shared "bridge" recommendations.
- **Audience Persona & Demographics (`qloo-demographics`):** Analyzes age cohort distributions (`24_and_younger` through `45_to_54`) and gender skew for any artist, film, or brand.
- **Interactive Radial "Taste Constellation" Graph:** Toggle between **List View** and **Constellation** inside the Run Console to explore an interactive SVG radial network connecting your seed entities to cross-domain recommendations.
- **In-Editor Live Seed Verifier:** Click **"Verify in Qloo"** inside the node inspector to preview resolved Entity Names, Categories, and UUIDs *before* running the workflow.

---

### 4. 🤖 Conversational AI Agent Builder (With Live Sync & Diff Inspector)
- **Live Sync Mode vs. Draft Mode:** Toggle **Live Sync On** to watch the AI mutate your canvas in real time, or keep **Draft Mode** to inspect **`NEW`** and **`EDITED`** step diffs before applying.
- **In-Place Node Editing (No Duplicates):** Selecting any node on the canvas scopes AI edits to that node and preserves existing node IDs and positions.
- **Quick AI Action Chips & Smart Follow-Ups:** One-click chips to *Explain workflow*, *Optimize prompts*, *Add email digest*, or *Switch to schedule*.

---

### 5. 📝 AI Cultural & Web Synthesizer Node (`ai-synthesize`)
- Combines upstream cultural affinity outputs (`{{ qloo.summary }}`, `{{ qloo.topPickReason }}`) with live browser-scraped context (`{{ extract.data }}`).
- Generates structured deliverables in 4 tailored formats: **Executive Cultural Brief** (`brief`), **VIP Concierge Itinerary** (`itinerary`), **Brand Sponsorship Pitch** (`pitch`), and **Personalized Outreach Email** (`outreach`).

---

## 🚀 1-Click Starter Blueprints

Launch any of the 5 pre-built blueprints from `/launch`:

| Blueprint | Node Pipeline | What It Demonstrates |
| :--- | :--- | :--- |
| 🌐 **Web-to-Taste Auto-Discovery** *(Flagship)* | `Start` ➔ `Open URL (Wikipedia)` ➔ `Stagehand Extract (Creators & Works)` ➔ `Qloo Taste Seeds (Auto-Resolve)` ➔ `Qloo Brand Match` ➔ `AI Sponsorship Pitch Synthesizer` | **Reverse Web-to-Taste Loop:** Autonomous browser scrapes live web entities, resolves them into taste seeds, finds aligned brands, and writes a sponsorship pitch. |
| 🧭 **Cultural Positioning & Competitor Intel** | `Startup Website` ➔ `Product Positioning Extract` ➔ 3 `Qloo Audience + Brand Affinity` tracks ➔ `Live Competitor Research` ➔ `Cultural Positioning Brief` | **Cultural Market Map:** Compares three subculture lenses, Qloo affinity signals, and live competitor messaging to propose testable positioning hypotheses. |
| 🍸 **Autonomous Cultural Concierge** | `Start` ➔ `Qloo Taste Seeds` ➔ `Qloo Local Discovery (Tokyo)` ➔ `Open URL (Live Web Verification)` ➔ `Send VIP Email` | **Taste-to-Action Loop:** Multi-domain seeds (*Radiohead, Haruki Murakami*) ➔ hyper-local Tokyo venues ➔ live browser verification ➔ email delivery. |
| 🏷️ **Cross-Domain Taste Scout** | `Start` ➔ `Cinema Aesthetic Seeds` ➔ `Qloo Lifestyle Brand Recommendations` ➔ `Send Brand Affinity Report` | **Cross-Domain Correlation:** Maps film aesthetics (*Wes Anderson, Studio Ghibli*) to fashion & lifestyle brand affinities. |
| 📍 **Local Places Explorer** | `Start` ➔ `Artist Taste Seed` ➔ `Qloo Local Discovery (New York)` | **Rapid Local Curation:** Turns musical taste into explainable dining and nightlife picks. |

---

## 🧩 Complete Node Catalog (12 Nodes)

> Full interactive documentation with searchable fields and 1-click copyable `{{ }}` tokens is built directly into the app at **`/docs`**.

| Category | Node Label | Registry Key | Key Inputs | Outputs Available for Downstream `{{ }}` Piping |
| :--- | :--- | :--- | :--- | :--- |
| **Trigger** | **Start** | `start` | *None (Manual run)* | — |
| **Trigger** | **Schedule Trigger** | `schedule` | `frequency`, `time`, `weekday`, `monthday`, `dateTime`, `cron`, `timezone` | — |
| **Cultural AI** | **Qloo Taste Seeds** | `qloo-search` | `query` *(names or `{{ extract.data }}`)*, `entityType` | `entityIds`, `primaryEntityId`, `primaryName`, `names`, `entities`, `summary` |
| **Cultural AI** | **Qloo Recommendations** | `qloo-recommend` | `entityIds`, `targetType`, `city`, `vibeTags`, `negativeSeeds`, `limit` | `topPickName`, `topPickReason`, `searchQuery`, `summary`, `names`, `entityIds`, `entities` |
| **Cultural AI** | **Qloo Local Discovery** | `qloo-local` | `entityIds`, `city`, `vibeTags`, `limit` | `topPickName`, `topPickReason`, `searchQuery`, `summary`, `names`, `entityIds`, `entities` |
| **Cultural AI** | **Qloo Taste Overlap** | `qloo-compare` | `firstSeeds` *(Profile A)*, `secondSeeds` *(Profile B)*, `targetType`, `city` | `compatibilityScore`, `topPickName`, `topPickReason`, `entities`, `searchQuery`, `summary` |
| **Cultural AI** | **Qloo Audience Persona** | `qloo-demographics` | `entityIds` *(Brands, artists, or seed IDs)* | `topAgeGroup`, `topGender`, `personaSummary`, `summary` |
| **AI Synthesis** | **AI Cultural Synthesizer** | `ai-synthesize` | `format` *(brief / itinerary / pitch / outreach)*, `instruction`, `contextData` | `headline`, `content`, `actionRecommendation`, `summary` |
| **Browser** | **Open URL** | `open-url` | `url` | `url`, `title` |
| **Browser** | **Act** | `act` | `instruction` *(Natural language browser action)* | `success`, `message`, `url` |
| **Browser** | **Extract** | `extract` | `instruction` *(Natural language data extraction)* | `data` |
| **Browser** | **Observe** | `observe` | `instruction` *(Find interactive elements on page)* | `matches` |
| **Delivery** | **Send Email** | `send-email` | `provider` *(Resend / Gmail)*, `to`, `subject`, `body` | `id` |

---

## ⚙️ Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd browser_automation
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Database (Neon Serverless Postgres)
DATABASE_URL="postgresql://user:password@ep-example.region.aws.neon.tech/neondb?sslmode=require"

# Cultural Intelligence API
QLOO_API_KEY="your_qloo_api_key"
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

# Clerk (Authentication & Workspaces)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Email Delivery (Resend / Optional Gmail SMTP)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Browsevibe <onboarding@resend.dev>"
```

### 3. Push the Database Schema & Start Servers
```bash
npm run db:push

# Terminal 1: Start Next.js Studio
npm run dev

# Terminal 2: Start Trigger.dev Worker
npx trigger.dev@latest dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the app and read the interactive guide at [http://localhost:3000/docs](http://localhost:3000/docs).
