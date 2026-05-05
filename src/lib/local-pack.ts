import type { ApplicationPack, JobOffer, UserProfile } from "@/types"
import { createProfileIntelligence } from "@/lib/profile-intelligence"

function firstNonEmpty(...values: Array<string | undefined | null>) {
  return values.find((value) => value && value.trim().length > 0)?.trim() ?? ""
}

function unique(values: string[], maxItems: number) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, maxItems)
}

export function generateLocalApplicationPack(
  profile: UserProfile,
  opportunity: JobOffer
): ApplicationPack {
  const intelligence = createProfileIntelligence(profile)
  const topExp = profile.experiences[0]
  const secondExp = profile.experiences[1]
  const impactProofs = intelligence.impactProofs.slice(0, 3)
  const starExamples = intelligence.starExamples.slice(0, 2)
  const topAchievement = firstNonEmpty(
    impactProofs[0],
    topExp?.achievements[0],
    topExp?.description,
    "pilotage d'initiatives transverses a fort impact"
  )

  const matchingSkills = profile.skills
    .filter((skill) =>
      opportunity.keywords.some((keyword) =>
        keyword.toLowerCase().includes(skill.toLowerCase().split(" ")[0])
      )
    )
    .slice(0, 3)
  const displaySkills = matchingSkills.length > 0 ? matchingSkills : profile.skills.slice(0, 3)
  const positioning = firstNonEmpty(
    intelligence.pitch.short,
    profile.positioningStatement,
    `Profil ${opportunity.title} avec experience en scale-up B2B.`
  )
  const recruiterPitch = firstNonEmpty(intelligence.pitch.recruiter, positioning)
  const interviewPitch = firstNonEmpty(intelligence.pitch.interview, recruiterPitch)

  const linkedInMessage = [
    "Bonjour [Prenom],",
    "",
    `Je viens de voir l'offre ${opportunity.title} chez ${opportunity.company} ; elle correspond directement a mon profil ${displaySkills.join(", ")}.`,
    "",
    `${recruiterPitch} Chez ${opportunity.company}, le contexte semble proche des situations ou mon impact est le plus fort.`,
    "",
    "Auriez-vous 20 minutes pour un echange ?",
    "",
    "Cordialement,",
    profile.name,
  ].join("\n")

  const pitch30s = [
    positioning,
    `Preuve cle : ${topAchievement.toLowerCase()}.`,
    `C'est exactement le type d'impact que je veux apporter chez ${opportunity.company}.`,
  ].join(" ")

  const pitch60s = [
    positioning,
    "",
    `Version entretien : ${interviewPitch}`,
    topExp
      ? `Exemple concret chez ${topExp.company} (${topExp.startDate.slice(0, 4)}-${topExp.endDate?.slice(0, 4) ?? "present"}) : ${topAchievement.toLowerCase()}.`
      : "",
    secondExp
      ? `Autre preuve chez ${secondExp.company} : ${secondExp.achievements[0] ?? secondExp.description ?? "structuration des operations"}.`
      : "",
    "",
    `Ce qui m'attire chez ${opportunity.company} : le poste demande les memes leviers que mes meilleurs resultats, notamment ${displaySkills.slice(0, 3).join(", ")}.`,
  ]
    .filter(Boolean)
    .join("\n")

  const fallbackProofs =
    profile.proofPoints.filter((proof) => proof.strength !== "missing").length > 0
      ? profile.proofPoints
          .filter((proof) => proof.strength !== "missing")
          .slice(0, 3)
          .map((proof) => `${proof.skill} : ${proof.evidence}`)
      : profile.experiences
          .slice(0, 3)
          .map((experience) => `${experience.title} chez ${experience.company} : ${experience.achievements[0] ?? experience.description}`)

  const proofLines = (impactProofs.length > 0 ? impactProofs : fallbackProofs).map(
    (proof, index) => `${index + 1}. ${proof}`
  )
  const whyYou = `Trois elements directement mobilisables pour ce poste :\n\n${proofLines.join("\n\n")}`

  const companySignal = firstNonEmpty(
    opportunity.score.reasonsFor[0],
    opportunity.score.recommendedAngle,
    `Mots-cles principaux : ${opportunity.keywords.slice(0, 4).join(", ")}`
  )
  const whyCompany = [
    `${opportunity.company} m'interesse pour le contexte specifique du poste ${opportunity.title}.`,
    "",
    `Ce qui ressort de l'analyse : ${companySignal}`,
    "",
    `Mon angle pour cette entreprise : ${opportunity.score.recommendedAngle}`,
    "",
    `Le point de rencontre est clair : ${displaySkills.slice(0, 3).join(", ")} peuvent creer de la valeur dans ce contexte, sans transformer une preparation en candidature envoyee.`,
  ].join("\n")

  const probableQuestions = unique(
    [
      `Concretement, pourquoi ton profil pour un poste ${opportunity.title} ?`,
      "Donne-moi un exemple de programme transverse pilote avec un impact mesurable.",
      "Comment tu geres un desaccord fort entre deux equipes que tu dois aligner ?",
      "Comment tu mesures ton impact dans un role transverse sans equipe directe ?",
      `Qu'est-ce qui t'attire specifiquement chez ${opportunity.company} ?`,
      ...starExamples.map((example) => `Peux-tu detailler l'exemple STAR "${example.title}" ?`),
      ...opportunity.score.redFlags
        .slice(0, 2)
        .map((flag) => `Comment tu reponds a cette objection : "${flag}" ?`),
      ...(intelligence.likelyObjections.length > 0 ? intelligence.likelyObjections : profile.objections ?? [])
        .slice(0, 2)
        .map((objection) => `Comment tu reponds a : "${objection}" ?`),
    ],
    8
  )

  const probableObjections = unique(
    [
      ...(intelligence.likelyObjections.length > 0 ? intelligence.likelyObjections : profile.objections ?? []),
      ...opportunity.score.reasonsAgainst,
    ],
    5
  )

  const kwHint =
    opportunity.score.reasonsAgainst[0]
      ? `Anticiper : ${opportunity.score.reasonsAgainst[0]}`
      : `Verifier que le CV integre les mots-cles : ${opportunity.keywords.slice(0, 3).join(", ")}`

  const miniPrepPlan = [
    `Preparer une reponse de 60s sur ton positionnement ${opportunity.title}`,
    impactProofs.length > 0
      ? `Selectionner les preuves d'impact a citer : ${impactProofs.slice(0, 2).join(" / ")}`
      : "Identifier 3 livrables avec chiffres d'impact directement lies a l'offre",
    starExamples.length > 0
      ? `Preparer les exemples STAR : ${starExamples.map((example) => example.title).join(" / ")}`
      : "Preparer 2 exemples STAR sur la coordination transverse",
    `Rechercher les actualites recentes de ${opportunity.company}`,
    "Preparer 3 questions sur l'organisation et les priorites actuelles",
    kwHint,
  ]

  return {
    jobOfferId: opportunity.id,
    cvVersionId: null,
    linkedInMessage,
    pitch30s,
    pitch60s,
    whyYou,
    whyCompany,
    probableQuestions,
    probableObjections,
    miniPrepPlan,
  }
}
