import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ErrorProvider } from "@/context/ErrorContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { siteConfig } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `${siteConfig.name} | Real-time File & Code Sharing Platform`,
  description: siteConfig.description,
  keywords: [
    "file sharing",
    "code collaboration",
    "peer-to-peer",
    "WebRTC",
    "real-time sharing",
    "secure sharing",
    "no sign-up",
    "instant collaboration",
  ],
  authors: [{ name: siteConfig.teamName }],
  category: "Productivity",
  applicationName: siteConfig.name,
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} | Secure Peer-to-Peer File & Code Sharing`,
    description:
      "Share files and collaborate on code instantly without uploading to servers. Private, secure, and no sign-up required.",
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Preview`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  creator: siteConfig.teamName,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </ErrorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
