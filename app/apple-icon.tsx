import { ImageResponse } from "next/og"

import { brand } from "@/app/brand"

// Ikonen på hemskärmen och i webbläsarfliken: kundens färg och namnets första bokstav.
// Byt till kundens riktiga ikon genom att ersätta den här filen med app/apple-icon.png.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand.primary,
          color: "white",
          fontSize: 99,
          fontWeight: 700,
          borderRadius: 0,
        }}
      >
        {brand.name.charAt(0).toUpperCase()}
      </div>
    ),
    size,
  )
}
