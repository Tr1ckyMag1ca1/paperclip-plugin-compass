/**
 * Idempotency Key Generation and Validation for Found Mode
 *
 * Per XC-03 (D-10, PITFALLS Pitfall 1): prevents duplicate wakeup requests on retry.
 * Idempotency key format is deterministic: same inputs always produce same key.
 *
 * All agent_wakeup_requests inserts must include an idempotency key that is:
 * 1. Unique to the change (company + agent + apply run)
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
