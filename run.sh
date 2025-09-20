#!/usr/bin/env bash
# Convenience wrapper to run the Project1 app from repo root.
# Uses the shaded (fat) jar produced as Project1-0.0.1-SNAPSHOT.jar.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/Project1"
exec ./run.sh "$@"
