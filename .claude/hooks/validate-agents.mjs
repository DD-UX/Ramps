#!/usr/bin/env node
/**
 * Stop hook: validates the AGENTS.md conventions across the monorepo
 * (apps/<ws>/{src,app} and packages/<ws>/src). On violation, exits 2 with
 * actionable feedback so the agent fixes placement/naming/data-modeling
 * and re-runs.
 *
 * Enforced (see AGENTS.md "Files & naming", "TypeScript", and the
 * `packages/ui` rules):
 *   components/  -> PascalCase.tsx (feature components prefixed with the feature)
 *   hooks/       -> useCamelCase.ts
 *   context/     -> PascalCase.context.tsx
 *   constants/   -> kebab-case.constants.ts
 *   helpers/     -> kebab-case.helpers.ts
 *   types/       -> kebab-case.types.ts
 *
 * Monorepo-aware rules:
 *   - Next App Router reserved files (page, layout, route, loading, error,
 *     not-found, template, default, global-error, middleware, instrumentation)
 *     are exempt; any other .tsx in app/ must live in a components/ folder.
 *   - components/ accepts flat files (components/Button.tsx) or per-component
 *     folders (components/Button/Button.tsx — the packages/ui layout).
 *   - packages/ui: every component MUST have a colocated
 *     PascalCase.stories.tsx ("No stories -> not done").
 *
 * Content rules (types & data modeling):
 *   - Exported types end with `Model` (entities) or `Type` (everything else).
 *   - Literal unions in types/ must be derived from constants/zod, not hand-written.
 *   - constants/ must not use array `.find(...)` dictionary lookups — use a Map.
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// --- read hook stdin (best-effort) to avoid infinite loops -----------------
let stdin = '';
try {
  stdin = readFileSync(0, 'utf8');
} catch {
  /* no stdin */
}
let payload = {};
try {
  payload = stdin ? JSON.parse(stdin) : {};
} catch {
  /* not JSON */
}
// If we already blocked once on this turn, don't block again.
if (payload.stop_hook_active) {
  process.exit(0);
}

// --- category definitions --------------------------------------------------
const CATEGORIES = {
  constants: { suffix: '.constants.ts', folder: 'constants' },
  helpers: { suffix: '.helpers.ts', folder: 'helpers' },
  types: { suffix: '.types.ts', folder: 'types' },
};

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
const HOOK_NAME = /^use[A-Z][A-Za-z0-9]*$/;

// Next.js App Router reserved file stems — exempt from categorized naming.
const NEXT_RESERVED = new Set([
  'page',
  'layout',
  'loading',
  'error',
  'global-error',
  'not-found',
  'template',
  'default',
  'route',
  'middleware',
  'instrumentation',
]);

// Files/folders exempt from convention checks.
const EXEMPT_STEMS = new Set(['index']); // barrel files
const EXEMPT_DIRS = new Set([
  'assets',
  'test',
  'tests',
  '__tests__',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.storybook',
  'storybook-static',
]);

