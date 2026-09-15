import React, { useState } from "react";
import {
  X,
  FileText,
  ArrowRight,
  Upload,
  Download,
  Copy,
  Check,
  Shield,
  Sparkles,
  Clock,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import type { Automation, State, Command } from "../../shared/types";
import { SAMPLE_CONTEXT } from "../../shared/report";
export function ReportStudio({
  automation,
  state,
  act,
  close,
}: {
  automation: Automation;
  state: State;
  act: (command: Command, payload?: unknown) => Promise<State | undefined>;
  close: () => void;
}) {
  const [current, setCurrent] = useState(automation);
  const [context, setContext] = useState(
    automation.opportunity.source === "demo" ? SAMPLE_CONTEXT : "",
  );
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const [runId, setRunId] = useState("");
  const [error, setError] = useState("");
  const [imported, setImported] = useState("");
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState<string[]>([]);
  async function updateReport(command: "saveReport" | "reviewReport") {
    const next = await act(command, {
      id: current.id,
      runId: runId || undefined,
      ...(command === "saveReport"
        ? {
            sections: report?.sections.map((section, i) => ({
              ...section,
              items: edited[i]
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })),
          }
        : {}),
    });
    const updated = next?.automations.find((a) => a.id === current.id);
    if (updated) {
      setCurrent(updated);
      setEditing(false);
      setNotice(
        command === "saveReport"
          ? "Changes saved. Review the updated draft."
          : "Marked as reviewed. Ready to export.",
      );
    }
  }
  const historic = current.runs?.find((r) => r.id === runId);
  const report = historic?.report || current.report;
  const draft = historic?.markdown || current.draft;
  async function run(ai = false) {
    setWorking(true);
    setError("");
    try {
      const next = await act("runAutomation", { id: current.id, context, ai });
      const updated = next?.automations.find((a) => a.id === current.id);
      if (updated) {
        setCurrent(updated);
        setRunId("");
        setNotice("Draft prepared. Ready for your review.");
      }
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="modal-backdrop studio-backdrop">
      <section
        className="report-studio"
        role="dialog"
        aria-modal="true"
        aria-label="Report workspace"
      >
        <div className="studio-header">
          <div className="studio-brand">
            <span className="studio-icon">
              <FileText size={19} />
            </span>
            <div>
              <h2>{current.opportunity.title}</h2>
              <span>REPORT WORKSPACE</span>
            </div>
          </div>
          <div className="button-group">
            {current.runs?.length ? (
              <select
                aria-label="Report run history"
                value={runId}
                onChange={(e) => {
                  setRunId(e.target.value);
                  setEditing(false);
                }}
              >
                <option value="">Latest draft</option>
                {current.runs.map((r, i) => (
                  <option key={r.id} value={r.id}>
                    Run {current.runs!.length - i} ·{" "}
                    {new Date(r.report.createdAt).toLocaleTimeString()}
                  </option>
                ))}
              </select>
            ) : null}
            <button className="icon-button" aria-label="Close" onClick={close}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="studio-body">
          <aside className="source-panel">
            <div className="eyebrow">01 / SOURCE MATERIAL</div>
            <h2>
              Good context.
              <br />A better report.
            </h2>
            <p>
              Bring the numbers and updates.
              <br />
              Ghost handles the first draft.
            </p>
            <div className="source-file">
              <FileText size={16} />
              <div>
                {imported ||
                  (current.opportunity.source === "demo"
                    ? "sample-weekly-metrics.csv"
                    : "Your source context")}
                <small>
                  {imported
                    ? "IMPORTED · LOCAL"
                    : current.opportunity.source === "demo"
                      ? "SAMPLE · EDITABLE"
                      : "LOCAL · NEVER FETCHED AUTOMATICALLY"}
                </small>
              </div>
            </div>
            <textarea
              aria-label="Source context"
              readOnly={working}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={
                "Metric,Previous,Current\nSignups,354,386\n\nCustomer updates…\nNext week…"
              }
            />
            <button
              className="import-button"
              disabled={working}
              onClick={async () => {
                try {
                  const file = await window.ghost.importContext();
                  if (file) {
                    setContext(file.text);
                    setImported(file.name);
                  }
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              <Upload size={14} /> Import CSV or text
            </button>
            <div className="source-help">
              CSV columns: <code>Metric, Previous, Current</code>. Add
              plain-text updates below. Percentage changes are calculated
              locally.
            </div>
            <div className="studio-generate">
              <button
                className="primary"
                disabled={!context.trim() || working || !current.active}
                onClick={() => run()}
              >
                {working ? (
                  <span className="spinner" />
                ) : (
                  <FileText size={15} />
                )}{" "}
                {working ? "Preparing draft…" : "Generate local draft"}
                <ArrowRight size={15} />
              </button>
              {state.settings.aiEnabled && state.settings.hasKey && (
                <button
                  disabled={!context.trim() || working || !current.active}
                  onClick={() => run(true)}
                >
                  <Sparkles size={15} /> Generate with AI
                </button>
              )}
              <small>
                <Shield size={12} /> You review every draft. Nothing is sent to
                other people.
              </small>
              {state.settings.aiEnabled && state.settings.hasKey && (
                <small>
                  “Generate with AI” sends this source context to OpenAI.
                </small>
              )}
            </div>
          </aside>
          <div className="report-panel">
            <div className="report-toolbar">
              <span>
                <span className="dot" />
                {working
                  ? "Preparing"
                  : report
                    ? "Ready for review"
                    : "Awaiting your context"}
              </span>
              <div className="button-group">
                <button
                  disabled={!draft}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(draft || "");
                      setNotice("Copied to clipboard.");
                    } catch {
                      setError("Copy unavailable. Export the report instead.");
                    }
                  }}
                >
                  <Copy size={13} /> Copy
                </button>
                <button
                  disabled={!draft}
                  onClick={async () => {
                    try {
                      const file = await window.ghost.exportReport(
                        current.id,
                        runId || undefined,
                      );
                      if (file) setNotice(`Exported to ${file}`);
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  <Download size={13} /> Export .md
                </button>
              </div>
            </div>
            {report && (
              <div className="report-reviewbar">
                <span>
                  {report.reviewedAt
                    ? "Reviewed by you"
                    : "YOUR REVIEW IS THE FINAL STEP"}
                </span>
                <div className="button-group">
                  {editing ? (
                    <>
                      <button onClick={() => setEditing(false)}>Cancel</button>
                      <button onClick={() => updateReport("saveReport")}>
                        Save changes
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={working}
                        onClick={() => {
                          setEdited(
                            report.sections.map((s) => s.items.join("\n")),
                          );
                          setEditing(true);
                        }}
                      >
                        <Pencil size={12} /> Edit draft
                      </button>
                      <button
                        disabled={working || !!report.reviewedAt}
                        onClick={() => updateReport("reviewReport")}
                      >
                        <Check size={12} />
                        {report.reviewedAt ? "Reviewed" : "Mark reviewed"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {report ? (
              <article className="report-paper draft">
                <div className="paper-top">
                  <span>
                    GHOST /{" "}
                    {report.sample ? "SAMPLE REPORT" : "WORKSPACE REPORT"}
                  </span>
                  <span className="paper-status">
                    {report.reviewedAt ? "REVIEWED" : "DRAFT"}
                  </span>
                </div>
                <h1>{report.title}</h1>
                <p className="paper-date">
                  {new Date(report.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  <span>Prepared for your review</span>
                </p>
                {report.metrics.length > 0 && (
                  <div className="report-metrics">
                    {report.metrics.map((m) => (
                      <div key={m.label}>
                        <span>{m.label}</span>
                        <strong>{m.current.toLocaleString("en-US")}</strong>
                        <small
                          className={
                            m.changePercent !== null && m.changePercent < 0
                              ? "negative"
                              : ""
                          }
                        >
                          {m.changePercent === null
                            ? "No baseline"
                            : `${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(1)}%`}{" "}
                          <span>vs. {m.previous.toLocaleString("en-US")}</span>
                        </small>
                      </div>
                    ))}
                  </div>
                )}
                {report.sections.map((section, i) => (
                  <section className="report-section" key={i}>
                    <h3>{section.title}</h3>
                    {editing ? (
                      <textarea
                        className="report-edit"
                        aria-label={`Edit ${section.title}`}
                        value={edited[i]}
                        onChange={(e) =>
                          setEdited(
                            edited.map((s, k) =>
                              k === i ? e.target.value : s,
                            ),
                          )
                        }
                      />
                    ) : section.items.length ? (
                      <ul>
                        {section.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="missing-context">
                        No information supplied. Add context before sharing.
                      </p>
                    )}
                  </section>
                ))}
                <div className="report-provenance">
                  <Shield size={13} />
                  <span>
                    {report.engine === "ai"
                      ? "AI-assisted narrative · calculations verified locally"
                      : report.engine === "local-fallback"
                        ? "AI unavailable · local draft retained"
                        : "Local extractive draft · no AI request"}
                    <br />
                    {report.sourceLines} source lines · No external data fetched
                  </span>
                </div>
              </article>
            ) : (
              <div className="report-empty">
                <div className="empty-paper">
                  <span />
                  <span />
                  <span />
                  <div />
                  <span />
                  <span />
                </div>
                <div className="eyebrow">
                  02 / THE FIRST DRAFT, TAKEN CARE OF
                </div>
                <h2>
                  From scattered context
                  <br />
                  to something you can use.
                </h2>
                <p>
                  Generate a report with calculated metric changes,
                  <br />
                  the key updates, and next steps in one place.
                </p>
                <div className="empty-capabilities">
                  <span>
                    <Check size={13} /> Metric calculations
                  </span>
                  <span>
                    <Check size={13} /> Source-grounded
                  </span>
                  <span>
                    <Check size={13} /> Markdown export
                  </span>
                </div>
              </div>
            )}
            {notice && (
              <div className="studio-notice" role="status">
                <Check size={14} />
                {notice}
              </div>
            )}
            {error && (
              <div className="studio-notice error" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
