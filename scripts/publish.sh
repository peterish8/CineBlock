#!/usr/bin/env bash
# Push this repo to GitHub after creating an empty remote repository.
set -euo pipefail

REMOTE="${1:-https://github.com/peterish8/cursor-google-style-skills.git}"

echo "Publishing to $REMOTE"
echo ""
echo "Create an empty repo on GitHub first (no README), then run this script."
echo ""

git branch -M main 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git push -u origin main

echo ""
echo "Done. On your laptop:"
echo "  git clone $REMOTE"
echo "  cd cursor-google-style-skills"
echo "  ./scripts/install.sh"
