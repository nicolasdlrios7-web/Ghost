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
  } finally {
    await app.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
