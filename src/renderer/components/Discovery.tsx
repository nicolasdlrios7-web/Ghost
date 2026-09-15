import React, { useEffect, useState } from "react";
import {
  ScanLine,
  Check,
  ArrowRight,
  Shield,
  Clock,
  Search,
  Command,
  X,
} from "lucide-react";
import type { ActivityEvent, Opportunity } from "../../shared/types";
export function DiscoveryProgress({ count }: { count: number }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(2, s + 1)), 550);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="modal-backdrop">
      <div className="discovery-progress" role="status">
        <div className="scan-orbit">
          <ScanLine size={32} />
        </div>
        <div className="eyebrow">MAKING THE INVISIBLE, VISIBLE</div>
        <h1>Connecting the dots.</h1>
        <p>Looking for the work that keeps coming back.</p>
        <div className="discovery-stages">
          {[
            `${count} sessions in context`,
            "Matching repeated app sequences",
            "Preparing evidence-backed suggestions",
          ].map((s, i) => (
            <div key={s} className={i <= stage ? "visible" : ""}>
              {i < stage ? (
                <Check size={15} />
              ) : (
                <span className={i === stage ? "spinner" : "stage-dot"} />
              )}
              <span>{s}</span>
            </div>
          ))}
        </div>
        <small>
          <Shield size={12} /> Structured context. No screenshots.
        </small>
      </div>
    </div>
  );
}
const palette = [
  "#87b9d6",
  "#b0c9a3",
  "#c2a8db",
  "#d3b584",
  "#80bfb8",
  "#bcb7a7",
];
export function Rhythm({
  events,
  opportunity,
  onExplore,
}: {
  events: ActivityEvent[];
  opportunity?: Opportunity;
  onExplore: () => void;
}) {
  const days = [
    ...new Set(events.map((e) => new Date(e.startedAt).toDateString())),
  ].slice(-4);
  const apps = [...new Set(events.map((e) => e.app))];
  if (!events.length) return null;
  return (
    <section className="rhythm">
      <div className="section-head">
        <div>
          <div className="eyebrow">YOUR WORK HAS A RHYTHM</div>
          <h2>
            {opportunity
              ? "Different days. The same detour."
              : "A little context, coming together."}
          </h2>
        </div>
        <span className="subtle">
          {events[0].source === "demo"
            ? "Sample sessions"
            : "Observed sessions"}
        </span>
      </div>
      <div className="rhythm-days">
        {days.map((day) => {
          const sessions = events.filter(
            (e) => new Date(e.startedAt).toDateString() === day,
          );
          return (
            <div className="rhythm-day" key={day}>
              <time>
                {new Date(day).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <div className="rhythm-track">
                {sessions.map((e) => (
                  <button
                    key={e.id}
                    title={`${e.app} · ${e.windowTitle || "App context"} · ${Math.round(e.durationSeconds / 60)} min`}
                    aria-label={`Inspect ${e.app} session`}
                    onClick={onExplore}
                    style={{
                      flex: Math.max(e.durationSeconds, 60),
                      background: palette[apps.indexOf(e.app) % palette.length],
                      opacity:
                        opportunity && !opportunity.evidenceIds.includes(e.id)
                          ? 0.18
                          : 0.8,
                    }}
                  />
                ))}
              </div>
              <span>
                {Math.round(
                  sessions.reduce((n, e) => n + e.durationSeconds, 0) / 60,
                )}
                m
              </span>
            </div>
          );
        })}
      </div>
      {opportunity && (
        <div className="rhythm-insight">
          <ScanLine size={17} />
          <div>
            <strong>{opportunity.recurrence} times. The same pattern.</strong>
            <span>
              Highlighted sessions connect {opportunity.sequence.join(" → ")}.
            </span>
          </div>
        </div>
      )}
      <div className="rhythm-legend">
        {apps.slice(0, 6).map((app, i) => (
          <span key={app}>
            <i style={{ background: palette[i] }} />
            {app}
          </span>
        ))}
        <button className="text-button" onClick={onExplore}>
          Explore the context <ArrowRight size={12} />
        </button>
      </div>
    </section>
  );
}
export function EvidenceGroups({
  events,
  opportunity,
}: {
  events: ActivityEvent[];
  opportunity: Opportunity;
}) {
  const relevant = opportunity.evidenceIds
    .map((id) => events.find((e) => e.id === id))
    .filter((e): e is ActivityEvent => !!e);
  const groups: ActivityEvent[][] = [];
  for (let i = 0; i < relevant.length; i += opportunity.sequence.length)
    groups.push(relevant.slice(i, i + opportunity.sequence.length));
  return (
    <div className="evidence-groups">
      {groups.map((group, i) => (
        <div className="evidence-group" key={i}>
          <div>
            <span className="evidence-number">0{i + 1}</span>
            <strong>
              {new Date(group[0].startedAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </strong>
            <span>
              <Clock size={12} />
              {Math.round(
                group.reduce((s, e) => s + e.durationSeconds, 0) / 60,
              )}{" "}
              min
            </span>
          </div>
          <div className="evidence-chain">
            {group.map((e, k) => (
              <React.Fragment key={e.id}>
                {k > 0 && <ArrowRight size={12} />}
                <div>
                  <strong>{e.app}</strong>
                  <span>{e.windowTitle || "App-level context"}</span>
                  <small>{Math.round(e.durationSeconds / 60)} minutes</small>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
export function CommandPalette({
  close,
  navigate,
  analyze,
  demo,
}: {
  close: () => void;
  navigate: (page: string) => void;
  analyze: () => void;
  demo: () => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const actions = [
    ...["Home", "Opportunities", "Automations", "Activity", "Settings"].map(
      (page) => ({
        label: `Go to ${page}`,
        action: () => navigate(page),
        hint: "Navigation",
      }),
    ),
    { label: "Analyze patterns", action: analyze, hint: "Discovery" },
    { label: "Reload sample workday", action: demo, hint: "Demo" },
  ].filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="modal-backdrop palette-backdrop" onClick={close}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Quick actions"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="palette-input">
          <Search size={19} />
          <input
            autoFocus
            aria-label="Search actions"
            placeholder="Where would you like to go?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(actions.length - 1, i + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter" && actions[index]) {
                actions[index].action();
                close();
              }
            }}
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-results">
          {actions.map((a, i) => (
            <button
              className={i === index ? "focused" : ""}
              key={a.label}
              onClick={() => {
                a.action();
                close();
              }}
            >
              <Command size={15} />
              {a.label}
              <span>{a.hint}</span>
              <ArrowRight size={13} />
            </button>
          ))}
          {!actions.length && <p>No matching actions.</p>}
        </div>
        <div className="palette-footer">
          ↑ ↓ to navigate <span>↵ to open</span>
          <span>Ghost, a keystroke away.</span>
        </div>
      </section>
    </div>
  );
}
