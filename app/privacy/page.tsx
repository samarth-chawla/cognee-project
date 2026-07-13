import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Clutchly",
  description: "Clutchly's privacy policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-8 py-16 lg:py-24 w-full">
        <header className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-on-surface mb-4">Privacy Policy</h1>
          <p className="text-lg text-on-surface-variant">Last updated: July 2026</p>
        </header>

        <article className="space-y-8 prose prose-on-surface max-w-none">
          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">1. Introduction</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Welcome to Clutchly ("we," "our," "us"). We are committed to protecting your personal information and your right to privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI interview preparation platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-on-surface mt-6 mb-2">Personal Information</h3>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li>Account information: name, email address, profile picture (via Clerk authentication)</li>
              <li>Professional profile: resume, target role, target companies, GitHub/LinkedIn URLs</li>
              <li>Interview data: responses, evaluations, scores, feedback, and AI-generated insights</li>
            </ul>

            <h3 className="text-xl font-semibold text-on-surface mt-6 mb-2">Usage Data</h3>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li>Interview sessions, duration, question types, and performance metrics</li>
              <li>Feature usage, preferences, and settings</li>
              <li>Device information, IP address, browser type, operating system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li>Provide and personalize AI mock interview experiences</li>
              <li>Generate performance analytics, progress tracking, and memory insights</li>
              <li>Improve our AI models and interview question generation</li>
              <li>Send important account notifications and updates</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">4. Data Storage & Security</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Your data is stored securely using industry-standard encryption (AES-256 at rest, TLS 1.3 in transit).
              We use PostgreSQL with Prisma ORM and host on SOC 2 compliant infrastructure.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Interview responses and AI memory nodes are retained to provide longitudinal insights.
              You can request deletion of your data at any time through account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">5. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li><strong>Clerk:</strong> Authentication and user management</li>
              <li><strong>Google Gemini:</strong> AI interview generation and evaluation</li>
              <li><strong>Deepgram:</strong> Voice transcription and synthesis (optional)</li>
              <li><strong>Vercel:</strong> Hosting and analytics</li>
            </ul>
            <p className="text-on-surface-variant leading-relaxed mt-4">
              These processors only access data necessary to provide their specific services and are bound by data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">6. Your Rights</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Depending on your location, you may have rights including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li>Access, rectify, or delete your personal data</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent (where applicable)</li>
            </ul>
            <p className="text-on-surface-variant leading-relaxed mt-4">
              To exercise these rights, use the "Delete Account" option in Settings or contact us at privacy@clutchly.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">7. Data Retention</h2>
            <p className="text-on-surface-variant leading-relaxed">
              We retain your data while your account is active. Upon deletion request, we remove personal data within 30 days,
              though anonymized analytics may be retained for platform improvement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">8. International Transfers</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Your data may be processed in the United States and other countries where our service providers operate.
              We ensure appropriate safeguards (Standard Contractual Clauses) for cross-border transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">9. Children's Privacy</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Clutchly is not intended for users under 16. We do not knowingly collect data from children.
              If you believe we have collected such data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">10. Changes to This Policy</h2>
            <p className="text-on-surface-variant leading-relaxed">
              We may update this policy periodically. Material changes will be communicated via email or in-app notification.
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">11. Contact Us</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Questions about this policy? Contact us at <a href="mailto:privacy@clutchly.com" className="text-primary underline hover:text-primary/80">privacy@clutchly.com</a>
            </p>
          </section>
        </article>

        <div className="mt-16 pt-8 border-t border-outline-variant/20 text-center">
          <Link href="/" className="text-primary hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}