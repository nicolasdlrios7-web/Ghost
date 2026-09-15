import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sampleDay,
  detect,
  hoursPerYear,
  applyAI,
} from "../src/shared/detection";
import { Store } from "../src/main/store";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
test("sample reports have four repeats, evidence and correct annual saving", () => {
  const events = sampleDay();
  const results = detect(events);
  assert.equal(results.length, 3);
  const o = results[0];
  assert.equal(o.title, "Weekly reporting");
  assert.equal(o.recurrence, 4);
  assert.equal(o.minutes, 38);
  assert.equal(o.evidenceIds.length, 12);
  assert.equal(Math.round(hoursPerYear(o.minutes)), 33);
  assert(o.evidenceIds.every((id) => events.some((e) => e.id === id)));
});
test("insufficient or interrupted sequences are not opportunities", () => {
  assert.deepEqual(detect(sampleDay().slice(0, 3)), []);
  assert.deepEqual(
    detect(sampleDay().map((e, i) => ({ ...e, startedAt: i * 86400000 }))),
    [],
  );
});
test("malformed AI output is rejected and local result stays intact", () => {
  const local = detect(sampleDay());
  assert.throws(() =>
    applyAI({ opportunities: [{ id: local[0].id, confidence: 5 }] }, local),
  );
  assert.equal(local[0].title, "Weekly reporting");
  const result = applyAI(
    {
      opportunities: [
        {
          id: local[0].id,
          title: "Recurring report",
          description: "Repeated context suggests reporting.",
          confidence: 0.9,
        },
      ],
    },
    local,
  );
  assert.equal(result[0].engine, "ai");
  assert.equal(result[0].minutes, 38);
  assert.deepEqual(result[0].evidenceIds, local[0].evidenceIds);
});
test("state survives atomic persistence", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ghost-store-"));
  try {
    const file = path.join(dir, "state.json");
    const store = new Store(file);
    store.state.events = sampleDay();
    store.state.opportunities = detect(store.state.events);
    store.save();
    assert.deepEqual(new Store(file).state, store.state);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("app-only evidence does not claim specific reporting context", () => {
  const events = sampleDay().map((e) => ({
    ...e,
    windowTitle: undefined,
    source: "live" as const,
  }));
  const result = detect(events);
  assert.notEqual(result[0].title, "Weekly reporting");
  assert.equal(result[0].minutes, 38);
});
