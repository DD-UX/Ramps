#!/usr/bin/env bash
# Scaffolds apps/web/src/features/<feature>/ with category subfolders, each seeded with .gitkeep.
# Usage: scaffold.sh <feature-name>
set -euo pipefail

raw="${1:-}"
if [ -z "$raw" ]; then
  echo "Error: feature name required. Usage: scaffold.sh <feature-name>" >&2
  exit 1
fi

# Normalize to kebab-case: lowercase, non-alphanumerics -> hyphens, collapse/trim hyphens.
feature="$(printf '%s' "$raw" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/-+/-/g; s/^-//; s/-$//')"

if [ -z "$feature" ]; then
  echo "Error: '$raw' normalized to an empty name." >&2
  exit 1
fi

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
target="$root/apps/web/src/features/$feature"

if [ -d "$target" ]; then
  echo "Error: feature already exists at apps/web/src/features/$feature" >&2
  exit 1
fi

categories="components hooks context constants helpers types"

for cat in $categories; do
  dir="$target/$cat"
  mkdir -p "$dir"
  touch "$dir/.gitkeep"
done

echo "Created feature: apps/web/src/features/$feature"
echo "Categories: $categories"
