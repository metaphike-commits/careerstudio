# Handoff

## 1. Current State Summary

CareerStudio is a fully local Next.js 16 prototype for a Strategy & Operations job-search assistant.
No backend database. All persisted app data lives in localStorage via Zustand persist.
Business tests: 96/96. All use-readiness sprints complete as of 2026-05-04.

Sprint Profile/CV Import Overhaul is complete (2026-05-05):
- Added profileSource?: "demo" | "imported" | "manual" to UserProfile in types/index.ts.
- mockProfile now has profileSource: "demo"; onboarding sets "imported" on save; profil page
  sets "manual" when the user edits manually.
- New src/lib/local-intelligence.ts: categorizeSkills (groups skills by category, max 6 per cat),
  buildEvidenceBySkill (evidence from proofPoints and experience achievements), generateLocalObjections
  (derives 5 likely objections from profile gaps), buildLocalPitch (uses positioningStatement or
  fallback from targetTitles+skills), generateDevelopmentAxes, computeCompletenessScore (0-100),
  buildLocalIntelligence (orchestrates all of the above).
- /profil now shows: source badge (Demo / Importe / Manuel), progress bar completeness score,
  categorized skills sections (max 6 per category), development axes panel (amber),
  objections section falls back to localObjections when profile.objections is empty.
- 18 new business tests -- 96/96 passing.
- Validation: lint + tsc + test:business + build all pass.

The app is usable this week for a real job search:
- Real CV import: PDF upload + text paste on /onboarding, local extraction, editable profile.
- startFresh action: clears all demo data, switches to "real" mode, redirects to onboarding.
- Demo banner on dashboard, one-click path to start real use.
- Job scout: paste a job description to auto-fill title/company, paste a URL to auto-detect source.
- Full pipeline: opportunities -> scoring -> applications -> candidatures -> entretiens.
- Dark mode consistent across all pages (no more hardcoded light backgrounds).

Sprint Doctrine IA/Local is complete (2026-05-05) -- labeling and visibility pass only:
- Updated UI labels on /profil, /opportunites, /cv, /memoire, /progression, and dashboard
  to reduce local-intelligence oversell: "Analyse locale limitee", "Score estime",
  "Fallback local non-IA. Estimation limitee, non sauvegardee.", "Lecture locale limitee".
- Product doctrine formalized in docs/PRODUCT_DOCTRINE.md (added 2026-05-05).
- Important: this sprint was a label and documentation pass, NOT a UI hierarchy migration.
  The local output is still visually primary on /profil, CV targeting, application pack,
  and /entretiens even when AI is enabled. The doctrine is documented but not yet implemented
  as product behavior.
- No scoring, store, API route, LLM provider, persistence, or pipeline rule changed.

Sprint LLM Primacy is complete (2026-05-05) -- UI hierarchy pass only:
- On qualitative surfaces, AI is now visually primary when aiEnabled is true.
- /profil: Profile Intelligence block now leads with "Analyser mon profil avec IA"; local
  analysis remains available as a secondary limited view and no AI output is saved without review.
- /opportunites OpportunityDetail: CV targeting now prioritizes "Generer CV cible avec IA" and
  keeps "Creer un brouillon local" as secondary fallback. Application Pack empty state now
  prioritizes "Generer pack candidature avec IA" and keeps local pack generation as secondary.
- /entretiens: interview preparation now prioritizes "Generer preparation entretien avec IA" and
  frames the local prep sheet as the available fallback/support.
- No route, provider, store, scoring, persistence, or pipeline rule changed. No automatic LLM call,
  auto-save, or automatic status change was added.

Sprint PDF CV Import (complete - was done in a prior session):
- src/lib/pdf-extract.ts, next.config.ts canvas alias, postinstall script, onboarding PDF UI.

Sprint Reset Propre (complete - 2026-05-04):
- startFresh in app-store.ts, demo banner on dashboard, demarrer card in /parametres.

Sprint Scout Quotidien (complete - 2026-05-04):
- parseJobDescriptionHead, auto-detect source from URL, empty states on /opportunites.

