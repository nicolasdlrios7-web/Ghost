import { contextBridge, ipcRenderer } from "electron";
import type { Command } from "../shared/types";
contextBridge.exposeInMainWorld("ghost", {
  state: () => ipcRenderer.invoke("ghost:state"),
  command: (command: Command, payload: unknown) =>
    ipcRenderer.invoke("ghost:command", command, payload),
});
