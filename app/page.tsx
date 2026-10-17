import Link from "next/link"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarClock,
  Check,
  ChevronDown,
  Command,
  Cpu,
  Globe2,
  Layers,
  MousePointer2,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react"
import HeroSceneLoader from "@/components/landing/hero-scene-loader"
import ClosingSceneLoader from "@/components/landing/closing-scene-loader"

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function BrowserPreview() {
  return (
    <div
      className="hero-visual"
      aria-label="A preview of a browser automation workflow"
    >
      <div className="visual-glow" />
      <div className="visual-glow-secondary" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="visual-label label-left">
        <span className="live-dot" /> LIVE WORKFLOW
      </div>
      <div className="visual-label label-right">
        <Sparkles size={13} /> STAGEHAND AI
      </div>
      <div className="workflow-window">
        <div className="window-topbar">
          <div className="window-controls">
            <i />
            <i />
            <i />
          </div>
          <div className="window-address">
            <span>
              <Globe2 size={11} /> app.browsevibe.dev/canvas
            </span>
            <ChevronDown size={12} />
          </div>
          <div className="window-status-pill">
            <span className="live-dot" /> Connected
          </div>
          <div className="window-avatar">A</div>
        </div>
        <div className="canvas-grid">
          <div className="canvas-toolbar">
            <span className="toolbar-logo">
              <BrandMark />
            </span>
            <i className="active" />
            <i />
            <i />
            <i />
          </div>
          <div className="workflow-title">
            <span>
              Weekly competitor &amp; pricing radar{" "}
              <em className="workflow-badge">v2.4</em>
            </span>
            <small>
              <span className="live-dot" /> Auto-saved · 2s ago
            </small>
          </div>
          <div className="flow-line line-a">
            <span className="flow-packet packet-a" />
          </div>
          <div className="flow-line line-b">
            <span className="flow-packet packet-b" />
          </div>
          <div className="flow-line line-c">
            <span className="flow-packet packet-c" />
          </div>
          <div className="flow-node trigger-node">
            <span className="node-icon violet">
              <Workflow size={15} />
            </span>
            <span>
              <b>Every Monday · 09:00</b>
              <small>Cron schedule trigger</small>
            </span>
            <span className="node-check">
              <Check size={11} />
            </span>
          </div>
          <div className="flow-node browser-node">
            <span className="node-icon blue">
              <Globe2 size={15} />
            </span>
            <span>
              <b>Visit product pages</b>
              <small>Stealth browser · 6 tabs</small>
            </span>
            <span className="node-check">
              <Check size={11} />
            </span>
          </div>
          <div className="flow-node ai-node">
            <span className="node-icon orange">
              <Sparkles size={15} />
            </span>
            <span>
              <b>Extract &amp; synthesize</b>
              <small>AI schema + Qloo signals</small>
            </span>
            <span className="node-spinner" />
          </div>
          <div className="flow-node email-node">
            <span className="node-icon green">
              <ArrowUpRight size={15} />
            </span>
            <span>
              <b>Dispatch briefing</b>
              <small>Slack #product + Email</small>
            </span>
            <span className="node-tag">Ready</span>
          </div>
          <div className="canvas-inspector">
            <div className="inspector-header">
              <Terminal size={10} /> LIVE TRACE
            </div>
            <div className="inspector-line">
              <span className="trace-ok">✓</span> Navigated to pricing
            </div>
            <div className="inspector-line">
              <span className="trace-ok">✓</span> DOM snapshot parsed
            </div>
            <div className="inspector-line active">
              <span className="trace-run">●</span> Extracting 14 tiers...
            </div>
          </div>
          <div className="canvas-minimap">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <div className="run-card">
        <div className="run-card-icon">
          <Play size={13} fill="currentColor" />
        </div>
        <div className="run-card-copy">
          <b>Run #148 succeeded</b>
          <span>6 pages · 8.4s · 0 retries</span>
        </div>
        <span className="run-card-check">
          <Check size={14} />
        </span>
      </div>
      <div className="cursor-float">
        <MousePointer2 size={19} fill="currentColor" />
        <span className="cursor-badge">AI Agent</span>
      </div>
      <div className="orbit-node orbit-node-top">
        <Zap size={14} fill="currentColor" />
      </div>
      <div className="orbit-node orbit-node-bottom">
        <Command size={14} />
      </div>
    </div>
  )
}

