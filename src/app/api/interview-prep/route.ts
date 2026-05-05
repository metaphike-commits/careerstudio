import {
  generateInterviewPrep,
  getConfiguredLLMProvider,
  hasUsableProviderKey,
  isValidInterviewPrepBody,
  type InterviewPrepRequestBody,
} from "@/lib/llm/interview-prep"
import { MISSING_API_KEY_MESSAGE } from "@/lib/llm/cv-targeting"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: InterviewPrepRequestBody | null = null

  try {
    body = (await request.json()) as InterviewPrepRequestBody
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!isValidInterviewPrepBody(body)) {
    return Response.json({ error: "Missing interview context" }, { status: 400 })
  }

  const provider = getConfiguredLLMProvider()
  if (!provider || !hasUsableProviderKey(provider)) {
    return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
  }

  try {
    const interviewPrep = await generateInterviewPrep(provider, body)
    if (!interviewPrep) {
      return Response.json({ error: MISSING_API_KEY_MESSAGE }, { status: 503 })
    }

    return Response.json({ interviewPrep, provider })
  } catch {
    return Response.json({ error: `${provider} request failed` }, { status: 502 })
  }
}
