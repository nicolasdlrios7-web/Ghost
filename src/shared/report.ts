export interface ReportMetric {
  label: string;
  current: number;
  previous: number;
  changePercent: number | null;
}
export interface ReportSection {
  title: string;
  items: string[];
}
export interface Report {
  title: string;
  createdAt: number;
  metrics: ReportMetric[];
  sections: ReportSection[];
  sourceLines: number;
  sample: boolean;
  reviewedAt?: number;
  engine: "local" | "ai" | "local-fallback";
}
export interface ReportRun {
  id: string;
  report: Report;
  markdown: string;
}
/** Handles quoted fields, embedded commas, CRLF, and escaped quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function buildReport(title: string, context: string): Report {
  const rows = parseCSV(context);
  const headerIndex = rows.findIndex(
    (r) =>
      r[0]?.toLowerCase() === "metric" &&
      r.some((v) => v.toLowerCase() === "current"),
  );
  const metrics: ReportMetric[] = [];
  const consumed = new Set<string>();
  if (headerIndex >= 0) {
    const header = rows[headerIndex].map((s) => s.toLowerCase());
    const previous = header.indexOf("previous"),
      current = header.indexOf("current");
    for (const row of rows.slice(headerIndex + 1)) {
      if (row.length < 3) break;
      const a = Number(row[previous]?.replace(/[$,% ]/g, "")),
        b = Number(row[current]?.replace(/[$,% ]/g, ""));
      if (
        !row[0] ||
        !row[previous]?.trim() ||
        !row[current]?.trim() ||
        !Number.isFinite(a) ||
        !Number.isFinite(b)
      )
        continue;
      metrics.push({
        label: row[0],
        previous: a,
        current: b,
        changePercent: a === 0 ? null : ((b - a) / Math.abs(a)) * 100,
      });
      consumed.add(row[0]);
    }
  }
  const lines = context
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(
      (s) => s && !/^metric,/i.test(s) && !consumed.has(parseCSV(s)[0]?.[0]),
    );
  const actions = lines.filter((s) =>
    /next|todo|to-do|action|follow.up|plan|blocked|risk|open question/i.test(s),
  );
  const updates = lines.filter((s) => !actions.includes(s));
  const highlights = metrics.map(
    (m) =>
      `${m.label}: ${m.current.toLocaleString("en-US")}${m.changePercent === null ? " (no percentage baseline)" : ` (${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(1)}% vs. previous period)`}.`,
  );
  return {
    title,
    createdAt: Date.now(),
    metrics,
    sourceLines: context.split("\n").filter(Boolean).length,
    sample: context.trim() === SAMPLE_CONTEXT.trim(),
    engine: "local",
    sections: [
      {
        title: "At a glance",
        items: highlights.length ? highlights : updates.slice(0, 3),
      },
      { title: "Updates & context", items: updates },
      { title: "Next steps & open questions", items: actions },
    ],
  };
}
export function reportMarkdown(report: Report): string {
  return (
    `# ${report.title}\n\n${new Date(report.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${report.sample ? "Sample data · " : ""}${report.reviewedAt ? "Reviewed" : "Draft for review"}\n\n` +
    (report.metrics.length
      ? "| Metric | Previous | Current | Change |\n| --- | ---: | ---: | ---: |\n" +
        report.metrics
          .map(
            (m) =>
              `| ${m.label.replace(/\|/g, "/")} | ${m.previous} | ${m.current} | ${m.changePercent === null ? "—" : `${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(1)}%`} |`,
          )
          .join("\n") +
        "\n\n"
      : "") +
    report.sections
      .map(
        (s) =>
          `## ${s.title}\n\n${s.items.length ? s.items.map((i) => "- " + i).join("\n") : "_No information supplied. Add context before sharing._"}`,
      )
      .join("\n\n") +
    `\n\n---\nPrepared by Ghost from supplied context. ${report.engine === "ai" ? "Narrative interpreted with AI." : "Local extractive draft."} No external sources fetched. Review before sharing.\n`
  );
}
export const SAMPLE_CONTEXT = `Metric,Previous,Current\nWebsite visitors,10947,12480\nTrial signups,354,386\nActivated accounts,142,168\n\nCustomer update: We shipped the simplified onboarding flow on Tuesday.\nCustomer feedback: Two customers requested CSV exports for weekly reporting.\nTeam update: The dashboard performance fix is live.\nNext week: Validate whether the onboarding changes improve activation.\nOpen question: Confirm the reporting export timeline with engineering.`;
