import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// String normalization
// ---------------------------------------------------------------------------

/** Strip accents and collapse to lowercase. Use for scoring term-matching. */
export function normalizeAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

/** Lowercase + trim + collapse whitespace. Use for dedup comparisons (URLs, titles). */
export function normalizeSlug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ")
}

// ---------------------------------------------------------------------------
// Number
// ---------------------------------------------------------------------------

/** Clamp a value to [min, max] and round to integer. */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/** Remove duplicates from any array. */
export function uniqueItems<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

/**
 * Deduplicate, trim, and remove blank strings.
 * Tolerates undefined/null entries (runtime arrays can include them despite string[] type).
 * Optional maxItems caps the result.
 */
export function uniqueStrings(items: string[], maxItems?: number): string[] {
  const result = Array.from(
    new Set(
      items
        .filter((s): s is string => s != null)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  )
  return maxItems !== undefined ? result.slice(0, maxItems) : result
}

// ---------------------------------------------------------------------------
// Text matching
// ---------------------------------------------------------------------------

/**
 * Returns true if haystack contains at least one of the needles (case-insensitive).
 */
export function hasAnySubstring(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase()
  return needles.some((n) => lower.includes(n.toLowerCase()))
}

/**
 * Returns true if every whitespace-separated word in `term` appears in `haystack`.
 * Both are accent-stripped and lowercased before comparison.
 * Use for multi-word S&O term matching (e.g. "Chief of Staff").
 */
export function includesAllWords(haystack: string, term: string): boolean {
  const normalizedHaystack = normalizeAccents(haystack)
  return normalizeAccents(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => normalizedHaystack.includes(part))
}
