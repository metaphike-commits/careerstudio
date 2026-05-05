"use client"

import { useCallback, useMemo, useState } from "react"
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { mockPipelineJobs } from "@/data/mock-applications"
import { useAppStore } from "@/stores/app-store"
import { cn } from "@/lib/utils"
import { buildMemoryIntelligence } from "@/lib/memory-intelligence"
import type { MemoryItem, MemoryItemType, MemorySentiment } from "@/types"
import { MetricTile, PageHeader, PageShell, PremiumCard, premiumButton, secondaryButton } from "@/components/shared/PageShell"

const typeConfig: Record<MemoryItemType, { label: string; className: string; icon: React.ElementType }> = {
  interview_note: { label: "Note entretien", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: MessageSquare },
  feedback: { label: "Feedback", className: "bg-violet-50 text-violet-700 border-violet-100", icon: Brain },
  rejection: { label: "Refus", className: "bg-rose-50 text-rose-700 border-rose-100", icon: AlertTriangle },
  outreach_message: { label: "Message", className: "bg-blue-50 text-blue-700 border-blue-100", icon: FileText },
  personal_note: { label: "Note perso", className: "bg-slate-50 text-slate-600 border-slate-100", icon: FileText },
}

const sentimentConfig: Record<MemorySentiment, { label: string; className: string }> = {
  positive: { label: "Positif", className: "text-emerald-700 bg-emerald-50" },
  neutral: { label: "Neutre", className: "text-slate-600 bg-slate-50" },
  negative: { label: "Negatif", className: "text-rose-700 bg-rose-50" },
  mixed: { label: "Mixte", className: "text-amber-700 bg-amber-50" },
}

const eventLabelByType: Record<MemoryItemType, string> = {
  interview_note: "Note d'entretien ajoutee",
  feedback: "Feedback enregistre",
  rejection: "Refus documente",
  outreach_message: "Message archive",
  personal_note: "Note personnelle ajoutee",
}

type MemoryFormState = Omit<MemoryItem, "id" | "createdAt" | "updatedAt">

