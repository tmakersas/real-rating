import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

import { SITE } from "@/lib/base";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Real Rating: 4.7 stars is average",
  description:
    "Almost every app has 4.7 stars, so the stars mean nothing. Real Rating re-scores 4,883 top iPhone apps against their own category. Type any app and watch it deflate.",
  openGraph: {
    title: "4.7 stars is average.",
    description: "I re-scored 4,883 top iPhone apps against their own category. Type yours.",
    images: [{ url: `${SITE}/api/og`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@tibo_maker",
    title: "4.7 stars is average.",
    description: "I re-scored 4,883 top iPhone apps against their own category. Type yours.",
    images: [`${SITE}/api/og`],
  },
};

export const viewport: Viewport = { themeColor: "#09090b", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} antialiased`}>
      <body className="min-h-full bg-[#09090b]">{children}</body>
    </html>
  );
}
