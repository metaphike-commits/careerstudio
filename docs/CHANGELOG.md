# Changelog

Historical sprint log. For current project state, read docs/HANDOFF.md.
For current roadmap, read docs/TASKS.md.

---

## Sprint 10.5 - Real CV QA and Lightweight Proof Extraction

- Extended src/lib/cv-parser.ts with CandidateProofPoint type and extractProofPoints() function.
  Detects lines containing a quantified metric (%, currency, scale, duration, multiplier) AND
  an action/impact verb (English + normalized French). Links to known S&O skill if found.
  Confidence: high for % or currency, medium for other units. Never throws, empty CV returns [].
  ParsedCV type now includes proofPoints: CandidateProofPoint[].
- Onboarding review step (src/app/onboarding/page.tsx) now shows:
  - ExtractionSummary card: quality badge, count of experiences/skills/proof points, missing fields.
  - "Preuves d'impact detectees" section: per-line toggle (keep/exclude), editable linked skill.
  - Empty state message when no proof points found (honest, no fake data).
  - On confirm: only kept proof points saved as ProofPoint[] with strength: moderate.
  - proofPoints from mock never reintroduced.
- Added 4 new business-rule tests to scripts/business-rules-check.cjs:
  parseCVToProfile detects quantified impact lines as proof point candidates.
  parseCVToProfile does not create proof points from generic non-quantified lines.
  Profile saved after CV import with proof points stores them correctly.
  Empty CV does not create proof points.
- All checks pass: lint, TypeScript, test:business (17/17), build (11 routes, 0 errors).
- Coordination docs remain ASCII-only.

## Sprint 10 - Real Master CV Intake

- Added src/lib/cv-parser.ts: pure local CV parser with no side effects.
  Exports parseCVToProfile (rich ParsedCV with per-field confidence levels) and
  parseCV (simple Partial<UserProfile> wrapper).
  Extracts: name, targetTitles, skills (44-term S&O list), positioningStatement,
  experiences (3 regex patterns for common CV formats).
  Returns extractionQuality: strong / partial / weak.
  Never throws on bad input; returns empty on empty string.
- Rewrote src/app/onboarding/page.tsx: real 2-step flow (paste + review).
  Step 1: large textarea + "Analyser" button calls parseCVToProfile synchronously.
  Step 2: editable review form pre-filled from parsed result. Per-field ConfidenceBadge
  component (Extrait du CV / Deduit du CV / A verifier / Manquant).
  Weak-extraction guard: checkbox confirmation required before save if quality is weak.
  On confirm: calls saveProfileAndRescore (profile + rescore) and setMasterCV (raw text stored).
  Clears proofPoints and objections (cannot be derived from CV text without LLM).
  Redirects to /profil?imported=1.
- Added ImportBanner component to src/app/profil/page.tsx.
  One-time emerald banner on arrival from /onboarding (?imported=1 URL param).
  Shows opportunity rescore count. Auto-dismisses after 5 seconds or on click.
  Wrapped in Suspense boundary for Next.js static build compatibility.
- Added 5 new business-rule tests to scripts/business-rules-check.cjs:
  parseCVToProfile extracts name + skills + experience from realistic CV.
  parseCVToProfile with empty string returns weak extraction without throwing.
  parseCV with empty string returns empty object without throwing.
  saveProfileAndRescore after parseCV changes at least one opportunity score.
  proofPoints and objections are cleared when profile is imported from CV.
- All checks pass: lint, TypeScript, test:business (13/13), build (11 routes, 0 errors).
- Coordination docs remain ASCII-only.

## Sprint 9C - Local scored-opportunity snapshots

- Added src/lib/opportunity-snapshot.ts.
- Snapshot includes profile context, sorted opportunities, detailed scores, keywords, and verdict counts.
- Added a dedicated snapshot export card in /parametres.
- Expanded the full local JSON export to include profile and opportunities.
- Added business-rule coverage for snapshot sorting and summary.
- All checks pass: lint, TypeScript, test:business, build.

## Sprint 9B - Editable scoring profile

- Added saveProfileAndRescore to src/stores/app-store.ts.
- Rebuilt /profil with a local edit mode for scoring-critical fields.
- Fixed visible mojibake on the profile page while editing it.
- Profile edits persist locally and re-score existing opportunities immediately.
- Added business-rule coverage proving profile edits affect scoring.
- All checks pass: lint, TypeScript, test:business, build.

