#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

git -C "$ROOT" config core.hooksPath .githooks
chmod +x "$ROOT/.githooks/pre-commit" "$ROOT/.githooks/pre-push"

echo "Configured Git hooks path to .githooks"
echo "Installed hooks:"
echo "  - pre-commit"
echo "  - pre-push"
