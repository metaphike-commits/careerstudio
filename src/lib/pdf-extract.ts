export class PDFExtractError extends Error {
  code: "not_pdf" | "empty" | "image_only" | "parse_error"

  constructor(code: "not_pdf" | "empty" | "image_only" | "parse_error", message?: string) {
    super(message ?? code)
    this.name = "PDFExtractError"
    this.code = code
  }
}

export function isPDFFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

export async function extractPDFText(file: File): Promise<{ text: string; pageCount: number }> {
  if (!isPDFFile(file)) {
    throw new PDFExtractError("not_pdf", "Le fichier n'est pas un PDF.")
  }

  let pdfjs: typeof import("pdfjs-dist")
  try {
    pdfjs = await import("pdfjs-dist")
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
  } catch {
    throw new PDFExtractError("parse_error", "Impossible de charger le lecteur PDF.")
  }

  const arrayBuffer = await file.arrayBuffer()

  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>>["promise"] extends Promise<infer T> ? T : never
  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    pdf = await loadingTask.promise
  } catch {
    throw new PDFExtractError("parse_error", "Impossible de lire le fichier PDF.")
  }

  const pageCount = pdf.numPages
  const pageTexts: string[] = []

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
    pageTexts.push(pageText)
  }

  const text = pageTexts.join("\n").trim()

  if (!text) {
    throw new PDFExtractError("empty", "Le PDF ne contient aucun texte.")
  }

  if (text.length < 50) {
    throw new PDFExtractError(
      "image_only",
      "Ce PDF semble etre un scan ou une image. Aucun texte extractible n'a ete trouve. Copiez-collez le texte manuellement."
    )
  }

  return { text, pageCount }
}
