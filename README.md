# CareerStudio

Moteur d'action quotidien pour une recherche d'emploi Strategy & Operations.

Prototype local : aucun backend, aucun LLM connecté, données persistées dans le navigateur via `localStorage`.

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvre `http://localhost:3000` dans ton navigateur.

## Stack

- Next.js 16.2 App Router + React 19
- TypeScript 5 + Tailwind CSS 4
- Zustand 5 avec persist (`localStorage`, clé : `careerstudio-store`)
- Lucide React icons
- shadcn/ui components

## Routes

| Route | Description |
|---|---|
| `/` | Dashboard quotidien : KPI, top opportunités, actions prioritaires, pipeline, insights |
| `/opportunites` | Liste des opportunités + panneau détail avec analyse, CV ciblé et pack candidature |
| `/candidatures` | Pipeline avec confirmations manuelles, suggestions J+7/J+21/J+30 et timeline |
| `/cv` | CV ciblés ATS, scores, contenu ; `?job=<id>` permet une sélection directe |
| `/profil` | Source de vérité professionnelle : positionnement, preuves, objections |
| `/reseau` | Suivi des contacts réseau : messages préparés, confirmés, réponses |
| `/memoire` | Notes d'entretiens, feedbacks, refus : recherche, filtres, liens candidature |
| `/progression` | Funnel pipeline, taux de réponse/entretien, activité hebdomadaire |
| `/onboarding` | Simulation d'import du CV maître |
| `/parametres` | Export JSON, reset demo, suppression `localStorage`, mode demo/réel |

## Commandes

```bash
npm run dev      # serveur de développement
npm run build    # build de production (TypeScript + lint)
npm run lint     # ESLint
npx tsc --noEmit # typecheck seul
```

## Architecture

```text
src/
  app/             # Routes Next.js App Router
  components/      # Composants UI et features
    cv/            # CVScorePanel, CVContentPanel, ApplicationPackPanel
    dashboard/     # anciens composants dashboard, certains à auditer
    layout/        # Sidebar, ClientLayout
    opportunities/ # OpportunityDetail, OpportunityListItem
    shared/        # ScoreRing, ScoreBar, VerdictBadge, CompanyLogo, RadarChart
    copilot/       # CopilotPanel
  data/            # Données mock (profil, opportunités, CV, candidatures, mémoire)
  lib/             # Utilitaires (pipeline-rules, daily-actions, utils)
  stores/          # Zustand store global
  types/           # Types TypeScript domaine
```

## Règles domaine

- **Préparé != fait** : un CV généré ou un pack préparé ne confirme pas une candidature.
- **Confirmations manuelles** : seuls les boutons utilisateur changent le statut du pipeline.
- **Event sourcing léger** : chaque confirmation crée un `ApplicationEvent` avec `source: "manual"`.
- **Règles J+7/J+21/J+30** : suggestions de relance/ghosting, jamais de changement automatique.
- **Local-first** : le prototype ne transmet aucune donnée à un serveur.

## État produit

Le Sprint 7 a transformé l'interface vers une démo premium inspirée du visuel JobPilot AI :

- sidebar sombre avec navigation enrichie ;
- dashboard quotidien avec KPI, opportunités, actions et pipeline ;
- lignes d'opportunités plus proches du visuel cible ;
- panneau détail opportunité avec score, CV ciblé, ATS et pack candidature.

Le prochain axe recommandé est la stabilisation :

- QA visuelle ;
- nettoyage des textes et composants morts ;
- tests métier sur les règles critiques ;
- préparation d'une boucle de valeur plus réelle avant intégration LLM/backend.

## Docs agents

- `AGENTS.md` : règles de collaboration multi-agents
- `docs/PROJECT_BRIEF.md` : vision produit et contraintes
- `docs/TASKS.md` : roadmap et sprints
- `docs/HANDOFF.md` : état courant du projet