const emptyForm: MemoryFormState = {
  type: "interview_note",
  title: "",
  company: "",
  content: "",
  linkedApplicationId: null,
  linkedContactId: null,
  tags: [],
  sentiment: "neutral",
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export default function MemoirePage() {
  const {
    memoryItems,
    addMemoryItem,
    updateMemoryItem,
    deleteMemoryItem,
    addApplicationEvent,
    applications,
    opportunities,
    networkContacts,
  } = useAppStore()
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<MemoryItemType | "all">("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [form, setForm] = useState<MemoryFormState>(emptyForm)
  const memoryIntelligence = useMemo(
    () => buildMemoryIntelligence(memoryItems),
    [memoryItems]
  )

  const getApplicationLabel = useCallback((applicationId: string) => {
    const application = applications.find((item) => item.id === applicationId)
    if (!application) return applicationId
    const opportunity = opportunities.find((item) => item.id === application.jobOfferId)
    const job = mockPipelineJobs[application.jobOfferId] ?? opportunity
    return job ? `${job.company} - ${job.title}` : application.jobOfferId
  }, [applications, opportunities])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return memoryItems.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter
      const searchable = [
        item.title,
        item.company,
        item.content,
        item.tags.join(" "),
        item.linkedApplicationId ? getApplicationLabel(item.linkedApplicationId) : "",
      ]
        .join(" ")
        .toLowerCase()
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)
      return matchesType && matchesQuery
    })
  }, [getApplicationLabel, memoryItems, query, typeFilter])

  const openCreate = () => {
    setForm(emptyForm)
    setTagInput("")
    setEditingItemId(null)
    setIsFormOpen(true)
  }

  const openEdit = (item: MemoryItem) => {
    setForm({
      type: item.type,
      title: item.title,
      company: item.company,
      content: item.content,
      linkedApplicationId: item.linkedApplicationId,
      linkedContactId: item.linkedContactId,
      tags: item.tags,
      sentiment: item.sentiment,
    })
    setTagInput(item.tags.join(", "))
    setEditingItemId(item.id)
    setIsFormOpen(true)
  }

  const cancelForm = () => {
    setForm(emptyForm)
    setTagInput("")
    setEditingItemId(null)
    setIsFormOpen(false)
  }

  const submitMemory = () => {
    if (!form.title.trim() || !form.content.trim()) return

    const tags = parseTags(tagInput)
    const company = form.company.trim() || "Non renseigne"

    if (editingItemId) {
      updateMemoryItem(editingItemId, { ...form, tags, company })
    } else {
      addMemoryItem({ ...form, tags, company })

      if (form.linkedApplicationId) {
        addApplicationEvent({
          applicationId: form.linkedApplicationId,
          type: "note",
          statusAfter: null,
          label: eventLabelByType[form.type],
          note: form.title.trim(),
          source: "manual",
        })
      }
    }

    cancelForm()
  }

  return (
    <PageShell size="xl">
      <PageHeader
        title="Memoire"
        subtitle="Notes d'entretiens, feedbacks, refus et messages. Simple, local, sans RAG."
      >
        <button onClick={openCreate} className={premiumButton}>
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <main className="space-y-5">
          {isFormOpen && (
            <PremiumCard>
              <h2 className="text-sm font-semibold text-foreground mb-4">
                {editingItemId ? "Modifier l'entree memoire" : "Nouvelle entree memoire"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value as MemoryItemType }))
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                  {Object.entries(typeConfig).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Titre"
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
                <input
                  value={form.company}
                  onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                  placeholder="Entreprise"
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <select
                  value={form.sentiment}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sentiment: event.target.value as MemorySentiment }))
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                  {Object.entries(sentimentConfig).map(([sentiment, config]) => (
                    <option key={sentiment} value={sentiment}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.linkedApplicationId ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      linkedApplicationId: event.target.value || null,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                  <option value="">Aucune candidature liee</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {getApplicationLabel(application.id)}
                    </option>
                  ))}
                </select>
                <select
                  value={form.linkedContactId ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      linkedContactId: event.target.value || null,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                  <option value="">Aucun contact lie</option>
                  {networkContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.company} - {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                placeholder="Colle ici la note d'entretien, le feedback, le refus ou l'ancien message..."
                rows={6}
                className="w-full mt-3 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="Tags separes par des virgules : stakeholders, refus, pricing..."
                className="w-full mt-3 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={cancelForm}
                  className={secondaryButton}
                >
                  Annuler
                </button>
                <button
                  onClick={submitMemory}
                  disabled={!form.title.trim() || !form.content.trim()}
                  className={premiumButton}
                >
                  {editingItemId ? "Enregistrer les modifications" : "Enregistrer"}
                </button>
              </div>
            </PremiumCard>
          )}

          <PremiumCard className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher dans la memoire..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as MemoryItemType | "all")}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
              >
                <option value="all">Tous les types</option>
                {Object.entries(typeConfig).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </PremiumCard>

          <section className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">Aucune entree memoire ne correspond.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const config = typeConfig[item.type]
                const TypeIcon = config.icon
                const sentiment = sentimentConfig[item.sentiment]
                return (
                  <PremiumCard key={item.id} as="article">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border", config.className)}>
                            <TypeIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", sentiment.className)}>
                            {sentiment.label}
                          </span>
                        </div>
                        <h2 className="text-base font-black text-slate-950 mt-3">{item.title}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.company} &mdash; {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                          {item.updatedAt !== item.createdAt && (
                            <span className="ml-1 text-violet-500">(modifie)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-violet-50 hover:text-violet-600 transition-colors"
                          aria-label="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMemoryItem(item.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mt-3">{item.content}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {tag}
                        </span>
                      ))}
                      {item.linkedApplicationId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                          {getApplicationLabel(item.linkedApplicationId)}
                        </span>
                      )}
                    </div>
                  </PremiumCard>
                )
              })
            )}
          </section>
        </main>

        <aside className="space-y-4">
          <MetricTile label="Couverture memoire" value={memoryItems.length} subtitle="entrees" tone="violet" />
          <MetricTile
            label="Elements lies"
            value={`${memoryIntelligence.linkedCoverage.ratio}%`}
            subtitle={`${memoryIntelligence.linkedCoverage.linked}/${memoryIntelligence.linkedCoverage.total} relies`}
            tone="emerald"
          />

          <section className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-violet-600" />
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                Signaux memoire locaux
              </p>
            </div>
            <p className="mb-3 text-xs font-semibold leading-relaxed text-violet-800">
              Analyse locale limitee : detection par mots-cles et liens manuels, a confirmer avant
              d&apos;en faire une conclusion strategique.
            </p>
            <div className="space-y-3">
              {memoryIntelligence.insights.map((insight) => (
                <div key={insight.id} className="rounded-lg bg-white/70 border border-violet-100 p-3">
                  <div className="flex items-start gap-2">
                    {insight.level === "warning" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-violet-950">{insight.title}</p>
                      <p className="text-xs text-violet-800 mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {memoryIntelligence.insights.length === 0 && (
                <p className="rounded-lg bg-white/70 border border-violet-100 p-3 text-sm font-semibold text-violet-800">
                  Ajoute ou relie quelques notes pour faire emerger les premiers patterns.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Patterns deduits localement
            </p>
            <PatternList title="Objections" items={memoryIntelligence.recurringObjections} tone="amber" />
            <PatternList title="Ce qui marche" items={memoryIntelligence.positivePatterns} tone="emerald" />
            <PatternList title="Suivis utiles" items={memoryIntelligence.followUpOpportunities} tone="violet" />
          </section>
        </aside>
      </div>
    </PageShell>
  )
}

function PatternList({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: "amber" | "emerald" | "violet"
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-800",
    emerald: "bg-emerald-50 text-emerald-800",
    violet: "bg-violet-50 text-violet-800",
  }

  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">Pas encore assez de signaux.</p>
        ) : (
          items.map((item) => (
            <p key={item} className={cn("rounded-xl px-3 py-2 text-sm font-bold leading-relaxed", toneClass[tone])}>
              {item}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
