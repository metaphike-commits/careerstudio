import type { UserProfile, MasterCV } from "@/types"

export const mockProfile: UserProfile = {
  id: "profile-1",
  name: "Hamza",
  profileSource: "demo",
  targetTitles: [
    "Strategy & Operations Manager",
    "Business Operations Manager",
    "Chief of Staff",
    "Strategic Program Manager",
    "Operations Excellence Manager",
  ],
  targetIndustries: ["SaaS B2B", "Tech / Scale-up", "Marketplace", "Fintech", "Conseil en stratégie"],
  preferredLocations: ["Paris", "Remote France", "Full remote"],
  strengths: [
    "Structuration opérationnelle et efficacité transverse",
    "Pilotage de programmes complexes multi-équipes",
    "Analyse de données et décision data-driven",
    "Communication et alignement stakeholders C-suite",
    "Déploiement de frameworks de travail (OKRs, rituels, reporting)",
  ],
  skills: [
    "Strategy & Operations",
    "Program Management",
    "Stakeholder Management",
    "Data Analysis",
    "SQL",
    "Process Design",
    "OKRs",
    "Roadmap Planning",
    "Cross-functional Coordination",
    "Reporting & KPIs",
    "Notion",
    "Amplitude",
    "JIRA",
    "Figma",
    "Agile / Scrum",
  ],
  experiences: [
    {
      id: "exp-1",
      title: "Strategy & Operations Lead",
      company: "FinScale (Scale-up Fintech B2B)",
      startDate: "2021-03",
      endDate: "2023-11",
      description:
        "Pilotage de la stratégie produit et des opérations pour une plateforme SaaS B2B de gestion financière. Rôle transverse : alignement engineering, sales, customer success et C-suite.",
      achievements: [
        "Croissance ARR de 2M€ à 8M€ en 18 mois via alignement opérationnel cross-fonctionnel",
        "Structuration des rituels d'équipe et du cadre OKR pour 3 équipes (engineering, sales, support)",
        "Réduction du churn de 18% à 9% via un programme de retention coordonné sur 6 mois",
        "Recrutement et intégration de 6 collaborateurs operations et program management en 12 mois",
        "Déploiement d'un reporting exécutif mensuel partagé avec le board",
      ],
      keywords: ["SaaS B2B", "OKRs", "Operations", "ARR", "Churn", "Cross-functional", "Reporting", "Board"],
    },
    {
      id: "exp-2",
      title: "Senior Program Manager",
      company: "Marketlink (Marketplace B2B)",
      startDate: "2018-09",
      endDate: "2021-02",
      description:
        "Pilotage des initiatives cross-équipes sur la marketplace B2B. Coordination des projets entre engineering, ops vendeurs et équipes commerciales.",
      achievements: [
        "Coordination d'un programme de refonte vendeurs : activation +40% en 6 mois",
        "Mise en place d'un cadre de suivi des initiatives growth (A/B testing, reporting hebdo)",
        "Animation de comités de pilotage mensuels avec les directions métier",
      ],
      keywords: ["Program Management", "Marketplace", "B2B", "Cross-functional", "A/B Testing", "Coordination"],
    },
    {
      id: "exp-3",
      title: "Business Operations Manager",
      company: "Launchr (SaaS RH)",
      startDate: "2016-04",
      endDate: "2018-08",
      description:
        "Opérations business et pilotage de projets transverses pour une suite RH SaaS B2B.",
      achievements: [
        "Structuration du processus d'onboarding clients : délai réduit de 30 à 12 jours",
        "Déploiement d'un tableau de bord NPS partagé avec les équipes CS et produit",
        "Coordination du lancement d'un module scoring candidats avec les équipes engineering",
      ],
      keywords: ["Business Operations", "SaaS RH", "Onboarding", "NPS", "Process Design", "Coordination"],
    },
  ],
  achievements: [
    "Croissance ARR 2M€ → 8M€ via alignement opérationnel cross-fonctionnel (18 mois)",
    "Churn réduit de moitié via un programme de retention structuré",
    "Onboarding clients réduit de 30 à 12 jours par redesign du processus",
    "3 équipes alignées sur un cadre OKR commun déployé en 2 mois",
    "Reporting board mensuel mis en place et maintenu pendant 2 ans",
  ],
  proofPoints: [
    { skill: "Cross-functional coordination", evidence: "3 équipes alignées sur OKR chez FinScale, comités de pilotage chez Marketlink", strength: "strong" },
    { skill: "Program Management", evidence: "Programme refonte vendeurs Marketlink : +40% activation, 6 mois", strength: "strong" },
    { skill: "Data Analysis & Reporting", evidence: "Reporting board, dashboard NPS, suivi KPIs, usage SQL régulier", strength: "moderate" },
    { skill: "Process Design", evidence: "Onboarding client 30→12 jours, mais peu de documentation formelle disponible", strength: "moderate" },
    { skill: "Chief of Staff", evidence: "Profil transverse fort, mais pas de titre formel CoS ni d'expérience directe auprès d'un CEO", strength: "weak" },
    { skill: "Strategy / Business Development", evidence: "Exposition stratégique via board reporting, mais pas de livrables stratégiques formels", strength: "weak" },
  ],
  avoidRoles: ["Product Designer", "Business Analyst pur reporting", "Project Manager IT", "Product Owner standalone"],
  positioningStatement:
    "Strategy & Operations Manager avec 8 ans d'expérience en SaaS B2B et marketplace. Profil transverse, à l'aise entre la direction et les équipes terrain, spécialisé dans l'alignement opérationnel, le pilotage de programmes complexes et la structuration de fonctions en croissance.",
  objections: [
    "Titre Product sur le CV : risque d'être filtré avant même la lecture pour des postes Ops/Strategy",
    "Pas de titre formel 'Operations Manager' ou 'Chief of Staff' dans les expériences passées",
    "Trou dans le CV depuis novembre 2023",
    "Peu de preuves formelles de livrables stratégiques (slides board, frameworks publiés)",
  ],
  missingCriticalInfo: [
    "Exemples concrets de livrables opérationnels : process docs, cadres OKR, reporting templates",
    "Preuves de travail en direct avec un C-suite (CEO/COO) sur des décisions structurantes",
    "1-2 exemples STAR détaillés sur la gestion de situations complexes multi-équipes",
  ],
}

export const mockMasterCV: MasterCV = {
  id: "cv-master-1",
  rawText: "",
  fileName: "CV_Hamza_2024.pdf",
  uploadedAt: "2024-01-15T10:00:00Z",
  parsedStatus: "done",
  extractedProfileId: "profile-1",
}
