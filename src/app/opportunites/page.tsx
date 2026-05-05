"use client"

import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Plus, Radar, Search, SlidersHorizontal, X } from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { OpportunityListItem } from "@/components/opportunities/OpportunityListItem"
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail"
import { detectDuplicate, previewJobKeywords, getScoutQueue, SOURCE_PRESETS, parseJobDescriptionHead } from "@/lib/job-scout"
import { createManualOpportunity } from "@/lib/local-scoring"
import { mockProfile } from "@/data/mock-profile"
import type { RawScoutedJob } from "@/lib/scout-sources"
import type { JobOffer, RemoteType, Verdict } from "@/types"

const verdictFilters: { label: string; value: Verdict | "all" }[] = [
  { label: "Toutes", value: "all" },
  { label: "Candidater", value: "apply_now" },
  { label: "Investiguer", value: "investigate" },
  { label: "Veille", value: "watch" },
  { label: "Ignorer", value: "ignore" },
]

const emptyForm = {
  title: "",
  company: "",
  location: "Paris",
  remoteType: "hybrid" as RemoteType,
  source: "LinkedIn",
  url: "",
  description: "",
}

function detectSourceFromUrl(url: string): string | null {
  if (!url) return null
  const u = url.toLowerCase()
  if (u.includes("linkedin.com")) return "LinkedIn"
  if (u.includes("indeed.com") || u.includes("indeed.fr")) return "Indeed"
  if (u.includes("welcometothejungle") || u.includes("wttj.co")) return "Welcome to the Jungle"
  if (u.includes("glassdoor")) return "Glassdoor"
  if (u.includes("monster.")) return "Monster"
  if (u.includes("apec.fr")) return "APEC"
  return null
}