## Sprint 9A - Manual opportunity import and deterministic local scoring

- Added src/lib/local-scoring.ts for local-only deterministic opportunity scoring.
- Added addManualOpportunity to src/stores/app-store.ts.
- Persisted profile and opportunities in localStorage (previously not persisted).
- Added a compact import form on /opportunites.
- Imported opportunities are scored, prepended, selected, and switch appMode to real.
- Import does not create an Application or ApplicationEvent.
- Added business-rule coverage for the manual import path.
- All checks pass: lint, TypeScript, test:business, build.

## Sprint 8C - Business-rule test suite

- Added scripts/business-rules-check.cjs as a no-dependency Node business-rule test runner.
- Added npm script: npm run test:business.
- Covered: confirmOpportunityApplied manual event behavior; prepared_cv/prepared_pack never
  mark applications as applied; confirmContacted manual confirmation; computeDailyActions
  priority order; J+7/J+21/J+30 suggestions do not mutate application status.
- All checks pass: lint, TypeScript, test:business, build.

## Sprint 8B - Visual QA and responsive polish

- Removed visible mojibake from src/app/page.tsx and src/components/opportunities/OpportunityDetail.tsx.
- Checked key visible files for mojibake: README.md, dashboard, opportunity detail, list, and page.
- /opportunites now stacks list/detail before the lg breakpoint.
- Opportunity detail header controls can wrap; tabs can scroll horizontally.
- All checks pass: lint, TypeScript, build, visible mojibake scan, coordination-doc ASCII.

## Sprint 8A - Post-Sprint-7 cleanup

- Roadmap reframed after Sprint 7.
- README visible mojibake cleaned.
- mockDailyBrief removed from src/data/mock-actions.ts (unused dead code).
- Orphaned dashboard components (ActionCard, ComputedActionCard, OpportunityMiniCard) documented
  for later review; not deleted pending manual QA.
- All checks pass: lint, TypeScript, build, coordination-doc ASCII.

## Sprint 7C - Opportunity detail panel upgrade

- Rebuilt src/components/opportunities/OpportunityDetail.tsx.
- Removed the old external detail/pack tab bar from src/app/opportunites/page.tsx.
- Header: return, previous/next, bookmark, large CompanyLogo, verified badge, "Postuler maintenant".
- Analyse tab: reference-style score panel (RadarChart + ScoreBars), CV cite & ATS panel
  (donut chart + keyword tags + comparison excerpt + export actions), pack cards, reasons,
  red flags, recommended angle, archive/apply actions.
- Preparation, Entreprise, Historique tabs are placeholders.
- All checks pass.

## Sprint 7D - Opportunity list item upgrade

- Rebuilt src/components/opportunities/OpportunityListItem.tsx.
- CompanyLogo is now the primary visual anchor on the left.
- Score shown as a large number with Excellent fit / Bon fit / Fit moyen label.
- Priority badge computed from globalFit. Posted age and chevron visible.
- Selected state and click behavior unchanged.

## Sprint 7B - Sidebar enhancements

- Rebuilt src/components/layout/Sidebar.tsx toward the JobPilot AI reference style.
- Added branded header (Sparkles icon, JobPilot AI name, tagline).
- Renamed nav labels: Reseau & Contacts, Analyse & Stats.
- Added disabled Entretiens & Coaching nav item with Bientot badge.
- Added pending computed action count badge on Tableau de bord.
- Added bottom user profile card linking to /profil.
- Added Conseil du jour card using computeDailyInsight.
- Kept existing routes and collapsed sidebar behavior.
- All checks pass.

## Sprint 7A - Dashboard full redesign

- Rebuilt src/app/page.tsx toward the JobPilot AI dashboard reference.
- Header: Bonjour {profile.name}, current date, Resume quotidien button.
- Four KPI cards: Offres analysees, Opportunites pertinentes, Actions prioritaires, Entretiens obtenus.
- Top opportunities list with CompanyLogo, rank badge, score, fit label, priority badge, posted age, chevron.
- Daily actions checklist using computeDailyActions; read-only links (prepared != done).
- Only persisted done actions shown as "Fait".
- Pipeline funnel with month/week toggle and computed manual-event stats.
- Quick insights row and right-column contextual signal card.
- All checks pass.

