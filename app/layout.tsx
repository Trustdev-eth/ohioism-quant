import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/theme-provider";
import { siteSeo, structuredData } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteSeo.url),
  title: siteSeo.title,
  description: siteSeo.description,
  applicationName: siteSeo.name,
  authors: [{ name: "OhioismQuant", url: "https://x.com/0xohioism" }],
  creator: "OhioismQuant",
  publisher: siteSeo.name,
  alternates: { canonical: siteSeo.url },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteSeo.title,
    description: siteSeo.description,
    url: siteSeo.url,
    siteName: siteSeo.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteSeo.title,
    description: siteSeo.description,
    creator: "@0xohioism",
  },
  icons: {
    icon: [{ url: "/ohioismquant-logo.png", type: "image/png", sizes: "400x400" }],
    shortcut: "/favicon.png",
    apple: [{ url: "/ohioismquant-logo.png", sizes: "400x400", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