const steps = [
  {
    number: "01",
    tag: "NATURAL PROMPTING",
    icon: <MousePointer2 size={18} />,
    title: "Describe the outcome",
    text: "Tell the agent what to click, extract, or fill out in plain English. Self-healing AI adapts even when site layouts change.",
    detail: '"Log in, export last week’s invoices, and summarize anomalies."',
  },
  {
    number: "02",
    tag: "VISUAL GRAPH",
    icon: <Workflow size={18} />,
    title: "Shape on a live canvas",
    text: "Every prompt compiles into an inspectable node graph. Branch logic, inject Qloo taste enrichment, or tweak steps in real time.",
    detail: "Drag, connect, and multiplayer-edit with your team.",
  },
  {
    number: "03",
    tag: "DURABLE EXECUTION",
    icon: <Zap size={18} />,
    title: "Put it on autopilot",
    text: "Trigger via cron, webhook, or on demand on cloud stealth browsers—with live video replay and step-by-step telemetry.",
    detail: "99.9% reliability backed by Trigger.dev workers.",
  },
]

const useCases = [
  {
    category: "Market Intelligence",
    title: "Competitor & Pricing Tracker",
    description:
      "Navigate dynamic pricing calculators, capture tier shifts across 10+ competitors, and deliver structured diffs to Slack.",
    nodes: ["Cron 08:00", "Cloud Browser", "AI Diff", "Slack"],
    duration: "11.2s avg",
  },
  {
    category: "Growth & Cultural AI",
    title: "Qloo Taste-Enriched Lead Research",
    description:
      "Scrape brand storefronts, enrich audience affinity profiles with Qloo Taste Intelligence, and draft hyper-tailored outreach.",
    nodes: ["Webhook", "Storefront Scrape", "Qloo API", "Resend"],
    duration: "6.8s avg",
  },
  {
    category: "Operations",
    title: "Multi-Portal Invoice Collector",
    description:
      "Log into vendor portals behind complex navigation, download monthly PDF statements, and sync line items to your database.",
    nodes: ["Monthly", "Auth Session", "Extract Table", "Postgres"],
    duration: "19.4s avg",
  },
]