Sprint DA Consistency (complete - 2026-05-04):
- bg-[#f6f7fb] replaced with app-premium-bg on /cv, /onboarding, /opportunites.
- globals.css: added .dark .bg-white/* opacity-modifier overrides.

Sprints 1 through 28 plus the Dashboard UI sprints, Sprint Fondation Minimale (senior audit
cleanup), Sprint Score Honnete, Sprint Pack Honnete, Profile Intelligence LLM Review, LLM
Application Builder Enablement, LLM Interview Coach, Toggle IA + Mode Nuit, and Dark Mode
Redesign are all complete. The app is a functional local prototype with real pipeline logic,
deterministic local scoring, a real CV parser, a real onboarding review flow, an editable profile
that re-scores opportunities, guarded multi-provider LLM routes, a business-rule test
suite (78/78), and a premium reference-style UI.

Sprint Profile Intelligence LLM Review is complete. The guarded /api/profile-intelligence prompt
is now more suitable for real CV usage: it asks for proof-led output, recruiter objections,
concrete STAR examples, richer ATS keywords, and cautious inference. The API now returns
calibration metadata with the ProfileIntelligence result, and /profil shows that calibration
before the user saves the LLM output. LLM execution remains explicit, consent-gated, and manually
saved. No store version, scoring, pipeline, or route behavior changed.

Sprint LLM Application Builder Enablement is complete. A new guarded POST /api/application-pack
route can generate ApplicationPack output through the configured OpenAI or Anthropic provider.
The /opportunites Preparation tab now offers "Generer avec IA" after consent, plus the existing
local fallback. Generated packs are saved locally only and never mark the application as sent.
CV targeting prompts now include saved Profile Intelligence when available. The shared missing
API key message was normalized to avoid mojibake. Business tests are now 73/73.

Sprint LLM Interview Coach is complete. A new guarded POST /api/interview-prep route can generate
structured interview preparation through the configured OpenAI or Anthropic provider. /entretiens
now offers "Generer prep IA" after consent. The result is displayed locally and includes role
stakes, likely questions, tailored answers, objections, STAR mapping, prep checklist, company
research, and questions to ask. It never changes application status or creates events. Business
tests are now 75/75.

Sprint Toggle IA and Mode Nuit is complete. The existing Zustand store now persists aiEnabled,
aiConsentAcceptedAt, and theme without changing persist version 2. The sidebar has global controls
for AI and light/dark mode. First AI enablement shows a local consent modal. When AI is disabled,
/profil, /opportunites, and /entretiens do not call LLM API routes from the UI and show clear
"IA desactivee" messages or local fallback options where available. API routes and provider code
were not changed. A dark theme is applied globally from the persisted theme setting, with pragmatic
dark-mode CSS overrides for the main pages. Business tests are now 78/78.

Sprint Dark Mode Redesign is complete. The first rough dark-mode pass was replaced with a more
intentional premium dark system for the dashboard experience: navy/slate page background,
differentiated card surfaces, stronger text hierarchy, subtler borders, tuned sidebar controls,
and a themed radar chart using CSS variables. / and DashboardOpportunityPanel now use semantic
premium surfaces instead of relying only on generic dark overrides. No store, scoring, LLM, API
route, or pipeline behavior changed.

Dark Mode Final Polish is complete. Typography weight and sizing were strengthened on the
dashboard and selected opportunity panel. Insights cards, CV cible/ATS internals, compact panel
mode, shared PageShell/PremiumCard/MetricTile primitives, and secondary buttons were tuned for the
premium navy/slate direction. This also prepares broader page-by-page visual harmonization.

Sprint Fondation Minimale is complete. A senior engineering audit identified structural
duplication, hardcoded constants, and type issues. This sprint was mechanical cleanup only:
no UI changes, no logic changes, no store structure changes.
What changed:
- src/lib/utils.ts: added normalizeAccents, normalizeSlug, clamp, uniqueItems, uniqueStrings,
  hasAnySubstring, includesAllWords. The existing cn() function is unchanged.
- src/lib/constants.ts: created with OPS_SCORING_KEYWORDS (21 terms -- scoring denominator,
  length is part of the formula, do not add or remove without re-calibrating weights) and
  SO_SCOUT_SKILLS (40 terms -- keyword preview, extend freely).
- Removed duplicate local copies of normalize/clamp/unique/hasAny/daysBetween from 9 lib files.
- network-layer.ts now imports daysBetween from pipeline-rules.ts instead of duplicating it.
- ApplicationPack.cvVersionId type changed from string to string|null in types/index.ts.
- local-pack.ts uses null instead of empty string for cvVersionId.
- All generated IDs in app-store.ts use crypto.randomUUID() (event, memory, contact IDs).
- createManualOpportunity in local-scoring.ts uses crypto.randomUUID() for job IDs.
Bug fix: uniqueStrings in utils.ts guards against undefined values in runtime arrays before
calling .trim() -- the old implementations filtered falsy values first.

The core value loop is now operational: user pastes real CV text (including Markdown-formatted CVs
from LinkedIn or Notion) -> local parser strips markdown, detects section headers, extracts profile
with correct experiences, bullets, and dates -> user reviews and corrects -> profile saved -> all
opportunities re-scored. CV targeting can call the configured LLM provider only after an explicit
user click.

Sprint 14 is complete: Profile Intelligence calibration is live. calibrateProfileIntelligence()
produces blocking and weak warnings. A CalibrationPanel on /profil always shows the readiness score.

Sprint 15 is complete: Daily Job Scout Manual Source Intake. A new src/lib/job-scout.ts module
provides detectDuplicate (URL then company+title normalization) and previewJobKeywords (matches
against 36 S&O terms). The /opportunites import form now shows source chips, a live keyword preview
below the description field, and a duplicate warning that lets the user force-import or cancel.

Sprint 16 is complete: Daily Scout Queue and Shortlist. getScoutQueue (job-scout.ts) filters
status === "new" opportunities, sorts by verdict priority then globalFit, capped at 7. The
/opportunites page shows a scout queue panel above the main list with verdict badge, score%,
first reason, and Shortlister/Ignorer action buttons. Shortlisting opens the detail panel.
Ignoring archives without creating an application. The main list now excludes new items.

Sprint 18 is complete: CV Targeting Editor. Store gained updateCVContent(id, content).
CVContentPanel has a full edit mode (Modifier -> textarea -> Enregistrer/Annuler) and a
"Brouillon - non envoye" badge always visible in the header. CVScorePanel shows an amber
draft status banner at the top with relire-avant-envoi guidance. The /cv sidebar shows a
"Brouillon" badge on each CV list item.

Sprint 19 is complete: Application Pack Builder. New src/lib/local-pack.ts provides
generateLocalApplicationPack (LinkedIn message, pitches, why you/company, probable questions,
objections, prep plan -- all composed deterministically from profile + opportunity). Store
gained applicationPacks (Record<string, ApplicationPack>) and saveApplicationPack, initialized
from mockApplicationPacks and persisted. OpportunityDetail "Preparation" tab now shows
ApplicationPackPanel when a pack exists, or a "Generer le pack localement" button when not.
PackCards and "Voir le pack" button navigate to the Preparation tab. onOpenPack prop removed.
51/51 business-rule checks pass.

Sprint 20 is complete: Application Pack Builder QA. New src/lib/application-pack-quality.ts
evaluates pack score, section scores, and warnings for vague content, missing proof, missing
company personalization, too few questions/objections, light prep plan, and unsupported quantified
claims. ApplicationPackPanel shows overall pack quality plus tab-specific warnings. 54/54
business-rule checks pass.

Dashboard Reference Refresh is complete. The / page now follows the approved four-block reference
composition: header/KPIs, top opportunities, actions/pipeline/insights, and a rich right-side
selected opportunity panel. The new DashboardOpportunityPanel component is dashboard-only and does
not replace /opportunites. Dashboard opportunity clicks select locally and update the right panel
without redirecting. Typography hierarchy and visible dashboard mojibake were cleaned up. No store,
scoring, LLM, API, pipeline, or route behavior changed.

Dashboard Panel Focus Patch is complete. The dashboard right opportunity panel can now be collapsed
or expanded with local React state. Collapsed mode keeps a compact rail with logo, title, score,
and reopen controls, while the center dashboard column regains desktop space. The selected
opportunity remains intact. The analysis radar chart is larger and placed as a stronger diagnostic
visual beside the score/sub-score block. No store, scoring, LLM, API, pipeline, or route behavior
changed.

Global Style Alignment is complete. Shared premium page primitives were added in
src/components/shared/PageShell.tsx and applied to the major non-dashboard pages:
/opportunites, /candidatures, /cv, /profil, /onboarding, /reseau, /memoire, /progression, and
/parametres. Page shells, headers, cards, metric tiles, and button styles now follow the same
SaaS premium direction as the dashboard. No store, scoring, LLM, API, pipeline, or route behavior
changed.

Sprint 21A Pipeline Pro is complete. The /candidatures page now has summary metrics, clearer
per-application next-action panels, prepared asset cards (targeted CV, application pack, linked
contact), a stage rail, and a clearer event timeline with fait / prepare / suggere badges. This is
a UI/UX patch only: no store, scoring, LLM, API, route, or pipeline business rule changed.

Sprint 21B Pipeline Pro is complete. A new src/lib/interview-handoff.ts module computes interview
readiness for recruiter, manager, case study, and offer statuses. /candidatures now shows a
preparation handoff when a dossier reaches interview stage: date status, readiness score, next
focus, and prep steps for targeted CV, application pack, linked contact, and interview note.
The handoff links to existing /memoire and /opportunites surfaces instead of creating a new route.
No store, route, scoring, LLM, API, or pipeline mutation behavior changed. Business tests are now
56/56.

Sprint 22A Network Layer is complete. A new src/lib/network-layer.ts module computes contact
signals and priority ordering without side effects. /reseau is now an operational network cockpit:
summary metrics, priority contact, status filters, pipeline linkage, follow-up signal, prepared
message state, and manual actions. Prepared messages remain distinct from sent contacts. Existing
store actions and manual confirmation rules were preserved. Business tests are now 58/58.

Sprint 22B Network Layer is complete. src/lib/network-layer.ts now also builds local draft
suggestions for first messages, follow-ups, reply capitalization, and context preparation.
/reseau shows these suggestions per contact with a suggestion-only marker and copy action.
No message is sent automatically, no contact is confirmed automatically, and no new store status
was added. Business tests are now 59/59.

Sprint 23A Interview Coach is complete. A new src/lib/interview-coach.ts module builds a local
interview workspace from an interview-stage application, profile, opportunity, CV, pack, linked
contact, and memory notes. A new /entretiens route shows active interview dossiers, readiness
metrics, role stakes, likely questions, objections, STAR examples, questions to ask, checklist,
and post-interview prompts. The sidebar route is now enabled. No store, API, LLM, scoring, or
pipeline mutation behavior changed. Business tests are now 61/61.

Sprint 24 Interview Prep Sheet is complete. src/lib/interview-coach.ts now also builds local
tailored answer drafts, company research prompts, interviewer context, and post-interview capture
prompts. /entretiens shows these sections inside the prep workspace with clear "Brouillon local"
framing. No store, API, LLM, scoring, or pipeline mutation behavior changed. Business tests are
now 62/62.

Sprint 25 Post-Interview Notes and Learning is complete. /entretiens now includes a manual
post-interview note capture flow. Saving creates an interview_note memory item linked to the
selected application/contact and adds a manual note event, without changing pipeline status.
src/lib/interview-coach.ts now derives simple local learning signals, objections, follow-up
suggestions, sentiment, and tags from the note text. No API, LLM, scoring, or automatic status
change was added. Business tests are now 63/63.

Sprint 26 Memory Intelligence is complete. A new src/lib/memory-intelligence.ts module computes
local memory insights from real memory items: recurring objections, positive patterns, follow-up
opportunities, and linkage coverage. /memoire now uses computed insights instead of static
mockMemoryInsights and shows detected patterns in the sidebar. No store, API, LLM, scoring, or
pipeline mutation behavior changed. Business tests are now 64/64.

Sprint 27 Learning Dashboard is complete. A new src/lib/learning-dashboard.ts module computes
pipeline and memory learning signals: response rate, interview rate, memory coverage, conversion
counts, strongest signals, improvement areas, and recommended actions. /progression now shows a
Learning Dashboard section that uses applications, ApplicationEvents, and MemoryItems in read-only
mode. No store, API, LLM, scoring, or pipeline mutation behavior changed. Business tests are now
65/65.

Sprint 28 Privacy and Consent is complete. A new src/lib/privacy-boundaries.ts module documents
local-only data, API-sent payload fields, non-sent fields, API key requirement, and local fallback
availability for LLM actions. A reusable ConsentDialog now gates the two existing LLM user actions:
CV targeting on /opportunites and Profile Intelligence on /profil. /parametres now shows IA and
consent guidance. No store, scoring, API contract, routes, or pipeline mutation behavior changed.
Business tests are now 66/66.

Sprint Score Honnete is complete. local-scoring.ts no longer uses hardcoded access=42 and
timing=86 constants. Access is derived from real networkContacts: no matching contact = 30,
matching contact = 65, replied matching contact = 85. Timing is derived from postedAt age:
<=7 days = 90, <=14 = 75, <=30 = 60, older = 35. app-store.ts now passes network/timing context
when importing or rescoring opportunities, and network contact changes refresh opportunity scores
without changing application status. Business tests are now 69/69.

Sprint Pack Honnete is complete. local-pack.ts no longer copies opportunity.description into
whyCompany. It now composes company motivation from company/title, opportunity reasons,
recommendedAngle, and profile angle. Local pack generation now uses ProfileIntelligence pitch,
impactProofs, likelyObjections, and STAR examples when available. Generated packs remain
preparation only and do not change opportunity/application status. application-pack-quality.ts
also correctly detects percentage claims like 999%. Business tests are now 71/71.

Roadmap decision: future work is now aligned around the final product pillars, not prototype cleanup.
The pillars are Profile Intelligence, Daily Job Scout, Application Builder, Manual Pipeline & Action
Tracking, Interview Coach, Career Memory & Learning, and Privacy / Persistence / Deployment / QA.
docs/TASKS.md is the source of truth for the corrected roadmap.

Roadmap clarification after Sprint 20: Profile Intelligence Advanced and Daily Job Scout are major
pillars, not secondary cleanup. Profile Intelligence must become the full professional picture
(roles, sectors, skills, pitch, objections, proofs, positioning angles, ATS keywords, progression
axes, and confidence metadata). Daily Job Scout must eventually scan or ingest opportunities daily,
deduplicate them, score them, and produce a short actionable shortlist.

## 2. Current Routes

- /: Dashboard. Reference-style layout with header/KPIs, top opportunities, computed daily action
  checklist, pipeline funnel, insights, and a collapsible right-side selected opportunity panel.
  Clicking a dashboard opportunity selects it locally and updates the panel without redirecting.
  Dark mode has a dedicated premium navy/slate visual treatment for this surface.
- /opportunites: Opportunity list + reference-style detail panel (tabs: Analyse/Preparation/Entreprise/Historique).
  Manual import form at top of list. Imported opportunities are locally scored and persisted.
  Analyse tab has a manual "Generer un CV cible" button. It only calls /api/cv-target when the
  global AI toggle is enabled. If AI is disabled or no usable API key is configured, it shows a
  clear message and can generate a local non-AI draft fallback.
- /candidatures: Application pipeline. Manual status confirmations, J+7/J+21/J+30 suggestions,
  summary metrics, next-action panels, prepared asset cards, stage rail, event timeline, and
  interview-stage preparation handoff.
- /entretiens: Interview Coach workspace. Lists interview-stage applications and builds a local
  prep sheet from existing profile, pack, CV, contact, opportunity, and memory data. Includes
  tailored answer drafts, research prompts, interviewer context, and post-interview capture prompts.
  Users can manually save post-interview notes into memory; no status is changed. The "Generer
  prep IA" action only calls /api/interview-prep when the global AI toggle is enabled.
- /cv: Targeted CV list, ATS scoring, content view. Supports /cv?job=<id> for direct jump.
  Reads persisted cvVersions from the store, including saved local drafts.
- /profil: Profile. Editable scoring-critical fields plus Profile Intelligence review/editing.
  Includes explicit "Analyser avec IA" trigger when masterCV.rawText is available. It only calls
  /api/profile-intelligence when the global AI toggle is enabled.
  The AI review result now includes calibration feedback before save.
  Saves to localStorage and re-scores all existing opportunities via saveProfileAndRescore.
- /onboarding: Real CV intake. User pastes text -> parseCVToProfile extracts name/skills/experiences ->
  editable review form with per-field confidence badges -> saveProfileAndRescore + setMasterCV on confirm
  -> redirects to /profil?imported=1. Weak extraction guard requires explicit confirmation before save.
  Extraction summary card at top of review: quality + counts (experiences, skills, proof points, missing).
  "Preuves d'impact" section: toggle keep/exclude per line, editable linked skill, empty state message.
  Kept proof points saved as ProofPoint[] with strength: moderate. Mock proofPoints never reused.
- /reseau: Network contact tracking. Operational cockpit with priority signals, status filters,
  pipeline linkage, prepared-message state, and manual send/reply confirmations. Confirm/reply
  buttons create ApplicationEvents.
- /memoire: Memory items. Full CRUD, search, type filter, sentiment, linking to applications/contacts.
  Adding a linked memory creates an ApplicationEvent. Sidebar insights are now computed locally
  from real memory items rather than static mock insights.
- /progression: Progress analytics and Learning Dashboard. Shows KPI cards, memory-linked learning
  signals, what works, what to improve, recommended actions, pipeline funnel, weekly activity, and
  closed breakdown.
- /parametres: Settings. Export/reset/clear, demo mode, privacy banner, snapshot export.
  Includes IA consent guidance and local/API boundary reminders.

## 3. Completed Capabilities

Pipeline and actions:
- Computed daily action engine with priority order: interviews > ghosting > follow-ups > network > apply > info.
- J+7 (info), J+21 (warning), J+30 (critical) follow-up thresholds from getLastManualEvent.
- ApplicationEvent event sourcing for all manual confirmations.
- Prepared vs done rule enforced everywhere: no automatic status changes.

Opportunity management:
- Manual opportunity import form on /opportunites.
- Deterministic local scoring from src/lib/local-scoring.ts (profile-based, no LLM).
- Imported opportunities scored, prepended, selected, and appMode switched to real.
- Detail panel with radar chart, ATS CV block, pack cards, prev/next navigation, tabs.
- Editable scoring profile on /profil that re-scores all opportunities on save.
- Scored-opportunity snapshot export from /parametres.
- Guarded CV targeting route at /api/cv-target. POST only. Supports LLM_PROVIDER=anthropic or
  LLM_PROVIDER=openai. OpenAI uses the Responses API. Returns targeted bullets per experience,
  an angle, and keywords.
- Local CV fallback generation exists in src/lib/llm/cv-targeting.ts for no-credit/no-key usage.
- Saved targeted CV drafts are persisted in cvVersions and visible on /cv.

UI:
- Reference-style dashboard (JobPilot AI direction): KPI cards, top opps list, actions, pipeline,
  insights, and dedicated collapsible right selected-opportunity panel with analysis, CV/ATS block,
  pack cards, and enlarged radar diagnostic.
- Premium dark mode for the dashboard: page background, dashboard cards, selected rows, right
  panel, CV/ATS block, and radar chart use semantic dark surfaces and theme variables.
- Shared PageShell, PremiumCard, MetricTile, and secondaryButton now use the same premium surface
  utilities, so pages already using them inherit more of the dark-mode design language.
- Shared premium page primitives: PageShell, PageHeader, PremiumCard, MetricTile, premiumButton,
  and secondaryButton in src/components/shared/PageShell.tsx. Use these for future page UI work
  before inventing new card/header/button styles.
- /candidatures uses the shared premium primitives plus a Pipeline Pro card layout: summary
  metrics, next-action panel, prepared assets, stage rail, and event timeline source badges.
- Interview-stage applications on /candidatures show an interview handoff with readiness score,
  next focus, prep steps, and links to /memoire and /opportunites.
- /reseau uses a network cockpit layout: priority signal, filters, linked pipeline context,
  prepared-message state, suggestion-only follow-up drafts, and manual contact/reply actions.
- Dark sidebar with branding, daily tip, profile card, action badge, and a clearly visible
  collapsed/expanded toggle in the header. The collapsed state is persisted via Zustand/localStorage.
- Sidebar also has persisted global controls for AI enablement and light/dark theme. AI enablement
  is a UX consent/control layer only; API routes still rely on server-side environment keys.
- CompanyLogo component with Clearbit URL + deterministic initials fallback.
- RadarChart component (pure SVG, 7 axes).
- Responsive layout for /opportunites (stacked below lg breakpoint).

Tests and quality:
- Business-rule test suite: scripts/business-rules-check.cjs (npm run test:business).
- 78 rule groups (as of Sprint Toggle IA and Mode Nuit): parser, proof points, store, action, pipeline rules,
  Anthropic cv-target output, OpenAI cv-target output, missing-key behavior, local fallback,
  saved CV draft behavior, Profile Intelligence behavior, profile-intelligence API, and
  interview workspace/prep sheet/post-interview learning and memory intelligence behavior covered.
- Real CV markdown parser: 7 new tests cover 4-experience detection, company/title extraction,
  bullet attachment, education exclusion, hasExperienceSection flag, year extraction.
- Latest validation checks pass: lint, typecheck, test:business (78/78), build.

## 4. Corrected Product Priorities

The current product direction is:

1. Profile Intelligence: the master CV must create the full professional picture that powers all
   other modules. This includes experiences, skills, sectors, target roles, avoid roles, seniority,
   strengths, proof points, objections, pitches, STAR examples, ATS keywords, and progression axes.
   Advanced work remains: connect this source of truth more deeply to scoring, packs, interview
   prep, and memory learning.
2. Daily Job Scout: the app must eventually scan or ingest opportunities daily, deduplicate them,
   score them, and produce a short actionable shortlist.
   Advanced work remains: source history, seen/ignored persistence, connectors or controlled
   scraping after policy review, daily cadence, and stronger dedupe.
3. Application Builder: each priority opportunity should produce a targeted CV, LinkedIn message,
   pitch, likely questions, objections, prep plan, and company research.
4. Manual Pipeline & Action Tracking: the user manually confirms every real-world action. Prepared
   assets never imply completed actions.
5. Interview Coach: after "Entretien obtenu", the app should prepare the user with company research,
   role stakes, probable questions, tailored answers, objections, STAR examples, prep sheet, and
   post-interview notes.
6. Career Memory & Learning: notes, feedback, refusals, messages, conversion rates, and patterns
   should improve future recommendations.
7. Privacy / Persistence / Deployment / QA: local-first trust must evolve into durable, explicit,
   tested, deployable product infrastructure.

Sprint Score Honnete, Sprint Pack Honnete, Profile Intelligence LLM Review, LLM Application
Builder Enablement, and LLM Interview Coach are complete.
Next recommended sprint: Sprint 29 Durable Persistence.

## 5. Mocked / Stubbed / Not Real Yet

- CV targeting: first real LLM path exists via /api/cv-target, and generated/local output can be
  saved manually as a local CVVersion. It requires either OPENAI_API_KEY or ANTHROPIC_API_KEY for
  real provider generation.
  CV targeting prompts include saved Profile Intelligence when available.
  Real provider testing is paused until API keys and active credits are available.
- Local fallback targeted CV drafts can be saved and viewed in /cv.
- Application pack generation: local deterministic pack generation exists and uses Profile
  Intelligence when available. A guarded /api/application-pack route now supports real LLM
  generation after explicit consent. Company research remains future work.
- Copilot responses: hardcoded strings. No real LLM connection.
- Memory and learning insights: first local computed insights exist. They are keyword/rule based, not a full
  semantic memory or RAG layer yet.
- Daily Job Scout: manual opportunity import now has duplicate detection and keyword preview.
  There is still no daily source scan, source queue, dedupe history persistence, or automated scout.
- Interview Coach: local workspace, prep sheet, and manual post-interview note capture exist.
  A guarded /api/interview-prep route now supports real LLM preparation after explicit consent.
  Learning is simple keyword-based local extraction, not a full intelligence layer yet.
- Clearbit logo URLs: external requests, may fail silently. Fallback (initials + color) always works.
- Progression historical snapshots: only current state. No week-over-week deltas.
- KPI "delta vs yesterday" on dashboard: hardcoded "+12 vs hier".
- No PDF/DOCX import or export.
- No backend, no authentication, no real database.

## 6. Important Files

Store and types:
- src/types/index.ts: all domain types. JobOffer has logoUrl field.
  UserProfile has optional profileIntelligence for backward compatibility.
- src/stores/app-store.ts: Zustand store. Key: careerstudio-store. Persist version: 2.
  Key exports: addManualOpportunity, saveProfileAndRescore, confirmOpportunityApplied,
  archiveOpportunity, addApplicationEvent, confirmContacted, addMemoryItem, updateMemoryItem,
  deleteMemoryItem, setSelectedOpportunity, saveTargetedCVDraft, toggleSidebar, enableAI,
  disableAI, setTheme, toggleTheme.

Business logic:
- src/app/api/cv-target/route.ts: guarded POST route for targeted CV bullets via configured LLM provider.
  Does not log or persist user profile data server-side.
- src/app/api/profile-intelligence/route.ts: guarded POST route for Profile Intelligence extraction
  from master CV text via configured LLM provider. Returns profileIntelligence plus calibration.
  Does not auto-run and does not persist server-side.
- src/app/api/application-pack/route.ts: guarded POST route for ApplicationPack generation via
  configured LLM provider. Does not auto-run and does not persist server-side.
- src/app/api/interview-prep/route.ts: guarded POST route for interview prep generation via
  configured LLM provider. Does not auto-run and does not mutate pipeline state.
- src/lib/llm/cv-targeting.ts: shared CV targeting prompt, JSON parsing, Anthropic provider,
  OpenAI provider, provider selection, missing-key detection, and local non-AI fallback.
- src/lib/llm/profile-intelligence.ts: shared profile intelligence prompt, JSON parsing, Anthropic
  provider call, OpenAI provider call, and validation. Prompt is proof-led for real CV usage.
- src/lib/llm/application-pack.ts: shared application pack prompt, JSON parsing, Anthropic
  provider call, OpenAI provider call, and validation.
- src/lib/llm/interview-prep.ts: shared interview prep prompt, JSON parsing, Anthropic
  provider call, OpenAI provider call, and validation.
- src/lib/local-cv-version.ts: converts targeted CV output into a local CVVersion.
- src/lib/profile-intelligence.ts: derives ProfileIntelligence locally from UserProfile with no API call.
- src/lib/cv-parser.ts: CV text parser. Exports parseCVToProfile (ParsedCV with confidence) and
  parseCV (Partial<UserProfile>). Uses regex, line scanning, 44-term S&O skill list. No LLM.
  stripMarkdown() preprocesses all lines (strips **, *, ##, >, ---, NBSP) before any extraction.
  EXPERIENCE_HEADER_RE: primary pattern for "Company, Title . Month YYYY - Month YYYY" format.
  EXPERIENCE_SECTION_RE / STOP_SECTION_RE: section-aware scanning (stops at Formation/Competences).
  ParsedExperience: company, title, startYear, endYear, isCurrent, rawLine, description, achievements[].
  ParsedCV.hasExperienceSection: true when an Experience section header was found in the text.
  ParsedCV includes proofPoints: CandidateProofPoint[] (quantified impact lines from CV text).
  CandidateProofPoint: { text, linkedSkill, confidence, source: extracted_from_cv, status: to_review }.
- src/lib/job-scout.ts: Daily Job Scout helpers. SOURCE_PRESETS (6 source chips), detectDuplicate
  (URL match then normalized company+title match), previewJobKeywords (36-term S&O skill list),
  getScoutQueue (filter new, sort by verdict then globalFit, cap at maxItems).
- src/lib/local-pack.ts: generateLocalApplicationPack(profile, opportunity) -> ApplicationPack.
  Composes all pack fields deterministically from profile data and opportunity score. No LLM.
- src/lib/application-pack-quality.ts: evaluates ApplicationPack quality, section scores, and
  warning flags. No side effects.
- src/lib/pipeline-rules.ts: J+7/J+21/J+30 rules, daysBetween, getLastManualEvent.
- src/lib/interview-handoff.ts: pure readiness helper for interview-stage dossiers. It returns
  null for non-interview statuses and never mutates pipeline state.
- src/lib/interview-coach.ts: pure helper that builds the /entretiens prep workspace from existing
  local data, including answer drafts, research prompts, interviewer context, and capture prompts.
  It also derives simple post-interview learning signals from note text. It returns null for
  non-interview statuses and never mutates pipeline state.
- src/lib/memory-intelligence.ts: pure helper that computes local memory insights, objections,
  positive patterns, follow-up opportunities, and linkage coverage from MemoryItem[].
- src/lib/learning-dashboard.ts: pure helper that combines applications, ApplicationEvents, and
  MemoryItems into response/interview rates, memory coverage, strongest signals, improvement
  areas, and recommended actions. It never mutates pipeline state.
- src/lib/privacy-boundaries.ts: data boundary definitions for LLM actions. It documents what
  stays local, what is sent after consent, what is not sent, API key requirements, and fallback
  availability.
- src/lib/network-layer.ts: pure contact signal, priority, and draft-suggestion helper. It
  separates prepared messages, sent contacts, due follow-ups, replies, and archived contacts
  without mutating state.
- src/lib/daily-actions.ts: computeDailyActions, computeDailyInsight, computeShortAction.
- src/lib/local-scoring.ts: deterministic local scoring from profile fields, networkContacts
  access signals, and postedAt timing signals.
- src/lib/opportunity-snapshot.ts: snapshot builder for /parametres export.

Mock data (source of truth until real import exists):
- src/data/mock-profile.ts: initial profile loaded into store.
- src/data/mock-opportunities.ts: 5 S&O opportunities with logoUrl fields.
- src/data/mock-applications.ts: applications, events, contacts, pipeline job labels.
- src/data/mock-cv.ts: targeted CV versions.
- src/data/mock-memory.ts: memory items and static insights.

Key pages and components:
- src/app/page.tsx: dashboard. Uses local React state to collapse/expand DashboardOpportunityPanel.
- src/app/globals.css: theme tokens and premium surface utilities for light/dark UI.
- src/app/entretiens/page.tsx: Interview Coach workspace. Local, suggestion-only preparation sheet.
- src/components/shared/PageShell.tsx: shared premium page primitives for page shells, headers,
  cards, metrics, and common button classes.
- src/components/shared/ConsentDialog.tsx: reusable privacy/consent modal for explicit LLM calls.
- src/components/dashboard/DashboardOpportunityPanel.tsx: dashboard-only selected opportunity panel
  with full and compact modes.
- src/app/opportunites/page.tsx: opportunity list page with import form.
- src/app/profil/page.tsx: profile with edit mode.
- src/app/onboarding/page.tsx: real CV intake and local extraction review.
- src/components/layout/Sidebar.tsx: dark collapsible sidebar with branding, nav, profile card,
  daily tip, header toggle, persisted collapsed state, global AI toggle, AI consent modal, and
  light/dark theme toggle.
- src/components/layout/ClientLayout.tsx: applies the persisted global theme by toggling the
  document dark class.
- src/components/opportunities/OpportunityDetail.tsx: detail panel with tabs (Sprint 7C).
- src/components/opportunities/OpportunityListItem.tsx: list row (Sprint 7D style).
- src/components/shared/CompanyLogo.tsx: logo with Clearbit + initials fallback.
- src/components/shared/RadarChart.tsx: pure SVG radar chart, 7 axes.
  Uses CSS variables for grid, axis, fill, stroke, labels, and scale text.
- scripts/business-rules-check.cjs: business-rule test runner.
- .env.local.example: documents LLM_PROVIDER, OPENAI_API_KEY, OPENAI_MODEL, ANTHROPIC_API_KEY,
  and ANTHROPIC_MODEL. .env.local remains ignored.

## 7. Product Rules Not To Break

- Manual confirmations only: no status changes without a user action.
- Prepared != done: generating a CV or pack does not mean the application was sent.
- Generated CV != application sent.
- Generated pack != application sent.
- No automatic Gmail, calendar, ATS detection, or LLM calls.
- The global aiEnabled setting is a UX control only. It prevents client-side LLM calls from the
  UI, but it is not a server-side security boundary.
- Data is local by default: everything in localStorage, nothing sent to a server.
- UX must stay calm, French, action-first, and low-anxiety.
- The / page (Tableau de bord) is the primary entry point and should keep the four-block reference
  composition unless a future product decision changes it.
- Master CV / profile is the source of scoring truth.
- Profile Intelligence is the long-term source of truth for scoring, dashboard, application
  builder, interview prep, and learning.
- Do not change existing route paths without a clear reason.
- Time-based rules (J+7/J+21/J+30) suggest actions; they never silently mutate confirmed statuses.
- Intelligence doctrine: local outputs are records, estimates, limited analyses, drafts, or
  fallbacks. LLM outputs are understanding/generation/coaching outputs, but still require review.
  The user is the only authority for validated truth and real-world confirmations.
- LLM primacy rule: on Profile Intelligence, CV targeting, Application Pack, and Interview Prep,
  when aiEnabled is true the AI CTA should be the first visible CTA. Local fallback must remain
  available but visually secondary.

## 8. Technical Rules Not To Break

Stack:
- Next.js 16.2.4 App Router. React 19. TypeScript 5. Tailwind CSS 4. Zustand 5. Lucide React.
- No backend database. External calls: Clearbit logo fallback requests, and LLM routes call the
  configured provider (OpenAI or Anthropic) only after explicit user click and global AI enablement
  in the UI.

State:
- Zustand persist key: careerstudio-store. Persist version: 2. Do not change version without migration.
- profile and opportunities are now persisted (added in Sprint 9A).
- All store actions are side-effect free except localStorage writes.

Build and quality gates (all must pass before stopping):
- npm run lint
- npx tsc --noEmit
- npm run test:business (78/78 rule groups as of Sprint Toggle IA and Mode Nuit)
- npm run build (includes dynamic /api/cv-target route)
- rg -n "[^\x00-\x7F]" AGENTS.md docs (must return 0 matches)

Dependencies:
- Do not add npm packages without clear justification.
- No chart library: radar chart is pure SVG. Keep it that way.

## 9. Known Issues / Risks

- ActionCard, ComputedActionCard, OpportunityMiniCard: may be orphaned after Sprint 7 rewrites.
  Dashboard no longer uses them directly. Keep until manual QA confirms it is safe to delete.
- Learning dashboard is local and keyword/rule based. It has no semantic memory or historical snapshots yet.
- probably_ghosted status: persisted in the store. Decision to keep or make it derived is open.
- Progression: no historical snapshots. The "before/after" comparison cannot work without them.
- Clearbit logos: external HTTP requests. Fallback is always present; no blocking risk.
- CV parser experience extraction: regex-based. Ambiguous company/title order is resolved by a
  role-keyword heuristic but can misassign company vs title for unusual CV formats. User can
  correct in the review form.
- After real CV import: proofPoints and objections are cleared (not fully extractable without richer LLM review).
  The profile sections for proofPoints and objections will appear empty until manually filled
  on /profil or until a later LLM profile-review sprint.
- mockmasterCV rawText is empty string by default. setMasterCV is called on onboarding confirm.
- PROJECT_BRIEF.md was updated after the roadmap correction, but agents should still treat
  docs/TASKS.md as the active roadmap authority.
- Senior audit credibility issues from Score Honnete and Pack Honnete are fixed.

## 10. Next Recommended Sprint

Sprint PDF CV Import, followed by Sprint Global DA Consistency.

Scope direction:
- add PDF upload to /onboarding without replacing paste-text intake;
- extract PDF text locally if feasible;
- pipe extracted text into parseCVToProfile and the existing review flow;
- handle scanned/image PDFs with a clear no-OCR fallback to manual paste;
- document any dependency such as pdfjs-dist before adding it.

Global DA Consistency direction:
- harmonize /opportunites, /cv, /candidatures, /entretiens, /reseau, /memoire, /progression,
  /profil, /parametres, and /onboarding around the same premium surface, typography, badge,
  button, input, and active-state language;
- highest visual divergence today: /cv, /opportunites, /onboarding, and nested cards inside
  /reseau and /entretiens;
- UI-only, no scoring/store/API/pipeline changes.

Strategic tracks to keep visible after Sprint 21:
- Profile Intelligence Advanced: make the full professional picture drive scoring, packs,
  interview prep, and memory learning.
- Daily Job Scout: source history, source connectors or controlled scraping, daily cadence,
  shortlist explanation, and dedupe persistence.

## 11. Commands

```
npm run dev           # start dev server on localhost:3000
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript check
npm run test:business # business-rule checks (78/78 as of Sprint Toggle IA and Mode Nuit)
npm run build         # production build, includes dynamic /api/cv-target route
rg -n "[^\x00-\x7F]" AGENTS.md docs   # verify coordination docs are ASCII-only
```

## 12. Open Questions

- Should probably_ghosted become a computed derived view rather than a persisted status?
- Should ActionCard, ComputedActionCard, and OpportunityMiniCard be deleted after QA?
- When should Clearbit logo calls be replaced with local assets?
- Should proof points extracted from CV be linkable to specific experiences (not just a skill)?
- Should the onboarding flow offer to merge with an existing profile rather than overwrite it?
- Should /profil show a "CV importe le X" timestamp from masterCV.uploadedAt?
- Should the extraction quality threshold for "strong" require proof points in addition to name+skills+exp?
- Should local fallback drafts become saveable before real LLM output is saveable?
- Should Daily Job Scout remain manual/import-first for the next no-paid sprint, or should source
  connector research start before implementation?
- Should Sprint 14 store confidence per ProfileIntelligence field, or keep field-level confidence
  in a separate review metadata object?
