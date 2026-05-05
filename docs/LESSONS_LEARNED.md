# Lessons Learned

This file is read by all agents (Claude Code, Codex, others) at startup.
It documents mistakes, overinvestments, and recurring patterns observed during development.
It is not a blame log. It is a calibration tool.

Every agent must read this before coding.
Every agent may add to this when a new pattern is observed.
This file must remain ASCII-only.

---

## L1 -- Do not over-invest in transitional components

**Observed:** Sprint 10.6 spent ~70% of a full context session rewriting the regex CV parser
(stripMarkdown, French month detection, section-aware scanning, bullet attachment).
The parser will be replaced or bypassed as soon as LLM extraction (Sprint 11) and PDF import exist.
The fix was technically correct but the ROI was poor relative to its shelf life.

**Rule:** If a component is listed in "Mocked / Stubbed / Not Real Yet" or "will be replaced by X",
apply the minimum patch to unblock the demo loop. Do not refactor, harden, or extend it.
Save the session budget for the sprint that replaces it.

**How to detect:** Before starting a robustness sprint, ask: "Is this component on the replacement
roadmap?" If yes, patch only. If no, invest fully.

---

## L2 -- Session context is a product resource, not a free commodity

**Observed:** Multiple sessions were consumed on: rebuilding context from HANDOFF.md, re-reading
large files, iterating on intermediate states. The project has no git history (not a git repo),
so every session starts cold and rebuilds understanding from documentation alone.

**Rule:** Treat session context like a sprint budget. Plan what the session must produce before
starting. If a task requires more than one pass of context rebuild, split it into smaller sessions
with a clear stopping point and updated HANDOFF.md before stopping.

**How to detect:** If a session is more than 50% spent on context reading and iteration with no
user-visible change, the task was too large or the stopping point was wrong.

---

## L3 -- Mocked components create false confidence in prototype maturity

**Observed:** The app has a Copilot tab, a "Generate CV" button, pack cards, and memory insights --
all of which are hardcoded strings or static content. The UI looks complete. It is not.
This gap between visual completeness and functional completeness creates misaligned expectations
during demos and sprint planning.

**Rule:** Every mocked component must have a visible "demo only" marker in the UI (a small badge,
grayed state, or disabled button with a tooltip). Do not style a mock to look like a real feature.
A clearly incomplete skeleton is more honest than a polished simulation.

**How to apply:** When building a stub, add a `data-demo="true"` attribute or a "(demo)" suffix
to the button label. Remove it only when the feature is real.

---

## L4 -- The test suite is the highest-ROI asset in this project

**Observed:** The business rule test suite (scripts/business-rules-check.cjs) is the only artifact
that: (a) runs without a browser, (b) catches regressions immediately, (c) documents intent in
executable form, (d) works for both Claude Code and Codex.

**Rule:** Every sprint must add at least one business rule test for any new logic. Tests are not
optional cleanup. They are the primary documentation layer for agents that start cold.

**How to apply:** Write the test first if possible. If a sprint ends without a test, it is not done.

---

## L5 -- LLM integration should have been introduced earlier as an optional layer

**Observed:** Sprints 1 through 10 built a complete local simulation of what an LLM would do:
regex scoring, regex parsing, hardcoded Copilot responses, static recommendations.
This was defensible for local-first prototyping, but the "controlled LLM" integration (Sprint 11)
was deferred so long that the local layer became load-bearing infrastructure.

**Rule:** Add the optional LLM path at the first sprint where it adds visible user value.
It does not need to replace the local layer -- it can run alongside it.
Deferring LLM integration past the point where the local simulation becomes complex is a mistake.

**How to apply:** As of Sprint 11, every new extraction or generation feature must go through the
API route first, with the local regex/scoring as fallback, not the other way around.

---

## L6 -- HANDOFF.md is doing the work that git history would normally do

**Observed:** Because the repo has no git history, HANDOFF.md has grown to over 200 lines and is
updated after every sprint. Agents spend significant context budget reading it at startup.
The file conflates current state, architectural decisions, known issues, and sprint history.

**Rule:** HANDOFF.md should describe current state only. Historical decisions belong in CHANGELOG.md.
Architectural facts that do not change belong in PROJECT_BRIEF.md. Keep HANDOFF.md under 150 lines.

**Corollary:** Initialize a git repository. Even without a remote, local git history reduces the
documentation burden significantly and makes agent handoffs more reliable.

---

## L7 -- Multi-agent collaboration (Claude + Codex) requires explicit task boundaries

**Observed:** AGENTS.md describes a multi-agent collaboration model but the project has been
built almost entirely by Claude Code in serial sessions. When Codex does take over, it has no
signal about what Claude was doing mid-session, and HANDOFF.md is the only continuity mechanism.

**Rule:** Before handing a task from Claude to Codex (or vice versa), the handing agent must:
(1) run all quality gates, (2) commit the state of TASKS.md with the exact next task described
in one sentence, (3) note any file that must not be touched.
Do not hand off mid-sprint. Only hand off at sprint boundaries.

**How to detect:** If TASKS.md says "In Progress: X" and the session ends, the next agent will
start X from scratch and may duplicate or conflict with partial work. Always close the sprint
before stopping.

---

## L8 -- Patch vs rewrite decision must be made explicitly before touching a file

**Observed:** The onboarding page (Sprint 10) was correctly identified as "theatrical simulation"
and fully replaced. The CV parser (Sprint 10.6) was a partial rewrite of a transitional component.
The distinction between "rewrite" and "patch" was not made explicit before starting.

**Rule:** Before touching any file, state one of: PATCH (minimal change, preserve structure) or
REWRITE (full replacement, justified by fundamental wrongness). Rewrite requires user confirmation.
Patch does not. Default is always PATCH unless the existing code is fundamentally wrong.

---

## L9 -- Do not oversell local heuristics as intelligence

**Observed:** The app built useful local parsers, keyword matchers, packs, STAR examples, memory
signals, and learning summaries. They unblock the no-API workflow, but their UI sometimes made
them look like the main intelligence layer.

**Rule:** Local outputs must be labeled as local, limited, estimated, inferred, or draft/fallback
outputs. LLM outputs can be labeled as AI-generated, but they still require review. The user's
validated data is the only source that can become record truth.

**How to apply / detect:** If a feature uses regex, keyword matching, deterministic templates, or
local heuristics, use labels such as "Analyse locale limitee", "Brouillon local", "Estimation
locale", "Deduit localement", or "A relire". Do not use confident wording such as "intelligence",
"ready", "final", or "personalized" unless the source and review state are explicit.

---

## Format for new entries

```
## LN -- Short title

**Observed:** What happened. Be specific. Include sprint name if relevant.

**Rule:** What to do differently. Actionable, not abstract.

**How to apply / detect:** Concrete signal that triggers this rule.
```
