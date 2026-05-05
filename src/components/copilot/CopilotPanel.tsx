"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import { mockOpportunities } from "@/data/mock-opportunities"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface Prompt {
  icon: string
  label: string
  response: string
}

const contextualPrompts: Record<"default" | "opportunity", Prompt[]> = {
  default: [
    {
      icon: "Action",
      label: "Que faire maintenant ?",
      response:
        "**Action la plus rentable aujourd'hui : préparer le CV ciblé Pennylane puis identifier un contact.**\n\nPourquoi ?\n- Pennylane est le meilleur match Strategy & Operations du pipeline.\n- Le CV ciblé existe, mais il reste des mots-clés à intégrer avant envoi.\n- Sans contact interne, le risque principal reste l'accès.\n\n**Temps estimé : 30 minutes.** CV d'abord, contact ensuite. La candidature n'est confirmée que quand tu cliques manuellement sur \"J'ai postulé\".",
    },
    {
      icon: "Blocage",
      label: "Quel est le vrai blocage ?",
      response:
        "**Blocage principal : l'accès humain, pas le volume de candidatures.**\n\nLe profil Strategy & Operations est crédible, mais le repositionnement depuis un historique Product peut être mal lu si le CV arrive froid dans un ATS.\n\n**Action corrective :** pour chaque offre prioritaire, le pack peut être préparé, mais la séquence idéale reste : CV ciblé, contact, message court, puis confirmation manuelle de la candidature.",
    },
    {
      icon: "30 min",
      label: "Je n'ai que 30 minutes",
      response:
        "**Plan 30 minutes :**\n\n1. **[10 min]** Ouvre le CV ciblé Pennylane et traite les mots-clés manquants.\n2. **[10 min]** Cherche 2 contacts Pennylane côté Operations, Strategy ou COO office.\n3. **[10 min]** Prépare un message court.\n\nNe marque rien comme fait tant que le message ou la candidature n'est pas réellement envoyé.",
    },
    {
      icon: "Suivi",
      label: "Lire mon pipeline",
      response:
        "**Lecture du pipeline :**\n\n- Les packs et CV préparés sont utiles, mais ils ne comptent pas comme actions faites.\n- Les statuts fiables sont ceux confirmés manuellement : postulé, contacté, relancé, réponse reçue, entretien, refus, ghosté ou archivé.\n- La prochaine amélioration de ROI vient du suivi réseau et des relances à J+7 / J+21.",
    },
  ],
  opportunity: [
    {
      icon: "Score",
      label: "Explique le score",
      response:
        "**Pourquoi cette offre score haut :**\n\n- Le besoin est Strategy & Operations, proche de ton positionnement cible.\n- Les preuves disponibles sont alignement OKR, reporting board, coordination cross-fonctionnelle et pilotage de programmes.\n- Le point faible reste l'accès : sans contact interne, le dossier risque d'être lu comme un ancien profil Product.",
    },
    {
      icon: "Risque",
      label: "Sois contradicteur",
      response:
        "**Risque principal : le repositionnement.**\n\nLe titre Product peut créer un doute si les premières lignes ne parlent pas clairement d'operations, process, reporting, COO-facing et coordination transverse.\n\n**Conseil :** ne postule pas à froid. Trouve d'abord un contact, puis utilise le pack comme support. Préparé ne veut pas dire envoyé.",
    },
    {
      icon: "Plan",
      label: "Réduis à 30 minutes",
      response:
        "**Plan candidature en 30 minutes :**\n\n**[0-10 min]** Vérifie le bloc ATS du CV ciblé.\n**[10-20 min]** Identifie un contact Operations ou Strategy.\n**[20-30 min]** Prépare le message LinkedIn.\n\nEnsuite seulement, confirme manuellement dans le pipeline ce qui a réellement été fait.",
    },
  ],
}

