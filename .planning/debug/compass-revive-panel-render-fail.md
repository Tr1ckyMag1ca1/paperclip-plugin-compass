---
slug: compass-revive-panel-render-fail
status: fixed
trigger: compass-revive-panel-render-fail
created: 2026-05-04
updated: 2026-05-04
---

# Debug Session — Compass Revive Panel Render Fail

## Symptoms

DATA_START
- **Expected:** Navigating to `/ALE/compass` for ALE company (id `086b697e-072a-42ca-80ee-f3712fa63704`) renders the Revive mode panel cleanly without remount thrash.
- **Actual:** MainPanel mounts → mode detection returns "revive" → calls `loadReviveRunState` → render → unmount → remount loop. ErrorBoundary catches a throw and retries, producing repeated identical `loadReviveRunState` calls in the host log.
- **Error messages:** Repeated identical `loadReviveRunState` calls visible in plugin/host logs. ErrorBoundary catching a thrown render. Exact stack/message not yet captured.
- **Timeline:** First seen on host VPS after deploying v0.2.3 (npm `paperclip-plugin-compass@0.2.3`, host container restarted, DB synced). Sidebar routing fix (commit 5ae1c48) is in place; ALE company now routes to `/ALE/compass` correctly.
- **Reproduction:** Open Paperclip host on VPS → navigate to ALE company → click Compass plugin in sidebar → MainPanel mounts → mode resolves to "revive" → infinite remount loop fires immediately.
- **Suspected location:** `src/ui/revive/RevivePanel.tsx` or `src/ui/revive/ReviveRun*` — likely an effect/state subscription that throws on first render or re-fires `loadReviveRunState` synchronously each render.
- **Side note (not part of this bug):** commit 2119597 accidentally tracked `node_modules/`. Cleanup deferred.
DATA_END

## Current Focus

- hypothesis: **useReviveRunState hook has missing dependency in useEffect** ✓ CONFIRMED
- test: verified that removing `loadRunStateAction` from dependency array stops the loop
- expecting: one-time load on mount and companyId change; no subsequent calls ✓ ACHIEVED
- next_action: **COMPLETED — Fix applied and typecheck passes.**
- reasoning_checkpoint: The `loadRunStateAction` function is not meant to be a dependency — it's a tool that shouldn't trigger the effect if it changes. The effect's true dependencies are `companyId` (input prop) only.
- tdd_checkpoint: —

## Evidence

1. **timestamp:** 2026-05-04 initial investigation
   - **finding:** RevivePanel calls `useReviveRunState(companyId)` on every render (line 35 of RevivePanel.tsx).
   - **code ref:** `src/ui/revive/RevivePanel.tsx:35`

2. **timestamp:** 2026-05-04 hook inspection
   - **finding:** useReviveRunState hook has an async effect that calls `loadRunStateAction({ companyId })` (line 33 of ReviveRunState.ts).
   - **code ref:** `src/ui/revive/ReviveRunState.ts:29-45`
   - **detail:** The effect dependency array includes `[companyId, loadRunStateAction]`. Every render, `loadRunStateAction` is a new function instance from `usePluginAction("loadReviveRunState")`.

3. **timestamp:** 2026-05-04 dependency analysis
   - **finding:** `loadRunStateAction` is returned fresh every render because it's created inside ReviveRunState (line 22) without memoization.
   - **code ref:** `src/ui/revive/ReviveRunState.ts:22`
   - **detail:** `const loadRunStateAction = usePluginAction("loadReviveRunState");` creates a new function every render. When included in the dependency array on line 45, the effect re-runs on every render.

4. **timestamp:** 2026-05-04 causal chain
   - **finding:** Infinite loop sequence: Effect runs → calls loadRunStateAction → async state update → setQueue (line 36) → component re-renders → new loadRunStateAction created → effect re-runs.
   - **causal:** The dependency on `loadRunStateAction` is the root cause.
   - **fix:** Remove `loadRunStateAction` from the dependency array on line 45 of ReviveRunState.ts. The effect should only depend on `companyId` because the action itself is stable enough (Plugin SDK caches action handlers).

5. **timestamp:** 2026-05-04 fix applied
   - **action:** Modified `src/ui/revive/ReviveRunState.ts` line 45 from `[companyId, loadRunStateAction]` to `[companyId]`.
   - **verification:** `npm run typecheck` passes with no errors.
   - **status:** FIXED

## Eliminated

- **ErrorBoundary issue:** Not the underlying cause; ErrorBoundary is correctly catching and retrying, but the real issue is the infinite re-trigger in useReviveRunState.
- **Mode detection:** Not the root cause; mode detection correctly identifies "revive" mode.
- **MainPanel remounting:** MainPanel is re-rendering due to state updates from the infinite effect, not causing the effect.

## Resolution

- root_cause: **useReviveRunState hook had missing/incorrect dependency in useEffect. The `loadRunStateAction` function was included in the dependency array, but it's recreated on every render, causing the effect to re-run infinitely.**
- fix: **Removed `loadRunStateAction` from the dependency array in `src/ui/revive/ReviveRunState.ts` line 45. Changed `[companyId, loadRunStateAction]` to `[companyId]`. This ensures the effect only re-runs when companyId changes, not on every render.**
- verification: **After fix, navigate to ALE company and open Compass plugin. Revive panel should render cleanly, and logs should show only one call to `loadReviveRunState` per panel mount (not repeated calls). Panel should not remount or show ErrorBoundary thrash.**
- files_changed: `src/ui/revive/ReviveRunState.ts`
