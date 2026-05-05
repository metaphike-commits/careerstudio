# Project Brief

## Project

JobPilot AI / Career War Room, implemented in the repository as CareerStudio.

## Product Goal

Create a calm, premium, action-oriented system that helps a job seeker run a daily job-search workflow.

This is not a contemplative dashboard. It is a daily action engine.

## Source And Scope Decision

The original product document was an exhaustive ChatGPT-generated mega-spec. Treat it as strategic context, not as the implementation backlog.

The implementation authority is the sprint roadmap in `docs/TASKS.md`.

The product roadmap has been realigned around the final product vision. The current prototype
must still avoid overbuilding, but future sprints should map to these pillars:

1. Profile Intelligence
2. Daily Job Scout
3. Application Builder
4. Manual Pipeline & Action Tracking
5. Interview Coach
6. Career Memory & Learning
7. Privacy / Persistence / Deployment / QA

The immediate product goal is not "more local polish". It is to turn the existing local prototype
into a real job-search operating system, pillar by pillar.

The current MVP boundaries remain:

- daily action engine;
- manual opportunity review;
- targeted CV / ATS preparation;
- application pack preparation;
- manual application and network confirmations;
- simple follow-up and ghosting suggestions.

Do not build the full mega-spec at once. Scraping, RAG, advanced analytics, backend persistence,
and PDF/DOCX export remain later-stage scope unless explicitly re-prioritized.

Real LLM integration exists for controlled CV targeting, but real provider testing depends on API
keys and active credits. Until then, local fallback paths must remain honest and visibly marked.

## Intelligence Doctrine

Use this doctrine for all future product and UI decisions:

- Local = system of record, structure, storage, simple calculations, fallback, privacy, and manual tracking.
- LLM = understanding, synthesis, personalization, generation, and coaching.
- User = validation, correction, and confirmation of real-world actions.

The local layer must not be presented as the main qualitative intelligence of the product.
Regex parsing, keyword matching, local packs, STAR examples, memory signals, and local learning
are useful fallbacks and scaffolding, not the final intelligence layer.

UI labels must make the source and confidence of each output clear:

- LLM outputs: "Analyse IA", "Genere avec IA", "Personnalise par IA", "A relire",
  "Validation requise".
- Local outputs: "Analyse locale limitee", "Brouillon local", "Estimation locale",
  "Deduit localement", "Fallback local".
- Confidence labels: "Preuve forte", "Preuve moderee", "Preuve faible",
  "Donnee manquante", "Hypothese a confirmer", "Deduit".

Guardrails:

- No automatic LLM calls.
- No auto-save without user validation.
- No automatic pipeline status changes.
- No automatic sending of messages, CVs, follow-ups, or applications.
- No raw CV dump inside dashboard cards or secondary cards.
- Local fallback must remain available when API keys or credits are unavailable.
- Outputs must stay short, structured, reviewable, and clearly marked by source.

Central question:

"Quelle est l'action la plus rentable aujourd'hui pour augmenter mes chances d'obtenir un entretien ?"

## Product Principles

- Interface in French.
- Calm, readable, non-anxious experience.
- Home page is "Aujourd'hui".
- The daily surface should prioritize at most:
  - 1 main action;
  - 2 secondary actions;
  - 3 top opportunities.
- ATS CV Builder is central.
- The master CV is the main entry point.
- Profile Intelligence is the source of truth for dashboard suggestions, scoring, CV targeting,
  application packs, interview prep, and memory learning.
- Opportunity, CV, and application scores should depend on the user's profile.
- "Prepared" does not mean "done".
- "Generated CV" does not mean "application sent".
- "Generated pack" does not mean "application sent".
- Application statuses are manually confirmed by the user.
- No automatic Gmail, calendar, or ATS detection in the current version.
- Time-based rules may suggest follow-up or "probably ghosted" states, but final confirmations remain manual.

## Final Product Pillars

### 1. Profile Intelligence

The user uploads or pastes a master CV. The app builds a full professional picture:
experiences, skills, sectors, target roles, roles to avoid, seniority, strengths, proof points,
objections, pitch variants, STAR examples, ATS keywords, and progression axes.

