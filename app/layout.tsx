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
  title: "ARIA | AI Interview Agent",
  description: "AI mock interviews with long-term memory. ARIA tracks your performance and tailors questions to help you land your dream job.",
  openGraph: {
    title: "ARIA | AI Interview Agent",
    description: "AI mock interviews with long-term memory. ARIA tracks your performance and tailors questions to help you land your dream job.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ARIA | AI Interview Agent",
    description: "AI mock interviews with long-term memory. ARIA tracks your performance and tailors questions to help you land your dream job.",
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
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <UserSync />
          {children}
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}
