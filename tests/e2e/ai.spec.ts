import { test, expect, _electron as electron } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
test("AI success and malformed response safely retain real evidence", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ghost-ai-test-"));
  const app = await electron.launch({
    args: ["."],
    env: {
      ...process.env,
      GHOST_DATA_DIR: dir,
      OPENAI_API_KEY: "test-fixture-never-sent",
    },
  });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Try Demo" }).click();
    await app.evaluate(() => {
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    opportunities: [
                      {
                        id: "demo-Chrome-Mail-Notion",
                        title: "Weekly reporting, interpreted",
                        description:
                          "The supplied evidence suggests a recurring report.",
                        confidence: 0.9,
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        );
    });
    await page.evaluate(() =>
      window.ghost.command("settings", { aiEnabled: true }),
    );
    await page
      .getByRole("button", { name: "Analyze patterns" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Weekly reporting, interpreted",
        exact: true,
      }),
    ).toBeVisible();
    let state = await page.evaluate(() => window.ghost.state());
    expect(state.opportunities[0].engine).toBe("ai");
    expect(state.opportunities[0].evidenceIds).toHaveLength(12);
    expect(state.opportunities[0].minutes).toBe(38);
    await app.evaluate(() => {
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"opportunities": "invalid"}' } }],
          }),
          { status: 200 },
        );
    });
    await page.getByRole("button", { name: "Analyze patterns" }).click();
    await expect(
      page.getByRole("heading", { name: "Weekly reporting", exact: true }),
    ).toBeVisible();
    state = await page.evaluate(() => window.ghost.state());
    expect(state.analysisStatus).toContain("local results retained");
    expect(state.opportunities[0].engine).toBe("local");
    await page.evaluate(async () => {
      const s = await window.ghost.state();
      await window.ghost.command("activate", {
        id: s.opportunities[0].id,
        trigger: "Every Friday",
        steps: s.opportunities[0].steps,
      });
    });
    await app.evaluate(() => {
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    sections: [
                      {
                        title: "At a glance",
                        items: [
                          "The supplied metrics show an increase in visitors.",
                        ],
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        );
    });
    let drafted = await page.evaluate(async () => {
      const s = await window.ghost.state();
      return window.ghost.command("runAutomation", {
        id: s.automations[0].id,
        context: "Metric,Previous,Current\nVisitors,100,140",
        ai: true,
      });
    });
    expect(drafted.automations[0].report?.engine).toBe("ai");
    expect(drafted.automations[0].report?.metrics[0].changePercent).toBe(40);
    await app.evaluate(() => {
      globalThis.fetch = async () =>
        new Response("Service unavailable", { status: 503 });
    });
    drafted = await page.evaluate(async () => {
      const s = await window.ghost.state();
      return window.ghost.command("runAutomation", {
        id: s.automations[0].id,
        context: "Metric,Previous,Current\nVisitors,100,140",
        ai: true,
      });
    });
    expect(drafted.automations[0].report?.engine).toBe("local-fallback");
    expect(drafted.automations[0].draft).toContain("+40.0%");
  } finally {
    await app.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
