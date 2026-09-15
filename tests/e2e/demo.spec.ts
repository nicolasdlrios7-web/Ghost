import { test, expect, _electron as electron } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
test("complete desktop demo, persistence, draft, privacy and reset", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ghost-e2e-"));
  const errors: string[] = [];
  let app = await electron.launch({
    args: ["."],
    env: { ...process.env, GHOST_DATA_DIR: dir, OPENAI_API_KEY: "" },
  });
  let page = await app.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.getByText("Your computer knows")).toBeVisible();
  await page.getByRole("button", { name: "Try Demo" }).click();
  await expect(
    page.getByText("DEMO MODE", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Analyze patterns" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Weekly reporting", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({
    animations: "disabled",
    path: "docs/screenshots/02-opportunities.png",
  });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({
    animations: "disabled",
    path: "docs/screenshots/01-home.png",
  });
  await page.getByRole("button", { name: "View opportunity" }).click();
  await page.getByRole("button", { name: "See the evidence" }).click();
  await expect(page.locator(".evidence-chain>div")).toHaveCount(12);
  await page.waitForTimeout(350);
  await page.screenshot({
    animations: "disabled",
    path: "docs/screenshots/03-evidence.png",
  });
  await page.getByRole("button", { name: "Automate this" }).click();
  await expect(
    page.getByRole("heading", { name: "Your workflow is ready." }),
  ).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({
    animations: "disabled",
    path: "docs/screenshots/04-workflow.png",
  });
  await page.getByRole("button", { name: "Activate workflow" }).click();
  await expect(
    page.getByText("WORKFLOW ACTIVATED", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({
    animations: "disabled",
    path: "docs/screenshots/05-active.png",
  });
  await page.getByRole("button", { name: "View your automation" }).click();
  await page.getByRole("button", { name: "Inspect & run draft" }).click();
  await page.getByRole("button", { name: "Generate local draft" }).click();
  await expect(page.locator(".draft")).toContainText("12,480");
  await page.screenshot({
    animations: "disabled",
    path: "docs/screenshots/06-report-studio.png",
  });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await app.close();
  app = await electron.launch({
    args: ["."],
    env: { ...process.env, GHOST_DATA_DIR: dir, OPENAI_API_KEY: "" },
  });
  page = await app.firstWindow();
  await page.getByRole("button", { name: "Automations", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Weekly reporting", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Automations", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your next workflow starts with a pattern.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A clean slate." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume observation" }).click();
  await page.waitForTimeout(6500);
  const state = await page.evaluate(() => window.ghost.state());
  expect(state.events.length).toBeGreaterThan(0);
  expect(state.events[0].source).toBe("live");
  await page.getByRole("button", { name: "Pause observation" }).click();
  await page.getByRole("button", { name: "Delete history" }).click();
  await page
    .locator(".modal")
    .getByRole("button", { name: "Delete history" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A clean slate." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await app.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
