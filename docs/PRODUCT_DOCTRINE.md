# Product Doctrine: Local / LLM / User

## Document Purpose

This document is the authoritative reference for how intelligence is distributed across
CareerStudio modules. It must be read before any sprint that touches analysis, generation,
scoring, or UI labels. It supersedes informal sprint notes on this topic.

The doctrine is not aspirational. It is a constraint. Violating it produces a product that
either oversells local analysis as AI-quality intelligence, or underutilizes LLM when it
would genuinely help.

---

## Core Doctrine

### Local = System of Record

Local code handles: storage, structure, deduplication, deterministic scoring, manual event
tracking, heuristic fallbacks, privacy enforcement, and scaffolding for future LLM output.

Local output is not qualitative intelligence. A regex extracting "SQL" from a CV does not
understand the candidate's SQL depth. A keyword scorer ranking an opportunity does not
understand whether the role is actually a fit. Local computation is fast, private, and
consistent -- but it is not understanding.

### LLM = Qualitative Intelligence Layer

LLM handles: positioning synthesis, personalization, generation, coaching, semantic
understanding of text, recruiting-angle framing, and cross-concept reasoning.

LLM output is not a system of record. It is a draft, a synthesis, a suggestion. It must
remain reviewable, correctable, and clearly labeled. It must never auto-save or auto-mutate
pipeline status.

### User = Sole Authority for Real-World Actions

The user confirms: status changes, sent applications, contacts marked as reached out,
post-interview notes saved, memory items created. The user validates LLM output before
saving it. The user corrects extracted profile data before it becomes the source of truth.

No automated action replaces a manual confirmation.

---

## Module Classification Table

### 1. CV Import and Parsing

Classification: Local-first (always, regardless of AI status)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Text extraction, PDF parsing, regex structure detection,       |
|                 | confidence annotation, PII stripping, proof point extraction   |
| LLM role        | Optional upgrade: smarter entity extraction, better section    |
|                 | detection (future, not required)                               |
| User role       | Reviews every extracted field in onboarding review form        |
|                 | before confirming. Weak extraction requires explicit bypass.   |
| Forbidden       | Auto-save without review. Sending raw CV to LLM without       |
|                 | explicit consent. Claiming extraction is "AI-powered" when it |
|                 | is regex-based.                                                |
| Today           | cv-parser.ts regex + PDF extraction + review form. Solid.     |
| Missing         | LLM-backed parsing as upgrade when AI enabled (not urgent).   |
| Next change     | None needed. Local foundation is honest and functional.        |

Verdict: well-calibrated. Do not change architecture.

---

### 2. Profile Intelligence

Classification: Hybrid -- Local as scaffolding, LLM as the expected primary output

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Heuristic derivation: seniority from years of experience,     |
|                 | keyword-based role families, ATS keywords from profile fields, |
|                 | basic pitch template, local objections from gap analysis.      |
|                 | This is scaffolding. It enables the product to function        |
|                 | without API credits, not to replace LLM understanding.         |
| LLM role        | Real positioning analysis, recruiter-facing objections,        |
|                 | pitch variants grounded in CV evidence, STAR examples,         |
|                 | ATS keyword quality assessment, seniority judgment from role   |
|                 | context (not just years).                                      |
| User role       | Reviews LLM output before saving. Can edit manually.          |
|                 | Can reject LLM output and keep local scaffolding.             |
| Forbidden       | Presenting local heuristics as equivalent to LLM output.      |
|                 | Auto-saving LLM output after generation.                       |
|                 | Showing local derived pitch as the user's positioning pitch    |
|                 | without clear "heuristic, not analysis" framing.               |
| Today           | Local derivation is shown as the primary view on /profil.     |
|                 | LLM route exists but "Analyser avec IA" is visually secondary.|
|                 | Calibration panel shows warnings but does not redirect user.   |
| Missing         | When AI is enabled, LLM CTA should be the primary action,     |
|                 | not an option below a full local output view.                  |
|                 | Local view should read as "scaffolding while waiting for IA". |
| Next change     | See Sprint LLM Primacy below.                                  |

