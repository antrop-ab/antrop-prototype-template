import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * true först när sidan körs i webbläsaren. Använd för innehåll som beror på
 * klockan eller tidszonen (datum räknade från idag): servern kör i UTC på Vercel,
 * och då kan server och webbläsare visa olika tider. Visa en Skeleton tills dess.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
