/* eslint-disable @typescript-eslint/no-require-imports */

const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const Module = require("node:module")
const ts = require("typescript")

const rootDir = path.resolve(__dirname, "..")
const srcDir = path.join(rootDir, "src")

const storage = new Map()
const localStorageMock = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => {
    storage.set(key, String(value))
  },
  removeItem: (key) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  },
  key: (index) => Array.from(storage.keys())[index] ?? null,
  get length() {
    return storage.size
  },
}

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
})
Object.defineProperty(globalThis, "window", {
  value: { localStorage: localStorageMock },
  configurable: true,
})

const originalResolveFilename = Module._resolveFilename

function resolveAlias(request) {
  if (!request.startsWith("@/")) return null

  const basePath = path.join(srcDir, request.slice(2))
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  const aliasPath = resolveAlias(request)
  if (aliasPath) return aliasPath
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

function registerTypeScriptExtension(extension) {
  require.extensions[extension] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8")
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        isolatedModules: true,
      },
      fileName: filename,
    })

    module._compile(output.outputText, filename)
  }
}

registerTypeScriptExtension(".ts")
registerTypeScriptExtension(".tsx")

const { useAppStore } = require("../src/stores/app-store.ts")
const { computeDailyActions } = require("../src/lib/daily-actions.ts")
const { getPipelineSuggestion } = require("../src/lib/pipeline-rules.ts")
const { createOpportunitySnapshot } = require("../src/lib/opportunity-snapshot.ts")
const { parseCVToProfile, parseCV } = require("../src/lib/cv-parser.ts")
const { POST: postCVTarget } = require("../src/app/api/cv-target/route.ts")
const { POST: postProfileIntelligence } = require("../src/app/api/profile-intelligence/route.ts")
const { POST: postApplicationPack } = require("../src/app/api/application-pack/route.ts")
const { POST: postInterviewPrep } = require("../src/app/api/interview-prep/route.ts")
const { generateLocalTargetedCV } = require("../src/lib/local-cv-targeting.ts")
const { createProfileIntelligence, calibrateProfileIntelligence } = require("../src/lib/profile-intelligence.ts")
const { detectDuplicate, previewJobKeywords, getScoutQueue } = require("../src/lib/job-scout.ts")
const {
  scoreOpportunityAccess,
  scoreOpportunityTiming,
} = require("../src/lib/local-scoring.ts")
const { generateLocalApplicationPack } = require("../src/lib/local-pack.ts")
const { evaluateApplicationPackQuality } = require("../src/lib/application-pack-quality.ts")
const { buildInterviewHandoff, isInterviewStatus } = require("../src/lib/interview-handoff.ts")
const { buildInterviewWorkspace, buildPostInterviewLearning } = require("../src/lib/interview-coach.ts")
const {
  buildNetworkDraftSuggestion,
  getNetworkSignal,
  sortContactsByNetworkPriority,
} = require("../src/lib/network-layer.ts")
const { buildMemoryIntelligence } = require("../src/lib/memory-intelligence.ts")
const { buildLearningDashboard } = require("../src/lib/learning-dashboard.ts")
const { getDataBoundary } = require("../src/lib/privacy-boundaries.ts")

function isoDaysAgo(days) {
  const now = new Date("2026-04-28T12:00:00.000Z")
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function makeApplication(id, status, daysAgo) {
  return {
    id,
    jobOfferId: `job-${id}`,
    status,
    appliedAt: isoDaysAgo(daysAgo),
    cvVersionId: null,
    contactId: null,
    notes: "",
    feedback: "",
    nextAction: "",
    nextActionDate: null,
    lastUserActionAt: isoDaysAgo(daysAgo),
  }
}

function makeEvent(applicationId, type, daysAgo, source = "manual", statusAfter = null) {
  return {
    id: `event-${applicationId}-${type}-${daysAgo}`,
    applicationId,
    type,
    statusAfter,
    createdAt: isoDaysAgo(daysAgo),
    label: type,
    note: "",
    source,
  }
}

function makeOpportunity(id, score = 80) {
  return {
    id,
    title: `Role ${id}`,
    company: `Company ${id}`,
    location: "Paris",
    remoteType: "hybrid",
    source: "LinkedIn",
    description: "",
    responsibilities: [],
    requirements: [],
    keywords: [],
    seniority: "Manager",
    postedAt: isoDaysAgo(1),
    foundAt: isoDaysAgo(1),
    status: "new",
    score: {
      globalFit: score,
      confidence: 80,
      skills: 80,
      seniority: 80,
      narrative: 80,
      ats: 80,
      motivation: 80,
      access: 80,
      timing: 80,
      effort: 30,
      interviewProbability: 70,
      verdict: "apply_now",
      reasonsFor: [],
      reasonsAgainst: [],
      redFlags: [],
      recommendedAngle: "Angle",
      recommendedActions: [],
    },
  }
}

const tests = []

function test(name, fn) {
  tests.push({ name, fn })
}

test("confirmOpportunityApplied creates/updates application and manual applied event", () => {
  useAppStore.getState().resetDemoData()
  useAppStore.getState().confirmOpportunityApplied("job-3")

  const state = useAppStore.getState()
  const application = state.applications.find((item) => item.jobOfferId === "job-3")
  const opportunity = state.opportunities.find((item) => item.id === "job-3")
  const event = state.applicationEvents.find(
    (item) => item.applicationId === "app-job-3" && item.type === "applied"
  )

  assert.equal(opportunity.status, "applied")
  assert.equal(application.status, "applied")
  assert.equal(application.appliedAt !== null, true)
  assert.equal(event.source, "manual")
  assert.equal(event.statusAfter, "applied")
})

test("prepared events never mark an application as applied", () => {
  useAppStore.getState().resetDemoData()
  const preparedEvents = useAppStore
    .getState()
    .applicationEvents.filter((event) => event.source === "prepared")

  assert.equal(preparedEvents.length > 0, true)
  for (const event of preparedEvents) {
    assert.equal(event.statusAfter, null)
    assert.notEqual(event.type, "applied")
  }
})

test("confirmContacted changes contact and linked application only after manual confirmation", () => {
  useAppStore.getState().resetDemoData()

  const initialApp = useAppStore.getState().applications.find((item) => item.id === "app-1")
  assert.equal(initialApp.status, "waiting")

  useAppStore.getState().addNetworkContact({
    name: "Test Contact",
    company: "Swile",
    role: "Ops Lead",
    linkedInUrl: null,
    status: "message_prepared",
    linkedJobOfferId: "job-applied-1",
    linkedApplicationId: "app-1",
    messageDraft: "Bonjour",
    lastContactedAt: null,
    nextFollowUpAt: null,
    notes: "",
  })

  const preparedContact = useAppStore
    .getState()
    .networkContacts.find((contact) => contact.name === "Test Contact")
  const stillWaitingApp = useAppStore.getState().applications.find((item) => item.id === "app-1")

  assert.equal(preparedContact.status, "message_prepared")
  assert.equal(stillWaitingApp.status, "waiting")

  useAppStore.getState().confirmContacted(preparedContact.id)

  const contacted = useAppStore
    .getState()
    .networkContacts.find((contact) => contact.id === preparedContact.id)
  const updatedApp = useAppStore.getState().applications.find((item) => item.id === "app-1")
  const event = useAppStore
    .getState()
    .applicationEvents.find((item) => item.applicationId === "app-1" && item.type === "contacted")

  assert.equal(contacted.status, "contacted")
  assert.equal(updatedApp.status, "contacted")
  assert.equal(event.source, "manual")
  assert.equal(event.statusAfter, "contacted")
})

test("computeDailyActions keeps priority order", () => {
  const now = new Date("2026-04-28T12:00:00.000Z")
  const applications = [
    makeApplication("interview", "recruiter_interview", 2),
    makeApplication("critical", "applied", 31),
    makeApplication("warning", "applied", 22),
    makeApplication("info", "applied", 8),
  ]
  const events = [
    makeEvent("critical", "applied", 31, "manual", "applied"),
    makeEvent("warning", "applied", 22, "manual", "applied"),
    makeEvent("info", "applied", 8, "manual", "applied"),
  ]
  const contacts = [
    {
      id: "contact-ready",
      name: "Camille",
      company: "Pennylane",
      role: "Ops",
      linkedInUrl: null,
      status: "message_prepared",
      linkedJobOfferId: null,
      linkedApplicationId: null,
      messageDraft: "",
      lastContactedAt: null,
      nextFollowUpAt: null,
      notes: "",
    },
  ]
  const opportunities = [makeOpportunity("apply", 90)]
  const pipelineJobs = {
    "job-interview": { company: "InterviewCo", title: "Interview Role" },
    "job-critical": { company: "CriticalCo", title: "Critical Role" },
    "job-warning": { company: "WarningCo", title: "Warning Role" },
    "job-info": { company: "InfoCo", title: "Info Role" },
  }

  const actions = computeDailyActions(applications, events, contacts, opportunities, pipelineJobs, now)
  const prefixes = actions.map((action) => action.id.split("-").slice(0, 2).join("-"))

  assert.equal(prefixes[0], "interview-prep")
  assert.equal(prefixes[1], "ghosting-critical")
  assert.equal(prefixes[2], "follow-up")
  assert.equal(prefixes[3], "network-send")
  assert.equal(prefixes[4], "apply-apply")
  assert.equal(prefixes[5], "follow-up")
})

test("J+7/J+21/J+30 suggestions do not mutate application status", () => {
  const now = new Date("2026-04-28T12:00:00.000Z")
  const app7 = makeApplication("j7", "applied", 7)
  const app21 = makeApplication("j21", "applied", 21)
  const app30 = makeApplication("j30", "applied", 30)

  const s7 = getPipelineSuggestion(app7, [], now)
  const s21 = getPipelineSuggestion(app21, [], now)
  const s30 = getPipelineSuggestion(app30, [], now)

  assert.equal(s7.level, "info")
  assert.equal(s7.suggestedStatus, "follow_up_needed")
  assert.equal(app7.status, "applied")

  assert.equal(s21.level, "warning")
  assert.equal(s21.suggestedStatus, "follow_up_needed")
  assert.equal(app21.status, "applied")

  assert.equal(s30.level, "critical")
  assert.equal(s30.suggestedStatus, "probably_ghosted")
  assert.equal(app30.status, "applied")
})

test("manual opportunity import scores locally without creating an application", () => {
  useAppStore.getState().resetDemoData()
  const initialApplications = useAppStore.getState().applications.length
  const initialEvents = useAppStore.getState().applicationEvents.length

  const created = useAppStore.getState().addManualOpportunity({
    title: "Strategy & Operations Manager",
    company: "Local Test Co",
    location: "Paris",
    remoteType: "hybrid",
    source: "Import manuel",
    url: "https://example.test/job",
    description:
      "We are hiring a Strategy & Operations Manager to lead cross-functional programs, build KPIs, improve reporting, coordinate OKRs, work with the COO, and structure process design for a SaaS B2B scale-up.",
  })

  const state = useAppStore.getState()
  const imported = state.opportunities.find((item) => item.id === created.id)

  assert.equal(Boolean(imported), true)
  assert.equal(state.opportunities[0].id, created.id)
  assert.equal(state.selectedOpportunityId, created.id)
  assert.equal(state.appMode, "real")
  assert.equal(imported.status, "new")
  assert.equal(imported.score.globalFit >= 55, true)
  assert.equal(imported.score.recommendedActions.includes("Ne cliquer sur 'J'ai postule' qu'apres envoi manuel reel."), true)
  assert.equal(state.applications.length, initialApplications)
  assert.equal(state.applicationEvents.length, initialEvents)
})

test("local opportunity access score is derived from network contacts", () => {
  const input = {
    title: "Strategy & Operations Manager",
    company: "Pennylane",
    location: "Paris",
    remoteType: "hybrid",
    source: "Import manuel",
    description: "Strategy operations role.",
  }

  assert.equal(scoreOpportunityAccess(input), 30)
  assert.equal(
    scoreOpportunityAccess(input, {
      networkContacts: [
        {
          id: "contact-access-1",
          name: "Camille",
          company: "Pennylane",
          role: "Ops",
          linkedInUrl: null,
          status: "message_prepared",
          linkedJobOfferId: null,
          linkedApplicationId: null,
          messageDraft: "",
          lastContactedAt: null,
          nextFollowUpAt: null,
          notes: "",
        },
      ],
    }),
    65
  )
  assert.equal(
    scoreOpportunityAccess(input, {
      networkContacts: [
        {
          id: "contact-access-2",
          name: "Sarah",
          company: "OtherCo",
          role: "Ops",
          linkedInUrl: null,
          status: "replied",
          linkedJobOfferId: "job-access",
          linkedApplicationId: null,
          messageDraft: "",
          lastContactedAt: null,
          nextFollowUpAt: null,
          notes: "",
        },
      ],
      jobOfferId: "job-access",
    }),
    85
  )
})

test("local opportunity timing score is derived from postedAt age", () => {
  const now = new Date("2026-04-28T12:00:00.000Z")

  assert.equal(scoreOpportunityTiming("2026-04-25T12:00:00.000Z", now), 90)
  assert.equal(scoreOpportunityTiming("2026-04-15T12:00:00.000Z", now), 75)
  assert.equal(scoreOpportunityTiming("2026-04-01T12:00:00.000Z", now), 60)
  assert.equal(scoreOpportunityTiming("2026-03-01T12:00:00.000Z", now), 35)
})

test("adding a linked network contact refreshes opportunity access score without applying", () => {
  useAppStore.getState().resetDemoData()
  const created = useAppStore.getState().addManualOpportunity({
    title: "Strategy & Operations Manager",
    company: "AccessCo",
    location: "Paris",
    remoteType: "hybrid",
    source: "Import manuel",
    url: "https://example.test/access",
    description:
      "Strategy and operations manager role focused on KPIs, reporting, OKRs, process design and cross-functional work.",
  })
  const initialAccess = useAppStore.getState().opportunities.find((item) => item.id === created.id).score.access
  const initialApplications = useAppStore.getState().applications.length

  useAppStore.getState().addNetworkContact({
    name: "Access Contact",
    company: "AccessCo",
    role: "Operations",
    linkedInUrl: null,
    status: "identified",
    linkedJobOfferId: created.id,
    linkedApplicationId: null,
    messageDraft: "",
    lastContactedAt: null,
    nextFollowUpAt: null,
    notes: "",
  })

  const rescored = useAppStore.getState().opportunities.find((item) => item.id === created.id)

  assert.equal(initialAccess, 30)
  assert.equal(rescored.score.access, 65)
  assert.equal(rescored.status, "new")
  assert.equal(useAppStore.getState().applications.length, initialApplications)
})

test("profile edits rescore existing opportunities", () => {
  useAppStore.getState().resetDemoData()
  const imported = useAppStore.getState().addManualOpportunity({
    title: "Machine Learning Engineer",
    company: "ModelOps",
    location: "Paris",
    remoteType: "hybrid",
    source: "Import manuel",
    url: "https://example.test/ml",
    description:
      "We need a Machine Learning Engineer with Python, Machine Learning, MLOps, data pipelines, model deployment, experimentation, and production monitoring experience.",
  })
  const beforeScore = imported.score.globalFit
  const currentProfile = useAppStore.getState().profile

  useAppStore.getState().saveProfileAndRescore({
    ...currentProfile,
    targetTitles: ["Machine Learning Engineer"],
    targetIndustries: ["AI"],
    skills: ["Python", "Machine Learning", "MLOps", "Data pipelines", "Model deployment"],
    strengths: ["Machine Learning delivery", "Production model monitoring"],
    positioningStatement: "Machine Learning Engineer focused on MLOps and production model delivery.",
  })

  const rescored = useAppStore.getState().opportunities.find((item) => item.id === imported.id)

  assert.equal(useAppStore.getState().appMode, "real")
  assert.equal(rescored.score.globalFit > beforeScore, true)
  assert.equal(rescored.score.recommendedActions.includes("Ne cliquer sur 'J'ai postule' qu'apres envoi manuel reel."), true)
})

test("opportunity snapshot exports sorted scores and profile context", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const snapshot = createOpportunitySnapshot({
    opportunities: state.opportunities,
    profile: state.profile,
    createdAt: "2026-04-28T12:00:00.000Z",
  })

  assert.equal(snapshot.schemaVersion, 1)
  assert.equal(snapshot.createdAt, "2026-04-28T12:00:00.000Z")
  assert.equal(snapshot.profile.name, state.profile.name)
  assert.equal(snapshot.summary.total, state.opportunities.length)
  assert.equal(
    snapshot.summary.applyNow,
    state.opportunities.filter((item) => item.score.verdict === "apply_now").length
  )
  assert.equal(snapshot.summary.topOpportunityId, snapshot.opportunities[0].id)

  for (let index = 1; index < snapshot.opportunities.length; index += 1) {
    assert.equal(
      snapshot.opportunities[index - 1].score.globalFit >= snapshot.opportunities[index].score.globalFit,
      true
    )
  }
})

