/**
 * Action Queue Serialization and Document Writer
 *
 * Per D-04, D-05: Action queue persists in Paperclip documents table.
 * Queue is the output of the Revive classifier + diagnostic engine,
 * serialized to JSON and stored with idempotency key based on run_id.
 *
 * The queue document:
 * - Lives in Paperclip documents table (not .planning/)
 * - Is keyed by compass:revive:action-queue:${run_id} for idempotency
 * - Persists state: items, addressed_count, status per item
 * - Is updated in-place as founder addresses items (status changes pending → addressed)
 *
 * Per XC-03: Idempotency key prevents duplicate writes on retry.
 * Per XC-01: All writes route through adapter chokepoint.
 */

import type { ActionQueue } from "../types/revive.js";
import { PaperclipAdapter } from "../sdk/adapter.js";

/**
 * Serialize action queue to JSON string.
 *
 * Per D-04: Queue is serialized to JSON for storage in documents table.
 * Uses 2-space indentation for readability.
 *
 * @param queue ActionQueue to serialize
 * @returns JSON string (formatted with indentation)
 */
export function serializeActionQueue(queue: ActionQueue): string {
  return JSON.stringify(queue, null, 2);
}

/**
 * Write action queue document to Paperclip documents table.
 *
 * Per D-04, D-05: Queue is stored as a document with idempotency key.
 * Key format: compass:revive:action-queue:${run_id}
 *
 * Per XC-03: Idempotency key prevents duplicate writes on retry.
 * Same key on retry means document is updated in-place (idempotent write).
 *
 * Document structure:
 * - title: "Revive Action Queue — {run_id}"
 * - body: serialized ActionQueue JSON
 * - idempotency_key: compass:revive:action-queue:{run_id}
 *
 * @param adapter PaperclipAdapter instance for SDK calls
 * @param companyId Company ID for document scope
 * @param queue ActionQueue to persist
 */
export async function writeActionQueueDocument(
  adapter: PaperclipAdapter,
  companyId: string,
  queue: ActionQueue
): Promise<void> {
  const docKey = `compass:revive:action-queue:${queue.run_id}`;
  const serialized = serializeActionQueue(queue);

  await adapter.writeDocument(companyId, docKey, {
    title: `Revive Action Queue — ${queue.run_id}`,
    body: serialized,
    idempotency_key: docKey,
  });
}
