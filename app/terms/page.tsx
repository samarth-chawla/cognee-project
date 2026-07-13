import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | Clutchly",
  description: "Clutchly's terms of service. Please read carefully before using our AI interview preparation platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-8 py-16 lg:py-24 w-full">
        <header className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-on-surface mb-4">Terms of Service</h1>
          <p className="text-lg text-on-surface-variant">Last updated: July 2026</p>
        </header>

        <article className="space-y-8 prose prose-on-surface max-w-none">
          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">1. Acceptance of Terms</h2>
            <p className="text-on-surface-variant leading-relaxed">
              By accessing or using Clutchly ("the Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">2. Description of Service</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Clutchly is an AI interview coach with persistent memory. Features include realistic
              voice interviews, performance analytics, personalized feedback, and coaching that
              adapts based on your interview history.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any feature at any time with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">3. Accounts & Eligibility</h2>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li>You must be at least 16 years old to use Clutchly.</li>
              <li>You are responsible for maintaining account security and all activity under your credentials.</li>
              <li>You must provide accurate, complete, and current registration information.</li>
              <li>Accounts are personal and non-transferable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">4. Subscriptions & Billing</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Certain features may require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed mb-4">
              <li>Pay all fees associated with your plan (prices subject to change with notice)</li>
              <li>Automatic renewal unless cancelled at least 24 hours before period ends</li>
              <li>No refunds for partial periods, except as required by law</li>
            </ul>
            <p className="text-on-surface-variant leading-relaxed">
              Manage or cancel subscriptions in Settings. We use Stripe for payment processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">5. User Content</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              You retain ownership of content you submit (resume, interview responses, profile data).
              By using Clutchly, you grant us a license to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed mb-4">
              <li>Process content to provide the Service (AI analysis, memory storage, feedback generation)</li>
              <li>Store and backup your data securely</li>
              <li>Use anonymized, aggregated data to improve our AI models</li>
            </ul>
            <p className="text-on-surface-variant leading-relaxed">
              We do not sell your personal data or interview content to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">6. Acceptable Use</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed mb-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer, decompile, or extract our AI models</li>
              <li>Share accounts or access credentials</li>
              <li>Interfere with service integrity (scraping, automation, excessive requests)</li>
              <li>Generate harmful, illegal, or discriminatory content</li>
              <li>Impersonate others or misrepresent your qualifications</li>
            </ul>
            <p className="text-on-surface-variant leading-relaxed">
              Violations may result in immediate account suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">7. Intellectual Property</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              The Service and its original content (excluding User Content), features, and functionality
              are owned by Clutchly and protected by international copyright, trademark, and patent laws.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Our name, logo, and brand assets may not be used without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">8. AI-Generated Content Disclaimer</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Interview questions, evaluations, feedback, and insights are generated by AI and may contain inaccuracies.
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed mb-4">
              <li>AI feedback is for practice purposes only — not professional career advice</li>
              <li>Scores and assessments are algorithmic estimates, not guarantees of real-world performance</li>
              <li>Always verify critical information independently</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              NON-INFRINGEMENT, AND ACCURACY OF AI-GENERATED CONTENT.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">10. Limitation of Liability</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, Clutchly SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OPPORTUNITIES,
              ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Our total liability shall not exceed the amount you paid in the 12 months preceding the claim,
              or $100 if no payment was made.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">11. Indemnification</h2>
            <p className="text-on-surface-variant leading-relaxed">
              You agree to indemnify and hold Clutchly harmless from any claims, damages, or expenses
              (including attorney fees) arising from your use of the Service, violation of these Terms,
              or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">12. Termination</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              We may suspend or terminate your access immediately for breach of these Terms.
              You may terminate your account at any time via Settings → Delete Account.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Upon termination, your license to use the Service ends. Sections 5, 7, 8, 9, 10, 11, 12, 13 survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">13. Governing Law & Disputes</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              These Terms are governed by the laws of Delaware, USA, without regard to conflict of laws.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Disputes will be resolved through binding arbitration (JAMS rules) on an individual basis.
              You waive the right to class actions or jury trials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">14. Changes to Terms</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              We may modify these Terms at any time. Material changes will be communicated via email or in-app notice
              at least 30 days before taking effect. Continued use constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-on-surface mb-3">15. Contact</h2>
            <p className="text-on-surface-variant leading-relaxed">
              Questions about these Terms? Contact us at <a href="mailto:legal@clutchly.com" className="text-primary underline hover:text-primary/80">legal@clutchly.com</a>
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