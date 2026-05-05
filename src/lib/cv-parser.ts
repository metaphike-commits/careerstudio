import type { Experience, UserProfile } from "@/types"

export type Confidence = "high" | "medium" | "inferred" | "missing"

export interface ConfidentValue<T> {
  value: T | null
  confidence: Confidence
}

export interface ParsedExperience {
  company: string
  title: string
  startYear: number | null
  endYear: number | null
  isCurrent: boolean
  rawLine: string
  description: string
  achievements: string[]
}

export interface CandidateProofPoint {
  text: string
  linkedSkill: string | null
  confidence: Confidence
  source: "extracted_from_cv"
  status: "to_review"
}

export interface ParsedCV {
  name: ConfidentValue<string>
  targetTitles: ConfidentValue<string[]>
  skills: string[]
  positioningStatement: ConfidentValue<string>
  experiences: ParsedExperience[]
  proofPoints: CandidateProofPoint[]
  extractionQuality: "strong" | "partial" | "weak"
  rawText: string
  hasExperienceSection: boolean
}

const SO_SKILLS = [
  "OKRs",
  "KPIs",
  "Reporting",
  "Cross-functional",
  "Program Management",
  "Project Management",
  "Gestion de projet",
  "Stakeholder Management",
  "Process Design",
  "Process Improvement",
  "SQL",
  "Notion",
  "JIRA",
  "Asana",
  "Looker",
  "PowerBI",
  "Tableau",
  "Strategy",
  "Operations",
  "Business Operations",
  "Data Analysis",
  "Change Management",
  "Governance",
  "Budget",
  "Forecasting",
  "Roadmap",
  "Go-to-market",
  "GTM",
  "Scale-up",
  "SaaS",
  "Marketplace",
  "Chief of Staff",
  "Business Intelligence",
  "Python",
  "Product Operations",
  "Revenue Operations",
  "RevOps",
  "Team Management",
  "People Management",
  "Leadership",
  "Lean",
  "Agile",
  "Scrum",
  "Excel",
]

const TARGET_TITLE_KEYWORDS = [
  "Strategy",
  "Operations",
  "Chief of Staff",
  "Program Manager",
  "Strategie",
  "Business Operations",
  "Head of Operations",
  "Director of Operations",
  "Operations Manager",
  "Strategy Manager",
  "Head of Strategy",
  "Business Strategy",
  "Operations Lead",
]

const LABEL_HEADER_RE = /^(nom|name|email|tel|linkedin|github|adresse|address|phone|mobile)\s*:/i

const POSITIONING_HEADER_RE =
  /^(profil|profile|summary|resume|a propos|about|presentation|introduction|objectif|objective)\s*:?$/i

const ROLE_KEYWORD_RE =
  /\b(manager|lead|head|director|chief|senior|analyst|consultant|officer|engineer|coordinator|specialist)\b/i

const METRIC_RE =
  /([+\-]\d+[\s]*%|\d+[\s]*%|\d+[\s,.]?\d*[\s]*(?:m€|k€|mn€|m\$|k\$|€|\$|£|million|milliards?|bn|billion)|[€$£]\s*\d+[\s,.]?\d*|\d+[\s]*x\b|\d+[+]?[\s]+(?:personnes?|employe\w*|collaborateur\w*|teams?\b|equipes?\b|utilisateurs?|clients?\b|users?\b|pays\b|sites?\b|countries\b|country\b|villes?\b|membres?\b|stakeholders?|people\b|colleagues?\b)|\d+[\s]+(?:mois\b|ans?\b|years?\b|months?\b|semaines?\b|weeks?\b|jours?\b|days?\b|heures?\b|hours?\b))/i

const IMPACT_VERB_RE =
  /\b(launched?|built?|created?|designed?|delivered?|managed?|led\b|leads?\b|reduced?|increased?|improved?|automated?|structured?|deployed?|scaled?|coordinated?|streamlined?|accelerated?|optimized?|optimised?|saved?\b|grew\b|grown\b|achieved?|implemented?|developed?|raised?|generated?|eliminated?|boosted?|doubled?|tripled?|transformed?|piloted?|reorganized?|lance[er]?\w*|gere\w*|dirige\w*|redui\w*|augmente\w*|ameliore\w*|automatise\w*|structure\w*|deploye\w*|coordonne\w*|optimise\w*|realise\w*|developpe\w*|genere\w*|economise\w*|accelere\w*|croissance\b|hausse\b|baisse\b|progression\b|amelioration\b|augmentation\b)\b/i

