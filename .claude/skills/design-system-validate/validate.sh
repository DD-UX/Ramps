#!/usr/bin/env bash
#
# design-system-validate — the pre-push gate for the design system (@ramps/ui).
#
# Order of operations (fail fast on the HARD steps):
#   1. build-storybook        — the suite runs against the STATIC build, so this
#                               is what actually ships to /storybook. HARD.
#   2. token-fidelity         — computed styles must resolve to the verified
#                               --rui-* token values (parsed from tokens.css).
#                               HARD. A drift here blocks the push.
#   3. visual-advisory        — gallery capture + side-by-side with the Ramp
#                               video frames. ADVISORY: reported, never blocks.
#
# Exit 0 = safe to push. Non-zero = a hard gate failed; do NOT push.
#
# Usage:
#   bash .claude/skills/design-system-validate/validate.sh [--skip-build] [--gate-only]
#
set -uo pipefail

# --- locate the ui package regardless of cwd -------------------------------
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
UI_DIR="$PROJECT_DIR/packages/ui"

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
