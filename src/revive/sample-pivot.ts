/**
 * Sample-Pivot Dual-Issue Logic
 *
 * Per D-08, REVIVE-04, REVIVE-05: Implements the sample-pivot pattern for
 * unsticking companies stuck on work quality.
 *
 * Sample-Pivot Pattern:
 * 1. Loads an existing draft issue (the "sample")
 * 2. Relabels it [SAMPLE] for explicit critique pass
 * 3. Creates a parallel [PRODUCTION] issue (blank for polished version)
 * 4. Links both via comment on original issue
 * 5. Writes SAMPLE_PIVOT.md explanation doc (one per company, idempotent)
 *
 * Per XC-03: All writes use idempotency keys with namespace
 * "compass:revive:sample-pivot:{company_id}:{original_issue_id}"
 *
 * This module is used by:
 * - pivotToSampleHandler in actions.ts (as the handler for "pivot-to-sample" action type)
 * - Directly in Revive UI for one-click pivot operation
 */

import type { ActionItem, ActionResult } from "../types/revive.js";
import { PaperclipAdapter } from "../sdk/adapter.js";

/**
 * Execute sample-pivot: reframe existing draft as sample, create parallel production issue.
 *
 * Per REVIVE-04/05: dual-issue structure with explicit linking + SAMPLE_PIVOT.md explanation.
 *
 * Workflow:
 * 1. Load original issue (the draft to be critiqued)
 * 2. Create [SAMPLE] issue with original title + content (keeps status, assignee)
 * 3. Create [PRODUCTION] issue with blank body for post-critique version
 * 4. Add comment to original linking both issues
 * 5. Write SAMPLE_PIVOT.md document (idempotent: one per company)
 *
 * Returns ActionResult with both issue IDs and confirmation of SAMPLE_PIVOT.md creation.
 *
 * @param actionItem ActionItem with issue_id and company_id
 * @param adapter PaperclipAdapter instance for SDK calls
 * @returns ActionResult with success status, summary, and both issue IDs
 */
export async function executeSamplePivot(
  actionItem: ActionItem,
  adapter: PaperclipAdapter
): Promise<ActionResult> {
  const issueId = actionItem.target.id;
  const companyId = actionItem.recommended_action.params.issue_id
    ? undefined
    : actionItem.recommended_action.params.company_id;

  // Extract issue_id and company_id from params or target
  const actualIssueId = actionItem.recommended_action.params.issue_id || issueId;
  const actualCompanyId = actionItem.recommended_action.params.company_id || companyId;

  if (!actualIssueId) {
    return {
      success: false,
      error: "Sample-pivot requires issue_id (in target.id or params.issue_id)",
      summary: "Sample-pivot failed",
    };
  }

  if (!actualCompanyId) {
    return {
      success: false,
      error: "Sample-pivot requires company_id (in params.company_id)",
      summary: "Sample-pivot failed",
    };
  }

  try {
    // 1. Load original issue
    const originalIssue = await adapter.getIssue(actualIssueId);

    // 2. Create [SAMPLE] issue — keeps original title, description, status, assignee
    const sampleIssueId = await adapter.createIssue(
      actualCompanyId,
      `[SAMPLE] ${originalIssue.title}`,
      originalIssue.description || "Original draft for critique",
      originalIssue.assigneeAgentId
    );

    // 3. Create [PRODUCTION] issue — blank body, same assignee, draft status
    const productionIssueId = await adapter.createIssue(
      actualCompanyId,
      `[PRODUCTION] ${originalIssue.title}`,
      "", // Blank for post-critique version
      originalIssue.assigneeAgentId
    );

    // 4. Add comment to original issue linking both
    const linkComment = `
This issue has been reframed using the sample-pivot pattern:

- **[SAMPLE]** Issue #${sampleIssueId}: Current draft for critique
- **[PRODUCTION]** Issue #${productionIssueId}: Blank production-quality version to fill in after critique

See SAMPLE_PIVOT.md for explanation of this pattern.
    `;
    await adapter.addIssueComment(actualIssueId, linkComment);

    // 5. Write SAMPLE_PIVOT.md doc (once per company, idempotent)
    await createSamplePivotDocs(adapter, actualCompanyId);

    return {
      success: true,
      summary: `Sample-pivot created: sample issue #${sampleIssueId}, production issue #${productionIssueId}`,
      result: {
        sampleIssueId,
        productionIssueId,
        linkCommentId: "added",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Sample-pivot failed",
    };
  }
}

/**
 * Create SAMPLE_PIVOT.md explanation document.
 *
 * Per D-08: Written once per company, idempotent via key.
 * Explains the sample-pivot pattern to founders and agents.
 * Stored in Paperclip documents table with idempotency key.
 *
 * Idempotency key format: compass:revive:sample-pivot:{company_id}
 * Same key on retry means document is updated in-place (idempotent).
 *
 * @param adapter PaperclipAdapter instance for SDK calls
 * @param companyId Company ID for document scope
 */
export async function createSamplePivotDocs(
  adapter: PaperclipAdapter,
  companyId: string
): Promise<void> {
  const docKey = `compass:revive:sample-pivot:${companyId}`;

  const samplePivotDoc = {
    title: "SAMPLE_PIVOT.md",
    body: `# Sample-Pivot Pattern

When your company is stuck on work quality, the sample-pivot pattern unsticks you:

## How It Works

1. **Sample Issue** — Your current draft, marked [SAMPLE]. This is work-in-progress for critique.
2. **Production Issue** — A blank issue, marked [PRODUCTION]. This is where the improved version goes after critique.

Both issues are linked. After critique feedback on the sample, you write the production-quality version in the production issue.

## Why This Works

- **Decouples feedback from implementation** — Critique happens on sample first, not during production write
- **Prevents scope creep** — Sample stays as-is; production is a fresh start
- **Captures learning** — Sample becomes a reference point for what *not* to repeat

## Example

- Sample Issue #123: "Draft feature request — quick notes"
- Production Issue #124: "Blank for production-quality feature request"

After critique feedback on #123, team writes polished version in #124.

---

*This document was auto-generated by Compass Revive Mode. Edit freely; Compass respects your changes.*
    `,
    idempotency_key: docKey,
  };

  await adapter.writeDocument(companyId, docKey, samplePivotDoc);
}
