export type DataBoundaryId = "profile-intelligence" | "cv-targeting" | "application-pack" | "interview-prep"

export interface DataBoundary {
  id: DataBoundaryId
  title: string
  localData: string[]
  apiSentData: string[]
  notSentData: string[]
  requiresApiKey: boolean
  fallbackAvailable: boolean
}

export const dataBoundaries: Record<DataBoundaryId, DataBoundary> = {
  "profile-intelligence": {
    id: "profile-intelligence",
    title: "Analyse Profile Intelligence",
    localData: [
      "Profil courant et corrections manuelles",
      "Opportunites et scores stockes localement",
      "Memoire, candidatures et contacts",
    ],
    apiSentData: [
      "Texte du CV maitre colle par l'utilisateur",
      "Profil courant pour contexte",
    ],
    notSentData: [
      "Historique complet du pipeline",
      "Notes de memoire et contacts reseau",
      "Contenu du localStorage hors payload demande",
    ],
    requiresApiKey: true,
    fallbackAvailable: true,
  },
  "cv-targeting": {
    id: "cv-targeting",
    title: "Generation de CV cible",
    localData: [
      "Opportunite selectionnee et score local",
      "CV cible sauvegarde localement apres confirmation",
      "Pack candidature et statut pipeline",
    ],
    apiSentData: [
      "Profil utilisateur structure",
      "Description de poste",
      "Titre du poste et entreprise",
    ],
    notSentData: [
      "Statut de candidature",
      "Contacts reseau",
      "Notes de memoire et evenements pipeline",
    ],
    requiresApiKey: true,
    fallbackAvailable: true,
  },
  "application-pack": {
    id: "application-pack",
    title: "Generation du pack candidature",
    localData: [
      "Pack sauvegarde localement apres confirmation",
      "Statut pipeline et evenements manuels",
      "Memoire et notes d'entretien",
    ],
    apiSentData: [
      "Profil utilisateur structure",
      "Profile Intelligence si sauvegardee",
      "Offre selectionnee et description du poste",
      "Score local et raisons de fit",
    ],
    notSentData: [
      "Autres candidatures du pipeline",
      "Contacts reseau non lies a cette offre",
      "Memoire personnelle et notes d'entretien",
    ],
    requiresApiKey: true,
    fallbackAvailable: true,
  },
  "interview-prep": {
    id: "interview-prep",
    title: "Preparation d'entretien IA",
    localData: [
      "Fiche locale d'entretien",
      "Notes post-entretien sauvegardees manuellement",
      "Statut pipeline et confirmations manuelles",
    ],
    apiSentData: [
      "Profil utilisateur structure",
      "Candidature selectionnee",
      "Offre, CV cible, pack et contact lies si disponibles",
      "Notes memoire liees a cette candidature",
    ],
    notSentData: [
      "Autres candidatures non liees",
      "Contacts reseau non lies",
      "Memoire personnelle hors dossier selectionne",
    ],
    requiresApiKey: true,
    fallbackAvailable: true,
  },
}

export function getDataBoundary(id: DataBoundaryId): DataBoundary {
  return dataBoundaries[id]
}