Verdict: the local view is currently overpresented. Adding "locale limitee" labels does not
fix the hierarchy. The LLM path must become visually primary when AI is enabled.

---

### 3. Opportunity Import

Classification: Local-first

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Manual import form, source detection, deduplication, keyword  |
|                 | preview, deterministic scoring                                 |
| LLM role        | Optional: structured parsing of pasted job descriptions        |
|                 | (extract seniority, responsibilities, requirements cleanly)    |
| User role       | Manually imports each opportunity. Reviews scout queue.        |
| Forbidden       | Auto-importing without user action. Opaque dedup decisions.   |
| Today           | Solid manual import with dedup and scout queue.               |
| Missing         | LLM-backed description parsing to improve scoring input.      |
| Next change     | LLM job description parsing when AI enabled (Horizon 2).      |

Verdict: well-calibrated for current stage.

---

### 4. Opportunity Scoring

Classification: Local-first (deterministic by design, not a limitation)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Deterministic scoring from profile fields: skills match,      |
|                 | seniority match, narrative fit, ATS coverage, timing,         |
|                 | network access. Score is reproducible and explainable.         |
| LLM role        | Optional: "why this score?" narrative, personalized angle      |
|                 | recommendation based on positioning (Horizon 2)               |
| User role       | Reviews shortlist, acts on suggestions.                       |
| Forbidden       | Claiming scores are precise beyond +/- 15 points.             |
|                 | Auto-shortlisting or auto-ignoring without user confirmation.  |
| Today           | Solid. "Score estime" label added to main surfaces.           |
| Missing         | Score explanation in natural language (LLM, future).          |
| Next change     | Nothing urgent. Ensure "Score estime" is on all score tiles.  |

Verdict: well-calibrated. Deterministic scoring is a feature, not a gap.

---

### 5. CV Targeting

Classification: LLM-first when AI enabled; Local-fallback when not

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | generateLocalTargetedCV: angle + keywords + minimal bullets.  |
|                 | Useful as fallback when no API credits. Not analysis.          |
| LLM role        | Real targeted bullets per experience, ATS optimization,        |
|                 | gap analysis (reframe vs learn), ATS red flags, angle.        |
| User role       | Reviews before saving as draft. Edits bullets directly.        |
|                 | Confirms "brouillon, not envoye" before any application.       |
| Forbidden       | Presenting local draft as equivalent to LLM output.           |
|                 | Auto-saving LLM output. Auto-applying after generation.        |
| Today           | Guarded API route + local fallback. Both paths available.     |
|                 | The UI does not clearly distinguish primary vs fallback path.  |
| Missing         | When AI enabled: LLM CTA is the first and primary button.     |
|                 | Local path becomes "Generer sans IA (fallback)".               |
| Next change     | See Sprint LLM Primacy below.                                  |

Verdict: architecture is correct, UI hierarchy is inverted.

---

### 6. Application Pack

Classification: LLM-first when AI enabled; Local-fallback when not

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | generateLocalApplicationPack: deterministic composition of    |
|                 | LinkedIn message, pitch, whyYou/Company, questions, objections.|
|                 | Structural scaffolding. Not personalized. Not coached.         |
| LLM role        | Real personalized pack: company-specific motivation, pitch     |
|                 | grounded in proof points, tailored question prep.             |
| User role       | Reviews every section. Does not send automatically.           |
| Forbidden       | Presenting local pack as ready-to-send without clear label.   |
|                 | Auto-saving LLM pack without review.                           |
| Today           | Local pack is the visible primary in the UI.                  |
|                 | LLM route is behind a consent gate and visually secondary.     |
| Missing         | When AI enabled: LLM path is primary. Local becomes fallback.  |
| Next change     | See Sprint LLM Primacy below.                                  |

Verdict: same structural issue as CV targeting. Local is not the right primary.

---

### 7. Pipeline

