import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trivia Tours",
    template: "%s · Trivia Tours",
  },
  description:
    "Internal sales enablement platform for Trivia Egypt — search, quote, book tours and hotels with confidence.",
  applicationName: "Trivia Tours",
  authors: [{ name: "Trivia Egypt" }],
  generator: "Next.js",
  keywords: ["travel", "tours", "hotels", "booking", "trivia", "egypt"],
  referrer: "origin-when-cross-origin",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Trivia Tours",
    description: "Internal sales enablement platform for Trivia Egypt",
    url: "https://trivia-tours.vercel.app",
    siteName: "Trivia Tours",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Trivia Tours",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Trivia Tours",
    description: "Internal sales enablement platform for Trivia Egypt",
    images: ["/web-app-manifest-512x512.png"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#04040c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="font-sans antialiased bg-slate-50 text-slate-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
