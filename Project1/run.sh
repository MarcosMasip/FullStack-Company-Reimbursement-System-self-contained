#!/usr/bin/env bash
set -euo pipefail

# Single-command build & run script for macOS/Linux
# Usage: ./run.sh [--remote-db] [--no-start|--build-only] [--force-build] [--port <number>]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DB_MODE="EMBEDDED"
START_APP=true
FORCE_BUILD=false
CUSTOM_PORT=""

for arg in "$@"; do
  case "$arg" in
    --remote-db)
      DB_MODE="REMOTE";
      shift ;;
    --no-start|--build-only)
      START_APP=false;
      shift ;;
    --force-build)
      FORCE_BUILD=true;
      shift ;;
    --port)
      shift; CUSTOM_PORT="$1"; shift ;;
    *)
      # leave unknown args for the java process
      ;;
  esac
done

echo "[run.sh] Selected DB_MODE=$DB_MODE"

# The shade plugin currently outputs an unclassified jar named Project1-0.0.1-SNAPSHOT.jar
# (dependency-reduced-pom.xml present). Adjust pattern accordingly.
JAR_PATTERN="target/Project1-0.0.1-SNAPSHOT.jar"

# Ensure Maven Wrapper exists (fallback to system mvn if absent)
MVN_CMD="./mvnw"
if [[ ! -x "$MVN_CMD" ]]; then
  if command -v mvn >/dev/null 2>&1; then
    echo "[run.sh] Maven wrapper not found, using system mvn"
    MVN_CMD="mvn"
  else
    echo "Error: Maven not available and wrapper missing." >&2
    exit 1
  fi
fi

# Build if jar missing or sources newer than jar
REBUILD=false
if [[ ! -f $JAR_PATTERN ]]; then
  REBUILD=true
else
  if [[ $(find src/main/java src/main/resources -type f -newer $JAR_PATTERN | head -n 1) ]]; then
    REBUILD=true
  fi
fi

if $FORCE_BUILD; then
  echo "[run.sh] --force-build specified; rebuilding regardless of timestamps"
  REBUILD=true
fi

if $REBUILD; then
  echo "[run.sh] Building project (this may download dependencies the first time)";
  $MVN_CMD -q -DskipTests package
else
  echo "[run.sh] Reusing existing build (no changes detected)"
fi

if [[ ! -f $JAR_PATTERN ]]; then
  echo "Error: Shaded jar not found after build: $JAR_PATTERN" >&2
  exit 1
fi

if $START_APP; then
  if [[ -n "$CUSTOM_PORT" ]]; then
    echo "[run.sh] Using custom port $CUSTOM_PORT"
    PORT_ARG="-DPORT=$CUSTOM_PORT"
  else
    PORT_ARG=""
  fi
  echo "[run.sh] Starting application (DB_MODE=$DB_MODE)" 
  exec java $PORT_ARG -DB_MODE="$DB_MODE" -jar "$JAR_PATTERN" "$@"
else
  echo "[run.sh] Build completed. Skipping startup due to --no-start flag."
fi
