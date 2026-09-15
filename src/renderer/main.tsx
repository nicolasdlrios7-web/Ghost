import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  House,
  ScanLine,
  Workflow,
  Activity,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  Play,
  Pause,
  Trash2,
  Shield,
  Command,
  Sparkles,
  X,
  Clock,
  ExternalLink,
  FileText,
  ChevronDown,
} from "lucide-react";
import type {
  State,
  Opportunity,
  Command as Cmd,
  Automation,
} from "../shared/types";
import { hoursPerYear } from "../shared/detection";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "./style.css";
const nav = [
  ["Home", House],
  ["Opportunities", ScanLine],
  ["Automations", Workflow],
  ["Activity", Activity],
  ["Settings", Settings],
] as const;
function Mark({ large = false }: { large?: boolean }) {
  return (
    <span className={"mark " + (large ? "large" : "")}>
      <span />
    </span>
  );
}
function AppIcon({ app }: { app: string }) {
  return (
    <span className={"app-icon app-" + app.toLowerCase().replace(/\s/g, "")}>
      {app === "Chrome" ? (
        <span className="chrome" />
      ) : app === "Mail" ? (
        "✉"
      ) : app === "Notion" ? (
        "N"
      ) : app === "Zoom" ? (
        "▰"
      ) : app === "Notes" ? (
        "≡"
      ) : app === "Finder" ? (
        "⌘"
      ) : (
        app.slice(0, 1)
      )}
    </span>
  );
}
function Sequence({ apps }: { apps: string[] }) {
  return (
    <div className="sequence">
      {apps.map((app, i) => (
        <React.Fragment key={app}>
          {i > 0 && <ArrowRight size={14} />}
          <span>
            <AppIcon app={app} />
            {app}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
const duration = (seconds: number) =>
  seconds >= 3600
    ? `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
    : `${Math.max(0, Math.round(seconds / 60))}m`;
function App() {
  const [s, setS] = useState<State>();
  const [page, setPage] = useState("Home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Opportunity>();
  const [evidence, setEvidence] = useState(false);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [trigger, setTrigger] = useState("Every Friday");
  const [steps, setSteps] = useState<string[]>([]);
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [inspect, setInspect] = useState<Automation>();
  const [context, setContext] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  useEffect(() => {
    window.ghost
      .state()
      .then(setS)
      .catch((e) => setError(e.message));
    const id = setInterval(() => window.ghost.state().then(setS), 2500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (building && progress < steps.length) {
      const id = setTimeout(() => setProgress((p) => p + 1), 550);
      return () => clearTimeout(id);
    }
  }, [building, progress, steps.length]);
  async function act(command: Cmd, payload?: unknown) {
    setBusy(true);
    setError("");
    try {
      const next = await window.ghost.command(command, payload);
      setS(next);
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  function detail(o: Opportunity) {
    setSelected(o);
    setEvidence(false);
    setBuilding(false);
    setSuccess(false);
    setEditing(false);
    setSteps(o.steps);
    setTrigger("Every Friday");
  }
  if (!s)
    return (
      <div className="loading">
        <Mark large />
        <p>{error || "Waking Ghost…"}</p>
      </div>
    );
  const events = s.events.filter(
    (e) => e.source === (s.demo ? "demo" : "live"),
  );
  const opportunities = s.opportunities.filter(
    (o) => o.source === (s.demo ? "demo" : "live"),
  );
  const autos = s.automations.filter(
    (a) => a.opportunity.source === (s.demo ? "demo" : "live"),
  );
  const saved = autos
    .filter((a) => a.active)
    .reduce((n, a) => n + a.opportunity.minutes, 0);
  const potential = opportunities.reduce((n, o) => n + o.minutes, 0);
  const latest = opportunities[0];
  const analyze = async () => {
    await act("analyze");
    setPage("Opportunities");
  };
  const loadDemo = async () => {
    await act("demo");
    setPage("Home");
  };
  const analyzeButton = (
    <button
      className="primary"
      disabled={busy || events.length < 3}
      onClick={analyze}
    >
      <Sparkles size={15} />
      {busy ? "Analyzing…" : "Analyze patterns"}
      <ArrowRight size={15} />
    </button>
  );
  return (
    <>
      {!s.settings.onboarding ? (
        <div className="onboarding">
          <div className="onboarding-inner">
            <div className="wordmark">
              <Mark />
              Ghost
            </div>
            <div className="eyebrow">
              AMBIENT INTELLIGENCE, FOR YOUR DESKTOP
            </div>
            <h1>
              Your computer knows
              <br />
              what you do.
              <br />
              <span>
                Ghost learns what
                <br />
                you shouldn’t have to.
              </span>
            </h1>
            <p>
              Quietly understand your workflow.
              <br />
              Discover the work you shouldn’t have to repeat.
            </p>
            <div className="onboarding-actions">
              <button className="primary" onClick={() => act("start")}>
                Start Ghost <ArrowRight size={16} />
              </button>
              <button onClick={loadDemo}>
                Try Demo <Play size={14} />
              </button>
            </div>
            <div className="privacy-note">
              <Shield size={18} />
              <div>
                No keystrokes. No screenshots.
                <br />
                <span>
                  Your history stays on this device. Structured context is sent
                  <br />
                  to AI only if you enable it and choose Analyze.
                </span>
              </div>
            </div>
          </div>
          <div className="orb">
            <Mark large />
            <div className="orb-label">
              A LITTLE LESS BUSY.
              <br />A LITTLE MORE YOU.
            </div>
          </div>
        </div>
      ) : (
        <div className="shell">
          <aside>
            <div className="wordmark">
              <Mark />
              Ghost
            </div>
            <div className="workspace">
              <span className="workspace-avatar">
                <Command size={15} />
              </span>
              <div>
                Personal workspace<small>Local to this Mac</small>
              </div>
              <ChevronDown size={13} />
            </div>
            <nav>
              {nav.map(([label, Icon]) => (
                <button
                  key={label}
                  className={page === label ? "selected" : ""}
                  onClick={() => {
                    setPage(label);
                    setSelected(undefined);
                  }}
                >
                  <Icon size={18} />
                  {label}
                  {label === "Opportunities" && opportunities.length > 0 && (
                    <span className="count">{opportunities.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="quiet">
                <span
                  className={
                    "dot " + (!s.settings.monitoring || s.demo ? "muted" : "")
                  }
                />
                <div>
                  {s.demo
                    ? "Demo workspace"
                    : s.settings.monitoring
                      ? "Watching quietly"
                      : "Observation paused"}
                  <small>
                    {s.demo ? "A sample workday" : "Private by design"}
                  </small>
                </div>
              </div>
              <button
                className="demo-button"
                onClick={loadDemo}
                disabled={busy}
              >
                <Play size={14} />{" "}
                {s.demo ? "Reload sample workday" : "Explore Demo Mode"}
                <ArrowUpRight size={14} />
              </button>
              <div className="version">
                GHOST <span>v1.0 · Preview</span>
              </div>
            </div>
          </aside>
          <main>
            <header>
              <span>
                {page}
                <ChevronRight size={13} />
                <span className="subtle">Your workspace</span>
              </span>
              <div>
                <span className="engine">
                  <span className="dot" />
                  {s.settings.aiEnabled && s.settings.hasKey
                    ? "AI analysis enabled"
                    : "Local pattern detection"}
                </span>
              </div>
            </header>
            {s.demo && (
              <div className="demo-banner">
                <span>
                  <Play size={12} /> DEMO MODE{" "}
                  <span>
                    Exploring a sample workday. Live observation is suspended.
                  </span>
                </span>
                <button onClick={() => act("resetDemo")}>
                  Exit & reset demo <X size={13} />
                </button>
              </div>
            )}
            <div className="content" key={page}>
              {page === "Home" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        LESS REPETITION. MORE POSSIBILITY.
                      </div>
                      <h1>
                        Works ahead of you<span className="cyan">.</span>
                      </h1>
                      <p>
                        Ghost understands your workflow and surfaces
                        <br />
                        the work you shouldn’t have to repeat.
                      </p>
                    </div>
                    <div className="headline-ring">
                      <Mark large />
                    </div>
                  </div>
                  <div className="metrics">
                    {[
                      [
                        duration(
                          events.reduce((n, e) => n + e.durationSeconds, 0),
                        ),
                        "Time observed",
                      ],
                      [new Set(events.map((e) => e.app)).size, "Apps seen"],
                      [s.analyzedPatterns, "Patterns analyzed"],
                      [opportunities.length, "Opportunities found"],
                      [
                        `${saved || potential}m`,
                        saved
                          ? "Weekly saving · estimated"
                          : "Weekly potential",
                      ],
                    ].map(([value, label]) => (
                      <div key={label}>
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="section-head">
                    <h2>
                      Latest opportunity{" "}
                      <span className="badge">
                        {latest ? "NEW" : "DISCOVERY"}
                      </span>
                    </h2>
                    {analyzeButton}
                  </div>
                  {latest ? (
                    <div className="hero-card">
                      <div className="hero-card-top">
                        <span className="small-label">
                          <ScanLine size={15} /> A PATTERN WORTH BREAKING
                        </span>
                        <span className="confidence">
                          <span className="dot" />
                          {latest.confidence >= 0.85
                            ? "High confidence"
                            : "Possible pattern"}
                        </span>
                      </div>
                      <div className="hero-card-body">
                        <div>
                          <h2>{latest.title}</h2>
                          <p>
                            Ghost recognized the same workflow across
                            <br />
                            {latest.recurrence} similar sessions.
                          </p>
                          <Sequence apps={latest.sequence} />
                          <button
                            className="primary"
                            onClick={() => detail(latest)}
                          >
                            View opportunity <ArrowUpRight size={16} />
                          </button>
                        </div>
                        <div className="saving">
                          <span className="saving-number">
                            {latest.minutes}
                            <small>min</small>
                          </span>
                          <span>potentially saved every week</span>
                          <div className="annual">
                            <ArrowUpRight size={16} /> ~
                            {Math.round(hoursPerYear(latest.minutes))} hours a
                            year, back to you.
                          </div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <Shield size={13} /> Based on{" "}
                        {s.demo ? "sample" : "observed"} activity · Review the
                        evidence. You’re always in control.
                      </div>
                    </div>
                  ) : (
                    <div className="empty-discovery">
                      <ScanLine size={27} />
                      <h2>
                        {events.length
                          ? "Your workday has a story."
                          : "Good work starts quietly."}
                      </h2>
                      <p>
                        {events.length
                          ? "Analyze the activity stream to find repeated workflows."
                          : "Ghost will look for repeated app sequences as you work. Explore a sample workday to see it in action."}
                      </p>
                      {events.length ? (
                        analyzeButton
                      ) : (
                        <button onClick={loadDemo}>
                          Load sample workday <ArrowRight size={15} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="section-head activity-heading">
                    <h2>
                      {s.demo ? "Sample activity" : "Live activity"}{" "}
                      <span className="dot muted" />
                    </h2>
                    <button
                      className="text-button"
                      onClick={() => setPage("Activity")}
                    >
                      View timeline <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="recent">
                    {events
                      .slice(-3)
                      .reverse()
                      .map((e) => (
                        <div className="recent-row" key={e.id}>
                          <AppIcon app={e.app} />
                          <div>
                            {e.app}
                            <small>
                              {e.windowTitle || "Application activity"}
                            </small>
                          </div>
                          <span>{duration(e.durationSeconds)}</span>
                          <time>
                            {new Date(e.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                      ))}
                    {!events.length && (
                      <p className="subtle">
                        {s.observationStatus}. Your next app session will appear
                        here.
                      </p>
                    )}
                  </div>
                </>
              )}
              {page === "Opportunities" && (
                <>
                  <div className="page-heading compact">
                    <div className="eyebrow">DISCOVERY</div>
                    <h1>
                      Ghost found something<span className="cyan">.</span>
                    </h1>
                    <p>Small patterns. A surprising amount of your time.</p>
                  </div>
                  <div className="section-head">
                    <span className="subtle">
                      {opportunities.length} opportunities · {s.analysisStatus}
                    </span>
                    {analyzeButton}
                  </div>
                  {opportunities.map((o, i) => (
                    <div className="opportunity-row" key={o.id}>
                      <div className="opportunity-index">0{i + 1}</div>
                      <div className="opportunity-main">
                        <div className="section-head">
                          <h2>{o.title}</h2>
                          <span className="confidence">
                            {Math.round(o.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p>{o.description}</p>
                        <Sequence apps={o.sequence} />
                        <div className="opportunity-meta">
                          <span>{o.recurrence} repeated sessions</span>
                          <span>
                            {o.engine === "ai"
                              ? "AI interpreted"
                              : "Locally detected"}
                          </span>
                          <span>
                            {o.source === "demo"
                              ? "Sample evidence"
                              : "Observed evidence"}
                          </span>
                        </div>
                      </div>
                      <div className="opportunity-action">
                        <strong>
                          ~{Math.round(hoursPerYear(o.minutes))}
                          <small> hrs/year</small>
                        </strong>
                        <span>potential saving</span>
                        <button onClick={() => detail(o)}>
                          Explore <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!opportunities.length && (
                    <div className="empty-discovery">
                      <ScanLine size={30} />
                      <h2>Repetition becomes opportunity.</h2>
                      <p>
                        Analyze at least three repeats of an app sequence, or
                        load the sample workday.
                      </p>
                      <button onClick={loadDemo}>Load sample workday</button>
                    </div>
                  )}
                </>
              )}
              {page === "Activity" && (
                <>
                  <div className="page-heading compact">
                    <div className="eyebrow">
                      THE CONTEXT BEHIND THE INSIGHT
                    </div>
                    <h1>
                      Your work, in perspective<span className="cyan">.</span>
                    </h1>
                    <p>
                      Only lightweight app context. Always yours to control.
                    </p>
                  </div>
                  <div className="section-head">
                    <span className="subtle">
                      {events.length} sessions · {s.observationStatus}
                    </span>
                    <div className="button-group">
                      <button
                        disabled={s.demo}
                        onClick={() =>
                          act("settings", {
                            monitoring: !s.settings.monitoring,
                          })
                        }
                      >
                        {s.settings.monitoring ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}{" "}
                        {s.settings.monitoring
                          ? "Pause observation"
                          : "Resume observation"}
                      </button>
                      <button
                        className="danger-text"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 size={14} />
                        Delete history
                      </button>
                    </div>
                  </div>
                  <div className="timeline">
                    {[...events].reverse().map((e, i) => (
                      <React.Fragment key={e.id}>
                        {(i === 0 ||
                          new Date(e.startedAt).toDateString() !==
                            new Date(
                              [...events].reverse()[i - 1].startedAt,
                            ).toDateString()) && (
                          <div className="timeline-date">
                            {new Date(e.startedAt).toLocaleDateString([], {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        )}
                        <div className="timeline-row">
                          <time>
                            {new Date(e.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                          <span className="timeline-point" />
                          <AppIcon app={e.app} />
                          <div>
                            <strong>{e.app}</strong>
                            <small>
                              {e.windowTitle ||
                                "App-level observation · window titles off or unavailable"}
                            </small>
                          </div>
                          <span>{duration(e.durationSeconds)}</span>
                        </div>
                      </React.Fragment>
                    ))}
                    {!events.length && (
                      <div className="empty-discovery">
                        <Activity />
                        <h2>A clean slate.</h2>
                        <p>
                          App sessions appear here while observation is enabled.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {page === "Automations" && (
                <>
                  <div className="page-heading compact">
                    <div className="eyebrow">ROOM FOR YOUR REAL WORK</div>
                    <h1>
                      A little time, returned<span className="cyan">.</span>
                    </h1>
                    <p>
                      {saved
                        ? `Your active workflows represent ~${Math.round(hoursPerYear(saved))} hours of potential annual savings.`
                        : "Turn an observed pattern into a workflow you can use."}
                    </p>
                  </div>
                  <div className="scope-note">
                    <Shield size={16} />
                    <span>
                      Workflows are saved locally. Run a draft with supplied
                      context. Scheduled runs and connected apps are coming
                      next.
                    </span>
                  </div>
                  {autos.map((a) => (
                    <div className="automation-card" key={a.id}>
                      <div className="section-head">
                        <div className="automation-title">
                          <div className="automation-symbol">
                            <Workflow size={22} />
                          </div>
                          <div>
                            <h2>{a.opportunity.title}</h2>
                            <span className="subtle">
                              {a.trigger} · Manual draft execution
                            </span>
                          </div>
                        </div>
                        <span className={"badge " + (a.active ? "green" : "")}>
                          {a.active ? "ACTIVE" : "PAUSED"}
                        </span>
                      </div>
                      <div className="auto-stats">
                        <div>
                          <strong>{a.opportunity.minutes} min/week</strong>
                          <small>Estimated saving</small>
                        </div>
                        <div>
                          <strong>
                            {a.lastRun
                              ? new Date(a.lastRun).toLocaleString()
                              : "Not run yet"}
                          </strong>
                          <small>Last draft generated</small>
                        </div>
                      </div>
                      <div className="button-group">
                        <button
                          onClick={() => {
                            setInspect(a);
                            setContext(
                              a.opportunity.source === "demo"
                                ? "Weekly sample metrics: 12,480 visitors (+14%). 386 signups (+9%). Customer updates: onboarding improvements shipped; two customers requested CSV export. Next week: validate onboarding conversion."
                                : "",
                            );
                          }}
                        >
                          <Play size={14} /> Inspect & run draft
                        </button>
                        <button onClick={() => act("toggleAutomation", a.id)}>
                          {a.active ? <Pause size={14} /> : <Play size={14} />}{" "}
                          {a.active ? "Pause" : "Resume"}
                        </button>
                        <button
                          className="icon-button danger-text"
                          aria-label="Delete automation"
                          onClick={() => act("deleteAutomation", a.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!autos.length && (
                    <div className="empty-discovery">
                      <Workflow size={30} />
                      <h2>Your next workflow starts with a pattern.</h2>
                      <p>
                        Review an opportunity and approve its workflow to
                        activate it.
                      </p>
                      <button onClick={() => setPage("Opportunities")}>
                        Explore opportunities <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
              {page === "Settings" && (
                <>
                  <div className="page-heading compact">
                    <div className="eyebrow">ON YOUR TERMS</div>
                    <h1>
                      Quietly in control<span className="cyan">.</span>
                    </h1>
                    <p>
                      Choose what Ghost can see, and how it makes sense of it.
                    </p>
                  </div>
                  <SettingsGroup title="Observation">
                    <Setting
                      title="Observe app activity"
                      description="Check the foreground app every five seconds."
                    >
                      <Toggle
                        on={s.settings.monitoring}
                        click={() =>
                          act("settings", {
                            monitoring: !s.settings.monitoring,
                          })
                        }
                      />
                    </Setting>
                    <Setting
                      title="Launch at login"
                      description="Keep Ghost available in your menu bar."
                    >
                      <Toggle
                        on={s.settings.launchAtLogin}
                        click={() =>
                          act("settings", {
                            launchAtLogin: !s.settings.launchAtLogin,
                          })
                        }
                      />
                    </Setting>
                  </SettingsGroup>
                  <SettingsGroup title="Privacy">
                    <Setting
                      title="Local activity storage"
                      description="No keystrokes or screenshots are collected."
                    >
                      <span className="confidence">
                        <Shield size={14} /> Enabled
                      </span>
                    </Setting>
                    <Setting
                      title="Include window titles"
                      description="Optional. May require macOS Accessibility permission. App-level observation works without it."
                    >
                      <Toggle
                        on={s.settings.windowTitles}
                        click={() =>
                          act("settings", {
                            windowTitles: !s.settings.windowTitles,
                          })
                        }
                      />
                    </Setting>
                    <Setting
                      title="Delete activity history"
                      description="Removes sessions and detected opportunities; saved workflows remain."
                    >
                      <button
                        className="danger-text"
                        onClick={() => setConfirmDelete(true)}
                      >
                        Delete history
                      </button>
                    </Setting>
                  </SettingsGroup>
                  <SettingsGroup title="Intelligence">
                    <Setting
                      title="Use AI for analysis"
                      description="When you choose Analyze, send structured evidence to OpenAI. Window titles are included if collected."
                    >
                      <Toggle
                        on={s.settings.aiEnabled}
                        click={() =>
                          act("settings", { aiEnabled: !s.settings.aiEnabled })
                        }
                      />
                    </Setting>
                    <div className="key-settings">
                      <label>
                        OpenAI API key{" "}
                        <span>
                          {s.settings.hasKey
                            ? "Securely configured"
                            : "Not configured"}
                        </span>
                      </label>
                      <div className="button-group">
                        <input
                          type="password"
                          aria-label="OpenAI API key"
                          placeholder="sk-…"
                          value={key}
                          onChange={(e) => setKey(e.target.value)}
                        />
                        <button
                          disabled={!key || busy}
                          onClick={async () => {
                            await act("settings", { apiKey: key });
                            setKey("");
                          }}
                        >
                          Save key
                        </button>
                        {s.settings.hasKey && (
                          <button
                            onClick={() => act("settings", { apiKey: "" })}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <label>Model</label>
                      <div className="button-group">
                        <input
                          aria-label="Model"
                          placeholder={s.settings.model}
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        />
                        <button
                          disabled={!model}
                          onClick={() => act("settings", { model })}
                        >
                          Save model
                        </button>
                      </div>
                      <small>
                        Keys use macOS protected storage. Local pattern
                        detection is always available.
                      </small>
                    </div>
                  </SettingsGroup>
                  <SettingsGroup title="Demo">
                    <Setting
                      title="Explore a sample workday"
                      description="Four weeks of sample reporting, meeting, and file workflows."
                    >
                      <button onClick={loadDemo}>Load sample workday</button>
                    </Setting>
                    <Setting
                      title="Reset demo"
                      description="Remove sample activity, opportunities, and sample automations."
                    >
                      <button onClick={() => act("resetDemo")}>
                        Reset demo
                      </button>
                    </Setting>
                  </SettingsGroup>
                </>
              )}
              <footer>
                <Mark /> Thoughtfully quiet. Entirely yours.
                <span>
                  <Shield size={12} /> Local-first by design
                </span>
              </footer>
            </div>
          </main>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop">
          <section className={"modal " + (building ? "workflow-modal" : "")}>
            <button
              aria-label="Close"
              className="close icon-button"
              onClick={() => setSelected(undefined)}
            >
              <X size={20} />
            </button>
            {success ? (
              <div className="success">
                <div className="success-icon">
                  <Check size={30} />
                </div>
                <div className="eyebrow">WORKFLOW ACTIVATED</div>
                <h1>
                  A little more Friday.
                  <br />A little less busy.
                </h1>
                <p>
                  Your workflow is ready. It could give you
                  <br />
                  <strong>{selected.minutes} minutes back each week.</strong>
                </p>
                <div className="success-saving">
                  ~{Math.round(hoursPerYear(selected.minutes))}
                  <small>hours / year</small>
                </div>
                <p className="subtle">
                  Estimated potential. Run drafts manually with your context.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    setSelected(undefined);
                    setPage("Automations");
                  }}
                >
                  View your automation <ArrowRight size={16} />
                </button>
              </div>
            ) : building ? (
              <>
                <div className="eyebrow">FROM PATTERN TO POSSIBILITY</div>
                <h1>
                  {progress < steps.length
                    ? "Building your workflow…"
                    : "Your workflow is ready."}
                </h1>
                <p>One thoughtful sequence. Less repetition.</p>
                <div className="workflow">
                  <div className="workflow-node trigger">
                    <Clock size={17} />
                    {editing ? (
                      <input
                        aria-label="Workflow trigger"
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                      />
                    ) : (
                      trigger
                    )}
                    <span>Proposed trigger</span>
                  </div>
                  {steps.map((step, i) => (
                    <React.Fragment key={i}>
                      <div
                        className={
                          "connector " + (progress > i ? "revealed" : "")
                        }
                      />
                      <div
                        className={
                          "workflow-node " +
                          (progress > i ? "revealed" : "pending")
                        }
                      >
                        <span className="node-check">
                          {progress > i ? <Check size={14} /> : i + 1}
                        </span>
                        {editing ? (
                          <input
                            aria-label={`Step ${i + 1}`}
                            value={step}
                            onChange={(e) =>
                              setSteps(
                                steps.map((s, k) =>
                                  k === i ? e.target.value : s,
                                ),
                              )
                            }
                          />
                        ) : (
                          step
                        )}
                        <span>
                          {i === steps.length - 1
                            ? "Human approval"
                            : i === 0
                              ? "Supplied context"
                              : "Local draft"}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <div className="scope-note">
                  <Shield size={15} />
                  <span>
                    This saves a real workflow. Connected data collection and
                    scheduling are not enabled in this preview.
                  </span>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setEditing(!editing)}>
                    {editing ? "Done editing" : "Edit workflow"}
                  </button>
                  <button
                    className="primary"
                    disabled={
                      progress < steps.length ||
                      busy ||
                      !trigger.trim() ||
                      steps.some((s) => !s.trim())
                    }
                    onClick={async () => {
                      const next = await act("activate", {
                        id: selected.id,
                        trigger,
                        steps,
                      });
                      if (next) setSuccess(true);
                    }}
                  >
                    Activate workflow <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="eyebrow">
                  <ScanLine size={15} /> OPPORTUNITY{" "}
                  {selected.source === "demo" ? "· SAMPLE WORKDAY" : ""}
                </div>
                <h1>{selected.title}</h1>
                <p className="detail-description">{selected.description}</p>
                <Sequence apps={selected.sequence} />
                <div className="detail-metrics">
                  <div>
                    <strong>{selected.recurrence}</strong>
                    <span>similar sessions</span>
                  </div>
                  <div>
                    <strong>
                      {selected.minutes}
                      <small> min</small>
                    </strong>
                    <span>potential / week</span>
                  </div>
                  <div>
                    <strong>
                      ~{Math.round(hoursPerYear(selected.minutes))}
                      <small> hrs</small>
                    </strong>
                    <span>potential / year</span>
                  </div>
                </div>
                <button
                  className="evidence-button"
                  onClick={() => setEvidence(!evidence)}
                >
                  <span>
                    <ScanLine size={16} /> See the evidence{" "}
                    <span className="subtle">
                      {selected.evidenceIds.length} app sessions
                    </span>
                  </span>
                  <ChevronDown size={17} />
                </button>
                {evidence && (
                  <div className="evidence-list">
                    {s.events
                      .filter((e) => selected.evidenceIds.includes(e.id))
                      .map((e) => (
                        <div key={e.id}>
                          <time>
                            {new Date(e.startedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                          <AppIcon app={e.app} />
                          <span>{e.windowTitle || e.app}</span>
                          <small>{duration(e.durationSeconds)}</small>
                        </div>
                      ))}
                  </div>
                )}
                <div className="explanation">
                  <h3>Ghost can help with this.</h3>
                  <p>
                    Prepare a consistent draft from the context you supply, with
                    a final review that stays in your hands.
                  </p>
                  <ul>
                    {selected.steps.map((step) => (
                      <li key={step}>
                        <Check size={14} />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="estimate-note">
                  {Math.round(selected.confidence * 100)}% pattern confidence ·
                  Savings are estimates based on repeated sessions, assuming one
                  run per week. App activity suggests a pattern; it doesn’t
                  prove the task performed.
                </div>
                <div className="modal-actions">
                  <button
                    onClick={async () => {
                      await act("dismiss", selected.id);
                      setSelected(undefined);
                    }}
                  >
                    Not now
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      setBuilding(true);
                      setProgress(0);
                    }}
                  >
                    Automate this <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      {inspect && (
        <div className="modal-backdrop">
          <section className="modal">
            <button
              className="close icon-button"
              aria-label="Close"
              onClick={() => setInspect(undefined)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">MANUAL DRAFT RUN</div>
            <h1>{inspect.opportunity.title}</h1>
            <p>
              Supply the source material. Ghost prepares a local report draft
              for your review.
            </p>
            <ol className="inspect-steps">
              {inspect.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <label>
              Source context{" "}
              {inspect.opportunity.source === "demo" && (
                <span className="badge">SAMPLE CONTENT</span>
              )}
            </label>
            <textarea
              aria-label="Source context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Paste metrics and relevant updates…"
            />
            <button
              className="primary"
              disabled={!context.trim() || !inspect.active || busy}
              onClick={async () => {
                const next = await act("runAutomation", {
                  id: inspect.id,
                  context,
                });
                if (next)
                  setInspect(next.automations.find((a) => a.id === inspect.id));
              }}
            >
              Generate local draft <FileText size={16} />
            </button>
            {inspect.draft && (
              <>
                <h3>Draft ready · review before sharing</h3>
                <pre className="draft">{inspect.draft}</pre>
                <button
                  onClick={() =>
                    navigator.clipboard
                      .writeText(inspect.draft || "")
                      .catch(() =>
                        setError(
                          "Clipboard unavailable; select and copy the draft.",
                        ),
                      )
                  }
                >
                  Copy draft
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {confirmDelete && (
        <div className="modal-backdrop">
          <section className="modal small">
            <h2>Delete activity history?</h2>
            <p>
              This removes all stored activity and detected opportunities.
              Existing workflow snapshots remain.
            </p>
            <div className="modal-actions">
              <button onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                className="primary"
                onClick={async () => {
                  await act("deleteHistory");
                  setConfirmDelete(false);
                }}
              >
                Delete history
              </button>
            </div>
          </section>
        </div>
      )}
      {error && (
        <div className="toast" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
function Toggle({ on, click }: { on: boolean; click: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label="Toggle setting"
      className={"toggle " + (on ? "on" : "")}
      onClick={click}
    >
      <span />
    </button>
  );
}
function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function Setting({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