// French + English month names (full and abbreviated) for date parsing
const MONTHS_PAT =
  "(?:janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre" +
  "|january|february|march|april|may|june|july|august|september|october|november|december" +
  "|jan|f[eé]v|mar|avr|jun|jul|sep|oct|nov|d[eé]c|feb|aug)"

// "Company, Title · Month YYYY - Month YYYY (optional trailing text)"
const EXPERIENCE_HEADER_RE = new RegExp(
  `^(.+?),\\s+(.+?)\\s*[·•]\\s*(${MONTHS_PAT}\\s+\\d{4})\\s*[-–]\\s*(${MONTHS_PAT}\\s+\\d{4}|present|aujourd.?hui|current|now|en cours|actuell\\w*)(.*)$`,
  "i"
)

const EXPERIENCE_SECTION_RE =
  /^(experiences?|parcours professionnel|professional experience|work experience|emplois?|carriere|career)$/i

const STOP_SECTION_RE =
  /^(education|formation|etudes?|diplomes?|certifications?|competences?|skills?|langues?|languages?|centres? d.interets?|interests?|references?|projets?|publications?|benevolat|volunteer)$/i

function stripMarkdown(line: string): string {
  return line
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^>\s*/, "")
    .replace(/^-{3,}$/, "")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function includesTerm(haystack: string, term: string): boolean {
  const parts = normalizeText(term).split(/\s+/).filter(Boolean)
  return parts.every((part) => haystack.includes(part))
}

function looksLikeName(line: string): boolean {
  const cleaned = line.trim()
  if (cleaned.length < 3 || cleaned.length > 60) return false
  if (/[@\d:;/\\]/.test(cleaned)) return false
  if (LABEL_HEADER_RE.test(cleaned)) return false
  const words = cleaned.split(/\s+/)
  if (words.length < 2 || words.length > 5) return false
  return words.every((w) => /^[A-ZÀ-ÖØ-Þ]/.test(w))
}

function extractName(lines: string[]): ConfidentValue<string> {
  for (const line of lines.slice(0, 20)) {
    const match = line.match(/^(?:nom|name)\s*:\s*(.+)/i)
    if (match) return { value: match[1].trim(), confidence: "high" }
  }
  const nonEmpty = lines.filter((l) => l.trim().length > 0).slice(0, 6)
  for (const line of nonEmpty) {
    if (looksLikeName(line.trim())) return { value: line.trim(), confidence: "high" }
  }
  return { value: null, confidence: "missing" }
}

function extractSkills(fullText: string): string[] {
  return SO_SKILLS.filter((skill) => includesTerm(fullText, skill))
}

function extractTargetTitles(fullText: string): ConfidentValue<string[]> {
  const found = TARGET_TITLE_KEYWORDS.filter((title) => includesTerm(fullText, title))
  if (found.length === 0) return { value: [], confidence: "missing" }
  if (found.length >= 2) return { value: found, confidence: "high" }
  return { value: found, confidence: "medium" }
}

function extractPositioning(lines: string[]): ConfidentValue<string> {
  for (let i = 0; i < lines.length; i++) {
    if (POSITIONING_HEADER_RE.test(normalizeText(lines[i].trim()))) {
      const paragraphLines: string[] = []
      for (let j = i + 1; j < lines.length && j < i + 8; j++) {
        const line = lines[j].trim()
        if (line === "") {
          if (paragraphLines.length > 0) break
          continue
        }
        if (/^[A-Z\s]{4,}$/.test(line) && line.length < 40) break
        paragraphLines.push(line)
      }
      if (paragraphLines.length > 0) {
        return { value: paragraphLines.join(" "), confidence: "high" }
      }
    }
  }
  for (let i = 0; i < lines.length; i++) {
    if (/^(je suis|i am)\s/i.test(lines[i].trim())) {
      let extended = lines[i].trim()
      for (let j = i + 1; j < lines.length && j < i + 5; j++) {
        const next = lines[j].trim()
        if (next === "") break
        extended += " " + next
      }
      return { value: extended, confidence: "high" }
    }
  }
  return { value: null, confidence: "missing" }
}

interface ExperienceParser {
  re: RegExp
  titleFirst: boolean
}