export default function OpportunitesPage() {
  const store = useAppStore()
  const { opportunities, selectedOpportunityId, setSelectedOpportunity, addManualOpportunity, updateOpportunityStatus, batchAddScoutedOpportunities, profile } = store
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Verdict | "all">("all")
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [duplicate, setDuplicate] = useState<JobOffer | null>(null)
  const [forceImport, setForceImport] = useState(false)
  const [scoutState, setScoutState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [scoutResult, setScoutResult] = useState<{ imported: number; duplicates: number } | null>(null)
  const [scoutError, setScoutError] = useState("")

  const runScout = async () => {
    const activeProfile = profile ?? mockProfile
    setScoutState("loading")
    setScoutResult(null)
    setScoutError("")
    try {
      const res = await fetch("/api/scout-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: activeProfile }),
      })
      const data = await res.json() as { jobs?: RawScoutedJob[]; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? "Scout failed")

      const rawJobs = data.jobs ?? []
      const newJobs: JobOffer[] = []
      let duplicates = 0

      for (const raw of rawJobs) {
        if (detectDuplicate({ title: raw.title, company: raw.company, url: raw.url }, opportunities)) {
          duplicates++
          continue
        }
        newJobs.push(
          createManualOpportunity(
            {
              title: raw.title,
              company: raw.company,
              location: raw.location || activeProfile.preferredLocations[0] || "Paris",
              remoteType: "hybrid",
              source: raw.source,
              url: raw.url,
              description: raw.description,
            },
            activeProfile
          )
        )
      }

      batchAddScoutedOpportunities(newJobs)
      setScoutResult({ imported: newJobs.length, duplicates })
      setScoutState("done")
      setTimeout(() => setScoutState("idle"), 6000)
    } catch (err) {
      setScoutError(err instanceof Error ? err.message : "Erreur scout")
      setScoutState("error")
      setTimeout(() => setScoutState("idle"), 5000)
    }
  }

  const keywordPreview = useMemo(() => previewJobKeywords(form.description), [form.description])
  const scoutQueue = useMemo(() => getScoutQueue(opportunities), [opportunities])

  const filtered = opportunities.filter((opp) => {
    if (opp.status === "new") return false
    const matchesSearch =
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.company.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || opp.score.verdict === filter
    return matchesSearch && matchesFilter
  })

  const selectedOpportunity = opportunities.find((o) => o.id === selectedOpportunityId)

  const handleSelectOpportunity = (id: string) => {
    setSelectedOpportunity(id)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.title.trim() || !form.company.trim() || form.description.trim().length < 80) {
      setFormError("Ajoute au moins un titre, une entreprise et une description de 80 caracteres.")
      return
    }

    if (!forceImport) {
      const found = detectDuplicate(form, opportunities)
      if (found) {
        setDuplicate(found)
        return
      }
    }

    addManualOpportunity({
      title: form.title,
      company: form.company,
      location: form.location,
      remoteType: form.remoteType,
      source: form.source,
      url: form.url,
      description: form.description,
    })
    setFilter("all")
    setSearch("")
    setForm(emptyForm)
    setFormError("")
    setDuplicate(null)
    setForceImport(false)
    setShowImport(false)
  }

  return (
    <div className="flex h-full flex-col gap-6 app-premium-bg p-6 lg:flex-row">
      <div className="flex max-h-[46vh] w-full shrink-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:max-h-none lg:w-[360px]">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950">Opportunités</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {filtered.length} offre{filtered.length > 1 ? "s" : ""}
              </span>
              <button
                onClick={runScout}
                disabled={scoutState === "loading"}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                aria-label="Lancer le scout"
                title="Scout quotidien Indeed"
              >
                {scoutState === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : scoutState === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Radar className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => {
                  setShowImport((value) => !value)
                  setFormError("")
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-700"
                aria-label="Ajouter une offre"
              >
                {showImport ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {scoutState === "done" && scoutResult && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              {scoutResult.imported === 0
                ? `Aucune nouvelle offre (${scoutResult.duplicates} doublons filtres).`
                : `${scoutResult.imported} nouvelle${scoutResult.imported > 1 ? "s offres importees" : " offre importee"}${scoutResult.duplicates > 0 ? ` · ${scoutResult.duplicates} doublons filtres` : ""}.`}
            </div>
          )}
          {scoutState === "error" && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {scoutError || "Erreur lors du scout. Verifie ta connexion."}
            </div>
          )}

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {verdictFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  filter === f.value
                    ? "bg-violet-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {showImport && (
            <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
              <div className="mb-3">
                <p className="text-xs font-semibold text-violet-900">Importer une offre</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-violet-700">
                  Analyse locale deterministe. Rien n&apos;est envoye a un serveur.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  value={form.title}
                  onChange={(event) => { setForm({ ...form, title: event.target.value }); setDuplicate(null); setForceImport(false) }}
                  placeholder="Titre du poste"
                  className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-violet-400"
                />
                <input
                  value={form.company}
                  onChange={(event) => { setForm({ ...form, company: event.target.value }); setDuplicate(null); setForceImport(false) }}
                  placeholder="Entreprise"
                  className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-violet-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    placeholder="Localisation"
                    className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-violet-400"
                  />
                  <select
                    value={form.remoteType}
                    onChange={(event) => setForm({ ...form, remoteType: event.target.value as RemoteType })}
                    className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-violet-400"
                  >
                    <option value="hybrid">Hybride</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">Presentiel</option>
                  </select>
                </div>

                {/* Source chips */}
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-violet-700">Source</p>
                  <div className="flex flex-wrap gap-1">
                    {SOURCE_PRESETS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, source: s })}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          form.source === s
                            ? "bg-violet-600 text-white"
                            : "bg-white border border-violet-200 text-violet-700 hover:bg-violet-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  value={form.url}
                  onChange={(event) => {
                    const url = event.target.value
                    const detected = detectSourceFromUrl(url)
                    setForm({ ...form, url, ...(detected ? { source: detected } : {}) })
                    setDuplicate(null)
                    setForceImport(false)
                  }}
                  placeholder="URL de l'offre (source détectée automatiquement)"
                  className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-violet-400"
                />
                <textarea
                  value={form.description}
                  onChange={(event) => {
                    const description = event.target.value
                    const parsed = parseJobDescriptionHead(description)
                    setForm({
                      ...form,
                      description,
                      title: form.title.trim() === "" && parsed.title ? parsed.title : form.title,
                      company: form.company.trim() === "" && parsed.company ? parsed.company : form.company,
                    })
                  }}
                  placeholder="Colle ici la description complete de l'offre — titre et entreprise détectés automatiquement..."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs leading-relaxed text-foreground outline-none focus:border-violet-400"
                />

                {/* Keyword preview */}
                {keywordPreview.length > 0 && (
                  <div className="rounded-lg border border-violet-100 bg-white px-3 py-2">
                    <p className="mb-1.5 text-[11px] font-semibold text-violet-700">
                      {keywordPreview.length} mot{keywordPreview.length > 1 ? "s" : ""}-cle{keywordPreview.length > 1 ? "s" : ""} detecte{keywordPreview.length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {keywordPreview.map((kw) => (
                        <span key={kw} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {formError && <p className="mt-2 text-[11px] font-medium text-rose-600">{formError}</p>}

              {/* Duplicate warning */}
              {duplicate && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <p className="text-[11px] text-amber-800">
                      Cette offre ressemble a <strong>{duplicate.title}</strong> chez <strong>{duplicate.company}</strong>, deja dans ta liste.
                    </p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setForceImport(true); setDuplicate(null) }}
                      className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                    >
                      Importer quand meme
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicate(null)}
                      className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
              >
                Analyser localement
              </button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {scoutQueue.length > 0 && (
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] font-semibold text-foreground">File d&apos;evaluation</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {scoutQueue.length} nouvelle{scoutQueue.length > 1 ? "s" : ""}
                </span>
              </div>
              {scoutQueue.map((opp) => (
                <div key={opp.id} className="px-4 py-2.5 border-t border-border/50 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{opp.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{opp.company}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-foreground">{opp.score.globalFit}%</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        opp.score.verdict === "apply_now"
                          ? "bg-emerald-50 text-emerald-700"
                          : opp.score.verdict === "investigate"
                          ? "bg-blue-50 text-blue-700"
                          : opp.score.verdict === "watch"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {opp.score.verdict === "apply_now"
                          ? "A candidater"
                          : opp.score.verdict === "investigate"
                          ? "Investiguer"
                          : opp.score.verdict === "watch"
                          ? "Veille"
                          : "Faible"}
                      </span>
                    </div>
                  </div>
                  {opp.score.reasonsFor[0] && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                      {opp.score.reasonsFor[0]}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateOpportunityStatus(opp.id, "shortlisted")
                        setSelectedOpportunity(opp.id)
                      }}
                      className="flex-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700 transition-colors"
                    >
                      Shortlister
                    </button>
                    <button
                      onClick={() => updateOpportunityStatus(opp.id, "archived")}
                      className="flex-1 rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Ignorer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
              {scoutQueue.length > 0 ? (
                <p className="text-sm text-muted-foreground">Évalue les offres dans la file ci-dessus</p>
              ) : opportunities.length === 0 ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5 text-violet-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Aucune offre encore</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Colle une description depuis LinkedIn, Indeed ou WTTJ. Le titre et l&apos;entreprise sont détectés automatiquement.
                  </p>
                  <button
                    onClick={() => setShowImport(true)}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    Ajouter ma première offre
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune offre correspondante</p>
              )}
            </div>
          ) : (
            filtered.map((opp) => (
              <OpportunityListItem
                key={opp.id}
                opportunity={opp}
                isSelected={opp.id === selectedOpportunityId}
                onClick={() => handleSelectOpportunity(opp.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:min-w-0">
        {selectedOpportunity ? (
          <OpportunityDetail opportunity={selectedOpportunity} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <SlidersHorizontal className="w-6 h-6 text-muted-foreground" />
            </div>
            {opportunities.length === 0 ? (
              <>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Prêt pour le scout quotidien
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-1">
                  Colle une fiche de poste depuis LinkedIn, Indeed ou WTTJ.
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Le titre, l&apos;entreprise et la source sont détectés automatiquement. Le score s&apos;affiche en 2 secondes.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Sélectionne une opportunité
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Clique sur une offre pour voir l&apos;analyse détaillée, les scores et les actions recommandées.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
