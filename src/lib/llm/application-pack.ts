import type { ApplicationPack, JobOffer, UserProfile } from "@/types"
import {
  getConfiguredLLMProvider,
  hasUsableProviderKey,
  isNonEmptyString,
  isUsableApiKey,
  type LLMProviderName,
} from "@/lib/llm/cv-targeting"
import { generateLocalApplicationPack } from "@/lib/local-pack"

export interface ApplicationPackRequestBody {
  profile?: UserProfile
  opportunity?: JobOffer
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

function normalizeApplicationPack(
  value: unknown,
  body: Required<ApplicationPackRequestBody>
): ApplicationPack | null {
  if (!value || typeof value !== "object") return null
  const parsed = value as Partial<ApplicationPack>

  const linkedInMessage = isNonEmptyString(parsed.linkedInMessage) ? parsed.linkedInMessage : ""
  const pitch30s = isNonEmptyString(parsed.pitch30s) ? parsed.pitch30s : ""
  const pitch60s = isNonEmptyString(parsed.pitch60s) ? parsed.pitch60s : ""
  const whyYou = isNonEmptyString(parsed.whyYou) ? parsed.whyYou : ""
  const whyCompany = isNonEmptyString(parsed.whyCompany) ? parsed.whyCompany : ""

  if (!linkedInMessage || !pitch30s || !pitch60s || !whyYou || !whyCompany) return null

  const localFallback = generateLocalApplicationPack(body.profile, body.opportunity)

  return {
    jobOfferId: body.opportunity.id,
    cvVersionId: null,
    linkedInMessage,
    pitch30s,
    pitch60s,
    whyYou,
    whyCompany,
    probableQuestions: stringArray(parsed.probableQuestions, 12).length
      ? stringArray(parsed.probableQuestions, 12)
      : localFallback.probableQuestions,
    probableObjections: stringArray(parsed.probableObjections, 8).length
      ? stringArray(parsed.probableObjections, 8)
      : localFallback.probableObjections,
    miniPrepPlan: stringArray(parsed.miniPrepPlan, 10).length
      ? stringArray(parsed.miniPrepPlan, 10)
      : localFallback.miniPrepPlan,
  }
}

export function isValidApplicationPackBody(
  body: ApplicationPackRequestBody | null
): body is Required<ApplicationPackRequestBody> {
  return Boolean(
    body &&
      body.profile &&
      Array.isArray(body.profile.experiences) &&
      body.profile.experiences.length > 0 &&
      body.opportunity &&
      isNonEmptyString(body.opportunity.id) &&
      isNonEmptyString(body.opportunity.title) &&
      isNonEmptyString(body.opportunity.company) &&
      isNonEmptyString(body.opportunity.description)
  )
}

export function parseApplicationPackJson(text: string, body: Required<ApplicationPackRequestBody>) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  try {
    return normalizeApplicationPack(JSON.parse(cleaned), body)
  } catch {
    return null
  }
}

export function parseAnthropicApplicationPack(
  content: unknown,
  body: Required<ApplicationPackRequestBody>
) {
  if (!Array.isArray(content)) return null
  const text = content
    .map((item: AnthropicMessageContent) =>
      item?.type === "text" && typeof item.text === "string" ? item.text : ""
    )
    .join("\n")
    .trim()

  return text ? parseApplicationPackJson(text, body) : null
}

