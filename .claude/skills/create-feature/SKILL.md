---
name: create-feature
description: Scaffold a new feature folder under apps/web/src/features/ with all category subfolders (components, hooks, context, constants, helpers, types), each seeded with a .gitkeep. Use when the user wants to start a new feature/domain (e.g. bills, vendors, approvals).
allowed-tools: Bash AskUserQuestion
---

# Create Feature

Scaffolds a feature directory in the Next.js app (`apps/web`) that follows the
categorized structure in `AGENTS.md`.

## Steps

1. **Get the feature name.**
   - If the user passed a name in `$ARGUMENTS`, use it.
   - Otherwise, ask: "What is the feature name?" (use the AskUserQuestion tool).

2. **Normalize the name to kebab-case** (lowercase, spaces/underscores → hyphens, strip
   anything that isn't `[a-z0-9-]`). Example: `Bill Approvals` → `bill-approvals`. Call this `<feature>`.

3. **Run the scaffold script** with the normalized name:

   ```bash
   bash "$CLAUDE_PROJECT_DIR/.claude/skills/create-feature/scaffold.sh" "<feature>"
   ```

   The script:
   - Creates `apps/web/src/features/` if it doesn't exist.
   - Creates `apps/web/src/features/<feature>/` (errors if it already exists).
   - Creates each category subfolder: `components/ hooks/ context/ constants/ helpers/ types/`.
   - Adds a `.gitkeep` inside each so the empty folders are committable.

4. **Report** the created path and the list of category folders. Keep it short.

## Notes

- Category folders + naming match `AGENTS.md` and the `Stop` validation hook, so files
  added later (e.g. `components/BillsTable.tsx`, `hooks/useBillFilters.ts`,
  `context/BillDraft.context.tsx`) stay compliant.
- Feature-scoped code lives here; **shared** zod models belong in `packages/schemas`
  and reusable UI primitives in `packages/ui` (with colocated `*.stories.tsx`) — not
  in the feature folder.
- Route files stay under `apps/web/app/` (Next App Router); features hold the
  domain logic and components those routes compose.