This profile powers the dashboard, scoring, CV targeting, application packs, interview prep,
and future learning.

### 2. Daily Job Scout

The app should eventually scan or ingest relevant job offers daily, deduplicate them, score them,
and produce a short actionable shortlist. Manual import is the current fallback.

### 3. Application Builder

For each priority opportunity, the app should prepare:
targeted CV, LinkedIn message, pitch, why me, why company, probable questions, objections,
mini prep plan, and company research.

### 4. Manual Pipeline & Action Tracking

The user manually confirms real-world actions: applied, contacted, followed up, interview obtained,
rejected, ghosted, or archived. Preparation never implies completion.

### 5. Interview Coach

When the user confirms an interview and adds a date, the app should become a coach:
company research, role stakes, likely questions, tailored answers, objections, STAR examples,
visual prep sheet, post-interview note, and memory learning.

### 6. Career Memory & Learning

The app should learn from notes, feedback, refusals, old messages, reply rates, patterns,
successful role types, and angles to strengthen.

### 7. Privacy / Persistence / Deployment / QA

The product must remain explicit about local vs API-sent data, support export/reset, add durable
persistence when needed, and keep business-rule tests as a first-class artifact.

## Current Stack

- Next.js 16.2.4 App Router.
- React 19.2.4.
- TypeScript 5.
- Tailwind CSS 4.
- shadcn package and Base UI primitives.
- Zustand 5 with `persist` middleware.
- `localStorage` persistence through Zustand.
- Lucide React icons.
- Mocked local services/data in `src/data`.
- No backend or database in the current repo.

## App Structure

Root app directory: `src/app`.

Shared UI and feature components: `src/components`.

Global store: `src/stores/app-store.ts`.

Shared domain types: `src/types/index.ts`.

Mock data: `src/data`.

Global styles and design tokens: `src/app/globals.css`.

## Available Routes

- `/`: Aujourd'hui dashboard.
- `/opportunites`: Opportunity list, manual import, analysis panel, preparation tabs, CV targeting trigger.
- `/candidatures`: Application tracking with manual status confirmations and events.
- `/cv`: Targeted CVs, ATS scoring, and saved local CV versions.
- `/profil`: Structured professional profile.
- `/onboarding`: Master CV paste and local extraction review.
- `/reseau`: Network contact tracking.
- `/memoire`: Memory item CRUD with linking.
- `/progression`: Progress analytics.
- `/parametres`: Local data export/reset, privacy, demo mode, snapshots.

## Current Product State

The project is a front-end prototype with meaningful local persistence and a first guarded LLM
route.

Built surfaces include:
- daily action dashboard;
- opportunity analysis;
- application tracking;
- targeted CV review;
- application pack display (still mocked);
- profile page;
- mock copilot panel;
- real local onboarding extraction and review.

Several surfaces are incomplete or not fully real:
- Daily Job Scout;
- Interview Coach;
- full Profile Intelligence;
- full Application Builder;
- real LLM profile analysis;
- learning from memory;
- real PDF/DOCX export;
- backend persistence.

## Domain Rules To Preserve

- Keep confirmations manual.
- Keep application pipeline state distinct from preparation/generation state.
- Do not infer "applied" automatically from CV or pack generation.
- Do not infer "contacted" automatically from a prepared LinkedIn message.
- Follow-up and ghosting rules should suggest action, not silently change final confirmed state.
- The daily dashboard should stay focused and not become a broad KPI dashboard.

## UX Direction

The product should feel like a focused command center:
- calm;
- premium;
- dense but readable;
- action-first;
- low anxiety;
- no gamified pressure;
- no excessive metrics on the daily page.

Avoid turning the product into:
- a generic CRM;
- a generic analytics dashboard;
- a noisy task manager;
- a decorative landing page.

## Technical Constraints

- Follow the local Next.js docs in `node_modules/next/dist/docs/` before making Next-specific changes.
- Preserve existing conventions unless a task explicitly asks to change them.
- Avoid new dependencies unless clearly justified.
- Keep docs/TASKS.md as the roadmap authority.
- Real provider LLM calls must be explicit user actions only.
- No automatic background scraping, Gmail, calendar, ATS, or hidden LLM calls.