## Sprint 6.5 - CompanyLogo and RadarChart

- Added logoUrl field to JobOffer type (src/types/index.ts).
- Added Clearbit logo URLs to all 5 mock opportunities.
- New component: src/components/shared/CompanyLogo.tsx.
  img tag with Clearbit URL; onError fallback to initials + deterministic solid color.
- New component: src/components/shared/RadarChart.tsx.
  Pure SVG, 7 axes (Competences, Seniorite, Narratif, ATS, Motivation, Acces, Entretien),
  grid polygons at 25/50/75/100, violet fill.
- OpportunityDetail.tsx: added "Profil de fit" section with RadarChart.
  CompanyLogo replaces Building2 icon in header.
- OpportunityListItem.tsx and OpportunityMiniCard.tsx: CompanyLogo replaces Building2.
- All checks pass: build, lint, TypeScript, coordination-doc ASCII.

## Sprint 6 - Dynamic daily dashboard

- Replaced static mock actions on "Aujourd'hui" with computed action engine (src/lib/daily-actions.ts).
- Engine reads real pipeline state and generates prioritised actions.
- Priority order: interviews > ghosting > follow-ups > network > apply > info.
- Quick mode buttons functional: 30 min, Energie basse, Focus unique.
- "Cette semaine" widget computed from real applicationEvents (last 7 days, manual only).
- Reseau widget shows real prepared contact count and first contact name.
- "Si tu n'as que 30 min" callout computed from first short action.
- Insight block computed from real pipeline state.
- Top opportunities sorted by real globalFit score.
- New component: src/components/dashboard/ComputedActionCard.tsx.
- All checks pass.

## Sprint 5 - /progression

- Built /progression with 4 KPI cards (total dossiers, envoyes, taux reponse, taux entretien).
- Benchmark references embedded in KPI cards.
- Pipeline funnel: horizontal bars per stage.
- Weekly activity bar chart from applicationEvents (last 6 weeks, manual only).
- Closed breakdown: refus / ghoste / archive + offers panel.
- All values computed live from the Zustand store.

## Sprint 4 - /memoire

- Added MemoryItem, MemoryInsight types; mocked memory data in src/data/mock-memory.ts.
- Persisted memoryItems in Zustand store with create/update/delete.
- /memoire: full CRUD, search, type filter, sentiment tracking.
- Adding a linked memory creates a note ApplicationEvent in the candidature timeline.
- Mocked insights visible in sidebar (static).
- Sidebar navigation labels corrected for French accents.
- README.md replaced with CareerStudio-specific content.

## Sprint 3.5 - /parametres

- /parametres with export/reset/clear, demo mode toggle, privacy banner.

## Sprint 3 - Pipeline trust and ApplicationEvent

- ApplicationEvent event sourcing (source: manual / prepared / rule_suggestion).
- Manual status confirmations: no automatic status changes.
- J+7 / J+21 / J+30 temporal suggestion rules in src/lib/pipeline-rules.ts.
- /reseau: network contact tracking with full CRUD and status lifecycle.
- Introduced probably_ghosted as a soft suggestion status.

## Sprint 2 - CV Builder ATS, Application Pack, Profile, Copilot, Onboarding

- CV Builder with ATS scoring, targeted CV list, keyword coverage.
- Application Pack: LinkedIn message, pitch, questions, prep plan.
- Profile Truth Layer: positioning, proof points, experiences, objections.
- Mock Copilot panel with hardcoded responses.
- Onboarding simulation: master CV paste stub (fake extraction).

## Sprint 1 - App shell and mock data

- Next.js 16 App Router project setup.
- Sidebar navigation with route links.
- "Aujourd'hui" daily dashboard prototype with static mock data.
- Opportunities screen with search, verdict filter, analysis, and pack tab.
- Applications screen with manual status buttons.
- CV screen with targeted CV list and content view.
- Profile screen from mock profile data.
- Mock data files: profile, opportunities, CVs, packs, applications, actions.
- AGENTS.md and docs/PROJECT_BRIEF.md established.
