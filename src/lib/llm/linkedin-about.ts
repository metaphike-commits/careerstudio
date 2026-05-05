import type { UserProfile } from "@/types"
import {
  isNonEmptyString,
  type LLMProviderName,
} from "@/lib/llm/cv-targeting"

export interface LinkedInAboutResult {
  formal: string
  conversational: string
  bold: string
}

export interface LinkedInAboutRequestBody {
  profile?: UserProfile
  cvText?: string
}

export function isValidLinkedInAboutBody(
  body: LinkedInAboutRequestBody | null
): body is Required<Pick<LinkedInAboutRequestBody, "profile">> & LinkedInAboutRequestBody {
  return Boolean(body && body.profile && isNonEmptyString(body.profile.name))
}

function normalizeLinkedInAbout(parsed: unknown): LinkedInAboutResult | null {
  if (!parsed || typeof parsed !== "object") return null
  const p = parsed as Partial<LinkedInAboutResult>
  if (!isNonEmptyString(p.formal) || !isNonEmptyString(p.conversational) || !isNonEmptyString(p.bold)) {
    return null
  }
  return { formal: p.formal.trim(), conversational: p.conversational.trim(), bold: p.bold.trim() }
}

export function parseLinkedInAboutJson(text: string): LinkedInAboutResult | null {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim()
  try {
    return normalizeLinkedInAbout(JSON.parse(cleaned))
  } catch {
    return null
  }
}

export function buildLinkedInAboutPrompt(body: Required<Pick<LinkedInAboutRequestBody, "profile">> & LinkedInAboutRequestBody): string {
  const p = body.profile
  const intel = p.profileIntelligence

  const proofPoints = p.proofPoints?.map((pp) => `- ${pp.skill}: ${pp.evidence}`).join("\n") ?? ""
  const impactProofs = intel?.impactProofs?.slice(0, 5).join("\n") ?? ""
  const objections = intel?.likelyObjections?.slice(0, 3).join(", ") ?? p.objections?.slice(0, 3).join(", ") ?? ""
  const pitchShort = intel?.pitch?.short ?? p.positioningStatement ?? ""

  return `Tu es un expert en personal branding LinkedIn pour profils Strategy & Operations seniores.

MISSION: ecrire 3 variantes de section "About" LinkedIn pour ce profil.

REGLES ABSOLUES:
- Premiere personne uniquement.
- Aucun buzzword: pas de "passionne", "dynamique", "proactif", "enthousiaste", "leader né".
- Centre sur les problemes concrets resolus et pour qui.
- Maximum 250 mots par variante.
- Francais professionnel, direct, humain.
- N'invente aucun chiffre ou experience absents du profil.
- Chaque variante doit se terminer par une ligne d'appel a l'action ou d'ouverture.

3 VARIANTES A PRODUIRE:

formal — Ton sobre et structure. Faits, resultats, expertise. Pour recruteurs institutionnels, grands groupes, conseil.
conversational — Direct, accessible, presque comme une conversation. Pour scale-ups, startups, profils qui cherchent l'authenticite.
bold — Accroche forte en premiere ligne. Affirmation claire et memorisable. Pour les profils qui veulent se differencier.

FORMAT JSON EXACT (sans markdown):
{
  "formal": "...",
  "conversational": "...",
  "bold": "..."
}

PROFIL:
Nom: ${p.name}
Positionnement: ${pitchShort}
Titres cibles: ${p.targetTitles.join(", ")}
Secteurs: ${p.targetIndustries.join(", ")}
Localisation: ${p.preferredLocations.join(", ")}
Competences cles: ${p.skills.slice(0, 12).join(", ")}
Forces: ${p.strengths.slice(0, 5).join(", ")}
Experiences: ${p.experiences.map((e) => `${e.title} chez ${e.company}`).join(" | ")}
Preuves d'impact:
${impactProofs || proofPoints || "(non renseignees)"}
Objections recruteur possibles: ${objections || "(non renseignees)"}
${body.cvText ? `\nExtrait CV:\n${body.cvText.slice(0, 800)}` : ""}
`
}

export async function generateLinkedInAbout(
  provider: LLMProviderName,
  body: Required<Pick<LinkedInAboutRequestBody, "profile">> & LinkedInAboutRequestBody
): Promise<LinkedInAboutResult | null> {
  const prompt = buildLinkedInAboutPrompt(body)

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content = data?.content
    if (!Array.isArray(content)) return null
    const text = content.map((item: { type?: unknown; text?: unknown }) =>
      item?.type === "text" && typeof item.text === "string" ? item.text : ""
    ).join("").trim()
    return text ? parseLinkedInAboutJson(text) : null
  }

  // OpenAI
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      input: prompt,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const outputText = data?.output_text
  if (typeof outputText === "string") return parseLinkedInAboutJson(outputText)

  const output = data?.output
  if (!Array.isArray(output)) return null
  const text = output
    .flatMap((item: { content?: unknown }) => (Array.isArray(item.content) ? item.content : []))
    .map((c: { type?: unknown; text?: unknown }) =>
      (c.type === "output_text" || c.type === "text") && typeof c.text === "string" ? c.text : ""
    )
    .join("").trim()
  return text ? parseLinkedInAboutJson(text) : null
}
