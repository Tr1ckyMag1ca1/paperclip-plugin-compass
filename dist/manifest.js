const manifest = {
  id: "paperclip-plugin-compass",
  apiVersion: 1,
  version: "0.2.0",
  displayName: "Compass",
  description: "Strategic consultant for AI company lifecycle \u2014 diagnose, found, revive, reposition",
  author: "Paperclip AI",
  categories: ["ui", "automation"],
  capabilities: [
    "ui.page.register",
    "ui.sidebar.register",
    "agents.read",
    "agents.pause",
    "agents.resume",
    "issues.read",
    "issues.create",
    "issues.update",
    "issues.wakeup",
    "issue.comments.read",
    "issue.comments.create",
    "issue.documents.read",
    "issue.documents.write",
    "plugin.state.read",
    "plugin.state.write",
    "companies.read",
    "activity.log.write",
    "events.subscribe",
    "events.emit",
    "jobs.schedule"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
  ui: {
    slots: [
      {
        type: "page",
        id: "compass-page",
        displayName: "Compass",
        exportName: "MainPanel",
        routePath: "compass"
      },
      {
        type: "sidebar",
        id: "compass-sidebar-link",
        displayName: "Compass",
        exportName: "SidebarLink"
      }
    ]
  }
};
var manifest_default = manifest;
export {
  manifest_default as default
};
//# sourceMappingURL=manifest.js.map
