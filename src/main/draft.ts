/** Extractive drafting keeps every fact anchored to supplied text. */
export function createDraft(
  title: string,
  context: string,
  steps: string[],
): string {
  const lines = context
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const metrics = lines.filter((s) => /\d/.test(s));
  const next = lines.filter((s) =>
    /next|todo|to-do|action|follow.up|plan|blocked|risk/i.test(s),
  );
  const updates = lines.filter(
    (s) => !metrics.includes(s) && !next.includes(s),
  );
  const section = (name: string, items: string[]) =>
    `${name}\n${items.length ? items.map((s) => "• " + s).join("\n") : "• No information supplied — add before sharing."}`;
  return `${title}\n${new Date().toLocaleDateString()}\n\n${section("Metrics & changes", metrics)}\n\n${section("Updates", updates)}\n\n${section("Next steps & review", next)}\n\nWorkflow checklist\n${steps.map((s) => "□ " + s).join("\n")}\n\nPrepared locally from supplied context. No external data was fetched. Review before sharing.`;
}
