/**
 * Engagement History Store
 *
 * Per D-01, D-03: Single per-company document keyed `compass-engagement-history`
 * in the documents table. Reads are cached in worker-state with TTL 60s to avoid
 * hammering the documents table on every UI render.
 *
 * Body is JSON-formatted markdown: JSON in a fenced code block plus human-readable
 * rendering of recent findings underneath.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { PaperclipAdapter } from "../sdk/adapter.js";
import type { EngagementHistory, Finding } from "../types/memory.js";

const ENGAGEMENT_HISTORY_DOC_KEY = "compass-engagement-history";
const ENGAGEMENT_HISTORY_CACHE_TTL_MS = 60000; // 60 seconds

/**
 * Metadata for cached engagement history (includes TTL tracking).
 */
interface CacheEntry {
  data: EngagementHistory;
  cachedAt: number; // timestamp in ms
  ttlMs: number;
}

/**
 * Read engagement history from documents table, with caching.
 *
 * Per D-03: Cache is stored in worker-state with key `memory:engagement:${companyId}`.
 * TTL is 60s; stale-on-read logic refetches if expired.
 *
 * @param ctx Plugin context (for worker-state access)
 * @param adapter SDK adapter for document reads
 * @param companyId Company ID to read history for
 * @returns EngagementHistory if found, null if document doesn't exist
 */
export async function getEngagementHistory(
  ctx: PluginContext,
  adapter: PaperclipAdapter,
  companyId: string
): Promise<EngagementHistory | null> {
  // Check cache first
  const cached = await ctx.state.get({
    scopeKind: "company" as const,
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history",
  }) as CacheEntry | undefined;

  if (cached) {
    const age = Date.now() - cached.cachedAt;
    if (age < cached.ttlMs) {
      // Cache hit and not stale
      return cached.data;
    }
  }

  // Cache miss or stale — fetch from adapter
  const docBody = await adapter.getDocumentByKey(companyId, ENGAGEMENT_HISTORY_DOC_KEY);
  if (!docBody) {
    return null;
  }

  // Parse JSON from markdown fenced code block
  const history = parseEngagementHistoryFromMarkdown(docBody);
  if (!history) {
    return null;
  }

  // Update cache
  await ctx.state.set({
    scopeKind: "company" as const,
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history",
  }, {
    data: history,
    cachedAt: Date.now(),
    ttlMs: ENGAGEMENT_HISTORY_CACHE_TTL_MS,
  });

  return history;
}

/**
 * Create a new engagement history for a company.
 *
 * Per D-02: Initialize with version 1, company_id, last_engaged_at: now,
 * empty findings and routines arrays. Write to documents table via adapter.
 *
 * @param ctx Plugin context
 * @param adapter SDK adapter for document writes
 * @param companyId Company ID for new history
 * @returns Newly created EngagementHistory
 */
export async function createEngagementHistory(
  ctx: PluginContext,
  adapter: PaperclipAdapter,
  companyId: string
): Promise<EngagementHistory> {
  const now = new Date().toISOString();

  const history: EngagementHistory = {
    version: 1,
    company_id: companyId,
    last_engaged_at: now,
    findings: [],
    routines: [],
  };

  // Write to documents table via adapter
  const markdown = serializeEngagementHistoryToMarkdown(history);
  await adapter.writeDocument(companyId, "Engagement History", markdown);

  // Update cache
  await ctx.state.set({
    scopeKind: "company" as const,
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history",
  }, {
    data: history,
    cachedAt: Date.now(),
    ttlMs: ENGAGEMENT_HISTORY_CACHE_TTL_MS,
  });

  return history;
}

/**
 * Update engagement history in documents table.
 *
 * Per D-01: Serialize to JSON + markdown, write via adapter, invalidate cache.
 *
 * @param ctx Plugin context
 * @param adapter SDK adapter for document writes
 * @param companyId Company ID
 * @param history Updated EngagementHistory
 */
export async function updateEngagementHistory(
  ctx: PluginContext,
  adapter: PaperclipAdapter,
  companyId: string,
  history: EngagementHistory
): Promise<void> {
  // Serialize to markdown
  const markdown = serializeEngagementHistoryToMarkdown(history);

  // Write via adapter
  await adapter.writeDocument(companyId, "Engagement History", markdown);

  // Invalidate cache by clearing it
  await ctx.state.set({
    scopeKind: "company" as const,
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history",
  }, null);
}

/**
 * Record new findings from a mode Apply.
 *
 * Per D-06: Append Finding[] to engagement history, update last_engaged_at,
 * and persist. Called from modes' apply.ts after successful Apply.
 *
 * @param ctx Plugin context
 * @param adapter SDK adapter
 * @param companyId Company ID
 * @param runId UUID of this Apply run
 * @param mode Mode that generated findings (Found, Assess, Revive, Reposition)
 * @param findingItems Array of findings to record
 */
export async function recordFindingsToHistory(
  ctx: PluginContext,
  adapter: PaperclipAdapter,
  companyId: string,
  runId: string,
  mode: "Found" | "Assess" | "Revive" | "Reposition",
  findingItems: Finding[]
): Promise<void> {
  // Read current history (or create if doesn't exist)
  let history = await getEngagementHistory(ctx, adapter, companyId);
  if (!history) {
    history = await createEngagementHistory(ctx, adapter, companyId);
  }

  // Append new findings
  const now = new Date().toISOString();
  history.findings.push(...findingItems);
  history.last_engaged_at = now;

  // Persist updated history
  await updateEngagementHistory(ctx, adapter, companyId, history);
}

/**
 * Serialize EngagementHistory to JSON + markdown format.
 *
 * Per D-01: Body is structured as:
 * ```
 * # Engagement History — Company Name
 *
 * ## Recent Findings
 *
 * [Human-readable list of last 5 findings with status badges]
 *
 * ## Raw Data
 *
 * ```json
 * {JSON}
 * ```
 * ```
 */
function serializeEngagementHistoryToMarkdown(history: EngagementHistory): string {
  const recentFindings = history.findings.slice(-5).reverse(); // Last 5, newest first

  const findingsList = recentFindings
    .map((f) => {
      const statusBadge =
        f.status === "open"
          ? "🔴 **Open**"
          : f.status === "addressed"
            ? "✅ **Addressed**"
            : "⭕ **Invalidated**";
      return `- ${statusBadge} ${f.mode}: ${f.summary} (${f.created_at})`;
    })
    .join("\n");

  const recentSection =
    history.findings.length === 0
      ? "No findings yet. Engagement history appears here after you Found, Assess, Revive, or Reposition a company."
      : findingsList;

  const markdown = `# Engagement History

## Recent Findings

${recentSection}

## Raw Data

\`\`\`json
${JSON.stringify(history, null, 2)}
\`\`\`
`;

  return markdown;
}

/**
 * Parse EngagementHistory JSON from markdown document body.
 *
 * Extracts JSON from fenced code block and deserializes.
 *
 * @param markdown Document body
 * @returns EngagementHistory if valid JSON found, null otherwise
 */
function parseEngagementHistoryFromMarkdown(markdown: string): EngagementHistory | null {
  // Extract JSON from fenced code block
  const jsonMatch = markdown.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch || !jsonMatch[1]) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    // Basic validation
    if (
      typeof parsed === "object" &&
      parsed.version === 1 &&
      typeof parsed.company_id === "string" &&
      Array.isArray(parsed.findings) &&
      Array.isArray(parsed.routines)
    ) {
      return parsed as EngagementHistory;
    }
  } catch (e) {
    // Invalid JSON — return null
  }

  return null;
}
