"use client"

import { useChat } from "@ai-sdk/react"
import { Sparkles } from "lucide-react"
import Link from "next/link"

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { Button } from "@/components/ui/button"

// Exempel på en AI-funktion. Servern ligger i app/api/chat/route.ts.
const suggestions = [
  "Sammanfatta en lång text åt mig",
  "Föreslå tre rubriker till en nyhetsartikel",
  "Förklara ett begrepp enkelt",
]

export default function ChatExample() {
  const { messages, sendMessage, status, stop, error } = useChat()
  const busy = status === "submitted" || status === "streaming"

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link href="/" transitionTypes={["nav-back"]}>Tillbaka</Link>
        </Button>
        <h1 className="text-base font-semibold">AI-chatt</h1>
        <span className="w-20" aria-hidden />
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="gap-6 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="flex flex-col items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                  <Sparkles className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold">Vad kan jag hjälpa dig med?</h2>
                  <p className="text-muted-foreground">Skriv en fråga eller välj ett förslag nedan.</p>
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <MessageResponse key={`${message.id}-${i}`}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer>Tänker …</Shimmer>}
          {error && (
            <p role="alert" className="text-destructive">
              Något gick fel. Är AI Gateway kopplad? Kör <code>npm run env</code> och starta om.
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton aria-label="Till senaste meddelandet" />
      </Conversation>

      <div className="flex flex-col gap-3 pt-2 pb-4">
        {messages.length === 0 && (
          <Suggestions>
            {suggestions.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={(text) => sendMessage({ text })} />
            ))}
          </Suggestions>
        )}
        <PromptInput
          onSubmit={({ text }) => {
            if (text.trim()) sendMessage({ text })
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="Skriv ett meddelande" aria-label="Meddelande" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              status={status}
              onStop={stop}
              aria-label={busy ? "Stoppa svaret" : "Skicka"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
