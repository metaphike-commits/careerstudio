import type { ProfileIntelligence, StructuredExperience, UserProfile } from "@/types"
import {
  getConfiguredLLMProvider,
  hasUsableProviderKey,
  isNonEmptyString,
  isUsableApiKey,
  type LLMProviderName,
} from "@/lib/llm/cv-targeting"
import { createProfileIntelligence } from "@/lib/profile-intelligence"

export interface ProfileIntelligenceRequestBody {
  cvText?: string
  currentProfile?: UserProfile
}

interface AnthropicMessageContent {
  type?: unknown
  text?: unknown
}

interface OpenAIResponseOutputContent {
  type?: unknown
  text?: unknown
}

interface OpenAIResponseOutputItem {
  content?: unknown
}

const CONFIDENCE_VALUES = new Set(["high", "medium", "low", "missing"])
const SOURCE_VALUES = new Set(["local_profile", "llm_reviewed", "manual"])

function stringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, maxItems)
}

function normalizeStructuredExperience(item: unknown): StructuredExperience | null {
  if (!item || typeof item !== "object") return null
  const exp = item as Record<string, unknown>
  const company = typeof exp.company === "string" ? exp.company.trim() : ""
  const title = typeof exp.title === "string" ? exp.title.trim() : ""
  if (!company && !title) return null
  const startYear =
    typeof exp.startYear === "string" ? exp.startYear.trim().slice(0, 4) :
    typeof exp.startYear === "number" ? String(exp.startYear).slice(0, 4) : ""
  const endYear =
    typeof exp.endYear === "string" ? exp.endYear.trim().slice(0, 4) :
    typeof exp.endYear === "number" ? String(exp.endYear).slice(0, 4) : ""
  const isCurrent = Boolean(exp.isCurrent)
  const description = typeof exp.description === "string" ? exp.description.trim().slice(0, 300) : ""
  const achievements = Array.isArray(exp.achievements)
    ? (exp.achievements as unknown[])
        .map((a) => (typeof a === "string" ? a.trim() : ""))
        .filter((a) => a.length > 5 && a.length <= 250)
        .slice(0, 6)
    : []
  return { company, title, startYear, endYear, isCurrent, description, achievements }
}

function normalizeProfileIntelligence(value: unknown, fallbackProfile?: UserProfile): ProfileIntelligence | null {
  if (!value || typeof value !== "object") return null
  const parsed = value as Partial<ProfileIntelligence> & Record<string, unknown>
  const fallback = fallbackProfile ? createProfileIntelligence(fallbackProfile) : null

  const seniority = isNonEmptyString(parsed.seniority) ? parsed.seniority : fallback?.seniority
  if (!seniority) return null

  const pitch = parsed.pitch && typeof parsed.pitch === "object" ? parsed.pitch : fallback?.pitch
  if (!pitch) return null

  return {
    seniority,
    seniorityConfidence: CONFIDENCE_VALUES.has(String(parsed.seniorityConfidence))
      ? parsed.seniorityConfidence!
      : fallback?.seniorityConfidence ?? "medium",
    targetRoleFamilies: stringArray(parsed.targetRoleFamilies, 12).length
      ? stringArray(parsed.targetRoleFamilies, 12)
      : fallback?.targetRoleFamilies ?? [],
    avoidRoleFamilies: stringArray(parsed.avoidRoleFamilies, 12).length
      ? stringArray(parsed.avoidRoleFamilies, 12)
      : fallback?.avoidRoleFamilies ?? [],
    sectorFit: stringArray(parsed.sectorFit, 12).length ? stringArray(parsed.sectorFit, 12) : fallback?.sectorFit ?? [],
    coreStrengths: stringArray(parsed.coreStrengths, 12).length
      ? stringArray(parsed.coreStrengths, 12)
      : fallback?.coreStrengths ?? [],
    impactProofs: stringArray(parsed.impactProofs, 12).length
      ? stringArray(parsed.impactProofs, 12)
      : fallback?.impactProofs ?? [],
    likelyObjections: stringArray(parsed.likelyObjections, 12).length
      ? stringArray(parsed.likelyObjections, 12)
      : fallback?.likelyObjections ?? [],
    pitch: {
      short: isNonEmptyString(pitch.short) ? pitch.short : fallback?.pitch.short ?? "",
      recruiter: isNonEmptyString(pitch.recruiter) ? pitch.recruiter : fallback?.pitch.recruiter ?? "",
      interview: isNonEmptyString(pitch.interview) ? pitch.interview : fallback?.pitch.interview ?? "",
    },
    starExamples: Array.isArray(parsed.starExamples)
      ? parsed.starExamples.slice(0, 6).map((example, index) => ({
          id: isNonEmptyString(example?.id) ? example.id : `llm-star-${index + 1}`,
          title: isNonEmptyString(example?.title) ? example.title : `STAR example ${index + 1}`,
          situation: isNonEmptyString(example?.situation) ? example.situation : "",
          task: isNonEmptyString(example?.task) ? example.task : "",
          action: isNonEmptyString(example?.action) ? example.action : "",
          result: isNonEmptyString(example?.result) ? example.result : "",
          linkedSkills: stringArray(example?.linkedSkills, 8),
        }))
      : fallback?.starExamples ?? [],
    atsKeywords: stringArray(parsed.atsKeywords, 30).length
      ? stringArray(parsed.atsKeywords, 30)
      : fallback?.atsKeywords ?? [],
    progressionAxes: stringArray(parsed.progressionAxes, 12).length
      ? stringArray(parsed.progressionAxes, 12)
      : fallback?.progressionAxes ?? [],
    source: SOURCE_VALUES.has(String(parsed.source)) ? parsed.source! : "llm_reviewed",
    structuredExperiences: Array.isArray(parsed.structuredExperiences)
      ? (parsed.structuredExperiences as unknown[])
          .map(normalizeStructuredExperience)
          .filter((exp): exp is StructuredExperience => exp !== null)
          .slice(0, 15)
      : undefined,
  }
}

