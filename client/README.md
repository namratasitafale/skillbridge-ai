# SkillBridge AI

SkillBridge AI is a React, TypeScript, and Vite career dashboard demonstration. Resume text extraction and scoring run in the browser with transparent rules; sample job listings, roadmap guidance, and the demo profile are not connected to a live service.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```bash
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Dashboard routes

- `/dashboard`
- `/resume-analyzer`
- `/job-matcher`
- `/learning-roadmap`
- `/analysis-history`
- `/settings`

These routes use client-side browser history. Unauthenticated visits redirect to `/login`; a signed-in demo profile is required to open dashboard routes.

## Available features

- Dashboard total-analysis count, average score, unique identified skills, and average exact-skill job overlap are derived from local reports and target skills in the demo profile. It also includes a score-history chart, roadmap completion, recent activity, and shortcuts.
- Resume Analyzer includes a Try Demo Resume action and accepts PDF/DOCX files up to 10 MB or pasted text. It extracts selectable document text in the browser and checks sections, supported skills, detected education and experience lines, action verbs, measurable outcomes, strengths, weaknesses, and suggestions using explainable rules. Target descriptions enable keyword comparison. Reports can be downloaded as text.
- Scanned PDFs without selectable text are rejected with an OCR limitation message. OCR is not included.
- Job Matcher has six sample opportunities with descriptions and required skills. It searches titles, employers, locations, and skills; filters category, location mode, experience, skill, and saved listings; compares exact skill-name overlap with the latest report/profile; and explains matching/missing skills. Saved/status selections are local. Listings are examples, not verified vacancies, and applications are never submitted.
- Learning Roadmap requires a selected preferred role and organizes HTML, CSS, JavaScript, React, Git/GitHub, and interview preparation into Beginner, Intermediate, and Advanced stages. Up to three optional target-gap milestones can be appended from a report. Completion is stored in this browser and links point to external learning references.
- Analysis History stores report summaries (not the resume text), supports viewing individual reports, and asks before deletion.
- Settings edits the local demo profile, preferred role, comma-separated target skills, theme, notification preferences, and workspace data. Resetting demo data clears reports, saved jobs, activity, learning progress, preferred role, and target skills while keeping the demo name/email and theme.
- Back/Forward browser navigation, visible Back and Dashboard controls, breadcrumbs, protected client routes, and Ctrl/Cmd+K global search are supported.

## Local data and limitations

Demo profile name/email, theme, notification preferences, report summaries, saved sample jobs, activity, and roadmap completion may be stored in browser storage. Raw uploaded files, pasted resume text, and passwords are not stored. Clearing browser site data removes these preferences and records.

The login is only a frontend demo gate and is not secure authentication or server-side access control. Any valid email and an eight-character password can enter; passwords are not saved or sent. Resume scoring is a deterministic text heuristic, not an AI model, hiring decision, or ATS vendor score. There is no live job feed, employer verification, application submission, OCR, account recovery, or backend persistence.

## Future backend and AI integration

For production, replace the demo gate with server-side identity (secure, HttpOnly, SameSite session cookies, CSRF protection, rate limits, and server authorization). Upload documents to a protected API over TLS with explicit consent, size/type and malware checks, temporary storage and a deletion policy; extract/OCR text in an isolated backend worker. Add a server-side analysis service with validated inputs/outputs and disclose the model, retention, and limitations. Fetch jobs only from a licensed/verified source, keep application submission behind explicit consent, and store user records with authorization and audit controls. Never put model/API secrets in this frontend.

## Demo sign-in

The welcome screen is a frontend-only demo gate. Sign in with any valid email address and a password of at least 8 characters, or create a local demo profile. Passwords are checked in the browser and are never saved or sent. If Remember Me is selected, only the demo name and email are kept in browser storage. Sign out from the profile menu to return to the welcome screen.

This is not production authentication: there is no account service, secure session, password recovery, or server-side access control. The dashboard data and analysis results remain illustrative demo content.

## Production build

```bash
npm.cmd run build
npm.cmd run preview
```

The existing backend is currently not connected to this client. These production services should be implemented there rather than embedding credentials or privileged operations in the browser.