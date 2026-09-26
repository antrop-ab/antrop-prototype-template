import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"

import { MODEL } from "@/lib/ai"

// Chattar kan ta tid. Vercel Functions tillåter upp till 300 sekunder.
export const maxDuration = 60

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: MODEL,
    system:
      "Du är en hjälpsam assistent i en klickbar prototyp. Svara kort, konkret och på svenska om användaren skriver på svenska.",
    messages: await convertToModelMessages(messages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
