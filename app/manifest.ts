import type { MetadataRoute } from "next"

import { brand } from "@/app/brand"

// Gör att prototypen kan läggas på hemskärmen och öppnas i helskärm, som en app.
// Bra i användartester på telefon. Namnet kommer från app/brand.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    // Under ikonen får cirka 12 tecken plats. Längre namn kortas till första ordet.
    short_name: brand.name.length > 12 ? brand.name.split(" ")[0] : brand.name,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  }
}
