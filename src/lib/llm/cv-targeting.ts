import {
  isNonEmptyString,
  isValidCVTargetBody,
  type CVTargetRequestBody,
  type TargetedCVResponse,
} from "@/lib/local-cv-targeting"

export { isNonEmptyString, isValidCVTargetBody }
export type { CVTargetRequestBody, TargetedCVResponse }

export type LLMProviderName = "anthropic" | "openai"
export const MISSING_API_KEY_MESSAGE =
  "Cle API manquante. Ajoute une cle dans .env.local pour activer la generation IA."

interface AnthropicMessageContent {
  type?: unknown
  text?: unknown
}

interface OpenAIResponseOutputContent {
  type?: unknown
  text?: unknown
}

interface OpenAIResponseOutputItem {
  type?: unknown
  content?: unknown
}

function normalizeTargetedCVResponse(parsed: TargetedCVResponse): TargetedCVResponse | null {
  if (!Array.isArray(parsed.experiences) || !Array.isArray(parsed.keywords) || !isNonEmptyString(parsed.angle)) {
    return null
  }

  const atsRedFlags = Array.isArray(parsed.atsRedFlags)
    ? parsed.atsRedFlags.map(String).filter(Boolean).slice(0, 8)
    : undefined

  const gapAnalysis =
    parsed.gapAnalysis &&
    Array.isArray(parsed.gapAnalysis.reframe) &&
    Array.isArray(parsed.gapAnalysis.learn)
      ? {
          reframe: parsed.gapAnalysis.reframe.map(String).filter(Boolean).slice(0, 8),
          learn: parsed.gapAnalysis.learn.map(String).filter(Boolean).slice(0, 8),
        }
      : undefined

  return {
    experiences: parsed.experiences.map((experience) => ({
      id: String(experience.id),
      bullets: Array.isArray(experience.bullets)
        ? experience.bullets.slice(0, 5).map((bullet) => String(bullet))
        : [],
    })),
    angle: parsed.angle,
    keywords: parsed.keywords.map((keyword) => String(keyword)).slice(0, 20),
    atsRedFlags,
    gapAnalysis,
  }
}

export function parseTargetedCVJson(text: string): TargetedCVResponse | null {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  try {
    return normalizeTargetedCVResponse(JSON.parse(cleaned) as TargetedCVResponse)
  } catch {
    return null
  }
}

export function parseAnthropicTargetedCV(content: unknown): TargetedCVResponse | null {
  if (!Array.isArray(content)) return null

  const text = content
    .map((item: AnthropicMessageContent) => {
      if (item && item.type === "text" && typeof item.text === "string") {
        return item.text
      }
      return ""
    })
    .join("\n")
    .trim()

  return text ? parseTargetedCVJson(text) : null
}

export function parseOpenAITargetedCV(data: unknown): TargetedCVResponse | null {
  if (!data || typeof data !== "object") return null

  if ("output_text" in data && typeof data.output_text === "string") {
    return parseTargetedCVJson(data.output_text)
  }

  const output = "output" in data ? data.output : null
  if (!Array.isArray(output)) return null

  const text = output
    .flatMap((item: OpenAIResponseOutputItem) => (Array.isArray(item.content) ? item.content : []))
    .map((content: OpenAIResponseOutputContent) => {
      if ((content.type === "output_text" || content.type === "text") && typeof content.text === "string") {
        return content.text
      }
      return ""
    })
    .join("\n")
    .trim()

  return text ? parseTargetedCVJson(text) : null
}

