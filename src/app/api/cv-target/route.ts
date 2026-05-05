import {
  generateTargetedCV,
  getConfiguredLLMProvider,
  hasUsableProviderKey,
  isValidCVTargetBody,
  MISSING_API_KEY_MESSAGE,
  type CVTargetRequestBody,
} from "@/lib/llm/cv-targeting"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: CVTargetRequestBody | null = null

  try {
    body = (await request.json()) as CVTargetRequestBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isValidCVTargetBody(body)) {
    return Response.json({ error: "Missing required profile or job fields" }, { status: 400 })
  }

  const provider = getConfiguredLLMProvider()
  if (!provider || !hasUsableProviderKey(provider)) {
    return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
  }

  try {
    const result = await generateTargetedCV(provider, body)

    if (!result) {
      return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
    }

    return Response.json({ ...result, provider })
  } catch {
    return Response.json({ error: `${provider} request failed` }, { status: 502 })
  }
}
