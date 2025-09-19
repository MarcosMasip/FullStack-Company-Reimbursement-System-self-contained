@echo off
setlocal enabledelayedexpansion
REM Single-command build & run script for Windows
REM Usage: run.bat [--remote-db]

set DB_MODE=EMBEDDED
if "%1"=="--remote-db" set DB_MODE=REMOTE

echo [run.bat] Selected DB_MODE=%DB_MODE%

set JAR_PATH=target\Project1-0.0.1-SNAPSHOT-shaded.jar

set MVN_CMD=mvnw.cmd
if not exist %MVN_CMD% (
  where mvn >NUL 2>&1
  if errorlevel 1 (
    echo Error: Maven wrapper and system mvn not found.
    exit /b 1
  ) else (
    set MVN_CMD=mvn
    echo [run.bat] Using system mvn
  )
)

REM Build if jar missing
if not exist %JAR_PATH% (
  echo [run.bat] Building project...
  %MVN_CMD% -q -DskipTests package
) else (
  echo [run.bat] Existing build detected. Skipping rebuild.
)

if not exist %JAR_PATH% (
  echo Error: Shaded jar not found after build: %JAR_PATH%
  exit /b 1
)

echo [run.bat] Starting application on http://localhost:7070 (DB_MODE=%DB_MODE%)
java -DB_MODE=%DB_MODE% -jar %JAR_PATH% %*