export function isValidProfileIntelligenceBody(
  body: ProfileIntelligenceRequestBody | null
): body is Required<Pick<ProfileIntelligenceRequestBody, "cvText">> & ProfileIntelligenceRequestBody {
  return Boolean(body && isNonEmptyString(body.cvText) && body.cvText.trim().length >= 80)
}

export function parseProfileIntelligenceJson(text: string, fallbackProfile?: UserProfile) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  try {
    return normalizeProfileIntelligence(JSON.parse(cleaned), fallbackProfile)
  } catch {
    return null
  }
}

export function parseAnthropicProfileIntelligence(content: unknown, fallbackProfile?: UserProfile) {
  if (!Array.isArray(content)) return null
  const text = content
    .map((item: AnthropicMessageContent) => (item?.type === "text" && typeof item.text === "string" ? item.text : ""))
    .join("\n")
    .trim()

  return text ? parseProfileIntelligenceJson(text, fallbackProfile) : null
}

export function parseOpenAIProfileIntelligence(data: unknown, fallbackProfile?: UserProfile) {
  if (!data || typeof data !== "object") return null
  if ("output_text" in data && typeof data.output_text === "string") {
    return parseProfileIntelligenceJson(data.output_text, fallbackProfile)
  }

  const output = "output" in data ? data.output : null
  if (!Array.isArray(output)) return null

  const text = output
    .flatMap((item: OpenAIResponseOutputItem) => (Array.isArray(item.content) ? item.content : []))
    .map((content: OpenAIResponseOutputContent) =>
      (content.type === "output_text" || content.type === "text") && typeof content.text === "string"
        ? content.text
        : ""
    )
    .join("\n")
    .trim()

  return text ? parseProfileIntelligenceJson(text, fallbackProfile) : null
}

export function buildProfileIntelligencePrompt(body: Required<Pick<ProfileIntelligenceRequestBody, "cvText">> & ProfileIntelligenceRequestBody) {
  return `Tu es un expert senior en repositionnement professionnel, ATS et coaching d'entretien.

Objectif: analyser le CV maitre et produire une Profile Intelligence complete, utile pour:
- dashboard de recherche d'emploi;
- scoring d'offres;
- CV cible;
- messages de candidature;
- preparation d'entretien;
- memoire et apprentissage.

Contraintes:
- Retourne uniquement du JSON valide, sans markdown.
- N'invente pas d'entreprise, diplome, titre ou chiffre absent du CV.
- Tu peux inferer des familles de roles ou axes de progression, mais les formulations doivent rester prudentes.
- Si une information est incertaine, utilise "seniorityConfidence": "low" ou ajoute un axe de progression.
- Distingue les preuves fortes directement visibles dans le CV des hypotheses de positionnement.
- Les impactProofs doivent etre des preuves exploitables en candidature: resultat, contexte, action, chiffre si disponible.
- Les likelyObjections doivent aider a preparer recruteur et entretien, pas flatter le profil.
- Les starExamples doivent venir d'experiences concretes du CV et couvrir Situation, Task, Action, Result.
- Les atsKeywords doivent melanger intitules cibles, competences metier, outils, secteurs et mots-cles ATS.
- Vise une sortie riche mais concise: 5-8 roles cibles, 5-8 forces, 5-8 preuves, 4-6 objections, 4-6 STAR, 15-24 mots-cles ATS.
- structuredExperiences: extraire toutes les experiences professionnelles du CV, dans l'ordre chronologique inverse. Pour chaque experience: company, title, startYear (AAAA ou vide), endYear (AAAA ou vide), isCurrent (bool), description (1-2 phrases max, 250 chars max), achievements (3-5 realisations, chacune 200 chars max, avec chiffre si present). Ne pas inventer. Si une info manque, laisser la chaine vide. Ne pas coller plusieurs experiences dans un seul champ. Ne pas copier des blocs entiers de CV.
- Langue: francais professionnel, clair, direct.

Format exact:
{
  "seniority": "string",
  "seniorityConfidence": "high|medium|low|missing",
  "targetRoleFamilies": ["string"],
  "avoidRoleFamilies": ["string"],
  "sectorFit": ["string"],
  "coreStrengths": ["string"],
  "impactProofs": ["string"],
  "likelyObjections": ["string"],
  "pitch": {
    "short": "string",
    "recruiter": "string",
    "interview": "string"
  },
  "starExamples": [{
    "id": "string",
    "title": "string",
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string",
    "linkedSkills": ["string"]
  }],
  "atsKeywords": ["string"],
  "progressionAxes": ["string"],
  "structuredExperiences": [{
    "company": "string",
    "title": "string",
    "startYear": "AAAA ou vide",
    "endYear": "AAAA ou vide",
    "isCurrent": false,
    "description": "1-2 phrases max",
    "achievements": ["realisation courte avec chiffre si disponible"]
  }],
  "source": "llm_reviewed"
}

Profil actuel optionnel:
${body.currentProfile ? JSON.stringify(body.currentProfile, null, 2) : "Aucun profil existant."}

CV maitre:
${body.cvText}
`
}