const EXPERIENCE_PARSERS: ExperienceParser[] = [
  {
    re: /^(.+?)\s*[@·]\s*(.+?)\s*[·(]\s*(\d{4})\s*[-–]\s*(\d{4}|present|current|now|aujourd'?hui)/i,
    titleFirst: true,
  },
  {
    re: /^(.+?)\s*[-–]\s*(.+?)\s*\((\d{4})\s*[-–]\s*(\d{4}|present|current|now)/i,
    titleFirst: false,
  },
  {
    re: /^(.+?)\s*\|\s*(.+?)\s*\|\s*(\d{4})\s*[-–]\s*(\d{4}|present|current|now)$/i,
    titleFirst: true,
  },
]

function isCurrentMarker(str: string): boolean {
  return /^(present|current|now|aujourd|en cours|actuell)/i.test(str.trim())
}

function parseYear(str: string): number | null {
  const n = parseInt(str, 10)
  return isNaN(n) ? null : n
}

function parseMonthYear(str: string): number | null {
  const match = str.match(/\d{4}/)
  return match ? parseInt(match[0], 10) : null
}

function extractExperiences(lines: string[]): { experiences: ParsedExperience[]; hasExperienceSection: boolean } {
  const found: ParsedExperience[] = []
  let hasExperienceSection = false
  let inExperienceSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const normalized = normalizeText(line)

    if (EXPERIENCE_SECTION_RE.test(normalized)) {
      hasExperienceSection = true
      inExperienceSection = true
      continue
    }

    if (STOP_SECTION_RE.test(normalized)) {
      if (hasExperienceSection) inExperienceSection = false
      continue
    }

    // In section-aware mode: only parse lines inside the experience section.
    // In full-scan mode (no section found): parse all lines.
    const shouldProcess = hasExperienceSection ? inExperienceSection : true
    if (!shouldProcess) continue

    // Skip bullet lines in the outer loop — they are collected in the inner loop
    if (/^[-•*]\s/.test(line)) continue

    // Primary: "Company, Title · Month YYYY - Month YYYY"
    const headerMatch = EXPERIENCE_HEADER_RE.exec(line)
    if (headerMatch) {
      const [, company, title, startStr, endStr] = headerMatch
      const achievements: string[] = []

      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j]
        if (!next.trim()) continue
        const nextNorm = normalizeText(next)
        if (EXPERIENCE_HEADER_RE.test(next)) break
        if (EXPERIENCE_SECTION_RE.test(nextNorm)) break
        if (STOP_SECTION_RE.test(nextNorm)) break
        if (EXPERIENCE_PARSERS.some(({ re }) => re.test(next.replace(/^[-*•·>]\s*/, "").trim()))) break
        if (/^[-•*]\s/.test(next)) {
          achievements.push(next.replace(/^[-•*]\s+/, "").trim())
        } else {
          achievements.push(next.trim())
        }
      }

      const isCurrent = isCurrentMarker(endStr)
      found.push({
        company: company.trim(),
        title: title.trim(),
        startYear: parseMonthYear(startStr),
        endYear: isCurrent ? null : parseMonthYear(endStr),
        isCurrent,
        rawLine: line,
        description: achievements.length > 0 ? achievements[0] : "",
        achievements,
      })
      continue
    }

    // Fallback: existing year-range patterns
    const cleaned = line.replace(/^[-*•·>]\s*/, "").trim()
    if (cleaned.length < 8) continue

    for (const { re, titleFirst } of EXPERIENCE_PARSERS) {
      const match = cleaned.match(re)
      if (match) {
        const [, partA, partB, startStr, endStr] = match
        const title = titleFirst ? partA.trim() : partB.trim()
        const company = titleFirst ? partB.trim() : partA.trim()
        const titleLooksRight = ROLE_KEYWORD_RE.test(title)
        const companyLooksWrong = ROLE_KEYWORD_RE.test(company)
        let finalTitle = title
        let finalCompany = company
        if (!titleLooksRight && companyLooksWrong) {
          finalTitle = company
          finalCompany = title
        }
        const isCurrent = isCurrentMarker(endStr)
        found.push({
          company: finalCompany,
          title: finalTitle,
          startYear: parseYear(startStr),
          endYear: isCurrent ? null : parseYear(endStr),
          isCurrent,
          rawLine: cleaned,
          description: "",
          achievements: [],
        })
        break
      }
    }
  }

  return { experiences: found, hasExperienceSection }
}

