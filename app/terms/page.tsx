import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Aevia",
  description: "Aevia Terms of Service",
};

const EFFECTIVE_DATE = "October 1, 2026";
const CONTACT_EMAIL = "support@lycheecorp.com";
const SITE = "https://aevia.live";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-8 lg:py-24">
        <header className="mb-12">
          <Link
            href="/"
            className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            ← Back to Aevia
          </Link>

          <p className="mt-10 text-sm font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </header>

        <div className="space-y-10 text-[15px] leading-7 text-[var(--text-secondary)]">
          <Section title="1. Agreement to these Terms">
            <p>
              These Terms of Service (“Terms”) govern your access to and use of
              Aevia, including {SITE}, our dashboard, applications, and related
              services (collectively, the “Service”).
            </p>
            <p>
              These Terms form an agreement between you and the operator of
              Aevia (“Aevia,” “we,” “us,” or “our”). By creating an account or
              using the Service, you agree to these Terms and our Privacy Policy.
              If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You may use Aevia only if you are legally able to enter into a
              binding agreement where you live.
            </p>
            <p>
              If the law in your country requires parental or guardian consent
              for you to use an online service, you may use Aevia only with that
              required consent.
            </p>
          </Section>

          <Section title="3. Your account">
            <p>
              You are responsible for safeguarding your login credentials and
              for activity that occurs through your account. You agree to provide
              accurate account information and keep it reasonably current.
            </p>
            <p>
              If you believe your account has been compromised, contact{" "}
              <EmailLink />.
            </p>
          </Section>

          <Section title="4. What Aevia provides">
            <p>
              Aevia provides personal productivity and self-tracking tools, including habit tracking, task planning, a kanban board, streaks, freeze tokens, progress visualizations, and analytics.
            </p>
            <p>
              Aevia is not a medical, mental-health, financial, legal, or other professional advisory service. Information and insights shown by the Service are for general productivity and self-reflection purposes only.
            </p>
          </Section>

          <Section title="5. Your content and data">
            <p>
              You retain ownership of content and personal productivity data you submit to Aevia, including habits, tasks, board cards, check-ins, and appearance preferences (“User Content”).
            </p>
            <p>
              You grant us a limited, non-exclusive license to host, process, transmit, and display User Content only as needed to provide, secure, maintain, and improve the Service.
            </p>
            <p>
              You are responsible for ensuring that you have the right to submit information you provide to Aevia.
            </p>
          </Section>

          <Section title="6. Acceptable use">
            <p>You may not use the Service to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>violate applicable law or regulation;</li>
              <li>infringe another person’s rights;</li>
              <li>gain unauthorized access to the Service or another account;</li>
              <li>interfere with the Service, infrastructure, or security controls;</li>
              <li>introduce malware or harmful code;</li>
              <li>circumvent technical protections except where law expressly permits it;</li>
              <li>harass, exploit, deceive, or harm another person; or</li>
              <li>misrepresent your identity or affiliation.</li>
            </ul>
          </Section>

          <Section title="7. Streaks, statistics, and analytics">
            <p>
              Aevia may calculate streaks, consistency scores, completion rates,
              comparisons, and other analytics from your activity.
            </p>
            <p>
              We do not guarantee that every metric will always be error-free or
              suitable for a particular purpose. If you identify a calculation
              issue, you may contact us so we can investigate it.
            </p>
          </Section>

          <Section title="8. Freeze tokens and gamified features">
            <p>
              Aevia offers freeze tokens, which are earned through consistent weeks and can be used to protect a missed day from breaking a streak. Freeze tokens and other gamified features have no monetary value and are not transferable.
            </p>
            <p>
              Product rules may change as the Service evolves. We will not intentionally rewrite finalized historical activity except where needed to correct an error, prevent abuse, or comply with law.
            </p>
          </Section>

          <Section title="9. Paid features">
            <p>
              Aevia is a paid subscription. The current price is US $2 per month, billed monthly through Stripe, and the subscription renews automatically each month until you cancel. The price and billing terms shown at checkout form part of these Terms.
            </p>
            <p>
              The price you pay when you subscribe is locked in for as long as your subscription stays active, and we will not raise it. We may charge a different price to new customers at any time. If you cancel and later subscribe again, the price shown at that time applies. There is no free trial.
            </p>
            <p>
              You can cancel at any time from Settings, under Billing, which opens Stripe’s billing page. Cancelling stops future charges. You can also update your card and view invoices there.
            </p>
            <p>
              Because the subscription is low-priced, payments are non-refundable, including for a partial month or for time left after you cancel, except where the law of your country requires otherwise.
            </p>
          </Section>

          <Section title="10. Service availability and changes">
            <p>
              We may add, modify, suspend, or discontinue features from time to
              time. We aim to keep Aevia reliable, but we do not guarantee that
              the Service will always be uninterrupted, secure, or error-free.
            </p>
            <p>
              Where practical, we will provide reasonable notice before
              materially discontinuing the Service or a core feature.
            </p>
          </Section>

          <Section title="11. Third-party services">
            <p>
              Aevia may rely on third-party infrastructure and service providers
              to operate. Those providers may have their own terms and privacy
              policies.
            </p>
            <p>
              We are not responsible for third-party products or services that
              we do not control.
            </p>
          </Section>

          <Section title="12. Suspension and termination">
            <p>
              You may stop using Aevia at any time and may delete your account yourself from Settings.
            </p>
            <p>
              We may suspend or terminate access if we reasonably believe you materially violated these Terms, created a security risk, abused the Service, or used it unlawfully.
            </p>
          </Section>

          <Section title="13. Account deletion and retention">
            <p>
              When you confirm account deletion, active sessions are revoked and user-owned application data is deleted from our live production systems according to our Privacy Policy. Your paid subscription is cancelled immediately, so you will not be billed again.
            </p>
            <p>
              Limited operational logs and encrypted infrastructure backups may retain deleted information for up to 30 days before automatic expiration through normal retention and backup rotation.
            </p>
            <p>
              Deleted accounts are not restored from backups for account-recovery purposes.
            </p>
          </Section>

          <Section title="14. Aevia intellectual property">
            <p>
              The Service, including its software, branding, interface,
              graphics, and other materials that are not User Content, is
              protected by applicable intellectual-property laws.
            </p>
            <p>
              These Terms do not transfer ownership of Aevia or grant permission
              to use Aevia trademarks except as separately authorized.
            </p>
          </Section>

          <Section title="15. Feedback">
            <p>
              If you voluntarily send us suggestions, ideas, or feedback, you
              allow us to use that feedback without restriction or compensation.
              This does not transfer ownership of your User Content.
            </p>
          </Section>

          <Section title="16. Disclaimer of warranties">
            <p>
              To the maximum extent permitted by law, the Service is provided
              “as is” and “as available.” We disclaim warranties that are not
              expressly stated in these Terms, including implied warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
            <p>
              Some jurisdictions do not allow certain warranty exclusions, so
              some of these exclusions may not apply to you.
            </p>
          </Section>

          <Section title="17. Limitation of liability">
            <p>
              To the maximum extent permitted by law, Aevia and its operator,
              affiliates, contractors, and service providers will not be liable
              for indirect, incidental, special, consequential, exemplary, or
              punitive damages, or for loss of data, profits, goodwill, or
              business opportunity arising from your use of the Service.
            </p>
            <p>
              Where liability cannot legally be excluded, our aggregate
              liability arising out of or relating to the Service will not
              exceed the greater of the amount you paid for the Service during
              the 12 months before the event giving rise to the claim or US
              $100, unless applicable law requires otherwise.
            </p>
          </Section>

          <Section title="18. Indemnification">
            <p>
              To the extent permitted by law, you agree to indemnify and hold
              harmless Aevia and its operator from claims arising from your
              unlawful use of the Service, violation of these Terms, or
              infringement of another person’s rights.
            </p>
          </Section>

          <Section title="19. United States operation and international users">
            <p>
              Aevia is operated from the United States and may be made available
              to users in other countries.
            </p>
            <p>
              These Terms are governed by applicable United States law and the
              applicable law of the U.S. state from which the operator conducts
              the Service, without regard to conflict-of-laws rules.
            </p>
            <p>
              If you live outside the United States, mandatory consumer
              protections and other rights in your country may still apply and
              are not waived by these Terms where they cannot legally be waived.
            </p>
          </Section>

          <Section title="20. Changes to these Terms">
            <p>
              We may update these Terms as Aevia changes. If an update is
              material, we will provide reasonable notice through the Service,
              by email, or by another appropriate method.
            </p>
            <p>
              Where required, we may ask you to accept a new version before
              continuing to use the Service. Aevia may keep records of the Terms
              version and acceptance timestamp.
            </p>
          </Section>

          <Section title="21. Contact">
            <p>
              Questions about these Terms may be sent to <EmailLink />.
            </p>
          </Section>
        </div>

        <Footer />
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EmailLink() {
  return (
    <a
      className="text-[var(--accent)] hover:underline"
      href={`mailto:${CONTACT_EMAIL}`}
    >
      {CONTACT_EMAIL}
    </a>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] pt-8 text-sm text-[var(--text-muted)]">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/terms" className="hover:text-[var(--text-primary)]">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-[var(--text-primary)]">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
