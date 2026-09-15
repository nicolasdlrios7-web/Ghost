import { test, expect, _electron as electron } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
test("report studio imports, calculates, exports, retains history and supports quick actions", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ghost-studio-"));
  const app = await electron.launch({
    args: ["."],
    env: { ...process.env, GHOST_DATA_DIR: dir, OPENAI_API_KEY: "" },
  });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Try Demo" }).click();
    await page.evaluate(async () => {
      await window.ghost.command("analyze");
      const s = await window.ghost.state();
      await window.ghost.command("activate", {
        id: s.opportunities[0].id,
        trigger: "Every Friday",
        steps: s.opportunities[0].steps,
      });
    });
    await page.keyboard.press("Meta+k");
    await page
      .getByRole("textbox", { name: "Search actions" })
      .fill("Automations");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Inspect & run draft" }).click();
    await page.getByRole("button", { name: "Generate local draft" }).click();
    await expect(page.locator(".report-metrics")).toContainText("+14.0%");
    const input = path.join(dir, "metrics.csv");
    const output = path.join(dir, "report.md");
    fs.writeFileSync(
      input,
      "Metric,Previous,Current\nRevenue,1000,1250\n\nNext week: Interview customers.",
    );
    await app.evaluate(({ dialog }, file) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [file],
      });
    }, input);
    await page.getByRole("button", { name: "Import CSV or text" }).click();
    await expect(
      page.getByRole("textbox", { name: "Source context" }),
    ).toHaveValue(/Revenue,1000,1250/);
    await page.getByRole("button", { name: "Generate local draft" }).click();
    await expect(page.locator(".report-metrics")).toContainText("+25.0%");
    await app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: file });
    }, output);
    await page.getByRole("button", { name: "Export .md" }).click();
    await expect(page.getByRole("status")).toContainText("Exported");
    expect(fs.readFileSync(output, "utf8")).toContain(
      "| Revenue | 1000 | 1250 | +25.0% |",
    );
    const state = await page.evaluate(() => window.ghost.state());
    expect(state.automations[0].runs).toHaveLength(2);
    await page
      .getByRole("combobox", { name: "Report run history" })
      .selectOption(state.automations[0].runs![1].id);
    await expect(page.locator(".report-metrics")).toContainText("12,480");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Report workspace" }),
    ).not.toBeVisible();
    await page.getByRole("button", { name: "Quick actions" }).click();
    await expect(
      page.getByRole("dialog", { name: "Quick actions" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    // A dismissed opportunity must stay dismissed after subsequent analysis.
    await page.evaluate(async () => {
      const s = await window.ghost.state();
      await window.ghost.command("dismiss", s.opportunities[0].id);
      await window.ghost.command("analyze");
    });
    expect(
      (await page.evaluate(() => window.ghost.state())).opportunities,
    ).toHaveLength(2);
  } finally {
    await app.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