// --- workspace discovery (apps/*/{src,app}, packages/*/src) ----------------
function workspaceRoots() {
  const roots = [];
  for (const group of ['apps', 'packages']) {
    const groupDir = join(projectRoot, group);
    let entries = [];
    try {
      entries = readdirSync(groupDir);
    } catch {
      continue; // group folder doesn't exist yet
    }
    for (const entry of entries) {
      const wsDir = join(groupDir, entry);
      try {
        if (!statSync(wsDir).isDirectory()) continue;
      } catch {
        continue;
      }
      for (const sub of ['src', 'app']) {
        const dir = join(wsDir, sub);
        if (existsSync(dir) && statSync(dir).isDirectory()) roots.push(dir);
      }
    }
  }
  return roots;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (EXEMPT_DIRS.has(entry)) continue;
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function parentFolder(file) {
  return basename(dirname(file));
}

function relPosix(file) {
  return relative(projectRoot, file).split('\\').join('/');
}

// The feature a file belongs to, i.e. the segment right after `features/`.
// Returns null for shared (non-feature) code.
function featureName(file) {
  const parts = relPosix(file).split('/');
  const i = parts.indexOf('features');
  return i !== -1 && parts[i + 1] ? parts[i + 1] : null;
}

// `tic-tac-toe` -> `TicTacToe`, `bills` -> `Bills`.
function kebabToPascal(s) {
  return s
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

const violations = [];

const files = workspaceRoots().flatMap((root) => {
  try {
    return walk(root);
  } catch {
    return [];
  }
});

// No workspaces yet (pre-scaffolding) — nothing to validate.
if (files.length === 0) {
  process.exit(0);
}

for (const file of files) {
  const name = basename(file);
  const rel = relPosix(file);
  const folder = parentFolder(file);

  // Skip non-source, tests, stories, styles, declaration files, exempt entries.
  if (/\.test\.[tj]sx?$/.test(name)) continue;
  if (/\.stories\.[tj]sx?$/.test(name)) continue;
  if (/\.css$/.test(name)) continue;
  if (/\.d\.ts$/.test(name)) continue;
  if (!/\.(ts|tsx)$/.test(name)) continue;

  const base = name.replace(/\.(ts|tsx)$/, '');
  if (EXEMPT_STEMS.has(base)) continue;
  if (NEXT_RESERVED.has(base)) continue;

  // 1) Suffix files must live in matching folder.
  let matchedSuffix = false;
  for (const [cat, def] of Object.entries(CATEGORIES)) {
    if (name.endsWith(def.suffix)) {
      matchedSuffix = true;
      if (folder !== def.folder) {
        violations.push(
          `${rel}: '${name}' has a ${cat} suffix but is not inside a '${def.folder}/' folder. Move it to '${def.folder}/'.`,
        );
      }
      const stem = name.slice(0, -def.suffix.length);
      if (!KEBAB.test(stem)) {
        violations.push(`${rel}: ${cat} files must be kebab-case (e.g. 'my-thing${def.suffix}'). Rename '${name}'.`);
      }
      break;
    }
  }
  if (matchedSuffix) continue;

  // 2) Files INSIDE a category folder must use that category's naming.
  for (const [, def] of Object.entries(CATEGORIES)) {
    if (folder === def.folder) {
      violations.push(
        `${rel}: files in '${def.folder}/' must use the '${def.suffix}' suffix (kebab-case). Rename '${name}' accordingly.`,
      );
    }
  }

  // 3) Context: 'PascalCase.context.tsx' inside a 'context/' folder.
  if (name.endsWith('.context.tsx')) {
    const stem = name.slice(0, -'.context.tsx'.length);
    if (folder !== 'context') {
      violations.push(
        `${rel}: '${name}' has a context suffix but is not inside a 'context/' folder. Move it to 'context/'.`,
      );
    }
    if (!PASCAL.test(stem)) {
      violations.push(`${rel}: context files must be PascalCase (e.g. 'RoleSwitcher.context.tsx'). Rename '${name}'.`);
    }
    continue;
  }
  if (folder === 'context') {
    violations.push(
      `${rel}: files in 'context/' must be named 'PascalCase.context.tsx'. Rename '${name}' accordingly.`,
    );
    continue;
  }

  // 4) Components: must be PascalCase AND inside a 'components/' folder,
  //    either flat (components/Button.tsx) or per-component folder
  //    (components/Button/Button.tsx — the packages/ui layout).
  if (name.endsWith('.tsx')) {
    const parts = relPosix(file).split('/');
    const grandparent = parts.length >= 3 ? parts[parts.length - 3] : '';
    const inComponentFolder = grandparent === 'components' && PASCAL.test(folder);
    if (grandparent === 'components' && !PASCAL.test(folder)) {
      violations.push(
        `${rel}: subfolders of 'components/' must be PascalCase per-component folders (e.g. 'components/Button/Button.tsx'). Rename '${folder}/'.`,
      );
      continue;
    }
    if (folder === 'components' || inComponentFolder) {
      if (!PASCAL.test(base)) {
        violations.push(`${rel}: components must be PascalCase. Rename '${name}'.`);
      } else if (inComponentFolder && !base.startsWith(folder)) {
        violations.push(
          `${rel}: files in a per-component folder must be named after it — '${folder}/' expects '${folder}.tsx' (or '${folder}Xxx.tsx' subcomponents). Rename '${name}'.`,
        );
      } else {
        // Feature components must be prefixed with the PascalCase feature name.
        const feature = featureName(file);
        if (feature) {
          const prefix = kebabToPascal(feature);
          if (base !== prefix && !base.startsWith(prefix)) {
            violations.push(
              `${rel}: feature components must be prefixed with the feature name '${prefix}' (e.g. '${prefix}Table.tsx'). Rename '${name}' to start with '${prefix}'.`,
            );
          }
        }
        // packages/ui: every component ships with colocated stories
        // (AGENTS.md `packages/ui`: "No stories -> not done").
        if (rel.startsWith('packages/ui/')) {
          const stories = join(dirname(file), `${base}.stories.tsx`);
          if (!existsSync(stories)) {
            violations.push(
              `${rel}: ui component '${name}' has no colocated '${base}.stories.tsx'. Every packages/ui component ships with Storybook stories covering all states (AGENTS.md packages/ui).`,
            );
          }
        }
      }
    } else {
      violations.push(
        `${rel}: '${name}' is a component (.tsx) but not inside a 'components/' folder. Move it to 'components/' (Next reserved files like page/layout/route are exempt).`,
      );
    }
    continue;
  }

  // 5) Hooks: a useXxx.ts file must live in 'hooks/'.
  if (HOOK_NAME.test(base)) {
    if (folder !== 'hooks') {
      violations.push(`${rel}: hook '${name}' must live inside a 'hooks/' folder.`);
    }
    continue;
  }
  if (folder === 'hooks' && !HOOK_NAME.test(base)) {
    violations.push(`${rel}: files in 'hooks/' must be named 'useCamelCase.ts'. Rename '${name}'.`);
  }
}

// --- content checks: types & data-modeling conventions ---------------------
// These enforce the "TypeScript" rules of AGENTS.md (Model/Type suffixes,
// values-first derived types, Map dictionaries). Kept conservative to avoid
// false positives — line comments (`//`) are stripped before matching.

// Type names that are exempt from the Model/Type suffix rule.
const TYPE_NAME_EXEMPT = /(?:Model|Type|Props|State|Action)$/;

function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

for (const file of files) {
  const name = basename(file);
  const rel = relPosix(file);
  const folder = parentFolder(file);

  if (/\.test\.[tj]sx?$/.test(name)) continue;
  if (/\.stories\.[tj]sx?$/.test(name)) continue;
  if (!/\.(ts|tsx)$/.test(name)) continue;
  if (/\.d\.ts$/.test(name)) continue;

  let code = '';
  try {
    code = stripLineComments(readFileSync(file, 'utf8'));
  } catch {
    continue;
  }

  // (A) Entity/Type naming — every exported `type`/`interface` must end with an
  //     approved suffix. Models for entities, `Type` for everything else.
  if (folder === 'types') {
    const declRe = /export\s+(?:type|interface)\s+([A-Za-z0-9_]+)/g;
    for (const m of code.matchAll(declRe)) {
      const typeName = m[1];
      if (!TYPE_NAME_EXEMPT.test(typeName)) {
        violations.push(
          `${rel}: exported type '${typeName}' must be suffixed — '${typeName}Model' if it's an entity, otherwise '${typeName}Type' (see AGENTS.md "TypeScript").`,
        );
      }
    }

    // (B) Hand-written literal unions should be derived from constants/zod.
    //     Flags `export type X = 'a' | 'b'` or numeric-literal unions.
    const unionRe =
      /export\s+type\s+[A-Za-z0-9_]+\s*=\s*((?:'[^']*'|"[^"]*"|\d+)\s*\|\s*(?:'[^']*'|"[^"]*"|\d+)[^=\n]*)/g;
    for (const m of code.matchAll(unionRe)) {
      violations.push(
        `${rel}: literal union '${m[1].trim()}' is hand-written. Define the values in a '*.constants.ts' (\`as const\`) and DERIVE the type (z.enum/typeof) — values are the source of truth (see AGENTS.md "TypeScript").`,
      );
    }
  }

  // (C) Dictionary anti-pattern — `.find(` lookups inside constants files.
  //     Use a `Map` keyed by id instead of an array scanned with find.
  if (folder === 'constants' && /\.find\s*\(/.test(code)) {
    violations.push(
      `${rel}: avoid array '.find(...)' lookups for dictionaries — define a 'new Map(...)' keyed by id and use '.get(key)' (see AGENTS.md "TypeScript").`,
    );
  }
}

if (violations.length === 0) {
  process.exit(0);
}

const msg = [
  'AGENTS.md convention check failed — separation of concerns / naming / data modeling.',
  'Fix each item below (move/rename files, suffix types, derive types from constants, use Maps, add stories), then verify:',
  '',
  ...violations.map((v) => `  - ${v}`),
  '',
  'Category rules: components/ -> PascalCase.tsx | hooks/ -> useX.ts | context/ -> PascalCase.context.tsx | ' +
    'constants/ -> *.constants.ts | helpers/ -> *.helpers.ts | types/ -> *.types.ts',
  'Feature components: prefix with the PascalCase feature name (bills -> BillsTable, BillsStatusPill).',
  'packages/ui: one folder per component (components/X/X.tsx) with a colocated X.stories.tsx.',
  'Next reserved files (page/layout/route/loading/error/...) are exempt; other app/ components belong in features.',
  "Data modeling: entities -> XxxModel; other types -> XxxType; reference entity props as Model['prop']; " +
    'derive union types from `as const` constants/zod; look up by key with a Map, not array.find.',
].join('\n');

// exit code 2 => block Stop and surface stderr to the agent as feedback.
process.stderr.write(msg + '\n');
process.exit(2);
