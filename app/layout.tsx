import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elevation Editor - Edit & Analyze GPX Elevation Profiles Online",
  description: "Free online GPX editor for analyzing and editing elevation profiles. Detect anomalies, smooth elevation data, and export modified GPS tracks. Interactive elevation charts and route visualization.",
  keywords: ["GPX editor", "elevation profile", "GPS track editor", "GPX analyzer", "elevation smoothing", "GPX anomaly detection", "route elevation", "GPX file editor"],
  authors: [{ name: "Elevation Editor" }],
  openGraph: {
    title: "Elevation Editor - Edit & Analyze GPX Elevation Profiles",
    description: "Free online tool for editing GPX elevation profiles. Detect anomalies, smooth data, and visualize your GPS tracks.",
    url: "https://elevationeditor.com",
    siteName: "Elevation Editor",
    images: [
      {
        url: "https://elevationeditor.com/social.png",
        width: 1200,
        height: 630,
        alt: "Elevation Editor - GPX Elevation Profile Editor",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elevation Editor - Edit & Analyze GPX Elevation Profiles",
    description: "Free online tool for editing GPX elevation profiles. Detect anomalies, smooth data, and visualize your GPS tracks.",
    images: ["https://elevationeditor.com/social.png"],
  },
  icons: {
    icon: "./favicon.ico",
    shortcut: "./favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <body className={inter.className}>{children}</body>
    </html>
  );
}