Classification: Manual-confirmation-first (always, regardless of AI status)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Event sourcing, status tracking, J+7/J+21/J+30 suggestions,  |
|                 | timeline display.                                              |
| LLM role        | None. No status changes from LLM. This is intentional.        |
| User role       | Every status change is explicit. Every event is manual.        |
| Forbidden       | Any automatic status mutation. Auto-archiving. Auto-applying. |
|                 | LLM suggesting status changes to the store directly.           |
| Today           | Solid. No automatic mutations anywhere.                        |
| Missing         | Nothing structural.                                            |
| Next change     | None. Do not add LLM to pipeline status logic.                 |

Verdict: well-calibrated. Do not change architecture.

---

### 8. Network

Classification: Manual-confirmation-first (Local draft suggestions only)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Contact tracking, priority signals, local message draft        |
|                 | suggestions (keyword-based, not personalized).                 |
| LLM role        | Personalized first messages, follow-up drafts using context   |
|                 | from opportunity, profile, and prior contact history (future). |
| User role       | Manually copies message drafts. Manually confirms contact.    |
|                 | Manually marks as replied. No auto-send ever.                  |
| Forbidden       | Auto-sending messages. Auto-marking contacts as replied.       |
|                 | Presenting local draft templates as personalized outreach.     |
| Today           | Local draft suggestions clearly labeled as suggestions.        |
|                 | Manual confirmation for all contact actions. Good.             |
| Missing         | LLM-backed message personalization (Horizon 2).               |
| Next change     | Optional LLM message generation when AI enabled.               |

Verdict: well-calibrated.

---

### 9. Interview Coach

Classification: Hybrid -- Local workspace, LLM for quality output

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Builds workspace from profile/pack/opportunity/memory data.   |
|                 | Generates a basic question list and prep scaffolding.          |
|                 | Post-interview capture flow and note-to-memory linking.        |
| LLM role        | Tailored answers grounded in STAR examples, company research,  |
|                 | role-specific coaching, interviewer context.                   |
| User role       | Reviews prep sheet. Manually saves post-interview notes.       |
| Forbidden       | Presenting local answer drafts as coaching quality.            |
|                 | Auto-saving interview prep output.                             |
| Today           | Local workspace is functional but shallow. LLM route exists   |
|                 | behind consent gate. Local is the visual primary.              |
| Missing         | When AI enabled, LLM prep CTA should be primary action.       |
| Next change     | See Sprint LLM Primacy below.                                  |

Verdict: same hierarchy issue as Profile Intelligence and CV targeting.

---

### 10. Memory Learning

Classification: Local-first (LLM semantic layer is Horizon 2)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Keyword-based pattern detection, recurring objections,         |
|                 | positive signals, linkage coverage. Honest limited signals.   |
| LLM role        | Semantic analysis: cross-linking notes, pattern extraction,   |
|                 | natural-language summaries of what works (Horizon 2).          |
| User role       | Manually saves all memory items. Memory is never auto-created.|
| Forbidden       | Claiming keyword-based insights are predictive.               |
|                 | Auto-populating memory from pipeline events.                   |
| Today           | Local keyword-based. Labels say "Analyse locale limitee".     |
| Missing         | LLM semantic layer. Historical learning across campaigns.      |
| Next change     | None urgent. Clearly one-liner labels at section level only.  |

Verdict: calibrated, but "Analyse locale limitee" should appear once at section level, not
repeated on every insight card.

---

### 11. Progression Dashboard

Classification: Local-first (always)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Pipeline funnel, conversion rates, weekly activity, memory    |
|                 | coverage, response/interview rates.                            |
| LLM role        | Optional: weekly summary in natural language (Horizon 3).     |
| User role       | Reviews metrics to inform decisions.                           |
| Forbidden       | Predictive claims based on insufficient data (fewer than 5    |
|                 | applications). Fabricated trend lines.                         |
| Today           | Local metrics functional. "Lecture locale limitee" label.     |
| Missing         | Historical snapshots (requires durable persistence).          |
| Next change     | Nothing until Sprint 29 (Persistence).                        |

Verdict: well-calibrated.

---

### 12. Daily Job Scout

