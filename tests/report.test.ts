import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildReport,
  parseCSV,
  reportMarkdown,
  SAMPLE_CONTEXT,
} from "../src/shared/report";
test("sample source generates three calculated metrics and grounded sections", () => {
  const report = buildReport("Weekly reporting", SAMPLE_CONTEXT);
  assert.equal(report.metrics.length, 3);
  assert.equal(report.metrics[0].current, 12480);
  assert.equal(report.metrics[0].changePercent?.toFixed(1), "14.0");
  assert.equal(report.metrics[2].changePercent?.toFixed(1), "18.3");
  assert(report.sections[2].items.some((s) => s.includes("Next week")));
  assert(
    !report.sections[1].items.some((s) => s.startsWith("Website visitors,")),
  );
  assert(
    reportMarkdown(report).includes(
      "| Website visitors | 10947 | 12480 | +14.0% |",
    ),
  );
});
test("CSV parser supports quoted commas, escaped quotes, and Windows line endings", () => {
  assert.deepEqual(
    parseCSV(
      'Metric,Previous,Current\r\n"Gross, revenue","1,000","1,250"\r\n"New ""pro"" users",10,20',
    ),
    [
      ["Metric", "Previous", "Current"],
      ["Gross, revenue", "1,000", "1,250"],
      ['New "pro" users', "10", "20"],
    ],
  );
  const report = buildReport(
    "Report",
    'Metric,Previous,Current\n"Gross, revenue","1,000","1,250"',
  );
  assert.equal(report.metrics[0].changePercent, 25);
});
test("zero baselines do not produce Infinity and declining values retain their sign", () => {
  const report = buildReport(
    "Report",
    "Metric,Previous,Current\nNew product,0,100\nRetention,80,72",
  );
  assert.equal(report.metrics[0].changePercent, null);
  assert.equal(report.metrics[1].changePercent, -10);
  assert(!reportMarkdown(report).includes("Infinity"));
});
test("plain text and missing context are explicit, without invented numbers", () => {
  const report = buildReport(
    "Notes",
    "Customer update: Search shipped.\nNext week: Review feedback.",
  );
  assert.equal(report.metrics.length, 0);
  assert.equal(report.sections[2].items.length, 1);
  assert.equal(buildReport("Empty", "").sections[0].items.length, 0);
});
