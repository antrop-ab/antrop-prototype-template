// Modeller för AI-funktioner i prototypen. Anropen går via Vercel AI Gateway:
// på Vercel autentiseras de automatiskt (OIDC), lokalt via `npm run env`.
// Byt modell här eller med miljövariabeln AI_MODEL. Kolla vilka som finns:
// https://vercel.com/ai-gateway/models
export const MODEL = process.env.AI_MODEL ?? "anthropic/claude-sonnet-5"

// Snabb och billig modell för små uppgifter: sammanfattningar, klassning, förslag.
export const FAST_MODEL = process.env.AI_FAST_MODEL ?? "anthropic/claude-haiku-4.5"

/**
 * Finns en nyckel till AI Gateway? På Vercel alltid (OIDC), lokalt efter `npm run env`.
 * Använd på servern för att visa ett tydligt märkt exempelsvar i stället för ett fel,
 * så att AI-vyer går att visa och skärmdumpa innan prototypen är kopplad.
 */
export function isGatewayConfigured() {
  return Boolean(process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL)
}
