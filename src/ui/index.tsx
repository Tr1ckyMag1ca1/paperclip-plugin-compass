import { MainPanel } from "./MainPanel.js";

/**
 * Export MainPanel component as named export.
 *
 * Matches manifest slot declaration from Plan 1:
 * - ui.slots[0]: sidebarPanel slot with exportName: "MainPanel"
 *
 * Plugin SDK will load this component when Compass is opened in the sidebar.
 */
export { MainPanel };