Classification: Local-first (automation is Horizon 3)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | Manual import, dedup detection, keyword preview, scout queue. |
| LLM role        | Job description parsing: extract structured requirements,     |
|                 | responsibilities, seniority, and keywords from pasted text    |
|                 | (Horizon 2 -- improves scoring input quality).                |
| User role       | Reviews scout queue. Shortlists or ignores each opportunity.  |
| Forbidden       | Auto-scraping without explicit user action. Auto-shortlisting.|
| Today           | Manual import only. No daily scan.                            |
| Missing         | LLM-backed description parsing; daily automation.             |
| Next change     | LLM description parsing when AI enabled (high value, low      |
|                 | risk -- does not require scraping infrastructure).             |

Verdict: current state is honest. Automation requires policy review before implementation.

---

### 13. Privacy and Settings

Classification: Local-first (always, by design)

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | All data in localStorage. Consent gates all API calls.        |
|                 | Export, reset, data boundary documentation.                    |
| LLM role        | None. Consent blocks LLM calls from UI.                       |
| User role       | Controls every API call. Triggers export/reset explicitly.    |
| Forbidden       | Silent API calls. Server-side storage without consent.         |
| Today           | Solid: ConsentDialog, privacy-boundaries.ts.                  |
| Missing         | Per-provider data boundary UI. Clear export format.           |
| Next change     | Nothing until durable persistence is decided.                  |

Verdict: well-calibrated.

---

### 14. Persistence

Classification: Local-first currently; Hybrid target

| Dimension       | Current State                                                  |
|-----------------|----------------------------------------------------------------|
| Local role      | localStorage via Zustand persist. Key: careerstudio-store.    |
|                 | Version 2. No migrations beyond version bumps.                 |
| LLM role        | None.                                                          |
| User role       | Explicit export/reset controls.                               |
| Forbidden       | Changing persist version without migration. Silent data loss.  |
| Today           | localStorage only. Device-bound. Fragile on browser clear.    |
| Missing         | Durable persistence (SQLite local or Supabase/Postgres).      |
| Next change     | Sprint 29 decision: define storage target before Horizon 3.   |

Verdict: known gap. Required before beta.

---

## Diagnosis: Where Local Is Still Oversold

The following surfaces present local heuristics as primary qualitative output when they
should be clearly framed as scaffolding or fallback:

1. Profile Intelligence section on /profil
   The seniority, role families, pitch, and objections derived locally look authoritative.
   A user who has not enabled AI will read these as their actual positioning analysis.
   Adding "locale limitee" labels does not fix this: the hierarchy must change.
   The LLM CTA must be visible above the local view when AI is enabled.

2. Application pack local generation
   The local pack UI uses the same card format as an LLM-generated pack. Nothing in the
   visual hierarchy tells the user that "Bonjour, votre profil Operations m'interesse" was
   produced by string concatenation, not personalized reasoning.

3. Interview Coach local workspace
   The answer drafts say "Brouillon local" but look like coaching. A user in interview
   preparation mode may trust these answers more than they should.

4. Memory insights repeated disclaimer pattern
   "Analyse locale limitee" appears on section header AND on every insight card. Repetition
   does not add clarity. It adds anxiety. One label per section is enough.

5. Dashboard "Signaux rapides" section
   The InsightCards look like AI-derived observations ("vos meilleurs resultats"). They are
   keyword counts. The "Analyse locale limitee" label is correct but the card format implies
   more semantic depth than exists.

---

## Where LLM Must Become Primary Path When AI Is Enabled

Four modules require a UI hierarchy inversion when AI is enabled:

1. Profile Intelligence: LLM analysis is the expected output; local derivation is scaffolding.
2. CV targeting: LLM-targeted bullets are the expected output; local draft is fallback.
3. Application pack: LLM-personalized pack is the expected output; local pack is fallback.
4. Interview Coach: LLM prep is the expected coaching; local workspace is scaffolding.

The current pattern is: local output shown first, LLM button tucked below.
The correct pattern: when AI enabled, LLM CTA is the primary visible action; local output
is labeled "sans IA" or "en attente d'analyse IA" and shown as a placeholder state.

---

## Where Local Must Remain Master Even With AI Enabled

These modules must never delegate to LLM for status changes or confirmed actions:

