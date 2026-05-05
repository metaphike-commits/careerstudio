// ---------------------------------------------------------------------------
// S&O keyword lists — single source of truth
//
// Two separate exports are intentional:
//   OPS_SCORING_KEYWORDS — used as a denominator in local-scoring.ts.
//     Must NOT change length without re-calibrating score weights.
//   SO_SCOUT_SKILLS — used for keyword preview in job-scout.ts.
//     Can be extended freely without affecting scores.
// ---------------------------------------------------------------------------

/** 21 S&O scoring terms. Length is part of the scoring formula — do not add/remove. */
export const OPS_SCORING_KEYWORDS: readonly string[] = [
  "Strategy & Operations",
  "Business Operations",
  "Program Management",
  "Operations Excellence",
  "Chief of Staff",
  "Cross-functional",
  "Stakeholder Management",
  "Process Design",
  "Reporting",
  "KPIs",
  "OKRs",
  "Data Analysis",
  "SQL",
  "Scale-up",
  "SaaS B2B",
  "Marketplace",
  "COO",
  "Board",
  "Governance",
  "Change Management",
  "Continuous Improvement",
]

/** 40 S&O scout skills for keyword preview. Extend freely. */
export const SO_SCOUT_SKILLS: readonly string[] = [
  "OKRs",
  "KPIs",
  "Reporting",
  "Cross-functional",
  "Program Management",
  "Project Management",
  "Stakeholder Management",
  "SQL",
  "Python",
  "Strategy",
  "Operations",
  "Business Operations",
  "Data Analysis",
  "Change Management",
  "Budget",
  "Forecasting",
  "Roadmap",
  "Go-to-market",
  "Chief of Staff",
  "Business Intelligence",
  "Product Operations",
  "Revenue Operations",
  "RevOps",
  "Team Management",
  "Leadership",
  "Lean",
  "Agile",
  "Scrum",
  "Excel",
  "PowerBI",
  "Tableau",
  "Looker",
  "Notion",
  "JIRA",
  "Asana",
  "SaaS",
  "Scale-up",
  "Process Design",
  "Process Improvement",
  "Governance",
]
