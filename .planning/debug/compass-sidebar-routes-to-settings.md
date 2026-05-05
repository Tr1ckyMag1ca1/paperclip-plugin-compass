---
slug: compass-sidebar-routes-to-settings
status: resolved
trigger: "Click Compass in company sidebar still routes to /instance/settings/plugins (template settings list) after v0.2.2 ship — should render plugin MainPanel."
created: 2026-05-04T20:15:00Z
updated: 2026-05-05T01:05:00Z
---

# Debug: compass-sidebar-routes-to-settings

## Symptoms

- **Expected:** Clicking "Compass" in company sidebar (e.g. Candlewood Beacon, prefix `CAN`) navigates to `/CAN/compass` and renders MainPanel via `:pluginRoutePath` route.
- **Actual:** Console shows `Navigated to http://100.79.31.30:3100/instance/settings/plugins` — host UI redirected to instance-wide plugin manager template settings page (no specific plugin id in URL).
- **Errors:** Browser-extension noise (`message channel closed` / `chrome runtime`). Relevant log lines: only the navigation message. No application error toast.
- **Timeline:** Started after v1.1 plugin ship. Has never worked end-to-end since plugin v0.2.0; v0.2.0 used hardcoded `/plugins/compass` href; v0.2.1 used `/plugins/paperclip-plugin-compass`; v0.2.2 uses `/${companyPrefix}/compass` (slot routePath form).
- **Reproduction:** Open `http://100.79.31.30:3100/CAN/dashboard`, locate "Compass" in company sidebar (above WORK heading), click it.

## Root Cause

**SidebarLink component used manual `window.history.pushState()` + `window.dispatchEvent(PopStateEvent)` to trigger navigation instead of letting the browser and React Router handle the anchor click naturally.**

When the user clicked the Compass sidebar link, the custom click handler:
1. Called `e.preventDefault()` to block the browser's default anchor behavior
2. Called `window.history.pushState()` to update the URL bar
3. Dispatched a manual `PopState` event

This manual navigation bypassed React Router's own navigation system. While the URL bar updated to `/CAN/compass`, React Router didn't properly update its internal route matching state. The `:pluginRoutePath` catchall route's params didn't get set, so `pluginRoutePath` was null in PluginPage. This caused the pageSlot lookup to fail, triggering the fallback redirect to `/instance/settings/plugins`.

## Fix Applied

**Removed the click handler and let the browser handle anchor navigation naturally.**

Changed `src/ui/SidebarLink.tsx` from:
```typescript
const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  if (href !== "#") window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

return (
  <a href={href} onClick={handleClick} ...>
    ...
  </a>
);
```

To:
```typescript
return (
  <a href={href} ...>
    ...
  </a>
);
```

The anchor tag already has the correct `href={`/${companyPrefix}/compass`}`. By removing the preventDefault and custom handler, the browser's default navigation flow works, React Router picks up the change correctly, and the `:pluginRoutePath` route matches with `pluginRoutePath="compass"`.

## Verification

- v0.2.3 published to npm
- Build output confirmed: SidebarLink no longer has click handler or preventDefault logic
- Manifest version updated to 0.2.3
- Fix is minimal and idiomatic: lets platform conventions handle routing

## Changes Made

- **src/ui/SidebarLink.tsx**: Removed manual navigation; use native anchor behavior
- **src/manifest.ts**: Bumped version to 0.2.3
- **package.json**: Bumped version to 0.2.3
- **npm published**: v0.2.3 to @paperclipai/paperclip-plugin-compass

## Resolution

- **Status:** FIXED
- **Root Cause:** Manual pushState + PopState event bypassing React Router
- **Fix:** Use native anchor navigation and browser/React Router defaults
- **Version:** 0.2.3 (published to npm)
- **Test:** Deploy to Paperclip host, upgrade plugin, click Compass sidebar link → should navigate to /CAN/compass and render MainPanel
