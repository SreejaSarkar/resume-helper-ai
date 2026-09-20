# Resume Helper AI

Resume Helper AI is a full-stack resume intelligence application with a React frontend and a NestJS backend. It helps users analyze resume-to-job fit, review ATS friendliness, close skill gaps, and prepare for interviews using grounded, resume-based guidance.

## Project Structure

```text
resume-helper-ai/
  frontend/
  backend/
  .gitignore
  README.md
```

## Main Features

- Resume match analysis with deterministic scoring plus AI enrichment
- ATS friendliness analysis
- Skill Gap Bridge for truthful gap-closing guidance
- Interview Coach with answer strategies and follow-up risk detection
- Firebase-based authentication
- Backend observability via the local API Observatory SDK

## Tech Stack

- Frontend: React, Vite, MUI, Firebase Auth
- Backend: NestJS, TypeORM, PostgreSQL, Firebase Admin, Cohere

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

## Notes

- The repository is intended to be managed as a single Git repo at the project root.
- `frontend` and `backend` are application folders inside that shared repository.
- Local environment files are intentionally ignored.