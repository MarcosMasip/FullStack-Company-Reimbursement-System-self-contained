# FullStack Company Reimbursement System

Self‑contained Java (Javalin) + vanilla JS expense reimbursement demo. Employees submit reimbursements; managers review/approve/deny.

## ✨ What's New (Self-Contained Mode)
The project now runs 100% locally with an embedded H2 database (MariaDB compatibility mode) – no external services required. A single command builds and launches the app and auto‑seeds sample data.

## 🚀 Quick Start
Clone and run (macOS/Linux):

```bash
./run.sh
```

Windows (Command Prompt or PowerShell):

```bat
run.bat
```

Then open:

```
http://localhost:7070/public/index.html
```

Health check:

```
http://localhost:7070/health  -> {"status":"UP"}
```

## 🗄 Default Credentials (Seed Data)
Manager: `manager1@example.com` / `password`

Employees:
- `alice@example.com` / `password`
- `bob@example.com` / `password`
- `carol@example.com` / `password`

Categories: Travel, Meals, Supplies.

Sample reimbursements include pending, approved, and denied examples.

## 🧪 One-Time Build & Offline Use
First run downloads dependencies. After that you can work offline:

```bash
./run.sh   # rebuilds only if sources changed
# or explicitly offline after first build
./mvnw -o package
```

## 🔄 Database Modes
Embedded (default): file DB stored under `./.localdb/` (created automatically). Schema + seed run on first startup via H2 `INIT`.

Remote (legacy MariaDB) mode (requires `connection.properties` still pointing to a reachable server):

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

Run jar directly (after build):

```bash
java -jar target/Project1-0.0.1-SNAPSHOT-shaded.jar
```

Force remote DB (if configured):

```bash
java -DB_MODE=REMOTE -jar target/Project1-0.0.1-SNAPSHOT-shaded.jar
```

## 🧪 Testing Notes
Tests will execute against embedded DB automatically (DB_MODE defaults to EMBEDDED). If you introduce stateful tests, consider truncating tables between cases.

## 🧹 Removed Dependencies
Hibernate & related libs were removed (DAOs are pure JDBC). `HibernateUtil` deleted.

## 📦 Offline Build Verification
After the first successful run (dependencies cached in local Maven repo), you can verify an offline build:

```bash
./mvnw -o -DskipTests package
```

Then launch:

```bash
java -jar target/Project1-0.0.1-SNAPSHOT-shaded.jar
```

If you need to clear the embedded database, delete the `.localdb/` directory and restart.

## 🧭 Roadmap / Ideas
- Optional Docker Compose (MariaDB + app)
- Authentication / session handling
- Enum for reimbursement status
- Frontend UX improvements

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
