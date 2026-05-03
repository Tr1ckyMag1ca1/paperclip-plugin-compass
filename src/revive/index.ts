/**
 * Revive Mode Module
 *
 * Exports all public functions and types for revive mode (Phase 4).
 * Per D-02, D-07, follows the barrel pattern from src/assess/index.ts.
 */

// Pure logic: stall cause classification (no I/O)
export {
  classifyStall,
  scoreBlockerSeverity,
  scoreDriftConfidence,
  scoreIntegrationHealth,
  scoreGovernanceLoop,
  scoreAgentHealth,
} from "./classify.js";

// Future exports (implemented in later waves):
// export { buildActionQueue } from "./queue.js";
// export { performAction, reassignIssue, replaceBlockerIssue, nudgeAgent, pivotToSample, restartAgent } from "./actions.js";
// export { applyActionItem } from "./apply.js";
// export { createSamplePivot } from "./sample-pivot.js";