test("parseCVToProfile extracts name, skills and experience from realistic CV", () => {
  const cv = [
    "Hamza Benali",
    "Strategy & Operations Manager",
    "",
    "COMPETENCES",
    "OKRs, Program Management, SQL, Cross-functional, Reporting, KPIs",
    "",
    "EXPERIENCES",
    "Operations Lead · FinScale · 2021-2023",
    "- Croissance ARR de 2M a 8M",
  ].join("\n")

  const parsed = parseCVToProfile(cv)
  assert.equal(parsed.name.value !== null, true)
  assert.equal(parsed.skills.length >= 2, true)
  assert.equal(parsed.experiences.length >= 1, true)
})

test("parseCVToProfile with empty string returns weak extraction without throwing", () => {
  const parsed = parseCVToProfile("")
  assert.equal(parsed.extractionQuality, "weak")
  assert.equal(parsed.name.value, null)
  assert.equal(parsed.skills.length, 0)
  assert.equal(parsed.experiences.length, 0)
})

test("parseCV with empty string returns empty object without throwing", () => {
  const result = parseCV("")
  assert.equal(Object.keys(result).length, 0)
})

test("saveProfileAndRescore called after parseCV changes at least one opportunity score", () => {
  useAppStore.getState().resetDemoData()

  // Start with a non-S&O profile to get a low baseline score
  const baseProfile = useAppStore.getState().profile
  useAppStore.getState().saveProfileAndRescore({
    ...baseProfile,
    skills: ["Accounting", "Finance"],
    targetTitles: ["Accountant"],
    strengths: [],
  })

  // Import an S&O opportunity — scored against the weak profile
  const imported = useAppStore.getState().addManualOpportunity({
    title: "Operations Manager",
    company: "TestCo",
    location: "Paris",
    remoteType: "hybrid",
    source: "Import manuel",
    url: "https://example.test/ops",
    description:
      "We need an Operations Manager with OKRs, program management, SQL, cross-functional coordination, reporting, KPIs and stakeholder management experience.",
  })
  const scoreBefore = useAppStore.getState().opportunities.find((o) => o.id === imported.id).score.globalFit

  // Parse a CV with rich S&O skills and apply via saveProfileAndRescore
  const cv = [
    "Hamza Benali",
    "COMPETENCES",
    "OKRs, Program Management, SQL, Cross-functional, Reporting, KPIs, Operations, Strategy, Stakeholder Management",
    "EXPERIENCES",
    "Operations Lead · FinScale · 2021-2023",
  ].join("\n")
  const partial = parseCV(cv)
  const weakProfile = useAppStore.getState().profile

  useAppStore.getState().saveProfileAndRescore({
    ...weakProfile,
    skills: partial.skills && partial.skills.length > 0 ? partial.skills : weakProfile.skills,
    targetTitles: partial.targetTitles && partial.targetTitles.length > 0 ? partial.targetTitles : weakProfile.targetTitles,
    proofPoints: [],
    objections: [],
  })

  const rescored = useAppStore.getState().opportunities.find((o) => o.id === imported.id)
  assert.equal(rescored !== undefined, true)
  assert.equal(rescored.score.globalFit > scoreBefore, true)
})

test("proofPoints and objections are cleared when profile is imported from CV", () => {
  useAppStore.getState().resetDemoData()

  const initialProfile = useAppStore.getState().profile
  assert.equal(initialProfile.proofPoints.length > 0, true)

  useAppStore.getState().saveProfileAndRescore({
    ...initialProfile,
    proofPoints: [],
    objections: [],
  })

  const updated = useAppStore.getState().profile
  assert.equal(updated.proofPoints.length, 0)
  assert.equal(updated.objections.length, 0)
})

test("parseCVToProfile detects quantified impact lines as proof point candidates", () => {
  const cv = [
    "Hamza Benali",
    "EXPERIENCES",
    "Operations Lead · FinScale · 2021-2023",
    "- Reduit le time-to-market de 40% en structurant les sprints cross-fonctionnels",
    "- Gere une equipe de 8 personnes sur 3 pays",
    "- Genere 2M€ de revenus supplementaires en 6 mois",
    "COMPETENCES",
    "OKRs, Program Management, SQL",
  ].join("\n")

  const parsed = parseCVToProfile(cv)
  assert.equal(parsed.proofPoints.length >= 1, true)
  // All candidates must come from cv, not fabricated
  for (const pp of parsed.proofPoints) {
    assert.equal(pp.source, "extracted_from_cv")
    assert.equal(pp.status, "to_review")
    assert.equal(pp.text.length > 0, true)
  }
})

test("parseCVToProfile does not create proof points from generic non-quantified lines", () => {
  const cv = [
    "Hamza Benali",
    "Strategy & Operations Manager",
    "COMPETENCES",
    "OKRs, SQL, Program Management",
    "EXPERIENCES",
    "Operations Lead · FinScale · 2021-2023",
    "- Coordinated cross-functional teams",
    "- Managed stakeholder relationships",
    "- Ran weekly rituals and reporting",
  ].join("\n")

  const parsed = parseCVToProfile(cv)
  // Generic action lines without clear quantified metrics should not be extracted
  assert.equal(parsed.proofPoints.length, 0)
})

test("profile saved after CV import with proof points stores them correctly", () => {
  useAppStore.getState().resetDemoData()

  const cv = [
    "Hamza Benali",
    "EXPERIENCES",
    "Operations Lead · FinScale · 2021-2023",
    "- Reduit le time-to-market de 40% en structurant les sprints",
    "COMPETENCES",
    "OKRs, Program Management, SQL, Cross-functional, Reporting, Strategy",
  ].join("\n")

  const parsed = parseCVToProfile(cv)
  const keptProofPoints = parsed.proofPoints.map((pp) => ({
    skill: pp.linkedSkill ?? "",
    evidence: pp.text,
    strength: "moderate",
  }))

  const currentProfile = useAppStore.getState().profile
  useAppStore.getState().saveProfileAndRescore({
    ...currentProfile,
    proofPoints: keptProofPoints,
    objections: [],
  })

  const saved = useAppStore.getState().profile
  assert.equal(saved.proofPoints.length, keptProofPoints.length)
  if (keptProofPoints.length > 0) {
    assert.equal(saved.proofPoints[0].evidence, keptProofPoints[0].evidence)
    assert.equal(saved.proofPoints[0].strength, "moderate")
  }
})

test("empty CV does not create proof points", () => {
  const parsed = parseCVToProfile("")
  assert.equal(parsed.proofPoints.length, 0)

  const parsed2 = parseCVToProfile("   ")
  assert.equal(parsed2.proofPoints.length, 0)
})

// Sprint 10.6: Real CV markdown parser robustness

const REAL_CV_MARKDOWN = [
  "Hamza Benali",
  "## Experiences",
  "**Amazon Europe, Strategic Insight Manager · Avril 2022 - Juin 2025**",
  "Responsable de l'analyse strategique pour le marche europeen.",
  "- Reduit le time-to-market de 40% via des sprints cross-fonctionnels",
  "**Amazon Europe, Program Manager · Octobre 2020 - Avril 2022 · 1 an 6 mos**",
  "- Supervise un budget de 71 millions d'euros",
  "**Amazon France, Operations Manager (Last-Mile Delivery) · Novembre 2018 - Oct 2020 · 1 an 11 mos**",
  "- Gere 200 livreurs sur 3 entrepots",
  "**EDF R&D, Business Analyst · Mai 2017 - Nov 2017 · 7 mos**",
  "- Realise des analyses de rentabilite",
  "## Formation",
  "Ecole Polytechnique, Diplome d'ingenieur · Septembre 2014 - Juin 2017",
  "## Competences",
  "OKRs, SQL, Program Management, Stakeholder Management, Reporting",
].join("\n")

test("real Markdown CV detects exactly 4 experiences", () => {
  const parsed = parseCVToProfile(REAL_CV_MARKDOWN)
  assert.equal(parsed.experiences.length, 4)
})

