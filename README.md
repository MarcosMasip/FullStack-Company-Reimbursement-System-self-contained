# FullStack Company Reimbursement System

Self‑contained Java (Javalin) + vanilla JS expense reimbursement demo. Employees submit reimbursements; managers review/approve/deny.

## ✨ What's New (Self-Contained Mode)
The project now runs 100% locally with an embedded H2 database (MariaDB compatibility mode) – no external services required. A single command builds and launches the app and auto‑seeds sample data. The schema + seed scripts are executed programmatically on first access (no fragile H2 `INIT` chaining) for clearer logging and resilience.

## 🚀 Quick Start
Follow these steps exactly (works on macOS, Linux, and Windows). No manual DB setup and no global Maven install required.

### 1. Clone
```bash
git clone https://github.com/MarcosMasip/FullStack-Company-Reimbursement-System-self-contained.git
cd FullStack-Company-Reimbursement-System-self-contained
```

Expected (truncated) output after clone (lines may vary):
```
Cloning into 'FullStack-Company-Reimbursement-System-self-contained'...
Resolving deltas: 100% (...)
```

### 2. (macOS/Linux) Ensure execute permission (first time only)
If scripts already executable this step prints nothing.
```bash
chmod +x run.sh Project1/run.sh Project1/mvnw || true
```

### 3. Run (Build + Start)
macOS/Linux:
```bash
./run.sh
```

Windows (PowerShell or CMD):
```bat
run.bat
```

First run expected output (abridged) – note the dynamic port selection (7070 preferred, auto-fallback if busy):
```
[run.sh] Selected DB_MODE=EMBEDDED
[run.sh] Building project (this may download dependencies the first time)
... (Maven downloads) ...
[# may show different port if 7070 in use]
[run.sh] Starting application (DB_MODE=EMBEDDED)
INFO io.javalin.Javalin - Starting Javalin ...
INFO io.javalin.Javalin - Listening on http://localhost:7070/
INFO io.javalin.Javalin - Starting Javalin ...
INFO io.javalin.Javalin - Listening on http://localhost:7070/
INFO io.javalin.Javalin - Javalin started in XXms \o/
```

Subsequent runs (with no code changes) expected output:
```
[run.sh] Selected DB_MODE=EMBEDDED
[run.sh] Reusing existing build (no changes detected)
[run.sh] Starting application (DB_MODE=EMBEDDED)
...
```

### 4. Open the App
```
http://localhost:7070/
```
The server now redirects `/` to `index.html` automatically.

### 5. Verify Health Endpoint
Browser or curl:
```
http://localhost:7070/health
```
Expected response body:
```json
{"status":"UP"}
```

### 6. (Optional) Build Only / Flags (CI / cache warm)
```
./run.sh --no-start        # Build only (skip launching)
./run.sh --force-build     # Force rebuild even if no changes detected
./run.sh --port 8081       # Prefer a specific port
./run.sh --remote-db       # Use connection.properties (MariaDB)

WINDOWS: run.bat currently mirrors only the basic start (extend if needed).
```

You can also run the scripts inside `Project1/` directly (advanced use), but root scripts are preferred.

```
http://localhost:7070/public/index.html
```

Health check:

```
http://localhost:7070/health  -> {"status":"UP"}
```

## 🗄 Default Credentials (Seed Data)
Manager login example:
```
Email: manager1@example.com
Password: password
Role: Manager (radio button)
```

Employee login examples (select Employee role):
```
alice@example.com / password
bob@example.com   / password
carol@example.com / password
```

Categories: Travel, Meals, Supplies.

Sample reimbursements include pending, approved, and denied examples.

## 🧪 One-Time Build & Offline Use
First run downloads dependencies. After that you can work offline:

```bash
./run.sh   # rebuilds only if sources changed
# or explicitly offline after first build
./mvnw -o package
```

## 🔄 Database Modes & Initialization
Embedded (default): file DB stored under `./.localdb/` (created automatically). Schema + seed run only once per JVM startup via a simple SQL parser that accumulates statements until a semicolon. This avoids brittle escaping issues previously seen with H2 URL `INIT` sequences.

Remote (legacy MariaDB) mode (requires `connection.properties` pointing to a reachable server):

```bash
./run.sh --remote-db
```

Or manually:

```bash
DB_MODE=REMOTE ./run.sh
```

## 🧬 Tech Stack
Backend:
- Java 8, Javalin 3.x
- JDBC (DAOs) with embedded H2 (MariaDB compatibility mode)
- Gson for JSON
- Shaded fat JAR build (maven-shade-plugin)

Frontend:
- Static HTML/CSS/JS served from `src/main/resources/public`
- Vanilla JS fetch calls to REST endpoints

