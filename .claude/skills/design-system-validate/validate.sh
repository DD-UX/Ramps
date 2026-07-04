#!/usr/bin/env bash
#
# design-system-validate — the pre-push gate for the design system (@ramps/ui).
#
# Order of operations (fail fast on the HARD steps):
#   1. build-storybook        — the suite runs against the STATIC build, so this
#                               is what actually ships to /storybook. HARD.
#   2. token+structure fidelity — HARD gate, two spec families:
#                               token-fidelity: computed styles resolve to the
#                                 verified --rui-* values (parsed from tokens.css).
#                               structure-fidelity: the measured look & feel from
#                                 the Ramp frames (near-square radii, disabled
#                                 affordance, soft-glow, floating label, shared
#                                 tab underline). A drift in either blocks the push.
#   3. visual-advisory        — gallery capture + side-by-side with the Ramp
#                               video frames. ADVISORY: reported, never blocks.
#
# Exit 0 = safe to push. Non-zero = a hard gate failed; do NOT push.
#
# Usage:
#   bash .claude/skills/design-system-validate/validate.sh [--skip-build] [--gate-only]
#
set -uo pipefail

# --- locate the ui package regardless of cwd / invocation ------------------
# This is a pre-push gate: it must resolve its own project root and never depend
# on the caller exporting CLAUDE_PROJECT_DIR (so it works from a git pre-push
# hook, CI, or any subdir). We derive the repo root from the script's own
# location (symlink-safe) and only fall back to CLAUDE_PROJECT_DIR as a hint.
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SCRIPT_SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
  SCRIPT_SOURCE="$(readlink "$SCRIPT_SOURCE")"
  [[ "$SCRIPT_SOURCE" != /* ]] && SCRIPT_SOURCE="$DIR/$SCRIPT_SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SCRIPT_SOURCE")" && pwd)"
# skills/design-system-validate -> repo root is three levels up.
DERIVED_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$DERIVED_ROOT}"
UI_DIR="$PROJECT_DIR/packages/ui"

# Guard against a wrong resolution: if the hinted root has no ui package but the
# derived one does, trust the script's own location.
if [ ! -f "$UI_DIR/package.json" ] && [ -f "$DERIVED_ROOT/packages/ui/package.json" ]; then
  PROJECT_DIR="$DERIVED_ROOT"
  UI_DIR="$PROJECT_DIR/packages/ui"
fi
if [ ! -f "$UI_DIR/package.json" ]; then
  echo "✗ cannot locate @ramps/ui (looked in $UI_DIR) — run from the ramps repo." >&2
  exit 2
fi

SKIP_BUILD=0
GATE_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    --gate-only)  GATE_ONLY=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# --- node/pnpm on PATH (nvm-managed) ---------------------------------------
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 && nvm use 24 >/dev/null 2>&1 || true
fi

cd "$UI_DIR" || { echo "cannot cd to $UI_DIR" >&2; exit 2; }

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }

# --- 1. build the static Storybook (HARD) ----------------------------------
if [ "$SKIP_BUILD" -eq 0 ]; then
  step "1/3  build-storybook (static build the suite validates)"
  if ! pnpm build-storybook >/tmp/dsv-build.log 2>&1; then
    tail -20 /tmp/dsv-build.log
    bold "✗ build-storybook failed — fix the build before pushing."
    exit 1
  fi
  echo "  ✓ storybook-static built"
else
  echo "▶ 1/3  build-storybook SKIPPED (--skip-build); using existing storybook-static/"
fi

# --- 2. token-fidelity (HARD gate) -----------------------------------------
step "2/3  token-fidelity (HARD gate — computed styles vs --rui-* tokens)"
if ! pnpm validate:gate; then
  bold "✗ TOKEN FIDELITY FAILED — a primitive drifted from the verified tokens."
  bold "  This blocks the push. Inspect: pnpm --filter @ramps/ui validate:report"
  exit 1
fi
echo "  ✓ all primitives resolve to the verified Ramp tokens"

# --- 3. visual-advisory (ADVISORY — never blocks) --------------------------
if [ "$GATE_ONLY" -eq 0 ]; then
  step "3/3  visual-advisory (ADVISORY — gallery + Ramp frame side-by-side)"
  if ! pnpm validate:advisory; then
    bold "! visual-advisory reported drift (ADVISORY — does not block the push)."
    bold "  Review the gallery: pnpm --filter @ramps/ui validate:report"
  else
    echo "  ✓ advisory gallery captured"
  fi
else
  echo "▶ 3/3  visual-advisory SKIPPED (--gate-only)"
fi

printf '\n'
bold "✓ design system validated — safe to push."
exit 0
