import {
  generateApplicationPack,
  getConfiguredLLMProvider,
  hasUsableProviderKey,
  isValidApplicationPackBody,
  type ApplicationPackRequestBody,
} from "@/lib/llm/application-pack"
import { MISSING_API_KEY_MESSAGE } from "@/lib/llm/cv-targeting"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: ApplicationPackRequestBody | null = null

  try {
    body = (await request.json()) as ApplicationPackRequestBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isValidApplicationPackBody(body)) {
    return Response.json({ error: "Missing profile or opportunity" }, { status: 400 })
  }

  const provider = getConfiguredLLMProvider()
  if (!provider || !hasUsableProviderKey(provider)) {
    return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
  }

  try {
    const pack = await generateApplicationPack(provider, body)
    if (!pack) {
      return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
    }

    return Response.json({ applicationPack: pack, provider })
  } catch {
    return Response.json({ error: `${provider} request failed` }, { status: 502 })
  }
}
