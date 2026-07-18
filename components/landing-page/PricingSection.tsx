'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SignUpButton } from "@clerk/nextjs";
import { ROUTES } from "@/lib/utils/constants";

interface PricingSectionProps {
  clerkId: string | null;
  setupDone: boolean;
}

export default function PricingSection({ clerkId, setupDone }: PricingSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleToggle = (index: number, open: boolean) => {
    if (open) {
      setOpenFaq(index);
    } else if (openFaq === index) {
      setOpenFaq(null);
    }
  };

  return (
    <section id="pricing" className="relative py-xl overflow-hidden bg-surface text-on-surface">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-5%] right-[5%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 dotted-pattern"></div>
      </div>
      
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
        {/* Header Section */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
            <span className="font-label-md text-primary tracking-wide">Simple Pricing</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg max-w-2xl mx-auto mb-md tracking-tight">
            Practice smarter. Pay only when you're ready.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Start for free to explore the basics. Upgrade to Pro for unlimited AI-powered interview prep that learns from you.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md items-end mb-xl">
          {/* Plan 1: Free */}
          <div className="bg-surface-container-lowest p-xl rounded-2xl border border-outline-variant/30 premium-shadow h-fit transition-transform hover:scale-[1.02] duration-300">
            <div className="mb-lg">
              <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Free</span>
              <div className="flex items-baseline gap-xs mt-xs">
                <span className="font-headline-md text-headline-md">₹0</span>
                <span className="font-body-md text-body-md text-on-surface-variant">/month</span>
              </div>
            </div>
            
            <ul className="space-y-sm mb-lg">
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                3 AI Interviews
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Voice Interviews
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Resume Upload
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Job Description Upload
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Basic Performance Report
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Community Support
              </li>
            </ul>
            
            {!clerkId ? (
              <SignUpButton mode="modal">
                <button className="w-full py-4 rounded-xl border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer">
                  Start Free
                </button>
              </SignUpButton>
            ) : (
              <Link href={setupDone ? ROUTES.interview : ROUTES.onboarding}>
                <button className="w-full py-4 rounded-xl border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer">
                  Start Free
                </button>
              </Link>
            )}
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className="relative bg-surface-container-lowest p-xl rounded-2xl border-2 border-primary pro-glow h-fit scale-105 z-20 transition-transform hover:scale-[1.07] duration-300">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-primary rounded-full font-label-sm text-label-sm whitespace-nowrap">
              Most Popular
            </div>
            
            <div className="mb-lg">
              <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Pro</span>
              <div className="flex items-baseline gap-xs mt-xs">
                <span className="font-headline-md text-headline-md">₹999</span>
                <span className="font-body-md text-body-md text-on-surface-variant">/month</span>
              </div>
            </div>
            
            <ul className="space-y-sm mb-lg">
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Unlimited AI Interviews
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Long-Term AI Memory
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Adaptive Questions
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Advanced Reports
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                AI Coaching
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Progress Timeline
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Readiness Score
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Company-Specific Interviews
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined icon-fill text-primary text-[20px]">check_circle</span>
                Priority Support
              </li>
            </ul>
            
            {!clerkId ? (
              <SignUpButton mode="modal">
                <button className="w-full py-5 rounded-xl bg-gradient-to-br from-primary to-secondary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-xs cursor-pointer">
                  Start 7-Day Free Trial
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </SignUpButton>
            ) : (
              <Link href={setupDone ? ROUTES.interview : ROUTES.onboarding}>
                <button className="w-full py-5 rounded-xl bg-gradient-to-br from-primary to-secondary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-xs cursor-pointer">
                  Start 7-Day Free Trial
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </Link>
            )}
          </div>

          {/* Plan 3: Teams */}
          <div className="bg-surface-container-lowest p-xl rounded-2xl border border-outline-variant/30 premium-shadow h-fit transition-transform hover:scale-[1.02] duration-300">
            <div className="mb-lg">
              <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Teams</span>
              <div className="flex items-baseline gap-xs mt-xs">
                <span className="font-headline-md text-headline-md">Custom</span>
              </div>
            </div>
            
            <ul className="space-y-sm mb-lg">
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Everything in Pro
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Team Dashboard
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Student Analytics
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Bulk Licenses
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Admin Controls
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Shared Reports
              </li>
              <li className="flex items-start gap-sm font-body-md text-body-md">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                Dedicated Support
              </li>
            </ul>
            
            <button className="w-full py-4 rounded-xl bg-inverse-surface text-inverse-on-surface font-label-md text-label-md hover:opacity-90 transition-opacity">
              Contact Sales
            </button>
          </div>
        </div>

        {/* Feature Comparison Table (Mobile hidden) */}
        <div className="hidden md:block mb-xl overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest premium-shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="p-md font-label-md text-label-md">Features</th>
                <th className="p-md font-label-md text-label-md">Free</th>
                <th className="p-md font-label-md text-label-md text-primary">Pro</th>
                <th className="p-md font-label-md text-label-md">Teams</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-md text-body-md">
              <tr>
                <td className="p-md text-on-surface-variant">Interview Limit</td>
                <td className="p-md">3/month</td>
                <td className="p-md text-primary font-semibold">Unlimited</td>
                <td className="p-md">Unlimited</td>
              </tr>
              <tr>
                <td className="p-md text-on-surface-variant">AI Intelligence</td>
                <td className="p-md">Standard</td>
                <td className="p-md text-primary font-semibold">Adaptive + Memory</td>
                <td className="p-md">Adaptive + Memory</td>
              </tr>
              <tr>
                <td className="p-md text-on-surface-variant">Collaboration</td>
                <td className="p-md">—</td>
                <td className="p-md text-primary font-semibold">—</td>
                <td className="p-md">Team Dashboard</td>
              </tr>
              <tr>
                <td className="p-md text-on-surface-variant">Support</td>
                <td className="p-md">Community</td>
                <td className="p-md text-primary font-semibold">Priority</td>
                <td className="p-md">Dedicated Manager</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Trust Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          <div className="flex items-center gap-sm p-sm rounded-xl bg-surface-container border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary">lock</span>
            <span className="font-label-md text-label-md">Secure payments</span>
          </div>
          <div className="flex items-center gap-sm p-sm rounded-xl bg-surface-container border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary">event_busy</span>
            <span className="font-label-md text-label-md">Cancel anytime</span>
          </div>
          <div className="flex items-center gap-sm p-sm rounded-xl bg-surface-container border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary">verified</span>
            <span className="font-label-md text-label-md">No hidden charges</span>
          </div>
        </div>

        {/* FAQ Card */}
        <div className="max-w-3xl mx-auto mb-xl">
          <div className="bg-white p-lg rounded-2xl border border-outline-variant/30 premium-shadow">
            <h3 className="font-headline-sm text-headline-sm mb-md">Frequently Asked Questions</h3>
            <div className="space-y-md">
              <details 
                className="group cursor-pointer" 
                open={openFaq === 0}
                onToggle={(e) => handleToggle(0, e.currentTarget.open)}
              >
                <summary className="flex justify-between items-center font-label-md text-label-md list-none py-2">
                  Can I cancel anytime?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <p className="font-body-md text-body-md text-on-surface-variant pt-2">
                  Yes, you can cancel your subscription at any time through your account settings. You will continue to have access to your plan's features until the end of your current billing period.
                </p>
              </details>
              
              <div className="h-[1px] bg-outline-variant/20"></div>
              
              <details 
                className="group cursor-pointer" 
                open={openFaq === 1}
                onToggle={(e) => handleToggle(1, e.currentTarget.open)}
              >
                <summary className="flex justify-between items-center font-label-md text-label-md list-none py-2">
                  Do I lose my interview history?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <p className="font-body-md text-body-md text-on-surface-variant pt-2">
                  No, we store your history securely. If you downgrade to the Free plan, your historical data remains safe, though you may only access the most recent reports based on the free plan limits.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="relative overflow-hidden p-lg md:p-xl rounded-2xl bg-inverse-surface text-inverse-on-surface border border-outline-variant/10 text-center premium-shadow">
          {/* Abstract Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-[100px] pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="font-headline-md text-headline-md mb-md max-w-2xl mx-auto">
              Invest in the interview that changes your career.
            </h2>
            <div className="flex flex-col md:flex-row gap-md justify-center items-center">
              <button className="px-xl py-4 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-all flex items-center gap-xs">
                Start Free Today
                <span className="material-symbols-outlined">rocket_launch</span>
              </button>
              <button className="px-xl py-4 rounded-xl border border-outline-variant text-inverse-on-surface font-label-md text-label-md hover:bg-white/5 transition-all">
                Compare Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
