import type { Report, ReportRun } from "./report";
export interface ActivityEvent {
  id: string;
  app: string;
  windowTitle?: string;
  startedAt: number;
  durationSeconds: number;
  source: "live" | "demo";
}
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  confidence: number;
  recurrence: number;
  minutes: number;
  sequence: string[];
  evidenceIds: string[];
  steps: string[];
  source: "live" | "demo";
  engine: "local" | "ai";
}
export interface Automation {
  id: string;
  opportunity: Opportunity;
  active: boolean;
  createdAt: number;
  trigger: string;
  steps: string[];
  lastRun?: number;
  draft?: string;
  report?: Report;
  runs?: ReportRun[];
}
export interface Settings {
  onboarding: boolean;
  monitoring: boolean;
  windowTitles: boolean;
  aiEnabled: boolean;
  model: string;
  hasKey: boolean;
  launchAtLogin: boolean;
}
export interface State {
  settings: Settings;
  events: ActivityEvent[];
  opportunities: Opportunity[];
  automations: Automation[];
  demo: boolean;
  observationStatus: string;
  analysisStatus: string;
  analyzedPatterns: number;
  dismissed: string[];
}
export type Command =
  | "start"
  | "demo"
  | "resetDemo"
  | "analyze"
  | "settings"
  | "deleteHistory"
  | "activate"
  | "toggleAutomation"
  | "deleteAutomation"
  | "runAutomation"
  | "saveReport"
  | "reviewReport"
  | "dismiss";
export interface GhostAPI {
  state: () => Promise<State>;
  command: (command: Command, payload?: unknown) => Promise<State>;
  importContext: () => Promise<{ name: string; text: string } | null>;
  exportReport: (id: string, runId?: string) => Promise<string | null>;
}
declare global {
  interface Window {
    ghost: GhostAPI;
  }
}
