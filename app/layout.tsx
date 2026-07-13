import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { UserSync } from "@/components/auth/UserSync";
import { Toaster } from "react-hot-toast";

import "@fontsource-variable/material-symbols-outlined";
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
  title: "Clutchly | The AI Coach That Never Forgets",
  description:
    "Practice realistic voice interviews with an AI coach that remembers every conversation, adapts to your progress, and helps you land your dream job.",
  openGraph: {
    title: "Clutchly | The AI Coach That Never Forgets",
    description:
      "Practice realistic voice interviews with an AI coach that remembers every conversation, adapts to your progress, and helps you land your dream job.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clutchly | The AI Coach That Never Forgets",
    description:
      "Practice realistic voice interviews with an AI coach that remembers every conversation, adapts to your progress, and helps you land your dream job.",
  },
  metadataBase: new URL("https://interview-memory-agent.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClerkProvider>
          <UserSync />
          <Toaster position="bottom-right" />
          {children}
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}
