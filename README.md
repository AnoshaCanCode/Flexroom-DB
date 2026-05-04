# FlexRoom

FlexRoom is a full-stack academic platform for **students** and **evaluators (instructors)**: class sections, assessments (`document`, `code`, `bubble`), file submissions stored in SQL Server, **autograding** for code assessments, **similarity / plagiarism** analysis, and dashboards with progress visualization.

This file describes the **`main`** branch (the default branch on GitHub) and maps **all other published remote branches** so you can see what is already folded into `main` versus what still needs a merge or cherry-pick.

**Canonical remote:** `https://github.com/Flexroom3/Flexroom`  
**Product / schema notes:** [`project-context.md`](project-context.md)  
**Requirements / use cases (PDF):** [`UseCases.pdf`](UseCases.pdf) (repository root)

---

## Tech stack (`main`)

| Area | Technology |
|------|----------------|
| Frontend | [Create React App](client/), React 19, React Router 7, Bootstrap 5, CSS Modules, Recharts, Lucide / React Icons |
| Backend | Node.js (CommonJS), Express 5, `mssql`, `multer`, `dotenv`, `express-rate-limit`, `pdf-parse`, `string-similarity`, `uuid` |
| Database | Microsoft SQL Server (`FlexroomDB`; DDL and seed data in [`db/schema.sql`](db/schema.sql)) |
| Dev workflow | `concurrently` runs API and client together (`npm run dev` at repo root) |

---

## Repository layout (`main`)

| Path | Role |
|------|------|
| [`index.js`](index.js) | Express app entry (port **5000**), sample `/api/message` endpoint, mounts routers |
| [`dbconfig.js`](dbconfig.js) | SQL Server connection from environment variables |
| [`routes/gradingRoutes.js`](routes/gradingRoutes.js) | Assessments, submissions, autograde, plagiarism, student notification polling |
| [`routes/userRoutes.js`](routes/userRoutes.js) | Login, join class, evaluator class code generator |
| [`server/`](server/) | Domain logic: assessments (factory), rubric, test cases, solution keys, plagiarism engine, DB singleton, auth singleton, observer notifications |
| [`client/`](client/) | React SPA (public UI, dashboards, flexroom prototypes, auth screens) |
| [`db/schema.sql`](db/schema.sql) | Tables, constraints, and sample inserts |
| [`project-context.md`](project-context.md) | Intended domain model, business rules, design-pattern checklist |

---

## Frontend (`client/src`)

### Routes ([`App.js`](client/src/App.js))

| Path | Purpose |
|------|---------|
| `/` | Landing page |
| `/login`, `/signup` | Authentication screens |
| `/progress` | Standalone progress graph |
| `/change-password`, `/upload-picture` | Account-related flows |
| `/flexroom/student`, `/flexroom/evaluator` | Fixed-size “flexroom” layouts inside a scaled frame |
| `/student`, `/student/settings`, `/student/calendar` | Student shell (`DashboardLayout`) |
| `/evaluator`, `/evaluator/people`, `/evaluator/progress/:studentId` | Evaluator shell and nested views |

### Notable UI modules

- **Shell:** `DashboardLayout`, `Sidebar`, `Topbar`, role-specific dashboards (`StudentDashboard`, `EvaluatorDashboard`).
- **Pages:** `CalendarPage`, `PeoplePage`, `SettingsPage`, `ChangePassword`, `UploadPicture`.
- **Legacy / demo views:** `components/flexroom/*`, `ProgressGraph` (also used under evaluator progress route).

---

## Backend API (`main`)

Base URL for local development is typically `http://localhost:5000` (see [`index.js`](index.js)).

### Users — `/api/users` ([`userRoutes.js`](routes/userRoutes.js))

| Method | Path | Summary |
|--------|------|---------|
| POST | `/login` | Email/password login via `AuthService` |
| POST | `/join-class` | Student joins a class by numeric `classCode` (updates `CourseClass.numStudents`) |
| GET | `/generate-code` | Evaluator-only: suggests a 6-digit class code |

### Grading & assessments — `/api/grading` ([`gradingRoutes.js`](routes/gradingRoutes.js))

| Method | Path | Summary |
|--------|------|---------|
| GET | `/health` | Health check; lists design patterns used in-module |
| POST | `/assessments` | Create assessment row in SQL |
| GET | `/assessments/:id` | Assessment details (via `AssessmentFactory`) |
| POST | `/submissions` | Multipart upload; stores file in `Submissions.FileContent` |
| POST | `/autograde` | Runs test-case pipeline, writes `Grades`, notifies observer |
| POST | `/plagiarism/run` | Compares one submission to peers on the same assignment |
| GET | `/students/:studentId/notifications` | Poll observer notifications after autograde |

### Other

| Method | Path | Summary |
|--------|------|---------|
| GET | `/api/message` | Demo endpoint; reads `Settings.welcomeMessage` when DB is available |

---

## Server modules (`server/`)

