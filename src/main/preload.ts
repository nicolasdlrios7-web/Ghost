import { contextBridge, ipcRenderer } from "electron";
import type { Command } from "../shared/types";
contextBridge.exposeInMainWorld("ghost", {
  importContext: () => ipcRenderer.invoke("ghost:import-context"),
  exportReport: (id: string, runId?: string) =>
    ipcRenderer.invoke("ghost:export-report", id, runId),
  state: () => ipcRenderer.invoke("ghost:state"),
  command: (command: Command, payload: unknown) =>
    ipcRenderer.invoke("ghost:command", command, payload),
});
