import Link from "next/link";
import {
  APP_NAME,
  ROUTES,
  CONTACT_FORM_URL,
  FEEDBACK_FORM_URL,
  BUG_REPORT_FORM_URL,
} from "@/lib/utils/constants";

const FOOTER_BRAND = APP_NAME;
const FOOTER_TAGLINE =
  "Clutchly is your AI interview coach that remembers every interview, adapts to your progress, and helps you become interview-ready through personalized voice practice.";

type FooterLink = { label: string; href: string; external?: boolean };

const productLinks: FooterLink[] = [
  { label: "Dashboard", href: ROUTES.dashboard },
  { label: "New Interview", href: ROUTES.interview },
  { label: "Reports", href: ROUTES.reports },
  { label: "AI Memory", href: ROUTES.memory },
  { label: "Settings", href: ROUTES.settings },
];

// Temporary Typeform placeholders — swap the URLs in constants.ts later.
const supportLinks: FooterLink[] = [
  { label: "Contact", href: CONTACT_FORM_URL, external: true },
  { label: "Feedback", href: FEEDBACK_FORM_URL, external: true },
  { label: "Report a Bug", href: BUG_REPORT_FORM_URL, external: true },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-on-surface-variant hover:text-primary transition-colors font-medium";

  if (link.external) {
    return (
      <a
        href={link.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav
      className="space-y-4 text-center sm:text-left"
      aria-label={`${title} links`}
    >
      <h3 className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-widest text-center">
        {title}
      </h3>
      <ul className="flex flex-col align-middle items-center space-y-3" role="list">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer({
  variant = "default",
}: {
  variant?: "default" | "minimal";
}) {
  if (variant === "minimal") {
    return (
      <footer
        className="bg-surface border-t border-outline-variant/20"
        role="contentinfo"
      >
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-8 max-w-container-max mx-auto gap-6 text-center md:text-left">
          <p className="text-base font-semibold text-on-surface">{FOOTER_BRAND}</p>
          <nav
            className="flex flex-wrap justify-center gap-6 text-sm"
            aria-label="Footer navigation"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-on-surface-variant font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase">
            © 2026 {FOOTER_BRAND}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="bg-surface-container-lowest border-t border-outline-variant/20"
      role="contentinfo"
    >
      <div className="max-w-container-max mx-auto px-8 py-16 lg:py-20">
        {/* Link columns — 1 col (mobile) / 2 cols (tablet) / 3 cols (desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 mb-12 lg:mb-16">
          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Support" links={supportLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        {/* Divider */}
        <div
          className="border-t border-outline-variant/20 mb-10"
          aria-hidden="true"
        />

        {/* Bottom section — centered */}
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl mx-auto">
          <Link
            href="/"
            className="font-extrabold text-lg text-on-surface tracking-tight"
            aria-label={`${FOOTER_BRAND} home`}
          >
            {FOOTER_BRAND}
          </Link>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {FOOTER_TAGLINE}
          </p>
          <p className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mt-2">
            © 2026 {FOOTER_BRAND}. All rights reserved.
          </p>
          <p className="text-sm text-on-surface-variant">
            Built with <span aria-hidden="true">❤️</span>
            <span className="sr-only">love</span> by Samarth Chawla, Vishesh
            Tripathi &amp; Utsav Gupta
          </p>
        </div>
      </div>
    </footer>
  );
}
