#!/usr/bin/env bash
# Install Google style Cursor skills into your personal skills directory.
set -euo pipefail

SKILLS_SRC="$(cd "$(dirname "$0")/../skills" && pwd)"
SKILLS_DEST="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"

usage() {
  cat <<'EOF'
Usage: ./scripts/install.sh [--symlink]

Installs all skills from this repo into your Cursor personal skills folder.

Options:
  --symlink   Symlink skills instead of copying (stays in sync when you git pull)
  --help      Show this help

Environment:
  CURSOR_SKILLS_DIR   Override destination (default: ~/.cursor/skills)

After install, restart Cursor or start a new agent chat to pick up skills.
EOF
}

MODE="copy"
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi
if [[ "${1:-}" == "--symlink" ]]; then
  MODE="symlink"
fi

mkdir -p "$SKILLS_DEST"

count=0
for skill_dir in "$SKILLS_SRC"/*/; do
  name="$(basename "$skill_dir")"
  dest="$SKILLS_DEST/$name"

  if [[ ! -f "$skill_dir/SKILL.md" ]]; then
    echo "skip: $name (no SKILL.md)"
    continue
  fi

  if [[ -e "$dest" ]]; then
    echo "replace: $dest"
    rm -rf "$dest"
  fi

  if [[ "$MODE" == "symlink" ]]; then
    ln -s "$skill_dir" "$dest"
    echo "linked: $name"
  else
    cp -R "$skill_dir" "$dest"
    echo "copied: $name"
  fi
  count=$((count + 1))
done

echo ""
echo "Installed $count skills to $SKILLS_DEST"
echo "Open Cursor → Settings → Rules → Agent Skills to verify."
