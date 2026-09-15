import { z } from "zod";
import type { ActivityEvent, Opportunity } from "./types";
export const hoursPerYear = (minutes: number) => (minutes * 52) / 60;
export function sampleDay(): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const day = new Date();
  const sinceFriday = (day.getDay() + 2) % 7 || (day.getHours() < 9 ? 7 : 0);
  day.setDate(day.getDate() - sinceFriday - 21);
  day.setHours(9, 0, 0, 0);
  const base = day.getTime();
  const flows = [
    {
      apps: ["Chrome", "Mail", "Notion"],
      titles: [
        "Analytics · weekly metrics",
        "Weekly customer updates",
        "Weekly report",
      ],
      minutes: [12, 8, 18],
    },
    {
      apps: ["Zoom", "Notes", "Mail"],
      titles: ["Project standup", "Meeting notes", "Follow-up draft"],
      minutes: [25, 6, 9],
    },
    {
      apps: ["Downloads", "Finder", "Project folders"],
      titles: ["Project assets", "Sort downloaded files", "Client project"],
      minutes: [2, 3, 3],
    },
  ];
  for (let week = 0; week < 4; week++)
    flows.forEach((flow, j) => {
      let time = base + week * 7 * 86400000 + j * 3600000;
      flow.apps.forEach((app, k) => {
        events.push({
          id: `demo-${week}-${j}-${k}`,
          app,
          windowTitle: flow.titles[k],
          startedAt: time,
          durationSeconds: flow.minutes[k] * 60,
          source: "demo",
        });
        time += flow.minutes[k] * 60000;
      });
    });
  return events;
}
export function detect(events: ActivityEvent[]): Opportunity[] {
  const groups = new Map<string, ActivityEvent[][]>();
  for (let i = 0; i <= events.length - 3; i++) {
    const chunk = events.slice(i, i + 3);
    if (
      new Set(chunk.map((e) => e.app)).size < 3 ||
      chunk.some((e) => e.source !== chunk[0].source)
    )
      continue;
    if (
      chunk.some(
        (e, k) =>
          k > 0 &&
          e.startedAt -
            (chunk[k - 1].startedAt + chunk[k - 1].durationSeconds * 1000) >
            120000,
      )
    )
      continue;
    const key = chunk.map((e) => e.app).join(" → ");
    groups.set(key, [...(groups.get(key) || []), chunk]);
  }
  const candidates = [...groups]
    .filter(([, v]) => v.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);
  const used = new Set<string>();
  const result: Opportunity[] = [];
  for (const [, chunks] of candidates) {
    if (chunks.flat().some((e) => used.has(e.id))) continue;
    chunks.flat().forEach((e) => used.add(e.id));
    const apps = chunks[0].map((e) => e.app);
    const repeatedContext = chunks.every((chunk) =>
      chunk.every(
        (event, index) =>
          Boolean(event.windowTitle) &&
          event.windowTitle === chunks[0][index].windowTitle,
      ),
    );
    const reporting =
      /chrome|safari/i.test(apps[0]) &&
      /mail/i.test(apps[1]) &&
      apps[2] === "Notion" &&
      repeatedContext &&
      /analytics|metrics/i.test(chunks[0][0].windowTitle || "");
    const meeting =
      /zoom/i.test(apps[0]) && /notes/i.test(apps[1]) && /mail/i.test(apps[2]);
    const minutes = Math.round(
      chunks.reduce(
        (sum, c) => sum + c.reduce((s, e) => s + e.durationSeconds, 0),
        0,
      ) /
        chunks.length /
        60,
    );
    result.push({
      id: `${chunks[0][0].source}-${apps.join("-")}`,
      title: reporting
        ? "Weekly reporting"
        : meeting
          ? "Meeting follow-up"
          : apps[0] === "Downloads"
            ? "Project file organization"
            : `${apps[0]} to ${apps[2]} workflow`,
      description: reporting
        ? "Repeated analytics, customer-update, and report contexts suggest a weekly reporting workflow. You may be collecting metrics and transferring them into the same report."
        : meeting
          ? "Meetings are repeatedly followed by note taking and an email draft. A prepared follow-up could shorten the handoff."
          : "The same sequence of applications appears repeatedly. Review these sessions to decide whether a draft workflow would help.",
      confidence: repeatedContext ? 0.94 : 0.76,
      recurrence: chunks.length,
      minutes: meeting
        ? Math.round(
            chunks.reduce(
              (total, chunk) =>
                total +
                chunk
                  .slice(1)
                  .reduce((sum, event) => sum + event.durationSeconds, 0),
              0,
            ) /
              chunks.length /
              60,
          )
        : minutes,
      sequence: apps,
      evidenceIds: chunks.flat().map((e) => e.id),
      steps: reporting
        ? [
            "Collect supplied metrics",
            "Gather supplied updates",
            "Summarize meaningful changes",
            "Prepare weekly report draft",
            "Ask before finalizing",
          ]
        : [
            "Review supplied context",
            "Summarize key information",
            "Prepare a draft",
            "Ask before finalizing",
          ],
      source: chunks[0][0].source,
      engine: "local",
    });
  }
  return result;
}
export const aiSchema = z
  .object({
    opportunities: z
      .array(
        z
          .object({
            id: z.string(),
            title: z.string().min(1).max(90),
            description: z.string().min(1).max(700),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(10),
  })
  .strict();
export function applyAI(raw: unknown, local: Opportunity[]): Opportunity[] {
  const parsed = aiSchema.parse(raw);
  return local.map((o) => {
    const interpretation = parsed.opportunities.find((p) => p.id === o.id);
    return interpretation ? { ...o, ...interpretation, engine: "ai" } : o;
  });
}
