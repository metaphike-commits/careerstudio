import type {
  Application,
  ApplicationPack,
  CVVersion,
  InterviewPrepResponse,
  JobOffer,
  MemoryItem,
  NetworkContact,
  UserProfile,
} from "@/types"
import type { InterviewWorkspace } from "@/lib/interview-coach"
import {
  getConfiguredLLMProvider,
  hasUsableProviderKey,
  isNonEmptyString,
  isUsableApiKey,
  type LLMProviderName,
} from "@/lib/llm/cv-targeting"

export type { InterviewPrepResponse } from "@/types"

export interface InterviewPrepRequestBody {
  profile?: UserProfile
  application?: Application
  opportunity?: JobOffer | null
  applicationPack?: ApplicationPack | null
  cvVersion?: CVVersion | null
  linkedContact?: NetworkContact | null
  memoryItems?: MemoryItem[]
  workspace?: InterviewWorkspace
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

function stringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, maxItems)
}

function objectArray<T>(
  value: unknown,
  maxItems: number,
  mapper: (item: Record<string, unknown>, index: number) => T | null
) {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, maxItems)
    .map((item, index) => (item && typeof item === "object" ? mapper(item as Record<string, unknown>, index) : null))
    .filter((item): item is T => Boolean(item))
}

function normalizeInterviewPrep(value: unknown): InterviewPrepResponse | null {
  if (!value || typeof value !== "object") return null
  const parsed = value as Partial<InterviewPrepResponse>

  const roleStakes = stringArray(parsed.roleStakes, 8)
  const prepChecklist = stringArray(parsed.prepChecklist, 10)
  const companyResearch = stringArray(parsed.companyResearch, 10)
  const questionsToAsk = stringArray(parsed.questionsToAsk, 8)

  const likelyQuestions = objectArray(parsed.likelyQuestions, 10, (item) => {
    const question = String(item.question ?? "").trim()
    if (!question) return null
    return {
      question,
      answerAngle: String(item.answerAngle ?? "").trim(),
      proofToUse: String(item.proofToUse ?? "").trim(),
    }
  })

  const tailoredAnswers = objectArray(parsed.tailoredAnswers, 8, (item) => {
    const prompt = String(item.prompt ?? "").trim()
    const answer = String(item.answer ?? "").trim()
    if (!prompt || !answer) return null
    return { prompt, answer }
  })

  const objections = objectArray(parsed.objections, 8, (item) => {
    const objection = String(item.objection ?? "").trim()
    if (!objection) return null
    return {
      objection,
      responseAngle: String(item.responseAngle ?? "").trim(),
    }
  })

  const starMapping = objectArray(parsed.starMapping, 8, (item) => {
    const situation = String(item.situation ?? "").trim()
    const story = String(item.story ?? "").trim()
    if (!situation || !story) return null
    return {
      situation,
      story,
      useFor: stringArray(item.useFor, 6),
    }
  })

  if (
    roleStakes.length === 0 ||
    likelyQuestions.length === 0 ||
    tailoredAnswers.length === 0 ||
    objections.length === 0 ||
    prepChecklist.length === 0
  ) {
    return null
  }

  return {
    roleStakes,
    likelyQuestions,
    tailoredAnswers,
    objections,
    starMapping,
    prepChecklist,
    companyResearch,
    questionsToAsk,
  }
}

export function isValidInterviewPrepBody(
  body: InterviewPrepRequestBody | null
): body is Required<Pick<InterviewPrepRequestBody, "profile" | "application" | "workspace">> &
  InterviewPrepRequestBody {
  return Boolean(
    body &&
      body.profile &&
      body.application &&
      body.workspace &&
      Array.isArray(body.profile.experiences) &&
      body.profile.experiences.length > 0 &&
      isNonEmptyString(body.workspace.title) &&
      isNonEmptyString(body.workspace.company)
  )
}

export function parseInterviewPrepJson(text: string): InterviewPrepResponse | null {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  try {
    return normalizeInterviewPrep(JSON.parse(cleaned))
  } catch {
    return null
  }
}

export function parseAnthropicInterviewPrep(content: unknown) {
  if (!Array.isArray(content)) return null
  const text = content
    .map((item: AnthropicMessageContent) =>
      item?.type === "text" && typeof item.text === "string" ? item.text : ""
    )
    .join("\n")
    .trim()

  return text ? parseInterviewPrepJson(text) : null
}