test("real Markdown CV extracts correct company and title for first experience", () => {
  const parsed = parseCVToProfile(REAL_CV_MARKDOWN)
  const first = parsed.experiences[0]
  assert.equal(first.company, "Amazon Europe")
  assert.equal(first.title, "Strategic Insight Manager")
})

test("real Markdown CV extracts correct title for second experience", () => {
  const parsed = parseCVToProfile(REAL_CV_MARKDOWN)
  assert.equal(parsed.experiences[1].title, "Program Manager")
})

test("real Markdown CV attaches bullets to correct experience", () => {
  const parsed = parseCVToProfile(REAL_CV_MARKDOWN)
  const programManager = parsed.experiences[1]
  assert.equal(programManager.achievements.some((a) => a.includes("71 millions")), true)
})

test("real Markdown CV does not count education section as experience", () => {
  const parsed = parseCVToProfile(REAL_CV_MARKDOWN)
  assert.equal(parsed.experiences.length, 4)
  assert.equal(parsed.experiences.every((e) => !e.company.includes("Polytechnique")), true)
})

test("real Markdown CV sets hasExperienceSection to true", () => {
  const parsed = parseCVToProfile(REAL_CV_MARKDOWN)
  assert.equal(parsed.hasExperienceSection, true)
})

test("real Markdown CV extracts correct years from month-year date format", () => {
  const parsed = parseCVToProfile(REAL_CV_MARKDOWN)
  const first = parsed.experiences[0]
  assert.equal(first.startYear, 2022)
  assert.equal(first.endYear, 2025)
})

