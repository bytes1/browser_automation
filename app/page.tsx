import Link from "next/link"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Command,
  Globe2,
  MousePointer2,
  Play,
  Sparkles,
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
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="visual-label label-left">
        <span className="live-dot" /> LIVE WORKFLOW
      </div>
      <div className="visual-label label-right">
        <Sparkles size={13} /> AI READY
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
              <Globe2 size={11} /> app.web
            </span>
            <ChevronDown size={12} />
          </div>
          <div className="window-avatar">A</div>
        </div>
        <div className="canvas-grid">
          <div className="canvas-toolbar">
            <span className="toolbar-logo">
              <BrandMark />
            </span>
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="workflow-title">
            <span>Weekly research digest</span>
            <small>
              <span className="live-dot" /> Saved
            </small>
          </div>
          <div className="flow-line line-a" />
          <div className="flow-line line-b" />
          <div className="flow-line line-c" />
          <div className="flow-node trigger-node">
            <span className="node-icon violet">
              <Workflow size={15} />
            </span>
            <span>
              <b>Every Monday</b>
              <small>Schedule trigger</small>
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
              <b>Visit product sites</b>
              <small>Open 4 pages</small>
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
              <b>Summarize updates</b>
              <small>AI extraction</small>
            </span>
            <span className="node-spinner" />
          </div>
          <div className="flow-node email-node">
            <span className="node-icon green">
              <ArrowUpRight size={15} />
            </span>
            <span>
              <b>Send digest</b>
              <small>Slack · #product</small>
            </span>
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
          <b>Run completed</b>
          <span>4 pages · 12.8 seconds</span>
        </div>
        <span className="run-card-check">
          <Check size={14} />
        </span>
      </div>
      <div className="cursor-float">
        <MousePointer2 size={19} fill="currentColor" />
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
    icon: <MousePointer2 size={17} />,
    title: "Describe the work",
    text: "Tell the AI what you want done in plain language. No selectors or scripts needed.",
  },
  {
    number: "02",
    icon: <Workflow size={17} />,
    title: "Shape your workflow",
    text: "A visual canvas turns your idea into a reliable sequence you can fine-tune.",
  },
  {
    number: "03",
    icon: <Zap size={17} />,
    title: "Let it run",
    text: "Run on demand or on a schedule, then follow every step as it happens.",
  },
]

export default function Home() {
  return (
    <main className="landing-page">
      <div className="landing-noise" />
      <HeroSceneLoader />
      <header className="site-header">
        <Link href="/" className="brand-lockup" aria-label="Browsevibe home">
          <BrandMark />
          <span>
            Browsevibe<span className="brand-period">.</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </nav>
        <div className="header-actions">
          <Link className="sign-in-link" href="/sign-in">
            Sign in
          </Link>
          <Link className="button button-dark header-cta" href="/launch">
            Launch app <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <section className="hero-section" id="product">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-icon">
              <Sparkles size={12} />
            </span>{" "}
            YOUR BROWSER, ON AUTOPILOT
          </div>
          <h1>
            Make busywork
            <br />a <span className="headline-accent">thing of the past.</span>
          </h1>
          <p className="hero-description">
            The browser automation platform that turns everyday tasks into
            workflows you can see, shape, and trust.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/launch">
              Start building <ArrowRight size={16} />
            </Link>
            <a className="watch-link" href="#how-it-works">
              <span>
                <Play size={12} fill="currentColor" />
              </span>{" "}
              See how it works
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars">
              <span>A</span>
              <span>M</span>
              <span>J</span>
              <span>+</span>
            </div>
            <span>Built for the work you repeat</span>
            <span className="proof-separator">·</span>
            <span className="proof-rating">✦ &nbsp;No code required</span>
          </div>
        </div>
        <BrowserPreview />
        <div className="hero-scroll">
          <span>SCROLL TO EXPLORE</span>
          <ArrowDownRight size={14} />
        </div>
      </section>

      <section className="trust-strip" aria-label="Product capabilities">
        <span className="trust-lead">LESS BUSYWORK, MORE MOMENTUM</span>
        <div className="trust-item">
          <Workflow size={16} />
          <span>Visual workflows</span>
        </div>
        <div className="trust-item">
          <Sparkles size={16} />
          <span>AI-powered building</span>
        </div>
        <div className="trust-item">
          <Globe2 size={16} />
          <span>Real browser actions</span>
        </div>
        <div className="trust-item">
          <Zap size={16} />
          <span>Scheduled runs</span>
        </div>
        <div className="trust-item">
          <Sparkles size={16} />
          <span>Qloo Taste Intelligence</span>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <div className="eyebrow eyebrow-muted">
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
                <span className="step-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <div className="step-card-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="closing-banner" id="features">
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
          <p>Start with one task. Get a little time back every day.</p>
          <Link className="button button-light" href="/launch">
            Launch Browsevibe <ArrowRight size={16} />
          </Link>
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
          <Link href="/sign-in">Sign in</Link>
          <Link href="/launch">
            Launch app <ArrowUpRight size={13} />
          </Link>
        </div>
        <small>© 2026 Browsevibe</small>
      </footer>
    </main>
  )
}