export async function generateProfileIntelligenceWithAnthropic(
  body: Required<Pick<ProfileIntelligenceRequestBody, "cvText">> & ProfileIntelligenceRequestBody
): Promise<ProfileIntelligence | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!isUsableApiKey(apiKey)) return null

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": String(apiKey).trim(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 4000,
      temperature: 0.2,
      messages: [{ role: "user", content: buildProfileIntelligencePrompt(body) }],
    }),
  })

  if (!response.ok) throw new Error("Anthropic request failed")
  const data = (await response.json()) as { content?: unknown }
  return parseAnthropicProfileIntelligence(data.content, body.currentProfile)
}

export async function generateProfileIntelligenceWithOpenAI(
  body: Required<Pick<ProfileIntelligenceRequestBody, "cvText">> & ProfileIntelligenceRequestBody
): Promise<ProfileIntelligence | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!isUsableApiKey(apiKey)) return null

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      input: buildProfileIntelligencePrompt(body),
      max_output_tokens: 4000,
      text: {
        format: {
          type: "json_schema",
          name: "profile_intelligence",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              seniority: { type: "string" },
              seniorityConfidence: { type: "string", enum: ["high", "medium", "low", "missing"] },
              targetRoleFamilies: { type: "array", items: { type: "string" }, maxItems: 12 },
              avoidRoleFamilies: { type: "array", items: { type: "string" }, maxItems: 12 },
              sectorFit: { type: "array", items: { type: "string" }, maxItems: 12 },
              coreStrengths: { type: "array", items: { type: "string" }, maxItems: 12 },
              impactProofs: { type: "array", items: { type: "string" }, maxItems: 12 },
              likelyObjections: { type: "array", items: { type: "string" }, maxItems: 12 },
              pitch: {
                type: "object",
                additionalProperties: false,
                properties: {
                  short: { type: "string" },
                  recruiter: { type: "string" },
                  interview: { type: "string" },
                },
                required: ["short", "recruiter", "interview"],
              },
              starExamples: {
                type: "array",
                maxItems: 6,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    situation: { type: "string" },
                    task: { type: "string" },
                    action: { type: "string" },
                    result: { type: "string" },
                    linkedSkills: { type: "array", items: { type: "string" }, maxItems: 8 },
                  },
                  required: ["id", "title", "situation", "task", "action", "result", "linkedSkills"],
                },
              },
              atsKeywords: { type: "array", items: { type: "string" }, maxItems: 30 },
              progressionAxes: { type: "array", items: { type: "string" }, maxItems: 12 },
              structuredExperiences: {
                type: "array",
                maxItems: 15,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    company: { type: "string" },
                    title: { type: "string" },
                    startYear: { type: "string" },
                    endYear: { type: "string" },
                    isCurrent: { type: "boolean" },
                    description: { type: "string" },
                    achievements: { type: "array", items: { type: "string" }, maxItems: 5 },
                  },
                  required: ["company", "title", "startYear", "endYear", "isCurrent", "description", "achievements"],
                },
              },
              source: { type: "string", enum: ["llm_reviewed"] },
            },
            required: [
              "seniority",
              "seniorityConfidence",
              "targetRoleFamilies",
              "avoidRoleFamilies",
              "sectorFit",
              "coreStrengths",
              "impactProofs",
              "likelyObjections",
              "pitch",
              "starExamples",
              "atsKeywords",
              "progressionAxes",
              "structuredExperiences",
              "source",
            ],
          },
        },
      },
    }),
  })

  if (!response.ok) throw new Error("OpenAI request failed")
  return parseOpenAIProfileIntelligence(await response.json(), body.currentProfile)
}

export async function generateProfileIntelligence(provider: LLMProviderName, body: Required<Pick<ProfileIntelligenceRequestBody, "cvText">> & ProfileIntelligenceRequestBody) {
  if (provider === "openai") return generateProfileIntelligenceWithOpenAI(body)
  return generateProfileIntelligenceWithAnthropic(body)
}

export {
  getConfiguredLLMProvider,
  hasUsableProviderKey,
}
