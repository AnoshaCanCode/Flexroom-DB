# FlexRoom

FlexRoom is a web application for managing academic assessments, class sections, and student submissions, with support for **students** and **evaluators (instructors)**. Evaluators create and manage assignments; students submit work; the system is designed to support **similarity / plagiarism checks** across stored submissions (see `project-context.md`).

This README summarizes the **repository tech stack**, **data model** (from project documentation and `db/schema.sql`), and **features implemented in this codebase** (evaluator assignment creation UI, course-class API, layout updates).

> **Note:** A requested `usecase.pdf` was **not found** in this repository (no PDF matched `**/usecase*.pdf`). Use-case behavior below is taken from **`project-context.md`** and the implemented routes. If you add `docs/usecase.pdf` later, extend this file to reference it explicitly.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19, React Router 7, Bootstrap 5, CSS Modules, `axios`, `react-dropzone` |
| Backend (root) | Node.js, Express, `mssql`, `dotenv` (see `index.js`, `dbconfig.js`) |
| Database | Microsoft SQL Server (`FlexroomDB`; scripts in `db/schema.sql`) |
| Optional mini-service | `client/src/components/courseClasses-Backend` — Express routes + shared `dbconfig` |

---

## Domain overview (`project-context.md`)

- **Users** — `student` or `evaluator`; authentication is described as **JWT-based** login/register (full auth wiring may still be in progress in the UI).
- **StudentProfiles / EvaluatorProfiles** — extended profile metadata per role.
- **Course vs CourseClass** — In the design doc, a **Course** is the subject (e.g. Physics); **CourseClass** is a concrete section (e.g. Physics BSCS 4D). The **checked-in `db/schema.sql`** in this repo defines **`CourseClass` only** (no separate `Course` table); `courseID` on `CourseClass` is a non-FK grouping field defaulting to `0`. Align migrations if you reintroduce a full `Course` entity.
- **Assessment** — Belongs to a `CourseClass` (`classID`); types: **`document`**, **`code`**, **`bubble`**; includes title, marks, dates, status.
- **Submissions** — Binary file storage (`VARBINARY(MAX)`), linked to student and assignment.
- **MatchResults** — Pairwise similarity between submissions; **auto-flag** when similarity &gt; 30% (computed column in schema).

### Business rules (from `project-context.md`)

- Passwords at least **8** characters.
- Students see **only their own** submissions.
- Evaluators see **all** submissions and plagiarism-related results.
- Prefer API payloads whose keys align with **SQL column names** where applicable.

---

## Repository layout (high level)

```
client/                 # Create React App frontend
  src/
    api/assignmentsApi.js
    components/
      assignment-create/    # Evaluator “create assignment” UI
      courseClasses-Backend/ # Optional Node service (course / class API)
      DashboardLayout.jsx, Topbar.jsx, Sidebar.jsx, …
    pages/
      EvaluatorDashboard.jsx
      CreateDocAssignmentPage.jsx
      CreateCodeAssignmentPage.jsx
db/schema.sql           # SQL Server DDL + seed data
dbconfig.js             # DB connection config (env vars)
index.js                # Root Express sample app
project-context.md      # Product / schema notes
```

---

## Implemented features (this branch / recent work)

### 1. Evaluator dashboard and assignment creation (React)

- **Routes** (`client/src/App.js`):
  - `/evaluator` — Evaluator home (layout + `EvaluatorDashboard`).
  - `/create-doc-assignment` — Create **document**-type assignment (PDF question + optional key, rubric).
  - `/create-code-assignment` — Same as document flow plus **test cases** (input + marks).
- **Layout** — `DashboardLayout` + `Sidebar` + `Topbar`; outlet **`context`** exposes `setCourseHeader` so create pages can show **class title** and **class code** under the top bar (`Topbar.jsx`).
- **Greeting** — Evaluator display name from `localStorage` key `flexroomDisplayNameEvaluator`, fallback **“Rida Amir”**; student path uses `flexroomDisplayName` / **“Apple”** (see `DashboardLayout.jsx`).
- **`AssignmentCreateForm.jsx`** — Interactive title, due date, optional total marks, two **PDF** dropzones (`react-dropzone`), dynamic **rubric** rows, **test cases** when `variant="code"`. **Add** submits `FormData` via `postCreateAssessment()` and navigates to `/evaluator` on success.
- **`EvaluatorDashboard.jsx`** — Class cards from `data/ClassData.js` plus links into both create flows with default navigation **state** (`Operating Systems` / `BSCS-4J`).

### 2. Assessment create API (frontend contract)

- **Module:** `client/src/api/assignmentsApi.js`
- **Default URL:** `POST /api/assessments-backend/api/grading/assessments`
- **Override:** set `REACT_APP_ASSESSMENTS_API_URL` (e.g. full backend URL in `.env` for the client).
- **Multipart fields (typical):** `title`, `dueDate`, `assessmentType` (`document` | `code`), `courseTitle`, `courseCode`, optional `totalMarks`, JSON `rubric`, optional JSON `testCases` (code), files `questionPdf`, optional `solutionKey`.

### 3. `courseClasses-Backend` (Node + Express router)

- **`db.js`** — Reuses repo-root `dbconfig.js` via relative path; exports `getPool()` and `sql` from `mssql`.
- **`routes/course.js`** — Express router (mount as you prefer, e.g. under `/api/course`):
  - **`POST /create`** — JWT + evaluator role; inserts into **`CourseClass`** (unique `classCode` → HTTP 409 `Duplicate Course Code` on conflict).
  - **`GET /:id`** — Fetch by **`classID`**.
- **Env:** `JWT_SECRET` plus the same DB variables as `dbconfig.js`. Install deps with `npm install` inside `courseClasses-Backend` (see its `package.json`).

---

## Running the app

### Frontend only

```bash
cd client
npm install
npm start
```

Open routes such as `/evaluator`, `/create-doc-assignment`, `/create-code-assignment`.

### Full stack (root `package.json`)

```bash
npm install
npm run dev
```

Runs root `index.js` and the CRA client via `concurrently` (configure SQL Server and `.env` for `dbconfig.js`).

---

## Environment variables (reference)

| Variable | Used by |
|----------|---------|
| `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`, `DB_PORT` | `dbconfig.js` (SQL Server) |
| `JWT_SECRET` | `courseClasses-Backend` JWT middleware |
| `REACT_APP_ASSESSMENTS_API_URL` | CRA — overrides default assessments POST URL |

---

## Primary user flows (from `project-context.md`)

1. **Authentication** — Register/login; roles **student** / **evaluator** (JWT described in docs).
2. **Evaluator** — Manage classes/sections and **assessments** (`document` / `code` / `bubble`); this repo adds **wizard-style create pages** for document and code assessments with rubric (and test cases for code).
3. **Student** — Join classes, upload submissions tied to an **Assessment**; files stored as binary in SQL Server.
4. **Plagiarism / similarity** — Compare a submission against others; persist results in **MatchResults**; flagging threshold **30%** in schema.

---

## Contributing / Git

Feature work (e.g. evaluator assignment pages) may live on a branch such as `feature/evaluator-assignment-create`. **Pushing a branch does not change `main`** until a merge or PR is completed.

---

## License

See `package.json` (`license` field) and repository metadata on GitHub.
