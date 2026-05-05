# Tasks

## Active Sprint

None. All use-readiness sprints complete. Next: Sprint Bug + Real Use (Thursday).

## Ready for Real Use

All three use-readiness sprints completed 2026-05-04:

Sprint Reset Propre (done):
- startFresh action in app-store.ts clears all data, sets appMode "real".
- Demo mode amber banner on dashboard with link to /parametres.
- "Demarrer avec mes vraies donnees" card in /parametres with double-confirm flow.

Sprint Scout Quotidien (done):
- auto-detect source from pasted URL (LinkedIn, Indeed, WTTJ, Glassdoor, APEC, Monster).
- auto-fill title + company from pasted description via parseJobDescriptionHead heuristic.
- empty state on /opportunites list and right panel when zero opportunities.
- 2 new business tests for parseJobDescriptionHead -- 82/82 passing.

Sprint DA Consistency (done):
- replaced bg-[#f6f7fb] with app-premium-bg on /cv, /onboarding, /opportunites.
- added .dark .bg-white/70, /80, /90, /95 overrides to globals.css.
- all pages now use app-premium-bg or PageShell (which uses it).
- 82/82 business-rule checks still passing.

## Product Roadmap Authority

The product is no longer planned as a "local prototype cleanup" track.
The roadmap is now organized around the final product vision:

1. Profile Intelligence
2. Daily Job Scout
3. Application Builder
4. Manual Pipeline & Action Tracking
5. Interview Coach
6. Career Memory & Learning
7. Privacy / Persistence / Deployment / QA

All future sprint proposals must map to one of these pillars.

## Intelligence Doctrine

The product now follows a Local / LLM / User doctrine:

- Local = system of record, structure, storage, simple calculations, fallback, privacy, and
  manual tracking.
- LLM = understanding, synthesis, personalization, generation, and coaching.
- User = validation, correction, and confirmation of real-world actions.

Local heuristics remain valuable, but they must not be presented as the main qualitative
intelligence of the product. Regex parsing, keyword matching, local packs, STAR examples, memory
signals, and local learning are fallbacks/scaffolding unless an explicit LLM or user validation
step upgrades them.

Required UX labels:

- LLM outputs: "Analyse IA", "Genere avec IA", "Personnalise par IA", "A relire".
- Local outputs: "Analyse locale limitee", "Brouillon local", "Estimation locale",
  "Deduit localement", "Fallback local".
- Confidence: "Preuve forte", "Preuve moderee", "Preuve faible", "Donnee manquante",
  "Hypothese a confirmer".

Guardrails:

- no automatic LLM call;
- no auto-save without validation;
- no automatic pipeline status change;
- no automatic message/application sending;
- no removal of local fallbacks;
- no API dependency required to use the app;
- outputs must stay short, structured, reviewable, and source-labeled.

## LLM Primacy UI Rule

For qualitative tasks, the UI hierarchy must follow the product doctrine:

- if aiEnabled is true, the AI CTA is the first visible CTA;
- if aiEnabled is false, show a clear disabled-AI state and keep the local fallback available;
- local fallback remains useful but visually secondary;
- AI output is still a draft/review object until the user validates it;
- no route, provider, store, scoring, or pipeline behavior should change for a UI hierarchy sprint.

Applies to:

- Profile Intelligence;
- CV targeting;
- Application Pack;
- Interview Prep.

## Strategic Pillars To Preserve

Two pillars are especially important to the final product vision and must not be treated as
minor cleanup:

### Profile Intelligence Advanced

The master CV and profile must become a full professional picture, not only a scoring profile.
The target state includes:
- target roles and role families;
- sectors and company types;
- skills and ATS keywords;
- positioning angles;
- pitch variants;
- likely objections;
- proof points and STAR examples;
- progression axes;
- confidence / direct-vs-inferred metadata.

Current state:
- Sprints 12-14 created the schema, local derivation, LLM route, and calibration panel.

Remaining product work:
- connect Profile Intelligence more deeply to scoring, CV targeting, application packs,
  interview prep, and memory learning;
- improve confidence metadata and review UX;
- use the profile as the single source of truth for all generated artifacts.

### Daily Job Scout

The app must eventually find or ingest relevant opportunities daily, deduplicate them, score
them, and turn them into a short actionable shortlist.

Current state:
- Sprints 15-16 created manual source intake, duplicate detection, keyword preview, scout queue,
  shortlist, and ignore actions.

Remaining product work:
- persist source history and seen/ignored opportunities;
- support source connectors or controlled scraping after policy review;
- add daily scan cadence and review queue;
- improve dedupe across URLs, companies, titles, and descriptions;
- explain why each opportunity is shortlisted or ignored;
- keep the daily surface focused on a small shortlist, not a giant job board.

## Current Alignment Assessment

Well aligned:
- Profile Intelligence has a starting point: master CV intake, local parser, editable profile,
  proof point extraction, profile-based scoring, and guarded LLM targeting route.
- Application Builder has a starting point: targeted CV view, ATS scoring, local fallback,
  saveable CV drafts, and mocked application packs.
- Manual Pipeline & Action Tracking is the strongest pillar today: manual confirmations,
  ApplicationEvents, J+7/J+21/J+30 suggestions, network/contact tracking, and pipeline views.
- Career Memory exists as local CRUD with linked events, but learning logic is still shallow.
- Privacy / Persistence / QA has a foundation: localStorage, export/reset, business tests,
  missing-key LLM handling, and local fallback.

Missing or too weak:
- Daily Job Scout is the biggest product gap. Today there is manual opportunity import and local
  scoring, but no daily source scan, dedupe queue, source history, or real scout workflow.
- Profile Intelligence is incomplete. It does not yet produce the full professional picture:
  seniority, target and avoid roles, pitch variants, STAR examples, ATS keyword map, objections,
  progression axes, or confidence levels from a rich analysis layer.
- Interview Coach is not a real pillar yet. There is no interview trigger flow, interview date,
  prep sheet, company research, STAR answer mapping, post-interview note, or learning loop.
- Application Builder is incomplete. CV targeting exists, but LinkedIn message, pitch, questions,
  objections, company research, and prep plan are still mostly mocked.
- Career Memory does not yet learn from real notes, refusals, feedback, messages, interviews,
  and pipeline outcomes.

Too local or prototype-like:
- Regex CV parsing is useful but transitional. It should remain a fallback when LLM credits are
  unavailable, not the final intelligence layer.
- Local deterministic scoring is useful but should become explainable, versioned, and eventually
  supported by profile intelligence and job scout signals.
- Application pack content is static and must be converted into generated or locally composed
  drafts with clear demo/fallback labels.
- localStorage is good for prototype trust, but finished product needs durable persistence,
  privacy controls, migrations, and account/device strategy.
- Dashboard KPI deltas and memory insights are still partly mocked.

Priority corrections:
- Daily Job Scout must move much higher because it is central to the final promise.
- Interview Coach must move higher because it is a major product mode after "Entretien obtenu".
- Profile Intelligence must be treated as the source of truth for every other module.
- Application Builder must include the full pack, not only CV targeting.
- Memory should learn from confirmed events and user notes, not only store static items.

Naming corrections:
- "Local CV draft quality" becomes "Application Builder - CV Targeting Editor".
- "Memory insights" becomes "Career Memory & Learning - Feedback Loop".
- "Durable persistence" becomes "Privacy, Persistence & Data Layer".
- "/entretiens route" becomes "Interview Coach".
- "Manual opportunity import" becomes "Daily Job Scout - Manual Source Intake".

## Corrected Roadmap

### Phase 1 - Profile Intelligence

Goal: the master CV creates the professional source of truth that powers the dashboard, scoring,
target roles, pitch, objections, ATS keywords, and preparation modules.

Sprint 12 - Profile Intelligence Schema and Review (no paid API required)
- Extend the profile model carefully with optional intelligence fields:
  seniority, target roles, roles to avoid, sectors, strengths, proof points, objections,
  pitch variants, STAR examples, ATS keywords, and progression axes.
- Keep regex/local extraction as fallback.
- Show the full picture in /profil with editable sections.
- Add business tests for the schema/default behavior.

Sprint 13 - Profile Intelligence LLM Extraction (requires API credits)
- Add a guarded user-triggered route for full CV analysis.
- Return structured JSON only.
- Never auto-call on page load.
- Merge LLM output into the review flow, not directly into final state.

Sprint 14 - Profile Intelligence QA and Calibration
- Add confidence levels per extracted field.
- Add "what was inferred" vs "what was directly found in CV".
- Add review warnings for weak proof points, vague seniority, or unclear target role.

### Phase 2 - Daily Job Scout

Goal: the app finds or ingests relevant opportunities daily, deduplicates them, scores them,
and produces a short actionable shortlist.

Sprint 15 - Daily Job Scout Manual Source Intake (no paid API required)
- Improve manual job import with pasted description parsing, source metadata, and duplicates.
- Add source history and "already seen" detection.
- Add business tests for dedupe and scoring preservation.

Sprint 16 - Daily Scout Queue and Shortlist
- Create a daily review queue: new, duplicate, ignored, shortlisted.
- Limit daily surface to top opportunities and top actions.
- Explain why an offer is shortlisted or rejected.

Sprint 17 - Controlled External Scout (later, requires policy review)
- Add supported source connectors or scraping only after legal/technical review.
- Respect rate limits, robots, source terms, and user-triggered controls.
- No hidden background scraping in early versions.

### Phase 3 - Application Builder

Goal: for each priority opportunity, generate a complete application workspace.

Sprint 18 - CV Targeting Editor
- Make saved targeted CV drafts editable.
- Compare master CV vs targeted CV.
- Track missing keywords and weak bullets.
- Keep "generated" distinct from "sent".

Sprint 19 - Application Pack Builder
- Generate or locally compose: LinkedIn message, pitch, why me, why company,
  probable questions, objections, mini prep plan, and company research notes.
- Clearly mark demo/local fallback vs real LLM output.

Sprint 20 - Application Builder QA
- Add quality checks for vague bullets, unsupported claims, missing keywords,
  too-long messages, and weak narrative.

### Phase 4 - Manual Pipeline & Action Tracking

Goal: the user manually confirms every real-world action, and the system turns that history
into the next best action.

Sprint 21 - Pipeline Pro
- Strengthen manual event states: applied, contacted, followed up, interview obtained,
  rejected, ghosted, archived.
- Add clearer event history and next-action suggestions.

Sprint 22 - Network Layer
- Connect contacts more tightly to opportunities and applications.
- Track who was contacted, message prepared, message sent, reply received, and referral status.

### Phase 5 - Interview Coach

Goal: when the user confirms an interview, the app becomes a preparation coach.

Sprint 23 - Interview Trigger and Scheduling
- Add "Entretien obtenu" flow with date, format, interviewer, company, and linked application.
- Generate a prep task automatically, but do not mark it done.

Sprint 24 - Interview Prep Sheet
- Build visual prep sheet: company, role stakes, probable questions, objections,
  adapted answers, STAR examples, and questions to ask.
- Use profile intelligence and application history.

Sprint 25 - Post-Interview Notes and Learning
- Add post-interview note capture.
- Link notes to memory.
- Extract learnings, objections, and follow-up actions.

### Phase 6 - Career Memory & Learning

Goal: the app learns which angles, roles, companies, messages, and proof points work over time.

Sprint 26 - Memory Intelligence
- Turn notes, refusals, feedback, messages, and interview notes into searchable linked memory.
- Compute recurring objections and successful patterns locally first.

Sprint 27 - Learning Dashboard
- Show what works: roles, sectors, seniority levels, sources, message types, and proof points.
- Show what to improve: missing proof, repeated objections, weak conversion steps.

### Phase 7 - Privacy / Persistence / Deployment / QA

Goal: make the product safe, durable, testable, and ready for beta usage.

Sprint 28 - Privacy and Consent
- Make data boundaries explicit: local vs API-sent fields.
- Add consent screens before sending CV/job data to any LLM provider.
- Add provider status and missing-key guidance.

Sprint 29 - Durable Persistence
- Decide local SQLite, hosted database, or Supabase/Postgres.
- Add migrations, backups, import/export, and reset.

Sprint 30 - Auth and Accounts
- Add authentication only after persistence decision.
- Keep local-first export/import available.

Sprint 31 - QA Hardening
- Expand business tests, add route smoke checks, and add visual regression checklist.
- Audit every mocked/demo surface.

Sprint 32 - Deployment and Beta
- Production deployment, environment setup, privacy copy, onboarding checklist,
  and beta feedback loop.

## Recommended Next Sprint

Recommended: Sprint LLM Primacy (before Sprint 29).

Reason:
- The product doctrine (docs/PRODUCT_DOCTRINE.md) has been documented and labeled in the UI,
  but the UI hierarchy has not changed. Local output is still visually primary on Profile
  Intelligence, CV targeting, application pack, and interview prep -- even when AI is enabled.
- Sprint LLM Primacy restructures the UI so that when AI is enabled, the LLM generation CTA
  is the primary visible action and local output is clearly scaffolding or fallback.
- This sprint uses only existing LLM routes and stores. No new backend is required.
- After Sprint LLM Primacy, real users with API keys get a product where the intelligence
  layer is actually primary, not hidden behind local-first scaffolding.
- Sprint 29 (Durable Persistence) requires a product/technical decision (SQLite vs Supabase)
  that is independent and can run in parallel with LLM Primacy planning.

Sprint LLM Primacy -- Scope:

Target 1: /profil -- Profile Intelligence section
- AI disabled: local view + one "Analyse locale" label + "Activer l'IA pour une analyse reelle" nudge.
- AI enabled, LLM not run: prominent "Analyser avec IA" replaces section header. Local view
  shown below as "Apercu local (non calibre)".
- AI enabled, LLM run: LLM result is primary. Local view hidden or collapsible.

Target 2: /opportunites -- CV targeting
- AI disabled: "Generer un brouillon local" is the only option.
- AI enabled: "Generer avec IA" (primary), "Brouillon sans IA" (secondary ghost button).

Target 3: /opportunites -- Application pack tab
- Same pattern as CV targeting.

Target 4: /entretiens -- Interview prep
- AI enabled: "Generer ma prep IA" is the first visible CTA. Local workspace shown below
  as scaffolding.

Constraints:
- No store changes. No API route changes. No scoring changes.
- No new LLM routes (all four already exist).
- No new disclaimers. This sprint reduces unnecessary ones and repositions CTAs.
- All 96/96 business tests must still pass after the sprint.

Sprint 29 - Durable Persistence (after Sprint LLM Primacy):

Decision required: local SQLite vs hosted Supabase/Postgres.
- Local SQLite: no backend infrastructure, but device-bound. Good for beta.
- Supabase/Postgres: requires auth, infra setup, but enables multi-device. Good for v1.
Recommendation: decide before starting implementation. This decision blocks H3.

## Done

See docs/CHANGELOG.md for the full sprint history.

Completed sprints summary:
- Sprints 1-3.5: app shell, mock data, CV builder, pipeline trust, ApplicationEvent sourcing,
  J+7/J+21/J+30 rules, /reseau, /parametres.
- Sprint 4: /memoire full CRUD, memory insights (static), linking, event creation.
- Sprint 5: /progression KPI cards, pipeline funnel, weekly chart.
- Sprint 6: dynamic daily dashboard, computed action engine.
- Sprint 6.5: CompanyLogo, RadarChart, logos in opportunity views.
- Sprint 7A-7D: dashboard, sidebar, opportunity detail panel, list item toward JobPilot AI reference.
- Sprint 8A-8C: dead-code cleanup, visual QA/mojibake polish, business-rule test suite.
- Sprint 9A-9C: manual opportunity import + local scoring, editable profile + rescore, snapshot export.
- Sprint 10: real CV parser, real onboarding review flow, profil success banner, 13/13 business rules.
- Sprint 10.5: proof point extraction, onboarding summary card, 17/17 business rules.
- Sprint 10.6: real CV parser robustness, 24/24 business rules.
- Sprint 11: guarded /api/cv-target route using ANTHROPIC_API_KEY, 25/25 business rules.
- Sprint 11.5: multi-provider LLM support for /api/cv-target, 26/26 business rules.
- Sprint 11.6: graceful LLM pause and local fallback, 28/28 business rules.
- Sprint 11.7: save local targeted CV drafts, 29/29 business rules.
- Sprint 12: Profile Intelligence Schema and Review:
  - added backward-compatible ProfileIntelligence schema;
  - added local profile intelligence derivation with no API calls;
  - /profil now shows seniority, role families, avoid roles, sectors, ATS keywords, pitch,
    STAR examples, and progression axes;
  - profile intelligence fields can be edited locally and saved as manual;
  - added business-rule coverage for local derivation and manual persistence;
  - 31/31 business rules.
- Sprint 14: Profile Intelligence QA and Calibration:
  - added CalibrationWarning, CalibrationLevel, CalibrationResult types;
  - added calibrateProfileIntelligence() in src/lib/profile-intelligence.ts;
  - blocking warnings: no target roles, no impact proofs, seniority "To clarify";
  - weak warnings: fewer than 3 proofs, fewer than 8 ATS keywords, no objections, generic pitch;
  - CalibrationPanel component on /profil (always visible, between AI block and KPI cards);
  - 4 new business tests -- 37/37 passing.
- Sprint 13: Profile Intelligence LLM Extraction:
  - added guarded POST /api/profile-intelligence;
  - reuses existing OpenAI/Anthropic provider selection and missing-key behavior;
  - accepts master CV text plus current profile;
  - returns ProfileIntelligence-compatible JSON;
  - /profil has an explicit "Analyser avec IA" trigger;
  - result is shown in a review block and saved only after user confirmation;
  - no automatic LLM call and no pipeline/status mutation;
  - added mocked-provider business tests;
  - 33/33 business rules.
- Sprint 15: Daily Job Scout Manual Source Intake:
  - new src/lib/job-scout.ts with SOURCE_PRESETS, detectDuplicate, previewJobKeywords;
  - detectDuplicate checks URL first, then normalized company+title;
  - previewJobKeywords scans description against 36-term S&O skill list;
  - /opportunites import form upgraded: source chips, keyword preview, duplicate warning;
  - duplicate flow: warn on submit, user can force-import or cancel;
  - 5 new business tests -- 42/42 passing.
- Sprint 16: Daily Scout Queue and Shortlist:
  - added getScoutQueue in src/lib/job-scout.ts: filters status === "new", sorts by verdict
    priority (apply_now first) then globalFit desc, capped at 7 items;
  - /opportunites scout queue panel: shows new opportunities above the main list with
    verdict badge, score%, first reason, Shortlister and Ignorer actions;
  - Shortlister sets status "shortlisted" and opens detail panel;
  - Ignorer sets status "archived" without creating an application or event;
  - main filtered list now excludes status === "new" (handled by queue);
  - empty-state message adapts when queue is present;
  - 4 new business tests -- 46/46 passing.
- Sprint 18: CV Targeting Editor:
  - store: added updateCVContent(id, content) action, persisted via cvVersions;
  - CVContentPanel: edit mode (Modifier button toggles to textarea + Enregistrer/Annuler);
    "Brouillon - non envoye" badge always visible in header;
  - CVScorePanel: amber draft status banner at top with relire-avant-envoi guidance;
    missing keywords hint updated to "a integrer dans tes bullets";
  - /cv sidebar: "Brouillon" amber badge on each CV list item;
  - 2 new business tests -- 48/48 passing.

- Sprint 19: Application Pack Builder:
  - new src/lib/local-pack.ts: generateLocalApplicationPack composes LinkedIn message, pitch30s,
    pitch60s, whyYou, whyCompany, probableQuestions, probableObjections, miniPrepPlan from
    profile + opportunity deterministically, no LLM;
  - store: added applicationPacks (Record<string, ApplicationPack>), saveApplicationPack action,
    initialized with mockApplicationPacks, persisted in partialize and migrate;
  - OpportunityDetail "Preparation" tab: replaced PlaceholderTab with real pack UI -- if pack
    exists shows ApplicationPackPanel; if not shows "Generer localement" button;
  - PackCards on analysis tab and "Voir le pack" button now navigate to Preparation tab;
  - onOpenPack prop removed (replaced by internal tab switching);
  - 3 new business tests -- 51/51 passing.
- Sprint 20: Application Pack Builder QA:
  - added src/lib/application-pack-quality.ts;
  - evaluates pack quality score and section scores;
  - detects vague content, missing proof, missing company personalization, too few questions,
    too few objections, light prep plan, and unsupported quantified claims;
  - ApplicationPackPanel now shows quality score and tab-specific warnings;
  - 3 new business tests -- 54/54 passing.
- Sprint UI - Dashboard Reference Refresh:
  - rebuilt / around the approved reference composition;
  - added dedicated DashboardOpportunityPanel for the right selected-opportunity panel;
  - dashboard opportunity clicks now select locally and update the panel without redirecting;
  - improved dashboard typography hierarchy, KPI readability, score density, and card rhythm;
  - removed visible dashboard mojibake;
  - kept store, scoring, LLM, API, pipeline, and routes unchanged;
  - validation passed: lint, typecheck, test:business 54/54, build.
- Sprint UI - Dashboard Panel Focus Patch:
  - added local collapsed/expanded mode for the dashboard right opportunity panel;
  - compact mode shows logo, title, score, and clear reopen controls;
  - central dashboard column regains space on desktop when the panel is collapsed;
  - enlarged and repositioned the radar chart in the score analysis block;
  - tightened panel typography and score hierarchy;
  - kept store, scoring, LLM, API, pipeline, routes, and business behavior unchanged;
  - validation passed: lint, typecheck, test:business 54/54, build.
- Sprint UI - Global Style Alignment:
  - added shared premium page primitives in src/components/shared/PageShell.tsx;
  - aligned major non-dashboard pages with the dashboard visual direction:
    /opportunites, /candidatures, /cv, /profil, /onboarding, /reseau, /memoire,
    /progression, and /parametres;
  - standardized page shells, headers, premium cards, metric tiles, and primary/secondary buttons;
  - kept store, scoring, LLM, API, pipeline, routes, and business behavior unchanged;
  - validation passed: lint, typecheck, test:business 54/54, build.
- Sprint 21A - Pipeline Pro: Application Timeline UX:
  - upgraded /candidatures with summary metrics for active dossiers, follow-up suggestions,
    interviews, and confirmed manual actions;
  - added a clearer per-application next-action panel;
  - added prepared asset cards for targeted CV, application pack, and linked contact;
  - added a compact stage rail: Prepare -> Envoye -> Reponse -> Entretien -> Issue;
  - made the event timeline clearer with fait / prepare / suggere badges;
  - preserved the rule that prepared assets never imply completed actions;
  - kept store, scoring, LLM, API, routes, and pipeline business rules unchanged;
  - validation passed: lint, typecheck, test:business 54/54, build.
- Sprint 21B - Pipeline Pro: interview handoff and next-action refinement:
  - added src/lib/interview-handoff.ts to compute interview-stage readiness without side effects;
  - /candidatures now shows a preparation handoff for recruiter, manager, case study, and offer statuses;
  - the handoff shows date status, readiness score, next focus, and prep steps:
    targeted CV, application pack, linked contact, and interview note;
  - added links to existing memory and opportunity surfaces instead of creating a new route;
  - preserved manual confirmation rules and did not change store, routes, scoring, LLM, API, or pipeline mutation behavior;
  - added 2 business tests -- 56/56 passing;
  - validation passed: lint, typecheck, test:business 56/56, build.
- Sprint 22A - Network Layer: contact priority and pipeline linkage:
  - added src/lib/network-layer.ts to compute contact signals and priority ordering without side effects;
  - rebuilt /reseau into an operational network cockpit with summary metrics, priority contact,
    status filters, pipeline linkage, follow-up signal, and clearer prepared-message state;
  - contact cards now show pipeline links, follow-up timing, message draft, and manual actions;
  - kept prepared messages distinct from sent contacts;
  - preserved existing store actions and manual confirmation rules;
  - added 2 business tests -- 58/58 passing;
  - validation passed: lint, typecheck, test:business 58/58, build.
- Sprint 22B - Network Layer: referral and contact follow-up refinement:
  - extended src/lib/network-layer.ts with local draft suggestions for first messages,
    follow-ups, reply capitalization, and context preparation;
  - /reseau now shows a suggestion block per contact, clearly marked as suggestion-only;
  - follow-up/referral copy can be copied but is never sent or confirmed automatically;
  - no store status extension was added in this slice;
  - added 1 business test -- 59/59 passing;
  - validation passed: lint, typecheck, test:business 59/59, build.
- Sprint 23A - Interview Coach: dedicated interview workspace:
  - added src/lib/interview-coach.ts to build local interview prep workspaces without side effects;
  - added /entretiens route with active interview dossiers, readiness metrics, role stakes,
    likely questions, objections, STAR examples, questions to ask, checklist, and after-interview prompts;
  - enabled the /entretiens sidebar item;
  - preserved store, API, LLM, scoring, and pipeline mutation behavior;
  - added 2 business tests -- 61/61 passing;
  - validation passed: lint, typecheck, test:business 61/61, build.
- Sprint 24 - Interview Prep Sheet:
  - extended src/lib/interview-coach.ts with tailored answer drafts, company research prompts,
    interviewer context, and post-interview capture prompts;
  - upgraded /entretiens to show these sections as local suggestion-only prep;
  - kept store, API, LLM, scoring, and pipeline mutation behavior unchanged;
  - added 1 business test -- 62/62 passing;
  - validation passed: lint, typecheck, test:business 62/62, build.
- Sprint 25 - Post-Interview Notes and Learning:
  - extended src/lib/interview-coach.ts with buildPostInterviewLearning for local signals,
    objections, follow-up suggestions, sentiment, and tags;
  - /entretiens now has a manual post-interview note capture flow;
  - saving creates a linked interview_note memory item and a manual note event without changing status;
  - kept API, LLM, scoring, and automatic pipeline mutation behavior unchanged;
  - added 1 business test -- 63/63 passing;
  - validation passed: lint, typecheck, test:business 63/63, build.
- Sprint 26 - Memory Intelligence:
  - added src/lib/memory-intelligence.ts to compute local insights from real MemoryItem[];
  - replaced static mockMemoryInsights usage on /memoire with computed insights;
  - added recurring objections, positive patterns, follow-up opportunities, and linkage coverage;
  - fixed visible memoire mojibake in touched UI labels;
  - kept store, API, LLM, scoring, and pipeline mutation behavior unchanged;
  - added 1 business test -- 64/64 passing;
  - validation passed: lint, typecheck, test:business 64/64, build.
- Sprint 27 - Learning Dashboard:
  - added src/lib/learning-dashboard.ts to combine applications, ApplicationEvents, and
    MemoryItems into local learning signals;
  - /progression now shows what works, what to improve, recommended actions, memory coverage,
    conversion counts, pipeline funnel, and weekly activity;
  - fixed visible progression mojibake in touched UI labels;
  - kept store, API, LLM, scoring, and pipeline mutation behavior unchanged;
  - added 1 business test -- 65/65 passing;
  - validation passed: lint, typecheck, test:business 65/65, build.
- Sprint 28 - Privacy and Consent:
  - added src/lib/privacy-boundaries.ts to document local-only data, API-sent payload fields,
    non-sent fields, API key requirement, and local fallback availability for LLM actions;
  - added src/components/shared/ConsentDialog.tsx as a reusable consent modal;
  - /opportunites CV targeting now asks for consent before calling /api/cv-target;
  - /profil Profile Intelligence now asks for consent before calling /api/profile-intelligence;
  - /parametres now shows an IA and consentement section with provider/key guidance;
  - kept store, scoring, routes, API contract, and pipeline mutation behavior unchanged;
  - added 1 business test -- 66/66 passing;
  - validation passed: lint, typecheck, test:business 66/66, build.
- Sprint Fondation Minimale (senior audit cleanup):
  - created src/lib/utils.ts shared utilities: normalizeAccents, normalizeSlug, clamp,
    uniqueItems, uniqueStrings, hasAnySubstring, includesAllWords;
  - created src/lib/constants.ts: OPS_SCORING_KEYWORDS (21 terms, scoring denominator,
    must not grow without re-calibrating weights), SO_SCOUT_SKILLS (40 terms, keyword preview);
  - removed duplicate local implementations of normalize/clamp/unique/hasAny/daysBetween
    from local-scoring.ts, job-scout.ts, network-layer.ts, memory-intelligence.ts,
    learning-dashboard.ts, profile-intelligence.ts, application-pack-quality.ts,
    interview-coach.ts, local-cv-version.ts;
  - network-layer.ts now imports daysBetween from pipeline-rules.ts (was a local copy);
  - ApplicationPack.cvVersionId type corrected from string to string|null in types/index.ts;
  - local-pack.ts: cvVersionId now null instead of empty string;
  - all generated IDs in app-store.ts now use crypto.randomUUID() instead of
    timestamp-based strings (event-${now}-..., memory-${now}, contact-${...});
  - createManualOpportunity in local-scoring.ts now uses crypto.randomUUID() for job IDs;
  - no logic changes, no UI changes, no store structure changes;
  - 66/66 business-rule checks pass;
  - validation passed: lint, typecheck, test:business 66/66, build.
- Sprint Score Honnete:
  - access score is now derived from networkContacts matching linkedJobOfferId or company;
  - access score rules: no contact = 30, at least one matching contact = 65,
    at least one replied contact = 85;
  - timing score is now derived from postedAt age: <=7 days = 90, <=14 = 75,
    <=30 = 60, older = 35;
  - removed hardcoded access=42 and timing=86 from local-scoring.ts;
  - createManualOpportunity and saveProfileAndRescore now pass network/timing context;
  - adding/updating/contacting/replied network contacts now refreshes opportunity scores
    without changing application status;
  - added 3 business tests -- 69/69 passing;
  - validation passed: lint, typecheck, test:business 69/69, build.
- Sprint Pack Honnete:
  - local-pack.ts now composes whyCompany from company/title, opportunity reasons,
    recommendedAngle, and profile angle instead of copying the job description;
  - local pack generation now uses ProfileIntelligence pitch, impactProofs,
    likelyObjections, and STAR examples when available;
  - generated packs remain preparation only and do not change opportunity/application status;
  - application-pack-quality.ts now detects percentage claims like 999% correctly;
  - added 2 business tests -- 71/71 passing;
  - validation passed: lint, typecheck, test:business 71/71, build.
- Sprint Profile Intelligence LLM Review:
  - strengthened the /api/profile-intelligence prompt for real CV use;
  - the prompt now asks for proof-led output, recruiter objections, concrete STAR examples,
    richer ATS keywords, and cautious inference;
  - /api/profile-intelligence now returns calibration metadata alongside the reviewed
    ProfileIntelligence result;
  - /profil now shows calibration warnings before the user saves the LLM result;
  - LLM execution remains explicit, consent-gated, and manually saved;
  - no store version, scoring, pipeline, or route behavior changed;
  - validation passed: lint, typecheck, test:business 71/71, build.
- Sprint LLM Application Builder Enablement:
  - added guarded POST /api/application-pack with OpenAI/Anthropic provider selection;
  - added src/lib/llm/application-pack.ts with prompt, JSON parsing, provider calls, and
    normalization into ApplicationPack;
  - /opportunites Preparation tab can now generate an application pack with IA after consent;
  - local fallback pack generation remains available and visible;
  - generated packs are saved locally only and do not change application/opportunity status;
  - CV targeting prompt now includes saved Profile Intelligence when available;
  - fixed the shared missing API key message to avoid mojibake;
  - added 2 business tests -- 73/73 passing;
  - validation passed: lint, typecheck, test:business 73/73, build.
- Sprint LLM Interview Coach:
  - added guarded POST /api/interview-prep with OpenAI/Anthropic provider selection;
  - added src/lib/llm/interview-prep.ts with prompt, JSON parsing, provider calls, and
    structured interview prep output;
  - /entretiens now has an explicit "Generer prep IA" action behind consent;
  - output includes role stakes, likely questions, tailored answers, objections, STAR mapping,
    prep checklist, company research, and questions to ask;
  - generated prep is displayed locally and does not change application status or create events;
  - added privacy boundary for interview-prep;
  - added 2 business tests -- 75/75 passing;
  - validation passed: lint, typecheck, test:business 75/75, build.
- Sprint Toggle IA and Mode Nuit:
  - store now persists aiEnabled, aiConsentAcceptedAt, and theme without changing persist version 2;
  - sidebar has global AI and light/dark controls, including first-enable AI consent;
  - /profil, /opportunites, and /entretiens block UI LLM calls when aiEnabled is false;
  - local fallbacks remain available where they already existed;
  - dark mode is applied globally from the persisted theme setting;
  - API routes, providers, scoring, pipeline, and route contracts were not changed;
  - added 3 business tests -- 78/78 passing;
  - validation passed: lint, typecheck, test:business 78/78, build.
- Sprint Dark Mode Redesign:
  - replaced the first rough dark-mode overrides with premium theme tokens and semantic UI
    surfaces for dashboard usage;
  - upgraded / dashboard dark-mode surfaces: page background, KPI cards, top opportunities,
    actions, pipeline, and insights now use differentiated navy/slate layers;
  - upgraded DashboardOpportunityPanel dark-mode surfaces: right panel, score area, metric cards,
    CV cible/ATS block, action buttons, and pack section now use premium surfaces instead of
    automatic light-mode inversion;
  - RadarChart now uses CSS variables for grid, axis, fill, stroke, labels, and scale text so it
    adapts cleanly to dark mode;
  - sidebar dark tone and controls were tuned to match the global navy system;
  - no store, scoring, LLM, API routes, or pipeline behavior changed;
  - validation passed: lint, typecheck, test:business 78/78, build.

## In Progress

Nothing. All use-readiness sprints done.

## Next

- Sprint Bug + Real Use (Thursday 2026-05-07): end-to-end test with real CV,
  real profile, 5 real offers, full pipeline. Fix bugs discovered during real use.
- Real API testing pass once OPENAI_API_KEY or ANTHROPIC_API_KEY and credits are configured.
- Strategic track to keep in view after Pipeline Pro:
  - Profile Intelligence Advanced integration into scoring, packs, interview prep, and memory.
  - Daily Job Scout source history, connectors, daily scan cadence, and dedupe persistence.

## Next Sprint Detail - PDF CV Import

Objective:
- Allow the user to upload a PDF resume, extract its text, then reuse the existing flow:
  PDF -> extracted text -> parseCVToProfile -> user review -> validation -> saved profile ->
  opportunities rescored.

Constraints:
- Prefer local extraction if technically feasible.
- Do not send the PDF to a server for parsing.
- If extraction is local, clearly show "PDF analyse localement" in the UI.
- Handle unreadable/scanned/image PDFs with a clear error.
- No OCR in the first PDF sprint.
- Keep the existing paste-text flow.
- Accept PDF only in this sprint.
- Document any dependency before adding it, for example pdfjs-dist.
- Do not add a dependency without justification.

## Planned Sprint Detail - Global DA Consistency

Objective:
- Harmonize all major pages with the same premium visual language as the dashboard.

Pages:
- /opportunites
- /cv
- /candidatures
- /entretiens
- /reseau
- /memoire
- /progression
- /profil
- /parametres
- /onboarding

Direction:
- Same navy/slate/violet dark palette.
- Same PremiumCard/PageShell/Button primitives.
- Same border, badge, input, active-state, and panel language.
- Same typography weight and spacing rhythm.
- Avoid one-off page-specific styles when shared primitives can be used.

Current highest divergence:
- /cv still uses page-local split panels with hardcoded white surfaces.
- /opportunites uses a complex two-panel layout with many local bg-white/input classes.
- /onboarding has a standalone centered card flow.
- /reseau and /entretiens use shared primitives but still contain many nested hardcoded light cards.

Constraint:
- UI-only. Do not change scoring, LLM, API routes, store shape, or pipeline rules.

## Blocked

- Real LLM execution requires OPENAI_API_KEY or ANTHROPIC_API_KEY configured with active API credits.
- Controlled external scout/scraping is blocked until source policy and legal constraints
  are reviewed.
- Durable persistence requires an explicit product/technical decision.
- The repo folder is not a git repository; agents cannot rely on git status or diff.

## Later

- Real PDF/DOCX parsing and export.
- Controlled source connectors or scraping.
- Complete RAG/memory system.
- Authentication.
- Deployment workflow.
- Durable migrations for persisted local state.
- Historical progression snapshots.
