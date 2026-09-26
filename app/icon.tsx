import { ImageResponse } from "next/og"

import { brand } from "@/app/brand"

// Ikonen på hemskärmen och i webbläsarfliken: kundens färg och namnets första bokstav.
// Byt till kundens riktiga ikon genom att ersätta den här filen med app/icon.png.
export const size = { width: 512, height: 512 }
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
          fontSize: 281,
          fontWeight: 700,
          borderRadius: 112,
        }}
      >
        {brand.name.charAt(0).toUpperCase()}
      </div>
    ),
    size,
  )
}