export default function Home() {
  return (
    <main className="landing-page">
      <div className="landing-noise" />
      <div className="ambient-aura aura-top" aria-hidden="true" />
      <div className="ambient-aura aura-mid" aria-hidden="true" />
      <HeroSceneLoader />

      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand-lockup" aria-label="Browsevibe home">
            <BrandMark />
            <span>
              Browsevibe<span className="brand-period">.</span>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#product">Product</a>
            <a href="#features">Capabilities</a>
            <a href="#how-it-works">How it works</a>
            <a href="#templates">Templates</a>
            <Link href="/docs">Docs</Link>
          </nav>
          <div className="header-actions">
            <Link className="sign-in-link" href="/sign-in">
              Sign in
            </Link>
            <Link className="button button-dark header-cta" href="/launch">
              Launch app <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section className="hero-section" id="product">
        <div className="hero-copy">
          <div className="eyebrow-pill">
            <span className="eyebrow-badge">NEW</span>
            <Sparkles size={12} className="eyebrow-sparkle" />
            <span>WISPR FLOW VOICE + STAGEHAND 4.0 + TASTE AI</span>
            <ArrowRight size={12} />
          </div>
          <h1>
            Make browser busywork{" "}
            <span className="headline-accent">a thing of the past.</span>
          </h1>
          <p className="hero-description">
            The visual AI browser automation platform that turns repetitive web
            tasks into resilient, multiplayer workflows you can see, steer, and
            trust.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/launch">
              Start building free <ArrowRight size={16} />
            </Link>
            <Link className="watch-link" href="/docs">
              <span>
                <Play size={12} fill="currentColor" />
              </span>{" "}
              Read user docs &amp; guide
            </Link>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars">
              <span>A</span>
              <span>M</span>
              <span>J</span>
              <span>+</span>
            </div>
            <div className="proof-meta">
              <strong>Built for work you repeat</strong>
              <span>
                Zero brittle CSS selectors · Cloud stealth browsers included
              </span>
            </div>
          </div>
        </div>
        <BrowserPreview />
        <div className="hero-scroll">
          <span>SCROLL TO EXPLORE</span>
          <ArrowDownRight size={14} />
        </div>
      </section>

      <section className="trust-strip" aria-label="Product capabilities">
        <span className="trust-lead">ENGINEERED FOR MODERN OPERATORS</span>
        <div className="trust-items">
          <div className="trust-item">
            <Workflow size={16} />
            <span>Visual node canvas</span>
          </div>
          <div className="trust-item">
            <Bot size={16} />
            <span>Self-healing AI actions</span>
          </div>
          <div className="trust-item">
            <Globe2 size={16} />
            <span>Cloud stealth browsers</span>
          </div>
          <div className="trust-item">
            <CalendarClock size={16} />
            <span>Cron &amp; event triggers</span>
          </div>
          <div className="trust-item">
            <Sparkles size={16} />
            <span>Qloo Taste Intelligence</span>
          </div>
        </div>
      </section>

      <section className="bento-section" id="features">
        <div className="section-heading">
          <div>
            <div className="eyebrow eyebrow-muted">
              <span className="eyebrow-icon">
                <Layers size={12} />
              </span>
              UNDER THE HOOD
            </div>
            <h2>
              Everything required to automate
              <br />
              <span>the untamed web.</span>
            </h2>
          </div>
          <p>
            Unlike fragile recorder extensions or black-box prompts, Browsevibe
            combines deterministic visual flows with autonomous browser agents.
          </p>
        </div>

        <div className="bento-grid">
          <article className="bento-card bento-wide">
            <div className="bento-copy">
              <span className="bento-kicker">
                <Bot size={13} /> SELF-HEALING STAGEHAND AGENT
              </span>
              <h3>AI that sees the DOM like a human—and never breaks on redesigns</h3>
              <p>
                Forget hunting for <code>div &gt; span:nth-child(4)</code>.
                Write natural instructions like{" "}
                <em>&ldquo;Click the export CSV button&rdquo;</em> and let our
                vision-and-DOM agent resolve elements on the fly.
              </p>
            </div>
            <div className="bento-visual prompt-showcase" aria-hidden="true">
              <div className="prompt-box">
                <span className="prompt-label">Natural Instruction</span>
                <p>
                  &ldquo;Extract all enterprise plan features and pricing tiers
                  into structured JSON&rdquo;
                </p>
              </div>
              <div className="prompt-arrow">
                <Zap size={14} /> Compiled to resilient action
              </div>
              <div className="schema-preview">
                <div>
                  <span className="k">tier</span>
                  <span className="v">&quot;Enterprise&quot;</span>
                </div>
                <div>
                  <span className="k">ssoIncluded</span>
                  <span className="v bool">true</span>
                </div>
                <div>
                  <span className="k">confidence</span>
                  <span className="v num">0.994</span>
                </div>
              </div>
            </div>
          </article>

          <article className="bento-card">
            <div className="bento-copy">
              <span className="bento-kicker">
                <Globe2 size={13} /> CLOUD BROWSER FLEET
              </span>
              <h3>Zero local setup</h3>
              <p>
                Every workflow spins up isolated, stealth Browserbase sessions
                in the cloud with built-in proxy rotation, CAPTCHA handling, and
                live session view.
              </p>
            </div>
            <div className="bento-metrics" aria-hidden="true">
              <div className="metric-pill">
                <strong>&lt; 650ms</strong>
                <span>Cold browser boot</span>
              </div>
              <div className="metric-pill">
                <strong>100%</strong>
                <span>Sandboxed sessions</span>
              </div>
            </div>
          </article>

          <article className="bento-card">
            <div className="bento-copy">
              <span className="bento-kicker">
                <Sparkles size={13} /> CULTURAL &amp; TASTE AI
              </span>
              <h3>Enriched by Qloo Intelligence</h3>
              <p>
                Pair web scraping with Qloo&apos;s cultural affinity graph to
                discover brand cross-affinities, taste segments, and regional
                sentiment inside one pipeline.
              </p>
            </div>
            <div className="taste-tags" aria-hidden="true">
              <span>✦ Brand Affinity +94%</span>
              <span>✦ Audience Persona</span>
              <span>✦ Trend Velocity</span>
            </div>
          </article>

          <article className="bento-card bento-wide bento-dark">
            <div className="bento-copy">
              <span className="bento-kicker">
                <Cpu size={13} /> MULTIPLAYER + DURABLE RUNTIME
              </span>
              <h3>Collaborate live. Execute with ironclad durability.</h3>
              <p>
                Co-design workflows with your team via Liveblocks presence, then
                hand execution off to Trigger.dev background workers with
                automatic retries, cron schedules, and email/Slack digests.
              </p>
            </div>
            <div className="runtime-strip" aria-hidden="true">
              <div className="runtime-step">
                <ShieldCheck size={15} />
                <div>
                  <b>Auto-Retry &amp; Backoff</b>
                  <small>Survives network blips</small>
                </div>
              </div>
              <div className="runtime-step">
                <CalendarClock size={15} />
                <div>
                  <b>Flexible Schedules</b>
                  <small>Hourly, daily, or cron</small>
                </div>
              </div>
              <div className="runtime-step">
                <Terminal size={15} />
                <div>
                  <b>Realtime Stream Logs</b>
                  <small>Watch every token &amp; click</small>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <div className="eyebrow eyebrow-muted">
              <span className="eyebrow-icon">
                <Workflow size={12} />
              </span>
              A BETTER WAY TO GET IT DONE
            </div>
            <h2>
              From “I do this every week”
              <br />
              to <span>“it’s already done.”</span>
            </h2>
          </div>
          <p>
            Build browser workflows that feel effortless to create and
            dependable enough to run while you focus on what’s next.
          </p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-card-top">
                <span className="step-icon">{step.icon}</span>
                <span className="step-tag">{step.tag}</span>
                <span className="step-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="step-quote">{step.detail}</div>
              <div className="step-card-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="templates-section" id="templates">
        <div className="section-heading">
          <div>
            <div className="eyebrow eyebrow-muted">
              <span className="eyebrow-icon">
                <Zap size={12} />
              </span>
              READY-TO-RUN BLUEPRINTS
            </div>
            <h2>
              Start from a proven pattern,
              <br />
              <span>customize in seconds.</span>
            </h2>
          </div>
          <Link className="button button-outline" href="/launch">
            Browse all templates <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="templates-grid">
          {useCases.map((item) => (
            <article className="template-card" key={item.title}>
              <div className="template-meta">
                <span className="template-category">{item.category}</span>
                <span className="template-duration">{item.duration}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="template-pipeline" aria-label="Workflow nodes">
                {item.nodes.map((node, index) => (
                  <span key={node} className="pipeline-chip">
                    {node}
                    {index < item.nodes.length - 1 && (
                      <i className="pipeline-sep">→</i>
                    )}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-banner">
        <ClosingSceneLoader />
        <div className="closing-orb" />
        <div className="closing-content">
          <div className="eyebrow">
            <span className="eyebrow-icon">
              <Sparkles size={12} />
            </span>{" "}
            YOUR NEXT WORKFLOW STARTS HERE
          </div>
          <h2>
            Give the repeat work
            <br />a better place to go.
          </h2>
          <p>
            Start with one task. Reclaim hours of browser busywork every week.
          </p>
          <div className="closing-actions">
            <Link className="button button-light" href="/launch">
              Launch Browsevibe <ArrowRight size={16} />
            </Link>
            <Link className="closing-secondary-link" href="/sign-in">
              Sign in to workspace <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
        <div className="closing-stamp">
          <span>BUILT TO</span>
          <strong>FLOW</strong>
          <span>WITH YOU</span>
        </div>
      </section>

      <footer className="site-footer">
        <Link href="/" className="brand-lockup footer-brand">
          <BrandMark />
          <span>
            Browsevibe<span className="brand-period">.</span>
          </span>
        </Link>
        <span>Browser work, in a better flow.</span>
        <div>
          <a href="#features">Capabilities</a>
          <a href="#how-it-works">How it works</a>
          <a href="#templates">Templates</a>
          <Link href="/docs">Docs</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/launch">
            Launch app <ArrowUpRight size={13} />
          </Link>
        </div>
        <small>© 2026 Browsevibe. All rights reserved.</small>
      </footer>
    </main>
  )
}
