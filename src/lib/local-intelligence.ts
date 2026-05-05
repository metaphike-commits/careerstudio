import type { UserProfile } from "@/types"

export interface SkillCategory {
  label: string
  skills: string[]
}

export interface LocalIntelligence {
  categorizedSkills: SkillCategory[]
  evidenceBySkill: Record<string, string[]>
  localObjections: string[]
  localPitch: string
  developmentAxes: string[]
  completenessScore: number
}

const SKILL_CATEGORY_MAP: { label: string; keywords: string[] }[] = [
  {
    label: "Strategy & Pilotage",
    keywords: [
      "strategy", "okrs", "kpis", "roadmap", "change management", "governance",
      "business strategy", "head of strategy", "forecasting", "budget",
    ],
  },
  {
    label: "Data & Analyse",
    keywords: [
      "sql", "data analysis", "looker", "powerbi", "tableau",
      "business intelligence", "python", "reporting",
    ],
  },
  {
    label: "Operations & Process",
    keywords: [
      "process design", "process improvement", "program management", "project management",
      "gestion de projet", "business operations", "operations", "product operations",
      "revenue operations", "revops",
    ],
  },
  {
    label: "Outils & Plateformes",
    keywords: ["notion", "jira", "asana", "excel"],
  },
  {
    label: "Methodologies",
    keywords: ["agile", "scrum", "lean"],
  },
  {
    label: "Marche & Croissance",
    keywords: ["go-to-market", "gtm", "scale-up", "saas", "marketplace"],
  },
  {
    label: "Collaboration & Leadership",
    keywords: [
      "stakeholder management", "cross-functional", "chief of staff",
      "team management", "people management", "leadership",
    ],
  },
]

const MAX_SKILLS_PER_CATEGORY = 6

function normSkill(s: string): string {
  return s.toLowerCase().trim()
}

function skillMatchesCategory(skill: string, keywords: string[]): boolean {
  const norm = normSkill(skill)
  return keywords.some((kw) => norm.includes(kw) || kw.includes(norm))
}

export function categorizeSkills(skills: string[]): SkillCategory[] {
  const assigned = new Set<string>()
  const categories: SkillCategory[] = []

  for (const cat of SKILL_CATEGORY_MAP) {
    const matched = skills.filter((s) => {
      if (assigned.has(normSkill(s))) return false
      return skillMatchesCategory(s, cat.keywords)
    })
    if (matched.length > 0) {
      matched.forEach((s) => assigned.add(normSkill(s)))
      categories.push({ label: cat.label, skills: matched.slice(0, MAX_SKILLS_PER_CATEGORY) })
    }
  }

  const others = skills.filter((s) => !assigned.has(normSkill(s)))
  if (others.length > 0) {
    categories.push({ label: "Autres", skills: others.slice(0, MAX_SKILLS_PER_CATEGORY) })
  }

  return categories
}

export function buildEvidenceBySkill(profile: UserProfile): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  for (const pp of profile.proofPoints) {
    if (!pp.evidence) continue
    if (!result[pp.skill]) result[pp.skill] = []
    if (!result[pp.skill].includes(pp.evidence)) {
      result[pp.skill].push(pp.evidence)
    }
  }

  for (const exp of profile.experiences) {
    for (const achievement of exp.achievements) {
      const achLower = achievement.toLowerCase()
      for (const skill of profile.skills) {
        if (achLower.includes(skill.toLowerCase())) {
          if (!result[skill]) result[skill] = []
          if (!result[skill].includes(achievement)) {
            result[skill].push(achievement)
          }
        }
      }
    }
  }

  return result
}

export function generateLocalObjections(profile: UserProfile): string[] {
  const objections: string[] = []

  if (profile.experiences.length === 0) {
    objections.push("Aucune experience professionnelle renseignee")
  } else if (profile.experiences.length < 2) {
    objections.push("Peu d'experiences detaillees — renforce le CV maitre")
  }

  const strongProofs = profile.proofPoints.filter((pp) => pp.strength === "strong")
  if (strongProofs.length < 2) {
    objections.push("Peu de preuves chiffrees — ajoute des metriques concretes")
  }

  if (!profile.positioningStatement || profile.positioningStatement.trim().length < 30) {
    objections.push("Positionnement peu differenciant — affine ton angle")
  }

  if (profile.skills.length < 5) {
    objections.push("Peu de competences techniques referencees")
  }

  if (profile.missingCriticalInfo.length > 0) {
    for (const info of profile.missingCriticalInfo.slice(0, 2)) {
      objections.push(info)
    }
  }

  return objections.slice(0, 5)
}

export function buildLocalPitch(profile: UserProfile): string {
  if (profile.positioningStatement && profile.positioningStatement.trim().length >= 30) {
    return profile.positioningStatement.trim()
  }
  const title = profile.targetTitles[0] ?? "professionnel"
  const topSkills = profile.skills.slice(0, 3).join(", ")
  const sector = profile.targetIndustries[0] ?? "secteur tech"
  return `${title} specialise en ${topSkills}, avec une experience en ${sector}.`
}

export function generateDevelopmentAxes(profile: UserProfile): string[] {
  const axes: string[] = []

  const hasData = profile.skills.some((s) => {
    const n = s.toLowerCase()
    return n.includes("sql") || n.includes("data") || n.includes("python")
  })
  if (!hasData) {
    axes.push("Renforcer les competences data (SQL, Analytics)")
  }

  const hasDetailedExp = profile.experiences.some((e) => e.achievements.length >= 2)
  if (!hasDetailedExp && profile.experiences.length > 0) {
    axes.push("Documenter les realisations chiffrees par experience")
  }

  const strongProofCount = profile.proofPoints.filter((pp) => pp.strength === "strong").length
  if (strongProofCount < 3) {
    axes.push("Consolider 3 preuves d'impact fortes avec metriques")
  }

  return axes.slice(0, 3)
}

export function computeCompletenessScore(profile: UserProfile): number {
  let score = 0
  if (profile.name?.trim()) score += 10
  if (profile.targetTitles.length > 0) score += 10
  if (profile.skills.length >= 5) score += 10
  if (profile.experiences.length >= 1) score += 15
  if (profile.experiences.length >= 2) score += 5
  if (profile.positioningStatement?.trim().length >= 30) score += 10
  if (profile.proofPoints.length >= 1) score += 10
  if (profile.strengths.length >= 1) score += 10
  if (profile.targetIndustries.length > 0) score += 10
  if (profile.preferredLocations.length > 0) score += 5
  if (profile.achievements.length >= 1) score += 5
  return Math.min(100, score)
}

export function buildLocalIntelligence(profile: UserProfile): LocalIntelligence {
  return {
    categorizedSkills: categorizeSkills(profile.skills),
    evidenceBySkill: buildEvidenceBySkill(profile),
    localObjections: generateLocalObjections(profile),
    localPitch: buildLocalPitch(profile),
    developmentAxes: generateDevelopmentAxes(profile),
    completenessScore: computeCompletenessScore(profile),
  }
}
