# AGENTS.md

## Purpose

This file defines general collaboration rules for AI coding agents working on this repository.

It is intended for Claude Code, Codex, and any future coding agent.

The goal is to allow multiple agents to work on the same project without losing context, duplicating work, changing architecture unnecessarily, or breaking existing behavior.

## Core Collaboration Principles

1. Do not assume full conversational context.
2. Inspect the repository before making changes.
3. Understand the current architecture before modifying it.
4. Do not duplicate components, services, types, stores, routes, or utilities if existing ones can be reused.
5. Do not introduce new dependencies without clear justification.
6. Do not rewrite large parts of the project unless explicitly asked.
7. Prefer small, reviewable changes.
8. Keep user-facing behavior stable unless the task requires changing it.
9. Preserve existing naming, styling, architecture, and conventions.
10. When uncertain, document the uncertainty before acting.

## Agent Roles

Claude Code and Codex may alternate on the same project.

Suggested default roles:
- Primary builder: implements planned features and sprints.
- Reviewer/debugger: audits, fixes bugs, improves structure, and checks quality.
- Product/UX reviewer: evaluates whether the implementation matches the product intent.

Agents should not compete or reinvent each other's work.
They should build on top of the existing repo and documented decisions.

## Before Making Changes

Before coding, every agent must:
1. Read AGENTS.md.
2. Read docs/LESSONS_LEARNED.md -- mandatory, contains calibration rules from past mistakes.
3. Read docs/PROJECT_BRIEF.md if present.
4. Read docs/HANDOFF.md if present.
5. Read docs/TASKS.md if present.
6. Inspect the relevant files.
7. Summarize the intended change if the task is non-trivial.

## Agent Startup Protocol

At the start of any non-trivial task, the agent should explicitly state:

1. The current project state it is resuming from.
2. The specific task or slice it will work on.
3. The files or areas it expects to touch.
4. The files or areas it will avoid touching.
5. Any uncertainty, blocker, or verification needed before editing.

Recommended format:

```text
I am resuming from: [current state from docs/HANDOFF.md].
I will work on: [small task].
I expect to touch: [files/areas].
I will not touch: [files/areas out of scope].
First verification: [check or file read].
```

This is meant to prevent agents from silently continuing the wrong task, repeating completed work, or overwriting another agent's changes.

## Documentation Files

Use these files:

- AGENTS.md:
  General multi-agent collaboration rules.
  Should be reusable across projects.

- docs/PROJECT_BRIEF.md:
  Project-specific context, product goals, UX principles, technical stack, constraints.

- docs/HANDOFF.md:
  Current state of the project, recent changes, important files, known issues, next recommended action.

- docs/TASKS.md:
  Active sprint, done, in progress, next, blocked, later.

## Roadmap Authority

docs/TASKS.md is the single source of truth for current sprint work.

Agents must:
1. Read docs/TASKS.md before starting.
2. Work only on items listed in Active Sprint, In Progress, or Next unless the user explicitly redirects.
3. Move a task to In Progress before starting meaningful work.
4. Move a task to Done only after implementation and verification.
5. If priorities change, update docs/TASKS.md before coding.
6. Never assume a task is done because it was discussed in chat; verify the repository.

The conversation can explain intent, but docs/TASKS.md defines the current roadmap.

## Encoding Policy

Coordination docs must be ASCII-only unless the user explicitly requests otherwise:

- AGENTS.md
- docs/PROJECT_BRIEF.md
- docs/HANDOFF.md
- docs/TASKS.md

Avoid accents, emoji, smart quotes, em dashes, ellipses, non-breaking spaces, and special punctuation in coordination docs.

Application source files should be UTF-8 without BOM.

If an agent touches user-facing French strings, it must verify that the file displays correctly and does not introduce mojibake.

Before finishing any documentation update, run or mentally apply this check:

```powershell
rg -n "[^\x00-\x7F]" AGENTS.md docs
```

If the command returns any match in coordination docs, normalize the text to ASCII before stopping.

## Autonomous Handoff Policy

Agents must proactively decide when to update docs/HANDOFF.md.

Do not wait for the user to request a handoff if the project state has materially changed.

Update docs/HANDOFF.md automatically when:

1. A sprint is completed.
2. A meaningful sub-task is completed.
3. More than 5 files have been modified.
4. A core file is modified, such as:
   - global store
   - shared types
   - routing
   - layout
   - configuration
   - API layer
   - database schema
   - service layer
   - authentication
   - state management
   - design system
5. Before starting a risky refactor.
6. After completing a risky refactor.
7. A task is left partially complete.
8. A major technical or product decision is made.
9. The next step is not obvious.
10. Another agent might reasonably need to continue the work.

Simple rule:
If another agent would be confused by taking over now, update the handoff.

## Required Handoff Format

docs/HANDOFF.md must include:

1. Current state summary.
2. Current continuation point.
3. What was built or changed.
4. Files created or modified.
5. Important architectural decisions.
6. Available routes/screens/features.
7. Important state, stores, services, APIs, or data models.
8. What is working.
9. What is mocked, stubbed, incomplete, or fragile.
10. Known bugs or risks.
11. Remaining tasks.
12. Recommended next action.
13. What not to break.
14. Commands to run, build, test, or lint.
15. Open questions.

## Task Tracking

docs/TASKS.md must include:

- Active Sprint
- Done
- In Progress
- Next
- Blocked
- Later

Agents should update docs/TASKS.md when:
1. a task is completed;
2. a task is started;
3. a task is deferred;
4. a blocker is discovered;
5. priorities change.

## Change Discipline

For every non-trivial change, agents should be able to explain:

1. Why the change is needed.
2. Which files are affected.
3. Whether the change is reversible.
4. Whether it impacts architecture.
5. Whether it introduces new dependencies.
6. Whether it changes user-facing behavior.

## Quality Checklist

Before finishing a task, run relevant checks when available:

- install/build check;
- typecheck;
- lint;
- unit tests;
- app launch;
- visual sanity check;
- no obvious console errors.

If checks cannot be run, state why.

## Handoff Before Stopping

Before ending a large task or if the work may be picked up by another agent:
1. Update docs/HANDOFF.md.
2. Update docs/TASKS.md.
3. Mention any incomplete work.
4. Mention the safest next step.

## Project-Specific Rules

Project-specific rules must not be hardcoded into AGENTS.md unless they are generally useful.

Put project-specific information in docs/PROJECT_BRIEF.md instead.

Examples of project-specific information:
- product vision;
- target user;
- UX tone;
- stack;
- current sprint;
- routes;
- domain-specific rules;
- data models;
- business logic;
- deployment notes.
