import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finans Pusula",
    short_name: "Finans Pusula",
    description:
      "Kredi, birikim, yatırım ve enflasyon etkisini sade ekranlarla hesapla.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#0F172A",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
