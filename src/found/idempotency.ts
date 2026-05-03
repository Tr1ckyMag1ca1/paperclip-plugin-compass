/**
 * Idempotency Key Generation and Validation
 *
 * Per XC-03 (D-10, PITFALLS Pitfall 1): prevents duplicate wakeup requests on retry.
 * Idempotency key format is deterministic: same inputs always produce same key.
 *
 * Idempotency keys are namespaced by mode:
 * - FOUND mode: compass:found:${company_id}:${agent_id}:${run_id}
 * - ASSESS mode: compass:assess:${company_id}:${assess_run_id}:${agent_id}
 *
 * All agent_wakeup_requests inserts must include an idempotency key that is:
 * 1. Unique to the change (company + agent + run)
 * 2. Stable across retries (same inputs = same key)
 * 3. Validated before insert (format check + existence check in adapter)
 */

import { randomUUID } from "node:crypto";

/**
 * Generate an idempotency key for a wakeup request.
 *
 * Per D-10, format is: compass:found:${company_id}:${agent_id}:${apply_run_id}
 * - company_id: the company being founded
 * - agent_id: the specific agent being woken up
 * - apply_run_id: UUID per Apply attempt (stable across retries)
 *
 * Same inputs always produce same key (deterministic).
 * No cryptographic hashing needed — string concat is sufficient.
 *
 * @param companyId Company ID (e.g., "acme-corp-123")
 * @param agentId Agent ID (e.g., "agent-ceo-456")
 * @param applyRunId Apply run UUID (e.g., "f47ac10b-58cc-4372-a567-0e02b2c3d479")
 * @returns Idempotency key in format compass:found:{company}:{agent}:{runId}
 */
export function generateIdempotencyKey(companyId: string, agentId: string, applyRunId: string): string {
  return `compass:found:${companyId}:${agentId}:${applyRunId}`;
}

/**
 * Validate an idempotency key format.
 *
 * Per XC-03, key must match: compass:found:[non-empty]:[non-empty]:[non-empty]
 * Used before queuing to catch malformed keys early.
 *
 * @param key Idempotency key to validate
 * @returns True if key matches expected format, false otherwise
 */
export function isValidIdempotencyKey(key: string): boolean {
  const pattern = /^compass:found:[^:]+:[^:]+:[^:]+$/;
  return pattern.test(key);
}

/**
 * Generate a unique Apply run ID.
 *
 * Per D-10, each Apply attempt gets a UUID that serves as the unique identifier
 * for that run. This UUID is included in idempotency keys for all wakeups created
 * during that Apply. Retries of the same Apply use the same run ID to maintain key stability.
 *
 * UUID v4 is preferred (random, universally unique).
 *
 * @returns UUID v4 string (e.g., "f47ac10b-58cc-4372-a567-0e02b2c3d479")
 */
export function generateApplyRunId(): string {
  return randomUUID();
}

/**
 * Generate an idempotency key for Assess mode drift runs.
 *
 * Per D-03 (XC-03) and Phase 3 Plan 1, drift detection and cascade wakeups
 * use assess-namespaced idempotency keys to distinguish from Found mode wakeups.
 *
 * Format: compass:assess:${company_id}:${assess_run_id}:${agent_id}
 * - company_id: the company being audited
 * - assess_run_id: UUID per Assess run (stable across retries)
 * - agent_id: the specific agent being woken up (for cascade)
 *
 * Same inputs always produce same key (deterministic).
 *
 * @param companyId Company ID (e.g., "acme-corp-123")
 * @param assessRunId Assess run UUID (e.g., "f47ac10b-58cc-4372-a567-0e02b2c3d479")
 * @param agentId Agent ID to wake up (e.g., "agent-ceo-456")
 * @returns Idempotency key in format compass:assess:{company}:{runId}:{agent}
 */
export function generateAssessIdempotencyKey(
  companyId: string,
  assessRunId: string,
  agentId: string
): string {
  return `compass:assess:${companyId}:${assessRunId}:${agentId}`;
}

/**
 * Validate an assess-mode idempotency key format.
 *
 * Per XC-03, key must match: compass:assess:[non-empty]:[non-empty]:[non-empty]
 * Used before queuing to catch malformed keys early.
 *
 * @param key Idempotency key to validate
 * @returns True if key matches expected assess format, false otherwise
 */
export function isValidAssessIdempotencyKey(key: string): boolean {
  const pattern = /^compass:assess:[^:]+:[^:]+:[^:]+$/;
  return pattern.test(key);
}

/**
 * Generate an idempotency key for Revive mode action execution.
 *
 * Per D-11 (XC-03), Revive actions (replace-blocker, reassign, nudge, etc.)
 * use revive-namespaced idempotency keys to distinguish from Found/Assess mode.
 *
 * Format: compass:revive:${company_id}:${action_id}:${attempt}
 * - company_id: the company being revived
 * - action_id: the specific action being executed (e.g., "action-single-blocker-1")
 * - attempt: the attempt number (1, 2, 3...) for retries
 *
 * Same inputs always produce same key (deterministic).
 *
 * @param companyId Company ID (e.g., "acme-corp-123")
 * @param actionId Action ID (e.g., "action-single-blocker-1")
 * @param attempt Attempt number for this action (e.g., 1)
 * @returns Idempotency key in format compass:revive:{company}:{actionId}:{attempt}
 */
export function generateReviveActionKey(
  companyId: string,
  actionId: string,
  attempt: number
): string {
  return `compass:revive:${companyId}:${actionId}:${attempt}`;
}

/**
 * Validate a revive-mode idempotency key format.
 *
 * Per XC-03, key must match: compass:revive:[non-empty]:[non-empty]:[non-empty]
 * Used before queuing to catch malformed keys early.
 *
 * @param key Idempotency key to validate
 * @returns True if key matches expected revive format, false otherwise
 */
export function isValidReviveIdempotencyKey(key: string): boolean {
  const pattern = /^compass:revive:[^:]+:[^:]+:[^:]+$/;
  return pattern.test(key);
}