export function parseOpenAIApplicationPack(data: unknown, body: Required<ApplicationPackRequestBody>) {
  if (!data || typeof data !== "object") return null
  if ("output_text" in data && typeof data.output_text === "string") {
    return parseApplicationPackJson(data.output_text, body)
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

  return text ? parseApplicationPackJson(text, body) : null
}

export function buildApplicationPackPrompt(body: Required<ApplicationPackRequestBody>) {
  const { profile, opportunity } = body
  const profileIntelligence = profile.profileIntelligence ?? null

  return `Tu es un coach senior de candidature pour profils Strategy & Operations.

Objectif: produire un pack candidature complet et directement exploitable pour une offre prioritaire.

Contraintes non negociables:
- Retourne uniquement du JSON valide, sans markdown.
- Ne marque jamais la candidature comme envoyee.
- N'invente pas d'entreprise, diplome, titre ou chiffre absent du profil.
- Tu peux reformuler, prioriser et personnaliser les preuves existantes.
- Le message LinkedIn doit etre court, humain, et actionnable.
- whyCompany ne doit pas recoller la description du poste; il doit expliquer l'interet concret pour cette entreprise et ce contexte.
- Les objections doivent etre honnetes et utiles pour la preparation.
- Les questions probables doivent aider a preparer un entretien recruteur ou manager.
- Langue: francais professionnel, clair, direct.

Format exact:
{
  "linkedInMessage": "string",
  "pitch30s": "string",
  "pitch60s": "string",
  "whyYou": "string",
  "whyCompany": "string",
  "probableQuestions": ["string"],
  "probableObjections": ["string"],
  "miniPrepPlan": ["string"]
}

Offre:
Titre: ${opportunity.title}
Entreprise: ${opportunity.company}
Localisation: ${opportunity.location}
Description:
${opportunity.description}
Responsabilites: ${opportunity.responsibilities.join(" | ")}
Requirements: ${opportunity.requirements.join(" | ")}
Mots-cles: ${opportunity.keywords.join(", ")}
Angle local recommande: ${opportunity.score.recommendedAngle}
Raisons pour: ${opportunity.score.reasonsFor.join(" | ")}
Risques: ${[...opportunity.score.reasonsAgainst, ...opportunity.score.redFlags].join(" | ")}

Profil:
Nom: ${profile.name}
Positionnement: ${profile.positioningStatement}
Titres cibles: ${profile.targetTitles.join(", ")}
Secteurs cibles: ${profile.targetIndustries.join(", ")}
Competences: ${profile.skills.join(", ")}
Forces: ${profile.strengths.join(", ")}
Preuves: ${profile.achievements.join(" | ")}
Objections profil: ${profile.objections.join(" | ")}
Profile Intelligence:
${profileIntelligence ? JSON.stringify(profileIntelligence, null, 2) : "Aucune Profile Intelligence sauvegardee."}
Experiences:
${JSON.stringify(profile.experiences, null, 2)}
`
}

export async function generateApplicationPackWithAnthropic(
  body: Required<ApplicationPackRequestBody>
): Promise<ApplicationPack | null> {
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
      max_tokens: 2600,
      temperature: 0.25,
      messages: [{ role: "user", content: buildApplicationPackPrompt(body) }],
    }),
  })

  if (!response.ok) throw new Error("Anthropic request failed")
  const data = (await response.json()) as { content?: unknown }
  return parseAnthropicApplicationPack(data.content, body)
}

export async function generateApplicationPackWithOpenAI(
  body: Required<ApplicationPackRequestBody>
): Promise<ApplicationPack | null> {
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
      input: buildApplicationPackPrompt(body),
      max_output_tokens: 2600,
      text: {
        format: {
          type: "json_schema",
          name: "application_pack",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              linkedInMessage: { type: "string" },
              pitch30s: { type: "string" },
              pitch60s: { type: "string" },
              whyYou: { type: "string" },
              whyCompany: { type: "string" },
              probableQuestions: { type: "array", items: { type: "string" }, maxItems: 12 },
              probableObjections: { type: "array", items: { type: "string" }, maxItems: 8 },
              miniPrepPlan: { type: "array", items: { type: "string" }, maxItems: 10 },
            },
            required: [
              "linkedInMessage",
              "pitch30s",
              "pitch60s",
              "whyYou",
              "whyCompany",
              "probableQuestions",
              "probableObjections",
              "miniPrepPlan",
            ],
          },
        },
      },
    }),
  })

  if (!response.ok) throw new Error("OpenAI request failed")
  return parseOpenAIApplicationPack(await response.json(), body)
}

export async function generateApplicationPack(
  provider: LLMProviderName,
  body: Required<ApplicationPackRequestBody>
) {
  if (provider === "openai") return generateApplicationPackWithOpenAI(body)
  return generateApplicationPackWithAnthropic(body)
}

export {
  getConfiguredLLMProvider,
  hasUsableProviderKey,
}
