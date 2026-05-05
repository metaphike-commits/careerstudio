import {
  generateLinkedInAbout,
  isValidLinkedInAboutBody,
  type LinkedInAboutRequestBody,
} from "@/lib/llm/linkedin-about"
import { getConfiguredLLMProvider, hasUsableProviderKey, MISSING_API_KEY_MESSAGE } from "@/lib/llm/cv-targeting"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: LinkedInAboutRequestBody | null = null
  try {
    body = (await request.json()) as LinkedInAboutRequestBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isValidLinkedInAboutBody(body)) {
    return Response.json({ error: "Profile with name required" }, { status: 400 })
  }

  const provider = getConfiguredLLMProvider()
  if (!provider || !hasUsableProviderKey(provider)) {
    return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
  }

  try {
    const result = await generateLinkedInAbout(provider, body)
    if (!result) {
      return Response.json({ error: `${provider} request failed or returned invalid JSON` }, { status: 502 })
    }
    return Response.json({ linkedInAbout: result, provider })
  } catch {
    return Response.json({ error: `${provider} request failed` }, { status: 502 })
  }
}