| Module area | Files (indicative) | Responsibility |
|-------------|-------------------|----------------|
| Assessment | `Assessment.js`, `AssessmentFactory.js` | Typed assessments and factory construction |
| Grading / rubric / tests | `rubric/Rubric.js`, `testCase/TestCase.js`, `grading/GradingRegistry.js` | Rubric and automated test execution |
| Solution keys | `solutionKey/SolutionKey.js`, `SolutionKeyStates.js` | Solution key handling |
| Plagiarism | `plagiarism/MatchResults.js` | Pairwise similarity over submission bodies |
| Code execution | `codeRunner/CodeExecutionService.js` | Execution support for code assessments |
| Infrastructure | `singleton/ConnectionManager.js`, `singleton/AuthService.js` | Shared DB pool and auth helpers |
| Observer | `observer/DashboardNotifier.js` | Student dashboard notifications after grading events |

The grading router’s `/health` response documents patterns such as **Factory**, **Composite**, **State**, **Template**, **Observer**, and **Singleton** as implemented in this codebase.

---

## Database (`db/schema.sql`)

Tables and concepts on **`main`** include (among others):

- **Users**, **StudentProfiles**, **EvaluatorProfiles**
- **Submissions** (`VARBINARY(MAX)` file storage), **MatchResults** (similarity; auto-flag when similarity exceeds 30%)
- **CourseClass**, **Assessment** (types: `document` | `code` | `bubble`)
- **TestCases**, **Grades**, **Rubrics**
- **Assessment** extensions: `SolutionKey`, `SolutionKeyName` (via `ALTER TABLE`)

**Schema note:** `CourseClass` references a **`Course`** table. The checked-in script expects `Course` to exist before `CourseClass` is created; if your database build fails, add a `CREATE TABLE Course` block consistent with [`project-context.md`](project-context.md) or adjust FKs to match your deployment.

---

## Environment variables

| Variable | Used by |
|----------|---------|
| `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`, `DB_PORT` | [`dbconfig.js`](dbconfig.js) |
| JWT / auth-related secrets | `AuthService` and protected user routes (configure as implemented in [`server/singleton/AuthService.js`](server/singleton/AuthService.js)) |

The React app has no mandatory `REACT_APP_*` variables for basic routing; add API base URLs if you point the UI at a non-default host.

---

## Running locally

**Install and run API + client together:**

```bash
npm install
cd client && npm install && cd ..
npm run dev
```

- API: `http://localhost:5000`
- Client: `http://localhost:3000` (CRA default)

**Backend only:** `npm start`  
**Client only:** `cd client && npm start`

---

## Git branches (remote `origin`)

`main` is the integration line that GitHub shows by default. Other branches are topic lines; some are **fully merged into `main`**, others **diverged** (different commits on both sides—open a PR or rebase before merging).

### Branches whose history is already contained in `main`

These tips are ancestors of current `main` (work is represented on `main`; branch may still exist for reference):

- `origin/Upload-Assessment` — upload assignment UI fixes  
- `origin/assessments-backend` — schema + grading API enhancements  
- `origin/login-backend` — user routes / management  
- `origin/landing-pages` — landing layout and styles  
- `origin/make-assignment-eval-frontend` — evaluator assignment UI thread  
- `origin/uploading-frontend` — layout fixes for uploads  
- `origin/feature/dashboard-layout` — dashboard layout and class cards  
- `origin/feature/student-dashboard` — student dashboard UI  
- `origin/feature/evaluator-sidebar` — progress graph and people page updates  
- `origin/feature-visualize-progress` — `ProgressGraph` implementation  
- `origin/changes-to-visualize-progress` — settings icons, branding, course section labels  
- `origin/settings-page` — settings / upload picture flows  
- `origin/using-components-top&sidebar` — top bar + sidebar integration with progress  
- `origin/alert-autofix-1` — rate limiting / scanning hardening  

### Branches that diverged from `main` (need explicit reconciliation)

| Branch | What it was for (from tip commits / diffs) | Notes |
|--------|---------------------------------------------|--------|
| `origin/feature/evaluator-assignment-create` | Document/code **assignment creation wizard** (`AssignmentCreateForm`, create pages), `client/src/api/assignmentsApi.js`, embedded **`courseClasses-Backend`** under `client/src/components/` | Forked **before** the consolidated `routes/` + `server/` backend on `main`; merging requires resolving large deletes vs current `main`. |
| `origin/assignmentUpload-backend` | **`courseClasses-Backend`** slice (course/class API) | Same family as above; diverged. |
| `origin/final-fixes` | Evaluator **settings connection** and related UI tweaks | Small diff vs an older base; re-apply on `main` if still needed. |
| `origin/dependabot/*` | Dependency bumps (client/npm ecosystem) | Open Dependabot PRs or cherry-pick onto `main` as needed. |

### Local-only branches

Your clone may also have local branches (for example `Upload-Assessment`, `assignmentUpload-backend`, `uploadWorkPages`) that track or mirror the remotes above—use `git branch -vv` to see upstreams.

---

## Contributing

1. Branch from **`main`**, keep changes focused, open a PR into `main`.  
2. After merging, **`README.md` at the repository root** is what GitHub renders on the repo home page—keep it updated when you add major routes, tables, or env vars.

---

## License

See [`package.json`](package.json) (`license` field: **ISC**).
