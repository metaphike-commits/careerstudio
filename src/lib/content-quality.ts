export const MAX_PROOF_POINT_LENGTH = 220
const RAW_DUMP_HARD_LIMIT = 350

export function isLikelyRawCVDump(text: string): boolean {
  if (!text) return false
  if (text.length > RAW_DUMP_HARD_LIMIT) return true
  // 3+ years = multiple experience entries concatenated
  if ((text.match(/\b(19|20)\d{2}\b/g) ?? []).length >= 3) return true
  // legal entity suffixes = multiple company names
  if ((text.match(/\b(?:Inc|Ltd|SAS|SA|GmbH|Corp|LLC)\b/gi) ?? []).length >= 2) return true
  // contact info = header/footer dump
  if (/@[\w.-]+\.|linkedin\.com|www\./i.test(text)) return true
  // 4+ line breaks = section or block paste
  if ((text.match(/\n/g) ?? []).length >= 4) return true
  return false
}

export function cleanProofPoint(text: string): string | null {
  if (!text || !text.trim()) return null
  if (isLikelyRawCVDump(text)) return null
  if (text.length > MAX_PROOF_POINT_LENGTH) return text.slice(0, MAX_PROOF_POINT_LENGTH - 3) + "..."
  return text
}

export const MAX_ACHIEVEMENT_LENGTH = 200

export function cleanAchievement(text: string): string | null {
  if (!text || !text.trim()) return null
  if (isLikelyRawCVDump(text)) return null
  if (text.length > MAX_ACHIEVEMENT_LENGTH) return text.slice(0, MAX_ACHIEVEMENT_LENGTH - 3) + "..."
  return text
}

export function truncateDisplayText(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 3) + "..."
}