test("cv-target API returns structured targeted bullets from mocked Anthropic response", async () => {
  useAppStore.getState().resetDemoData()
  const previousKey = process.env.ANTHROPIC_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousFetch = globalThis.fetch
  process.env.ANTHROPIC_API_KEY = "test-key"
  process.env.LLM_PROVIDER = "anthropic"

  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body)
    assert.equal(payload.model, "claude-sonnet-4-6")
    assert.equal(payload.messages.length, 1)

    return new Response(
      JSON.stringify({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              experiences: [{ id: "exp-1", bullets: ["Pilote un programme cross-fonctionnel cible."] }],
              angle: "Positionner le profil sur l'execution Strategy & Operations.",
              keywords: ["Strategy", "Operations", "KPIs"],
            }),
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  const profile = useAppStore.getState().profile
  const response = await postCVTarget(
    new Request("http://localhost/api/cv-target", {
      method: "POST",
      body: JSON.stringify({
        profile,
        jobDescription: "Strategy & Operations role with KPIs and cross-functional execution.",
        jobTitle: "Strategy & Operations Manager",
        company: "TestCo",
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.experiences[0].id, "exp-1")
  assert.equal(body.experiences[0].bullets.length, 1)
  assert.equal(body.angle.includes("Strategy"), true)
  assert.equal(body.keywords.includes("Operations"), true)
  assert.equal(body.provider, "anthropic")

  if (previousKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = previousKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  globalThis.fetch = previousFetch
})

test("cv-target API can use OpenAI provider with mocked Responses output", async () => {
  useAppStore.getState().resetDemoData()
  const previousKey = process.env.OPENAI_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousModel = process.env.OPENAI_MODEL
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = "test-openai-key"
  process.env.LLM_PROVIDER = "openai"
  process.env.OPENAI_MODEL = "gpt-5.4-mini"

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses")
    const payload = JSON.parse(options.body)
    assert.equal(payload.model, "gpt-5.4-mini")
    assert.equal(payload.text.format.type, "json_schema")
    assert.equal(payload.input.includes("Profile Intelligence:"), true)

    return new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          experiences: [{ id: "exp-2", bullets: ["Coordonne les operations ciblees."] }],
          angle: "Mettre en avant le pilotage operations et les KPIs.",
          keywords: ["Operations", "KPIs"],
        }),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  const profile = useAppStore.getState().profile
  const response = await postCVTarget(
    new Request("http://localhost/api/cv-target", {
      method: "POST",
      body: JSON.stringify({
        profile,
        jobDescription: "Business Operations role with KPIs.",
        jobTitle: "Business Operations Manager",
        company: "OpenAITestCo",
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.provider, "openai")
  assert.equal(body.experiences[0].id, "exp-2")
  assert.equal(body.keywords.includes("KPIs"), true)

  if (previousKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  if (previousModel === undefined) {
    delete process.env.OPENAI_MODEL
  } else {
    process.env.OPENAI_MODEL = previousModel
  }
  globalThis.fetch = previousFetch
})

test("cv-target API returns clear missing-key error without making an LLM call", async () => {
  useAppStore.getState().resetDemoData()
  const previousAnthropicKey = process.env.ANTHROPIC_API_KEY
  const previousOpenAIKey = process.env.OPENAI_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousFetch = globalThis.fetch
  process.env.LLM_PROVIDER = "anthropic"
  process.env.ANTHROPIC_API_KEY = "sk-ant-remplace-moi"
  delete process.env.OPENAI_API_KEY

  let fetchCalled = false
  globalThis.fetch = async () => {
    fetchCalled = true
    return new Response("{}", { status: 200 })
  }

  const profile = useAppStore.getState().profile
  const response = await postCVTarget(
    new Request("http://localhost/api/cv-target", {
      method: "POST",
      body: JSON.stringify({
        profile,
        jobDescription: "Strategy & Operations role.",
        jobTitle: "Strategy & Operations Manager",
        company: "NoCreditsCo",
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.error, "Cle API manquante. Ajoute une cle dans .env.local pour activer la generation IA.")
  assert.equal(fetchCalled, false)

  if (previousAnthropicKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = previousAnthropicKey
  }
  if (previousOpenAIKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousOpenAIKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  globalThis.fetch = previousFetch
})

test("local CV targeting fallback creates non-empty bullets without API", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const opportunity = state.opportunities[0]
  const fallback = generateLocalTargetedCV({
    profile: state.profile,
    jobDescription: opportunity.description,
    jobTitle: opportunity.title,
    company: opportunity.company,
  })

  assert.equal(fallback.experiences.length, state.profile.experiences.length)
  assert.equal(fallback.experiences.every((experience) => experience.bullets.length > 0), true)
  assert.equal(fallback.angle.includes(opportunity.company), true)
  assert.equal(fallback.keywords.length > 0, true)
})

test("saving a local targeted CV draft does not create or apply an application", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const opportunity = state.opportunities[0]
  const initialApplications = state.applications.length
  const initialEvents = state.applicationEvents.length
  const initialCVs = state.cvVersions.length
  const target = generateLocalTargetedCV({
    profile: state.profile,
    jobDescription: opportunity.description,
    jobTitle: opportunity.title,
    company: opportunity.company,
  })

  const saved = useAppStore.getState().saveTargetedCVDraft(opportunity.id, target)
  const nextState = useAppStore.getState()
  const nextOpportunity = nextState.opportunities.find((item) => item.id === opportunity.id)

  assert.equal(Boolean(saved), true)
  assert.equal(nextState.cvVersions.length, initialCVs + 1)
  assert.equal(nextState.cvVersions[0].id, saved.id)
  assert.equal(nextState.cvVersions[0].jobOfferId, opportunity.id)
  assert.equal(nextState.applications.length, initialApplications)
  assert.equal(nextState.applicationEvents.length, initialEvents)
  assert.equal(nextOpportunity.status, opportunity.status)
})

test("profile intelligence derives a complete local professional picture without API", () => {
  useAppStore.getState().resetDemoData()
  const profile = useAppStore.getState().profile
  const intelligence = createProfileIntelligence(profile)

  assert.equal(intelligence.source, "local_profile")
  assert.equal(intelligence.seniority.length > 0, true)
  assert.equal(intelligence.targetRoleFamilies.length > 0, true)
  assert.equal(intelligence.avoidRoleFamilies.length > 0, true)
  assert.equal(intelligence.sectorFit.length > 0, true)
  assert.equal(intelligence.coreStrengths.length > 0, true)
  assert.equal(intelligence.impactProofs.length > 0, true)
  assert.equal(intelligence.likelyObjections.length > 0, true)
  assert.equal(intelligence.pitch.short.length > 0, true)
  assert.equal(intelligence.pitch.recruiter.length > 0, true)
  assert.equal(intelligence.pitch.interview.length > 0, true)
  assert.equal(intelligence.starExamples.length > 0, true)
  assert.equal(intelligence.atsKeywords.length > 0, true)
  assert.equal(intelligence.progressionAxes.length > 0, true)
})

test("manual profile intelligence edits persist without changing pipeline state", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const initialApplications = state.applications.length
  const initialEvents = state.applicationEvents.length
  const current = state.profile
  const intelligence = createProfileIntelligence(current)

  useAppStore.getState().saveProfileAndRescore({
    ...current,
    profileIntelligence: {
      ...intelligence,
      seniority: "Executive-ready operator",
      targetRoleFamilies: ["Chief of Staff", "Strategy & Operations"],
      source: "manual",
    },
  })

  const next = useAppStore.getState()
  assert.equal(next.profile.profileIntelligence.seniority, "Executive-ready operator")
  assert.equal(next.profile.profileIntelligence.source, "manual")
  assert.deepEqual(next.profile.profileIntelligence.targetRoleFamilies, ["Chief of Staff", "Strategy & Operations"])
  assert.equal(next.applications.length, initialApplications)
  assert.equal(next.applicationEvents.length, initialEvents)
})

test("profile-intelligence API returns reviewed ProfileIntelligence from mocked OpenAI response", async () => {
  useAppStore.getState().resetDemoData()
  const previousKey = process.env.OPENAI_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = "test-openai-key"
  process.env.LLM_PROVIDER = "openai"

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses")
    const payload = JSON.parse(options.body)
    assert.equal(payload.text.format.name, "profile_intelligence")
    assert.equal(payload.input.includes("Distingue les preuves fortes directement visibles"), true)
    assert.equal(payload.input.includes("Les starExamples doivent venir d'experiences concretes"), true)

    return new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          seniority: "Senior operator",
          seniorityConfidence: "high",
          targetRoleFamilies: ["Strategy & Operations", "Chief of Staff"],
          avoidRoleFamilies: ["Product Owner standalone"],
          sectorFit: ["SaaS B2B"],
          coreStrengths: ["Cross-functional execution"],
          impactProofs: ["ARR 2M to 8M"],
          likelyObjections: ["Product-heavy title history"],
          pitch: {
            short: "Senior Strategy & Operations profile.",
            recruiter: "Recruiter pitch.",
            interview: "Interview pitch.",
          },
          starExamples: [
            {
              id: "star-1",
              title: "Retention program",
              situation: "Churn was high.",
              task: "Reduce churn.",
              action: "Coordinated teams.",
              result: "Churn reduced.",
              linkedSkills: ["Operations"],
            },
          ],
          atsKeywords: ["Strategy", "Operations", "KPIs"],
          progressionAxes: ["Clarify C-suite exposure"],
          source: "llm_reviewed",
        }),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  const profile = useAppStore.getState().profile
  const response = await postProfileIntelligence(
    new Request("http://localhost/api/profile-intelligence", {
      method: "POST",
      body: JSON.stringify({
        cvText: [
          "Hamza Benali",
          "Strategy & Operations Manager",
          "Experience FinScale 2021-2023",
          "Led cross-functional programs and reporting for a SaaS B2B scale-up.",
          "Reduced churn and supported ARR growth with operational rituals and KPIs.",
        ].join("\n"),
        currentProfile: profile,
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.provider, "openai")
  assert.equal(body.profileIntelligence.source, "llm_reviewed")
  assert.equal(body.profileIntelligence.seniority, "Senior operator")
  assert.equal(body.profileIntelligence.targetRoleFamilies.includes("Chief of Staff"), true)
  assert.equal(body.profileIntelligence.pitch.short.length > 0, true)
  assert.equal(["strong", "partial"].includes(body.calibration.score), true)
  assert.equal(Array.isArray(body.calibration.warnings), true)

  if (previousKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  globalThis.fetch = previousFetch
})

test("profile-intelligence API requires explicit master CV text", async () => {
  const response = await postProfileIntelligence(
    new Request("http://localhost/api/profile-intelligence", {
      method: "POST",
      body: JSON.stringify({
        cvText: "Too short",
        currentProfile: useAppStore.getState().profile,
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.error, "Missing or too short master CV text")
})

// Sprint 14: Profile Intelligence calibration

test("calibrateProfileIntelligence returns blocking warning when no target roles", () => {
  const pi = createProfileIntelligence({
    ...require("../src/stores/app-store.ts").useAppStore.getState().profile,
    targetTitles: [],
    profileIntelligence: undefined,
  })
  const emptyRoles = { ...pi, targetRoleFamilies: [] }
  const result = calibrateProfileIntelligence(emptyRoles)
  const blocking = result.warnings.filter((w) => w.level === "blocking")
  assert.equal(blocking.some((w) => w.field === "targetRoleFamilies"), true)
  assert.equal(result.isReady, false)
  assert.equal(result.score, "weak")
})

test("calibrateProfileIntelligence returns blocking warning when no impact proofs", () => {
  const pi = createProfileIntelligence({
    ...require("../src/stores/app-store.ts").useAppStore.getState().profile,
    proofPoints: [],
    achievements: [],
    profileIntelligence: undefined,
  })
  const noProofs = { ...pi, impactProofs: [] }
  const result = calibrateProfileIntelligence(noProofs)
  assert.equal(result.warnings.some((w) => w.field === "impactProofs" && w.level === "blocking"), true)
  assert.equal(result.isReady, false)
})

test("calibrateProfileIntelligence returns no blocking warnings for a well-filled intelligence", () => {
  const wellFilled = {
    seniority: "Senior IC / Manager",
    seniorityConfidence: "high",
    targetRoleFamilies: ["Strategy Manager", "Operations Lead"],
    avoidRoleFamilies: [],
    sectorFit: ["Tech", "SaaS"],
    coreStrengths: ["Cross-functional execution", "OKRs"],
    impactProofs: ["Reduit time-to-market de 40%", "Gere budget 71M EUR", "Scale equipe x3"],
    likelyObjections: ["Pas de exp sectorielle directe"],
    pitch: { short: "Strategy & Operations Manager avec 7 ans d'experience en scale-up tech.", recruiter: "", interview: "" },
    starExamples: [],
    atsKeywords: ["OKRs", "SQL", "Program Management", "Stakeholder", "Reporting", "Strategy", "Operations", "KPIs"],
    progressionAxes: [],
    source: "llm_reviewed",
  }
  const result = calibrateProfileIntelligence(wellFilled)
  assert.equal(result.warnings.filter((w) => w.level === "blocking").length, 0)
  assert.equal(result.isReady, true)
  assert.equal(result.score === "strong" || result.score === "partial", true)
})

test("calibrateProfileIntelligence result has correct structure", () => {
  const pi = createProfileIntelligence(require("../src/stores/app-store.ts").useAppStore.getState().profile)
  const result = calibrateProfileIntelligence(pi)
  assert.equal(typeof result.isReady, "boolean")
  assert.equal(["strong", "partial", "weak"].includes(result.score), true)
  assert.equal(Array.isArray(result.warnings), true)
  for (const w of result.warnings) {
    assert.equal(["blocking", "weak"].includes(w.level), true)
    assert.equal(typeof w.message, "string")
    assert.equal(w.message.length > 0, true)
  }
})

// Sprint 15: Daily Job Scout - detectDuplicate and previewJobKeywords

test("detectDuplicate returns null when no match", () => {
  const existing = [
    { ...makeOpportunity("dup-a"), title: "Strategy Manager", company: "Acme", url: "https://acme.co/jobs/1" },
  ]
  const result = detectDuplicate(
    { title: "Operations Lead", company: "Contoso", url: "https://contoso.com/jobs/2" },
    existing
  )
  assert.equal(result, null)
})

test("detectDuplicate detects duplicate by URL", () => {
  const url = "https://linkedin.com/jobs/12345"
  const existing = [
    { ...makeOpportunity("dup-b"), title: "Operations Lead", company: "Swile", url },
  ]
  const result = detectDuplicate({ title: "Different Title", company: "Different Co", url }, existing)
  assert.equal(result !== null, true)
  assert.equal(result.id, "dup-b")
})

test("detectDuplicate detects duplicate by normalized company and title", () => {
  const existing = [
    { ...makeOpportunity("dup-c"), title: "Strategy Manager", company: "Pennylane", url: "" },
  ]
  const result = detectDuplicate(
    { title: "  Strategy Manager  ", company: "pennylane" },
    existing
  )
  assert.equal(result !== null, true)
  assert.equal(result.id, "dup-c")
})

test("previewJobKeywords returns matched skills from description", () => {
  const description =
    "We are looking for a Strategy & Operations Manager with expertise in OKRs, SQL, and " +
    "Stakeholder Management. The role involves Reporting and cross-functional program coordination."
  const keywords = previewJobKeywords(description)
  assert.equal(keywords.includes("OKRs"), true)
  assert.equal(keywords.includes("SQL"), true)
  assert.equal(keywords.includes("Reporting"), true)
})

test("previewJobKeywords returns empty array for short descriptions", () => {
  const result = previewJobKeywords("Short text")
  assert.equal(Array.isArray(result), true)
  assert.equal(result.length, 0)
})

// Sprint 19: Application Pack Builder

test("generateLocalApplicationPack creates a complete non-empty pack from profile and opportunity", () => {
  useAppStore.getState().resetDemoData()
  const { profile, opportunities } = useAppStore.getState()
  const opp = opportunities[0]
  const pack = generateLocalApplicationPack(profile, opp)

  assert.equal(pack.jobOfferId, opp.id)
  assert.equal(pack.linkedInMessage.length > 50, true)
  assert.equal(pack.pitch30s.length > 30, true)
  assert.equal(pack.pitch60s.length > 30, true)
  assert.equal(pack.whyYou.length > 30, true)
  assert.equal(pack.whyCompany.length > 30, true)
  assert.equal(pack.probableQuestions.length >= 4, true)
  assert.equal(pack.probableObjections.length >= 0, true)
  assert.equal(pack.miniPrepPlan.length >= 4, true)
})

test("local application pack uses Profile Intelligence instead of first-experience-only fallbacks", () => {
  useAppStore.getState().resetDemoData()
  const { profile, opportunities } = useAppStore.getState()
  const opp = opportunities[0]
  const enrichedProfile = {
    ...profile,
    profileIntelligence: {
      seniority: "Senior Strategy & Operations",
      seniorityConfidence: "high",
      targetRoleFamilies: ["Strategy & Operations"],
      avoidRoleFamilies: ["Product Owner"],
      sectorFit: ["SaaS B2B"],
      coreStrengths: ["Executive alignment"],
      impactProofs: ["Reduced onboarding time by 60% through an operations redesign"],
      likelyObjections: ["Clarify Product to Operations repositioning"],
      pitch: {
        short: "PI short pitch focused on operations impact.",
        recruiter: "PI recruiter pitch with proof-led positioning.",
        interview: "PI interview pitch with STAR-ready evidence.",
      },
      starExamples: [
        {
          id: "star-pack",
          title: "Operations redesign",
          situation: "Slow onboarding",
          task: "Reduce cycle time",
          action: "Rebuilt operating rhythm",
          result: "Time reduced by 60%",
          linkedSkills: ["Operations"],
        },
      ],
      atsKeywords: ["Operations", "KPIs"],
      progressionAxes: ["Enterprise scale"],
      source: "manual",
    },
  }
  const pack = generateLocalApplicationPack(enrichedProfile, opp)

  assert.equal(pack.pitch30s.includes("PI short pitch"), true)
  assert.equal(pack.pitch60s.includes("PI interview pitch"), true)
  assert.equal(pack.whyYou.includes("Reduced onboarding time by 60%"), true)
  assert.equal(pack.probableObjections.includes("Clarify Product to Operations repositioning"), true)
  assert.equal(pack.probableQuestions.some((question) => question.includes("Operations redesign")), true)
  assert.equal(pack.miniPrepPlan.some((step) => step.includes("Operations redesign")), true)
})

test("local application pack whyCompany is not a pasted job description slice", () => {
  useAppStore.getState().resetDemoData()
  const { profile, opportunities } = useAppStore.getState()
  const opp = {
    ...opportunities[0],
    description:
      "PASTED DESCRIPTION START unique-token-123. This paragraph is intentionally long and should not be copied as the opening whyCompany paragraph. ".repeat(5),
  }
  const pack = generateLocalApplicationPack(profile, opp)

  assert.equal(pack.whyCompany.includes("PASTED DESCRIPTION START"), false)
  assert.equal(pack.whyCompany.includes(opp.company), true)
  assert.equal(pack.whyCompany.includes(opp.title), true)
  assert.equal(pack.whyCompany.includes(opp.score.recommendedAngle), true)
})

test("application-pack API returns structured pack from mocked OpenAI response", async () => {
  useAppStore.getState().resetDemoData()
  const previousKey = process.env.OPENAI_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = "test-openai-key"
  process.env.LLM_PROVIDER = "openai"

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses")
    const payload = JSON.parse(options.body)
    assert.equal(payload.text.format.name, "application_pack")
    assert.equal(payload.input.includes("whyCompany ne doit pas recoller la description"), true)

    return new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          linkedInMessage: "Bonjour, votre poste Strategy & Operations chez TestCo correspond a mon profil ops.",
          pitch30s: "Pitch court avec impact operations et preuves existantes.",
          pitch60s: "Pitch long qui relie profil, preuves et contexte entreprise.",
          whyYou: "Pourquoi moi: preuves operations, coordination transverse, reporting.",
          whyCompany: "TestCo m'interesse pour son contexte de structuration operations.",
          probableQuestions: ["Pourquoi TestCo ?", "Pourquoi ce poste ?", "Exemple STAR ?"],
          probableObjections: ["Profil trop product", "Peu de grand groupe"],
          miniPrepPlan: ["Relire le CV", "Preparer STAR", "Verifier actualites"],
        }),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  const { profile, opportunities, applications, applicationEvents } = useAppStore.getState()
  const response = await postApplicationPack(
    new Request("http://localhost/api/application-pack", {
      method: "POST",
      body: JSON.stringify({
        profile,
        opportunity: opportunities[0],
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.provider, "openai")
  assert.equal(body.applicationPack.jobOfferId, opportunities[0].id)
  assert.equal(body.applicationPack.cvVersionId, null)
  assert.equal(body.applicationPack.whyCompany.includes("TestCo"), true)
  assert.equal(useAppStore.getState().applications.length, applications.length)
  assert.equal(useAppStore.getState().applicationEvents.length, applicationEvents.length)

  if (previousKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  globalThis.fetch = previousFetch
})

test("application-pack API returns clear missing-key error without LLM call", async () => {
  useAppStore.getState().resetDemoData()
  const previousAnthropicKey = process.env.ANTHROPIC_API_KEY
  const previousOpenAIKey = process.env.OPENAI_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousFetch = globalThis.fetch
  process.env.LLM_PROVIDER = "anthropic"
  process.env.ANTHROPIC_API_KEY = "sk-ant-remplace-moi"
  delete process.env.OPENAI_API_KEY
  let fetchCalled = false
  globalThis.fetch = async () => {
    fetchCalled = true
    throw new Error("fetch should not be called")
  }

  const { profile, opportunities } = useAppStore.getState()
  const response = await postApplicationPack(
    new Request("http://localhost/api/application-pack", {
      method: "POST",
      body: JSON.stringify({
        profile,
        opportunity: opportunities[0],
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.error.includes("Cle API manquante") || body.error.includes("Clé API manquante"), true)
  assert.equal(fetchCalled, false)

  if (previousAnthropicKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = previousAnthropicKey
  }
  if (previousOpenAIKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousOpenAIKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  globalThis.fetch = previousFetch
})

test("saveApplicationPack persists pack without creating application or event", () => {
  useAppStore.getState().resetDemoData()
  const { profile, opportunities } = useAppStore.getState()
  const initialApplications = useAppStore.getState().applications.length
  const initialEvents = useAppStore.getState().applicationEvents.length

  const pack = generateLocalApplicationPack(profile, { ...opportunities[0], id: "pack-test-opp" })
  useAppStore.getState().saveApplicationPack(pack)

  const next = useAppStore.getState()
  assert.equal(next.applicationPacks["pack-test-opp"] !== undefined, true)
  assert.equal(next.applicationPacks["pack-test-opp"].linkedInMessage.length > 0, true)
  assert.equal(next.applications.length, initialApplications)
  assert.equal(next.applicationEvents.length, initialEvents)
})

test("saved application pack does not change opportunity status", () => {
  useAppStore.getState().resetDemoData()
  const { profile, opportunities } = useAppStore.getState()
  const opp = opportunities[0]
  const originalStatus = opp.status
  const pack = generateLocalApplicationPack(profile, opp)
  useAppStore.getState().saveApplicationPack(pack)
  const updatedOpp = useAppStore.getState().opportunities.find((o) => o.id === opp.id)
  assert.equal(updatedOpp.status, originalStatus)
})

// Sprint 20: Application Pack Builder QA

test("application pack quality scores generated local pack as usable", () => {
  useAppStore.getState().resetDemoData()
  const { profile, opportunities } = useAppStore.getState()
  const opp = opportunities[0]
  const pack = generateLocalApplicationPack(profile, opp)
  const quality = evaluateApplicationPackQuality(pack, { profile, opportunity: opp })

  assert.equal(quality.score >= 70, true)
  assert.equal(quality.sectionScores.linkedin > 0, true)
  assert.equal(Array.isArray(quality.warnings), true)
})

test("application pack quality flags weak pack with missing evidence", () => {
  useAppStore.getState().resetDemoData()
  const { opportunities } = useAppStore.getState()
  const opp = opportunities[0]
  const weakPack = {
    jobOfferId: opp.id,
    cvVersionId: "",
    linkedInMessage: "Bonjour, je suis tres interesse.",
    pitch30s: "Profil polyvalent et motive.",
    pitch60s: "Profil polyvalent et motive pour un environnement dynamique.",
    whyYou: "Je suis motive.",
    whyCompany: "Entreprise interessante.",
    probableQuestions: ["Pourquoi vous ?"],
    probableObjections: [],
    miniPrepPlan: ["Relire l'offre"],
  }
  const quality = evaluateApplicationPackQuality(weakPack, { opportunity: opp })

  assert.equal(quality.score < 70, true)
  assert.equal(quality.warnings.some((warning) => warning.id === "missing-proof"), true)
  assert.equal(quality.warnings.some((warning) => warning.id === "too-few-objections"), true)
})

test("application pack quality flags unsupported quantified claims", () => {
  useAppStore.getState().resetDemoData()
  const { profile, opportunities } = useAppStore.getState()
  const opp = opportunities[0]
  const pack = generateLocalApplicationPack(profile, opp)
  const riskyPack = {
    ...pack,
    whyYou: `${pack.whyYou}\n\nJ'ai augmente le revenu de 999% en 2 jours.`,
  }
  const quality = evaluateApplicationPackQuality(riskyPack, { profile, opportunity: opp })

  assert.equal(
    quality.warnings.some((warning) => warning.id === "unsupported-quantified-claim"),
    true
  )
})

// Sprint 18: CV Targeting Editor

test("updateCVContent persists new content without affecting applications or opportunities", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const cv = state.cvVersions[0]
  const initialApplications = state.applications.length
  const initialOpportunities = state.opportunities.length
  const newContent = "CONTENU MODIFIE PAR L'UTILISATEUR"

  useAppStore.getState().updateCVContent(cv.id, newContent)

  const next = useAppStore.getState()
  const updated = next.cvVersions.find((c) => c.id === cv.id)
  assert.equal(updated.content, newContent)
  assert.equal(next.applications.length, initialApplications)
  assert.equal(next.opportunities.length, initialOpportunities)
})

test("updateCVContent does not change scores or keywords", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const cv = state.cvVersions[0]
  const originalATS = cv.atsScore
  const originalKeywords = cv.includedKeywords.slice()

  useAppStore.getState().updateCVContent(cv.id, "Nouveau contenu sans keywords")

  const updated = useAppStore.getState().cvVersions.find((c) => c.id === cv.id)
  assert.equal(updated.atsScore, originalATS)
  assert.deepEqual(updated.includedKeywords, originalKeywords)
})

// Sprint 16: Scout Queue

test("getScoutQueue returns only new opportunities", () => {
  const opps = [
    { ...makeOpportunity("q1"), status: "new" },
    { ...makeOpportunity("q2"), status: "shortlisted" },
    { ...makeOpportunity("q3"), status: "archived" },
    { ...makeOpportunity("q4"), status: "new" },
  ]
  const queue = getScoutQueue(opps)
  assert.equal(queue.length, 2)
  assert.equal(queue.every((o) => o.status === "new"), true)
})

test("getScoutQueue sorts by verdict priority then by globalFit descending", () => {
  const base = makeOpportunity("x", 80)
  const opps = [
    { ...base, id: "s1", status: "new", score: { ...base.score, verdict: "investigate", globalFit: 70 } },
    { ...base, id: "s2", status: "new", score: { ...base.score, verdict: "apply_now", globalFit: 90 } },
    { ...base, id: "s3", status: "new", score: { ...base.score, verdict: "apply_now", globalFit: 85 } },
  ]
  const queue = getScoutQueue(opps)
  assert.equal(queue[0].id, "s2")
  assert.equal(queue[1].id, "s3")
  assert.equal(queue[2].id, "s1")
})

test("getScoutQueue respects maxItems cap", () => {
  const opps = Array.from({ length: 10 }, (_, i) => ({
    ...makeOpportunity(`cap${i}`),
    status: "new",
  }))
  const queue = getScoutQueue(opps, 3)
  assert.equal(queue.length, 3)
})

test("updateOpportunityStatus shortlists opportunity without creating an application", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const initialApplications = state.applications.length
  const opp = state.opportunities[0]
  useAppStore.getState().updateOpportunityStatus(opp.id, "shortlisted")
  const next = useAppStore.getState()
  const updated = next.opportunities.find((o) => o.id === opp.id)
  assert.equal(updated.status, "shortlisted")
  assert.equal(next.applications.length, initialApplications)
})

// Sprint 21B: Interview handoff

test("interview handoff appears only for interview-stage statuses", () => {
  assert.equal(isInterviewStatus("applied"), false)
  assert.equal(isInterviewStatus("recruiter_interview"), true)
  assert.equal(isInterviewStatus("hiring_manager_interview"), true)

  const noHandoff = buildInterviewHandoff({
    status: "applied",
    interviewDateIso: null,
    hasTargetedCV: true,
    hasApplicationPack: true,
    hasLinkedContact: true,
    hasInterviewNote: false,
  })

  assert.equal(noHandoff, null)
})

test("interview handoff computes readiness without mutating pipeline state", () => {
  const app = makeApplication("interview-handoff", "recruiter_interview", 2)
  const originalStatus = app.status
  const handoff = buildInterviewHandoff({
    status: app.status,
    interviewDateIso: "2026-05-05T09:00:00.000Z",
    hasTargetedCV: true,
    hasApplicationPack: true,
    hasLinkedContact: false,
    hasInterviewNote: false,
  })

  assert.equal(handoff !== null, true)
  assert.equal(handoff.readinessScore, 50)
  assert.equal(handoff.steps.length, 4)
  assert.equal(handoff.nextFocus, "Contexte humain")
  assert.equal(app.status, originalStatus)
})

// Sprint 22A: Network layer

test("network signal treats prepared message as actionable but not contacted", () => {
  const contact = {
    id: "network-prepared",
    name: "Camille",
    company: "Pennylane",
    role: "Ops",
    linkedInUrl: null,
    status: "message_prepared",
    linkedJobOfferId: "job-1",
    linkedApplicationId: null,
    messageDraft: "Bonjour",
    lastContactedAt: null,
    nextFollowUpAt: null,
    notes: "",
  }

  const signal = getNetworkSignal(contact, new Date("2026-04-28T12:00:00.000Z"))

  assert.equal(signal.level, "ready_to_send")
  assert.equal(signal.isActionable, true)
  assert.equal(signal.hasPipelineLink, true)
  assert.equal(contact.status, "message_prepared")
})

test("network signal prioritizes due follow-up above waiting contact", () => {
  const now = new Date("2026-04-28T12:00:00.000Z")
  const due = {
    id: "network-due",
    name: "Due",
    company: "A",
    role: "Ops",
    linkedInUrl: null,
    status: "contacted",
    linkedJobOfferId: null,
    linkedApplicationId: "app-1",
    messageDraft: "",
    lastContactedAt: isoDaysAgo(10),
    nextFollowUpAt: isoDaysAgo(1),
    notes: "",
  }
  const waiting = {
    ...due,
    id: "network-waiting",
    name: "Waiting",
    nextFollowUpAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  }

  const dueSignal = getNetworkSignal(due, now)
  const waitingSignal = getNetworkSignal(waiting, now)
  const sorted = sortContactsByNetworkPriority([waiting, due], now)

  assert.equal(dueSignal.level, "follow_up_due")
  assert.equal(waitingSignal.level, "waiting")
  assert.equal(sorted[0].id, "network-due")
})

test("network draft suggestion creates follow-up copy without changing contact status", () => {
  const now = new Date("2026-04-28T12:00:00.000Z")
  const contact = {
    id: "network-follow-up",
    name: "Nicolas",
    company: "Payfit",
    role: "People Ops",
    linkedInUrl: null,
    status: "contacted",
    linkedJobOfferId: null,
    linkedApplicationId: "app-5",
    messageDraft: "Bonjour Nicolas",
    lastContactedAt: isoDaysAgo(10),
    nextFollowUpAt: isoDaysAgo(1),
    notes: "",
  }
  const originalStatus = contact.status
  const signal = getNetworkSignal(contact, now)
  const draft = buildNetworkDraftSuggestion(contact, signal, "Payfit - Operations Excellence")

  assert.equal(draft.intent, "follow_up")
  assert.equal(draft.body.includes("Nicolas"), true)
  assert.equal(draft.body.includes("Payfit - Operations Excellence"), true)
  assert.equal(contact.status, originalStatus)
})

// Sprint 23A: Interview Coach workspace

test("interview workspace appears only for interview-stage applications", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const application = makeApplication("coach-applied", "applied", 3)
  const workspace = buildInterviewWorkspace({
    application,
    profile: state.profile,
    opportunity: makeOpportunity("coach-opp"),
    applicationPack: null,
    cvVersion: null,
    linkedContact: null,
    memoryItems: [],
  })

  assert.equal(workspace, null)
  assert.equal(application.status, "applied")
})

test("interview workspace computes local prep without mutating pipeline state", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const application = makeApplication("coach-interview", "recruiter_interview", 2)
  application.nextActionDate = "2026-05-05T09:00:00.000Z"
  application.cvVersionId = "cv-coach"
  const originalStatus = application.status
  const opportunity = makeOpportunity("coach-interview-job", 86)
  const workspace = buildInterviewWorkspace({
    application,
    profile: state.profile,
    opportunity,
    applicationPack: generateLocalApplicationPack(state.profile, opportunity),
    cvVersion: {
      id: "cv-coach",
      masterCvId: "master",
      jobOfferId: opportunity.id,
      title: "CV cible entretien",
      atsScore: 82,
      recruiterReadability: 80,
      narrativeCoherence: 78,
      substanceScore: 76,
      keywordCoverage: 74,
      missingKeywords: [],
      includedKeywords: [],
      bulletImprovements: [],
      content: "CV",
      createdAt: isoDaysAgo(1),
    },
    linkedContact: null,
    memoryItems: [],
    fallbackTitle: "Strategy & Operations Manager",
    fallbackCompany: "CoachCo",
  })

  assert.equal(workspace !== null, true)
  assert.equal(workspace.readinessScore, 50)
  assert.equal(workspace.nextFocus, "Contexte humain")
  assert.equal(workspace.likelyQuestions.length >= 4, true)
  assert.equal(workspace.starExamples.length > 0, true)
  assert.equal(application.status, originalStatus)
})

test("interview-prep API returns structured prep from mocked OpenAI response", async () => {
  useAppStore.getState().resetDemoData()
  const previousKey = process.env.OPENAI_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousFetch = globalThis.fetch
  process.env.OPENAI_API_KEY = "test-openai-key"
  process.env.LLM_PROVIDER = "openai"

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses")
    const payload = JSON.parse(options.body)
    assert.equal(payload.text.format.name, "interview_prep")
    assert.equal(payload.input.includes("Ne change aucun statut de candidature"), true)

    return new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          roleStakes: ["Aligner les equipes operations et business"],
          likelyQuestions: [
            {
              question: "Pourquoi ce poste ?",
              answerAngle: "Relier preuves operations au contexte",
              proofToUse: "Programme retention",
            },
          ],
          tailoredAnswers: [{ prompt: "Parle-moi de toi", answer: "Reponse adaptee au profil." }],
          objections: [{ objection: "Profil trop product", responseAngle: "Montrer le fil rouge operations." }],
          starMapping: [{ situation: "Churn eleve", story: "Programme transverse", useFor: ["Impact"] }],
          prepChecklist: ["Relire le pack", "Preparer STAR"],
          companyResearch: ["Verifier actualites entreprise"],
          questionsToAsk: ["Quels sont les enjeux 90 jours ?"],
        }),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  const state = useAppStore.getState()
  const application = state.applications.find((item) => isInterviewStatus(item.status))
  const opportunity = state.opportunities.find((item) => item.id === application.jobOfferId) ?? null
  const workspace = buildInterviewWorkspace({
    application,
    profile: state.profile,
    opportunity,
    applicationPack: state.applicationPacks[application.jobOfferId] ?? null,
    cvVersion: state.cvVersions.find((item) => item.jobOfferId === application.jobOfferId) ?? null,
    linkedContact: state.networkContacts.find((contact) => contact.id === application.contactId) ?? null,
    memoryItems: state.memoryItems,
  })

  const response = await postInterviewPrep(
    new Request("http://localhost/api/interview-prep", {
      method: "POST",
      body: JSON.stringify({
        profile: state.profile,
        application,
        opportunity,
        applicationPack: state.applicationPacks[application.jobOfferId] ?? null,
        cvVersion: state.cvVersions.find((item) => item.jobOfferId === application.jobOfferId) ?? null,
        linkedContact: state.networkContacts.find((contact) => contact.id === application.contactId) ?? null,
        memoryItems: state.memoryItems,
        workspace,
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.provider, "openai")
  assert.equal(body.interviewPrep.likelyQuestions[0].question, "Pourquoi ce poste ?")
  assert.equal(useAppStore.getState().applications.length, state.applications.length)
  assert.equal(useAppStore.getState().applicationEvents.length, state.applicationEvents.length)

  if (previousKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  globalThis.fetch = previousFetch
})

test("interview-prep API returns clear missing-key error without LLM call", async () => {
  useAppStore.getState().resetDemoData()
  const previousAnthropicKey = process.env.ANTHROPIC_API_KEY
  const previousOpenAIKey = process.env.OPENAI_API_KEY
  const previousProvider = process.env.LLM_PROVIDER
  const previousFetch = globalThis.fetch
  process.env.LLM_PROVIDER = "anthropic"
  process.env.ANTHROPIC_API_KEY = "sk-ant-remplace-moi"
  delete process.env.OPENAI_API_KEY
  let fetchCalled = false
  globalThis.fetch = async () => {
    fetchCalled = true
    throw new Error("fetch should not be called")
  }

  const state = useAppStore.getState()
  const application = state.applications.find((item) => isInterviewStatus(item.status))
  const workspace = buildInterviewWorkspace({
    application,
    profile: state.profile,
    opportunity: null,
    applicationPack: null,
    cvVersion: null,
    linkedContact: null,
    memoryItems: state.memoryItems,
  })

  const response = await postInterviewPrep(
    new Request("http://localhost/api/interview-prep", {
      method: "POST",
      body: JSON.stringify({
        profile: state.profile,
        application,
        workspace,
      }),
    })
  )
  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.error, "Cle API manquante. Ajoute une cle dans .env.local pour activer la generation IA.")
  assert.equal(fetchCalled, false)

  if (previousAnthropicKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = previousAnthropicKey
  }
  if (previousOpenAIKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousOpenAIKey
  }
  if (previousProvider === undefined) {
    delete process.env.LLM_PROVIDER
  } else {
    process.env.LLM_PROVIDER = previousProvider
  }
  globalThis.fetch = previousFetch
})

test("interview prep sheet creates answer drafts and research prompts locally", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()
  const application = makeApplication("prep-sheet", "hiring_manager_interview", 1)
  const opportunity = makeOpportunity("prep-sheet-job", 88)
  const pack = generateLocalApplicationPack(state.profile, opportunity)
  const workspace = buildInterviewWorkspace({
    application,
    profile: state.profile,
    opportunity,
    applicationPack: pack,
    cvVersion: null,
    linkedContact: null,
    memoryItems: [],
    fallbackTitle: "Operations Lead",
    fallbackCompany: "PrepCo",
  })

  assert.equal(workspace !== null, true)
  assert.equal(workspace.answerDrafts.length >= 5, true)
  assert.equal(workspace.answerDrafts.some((draft) => draft.id === "repositioning"), true)
  assert.equal(workspace.companyResearch.length >= 3, true)
  assert.equal(workspace.interviewerContext.length >= 3, true)
  assert.equal(application.status, "hiring_manager_interview")
})

test("post-interview learning extracts local signals without changing application status", () => {
  const application = makeApplication("post-learning", "recruiter_interview", 1)
  const originalStatus = application.status
  const learning = buildPostInterviewLearning(
    "Bon signal: prochain tour possible. Objection sur le manque d'experience enterprise. Envoyer un email de suivi.",
    "SignalCo"
  )

  assert.equal(learning.sentiment, "mixed")
  assert.equal(learning.signals.length > 0, true)
  assert.equal(learning.objections.length > 0, true)
  assert.equal(learning.followUpSuggestions.length > 0, true)
  assert.equal(learning.tags.includes("post-interview"), true)
  assert.equal(application.status, originalStatus)
})

test("memory intelligence computes insights from real memory items without mutations", () => {
  const items = [
    {
      id: "memory-intel-positive",
      type: "interview_note",
      title: "Entretien positif",
      company: "SignalCo",
      content: "Bon signal sur operations transverses et prochain tour possible.",
      linkedApplicationId: "app-1",
      linkedContactId: null,
      tags: ["interview", "operations"],
      sentiment: "positive",
      createdAt: isoDaysAgo(1),
      updatedAt: isoDaysAgo(1),
    },
    {
      id: "memory-intel-objection",
      type: "rejection",
      title: "Refus",
      company: "ScaleCo",
      content: "Manque d'experience grand groupe et doute sur le scale.",
      linkedApplicationId: null,
      linkedContactId: null,
      tags: ["rejection", "scale"],
      sentiment: "negative",
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2),
    },
  ]
  const before = JSON.stringify(items)
  const intelligence = buildMemoryIntelligence(items)

  assert.equal(intelligence.insights.length >= 2, true)
  assert.equal(intelligence.recurringObjections.length > 0, true)
  assert.equal(intelligence.positivePatterns.length > 0, true)
  assert.equal(intelligence.linkedCoverage.ratio, 50)
  assert.equal(JSON.stringify(items), before)
})

test("learning dashboard computes pipeline and memory signals without mutations", () => {
  const applications = [
    makeApplication("learning-applied", "applied", 6),
    makeApplication("learning-response", "response_received", 5),
    makeApplication("learning-interview", "recruiter_interview", 3),
    makeApplication("learning-rejected", "rejected", 2),
  ]
  const events = [
    makeEvent("learning-applied", "applied", 6, "manual", "applied"),
    makeEvent("learning-response", "response_received", 5, "manual", "response_received"),
    makeEvent("learning-interview", "interview_obtained", 3, "manual", "recruiter_interview"),
    makeEvent("learning-prepared", "prepared_cv", 1, "prepared", null),
  ]
  const memoryItems = [
    {
      id: "learning-memory-positive",
      type: "interview_note",
      title: "Signal positif",
      company: "SignalCo",
      content: "Bon signal sur operations transverses et prochain tour.",
      linkedApplicationId: "learning-interview",
      linkedContactId: null,
      tags: ["interview", "operations"],
      sentiment: "positive",
      createdAt: isoDaysAgo(1),
      updatedAt: isoDaysAgo(1),
    },
    {
      id: "learning-memory-objection",
      type: "rejection",
      title: "Objection scale",
      company: "ScaleCo",
      content: "Refus: manque d'experience grand groupe.",
      linkedApplicationId: null,
      linkedContactId: null,
      tags: ["rejection", "scale"],
      sentiment: "negative",
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2),
    },
  ]
  const before = JSON.stringify({ applications, events, memoryItems })
  const learning = buildLearningDashboard({ applications, applicationEvents: events, memoryItems })

  assert.equal(learning.conversion.applied, 4)
  assert.equal(learning.responseRate, 75)
  assert.equal(learning.interviewRate, 25)
  assert.equal(learning.manualActionCount, 3)
  assert.equal(learning.memoryCoverage, 50)
  assert.equal(learning.strongestSignals.length > 0, true)
  assert.equal(learning.improvementAreas.length > 0, true)
  assert.equal(learning.recommendedActions.length > 0, true)
  assert.equal(JSON.stringify({ applications, events, memoryItems }), before)
})

test("privacy boundaries document api-sent data and local-only data for llm actions", () => {
  const cvBoundary = getDataBoundary("cv-targeting")
  const profileBoundary = getDataBoundary("profile-intelligence")

  assert.equal(cvBoundary.requiresApiKey, true)
  assert.equal(cvBoundary.fallbackAvailable, true)
  assert.equal(cvBoundary.apiSentData.some((item) => item.toLowerCase().includes("profil")), true)
  assert.equal(cvBoundary.notSentData.some((item) => item.toLowerCase().includes("statut")), true)

  assert.equal(profileBoundary.requiresApiKey, true)
  assert.equal(profileBoundary.fallbackAvailable, true)
  assert.equal(profileBoundary.apiSentData.some((item) => item.toLowerCase().includes("cv")), true)
  assert.equal(profileBoundary.notSentData.some((item) => item.toLowerCase().includes("contacts")), true)
})

test("AI global control defaults to disabled without breaking persisted demo data", () => {
  useAppStore.getState().resetDemoData()
  const state = useAppStore.getState()

  assert.equal(state.aiEnabled, false)
  assert.equal(state.aiConsentAcceptedAt, null)
  assert.equal(state.theme, "light")
  assert.equal(state.opportunities.length > 0, true)
  assert.equal(state.applications.length > 0, true)
})

test("AI global control stores consent timestamp and disabling preserves local data", () => {
  useAppStore.getState().resetDemoData()
  const before = useAppStore.getState()
  const beforeApplications = before.applications.length
  const beforeOpportunities = before.opportunities.length

  useAppStore.getState().enableAI()
  const enabled = useAppStore.getState()
  assert.equal(enabled.aiEnabled, true)
  assert.equal(typeof enabled.aiConsentAcceptedAt, "string")

  useAppStore.getState().disableAI()
  const disabled = useAppStore.getState()
  assert.equal(disabled.aiEnabled, false)
  assert.equal(disabled.aiConsentAcceptedAt, enabled.aiConsentAcceptedAt)
  assert.equal(disabled.applications.length, beforeApplications)
  assert.equal(disabled.opportunities.length, beforeOpportunities)
})

test("theme preference is persistable and does not change scoring or pipeline", () => {
  useAppStore.getState().resetDemoData()
  const before = useAppStore.getState()
  const firstScore = before.opportunities[0].score.globalFit
  const firstStatus = before.applications[0].status

  useAppStore.getState().setTheme("dark")
  let themed = useAppStore.getState()
  assert.equal(themed.theme, "dark")
  assert.equal(themed.opportunities[0].score.globalFit, firstScore)
  assert.equal(themed.applications[0].status, firstStatus)

  useAppStore.getState().toggleTheme()
  themed = useAppStore.getState()
  assert.equal(themed.theme, "light")
  assert.equal(themed.opportunities[0].score.globalFit, firstScore)
  assert.equal(themed.applications[0].status, firstStatus)
})

test("pdf-extract: isPDFFile accepts .pdf extension and application/pdf mime", () => {
  const { isPDFFile } = require("../src/lib/pdf-extract.ts")
  assert.equal(isPDFFile({ name: "cv.pdf", type: "application/octet-stream" }), true)
  assert.equal(isPDFFile({ name: "resume.PDF", type: "application/octet-stream" }), true)
  assert.equal(isPDFFile({ name: "resume.docx", type: "application/pdf" }), true)
  assert.equal(isPDFFile({ name: "resume.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), false)
  assert.equal(isPDFFile({ name: "photo.png", type: "image/png" }), false)
})

test("pdf-extract: extractPDFText and PDFExtractError exports exist and error class is correct", () => {
  const pdfExtract = require("../src/lib/pdf-extract.ts")
  assert.equal(typeof pdfExtract.isPDFFile, "function")
  assert.equal(typeof pdfExtract.extractPDFText, "function")
  assert.equal(typeof pdfExtract.PDFExtractError, "function")
  const err = new pdfExtract.PDFExtractError("image_only", "test message")
  assert.equal(err instanceof Error, true)
  assert.equal(err.name, "PDFExtractError")
  assert.equal(err.code, "image_only")
  assert.equal(err.message, "test message")
  const allCodes = ["not_pdf", "empty", "image_only", "parse_error"]
  for (const code of allCodes) {
    const e = new pdfExtract.PDFExtractError(code)
    assert.equal(e.code, code)
  }
})

test("job-scout: parseJobDescriptionHead extracts title and company from a LinkedIn-style paste", () => {
  const { parseJobDescriptionHead } = require("../src/lib/job-scout.ts")
  const text = [
    "Strategy & Operations Manager",
    "Uber",
    "Paris, Île-de-France, France · Hybride · 42 candidats",
    "Il y a 3 jours · 42 candidats",
    "",
    "About the job",
    "We are looking for a Strategy & Operations Manager...",
  ].join("\n")
  const result = parseJobDescriptionHead(text)
  assert.equal(result.title, "Strategy & Operations Manager")
  assert.equal(result.company, "Uber")
})

test("job-scout: parseJobDescriptionHead returns empty strings when description is noise-only", () => {
  const { parseJobDescriptionHead } = require("../src/lib/job-scout.ts")
  const text = [
    "https://www.linkedin.com/jobs/view/12345",
    "Il y a 2 jours · 130 candidats",
    "42 000 € - 60 000 € par an",
    "CDI · Hybride · Paris",
  ].join("\n")
  const result = parseJobDescriptionHead(text)
  assert.equal(result.title, "")
  assert.equal(result.company, "")
})

// Sprint Profile/CV Import Overhaul: local-intelligence

const {
  categorizeSkills,
  buildEvidenceBySkill,
  generateLocalObjections,
  buildLocalPitch,
  computeCompletenessScore,
  buildLocalIntelligence,
} = require("../src/lib/local-intelligence.ts")

test("categorizeSkills groups SQL and Data Analysis into Data & Analyse category", () => {
  const skills = ["SQL", "Data Analysis", "Looker", "Program Management", "Notion"]
  const categories = categorizeSkills(skills)
  const dataCategory = categories.find((c) => c.label === "Data & Analyse")
  assert.equal(dataCategory !== undefined, true)
  assert.equal(dataCategory.skills.includes("SQL"), true)
  assert.equal(dataCategory.skills.includes("Data Analysis"), true)
})

test("categorizeSkills caps each category at 6 skills", () => {
  const skills = ["SQL", "Data Analysis", "Looker", "PowerBI", "Tableau", "Business Intelligence", "Python", "Reporting"]
  const categories = categorizeSkills(skills)
  for (const cat of categories) {
    assert.equal(cat.skills.length <= 6, true)
  }
})

test("categorizeSkills places unrecognized skills into Autres", () => {
  const skills = ["ZapierAutomation", "FigmaDesign", "SQL"]
  const categories = categorizeSkills(skills)
  const others = categories.find((c) => c.label === "Autres")
  assert.equal(others !== undefined, true)
  assert.equal(others.skills.includes("ZapierAutomation"), true)
})

test("categorizeSkills returns empty array for empty skills list", () => {
  const categories = categorizeSkills([])
  assert.equal(categories.length, 0)
})

test("buildEvidenceBySkill maps proof point evidence to the correct skill", () => {
  const profile = {
    ...useAppStore.getState().profile,
    proofPoints: [
      { skill: "SQL", evidence: "Built weekly SQL dashboards for exec team", strength: "strong" },
    ],
    experiences: [],
  }
  const evidence = buildEvidenceBySkill(profile)
  assert.equal(Array.isArray(evidence["SQL"]), true)
  assert.equal(evidence["SQL"][0].includes("SQL dashboards"), true)
})

test("buildEvidenceBySkill extracts evidence from experience achievements when skill appears in text", () => {
  const profile = {
    ...useAppStore.getState().profile,
    skills: ["OKRs"],
    proofPoints: [],
    experiences: [
      {
        id: "exp-test",
        title: "Ops Lead",
        company: "TestCo",
        startDate: "2022-01-01",
        endDate: null,
        description: "",
        achievements: ["Deployed OKRs framework for 3 teams in Q1"],
        keywords: [],
      },
    ],
  }
  const evidence = buildEvidenceBySkill(profile)
  assert.equal(Array.isArray(evidence["OKRs"]), true)
  assert.equal(evidence["OKRs"].some((e) => e.includes("OKRs framework")), true)
})

test("generateLocalObjections flags missing experiences when profile has none", () => {
  const profile = {
    ...useAppStore.getState().profile,
    experiences: [],
    proofPoints: [],
    positioningStatement: "short",
    skills: [],
    missingCriticalInfo: [],
  }
  const objections = generateLocalObjections(profile)
  assert.equal(objections.some((o) => o.toLowerCase().includes("experience")), true)
})

test("generateLocalObjections returns at most 5 items", () => {
  const profile = {
    ...useAppStore.getState().profile,
    experiences: [],
    proofPoints: [],
    positioningStatement: "short",
    skills: [],
    missingCriticalInfo: ["gap1", "gap2", "gap3", "gap4", "gap5"],
  }
  const objections = generateLocalObjections(profile)
  assert.equal(objections.length <= 5, true)
})

test("buildLocalPitch returns positioningStatement when long enough", () => {
  const positioning = "Strategy & Operations Manager avec 8 ans en SaaS B2B specialise en pilotage de programmes complexes."
  const profile = {
    ...useAppStore.getState().profile,
    positioningStatement: positioning,
  }
  const pitch = buildLocalPitch(profile)
  assert.equal(pitch, positioning.trim())
})

test("buildLocalPitch builds fallback pitch from targetTitles and skills when positioning is short", () => {
  const profile = {
    ...useAppStore.getState().profile,
    positioningStatement: "short",
    targetTitles: ["Strategy Manager"],
    skills: ["OKRs", "SQL", "Program Management"],
    targetIndustries: ["SaaS B2B"],
  }
  const pitch = buildLocalPitch(profile)
  assert.equal(pitch.includes("Strategy Manager"), true)
  assert.equal(pitch.includes("OKRs"), true)
})

test("computeCompletenessScore returns 0 for an entirely empty profile", () => {
  const profile = {
    id: "empty",
    name: "",
    targetTitles: [],
    targetIndustries: [],
    preferredLocations: [],
    strengths: [],
    skills: [],
    experiences: [],
    achievements: [],
    proofPoints: [],
    avoidRoles: [],
    positioningStatement: "",
    objections: [],
    missingCriticalInfo: [],
  }
  const score = computeCompletenessScore(profile)
  assert.equal(score, 0)
})

test("computeCompletenessScore returns 100 for a fully filled profile", () => {
  const profile = {
    id: "full",
    name: "Hamza",
    targetTitles: ["Strategy Manager"],
    targetIndustries: ["SaaS B2B"],
    preferredLocations: ["Paris"],
    strengths: ["Execution"],
    skills: ["SQL", "OKRs", "Program Management", "Stakeholder Management", "Data Analysis"],
    experiences: [
      { id: "e1", title: "Ops Lead", company: "Co1", startDate: "2020", endDate: null, description: "", achievements: [], keywords: [] },
      { id: "e2", title: "PM", company: "Co2", startDate: "2018", endDate: "2020", description: "", achievements: [], keywords: [] },
    ],
    achievements: ["Grew ARR by 3x"],
    proofPoints: [{ skill: "SQL", evidence: "Built dashboards", strength: "strong" }],
    avoidRoles: [],
    positioningStatement: "Strategy & Operations Manager with 8 years in SaaS B2B driving cross-functional alignment.",
    objections: [],
    missingCriticalInfo: [],
  }
  const score = computeCompletenessScore(profile)
  assert.equal(score, 100)
})

test("buildLocalIntelligence returns all required fields for demo profile", () => {
  useAppStore.getState().resetDemoData()
  const profile = useAppStore.getState().profile
  const intel = buildLocalIntelligence(profile)
  assert.equal(Array.isArray(intel.categorizedSkills), true)
  assert.equal(typeof intel.evidenceBySkill, "object")
  assert.equal(Array.isArray(intel.localObjections), true)
  assert.equal(typeof intel.localPitch, "string")
  assert.equal(Array.isArray(intel.developmentAxes), true)
  assert.equal(typeof intel.completenessScore, "number")
  assert.equal(intel.completenessScore >= 0 && intel.completenessScore <= 100, true)
})

test("profileSource is set to demo on mockProfile and not overwritten by resetDemoData", () => {
  useAppStore.getState().resetDemoData()
  const profile = useAppStore.getState().profile
  assert.equal(profile.profileSource, "demo")
})

// ─── content-quality guard-rails ──────────────────────────────────────────────

const {
  isLikelyRawCVDump,
  cleanProofPoint,
  cleanAchievement,
  MAX_PROOF_POINT_LENGTH,
  MAX_ACHIEVEMENT_LENGTH,
} = require("../src/lib/content-quality.ts")

const { parseProfileIntelligenceJson } = require("../src/lib/llm/profile-intelligence.ts")

test("isLikelyRawCVDump detects text longer than 350 chars as a dump", () => {
  const longText = "a".repeat(351)
  assert.equal(isLikelyRawCVDump(longText), true)
})

test("isLikelyRawCVDump returns false for a normal short proof point", () => {
  const proof = "Reduit les failed deliveries de 11% via analyse terrain et repositionnement des flux logistiques."
  assert.equal(isLikelyRawCVDump(proof), false)
})

test("isLikelyRawCVDump detects 3 or more year patterns as a dump", () => {
  const multiYear = "Operations Lead 2019-2021, Product Manager 2021-2023, Consultant 2023-present."
  assert.equal(isLikelyRawCVDump(multiYear), true)
})

test("isLikelyRawCVDump detects multiple legal entity suffixes as a dump", () => {
  const multiCompany = "Worked at Acme Inc and BetaCorp Ltd delivering results."
  assert.equal(isLikelyRawCVDump(multiCompany), true)
})

test("isLikelyRawCVDump detects email address as a dump", () => {
  const withEmail = "Contact: hamza@example.com — available immediately."
  assert.equal(isLikelyRawCVDump(withEmail), true)
})

test("isLikelyRawCVDump detects linkedin URL as a dump", () => {
  const withLinkedin = "Profile: linkedin.com/in/hamza — 8 years experience."
  assert.equal(isLikelyRawCVDump(withLinkedin), true)
})

test("cleanProofPoint returns null for a raw CV dump", () => {
  const dump = "a".repeat(400)
  assert.equal(cleanProofPoint(dump), null)
})

test("cleanProofPoint truncates a proof point exceeding MAX_PROOF_POINT_LENGTH", () => {
  const longProof = "Genere " + "a".repeat(MAX_PROOF_POINT_LENGTH)
  const result = cleanProofPoint(longProof)
  assert.ok(result !== null, "should not return null for a long but non-dump text")
  assert.ok(result.length <= MAX_PROOF_POINT_LENGTH, `result length ${result.length} exceeds max ${MAX_PROOF_POINT_LENGTH}`)
  assert.ok(result.endsWith("..."), "truncated text should end with ...")
})

test("cleanProofPoint returns the original text if short and clean", () => {
  const proof = "700 000 EUR d'economies via optimisation des couts logistiques."
  assert.equal(cleanProofPoint(proof), proof)
})

test("cleanProofPoint returns null for empty or blank text", () => {
  assert.equal(cleanProofPoint(""), null)
  assert.equal(cleanProofPoint("   "), null)
})

test("a displayable proof point never exceeds MAX_PROOF_POINT_LENGTH chars", () => {
  const proofs = [
    "Reduit les couts de 15% en 6 mois.",
    "a".repeat(300),
    "Genere 700k EUR d'economies via optimisation des flux.",
    "Operations Lead 2019 at Acme Inc, then 2021 at BetaCorp Ltd, 2023 at GammaGroup SA.",
  ]
  for (const proof of proofs) {
    const cleaned = cleanProofPoint(proof)
    if (cleaned !== null) {
      assert.ok(
        cleaned.length <= MAX_PROOF_POINT_LENGTH,
        `proof point of length ${cleaned.length} exceeds max ${MAX_PROOF_POINT_LENGTH}: "${cleaned.slice(0, 60)}..."`
      )
    }
  }
})

test("parseCVToProfile with 0 experiences despite Experience section has non-strong quality", () => {
  // Simulate a CV that has an EXPERIENCE header but no parseable entries
  const cvWithSectionButNoEntries = `
John Doe
Strategic Consultant

COMPETENCES
Strategy, Finance, Operations, Negotiation, Leadership

EXPERIENCE

EDUCATION
HEC Paris - MBA 2018
`
  const result = parseCVToProfile(cvWithSectionButNoEntries)
  // If hasExperienceSection is true and experiences.length is 0, quality must not be "strong"
  if (result.hasExperienceSection && result.experiences.length === 0) {
    assert.notEqual(
      result.extractionQuality,
      "strong",
      "extractionQuality should not be strong when 0 experiences detected despite Experience section"
    )
  }
})

test("intelligenceToReviewDraft does not crash on minimal or missing fields", () => {
  // Simulate a minimal ProfileIntelligence with missing optional arrays
  const minimalIntel = {
    seniority: "Senior",
    seniorityConfidence: "medium",
    targetRoleFamilies: [],
    avoidRoleFamilies: [],
    sectorFit: [],
    coreStrengths: [],
    impactProofs: [],
    likelyObjections: [],
    pitch: { short: "", recruiter: "", interview: "" },
    starExamples: [],
    atsKeywords: [],
    progressionAxes: [],
    source: "llm_reviewed",
  }

  // Run the same mapping logic used in onboarding/page.tsx
  function intelligenceToReviewDraftLocal(intel) {
    return {
      name: "",
      targetTitles: (intel.targetRoleFamilies ?? []).join(", "),
      skills: (intel.coreStrengths ?? []).join(", "),
      positioningStatement: intel.pitch?.short ?? "",
      experiences: [],
      proofPoints: (intel.impactProofs ?? [])
        .map((text) => cleanProofPoint(text))
        .filter((text) => text !== null)
        .map((text) => ({ text, linkedSkill: "", keep: true })),
    }
  }

  const draft = intelligenceToReviewDraftLocal(minimalIntel)
  assert.equal(draft.name, "")
  assert.equal(draft.targetTitles, "")
  assert.equal(draft.skills, "")
  assert.equal(draft.positioningStatement, "")
  assert.deepEqual(draft.experiences, [])
  assert.deepEqual(draft.proofPoints, [])
})

test("intelligenceToReviewDraft does not crash when pitch is missing", () => {
  const intelWithoutPitch = {
    seniority: "Mid",
    seniorityConfidence: "low",
    targetRoleFamilies: ["Product Manager"],
    avoidRoleFamilies: [],
    sectorFit: ["Tech"],
    coreStrengths: ["Product Strategy", "Roadmap"],
    impactProofs: ["Launched feature used by 50k users."],
    likelyObjections: [],
    pitch: null,
    starExamples: [],
    atsKeywords: ["Agile", "OKRs"],
    progressionAxes: [],
    source: "llm_reviewed",
  }

  function intelligenceToReviewDraftLocal(intel) {
    return {
      name: "",
      targetTitles: (intel.targetRoleFamilies ?? []).join(", "),
      skills: (intel.coreStrengths ?? []).join(", "),
      positioningStatement: intel.pitch?.short ?? "",
      experiences: [],
      proofPoints: (intel.impactProofs ?? [])
        .map((text) => cleanProofPoint(text))
        .filter((text) => text !== null)
        .map((text) => ({ text, linkedSkill: "", keep: true })),
    }
  }

  let draft
  assert.doesNotThrow(() => {
    draft = intelligenceToReviewDraftLocal(intelWithoutPitch)
  })
  assert.equal(draft.positioningStatement, "")
  assert.equal(draft.proofPoints.length, 1)
})

test("local fallback does not retain proof points that are raw CV dumps", () => {
  const cvWithLongBullets = `
Marie Dupont
Operations Director

COMPETENCES
Strategy, Operations, Finance, Logistics, Leadership, Excel, SQL, PowerBI, Tableau, JIRA

EXPERIENCE
Operations Director - Acme Corp 2020-2023
- Managed team of 15 across 4 countries including France Germany Spain Italy with a budget of 2M EUR and reduced costs by 12% over 3 years through process improvement and vendor renegotiation. Also responsible for quarterly reporting to C-suite and board presentations twice per year. Led digital transformation initiative spanning ERP CRM and WMS platforms with 40 external stakeholders and 3 system integrators. Generated 700000 EUR savings in year one.
- Standard short bullet with a 15% metric.

EDUCATION
Sciences Po Paris 2015
`
  const result = parseCVToProfile(cvWithLongBullets)

  // Apply the same cleanProofPoint filter used in onboarding
  const cleanedProofPoints = result.proofPoints
    .map((pp) => cleanProofPoint(pp.text))
    .filter((t) => t !== null)

  for (const proof of cleanedProofPoints) {
    assert.ok(
      proof.length <= MAX_PROOF_POINT_LENGTH,
      `Proof point exceeds max length after cleaning: "${proof.slice(0, 80)}..."`
    )
  }
})

// ─── cleanAchievement + structuredExperiences ─────────────────────────────────

test("cleanAchievement returns null for empty or blank text", () => {
  assert.equal(cleanAchievement(""), null)
  assert.equal(cleanAchievement("   "), null)
})

test("cleanAchievement returns null for raw CV dump", () => {
  const dump = "Managed team at Acme Inc then moved to BetaCorp Ltd, 2019-2021 then 2021-2023, handled budgets."
  assert.equal(cleanAchievement(dump), null)
})

test("cleanAchievement truncates achievement exceeding MAX_ACHIEVEMENT_LENGTH", () => {
  const long = "Reduit les couts de 15% en optimisant " + "a".repeat(MAX_ACHIEVEMENT_LENGTH)
  const result = cleanAchievement(long)
  assert.ok(result !== null, "should not return null for a long but valid text")
  assert.ok(result.length <= MAX_ACHIEVEMENT_LENGTH, `length ${result.length} exceeds max ${MAX_ACHIEVEMENT_LENGTH}`)
  assert.ok(result.endsWith("..."), "should end with ...")
})

test("cleanAchievement returns original text when short and clean", () => {
  const short = "Reduit les couts logistiques de 12% en 6 mois."
  assert.equal(cleanAchievement(short), short)
})

test("parseProfileIntelligenceJson maps structuredExperiences from LLM output", () => {
  const json = JSON.stringify({
    seniority: "Senior Manager",
    seniorityConfidence: "high",
    targetRoleFamilies: ["Operations Director"],
    avoidRoleFamilies: [],
    sectorFit: ["Tech", "Finance"],
    coreStrengths: ["Leadership", "Process Optimization"],
    impactProofs: ["Reduit les couts de 500k EUR."],
    likelyObjections: ["Pas de titre VP"],
    pitch: { short: "Expert ops.", recruiter: "Recruteur pitch.", interview: "Entretien pitch." },
    starExamples: [],
    atsKeywords: ["OKRs", "SQL"],
    progressionAxes: ["VP Operations"],
    structuredExperiences: [
      {
        company: "Acme Corp",
        title: "Operations Lead",
        startYear: "2021",
        endYear: "2023",
        isCurrent: false,
        description: "Dirige l'equipe ops sur 3 pays.",
        achievements: ["Reduit les couts de 15%.", "Manage une equipe de 10 personnes."],
      },
      {
        company: "BetaCorp",
        title: "Project Manager",
        startYear: "2018",
        endYear: "2021",
        isCurrent: false,
        description: "Gestion de projets transverses.",
        achievements: ["Livre 3 projets dans les delais.", "Reduit les delais de livraison de 20%."],
      },
    ],
    source: "llm_reviewed",
  })

  const result = parseProfileIntelligenceJson(json)
  assert.ok(result !== null, "should parse successfully")
  assert.ok(Array.isArray(result.structuredExperiences), "structuredExperiences should be an array")
  assert.equal(result.structuredExperiences.length, 2, "should have 2 experiences")
  assert.equal(result.structuredExperiences[0].company, "Acme Corp")
  assert.equal(result.structuredExperiences[0].title, "Operations Lead")
  assert.equal(result.structuredExperiences[0].startYear, "2021")
  assert.equal(result.structuredExperiences[0].endYear, "2023")
  assert.equal(result.structuredExperiences[0].isCurrent, false)
  assert.equal(result.structuredExperiences[0].achievements.length, 2)
  assert.equal(result.structuredExperiences[1].company, "BetaCorp")
})

test("parseProfileIntelligenceJson handles missing structuredExperiences gracefully", () => {
  const json = JSON.stringify({
    seniority: "Senior",
    seniorityConfidence: "medium",
    targetRoleFamilies: ["Manager"],
    avoidRoleFamilies: [],
    sectorFit: [],
    coreStrengths: ["Leadership"],
    impactProofs: [],
    likelyObjections: [],
    pitch: { short: "Expert.", recruiter: "Pitch.", interview: "Pitch." },
    starExamples: [],
    atsKeywords: [],
    progressionAxes: [],
    source: "llm_reviewed",
    // structuredExperiences intentionally absent
  })

  let result
  assert.doesNotThrow(() => { result = parseProfileIntelligenceJson(json) })
  assert.ok(result !== null)
  assert.ok(result.structuredExperiences === undefined || Array.isArray(result.structuredExperiences))
})

test("normalizer rejects experience entry with both company and title empty", () => {
  const json = JSON.stringify({
    seniority: "Mid",
    seniorityConfidence: "low",
    targetRoleFamilies: ["Analyst"],
    avoidRoleFamilies: [],
    sectorFit: [],
    coreStrengths: [],
    impactProofs: [],
    likelyObjections: [],
    pitch: { short: ".", recruiter: ".", interview: "." },
    starExamples: [],
    atsKeywords: [],
    progressionAxes: [],
    structuredExperiences: [
      { company: "", title: "", startYear: "", endYear: "", isCurrent: false, description: "", achievements: [] },
      { company: "Acme", title: "Analyst", startYear: "2020", endYear: "2022", isCurrent: false, description: "Role.", achievements: ["Delivered on time."] },
    ],
    source: "llm_reviewed",
  })

  const result = parseProfileIntelligenceJson(json)
  assert.ok(result !== null)
  // empty company+title entry should be filtered out
  assert.equal(result.structuredExperiences.length, 1)
  assert.equal(result.structuredExperiences[0].company, "Acme")
})

test("normalizer filters out achievements longer than 250 chars from LLM response", () => {
  const longAchievement = "Achieved ".repeat(40) // >250 chars
  const json = JSON.stringify({
    seniority: "Senior",
    seniorityConfidence: "high",
    targetRoleFamilies: ["Director"],
    avoidRoleFamilies: [],
    sectorFit: [],
    coreStrengths: [],
    impactProofs: [],
    likelyObjections: [],
    pitch: { short: ".", recruiter: ".", interview: "." },
    starExamples: [],
    atsKeywords: [],
    progressionAxes: [],
    structuredExperiences: [
      {
        company: "Acme",
        title: "Director",
        startYear: "2020",
        endYear: "2023",
        isCurrent: false,
        description: "Led ops.",
        achievements: [longAchievement, "Reduit les couts de 12%."],
      },
    ],
    source: "llm_reviewed",
  })

  const result = parseProfileIntelligenceJson(json)
  assert.ok(result !== null)
  const achievements = result.structuredExperiences[0].achievements
  // long achievement (>250 chars) should be filtered at normalizer level
  for (const a of achievements) {
    assert.ok(a.length <= 250, `achievement of length ${a.length} should have been filtered`)
  }
  // short achievement should be kept
  assert.ok(achievements.some((a) => a.includes("12%")))
})

test("experience without dates does not crash the normalizer", () => {
  const json = JSON.stringify({
    seniority: "Junior",
    seniorityConfidence: "low",
    targetRoleFamilies: ["Analyst"],
    avoidRoleFamilies: [],
    sectorFit: [],
    coreStrengths: [],
    impactProofs: [],
    likelyObjections: [],
    pitch: { short: ".", recruiter: ".", interview: "." },
    starExamples: [],
    atsKeywords: [],
    progressionAxes: [],
    structuredExperiences: [
      { company: "Startup", title: "Dev", startYear: "", endYear: "", isCurrent: true, description: "", achievements: [] },
    ],
    source: "llm_reviewed",
  })

  let result
  assert.doesNotThrow(() => { result = parseProfileIntelligenceJson(json) })
  assert.ok(result !== null)
  assert.equal(result.structuredExperiences[0].company, "Startup")
  assert.equal(result.structuredExperiences[0].startYear, "")
  assert.equal(result.structuredExperiences[0].isCurrent, true)
})

let passed = 0;

(async () => {
  for (const { name, fn } of tests) {
    try {
      await fn()
      passed += 1
      console.log(`ok - ${name}`)
    } catch (error) {
      console.error(`not ok - ${name}`)
      console.error(error)
      process.exitCode = 1
      break
    }
  }

  if (process.exitCode !== 1) {
    console.log(`\n${passed}/${tests.length} business-rule checks passed.`)
  }
})()
