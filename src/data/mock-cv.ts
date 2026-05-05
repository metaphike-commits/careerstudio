import type { CVVersion, ApplicationPack } from "@/types"

export const mockCVVersions: CVVersion[] = [
  {
    id: "cv-v1",
    masterCvId: "cv-master-1",
    jobOfferId: "job-1",
    title: "Strategy & Operations Manager (Pennylane)",
    atsScore: 82,
    recruiterReadability: 80,
    narrativeCoherence: 78,
    substanceScore: 74,
    keywordCoverage: 76,
    missingKeywords: ["Lean", "COO-facing", "Change Management"],
    includedKeywords: [
      "Strategy & Operations", "OKRs", "Cross-functional", "Reporting",
      "Program Management", "SaaS B2B", "Scale-up", "KPIs", "Stakeholders",
    ],
    bulletImprovements: [
      {
        original: "Responsable de la roadmap produit chez FinScale",
        improved: "Piloté l'alignement opérationnel cross-fonctionnel chez FinScale (engineering, sales, CS), contribuant à la croissance ARR de 2M€ à 8M€ en 18 mois.",
        reason: "Retirer le signal 'roadmap produit', mettre en avant la coordination transverse et l'impact business.",
      },
      {
        original: "Management d'une équipe de PMs",
        improved: "Structuré le cadre OKR et les rituels hebdomadaires pour 3 équipes (40+ collaborateurs), réduisant le délai de prise de décision de 3 semaines à 5 jours.",
        reason: "Repositionner le management comme structuration opérationnelle, avec un chiffre d'impact.",
      },
      {
        original: "Réduction du churn clients",
        improved: "Coordonné un programme de retention transverse (CS, Produit, Sales) : churn réduit de 18% à 9% en 18 mois via 3 chantiers pilotés en parallèle.",
        reason: "Mettre en avant la coordination transverse plutôt que la décision produit.",
      },
    ],
    content: `HAMZA — Strategy & Operations Manager
Paris · linkedin.com/in/hamza · hamza@email.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POSITIONNEMENT
Strategy & Operations Manager avec 8 ans d'expérience en SaaS B2B et marketplace. Profil transverse spécialisé dans l'alignement opérationnel cross-équipes, le pilotage de programmes complexes et la structuration de fonctions en forte croissance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPÉRIENCES

Strategy & Operations Lead · FinScale (SaaS B2B Fintech) · 2021–2023
→ Piloté l'alignement opérationnel cross-fonctionnel (engineering, sales, CS) : ARR 2M€ → 8M€ en 18 mois
→ Structuré le cadre OKR et les rituels de pilotage pour 3 équipes (40+ collaborateurs)
→ Déployé le reporting exécutif mensuel partagé avec le board d'investisseurs
→ Coordonné le programme de retention transverse : churn 18% → 9% en 18 mois
→ Recruté et intégré 6 collaborateurs en 12 mois

Senior Program Manager · Marketlink (Marketplace B2B) · 2018–2021
→ Piloté le programme de refonte vendeurs (engineering + ops + commercial) : activation +40% en 6 mois
→ Mis en place le cadre de suivi des initiatives growth et les comités de pilotage mensuels
→ Coordonné 4 équipes sur des projets transverses de 3 à 12 mois

Business Operations Manager · Launchr (SaaS RH) · 2016–2018
→ Réduit le délai d'onboarding clients de 30 à 12 jours via redesign du processus
→ Déployé le tableau de bord NPS partagé avec CS et direction
→ Coordonné le lancement d'un module stratégique avec les équipes engineering

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPÉTENCES
Strategy & Operations · Program Management · OKRs · Cross-functional Coordination
Reporting & KPIs · Process Design · Stakeholder Management · Data Analysis · SQL
Notion · JIRA · Amplitude · Figma · Agile/Scrum

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMATION
École de Commerce · Master Management · 2016`,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cv-v2",
    masterCvId: "cv-master-1",
    jobOfferId: "job-3",
    title: "Business Operations Manager (Alan)",
    atsScore: 79,
    recruiterReadability: 83,
    narrativeCoherence: 76,
    substanceScore: 71,
    keywordCoverage: 74,
    missingKeywords: ["Lean", "Amélioration continue formelle", "ISO / BPMN"],
    includedKeywords: [
      "Business Operations", "KPIs", "Process Design", "COO", "Reporting",
      "Cross-functional", "OKRs", "Scale-up",
    ],
    bulletImprovements: [
      {
        original: "Lancé un module RH chez Launchr",
        improved: "Coordonné la conception et le déploiement d'un module stratégique chez Launchr (SaaS RH), structurant la collaboration engineering/ops sur un projet de 8 mois.",
        reason: "Repositionner comme coordination de projet transverse, pas comme décision produit.",
      },
    ],
    content: `HAMZA — Business Operations Manager
Paris · linkedin.com/in/hamza · hamza@email.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POSITIONNEMENT
Business Operations Manager avec 8 ans d'expérience en SaaS B2B. Spécialisé dans la structuration de processus, le pilotage de KPIs et la coordination transverse dans des contextes de croissance rapide.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPÉRIENCES

Business Ops & Operations Lead · FinScale · 2021–2023
→ Coordonné les opérations cross-fonctionnelles (engineering, sales, CS) : ARR 2M€ → 8M€ en 18 mois
→ Structuré les rituels opérationnels et le cadre OKR pour 3 équipes
→ Déployé reporting exécutif mensuel et dashboards de pilotage board

Senior Program Manager · Marketlink · 2018–2021
→ Programme de refonte vendeurs : activation +40%, délai 6 mois
→ Comités de pilotage mensuels avec les directions métier

Business Operations Manager · Launchr (SaaS RH) · 2016–2018
→ Onboarding clients : délai réduit de 30 à 12 jours
→ Dashboard NPS opérationnel partagé direction/CS
→ Coordination projet module stratégique (8 mois, 3 équipes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPÉTENCES
Business Operations · Process Design · KPIs · OKRs · Reporting
Cross-functional Coordination · SQL · Data Analysis · Notion · JIRA`,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockApplicationPacks: Record<string, ApplicationPack> = {
  "job-1": {
    jobOfferId: "job-1",
    cvVersionId: "cv-v1",
    linkedInMessage: `Bonjour [Prénom],

Je viens de voir l'offre Strategy & Operations Manager chez Pennylane — elle correspond exactement à ce que je fais depuis 8 ans en scale-up SaaS B2B.

Chez FinScale, j'ai piloté l'alignement opérationnel cross-équipes pendant une phase de croissance ARR 2M€ → 8M€ : structuration des OKRs, reporting board, coordination engineering/sales/CS. C'est précisément ce type de rôle que je cherche à reproduire dans un contexte similaire.

Auriez-vous 20 minutes cette semaine pour un échange ?

Cordialement,
Hamza`,

    pitch30s: `Je suis Strategy & Operations Manager avec 8 ans d'expérience en SaaS B2B. Mon profil est transverse : j'ai piloté des programmes cross-équipes, structuré des cadres OKR, construit des reportings board et coordonné des initiatives de croissance dans des contextes de scale-up. Chez FinScale, c'est ce type de travail qui a accompagné la croissance de 2 à 8 millions d'euros d'ARR en 18 mois. Pennylane, avec sa phase Series C, me semble être exactement le bon contexte.`,

    pitch60s: `Je suis Strategy & Operations Manager avec 8 ans d'expérience en SaaS B2B et marketplace. Mon profil est fondamentalement transverse : je travaille à l'intersection entre la direction et les équipes terrain, en pilotant des programmes complexes, en structurant des processus et en construisant les outils d'alignement opérationnel.

Chez FinScale, j'ai coordonné 3 équipes sur les initiatives de croissance, structuré le cadre OKR, déployé le reporting board et piloté un programme de retention qui a divisé le churn par deux en 18 mois.

Ce qui m'attire chez Pennylane : la phase de scaling Series C où ce type de coordination transverse crée le plus de valeur, et la conviction que l'opérationnel de qualité est un avantage compétitif durable.`,

    whyYou: `Trois preuves directement mobilisables pour ce poste :

1. **Coordination cross-fonctionnelle à impact** : chez FinScale, j'ai aligné engineering, sales et CS sur un cadre OKR commun pendant une phase de forte croissance — c'est le cœur de ce poste.

2. **Reporting et pilotage C-suite** : j'ai construit et maintenu pendant 2 ans un reporting board mensuel pour un comité d'investisseurs. La capacité à traduire l'opérationnel en langage exécutif est acquise.

3. **Structuration de processus** : chez Launchr, j'ai réduit le délai d'onboarding clients de 30 à 12 jours par redesign du processus. C'est une preuve concrète d'efficacité opérationnelle.`,

    whyCompany: `Pennylane a réussi à transformer un secteur perçu comme une contrainte (la comptabilité) en un produit que les utilisateurs choisissent. C'est rare, et ça demande une rigueur opérationnelle exceptionnelle pour scaler sans perdre cette qualité.

Ce qui m'intéresse spécifiquement : la phase Series C où l'organisation doit se structurer sans perdre l'agilité du début. C'est exactement là où mon profil S&O a le plus d'impact — construire les systèmes qui permettent à 200 puis 500 personnes de rester alignées.`,

    probableQuestions: [
      "Concrètement, quelle est la différence entre ton rôle actuel et un Operations Manager classique ?",
      "Comment tu as géré un désaccord fort entre deux équipes que tu devais aligner ?",
      "Donne-moi un exemple de processus que tu as redesigné avec un impact mesurable.",
      "Tu viens du Product — pourquoi ce pivot vers les Ops ? Qu'est-ce qui a changé ?",
      "Comment tu mesures ton propre impact dans un rôle transverse ?",
      "Trou CV depuis novembre 2023 — que s'est-il passé ?",
    ],

    probableObjections: [
      "Votre CV est très orienté Product — nous cherchons quelqu'un avec un historique Ops formalisé.",
      "Vous n'avez jamais eu de titre formel Operations Manager ou Chief of Staff.",
      "8 ans d'expérience mais dans des structures max 100 personnes — comment vous adapterez-vous à notre échelle ?",
      "Vous êtes en recherche depuis plusieurs mois — pourquoi vous n'avez pas trouvé ?",
    ],

    miniPrepPlan: [
      "Préparer une réponse de 60 secondes sur le repositionnement Product → Ops (claire, honnête, sans excuses)",
      "Identifier 3 livrables opérationnels concrets à mentionner (reporting board, cadre OKR, process doc)",
      "Préparer 2 exemples STAR sur la coordination transverse sous pression",
      "Chercher les dernières actualités Pennylane (levée, recrutements, produit) pour personnaliser",
      "Préparer 3 questions pertinentes sur l'organisation Ops actuelle chez Pennylane",
    ],
  },
}
