# Aron Prins — Collaboration Outreach Draft

Aron built [paperclip-vision](https://github.com/aronprins/paperclip-vision), the Claude Code skill that runs the founder interview and writes a company's strategic constitution. His interview structure and VISION.md template are excellent — they're the basis for the strategic depth this plugin needs.

We want him in on this, not around it.

## The ask

- Credit Aron prominently in the Compass plugin README + every published artifact
- Offer co-maintainership of the Compass repo
- Invite him to contribute, push back, or take ownership of the strategic-interview / VISION-authoring portions of the plugin
- Be clear that paperclip-vision (the standalone Claude Code skill) is **not being deprecated against his will** — it stays useful for non-Paperclip uses; Compass is the Paperclip-native version

## Tone

Genuine and respectful. Aron wrote a tight, opinionated, well-thought-out tool. We're not "absorbing" his work — we're standing on top of it because it's the right foundation. If he wants no involvement, that's fine; we still credit prominently.

## Outreach draft

> Subject: Vision Quest → Paperclip plugin — would love your input
>
> Hey Aron,
>
> Quick context: I've been using your paperclip-vision skill to set up an AI-run hyperlocal newsletter on Paperclip. It's been excellent — the interview structure and VISION.md template are the right shape, the Amendment Protocol especially. Real thanks for putting the work in to make it open.
>
> Spent a bunch of hours this weekend running paperclip-vision against an existing/stalled company (different setup than a fresh founder interview). Hit some friction that's specific to running it as a Claude Code skill rather than a Paperclip plugin — schema rediscovery, dual-path agent instruction handling, manual SSH/heredoc to apply changes, etc. Shouldn't be Claude Code's job; should be native to Paperclip.
>
> So I'm looking at building a Paperclip plugin that combines:
> - paperclip-vision's strategic interview depth + VISION.md authoring
> - paperclip-plugin-company-wizard's plugin shell + provisioning + presets
> - net-new modes for existing companies (drift review, revival, repositioning)
>
> Working name: Compass. Code lives at [link to repo when public]. The PROMPT.md in the repo is the build spec; the README has the inheritance map.
>
> Two things:
>
> 1. **Credit.** Your interview structure + VISION.md template are core to this plugin. You're cited prominently in the README and in every generated VISION.md (since the Amendment Protocol is yours). If there's specific phrasing or attribution you'd prefer, tell me and I'll make it that.
>
> 2. **Collaboration.** I'd love to have you on as a co-maintainer if you're interested — particularly on the strategic-interview and VISION-authoring portions, since you've already thought hardest about those. No pressure; if you'd rather just see the plugin exist with proper credit, that's also fine. If you want to push back on the architecture or fork your own direction, fully respect that too.
>
> The Claude Code skill (paperclip-vision) stays useful for non-Paperclip uses — anyone running an AI company outside Paperclip would still want it. Compass doesn't deprecate it; it's the Paperclip-native sibling.
>
> Either way: thanks for the work you put into vision-quest. It saved me a weekend of fumbling toward the same structure.
>
> [Founder name + email]

## Where to send

Aron's GitHub: `https://github.com/aronprins`. Look for an email on his profile / a paperclip-vision issue thread / a Paperclip Discord. If only public option is filing a GitHub issue, file it as a discussion not an issue — feels less transactional.

## After response

If yes:
- Add Aron as collaborator on Compass repo
- Set up co-maintainer ground rules (commit access, review patterns, voice on README)
- Credit on every release notes

If no:
- Honor the credit + attribution promises regardless
- Don't push for involvement; respect the boundary

If no response in 7 days:
- Send one polite follow-up
- After that: ship anyway with credit, leave the invitation open

## Etiquette notes

- Don't represent paperclip-vision as "outdated" or "limited" externally. Internally we know its limits as a Claude Code skill in Paperclip context — that's a different thing than the tool itself being limited.
- Don't take aron's name off anything if he declines collaboration. Credit + attribution are not contingent on his involvement.
- If there's any structural conflict (e.g., aron disagrees with the mode taxonomy), defer where possible. He thought about this longer.
