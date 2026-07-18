'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);

  const socialLinks = [
    { id: 1, icon: 'brand_awareness', href: '#' },
    { id: 2, icon: 'link', href: '#' },
    { id: 3, icon: 'terminal', href: '#' },
    { id: 4, icon: 'forum', href: '#' },
  ];

  return (
    <>
      {/* Top Divider Line */}
      <div className="w-full border-t border-outline-variant/30"></div>
      
      <footer className="w-full bg-surface py-xl">
        <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-gutter">
          {/* Main Content: Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-gutter mb-xl">
            {/* Left: Branding & Bio */}
            <div className="lg:col-span-5 flex flex-col gap-sm">
              <div className="flex items-center gap-xs">
                <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[20px]">auto_awesome</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">Clutchly</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm leading-relaxed">
                AI-powered interview preparation that learns from every conversation, helping you become more confident with every interview.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-sm mt-md">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    className="w-10 h-10 border border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all"
                    href={link.href}
                    onMouseEnter={() => setHoveredIcon(link.id)}
                    onMouseLeave={() => setHoveredIcon(null)}
                  >
                    <span 
                      className={`material-symbols-outlined text-[18px] transition-all duration-300 ${hoveredIcon === link.id ? 'icon-fill' : ''}`}
                    >
                      {link.icon}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Nav Columns */}
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-gutter lg:gap-md">
              {/* PRODUCT */}
              <div className="flex flex-col gap-md">
                <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Product</h4>
                <ul className="flex flex-col gap-sm">
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Features</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Pricing</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Dashboard</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Roadmap</Link></li>
                </ul>
              </div>
              {/* COMPANY */}
              <div className="flex flex-col gap-md">
                <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Company</h4>
                <ul className="flex flex-col gap-sm">
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">About</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Blog</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Contact</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Careers</Link></li>
                </ul>
              </div>
              {/* LEGAL */}
              <div className="flex flex-col gap-md">
                <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Legal</h4>
                <ul className="flex flex-col gap-sm">
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Privacy Policy</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Terms of Service</Link></li>
                  <li><Link className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Newsletter Row */}
          <div className="border-y border-outline-variant/30 py-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
            <div className="flex flex-col gap-xs">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Stay updated.</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Get product updates and interview tips directly in your inbox.</p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-xs">
              <input 
                className="w-full sm:w-72 px-md h-12 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md text-body-md" 
                placeholder="Enter your email" 
                type="email"
              />
              <button className="px-md h-12 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all">
                Subscribe
              </button>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-lg flex flex-col md:flex-row justify-between items-center gap-sm">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              © 2026 Clutchly. All rights reserved.
            </p>
            <div className="flex items-center gap-xs">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Built with <span className="text-error">❤️</span> for engineers preparing for their next opportunity.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
