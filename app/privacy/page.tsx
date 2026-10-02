import Link from "next/link";

import { LEGAL_EFFECTIVE_DATE as EFFECTIVE_DATE } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy | Aevia",
  description: "Aevia Privacy Policy",
};

const CONTACT_EMAIL = "support@lycheecorp.com";
const SITE = "https://aevia.live";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </header>

        <div className="space-y-10 text-[15px] leading-7 text-[var(--text-secondary)]">
          <Section title="1. Overview">
            <p>
              This Privacy Policy explains how Aevia (“Aevia,” “we,” “us,” or
              “our”) collects, uses, stores, and shares personal information
              when you use {SITE}, our dashboard, applications, and related
              services (collectively, the “Service”).
            </p>
            <p>
              Aevia is operated from the United States and is intended to be
              available to users in multiple countries.
            </p>
          </Section>

          <Section title="2. Information you provide">
            <p>
              Depending on how you use Aevia, you may provide:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Account information:</strong> name, email address, authentication credentials, and account settings.</li>
              <li><strong>Habit data:</strong> habit names, schedules, times of day, check-ins, completion history, streaks, and freeze activity.</li>
              <li><strong>Task data:</strong> task names, dates, and completion status.</li>
              <li><strong>Board data:</strong> kanban card titles, notes, and the column each card is in.</li>
              <li><strong>Preferences:</strong> your chosen accent, background, and text colors.</li>
              <li><strong>Billing information:</strong> payments are handled by Stripe. We receive your subscription status, billing period dates, and a Stripe customer identifier. We do not receive or store your full card number.</li>
              <li><strong>Support communications:</strong> information you send when requesting support or providing feedback.</li>
            </ul>
          </Section>

          <Section title="3. Information collected automatically">
            <p>
              When you use Aevia, we may automatically collect limited
              technical information needed to operate, diagnose, and secure the
              Service, such as:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>IP address;</li>
              <li>browser and device type;</li>
              <li>operating system;</li>
              <li>login and session events;</li>
              <li>request timestamps;</li>
              <li>error and diagnostic information;</li>
              <li>security and abuse-prevention signals; and</li>
              <li>basic product usage events where enabled.</li>
            </ul>
          </Section>

          <Section title="4. Authentication">
            <p>
              Aevia uses Better Auth as part of its authentication system.
              Authentication records and sessions are stored within Aevia’s
              configured application infrastructure and database.
            </p>
            <p>
              If third-party sign-in methods are added later, those providers
              may process information according to their own privacy policies.
            </p>
          </Section>

          <Section title="5. How we use information">
            <p>
              We use personal information to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>create, authenticate, and maintain your account;</li>
              <li>provide habit, task, board, streak, and analytics features;</li>
              <li>calculate consistency, completion rates, trends, and personal insights;</li>
              <li>save your settings and personalization choices;</li>
              <li>process payments and manage your subscription;</li>
              <li>protect accounts and prevent abuse;</li>
              <li>operate, maintain, debug, and secure the Service;</li>
              <li>respond to support requests;</li>
              <li>comply with applicable legal obligations; and</li>
              <li>improve reliability, usability, and performance.</li>
            </ul>
          </Section>

          <Section title="6. Personal analytics">
            <p>
              Aevia generates personal analytics from your own productivity records, such as habit check-ins and task completion.
            </p>
            <p>
              These analytics are intended for productivity and self-reflection and are not medical diagnoses or professional assessments.
            </p>
          </Section>

          <Section title="7. Cookies and browser storage">
            <p>
              Aevia may use cookies and similar browser storage for
              authentication, session management, security, preferences, and
              core product functionality.
            </p>
            <p>
              If we introduce non-essential analytics, advertising, or other
              optional cookies in jurisdictions where consent is required, we
              will provide appropriate notices and controls.
            </p>
          </Section>

          <Section title="8. Service providers">
            <p>
              We use third-party service providers to operate Aevia. Our current infrastructure includes:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Neon:</strong> managed PostgreSQL database infrastructure.</li>
              <li><strong>Vercel:</strong> application hosting, delivery, and infrastructure services.</li>
              <li><strong>Better Auth:</strong> authentication framework used within Aevia’s application stack.</li>
              <li><strong>Stripe:</strong> payment processing and subscription billing. Stripe collects and processes your payment details under its own privacy policy.</li>
              <li><strong>Resend:</strong> sends account emails, such as password-reset links, on our behalf.</li>
            </ul>
          </Section>

          <Section title="9. When we share information">
            <p>
              We may share personal information:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>with service providers that process information on our behalf;</li>
              <li>when you direct us to share information;</li>
              <li>to comply with applicable law, legal process, or valid government requests;</li>
              <li>to protect the safety, rights, and security of users, Aevia, or others; and</li>
              <li>in connection with a merger, financing, acquisition, reorganization, or transfer of assets, subject to applicable law.</li>
            </ul>
            <p>
              We do not sell your personal productivity data. We do not use your habit, task, or board data for third-party advertising.
            </p>
          </Section>

          <Section title="10. Data retention">
            <p>
              We retain your account and productivity data while your account is
              active and as needed to provide the Service.
            </p>
            <p>
              When you delete your account, active sessions are revoked and
              user-owned application data is deleted from live production
              systems.
            </p>
            <p>
              Limited operational logs may be retained for up to 30 days when
              required for security, abuse prevention, or infrastructure
              debugging. They are not used for product analytics after account
              deletion.
            </p>
            <p>
              Deleted account data may remain in encrypted infrastructure
              backups for up to 30 days before expiring through normal backup
              rotation. Deleted accounts are not restored from backups for
              account-recovery purposes.
            </p>
          </Section>

          <Section title="11. Account deletion">
            <p>
              When you confirm account deletion with your password, Aevia deletes user-owned application records from live systems, including appearance settings, habits, check-ins, freeze records, tasks, board cards, consent records, and subscription records.
            </p>
            <p>
              Your paid subscription is cancelled immediately, so you will not be billed again. Stripe may keep payment and invoice records as required by law and under its own privacy policy.
            </p>
            <p>
              Associated authentication records are also removed through Aevia’s supported authentication-deletion process.
            </p>
          </Section>

          <Section title="12. Data exports">
            <p>
              You can download a copy of your information as a JSON file from Settings. The file is created when you request it, is available only to you while you are signed in, and is not stored by Aevia afterwards.
            </p>
          </Section>

          <Section title="13. Consent records">
            <p>
              When you create an account you must agree to the Terms of Service and Privacy Policy. Aevia then stores which version of each document you agreed to, and the exact time.
            </p>
            <p>
              These records are included in your data export and are deleted when you delete your account.
            </p>
          </Section>

          <Section title="14. Your privacy rights">
            <p>
              Privacy rights vary by location. Depending on where you live, you
              may have rights to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>request access to personal information we hold about you;</li>
              <li>correct inaccurate information;</li>
              <li>request deletion of certain information;</li>
              <li>receive a portable copy of certain information;</li>
              <li>object to or restrict certain processing;</li>
              <li>withdraw consent where processing relies on consent; and</li>
              <li>complain to an applicable privacy or data-protection authority.</li>
            </ul>
            <p>
              These rights may be subject to legal exceptions. To submit a
              request, contact <EmailLink />.
            </p>
          </Section>

          <Section title="15. United States privacy rights">
            <p>
              Residents of certain U.S. states may have additional rights under
              applicable state privacy laws, including rights to access,
              correct, delete, or obtain a copy of certain personal information
              and to receive information about certain disclosures.
            </p>
            <p>
              Aevia does not sell personal productivity data or use it for
              cross-context behavioral advertising.
            </p>
          </Section>

          <Section title="16. International users and data transfers">
            <p>
              Aevia is operated from the United States. If you use Aevia from
              another country, your information may be transferred to,
              processed in, or stored in the United States or other countries
              where our service providers operate.
            </p>
            <p>
              Those countries may have data-protection laws that differ from
              the laws where you live. Where required by applicable law, we use
              appropriate safeguards for international transfers.
            </p>
          </Section>

          <Section title="17. European Economic Area, United Kingdom, and similar jurisdictions">
            <p>
              Where laws such as the GDPR or UK GDPR apply, our legal bases for
              processing may include performance of our contract with you,
              compliance with legal obligations, our legitimate interests in
              operating and securing the Service, and consent where required.
            </p>
            <p>
              You may also have rights to object to certain processing, request
              restriction, withdraw consent, and lodge a complaint with your
              local data-protection authority.
            </p>
          </Section>

          <Section title="18. Security">
            <p>
              We use reasonable technical and organizational safeguards
              designed to protect personal information, including authenticated
              sessions, access controls, database permissions, and encrypted
              transport.
            </p>
            <p>
              No system can guarantee absolute security. You should use a strong
              password and protect access to your account and devices.
            </p>
          </Section>

          <Section title="19. Children’s privacy">
            <p>
              Aevia is not intended to knowingly collect personal information
              from children below the minimum age at which they may legally use
              an online service without parental consent in their jurisdiction.
            </p>
            <p>
              If you believe a child has provided personal information without
              required authorization, contact <EmailLink />.
            </p>
          </Section>

          <Section title="20. Changes to this Privacy Policy">
            <p>
              We may update this Privacy Policy as our practices, features,
              vendors, or legal obligations change.
            </p>
            <p>
              If a change is material, we will provide reasonable notice. Where
              required, we may ask you to accept or acknowledge a new version
              before continuing to use the Service.
            </p>
          </Section>

          <Section title="21. Contact">
            <p>
              For privacy questions or requests, contact <EmailLink />.
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