export function buildCVTargetPrompt(body: Required<CVTargetRequestBody>) {
  const profile = body.profile
  const profileIntelligence = profile.profileIntelligence ?? null
  const experiences = profile.experiences.map((experience) => ({
    id: experience.id,
    title: experience.title,
    company: experience.company,
    description: experience.description,
    achievements: experience.achievements,
    keywords: experience.keywords,
  }))

  return `Tu es un expert senior en recrutement, CV ATS et repositionnement pour profils Strategy & Operations.

MISSION: adapter ce CV au poste cible avec la precision d'un cabinet de coaching haut de gamme.

REGLES ABSOLUES:
- JSON valide uniquement, sans markdown ni commentaire.
- N'invente aucun chiffre, entreprise, titre ou diplome absent du profil. Si une preuve manque, utilise ce qui existe.
- Si un achievement contient un chiffre, conserve-le. Ne l'invente pas.
- Tu reformules, priorises et alignes les preuves existantes, tu ne fabriques pas.

FORMAT DE SORTIE EXACT:
{
  "experiences": [{ "id": "experience-id", "bullets": ["bullet 1", ..., "bullet 5"] }],
  "angle": "angle de positionnement en une phrase percutante",
  "keywords": ["mot-cle 1", ...],
  "atsRedFlags": ["probleme ATS potentiel 1", ...],
  "gapAnalysis": {
    "reframe": ["competence presente dans le profil qu'on peut mieux mettre en valeur pour ce poste"],
    "learn": ["competence vraiment absente du profil et requise par le poste"]
  }
}

INSTRUCTIONS PAR SECTION:

experiences / bullets:
- 3 a 5 bullets par experience, orientes impact.
- Commence chaque bullet par un verbe d'action fort (Pilote, Deploie, Structure, Coordonne, Aligne...).
- Utilise des metriques si elles existent dans le profil. Ne les invente pas.
- Chaque bullet doit repondre a la question implicite du recruteur: "Quel impact concret?"
- Aligne les bullets sur les mots-cles et enjeux de la description de poste.

angle:
- Une phrase qui positionne le candidat comme la solution evidente pour ce poste.
- Specifique au poste et a l'entreprise, pas generique.

keywords:
- 15 a 20 mots-cles extraits de la description de poste et naturellement presents dans le profil.
- Mix: intitules, competences, outils, secteurs. Pas de repetition.

atsRedFlags:
- Signale tout ce qui pourrait bloquer le CV en ATS ou chez un recruteur:
  - formulations trop generiques sans metrique
  - titre du candidat eloigne du titre du poste
  - competences critiques du poste absentes du CV
  - signaux negatifs potentiels (trou, titre ambigu, etc.)
- Maximum 5 points. Si rien a signaler, retourne un tableau vide.

gapAnalysis:
- reframe: competences presentes dans le profil mais mal mises en valeur pour ce poste specifique. Ce sont des quick wins.
- learn: competences vraiment absentes du profil mais explicitement requises par le poste. Ce sont des vrais gaps.
- 2 a 5 items par categorie. Formulations courtes et actionnables.

POSTE CIBLE:
Titre: ${body.jobTitle}
Entreprise: ${body.company}
Description:
${body.jobDescription}

PROFIL CANDIDAT:
Nom: ${profile.name}
Positionnement: ${profile.positioningStatement}
Titres cibles: ${profile.targetTitles.join(", ")}
Secteurs cibles: ${profile.targetIndustries.join(", ")}
Competences: ${profile.skills.join(", ")}
Forces: ${profile.strengths.join(", ")}
Profile Intelligence:
${profileIntelligence ? JSON.stringify(profileIntelligence, null, 2) : "Aucune Profile Intelligence sauvegardee."}
Experiences JSON:
${JSON.stringify(experiences, null, 2)}
`
}

export function getConfiguredLLMProvider(): LLMProviderName | null {
  const configuredProvider = process.env.LLM_PROVIDER?.toLowerCase()
  if (configuredProvider === "anthropic" || configuredProvider === "openai") {
    return configuredProvider
  }

  if (process.env.OPENAI_API_KEY) return "openai"
  if (process.env.ANTHROPIC_API_KEY) return "anthropic"
  return null
}

export function isUsableApiKey(value: string | undefined) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return !normalized.includes("remplace") && normalized !== "sk-..." && normalized !== "sk-ant-..."
}

export function hasUsableProviderKey(provider: LLMProviderName) {
  if (provider === "openai") return isUsableApiKey(process.env.OPENAI_API_KEY)
  return isUsableApiKey(process.env.ANTHROPIC_API_KEY)
}

export async function generateTargetedCVWithAnthropic(
  body: Required<CVTargetRequestBody>
): Promise<TargetedCVResponse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!isUsableApiKey(apiKey)) return null
  const usableApiKey = String(apiKey).trim()

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": usableApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 1800,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: buildCVTargetPrompt(body),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error("Anthropic request failed")
  }

  const data = (await response.json()) as { content?: unknown }
  return parseAnthropicTargetedCV(data.content)
}

export async function generateTargetedCVWithOpenAI(
  body: Required<CVTargetRequestBody>
): Promise<TargetedCVResponse | null> {
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
      input: buildCVTargetPrompt(body),
      max_output_tokens: 1800,
      text: {
        format: {
          type: "json_schema",
          name: "targeted_cv",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              experiences: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    bullets: {
                      type: "array",
                      items: { type: "string" },
                      maxItems: 3,
                    },
                  },
                  required: ["id", "bullets"],
                },
              },
              angle: { type: "string" },
              keywords: {
                type: "array",
                items: { type: "string" },
                maxItems: 20,
              },
            },
            required: ["experiences", "angle", "keywords"],
          },
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error("OpenAI request failed")
  }

  return parseOpenAITargetedCV(await response.json())
}

export async function generateTargetedCV(
  provider: LLMProviderName,
  body: Required<CVTargetRequestBody>
): Promise<TargetedCVResponse | null> {
  if (provider === "openai") return generateTargetedCVWithOpenAI(body)
  return generateTargetedCVWithAnthropic(body)
}
