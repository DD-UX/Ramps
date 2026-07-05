---
name: design-system-validate
description: Pre-push gate for the design system (packages/ui). Run this EVERY time before pushing changes that touch the design system — tokens (tokens.css / theme.css), any primitive under packages/ui/src/components, its stories, or the Storybook config. Builds the static Storybook, runs the token-fidelity HARD gate (computed styles must resolve to the verified --rui-* Ramp tokens) and the visual-advisory pass (gallery capture + side-by-side with the curated Ramp video frames). A token-fidelity failure BLOCKS the push. Use whenever the user is about to push, commit-and-push, or asks to "validate the design system".
allowed-tools: Bash Read
---

# Design System Validate

The pre-push quality gate for `@ramps/ui`. It proves the design system still
renders faithfully to the **verified Ramp tokens** before any design-system
change leaves the machine.

Scope: run it whenever a push would include changes to —

- `packages/ui/src/tokens/tokens.css` or `theme.css` (the token source + Tailwind bridge)
- any primitive in `packages/ui/src/components/**` or its `*.stories.tsx`
- the Storybook config (`packages/ui/.storybook/**`)
- the validation suite itself (`packages/ui/validation/**`, `playwright.config.ts`)

If a push touches only unrelated packages (e.g. `packages/schemas`, `apps/web`
routes), this skill is not required.

## What it does

Three steps, run against the **static** Storybook build (exactly what ships to
`/storybook` in the web app — no dev-server drift):

1. **build-storybook** _(HARD)_ — regenerate `storybook-static/`. If the build
   breaks, stop.
2. **token-fidelity** _(HARD gate)_ — render each primitive story chrome-free
   and assert its browser-computed styles resolve to the `--rui-*` values parsed
   live from `tokens.css` (zero hardcoded colours). Guards the rules that
   matter: accent surfaces pair with ink, destructive/critical stay orange
   (never raw red), radii + heading weight are exact. **A drift here blocks the
   push.**
3. **visual-advisory** _(ADVISORY — never blocks)_ — capture a gallery
   screenshot of every catalogued story and attach the Ramp video frame it
   echoes side-by-side in the HTML report, for a human eyeball. Reported, not
   enforced.

## Steps

1. **Run the gate:**

   ```bash
   bash "$CLAUDE_PROJECT_DIR/.claude/skills/design-system-validate/validate.sh"
   ```

   Flags: `--skip-build` (reuse an existing `storybook-static/`), `--gate-only`
   (token-fidelity only, skip the advisory capture — fastest).

2. **Read the result:**
   - Exit `0` → the design system is validated; it is **safe to push**.
   - Non-zero → the **token-fidelity HARD gate failed**. Do **not** push. Report
     which primitive drifted (from the test output) and fix the component or the
     token before retrying. Never bypass the gate to push.

3. **Advisory drift** (build + gate passed, advisory noisy): it does **not**
   block. Mention it and point the user to the report:

   ```bash
   pnpm --filter @ramps/ui validate:report
   ```

## Notes

- `tokens.css` stays the single source of truth. The fidelity assertions parse
  it at runtime, so when a token value legitimately changes, both the CSS and
  the test move together and re-anchor automatically — no test edits needed.
- The suite drives the full Chromium binary (`channel: 'chromium'`), so there's
  one browser to provision. If it's missing: `pnpm --filter @ramps/ui exec playwright install chromium`.
- Curated reference frames live under `docs/watch-youtube/**/snapshots/`; the
  advisory catalogue in `validation/visual-advisory.spec.ts` maps stories to the
  frames they reproduce.
- This is a **push-time** gate, not a commit hook — run it before `git push`,
  after the work on a design-system change is complete.