1. Pipeline status: applied, contacted, followed up, ghosted, rejected -- always manual.
2. Memory creation: no auto-created memory items from pipeline events or LLM output.
3. Network confirmation: no auto-marking contacts as contacted or replied.
4. CV parsing review: user always validates extracted fields before the profile is saved.
5. Persistence: LLM does not write to the store directly. Store writes are explicit.
6. Privacy and settings: consent is always required before any API call.

---

## UX Rules: When to Show What

### Rule 1: One disclaimer per section, not per widget

Wrong: "Analyse locale limitee" header + "Analyse locale limitee" on each of 5 insight cards.
Right: "Analyse locale limitee" once at section level. Cards show content only.

### Rule 2: Disclaimers are contextual, not permanent

Show "Analyse locale limitee" when:
- AI is disabled and the section would meaningfully improve with LLM.
- The output was produced by heuristics (not user-confirmed data).

Do not show "Analyse locale limitee" when:
- The section is a system of record (pipeline, network contacts, memory items).
- The output was validated by the user.
- The section is deterministic by design (scores, dates, counts).

### Rule 3: LLM outputs use positive framing, not warnings

Wrong: "Ce contenu a ete genere par IA -- verifier avant usage."
Right: "Genere avec IA -- A relire avant envoi."

The distinction is tone. Both communicate the same constraint. One implies distrust.

### Rule 4: "A valider" appears once, then disappears

Show "A valider" on LLM-generated output before the user confirms it.
Remove "A valider" after the user saves the output. The output becomes theirs.
Do not repeat "A valider" on every section of a saved pack or validated profile.

### Rule 5: When AI is enabled, remove fallback disclaimers from the LLM path

If the user has enabled AI and generated a CV with LLM, do not show:
"Brouillon local non-IA. Estimation limitee."
That label applies to the local fallback only.

### Rule 6: The "anxious product" trap to avoid

The product becomes anxious when every surface has a disclaimer and no surface feels
confident. The solution is not to remove disclaimers -- it is to scope them precisely.
A surface that is clearly a system of record (pipeline events, contact history) needs no
disclaimer. A surface that is heuristic-derived needs exactly one label, at section level.
A surface generated by LLM after user consent needs "Genere avec IA" and nothing more.

Summary of labels by source:
- User-confirmed data: no label needed.
- Deterministic calculation: "Score estime" once, not on every number.
- Local heuristic output: "Analyse locale limitee" once at section level.
- LLM output, not yet saved: "Genere avec IA -- A valider".
- LLM output, saved by user: "Genere avec IA" (no "A valider").
- Local fallback when AI is available: "Brouillon local -- Lance l'IA pour une version ciblee."

---

## Corrected Roadmap: Three Horizons

### Horizon 1 -- Usable Without API, But Honest (Now)

Goal: the product works without API credits and does not mislead the user about what is local
vs qualitative intelligence.

H1.1 -- UX Hierarchy Patch (not done yet):
Restructure /profil, /opportunites CV targeting, /opportunites application pack, and
/entretiens so that:
- When AI is disabled: local output is shown with one disclaimer per section, and a clear
  "Activer l'IA pour une analyse qualitative" nudge.
- When AI is enabled but LLM has not been run: a prominent CTA replaces the local output
  header ("Generer l'analyse IA" is the first visible action).
- When LLM has run: LLM output replaces local scaffolding. Local output is hidden or
  collapsed behind a "Voir le brouillon local" toggle.
This is a UI hierarchy change, not a label change.

H1.2 -- Disclaimer scope reduction:
Remove repeated disclaimers within sections. Apply the "one label per section" rule to
memory insights, progression signals, and profile intelligence.

H1.3 -- Profile completeness and source badge:
Done (Sprint Profile/CV Import Overhaul, 2026-05-05).

H1.4 -- Honest local fallback labels in application pack:
The local pack should explicitly say "Brouillon local non personnalise -- Lance l'IA"
as a one-line header, not a floating disclaimer on each tab.

### Horizon 2 -- LLM on Key Modules (Requires API Credits)

Goal: when AI is enabled, LLM is the primary path for intelligence modules.

