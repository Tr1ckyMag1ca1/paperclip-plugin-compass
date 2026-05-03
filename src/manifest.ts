import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "@paperclipai/paperclip-plugin-compass",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Compass",
  description:
    "Strategic consultant for AI company lifecycle — diagnose, found, revive, reposition",
  author: "Paperclip AI",
  categories: ["ui", "automation"],
  minimumPaperclipVersion: "1.0.0",
  capabilities: [
    "ui.sidebarPanel.register",
    "entities.agents.read",
    "entities.issues.read",
    "entities.documents.read",
    "state.worker.write",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "sidebarPanel",
        id: "compass-main-panel",
        displayName: "Compass",
        exportName: "MainPanel",
      },
    ],
  },
};

export default manifest;