export function parseOpenAIInterviewPrep(data: unknown) {
  if (!data || typeof data !== "object") return null
  if ("output_text" in data && typeof data.output_text === "string") {
    return parseInterviewPrepJson(data.output_text)
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

  return text ? parseInterviewPrepJson(text) : null
}

export function buildInterviewPrepPrompt(
  body: Required<Pick<InterviewPrepRequestBody, "profile" | "application" | "workspace">> &
    InterviewPrepRequestBody
) {
  return `Tu es un coach senior d'entretien pour profils Strategy & Operations.

Objectif: produire une fiche de preparation d'entretien claire, concrete et adaptee au dossier.

Contraintes:
- Retourne uniquement du JSON valide, sans markdown.
- Ne change aucun statut de candidature.
- N'invente pas de chiffre, d'entreprise, de diplome ou de titre absent du contexte.
- Si tu inferes un risque ou une question, formule-le prudemment.
- Les reponses doivent utiliser les preuves du profil, du CV cible, du pack, et des notes memoire.
- Langue: francais professionnel, direct, utilisable avant entretien.

Format exact:
{
  "roleStakes": ["string"],
  "likelyQuestions": [{ "question": "string", "answerAngle": "string", "proofToUse": "string" }],
  "tailoredAnswers": [{ "prompt": "string", "answer": "string" }],
  "objections": [{ "objection": "string", "responseAngle": "string" }],
  "starMapping": [{ "situation": "string", "story": "string", "useFor": ["string"] }],
  "prepChecklist": ["string"],
  "companyResearch": ["string"],
  "questionsToAsk": ["string"]
}

Workspace local:
${JSON.stringify(body.workspace, null, 2)}

Profil:
${JSON.stringify(body.profile, null, 2)}

Candidature:
${JSON.stringify(body.application, null, 2)}

Opportunite:
${JSON.stringify(body.opportunity ?? null, null, 2)}

CV cible:
${JSON.stringify(body.cvVersion ?? null, null, 2)}

Pack candidature:
${JSON.stringify(body.applicationPack ?? null, null, 2)}

Contact lie:
${JSON.stringify(body.linkedContact ?? null, null, 2)}

Memoire liee:
${JSON.stringify((body.memoryItems ?? []).slice(0, 8), null, 2)}
`
}

export async function generateInterviewPrepWithAnthropic(
  body: Required<Pick<InterviewPrepRequestBody, "profile" | "application" | "workspace">> &
    InterviewPrepRequestBody
): Promise<InterviewPrepResponse | null> {
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
      max_tokens: 3000,
      temperature: 0.25,
      messages: [{ role: "user", content: buildInterviewPrepPrompt(body) }],
    }),
  })

  if (!response.ok) throw new Error("Anthropic request failed")
  const data = (await response.json()) as { content?: unknown }
  return parseAnthropicInterviewPrep(data.content)
}

export async function generateInterviewPrepWithOpenAI(
  body: Required<Pick<InterviewPrepRequestBody, "profile" | "application" | "workspace">> &
    InterviewPrepRequestBody
): Promise<InterviewPrepResponse | null> {
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
      input: buildInterviewPrepPrompt(body),
      max_output_tokens: 3000,
      text: {
        format: {
          type: "json_schema",
          name: "interview_prep",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              roleStakes: { type: "array", items: { type: "string" }, maxItems: 8 },
              likelyQuestions: {
                type: "array",
                maxItems: 10,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    question: { type: "string" },
                    answerAngle: { type: "string" },
                    proofToUse: { type: "string" },
                  },
                  required: ["question", "answerAngle", "proofToUse"],
                },
              },
              tailoredAnswers: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    prompt: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["prompt", "answer"],
                },
              },
              objections: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    objection: { type: "string" },
                    responseAngle: { type: "string" },
                  },
                  required: ["objection", "responseAngle"],
                },
              },
              starMapping: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    situation: { type: "string" },
                    story: { type: "string" },
                    useFor: { type: "array", items: { type: "string" }, maxItems: 6 },
                  },
                  required: ["situation", "story", "useFor"],
                },
              },
              prepChecklist: { type: "array", items: { type: "string" }, maxItems: 10 },
              companyResearch: { type: "array", items: { type: "string" }, maxItems: 10 },
              questionsToAsk: { type: "array", items: { type: "string" }, maxItems: 8 },
            },
            required: [
              "roleStakes",
              "likelyQuestions",
              "tailoredAnswers",
              "objections",
              "starMapping",
              "prepChecklist",
              "companyResearch",
              "questionsToAsk",
            ],
          },
        },
      },
    }),
  })

  if (!response.ok) throw new Error("OpenAI request failed")
  return parseOpenAIInterviewPrep(await response.json())
}

export async function generateInterviewPrep(
  provider: LLMProviderName,
  body: Required<Pick<InterviewPrepRequestBody, "profile" | "application" | "workspace">> &
    InterviewPrepRequestBody
) {
  if (provider === "openai") return generateInterviewPrepWithOpenAI(body)
  return generateInterviewPrepWithAnthropic(body)
}

export {
  getConfiguredLLMProvider,
  hasUsableProviderKey,
}
