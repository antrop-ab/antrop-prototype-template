import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // next dev skriver annars in ett eget block i CLAUDE.md, vilket ger en ändrad fil
  // i varje prototyp. Samma råd står redan i CLAUDE.md under "Next.js 16".
  agentRules: false,
}

export default nextConfig