function generateResponse(input: string, hasOpportunity: boolean): string {
  const lower = input.toLowerCase()

  if (lower.includes("pennylane") || lower.includes("score")) {
    return "**Score Pennylane : analyse détaillée.**\n\nLe match vient surtout du positionnement Strategy & Operations : OKRs, reporting board, coordination cross-fonctionnelle et contexte SaaS B2B.\n\nLe point faible reste l'accès. Sans contact interne, le CV risque d'être filtré comme un ancien profil Product. Trouver un contact avant candidature augmente fortement la probabilité d'entretien."
  }

  if (lower.includes("cv") || lower.includes("bullet") || lower.includes("ats")) {
    return "**Analyse CV / ATS :**\n\nLe CV ciblé doit ouvrir sur operations, process, reporting et coordination transverse. Les mots-clés manquants doivent être traités avant envoi.\n\nPoint de vigilance : remplacer les bullets trop Product par des preuves d'alignement opérationnel et d'impact business."
  }

  if (lower.includes("entretien") || lower.includes("préparer") || lower.includes("prepare")) {
    return "**Préparation entretien :**\n\nQuestions probables :\n1. Comment as-tu structuré un rituel ou un process transverse ?\n2. Comment as-tu aligné des équipes sans autorité directe ?\n3. Pourquoi le passage de Product vers Strategy & Operations ?\n\nObjection à préparer : le titre Product dans le CV. Réponse : montrer que les preuves réelles sont operations, coordination, reporting et exécution."
  }

  if (lower.includes("blocage") || lower.includes("problème") || lower.includes("pourquoi")) {
    return "**Diagnostic de ta recherche :**\n\nLe blocage n'est pas seulement le CV. C'est la combinaison repositionnement + absence de contact.\n\nPriorité : pour chaque offre top 3, préparer le CV, identifier un contact, puis confirmer manuellement chaque action faite."
  }

  return hasOpportunity
    ? "Je peux analyser cette offre sous trois angles : fit Strategy & Operations, risques de repositionnement, ou prochaine action manuelle à confirmer."
    : "Je peux t'aider à choisir l'action du jour, prioriser les offres, renforcer le CV ciblé ou préparer une action réseau. Le principe reste simple : préparé ne veut pas dire fait."
}

export function CopilotPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour. Je suis ton copilote stratégique, connecté aux données locales CareerStudio : offres, scores, candidatures, CV et profil.\n\nPose une question sur la prochaine action, le CV, le pipeline ou le risque d'une offre.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(0)
  const { selectedOpportunityId } = useAppStore()
  const selectedOpp = mockOpportunities.find((o) => o.id === selectedOpportunityId)
  const activeContext: "default" | "opportunity" = selectedOpp ? "opportunity" : "default"

  const createMessageId = () => {
    nextMessageId.current += 1
    return `message-${nextMessageId.current}`
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = (content: string) => {
    if (!content.trim()) return

    const userMsg: Message = { id: createMessageId(), role: "user", content }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      const response = generateResponse(content, !!selectedOpp)
      const assistantMsg: Message = {
        id: createMessageId(),
        role: "assistant",
        content: response,
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsLoading(false)
    }, 900)
  }

  const handleQuickPrompt = (prompt: Prompt) => {
    const userMsg: Message = { id: createMessageId(), role: "user", content: prompt.label }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    setTimeout(() => {
      const assistantMsg: Message = {
        id: createMessageId(),
        role: "assistant",
        content: prompt.response,
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsLoading(false)
    }, 700)
  }

  const prompts = contextualPrompts[activeContext]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-12 h-12 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center z-40",
          isOpen && "hidden"
        )}
        aria-label="Ouvrir le copilote"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <div
        className={cn(
          "fixed bottom-0 right-0 w-[420px] h-[600px] bg-card border border-border rounded-tl-2xl shadow-2xl flex flex-col z-50 transition-all duration-300",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 rounded-tl-2xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">Copilote</p>
              {selectedOpp && (
                <p className="text-[10px] text-violet-600 mt-0.5">Contexte : {selectedOpp.company}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Fermer le copilote"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</pre>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                <span className="text-sm text-muted-foreground">Analyse en cours...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-3 py-2 border-t border-border shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {prompts.map((p) => (
              <button
                key={p.label}
                onClick={() => handleQuickPrompt(p)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-background text-xs font-medium text-foreground hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all whitespace-nowrap shrink-0"
              >
                <span className="text-[10px] font-bold text-violet-600">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 pb-4 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-violet-400 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Pose une question..."
              className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Envoyer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
