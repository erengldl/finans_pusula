import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { getSiteUrlObject } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  applicationName: "Finans Pusula",
  title: {
    default: "Finans Pusula",
    template: "%s | Finans Pusula",
  },
  description:
    "Kredi, birikim, yatırım ve enflasyon etkisini sade ekranlarla hesapla; sonuçları karşılaştır, planını netleştir.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Finans Pusula",
    title: "Finans Pusula",
    description:
      "Kredi, birikim, yatırım ve enflasyon etkisini sade ekranlarla hesapla.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finans Pusula",
    description:
      "Kredi, birikim, yatırım ve enflasyon etkisini sade ekranlarla hesapla.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${manrope.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
