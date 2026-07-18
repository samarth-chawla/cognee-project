'use client';

import React from 'react';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ROUTES } from "@/lib/utils/constants";

interface NavbarProps {
  clerkId: string | null;
  setupDone: boolean;
}

export default function Navbar({ clerkId, setupDone }: NavbarProps) {
  return (
    <nav className="fixed top-0 mt-6 z-50 w-[88%] max-w-7xl h-[86px] flex items-center justify-between px-10 bg-white/80 backdrop-blur-md rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-outline-variant/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-on-surface rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-2xl">C</span>
        </div>
        <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">Clutchly</span>
      </div>
      
      <div className="hidden md:flex items-center gap-12">
        <Link 
          href="#features" 
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          Features
        </Link>
        <Link 
          href="#how-it-works" 
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          How it works
        </Link>
        <Link 
          href="#pricing" 
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          Pricing
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {!clerkId ? (
          <>
            <SignInButton mode="modal">
              <button className="font-label-md text-label-md px-6 py-2 text-on-surface hover:text-primary transition-colors cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="font-label-md text-label-md bg-primary text-white px-6 py-3 rounded-full hover:bg-[#4338CA] transition-colors cursor-pointer shadow-sm">
                Get Started
              </button>
            </SignUpButton>
          </>
        ) : (
          <>
            <Link 
              href={setupDone ? ROUTES.interview : ROUTES.onboarding}
              className="font-label-md text-label-md bg-primary text-white px-6 py-3 rounded-full hover:bg-[#4338CA] transition-colors cursor-pointer shadow-sm"
            >
              Dashboard
            </Link>
            <UserButton />
          </>
        )}
      </div>
    </nav>
  );
}
