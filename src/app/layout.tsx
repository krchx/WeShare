import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeShare | Real-time File & Text Sharing Platform",
  description:
    "Instantly share files and collaborate on text in real-time using peer-to-peer technology. No sign-up required, just create a room and share the link.",
  keywords: [
    "file sharing",
    "text collaboration",
    "peer-to-peer",
    "WebRTC",
    "real-time sharing",
    "secure sharing",
    "no sign-up",
    "instant collaboration",
  ],
  authors: [{ name: "WeShare Team" }],
  category: "Productivity",
  applicationName: "WeShare",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://weshare.vercel.app/",
    title: "WeShare | Secure Peer-to-Peer File & Text Sharing",
    description:
      "Share files and collaborate on text instantly without uploading to servers. Private, secure, and no sign-up required.",
    siteName: "WeShare",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WeShare Preview",
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
  creator: "WeShare Team",
  publisher: "WeShare",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
