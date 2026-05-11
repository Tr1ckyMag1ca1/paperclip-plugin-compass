# Compass v1.1.0 VPS Verification - Screenshot Capture Instructions

**Status:** VPS plugin installation verified ✓ (v1.1.0 installed and running)  
**Action Required:** Capture screenshots of 5 mode panels in light + dark themes

## VPS Access Details

- **URL:** http://100.79.31.30:3100
- **Container:** docker-server-1 on paperclip-vps
- **Plugin Status:** v1.1.0 installed at `/paperclip/.paperclip/plugins/node_modules/paperclip-plugin-compass/`
- **Server Status:** Running and accessible

## Available Test Companies (for reference)

- RaiseYourGlass.ai (c7270d98-578f-4512-8374-7b6d667de476)
- Alex Wynn Industries (086b697e-072a-42ca-80ee-f3712fa63704)
- Pictor (c044fb58-a641-4e1c-9c6a-2cb8f9cceca5)
- MirrorMemory.ai (12af9c83-f331-4c09-a10d-4a20b2863b2e)
- Biz Ops OS Generator (824f2949-2c77-48ff-92fb-fdf84f9c5c4a)

## Screenshot Capture Steps

### Step 1: Login to Paperclip VPS
1. Open browser to http://100.79.31.30:3100
2. Log in with your Paperclip credentials
3. Accept any auth prompts or 2FA if configured

### Step 2: Open a Test Company
1. From the main dashboard, select one of the test companies (e.g., "Alex Wynn Industries")
2. Wait for company data to load (should see projects, issues, agents panels)

### Step 3: Access Compass Plugin
1. Look for the **Compass** plugin in the sidebar
2. Click it to open the plugin panel
3. You should see a mode selector dropdown with 5 options: **Found**, **Assess**, **Revive**, **Reposition**, **History**

### Step 4: Capture Each Mode Panel

For **EACH** of the 5 modes, perform these steps twice (light theme + dark theme):

#### Step 4a: Light Theme Mode Screenshots

1. **Found Mode:**
   - Click dropdown, select "Found"
   - Open browser DevTools (F12 or right-click > Inspect)
   - Go to Console tab
   - Verify console shows **0 errors** (warnings are OK)
   - Take screenshot showing:
     - Compass panel with Found mode content
     - Browser console with "0 errors" visible
   - Save as: `evidence/mode-found-light.png`

2. **Assess Mode:**
   - Click dropdown, select "Assess"
   - Check Console (F12) for errors
   - Take screenshot showing panel + console
   - Save as: `evidence/mode-assess-light.png`

3. **Revive Mode:**
   - Click dropdown, select "Revive"
   - Check Console (F12) for errors
   - Take screenshot showing panel + console
   - Save as: `evidence/mode-revive-light.png`

4. **Reposition Mode:**
   - Click dropdown, select "Reposition"
   - Check Console (F12) for errors
   - Take screenshot showing panel + console
   - Save as: `evidence/mode-reposition-light.png`

5. **History Mode:**
   - Click dropdown, select "History"
   - Check Console (F12) for errors
   - Take screenshot showing panel + console
   - Save as: `evidence/mode-history-light.png`

#### Step 4b: Dark Theme Mode Screenshots

1. Toggle dark theme (look for theme toggle in Paperclip settings or top-right menu)
2. Repeat all 5 modes above with identical screenshots
3. Save with `-dark` suffix:
   - `evidence/mode-found-dark.png`
   - `evidence/mode-assess-dark.png`
   - `evidence/mode-revive-dark.png`
   - `evidence/mode-reposition-dark.png`
   - `evidence/mode-history-dark.png`

### Step 5: Save to Evidence Folder

All 10 PNG files (5 modes × 2 themes) should be saved to:
```
.planning/phases/11-distribution-open-source-launch/evidence/
```

### Step 6: Commit Evidence

Once all screenshots are captured:
```bash
cd .planning/phases/11-distribution-open-source-launch/
git add evidence/
git commit -m "docs(11-06): add Compass v1.1.0 VPS screenshot evidence (all 5 modes, light + dark themes)"
```

## Verification Checklist

- [ ] 5 mode panels render without console errors
- [ ] Screenshots captured for light theme (5 modes)
- [ ] Screenshots captured for dark theme (5 modes)
- [ ] All 10 PNG files in `evidence/` folder
- [ ] Console shows "0 errors" in each screenshot
- [ ] Evidence committed to git

## Troubleshooting

**Console shows errors?**
- Check if error is from Compass plugin (should be zero) or from another plugin
- If Compass error, note the error message and create a GitHub issue

**Mode panel won't load?**
- Reload the page (Ctrl+R or Cmd+R)
- Check if company has sufficient data (some modes may show "no data" if company is new)
- Check browser console for network errors

**Theme toggle not visible?**
- Look in top-right corner near profile menu
- Or check Paperclip preferences/settings
- Skip dark theme if toggle unavailable (light theme only is acceptable)

## Expected Behavior Per Mode

- **Found Mode:** Vision-quest interview form (if company has no VISION.md) or VISION preview
- **Assess Mode:** Drift audit summary or "Run drift audit" button
- **Revive Mode:** Stall summary or "Find what's blocking" button
- **Reposition Mode:** Pivot interview form or "Start pivot strategy" button
- **History Mode:** Timeline of findings and scheduled check-ins

## Questions?

If you encounter issues or blockers:
1. Check the Compass plugin source: https://github.com/Tr1ckyMag1ca1/paperclip-plugin-compass
2. Review CLAUDE.md plugin distribution requirements
3. Create a GitHub issue if plugin behavior is unexpected
