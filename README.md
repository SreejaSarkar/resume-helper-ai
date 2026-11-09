# Resume Helper AI

**Live App:** [https://resume-helper-ai-nu.vercel.app](https://resume-helper-ai-nu.vercel.app)

Resume Helper AI is a full-stack resume intelligence application with a React frontend
and a NestJS backend. It helps users analyze resume-to-job fit, review ATS friendliness,
close skill gaps, and prepare for interviews using grounded, resume-based AI guidance.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Monorepo Layout](#monorepo-layout)
- [Prerequisites](#prerequisites)
- [Backend](#backend)
- [Frontend](#frontend)

## Architecture

```
┌──────────────┐    REST (axios)   ┌──────────────┐    SQL     ┌──────────────┐
│   Frontend   │ ────────────────▶ │   Backend    │ ─────────▶ │  PostgreSQL  │
│  (React +    │ ◀──────────────── │  (NestJS)    │  (TypeORM) │              │
│    Vite)     │      JSON          │              │            └──────────────┘
└──────┬───────┘                   └──────┬───────┘
       │ Firebase Auth                    │
       ▼                       ┌──────────┼───────────┐
┌──────────────┐               ▼          ▼           ▼
│  Firebase    │         ┌──────────┐ ┌────────┐ ┌──────────────┐
│  (Google /   │         │  Cohere  │ │ PDF    │ │ API          │
│  Email auth) │         │  / LLM   │ │ parse  │ │ Observatory  │
└──────────────┘         └──────────┘ └────────┘ └──────────────┘
```

## Features

- **Resume match analysis** — deterministic scoring plus AI enrichment for resume-to-job fit.
- **ATS friendliness analysis** — checks formatting and keyword compatibility.
- **Skill Gap Bridge** — truthful, resume-grounded guidance to close skill gaps.
- **Interview Coach** — answer strategies and follow-up risk detection.
- **Auto-optimize** — AI-assisted resume improvements.
- **PDF parsing & generation** — extract text from uploads and render output.
- **Firebase authentication** — Google and email/phone sign-in.
- **Admin tools** — user management and feedback review.
- **Backend observability** — instrumented with the `@sreejasarkar/api-observatory` SDK.

## Tech Stack

| Layer    | Technology                                                           |
| -------- | ------------------------------------------------------------------- |
| Frontend | React 19, Vite 7, MUI 7, React Router 7, Firebase Auth, Axios       |
| Backend  | NestJS 11, TypeORM, PostgreSQL, Firebase Admin, Cohere, Puppeteer   |
| Tooling  | TypeScript, Jest, ESLint, Prettier                                  |

## Monorepo Layout

```
resume-helper-ai/
├── backend/     # NestJS API, AI services, PDF parsing, auth
└── frontend/    # React + Vite single-page app
```

## Prerequisites

- Node.js `18+`
- PostgreSQL `14+`
- A Firebase project (for authentication)
- A Cohere API key (for AI features)

---

## Backend

A NestJS API that handles resume analysis, ATS scoring, interview prep, history, and
admin functions. It persists data with TypeORM/PostgreSQL, verifies users with Firebase
Admin, calls Cohere for AI enrichment, and reports telemetry through the API Observatory
SDK.

### Modules

- `resume` — resume upload, match analysis, and AI enrichment.
- `ats` — ATS friendliness scoring.
- `ai` — AI grounding and analysis utilities.
- `interview` — interview coaching and question generation.
- `auto-optimize` — AI-assisted resume optimization.
- `history` — stored analysis history.
- `user` — user records and profiles.
- `admin` — admin management and user controls.
- `feedback` — user feedback collection.
- `budget` — usage/budget tracking.
- `pdf` — PDF parsing and rendering.
- `auth` — Firebase token verification, guards, and roles.
- `observability` — API Observatory instrumentation.

### Environment Variables

Create `backend/.env`:

```env
# Server
PORT=5000

# Database — use DATABASE_URL, or the discrete DB_* values
DATABASE_URL="postgresql://user:password@localhost:5432/resume_helper"
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=password
# DB_NAME=resume_helper

# AI
COHERE_API_KEY="your-cohere-api-key"

# Firebase Admin (service account)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Observability (optional)
OBSERVATORY_API_KEY=""
OBSERVATORY_SERVER_URL=""
```

> `FIREBASE_PRIVATE_KEY` must keep its `\n` escape sequences; the app converts them to
> real newlines at runtime.

### Setup & Run

```bash
cd backend
npm install
npm run start:dev     # watch mode on http://localhost:5000
```

Uploaded files are served from `/files` (static `uploads/` folder).

### Scripts

| Script               | Description          |
| -------------------- | -------------------- |
| `npm run start:dev`  | Start in watch mode  |
| `npm run start:prod` | Run production build  |
| `npm run build`      | Compile to `dist/`   |
| `npm run lint`       | Lint and auto-fix    |
| `npm run test`       | Unit tests           |
| `npm run test:e2e`   | End-to-end tests     |
| `npm run test:cov`   | Coverage report      |

---

## Frontend

A React + Vite single-page app (MUI components, React Router) that handles resume
upload, displays match/ATS results, interview prep, history, and an admin area. Users
authenticate with Firebase (Google and email/phone).

### Key Areas

- `Dashboard` — resume analysis results and overview
- `InterviewPrep` — interview coaching
- `AutoOptimize` — AI resume optimization
- `History` — past analyses
- `Login` / `EmailLogin` / `PhoneLogin` — Firebase auth flows
- `Admin` — administration

### Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL="http://localhost:5000"
VITE_PUBLIC_APP_URL="http://localhost:5173"
```

> `VITE_API_BASE_URL` points the app at the backend (defaults to `http://localhost:5000`).
> `VITE_PUBLIC_APP_URL` is used for building absolute links in auth emails.
> Firebase web config is defined in `src/utils/firebase.jsx`.

### Setup & Run

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

### Scripts

| Script            | Description            |
| ----------------- | ---------------------- |
| `npm run dev`     | Start dev server       |
| `npm run build`   | Production build       |
| `npm run preview` | Preview the build      |
| `npm run lint`    | Lint                   |

The frontend is deployed on Vercel: **[https://resume-helper-ai-nu.vercel.app](https://resume-helper-ai-nu.vercel.app)**

---

## Notes

- The repository is managed as a single Git repo at the project root.
- `frontend` and `backend` are application folders inside that shared repository.
- Local environment files are intentionally ignored.