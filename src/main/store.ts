import fs from "node:fs";
import path from "node:path";
import type { State } from "../shared/types";
export const freshState = (): State => ({
  settings: {
    onboarding: false,
    monitoring: false,
    windowTitles: false,
    aiEnabled: false,
    model: "gpt-4.1-mini",
    hasKey: false,
    launchAtLogin: false,
  },
  events: [],
  opportunities: [],
  automations: [],
  demo: false,
  observationStatus: "Paused",
  analysisStatus: "Ready",
  analyzedPatterns: 0,
});
export class Store {
  state: State;
  constructor(public file: string) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      this.state = {
        ...freshState(),
        ...parsed,
        settings: { ...freshState().settings, ...parsed.settings },
      };
    } catch {
      this.state = freshState();
    }
  }
  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file + ".tmp", JSON.stringify(this.state, null, 2), {
      mode: 0o600,
    });
    fs.renameSync(this.file + ".tmp", this.file);
  }
}