## 🔗 Key Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | /health | Liveness check |
| GET | /diag/db | Embedded DB diagnostics (counts) |
| PUT | /employee | Create employee |
| GET | /employees | List employees |
| GET | /employee/:eid | Get employee |
| POST | /employee | Update employee |
| DELETE | /employee | Delete employee |
| (Similar groups for managers, reimbursements, expense categories) | | |

Filtering / sorting for reimbursements via query params: `?employeeId=`, `?categoryId=`, `?managerId=`, `?approval=`, `?sort_amount=ASC|DESC`, etc.

## 🧱 Database Schema (Simplified)
Tables: `MANAGER`, `EMPLOYEE (fk -> MANAGER)`, `EXPENSE_CATEGORY`, `REIMBURSEMENT (fk -> EMPLOYEE, EXPENSE_CATEGORY)`.
Status codes: `0=pending`, `1=approved`, `2=denied`.

DDL + seed scripts live under `src/main/resources/db/` (`schema.sql`, `data.sql`).

## 🛠 Development
Build only:

```bash
./mvnw -DskipTests package
```

Run jar directly (after build) (advanced/manual):

```bash
java -jar target/Project1-0.0.1-SNAPSHOT.jar
```

Force remote DB (if configured):

```bash
java -DB_MODE=REMOTE -jar target/Project1-0.0.1-SNAPSHOT.jar
```

## 🧪 Testing Notes
Tests will execute against embedded DB automatically (DB_MODE defaults to EMBEDDED). If you introduce stateful tests, consider truncating tables between cases.

## 🧹 Removed Dependencies
Hibernate & related libs were removed (DAOs are pure JDBC). `HibernateUtil` removed (file deleted).

Ignored Artifacts: Maven `target/` output directories and embedded H2 files (`.localdb`, `*.mv.db`, `*.trace.db`) are excluded via `.gitignore` to keep commits clean. If you need a fresh build: `./mvnw clean package` (or delete `target/`).

## 📦 Offline Build Verification
After the first successful run (dependencies cached in local Maven repo), you can verify an offline build:

```bash
./mvnw -o -DskipTests package
```

Then launch:

```bash
java -jar target/Project1-0.0.1-SNAPSHOT.jar
```

If you need to clear the embedded database, stop the app, delete the `.localdb/` directory (ignored by git), then restart. The schema + seed will be re-applied.

### Diagnostics Endpoint
```
curl http://localhost:7070/diag/db
```
Example response:
```json
{"ok":true,"manager":1,"employee":3,"expense_category":3,"reimbursement":3}
```
If you see `{"ok":false,"error":"no-connection"}` the schema initialization failed early; inspect console logs for `[ConnectionUtil]` errors and optionally delete `.localdb/` before retrying.

### Login Troubleshooting
- Ensure you selected the correct role (Manager vs Employee) radio button.
- Password for all seed users is `password`.
- If the reimbursements pages show no data, refresh after first login (seed fetch may occur once per session).
- Clear browser sessionStorage/localStorage if switching between roles repeatedly.

### Build Only (Skip Starting Server)
To just compile (useful in CI or to warm the local Maven cache) without launching Javalin:

```bash
./run.sh --no-start
```
Inside `Project1/` you can also run:
```bash
./run.sh --build-only
```
Expected output (abridged):
```
[run.sh] Selected DB_MODE=EMBEDDED
[run.sh] Building project (this may download dependencies the first time)
[run.sh] Build completed. Skipping startup due to --no-start flag.
```

## 🧭 Roadmap / Ideas
- Optional Docker Compose (MariaDB + app)
- Authentication / session handling (server-side /login endpoint)
- Enum for reimbursement status
- Frontend UX improvements
- Structured error responses when DB unavailable

### (Future) Docker Compose Example (Not Included Yet)
Potential `docker-compose.yml` (future):

```yaml
version: '3.8'
services:
	db:
		image: mariadb:11
		environment:
			MARIADB_ROOT_PASSWORD: root
			MARIADB_DATABASE: project1_db
		ports: ["3306:3306"]
	app:
		build: .
		environment:
			DB_MODE: REMOTE
		depends_on: [db]
```


## 📝 License
See `LICENSE`.

---
Questions or contributions welcome.

## ❗ Troubleshooting Execution Permission (macOS/Linux)
If you see `permission denied: ./run.sh` after cloning:

```bash
chmod +x run.sh Project1/run.sh Project1/mvnw
./run.sh
```

Or invoke explicitly via bash:

```bash
bash run.sh
```

Git sometimes strips execute bits if they weren’t committed with them; the above fixes it once.
