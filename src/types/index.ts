export type RemoteType = "remote" | "hybrid" | "onsite"

export type Verdict = "apply_now" | "investigate" | "watch" | "ignore"

export type ApplicationStatus =
  | "new"
  | "shortlisted"
  | "pack_generated"
  | "ready_to_apply"
  | "applied"
  | "contacted"
  | "follow_up_needed"
  | "waiting"
  | "response_received"
  | "recruiter_interview"
  | "hiring_manager_interview"
  | "case_study"
  | "offer"
  | "rejected"
  | "probably_ghosted"
  | "ghosted"
  | "archived"

export type EnergyLevel = "low" | "medium" | "high"

export type ActionType =
  | "apply"
  | "contact"
  | "follow_up"
  | "prepare_interview"
  | "generate_cv"
  | "network"
  | "research"

export type ApplicationEventType =
  | "prepared_cv"
  | "prepared_pack"
  | "applied"
  | "contacted"
  | "followed_up"
  | "response_received"
  | "interview_obtained"
  | "rejected"
  | "ghosted"
  | "archived"
  | "note"

export type NetworkContactStatus =
  | "identified"
  | "message_prepared"
  | "contacted"
  | "replied"
  | "archived"

export type MemoryItemType =
  | "interview_note"
  | "feedback"
  | "rejection"
  | "outreach_message"
  | "personal_note"

export type MemorySentiment = "positive" | "neutral" | "negative" | "mixed"

export interface UserProfile {
  id: string
  name: string
  profileSource?: "demo" | "imported" | "manual"
  targetTitles: string[]
  targetIndustries: string[]
  preferredLocations: string[]
  strengths: string[]
  skills: string[]
  experiences: Experience[]
  achievements: string[]
  proofPoints: ProofPoint[]
  avoidRoles: string[]
  positioningStatement: string
  objections: string[]
  missingCriticalInfo: string[]
  profileIntelligence?: ProfileIntelligence
}

export type ProfileIntelligenceConfidence = "high" | "medium" | "low" | "missing"

export interface ProfilePitchVariants {
  short: string
  recruiter: string
  interview: string
}

export interface StarExample {
  id: string
  title: string
  situation: string
  task: string
  action: string
  result: string
  linkedSkills: string[]
}

export interface ProfileIntelligence {
  seniority: string
  seniorityConfidence: ProfileIntelligenceConfidence
  targetRoleFamilies: string[]
  avoidRoleFamilies: string[]
  sectorFit: string[]
  coreStrengths: string[]
  impactProofs: string[]
  likelyObjections: string[]
  pitch: ProfilePitchVariants
  starExamples: StarExample[]
  atsKeywords: string[]
  progressionAxes: string[]
  source: "local_profile" | "llm_reviewed" | "manual"
}

export type CalibrationLevel = "blocking" | "weak"

export interface CalibrationWarning {
  field: keyof ProfileIntelligence | "general"
  level: CalibrationLevel
  message: string
}

export interface CalibrationResult {
  isReady: boolean
  score: "strong" | "partial" | "weak"
  warnings: CalibrationWarning[]
}

export interface Experience {
  id: string
  title: string
  company: string
  startDate: string
  endDate: string | null
  description: string
  achievements: string[]
  keywords: string[]
}

export interface ProofPoint {
  skill: string
  evidence: string
  strength: "strong" | "moderate" | "weak" | "missing"
}

export interface JobOffer {
  id: string
  title: string
  company: string
  logoUrl?: string
  location: string
  remoteType: RemoteType
  source: string
  url?: string
  description: string
  responsibilities: string[]
  requirements: string[]
  keywords: string[]
  seniority: string
  postedAt: string
  foundAt: string
  score: OpportunityScore
  status: "new" | "shortlisted" | "applied" | "archived"
}

export interface OpportunityScore {
  globalFit: number
  confidence: number
  skills: number
  seniority: number
  narrative: number
  ats: number
  motivation: number
  access: number
  timing: number
  effort: number
  interviewProbability: number
  verdict: Verdict
  reasonsFor: string[]
  reasonsAgainst: string[]
  redFlags: string[]
  recommendedAngle: string
  recommendedActions: string[]
}

export interface CVVersion {
  id: string
  masterCvId: string
  jobOfferId: string
  title: string
  atsScore: number
  recruiterReadability: number
  narrativeCoherence: number
  substanceScore: number
  keywordCoverage: number
  missingKeywords: string[]
  includedKeywords: string[]
  bulletImprovements: BulletImprovement[]
  content: string
  createdAt: string
  atsRedFlags?: string[]
  gapAnalysis?: { reframe: string[]; learn: string[] }
}

export interface BulletImprovement {
  original: string
  improved: string
  reason: string
}

export interface ApplicationPack {
  jobOfferId: string
  cvVersionId: string | null
  linkedInMessage: string
  pitch30s: string
  pitch60s: string
  whyYou: string
  whyCompany: string
  probableQuestions: string[]
  probableObjections: string[]
  miniPrepPlan: string[]
}

export interface Application {
  id: string
  jobOfferId: string
  status: ApplicationStatus
  appliedAt: string | null
  cvVersionId: string | null
  contactId: string | null
  notes: string
  feedback: string
  nextAction: string
  nextActionDate: string | null
  lastUserActionAt: string | null
}

export interface ApplicationEvent {
  id: string
  applicationId: string
  type: ApplicationEventType
  statusAfter: ApplicationStatus | null
  createdAt: string
  label: string
  note: string
  source: "manual" | "prepared" | "rule_suggestion"
}

export interface NetworkContact {
  id: string
  name: string
  company: string
  role: string
  linkedInUrl: string | null
  status: NetworkContactStatus
  linkedJobOfferId: string | null
  linkedApplicationId: string | null
  messageDraft: string
  lastContactedAt: string | null
  nextFollowUpAt: string | null
  notes: string
}

export interface MemoryItem {
  id: string
  type: MemoryItemType
  title: string
  company: string
  content: string
  linkedApplicationId: string | null
  linkedContactId: string | null
  tags: string[]
  sentiment: MemorySentiment
  createdAt: string
  updatedAt: string
}

export interface MemoryInsight {
  id: string
  title: string
  description: string
  level: "info" | "warning" | "opportunity"
  linkedMemoryItemIds: string[]
}

export interface ActionItem {
  id: string
  title: string
  type: ActionType
  priority: "critical" | "high" | "medium" | "low"
  linkedJobOfferId: string | null
  dueDate: string | null
  status: "pending" | "done" | "skipped"
  estimatedMinutes: number
  energyLevel: EnergyLevel
  expectedImpact: "very_high" | "high" | "medium" | "low"
  description: string
}

export interface DailyBrief {
  date: string
  mainAction: ActionItem
  secondaryActions: ActionItem[]
  topOpportunities: JobOffer[]
  insight: string
  energyCheck: string
}

export interface MasterCV {
  id: string
  rawText: string
  fileName: string
  uploadedAt: string
  parsedStatus: "pending" | "processing" | "done" | "error"
  extractedProfileId: string | null
}

export interface LinkedInAboutResult {
  formal: string
  conversational: string
  bold: string
}

export interface InterviewPrepResponse {
  roleStakes: string[]
  likelyQuestions: { question: string; answerAngle: string; proofToUse: string }[]
  tailoredAnswers: { prompt: string; answer: string }[]
  objections: { objection: string; responseAngle: string }[]
  starMapping: { situation: string; story: string; useFor: string[] }[]
  prepChecklist: string[]
  companyResearch: string[]
  questionsToAsk: string[]
}
