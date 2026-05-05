import {
  generateProfileIntelligence,
  getConfiguredLLMProvider,
  hasUsableProviderKey,
  isValidProfileIntelligenceBody,
  type ProfileIntelligenceRequestBody,
} from "@/lib/llm/profile-intelligence"
import { MISSING_API_KEY_MESSAGE } from "@/lib/llm/cv-targeting"
import { calibrateProfileIntelligence } from "@/lib/profile-intelligence"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: ProfileIntelligenceRequestBody | null = null

  try {
    body = (await request.json()) as ProfileIntelligenceRequestBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isValidProfileIntelligenceBody(body)) {
    return Response.json({ error: "Missing or too short master CV text" }, { status: 400 })
  }

  const provider = getConfiguredLLMProvider()
  if (!provider || !hasUsableProviderKey(provider)) {
    return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
  }

  try {
    const result = await generateProfileIntelligence(provider, body)
    if (!result) {
      return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
    }

    return Response.json({
      profileIntelligence: result,
      calibration: calibrateProfileIntelligence(result),
      provider,
    })
  } catch {
    return Response.json({ error: `${provider} request failed` }, { status: 502 })
  }
}