function extractProofPoints(lines: string[]): CandidateProofPoint[] {
  const found: CandidateProofPoint[] = []
  for (const line of lines) {
    const cleaned = line.replace(/^[-*•·>\s]+/, "").trim()
    if (cleaned.length < 15) continue
    if (/^[A-Z\s]{3,40}$/.test(cleaned)) continue

    const normalized = normalizeText(cleaned)
    if (!METRIC_RE.test(cleaned) && !METRIC_RE.test(normalized)) continue
    if (!IMPACT_VERB_RE.test(normalized)) continue

    const isExperienceHeader =
      EXPERIENCE_PARSERS.some(({ re }) => cleaned.match(re)) || EXPERIENCE_HEADER_RE.test(cleaned)
    if (isExperienceHeader) continue

    const linkedSkill = SO_SKILLS.find((skill) => includesTerm(normalized, skill)) ?? null

    const hasStrongMetric = /[+\-]?\d+[\s]*%|\d+[\s,.]?\d*[\s]*(?:m€|k€|€|\$|£|million)/i.test(cleaned)
    const confidence: Confidence = hasStrongMetric ? "high" : "medium"

    found.push({
      text: cleaned,
      linkedSkill,
      confidence,
      source: "extracted_from_cv",
      status: "to_review",
    })
  }
  return found
}

function assessExtractionQuality(
  name: ConfidentValue<string>,
  skills: string[],
  experiences: ParsedExperience[],
): "strong" | "partial" | "weak" {
  const hasName = name.value !== null
  const hasSkills = skills.length >= 5
  const hasExperiences = experiences.length >= 1
  if (hasName && hasSkills && hasExperiences) return "strong"
  if (hasSkills || hasExperiences || hasName) return "partial"
  return "weak"
}

const EMPTY_PARSED_CV: Omit<ParsedCV, "rawText"> = {
  name: { value: null, confidence: "missing" },
  targetTitles: { value: [], confidence: "missing" },
  skills: [],
  positioningStatement: { value: null, confidence: "missing" },
  experiences: [],
  proofPoints: [],
  extractionQuality: "weak",
  hasExperienceSection: false,
}

export function parseCVToProfile(rawText: string): ParsedCV {
  try {
    if (!rawText || rawText.trim().length === 0) {
      return { ...EMPTY_PARSED_CV, rawText: "" }
    }
    const lines = rawText.split(/\r?\n/).map(stripMarkdown)
    const fullText = normalizeText(rawText)
    const name = extractName(lines)
    const targetTitles = extractTargetTitles(fullText)
    const skills = extractSkills(fullText)
    const positioningStatement = extractPositioning(lines)
    const { experiences, hasExperienceSection } = extractExperiences(lines)
    const proofPoints = extractProofPoints(lines)
    const extractionQuality = assessExtractionQuality(name, skills, experiences)
    return {
      name,
      targetTitles,
      skills,
      positioningStatement,
      experiences,
      proofPoints,
      extractionQuality,
      rawText,
      hasExperienceSection,
    }
  } catch {
    return { ...EMPTY_PARSED_CV, rawText: rawText ?? "" }
  }
}

export function parseCV(rawText: string): Partial<UserProfile> {
  const parsed = parseCVToProfile(rawText)
  const result: Partial<UserProfile> = {}
  if (parsed.name.value) result.name = parsed.name.value
  if (parsed.targetTitles.value && parsed.targetTitles.value.length > 0) {
    result.targetTitles = parsed.targetTitles.value
  }
  if (parsed.skills.length > 0) result.skills = parsed.skills
  if (parsed.positioningStatement.value) result.positioningStatement = parsed.positioningStatement.value
  if (parsed.experiences.length > 0) {
    result.experiences = parsed.experiences.map(
      (exp, i): Experience => ({
        id: `exp-parsed-${i}`,
        title: exp.title,
        company: exp.company,
        startDate: exp.startYear ? `${exp.startYear}-01-01` : "",
        endDate: exp.isCurrent ? null : exp.endYear ? `${exp.endYear}-12-31` : null,
        description: exp.description || exp.rawLine,
        achievements: exp.achievements,
        keywords: [],
      }),
    )
  }
  return result
}