H2.1 -- Profile Intelligence: LLM becomes default primary path.
When AI enabled: /profil shows "Analyser avec IA" as the first visible action.
Local derived view is "Apercu local (heuristiques, non calibre)".
LLM result replaces local view after user saves.

H2.2 -- CV targeting: LLM is primary, local is labeled fallback.
"Generer un CV cible avec IA" is the primary button.
"Generer sans IA (brouillon local)" is the secondary option.
Local output shows "Brouillon local -- non personnalise" at section header.

H2.3 -- Application pack: LLM is primary, local is labeled fallback.
Same pattern as CV targeting.

H2.4 -- Interview prep: LLM is primary.
"Generer ma preparation IA" is the first action on /entretiens.
Local workspace becomes the "Scaffolding en attente de la preparation IA".

H2.5 -- Job description parsing via LLM.
When user pastes a job description and AI is enabled, offer "Extraire la structure avec IA"
to improve requirements/responsibilities/keywords/seniority detection.
This improves scoring input quality without requiring scraping.

H2.6 -- Memory: LLM semantic layer.
When AI is enabled, allow "Analyser mes notes avec IA" to extract patterns from saved
memory items. Output is a reviewable summary, not auto-saved insights.

### Horizon 3 -- Persistence, Daily Scout, Beta

H3.1 -- Durable persistence: Sprint 29 decision (SQLite local or Supabase).
No Horizon 3 features can ship without this.

H3.2 -- Daily Job Scout automation:
RSS or controlled source connectors, after policy review.
Requires persistence to track seen/ignored opportunities across sessions.

H3.3 -- Authentication: only after persistence is decided.

H3.4 -- Beta launch: after H3.1-H3.3 and QA hardening.

---

## The Real Next Sprint

### Sprint LLM Primacy

This is the sprint that truly materializes the doctrine instead of displaying it.

Objective: restructure the UI hierarchy so that when AI is enabled, LLM generation is the
visible primary action, and local output is clearly the fallback or scaffolding state.

Scope (UI and routing only, no scoring/store/API changes):

Target 1 -- /profil Profile Intelligence section:
- When AI disabled: local view with one "Analyse locale limitee" label + CTA to enable AI.
- When AI enabled but LLM not run: prominent "Analyser avec IA" button replaces section header.
  Local view shown below as "Apercu local (non calibre)".
- When LLM run: LLM result is primary. Local view hidden or collapsible.

Target 2 -- /opportunites CV targeting:
- When AI disabled: "Generer un brouillon local" (primary), no LLM option shown.
- When AI enabled: "Generer avec IA" (primary, blue), "Brouillon sans IA" (secondary, ghost).

Target 3 -- /opportunites Application pack tab:
- Same pattern as CV targeting.

Target 4 -- /entretiens Interview prep:
- When AI enabled: "Generer ma prep IA" is the first visible CTA. Local scaffolding is below.

Constraints:
- Do not change any store action.
- Do not change any API route.
- Do not change any scoring logic.
- Do not add new LLM routes.
- Do not rename or restructure components beyond the targeted sections.
- Do not add new disclaimers. This sprint removes unnecessary ones and repositions primary CTAs.

Business tests:
- No new business tests required (UI-only changes).
- All 96/96 existing tests must still pass.

This sprint is the difference between "doctrine documented" and "doctrine implemented".

---

## What This Sprint Is Not

- Not a label/cosmetic sprint (Sprint Doctrine IA/Local, 2026-05-05, was that).
- Not a new LLM route sprint (routes already exist for all four modules).
- Not a store change sprint.
- Not a persistence sprint.

It is a product decision made visible in the UI hierarchy.

---

## Relation to Sprint 29 (Durable Persistence)

Sprint LLM Primacy should run before Sprint 29 because:
- LLM Primacy uses existing routes and stores -- no backend dependency.
- Sprint 29 requires a product/technical decision (SQLite vs Supabase) that may take
  longer to finalize.
- Completing LLM Primacy gives real users a genuinely useful product to test with real API
  keys before persistence is solved.

Recommended sequence: Sprint LLM Primacy -> Sprint 29 Durable Persistence -> H3.
